import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongodb';
import GradeModel from '@/models/Grade';

export async function GET() {
  try {
    const session = await auth();
    if (!session || !['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const grades = await GradeModel.find().sort({ order: 1, name: 1 }).lean();

    return NextResponse.json({
      success: true,
      data: grades,
    });
  } catch (error: unknown) {
    console.error('Error fetching grades:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch grades' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();

    if (!body.name || !body.code) {
      return NextResponse.json({ success: false, error: 'Grade name and code are required' }, { status: 400 });
    }

    const code = body.code.trim().toUpperCase();
    const existing = await GradeModel.findOne({ code });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Grade code already exists' }, { status: 409 });
    }

    const newGrade = new GradeModel({
      name: body.name.trim(),
      code,
      order: Number(body.order) || 0,
      isActive: body.isActive !== undefined ? body.isActive : true,
    });

    await newGrade.save();

    return NextResponse.json({
      success: true,
      data: newGrade,
      message: 'Grade created successfully',
    });
  } catch (error: unknown) {
    console.error('Error creating grade:', error);
    const message = error instanceof Error ? error.message : 'Failed to create grade';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
