import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import SubjectModel from '@/models/Subject';
import '@/models/Grade';

export async function GET() {
  try {
    await connectDB();

    const subjects = await SubjectModel.find({ isActive: true }).select('name code grades').populate('grades', 'name code').lean();

    return NextResponse.json({
      success: true,
      data: subjects
    });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subjects' },
      { status: 500 }
    );
  }
}
