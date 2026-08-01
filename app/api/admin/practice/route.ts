import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth, isSuperAdmin } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongodb';
import PracticeSetModel, { PracticeSetType } from '@/models/PracticeSet';
import QuestionModel from '@/models/Question';

const requireSuperAdmin = async () => {
  const session = await auth();
  return session && isSuperAdmin(session.user.role) ? session : null;
};

type SectionInput = { name?: string; instructions?: string; questions?: string[] };

const validId = (v: unknown): v is string => typeof v === 'string' && mongoose.isValidObjectId(v);

const normalize = async (body: Record<string, unknown>) => {
  const sections = Array.isArray(body.sections) ? (body.sections as SectionInput[]) : [];
  if (!body.name || typeof body.name !== 'string' || !sections.length)
    throw new Error('A book name and at least one section are required');
  if (!Object.values(PracticeSetType).includes(body.type as PracticeSetType))
    throw new Error('Choose a valid practice type');
  if (!['easy', 'medium', 'hard', 'mixed', 'all'].includes(body.difficulty as string))
    throw new Error('Choose a valid difficulty');
  if (!Number.isFinite(Number(body.timeLimit)) || Number(body.timeLimit) < 60)
    throw new Error('Time limit must be at least 60 seconds');
  if (!Number.isInteger(Number(body.attemptsAllowed)) || Number(body.attemptsAllowed) < 1)
    throw new Error('Attempts allowed must be at least 1');

  const cleaned = await Promise.all(
    sections.map(async (section) => {
      const questionIds = [...new Set((section.questions || []).filter(validId))];
      if (!section.name?.trim() || !questionIds.length)
        throw new Error('Every section needs a name and at least one question');
      const count = await QuestionModel.countDocuments({ _id: { $in: questionIds }, status: 'active' });
      if (count !== questionIds.length)
        throw new Error(`Some questions in "${section.name}" are no longer active — please reselect`);
      return { name: section.name.trim(), instructions: section.instructions?.trim() || '', questions: questionIds };
    })
  );

  let availability: { startDate?: Date; endDate?: Date } | undefined;
  if (body.startDate || body.endDate) {
    const startDate = body.startDate ? new Date(String(body.startDate)) : undefined;
    const endDate = body.endDate ? new Date(String(body.endDate)) : undefined;
    if ((startDate && isNaN(startDate.valueOf())) || (endDate && isNaN(endDate.valueOf())))
      throw new Error('Choose a valid availability period');
    if (startDate && endDate && endDate < startDate)
      throw new Error('End date cannot be before start date');
    availability = { startDate, endDate };
  }

  const allQuestions = [...new Set(cleaned.flatMap((s) => s.questions))];
  return {
    name: body.name.trim(),
    description: typeof body.description === 'string' ? body.description.trim() : '',
    type: body.type as PracticeSetType,
    difficulty: body.difficulty as 'easy' | 'medium' | 'hard' | 'mixed' | 'all',
    sections: cleaned,
    questions: allQuestions,
    timeLimit: Number(body.timeLimit),
    attemptsAllowed: Number(body.attemptsAllowed),
    availability,
    isPublished: Boolean(body.isPublished),
    coverImage: typeof body.coverImage === 'string' ? body.coverImage.trim() : undefined,
  };
};

export async function GET() {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const data = await PracticeSetModel.find().sort({ updatedAt: -1 }).lean();
  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    await connectDB();
    const data = await normalize((await request.json()) as Record<string, unknown>);
    const practice = await PracticeSetModel.create({
      ...data,
      createdBy: session.user.id,
      analytics: { totalAttempts: 0, completionRate: 0, averageScore: 0, averageTime: 0 },
    });
    return NextResponse.json({ success: true, data: practice }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create practice book' },
      { status: 400 }
    );
  }
}
