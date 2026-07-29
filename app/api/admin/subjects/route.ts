import { NextRequest, NextResponse } from 'next/server';
import { auth, isSuperAdmin } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongodb';
import SubjectModel from '@/models/Subject';
import GradeModel from '@/models/Grade';
import mongoose from 'mongoose';

const requireSuperAdmin = async () => {
  const session = await auth();
  return session && isSuperAdmin(session.user.role);
};

const validIds = (value: unknown): value is string[] => Array.isArray(value)
  && value.every((id) => typeof id === 'string' && mongoose.isValidObjectId(id));

export async function GET() {
  try {
    if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const subjects = await SubjectModel.find().populate('grades', 'name code').sort({ order: 1, name: 1 }).lean();
    return NextResponse.json({ success: true, data: subjects });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load subjects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!await requireSuperAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const body = await request.json() as { name?: string; code?: string; grades?: unknown; description?: string; color?: string; order?: number; isActive?: boolean };
    if (!body.name?.trim() || !body.code?.trim()) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 });
    }
    if (body.grades !== undefined && !validIds(body.grades)) {
      return NextResponse.json({ error: 'Grades must be valid identifiers' }, { status: 400 });
    }
    const grades = [...new Set(body.grades || [])];
    if (grades.length && await GradeModel.countDocuments({ _id: { $in: grades } }) !== grades.length) {
      return NextResponse.json({ error: 'One or more grades are invalid' }, { status: 400 });
    }

    const subject = await SubjectModel.create({
      name: body.name.trim(),
      code: body.code.trim().toUpperCase(),
      grades,
      description: body.description?.trim(),
      color: body.color || '#C1121F',
      order: Number(body.order) || 0,
      isActive: body.isActive ?? true,
    });
    return NextResponse.json({ success: true, data: subject }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create subject' }, { status: 400 });
  }
}
