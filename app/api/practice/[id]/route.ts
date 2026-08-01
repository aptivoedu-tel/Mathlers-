import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongodb';
import PracticeSetModel from '@/models/PracticeSet';

type QuestionPayload = {
  _id: { toString(): string };
  question?: unknown;
  options?: Record<string, unknown>;
  difficulty?: string;
  marks?: number;
  estimatedTime?: number;
  explanation?: string;
  correctAnswer?: string;
};

type PracticeSetPayload = {
  _id: { toString(): string };
  name: string;
  description?: string;
  type: string;
  timeLimit: number;
  attemptsAllowed: number;
  subject?: { name?: string };
  grade?: { name?: string };
  questions?: QuestionPayload[];
  sections?: {
    name: string;
    instructions?: string;
    questions: QuestionPayload[];
  }[];
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'student') {
    return NextResponse.json({ error: 'Student access is required' }, { status: 403 });
  }

  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid practice set' }, { status: 400 });
  }

  try {
    await connectDB();
    const practiceSet = await PracticeSetModel.findOne({
      _id: id,
      isPublished: true,
    })
      .populate({
        path: 'questions',
        match: { status: 'active' },
        select: 'question options difficulty marks estimatedTime explanation correctAnswer',
      })
      .populate('subject', 'name')
      .populate('grade', 'name')
      .populate('sections.questions', 'question options difficulty marks estimatedTime explanation correctAnswer')
      .lean() as unknown as PracticeSetPayload | null;

    if (!practiceSet) {
      return NextResponse.json({ error: 'Practice set not found or is no longer available' }, { status: 404 });
    }

    const questions = (practiceSet.questions || []).flatMap((question) => {
      const options = question.options;
      const hasOptions = ['A', 'B', 'C', 'D'].every((key) => typeof options?.[key] === 'string' && options[key].trim());

      return typeof question.question === 'string' && question.question.trim() && hasOptions
        ? [{
            id: question._id.toString(),
            question: question.question,
            options,
            difficulty: question.difficulty,
            marks: question.marks,
            estimatedTime: question.estimatedTime,
            explanation: question.explanation,
            correctAnswer: question.correctAnswer,
          }]
        : [];
    });

    return NextResponse.json({
      practiceSet: {
        id: practiceSet._id.toString(),
        name: practiceSet.name,
        description: practiceSet.description,
        type: practiceSet.type,
        subject: practiceSet.subject?.name || 'General',
        grade: practiceSet.grade?.name || 'All Grades',
        timeLimit: practiceSet.timeLimit,
        attemptsAllowed: practiceSet.attemptsAllowed,
        questions,
        sections: practiceSet.sections?.map(section => ({
          name: section.name,
          instructions: section.instructions,
          questions: (section.questions || []).flatMap((question) => {
            const options = question.options;
            const hasOptions = ['A', 'B', 'C', 'D'].every((key) => typeof options?.[key] === 'string' && options[key].trim());
            return typeof question.question === 'string' && question.question.trim() && hasOptions
              ? [{
                  id: question._id.toString(),
                  question: question.question,
                  options,
                  difficulty: question.difficulty,
                  marks: question.marks,
                  estimatedTime: question.estimatedTime,
                  explanation: question.explanation,
                  correctAnswer: question.correctAnswer,
                }]
              : [];
          }),
        })) || [],
      },
    });
  } catch (error) {
    console.error('Unable to load practice set', error);
    return NextResponse.json({ error: 'Unable to load this practice set. Please try again.' }, { status: 500 });
  }
}
