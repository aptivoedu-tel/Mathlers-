import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongodb';
import PracticeSetModel from '@/models/PracticeSet';
import ResultModel, { ResultType } from '@/models/Result';
import QuestionModel from '@/models/Question';
import UserModel from '@/models/User';

type GradingQuestion = {
  _id: mongoose.Types.ObjectId;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  marks?: number;
};

const submitSchema = z.object({
  answers: z.record(z.string(), z.enum(['A', 'B', 'C', 'D'])),
  timeTaken: z.number().int().min(0).max(86_400),
});

export async function POST(
  request: NextRequest,
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsedData = submitSchema.safeParse(body);
  if (!parsedData.success) {
    return NextResponse.json({ error: 'Invalid practice answers' }, { status: 400 });
  }

  try {
    await connectDB();
    const practiceSet = await PracticeSetModel.findOne({
      _id: id,
      isPublished: true,
    }).populate({
    path: 'questions',
    match: { status: 'active' },
    select: 'correctAnswer explanation marks analytics',
  });

    if (!practiceSet) {
      return NextResponse.json({ error: 'Practice set not found or is no longer available' }, { status: 404 });
    }

    const questions = practiceSet.questions as unknown as GradingQuestion[];
    if (questions.length === 0) {
      return NextResponse.json({ error: 'This practice set has no active questions' }, { status: 409 });
    }

    const gradedAnswers = questions.map((question) => {
      const selectedAnswer = parsedData.data.answers[question._id.toString()] || null;
      const isCorrect = selectedAnswer === question.correctAnswer;

      return {
        questionId: question._id,
        selectedAnswer,
        isCorrect,
        timeSpent: 0,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      };
    });

    const correctAnswers = gradedAnswers.filter((answer) => answer.isCorrect).length;
    const wrongAnswers = gradedAnswers.filter((answer) => answer.selectedAnswer && !answer.isCorrect).length;
    const skipped = gradedAnswers.filter((answer) => !answer.selectedAnswer).length;
    const totalMarks = questions.reduce((sum, question) => sum + (question.marks || 1), 0);
    const score = gradedAnswers.reduce((sum, answer, index) => (
      answer.isCorrect ? sum + (questions[index].marks || 1) : sum
    ), 0);
    const accuracy = Math.round((correctAnswers / questions.length) * 100);

    const result = await ResultModel.create({
    student: session.user.id,
    type: ResultType.PRACTICE,
    practiceSet: practiceSet._id,
    score,
    totalMarks,
    correctAnswers,
    wrongAnswers,
    skipped,
    accuracy,
    timeTaken: parsedData.data.timeTaken,
    answers: gradedAnswers.map((answer) => ({
      questionId: answer.questionId,
      selectedAnswer: answer.selectedAnswer,
      isCorrect: answer.isCorrect,
      timeSpent: answer.timeSpent,
    })),
    completedAt: new Date(),
    });

    await Promise.all([
    PracticeSetModel.updateOne(
      { _id: practiceSet._id },
      { $inc: { 'analytics.totalAttempts': 1 } }
    ),
    UserModel.updateOne(
      { _id: session.user.id },
      {
        $inc: {
          points: score,
          totalQuestions: questions.length,
          correctAnswers,
          wrongAnswers,
        },
        $set: { accuracy },
      }
    ),
    ...gradedAnswers.map((answer) => QuestionModel.updateOne(
      { _id: answer.questionId },
      {
        $inc: {
          'analytics.totalAttempts': 1,
          'analytics.totalCorrect': answer.isCorrect ? 1 : 0,
          'analytics.totalIncorrect': answer.selectedAnswer && !answer.isCorrect ? 1 : 0,
          'analytics.skipCount': answer.selectedAnswer ? 0 : 1,
          'analytics.usageInPractice': 1,
          'analytics.numberOfTimesUsed': 1,
        },
        $set: { 'analytics.lastUsedDate': new Date() },
      }
    )),
    ]);

    return NextResponse.json({
    result: {
      id: result._id.toString(),
      score,
      totalMarks,
      correctAnswers,
      wrongAnswers,
      skipped,
      accuracy,
      timeTaken: parsedData.data.timeTaken,
      answers: gradedAnswers.map((answer) => ({
        questionId: answer.questionId.toString(),
        selectedAnswer: answer.selectedAnswer,
        isCorrect: answer.isCorrect,
        correctAnswer: answer.correctAnswer,
        explanation: answer.explanation,
      })),
    },
    });
  } catch (error) {
    console.error('Unable to submit practice', error);
    return NextResponse.json({ error: 'Unable to save your result. Please try again.' }, { status: 500 });
  }
}
