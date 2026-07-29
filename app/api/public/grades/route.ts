import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import GradeModel from '@/models/Grade';

export async function GET() {
  try {
    await connectDB();

    const grades = await GradeModel.find({ isActive: true }).select('name level').lean();

    return NextResponse.json({
      success: true,
      data: grades
    });
  } catch (error) {
    console.error('Error fetching grades:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grades' },
      { status: 500 }
    );
  }
}
