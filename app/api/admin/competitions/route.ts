import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth, isSuperAdmin } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongodb';
import CompetitionModel, { CompetitionStatus, CompetitionCategory, RegistrationType, DifficultyLevel } from '@/models/Competition';
import mongoose from 'mongoose';
import QuestionModel from '@/models/Question';
import { randomBytes } from 'crypto';

// ─── Validation Schema ──────────────────────────────────────────────────────

const sectionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(''),
  order: z.number(),
  questions: z.array(z.string().regex(/^[a-f\d]{24}$/i, 'Invalid question ID')).min(1, 'Select at least one question'),
  settings: z.object({
    duration: z.coerce.number().min(1),
    totalMarks: z.coerce.number().min(1),
    passingMarks: z.coerce.number().min(0),
    negativeMarking: z.boolean().default(false),
    negativeMarkValue: z.coerce.number().default(0),
    shuffleQuestions: z.boolean().default(true),
    shuffleOptions: z.boolean().default(true),
    calculatorAllowed: z.boolean().default(false),
    skipAllowed: z.boolean().default(true),
    reviewAllowed: z.boolean().default(true),
  }),
});

const roundSchema = z.object({
  name: z.string().min(1),
  roundNumber: z.coerce.number().int().min(1),
  type: z.enum(['qualifier', 'quarter_final', 'semi_final', 'final', 'custom']),
  sections: z.array(sectionSchema).min(1, 'Each round needs at least one section'),
  qualificationCriteria: z.object({
    topN: z.union([z.literal(''), z.coerce.number().int().min(1)]).optional(),
    minimumScore: z.union([z.literal(''), z.coerce.number().min(0)]).optional(),
    minimumPercentage: z.union([z.literal(''), z.coerce.number().min(0).max(100)]).optional(),
  }).default({}),
  schedule: z.object({ startDate: z.string().min(1), endDate: z.string().min(1) }),
});

const competitionSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  category: z.nativeEnum(CompetitionCategory),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  organizer: z.string().min(2),
  contact: z.string().min(5),
  language: z.string().default('English'),
  difficultyLevel: z.nativeEnum(DifficultyLevel),

  eligibilityType: z.enum(['public', 'selected_grades', 'selected_schools', 'invite_only']),
  grades: z.array(z.string()).default([]),
  minAge: z.union([z.literal(''), z.coerce.number().min(1)]).optional(),
  maxAge: z.union([z.literal(''), z.coerce.number().min(1)]).optional(),
  maxParticipants: z.coerce.number().min(1),

  registrationStartDate: z.string().min(1),
  registrationEndDate: z.string().min(1),
  competitionStartDate: z.string().min(1),
  competitionEndDate: z.string().min(1),
  registrationType: z.nativeEnum(RegistrationType),

  rulebookContent: z.string().min(10, 'Rulebook must be at least 10 characters'),
  prizeDetails: z.string().min(3),

  sections: z.array(sectionSchema).default([]),
  rounds: z.array(roundSchema).default([]),
}).superRefine((data, context) => {
  if (data.category === CompetitionCategory.CHAMPIONSHIP && !data.rounds.length) context.addIssue({ code: 'custom', path: ['rounds'], message: 'A championship needs at least one round.' });
  if (data.category !== CompetitionCategory.CHAMPIONSHIP && !data.sections.length) context.addIssue({ code: 'custom', path: ['sections'], message: 'At least one section is required.' });
  if (data.eligibilityType === 'invite_only' && data.registrationType !== RegistrationType.ACCESS_CODE) context.addIssue({ code: 'custom', path: ['registrationType'], message: 'Invite-only competitions must use an access code.' });
  const rounds = [...data.rounds].sort((a, b) => a.roundNumber - b.roundNumber);
  if (rounds.some((round, index) => round.roundNumber !== index + 1)) context.addIssue({ code: 'custom', path: ['rounds'], message: 'Round numbers must start at 1 with no gaps.' });
  rounds.forEach((round, index) => {
    if (!(new Date(round.schedule.startDate) < new Date(round.schedule.endDate))) context.addIssue({ code: 'custom', path: ['rounds', index, 'schedule'], message: 'Each round must end after it starts.' });
    if (index < rounds.length - 1 && !Object.values(round.qualificationCriteria).some(Boolean)) context.addIssue({ code: 'custom', path: ['rounds', index, 'qualificationCriteria'], message: 'Every non-final round needs a qualification rule.' });
    if (index && new Date(round.schedule.startDate) < new Date(rounds[index - 1].schedule.endDate)) context.addIssue({ code: 'custom', path: ['rounds', index, 'schedule'], message: 'Rounds cannot overlap.' });
  });
});

