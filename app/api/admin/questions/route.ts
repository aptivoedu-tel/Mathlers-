import { NextRequest, NextResponse } from 'next/server';
import { auth, isSuperAdmin } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongodb';
import QuestionModel, { Difficulty } from '@/models/Question';
import {
  escapeRegex,
  MAX_QUESTION_REQUEST_BYTES,
  parseQuestionPayload,
  questionDuplicateFilter,
  questionError,
  readJsonPayload,
} from '@/lib/questions/payload';
import { validateQuestionLinks } from '@/lib/questions/validateLinks';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !isSuperAdmin(session.user.role)) {
      return NextResponse.json(questionError('Unauthorized', 'UNAUTHORIZED'), { status: 401 });
    }

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const page = Math.min(10_000, Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1));
    const limit = Math.min(1000, Math.max(1, Number.parseInt(searchParams.get('limit') || '20', 10) || 20));
    const search = searchParams.get('search') || '';
    const subject = searchParams.get('subject') || '';
    const grade = searchParams.get('grade') || '';
    const topic = searchParams.get('topic') || '';
    const subtopic = searchParams.get('subtopic') || '';
    const difficulty = searchParams.get('difficulty') || '';
    const status = searchParams.get('status') || '';

    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { question: { $regex: escapeRegex(search.slice(0, 200)), $options: 'i' } },
        { explanation: { $regex: escapeRegex(search.slice(0, 200)), $options: 'i' } }
      ];
    }

    if (subject) query.subject = subject;
    if (grade) query.grade = grade;
    if (topic) query.topic = topic;
    if (subtopic) query.subtopic = subtopic;
    if (difficulty && !Object.values(Difficulty).includes(difficulty as Difficulty)) {
      return NextResponse.json(questionError('Difficulty must be easy, medium, or hard', 'INVALID_FILTER'), { status: 400 });
    }
    if (status && !['active', 'inactive', 'archived'].includes(status)) {
      return NextResponse.json(questionError('Status must be active, inactive, or archived', 'INVALID_FILTER'), { status: 400 });
    }
    if (difficulty) query.difficulty = difficulty;
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const questions = await QuestionModel.find(query)
      .populate('subject', 'name')
      .populate('grade', 'name level')
      .populate('chapter', 'name')
      .populate('topic', 'name subtopics')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await QuestionModel.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: questions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(questionError('Failed to fetch questions', 'INTERNAL_ERROR'), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !isSuperAdmin(session.user.role)) {
      return NextResponse.json(questionError('Unauthorized', 'UNAUTHORIZED'), { status: 401 });
    }

    const body = await readJsonPayload(request, MAX_QUESTION_REQUEST_BYTES);
    if (!body.ok) return NextResponse.json(questionError(body.error, body.code), { status: body.status });

    const parsed = parseQuestionPayload(body.data);
    if (!parsed.ok) return NextResponse.json(questionError(parsed.error, 'INVALID_QUESTION'), { status: 400 });

    await connectDB();
    const linkError = await validateQuestionLinks(parsed.data);
    if (linkError) return NextResponse.json(questionError(linkError, 'INVALID_REFERENCE'), { status: 400 });

    if (await QuestionModel.exists(questionDuplicateFilter(parsed.data))) {
      return NextResponse.json(questionError('An identical question already exists', 'DUPLICATE_EXISTS'), { status: 409 });
    }

    const newQuestion = new QuestionModel({
      ...parsed.data,
      createdBy: session.user.id,
      analytics: {
        totalAttempts: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        correctPercentage: 0,
        incorrectPercentage: 0,
        averageTime: 0,
        fastestCorrectAnswer: 0,
        slowestCorrectAnswer: 0,
        skipCount: 0,
        numberOfTimesUsed: 0,
        lastUsedDate: new Date(),
        usageInPractice: 0,
        usageInTests: 0,
        usageInCompetitions: 0,
        mostSelectedWrongOption: null,
        difficultyIndex: 0,
        successRateByGrade: new Map(),
        successRateBySchool: new Map()
      }
    });
    await newQuestion.save();

    const populatedQuestion = await QuestionModel.findById(newQuestion._id)
      .populate('subject', 'name')
      .populate('grade', 'name level')
      .populate('chapter', 'name')
      .populate('topic', 'name');

    return NextResponse.json({
      success: true,
      data: populatedQuestion,
      message: 'Question created successfully'
    });
  } catch (error: unknown) {
    console.error('Error creating question:', error);
    return NextResponse.json(questionError('Failed to create question', 'INTERNAL_ERROR'), { status: 500 });
  }
}
