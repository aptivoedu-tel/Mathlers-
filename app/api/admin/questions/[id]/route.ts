import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth, isSuperAdmin } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongodb';
import QuestionModel, { Difficulty } from '@/models/Question';
import {
  MAX_QUESTION_REQUEST_BYTES,
  parseQuestionUpdatePayload,
  questionDuplicateFilter,
  questionError,
  readJsonPayload,
} from '@/lib/questions/payload';
import { validateQuestionLinks } from '@/lib/questions/validateLinks';

const validId = (id: string) => mongoose.Types.ObjectId.isValid(id);
const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !isSuperAdmin(session.user.role)) {
      return NextResponse.json(questionError('Unauthorized', 'UNAUTHORIZED'), { status: 401 });
    }

    const { id } = await params;
    if (!validId(id)) return NextResponse.json(questionError('Invalid question id', 'INVALID_ID'), { status: 400 });

    await connectDB();
    const question = await QuestionModel.findById(id)
      .populate('subject', 'name code')
      .populate('grade', 'name level')
      .populate('chapter', 'name')
      .populate('topic', 'name subtopics')
      .populate('createdBy', 'name email');

    if (!question) return NextResponse.json(questionError('Question not found', 'NOT_FOUND'), { status: 404 });
    return NextResponse.json({ success: true, data: question });
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json(questionError('Failed to fetch question', 'INTERNAL_ERROR'), { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !isSuperAdmin(session.user.role)) {
      return NextResponse.json(questionError('Unauthorized', 'UNAUTHORIZED'), { status: 401 });
    }

    const { id } = await params;
    if (!validId(id)) return NextResponse.json(questionError('Invalid question id', 'INVALID_ID'), { status: 400 });

    const body = await readJsonPayload(request, MAX_QUESTION_REQUEST_BYTES);
    if (!body.ok) return NextResponse.json(questionError(body.error, body.code), { status: body.status });

    const parsed = parseQuestionUpdatePayload(body.data);
    if (!parsed.ok) return NextResponse.json(questionError(parsed.error, 'INVALID_QUESTION'), { status: 400 });

    await connectDB();
    const existingQuestion = await QuestionModel.findById(id);
    if (!existingQuestion) return NextResponse.json(questionError('Question not found', 'NOT_FOUND'), { status: 404 });

    const next = {
      subject: parsed.data.subject ?? existingQuestion.subject.toString(),
      grade: parsed.data.grade ?? existingQuestion.grade.toString(),
      chapter: parsed.data.chapter ?? existingQuestion.chapter.toString(),
      topic: parsed.data.topic ?? existingQuestion.topic.toString(),
      subtopic: parsed.data.subtopic === undefined ? existingQuestion.subtopic?.toString() : parsed.data.subtopic || undefined,
      question: parsed.data.question ?? existingQuestion.question,
    };
    const linkError = await validateQuestionLinks(next);
    if (linkError) return NextResponse.json(questionError(linkError, 'INVALID_REFERENCE'), { status: 400 });

    if (await QuestionModel.exists({ ...questionDuplicateFilter(next), _id: { $ne: id } })) {
      return NextResponse.json(questionError('An identical question already exists', 'DUPLICATE_EXISTS'), { status: 409 });
    }

    if (parsed.data.subject !== undefined) existingQuestion.subject = toObjectId(parsed.data.subject);
    if (parsed.data.grade !== undefined) existingQuestion.grade = toObjectId(parsed.data.grade);
    if (parsed.data.chapter !== undefined) existingQuestion.chapter = toObjectId(parsed.data.chapter);
    if (parsed.data.topic !== undefined) existingQuestion.topic = toObjectId(parsed.data.topic);
    if (parsed.data.subtopic !== undefined) existingQuestion.subtopic = parsed.data.subtopic ? toObjectId(parsed.data.subtopic) : undefined;
    if (parsed.data.question !== undefined) existingQuestion.question = parsed.data.question;
    if (parsed.data.options !== undefined) existingQuestion.options = parsed.data.options;
    if (parsed.data.correctAnswer !== undefined) existingQuestion.correctAnswer = parsed.data.correctAnswer;
    if (parsed.data.explanation !== undefined) existingQuestion.explanation = parsed.data.explanation;
    if (parsed.data.difficulty !== undefined) existingQuestion.difficulty = parsed.data.difficulty as Difficulty;
    if (parsed.data.marks !== undefined) existingQuestion.marks = parsed.data.marks;
    if (parsed.data.estimatedTime !== undefined) existingQuestion.estimatedTime = parsed.data.estimatedTime;
    if (parsed.data.status !== undefined) existingQuestion.status = parsed.data.status;

    await existingQuestion.save();
    const updatedQuestion = await QuestionModel.findById(existingQuestion._id)
      .populate('subject', 'name')
      .populate('grade', 'name level')
      .populate('chapter', 'name')
      .populate('topic', 'name subtopics');

    return NextResponse.json({ success: true, data: updatedQuestion, message: 'Question updated successfully' });
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(questionError('Failed to update question', 'INTERNAL_ERROR'), { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !isSuperAdmin(session.user.role)) {
      return NextResponse.json(questionError('Unauthorized', 'UNAUTHORIZED'), { status: 401 });
    }

    const { id } = await params;
    if (!validId(id)) return NextResponse.json(questionError('Invalid question id', 'INVALID_ID'), { status: 400 });

    await connectDB();
    const deleted = await QuestionModel.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json(questionError('Question not found', 'NOT_FOUND'), { status: 404 });

    return NextResponse.json({ success: true, message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(questionError('Failed to delete question', 'INTERNAL_ERROR'), { status: 500 });
  }
}