// ─── POST — Create Competition ──────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isSuperAdmin(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const data = competitionSchema.parse(await request.json());
    const registrationStart = new Date(data.registrationStartDate);
    const registrationEnd = new Date(data.registrationEndDate);
    const competitionStart = new Date(data.competitionStartDate);
    const competitionEnd = new Date(data.competitionEndDate);
    if (!(registrationStart < registrationEnd && registrationEnd <= competitionStart && competitionStart < competitionEnd)) {
      return NextResponse.json({ error: 'Registration and competition dates must be in chronological order.' }, { status: 400 });
    }

    if (data.category === CompetitionCategory.CHAMPIONSHIP && data.rounds.some((round) => new Date(round.schedule.startDate) < competitionStart || new Date(round.schedule.endDate) > competitionEnd)) {
      return NextResponse.json({ error: 'Every round must be within the competition schedule.' }, { status: 400 });
    }
    await connectDB();
    const questionIds = [...new Set([...data.sections.flatMap((section) => section.questions), ...data.rounds.flatMap((round) => round.sections.flatMap((section) => section.questions))])];
    const activeQuestionCount = await QuestionModel.countDocuments({ _id: { $in: questionIds }, status: 'active' });
    if (activeQuestionCount !== questionIds.length) return NextResponse.json({ error: 'Every selected question must exist and be active.' }, { status: 400 });

    const createdBy = mongoose.Types.ObjectId.isValid(session.user.id)
      ? session.user.id
      : '000000000000000000000000';

    const competition = await CompetitionModel.create({
      name: data.name,
      category: data.category,
      description: data.description,
      organizer: data.organizer,
      contact: data.contact,
      language: data.language,
      difficultyLevel: data.difficultyLevel,
      eligibility: {
        type: data.eligibilityType,
        grades: data.grades.length > 0 ? data.grades : [],
        minAge: data.minAge === '' ? undefined : data.minAge,
        maxAge: data.maxAge === '' ? undefined : data.maxAge,
        maxParticipants: data.maxParticipants,
      },
      registration: {
        startDate: registrationStart,
        endDate: registrationEnd,
        type: data.registrationType,
        ...(data.registrationType === RegistrationType.ACCESS_CODE && { accessCode: `MTH-${randomBytes(8).toString('hex').toUpperCase()}` }),
      },
      schedule: {
        competitionStartDate: competitionStart,
        competitionEndDate: competitionEnd,
      },
      rulebook: {
        content: data.rulebookContent,
        acceptanceRequired: true,
      },
      prizeDetails: data.prizeDetails,
      sections: data.category === CompetitionCategory.CHAMPIONSHIP ? [] : data.sections,
      rounds: data.category === CompetitionCategory.CHAMPIONSHIP ? data.rounds.map((round) => ({
        ...round,
        qualificationCriteria: Object.fromEntries(Object.entries(round.qualificationCriteria).filter(([, value]) => value !== '' && value !== undefined)),
        schedule: { startDate: new Date(round.schedule.startDate), endDate: new Date(round.schedule.endDate) },
      })) : [],
      status: CompetitionStatus.DRAFT,
      createdBy,
    });

    return NextResponse.json({ id: competition._id.toString(), accessCode: competition.registration.accessCode }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      return NextResponse.json({
        error: error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      }, { status: 400 });
    }

    console.error('Create competition error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to create competition',
    }, { status: 500 });
  }
}

// ─── GET — List Competitions ────────────────────────────────────────────────

export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isSuperAdmin(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    await connectDB();
    const competitions = await CompetitionModel.find()
      .sort({ createdAt: -1 })
      .select('name category status schedule analytics eligibility createdAt')
      .lean();
    return NextResponse.json(competitions);
  } catch (error) {
    console.error('List competitions error:', error);
    return NextResponse.json({ error: 'Failed to fetch competitions' }, { status: 500 });
  }
}
