import { NextResponse } from 'next/server';
import { auth, isSchoolAdmin } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongodb';
import UserModel from '@/models/User';
import SchoolModel from '@/models/School';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !isSchoolAdmin(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 403 });
    }

    const body = await request.json();
    const { practiceBookId, assign } = body;

    if (!practiceBookId || typeof assign !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
    }

    await connectDB();

    let schoolId = session.user.id;
    const user = await UserModel.findById(session.user.id).select('school');
    if (user?.school) {
      schoolId = user.school;
    } else {
      const schoolDoc = await SchoolModel.findOne({
        $or: [{ email: session.user.email }, { username: session.user.playerId }],
      });
      if (schoolDoc) {
        schoolId = schoolDoc._id.toString();
      }
    }

    const school = await SchoolModel.findById(schoolId);
    if (!school) {
      return NextResponse.json({ error: 'School not found.' }, { status: 404 });
    }

    const practiceObjectId = new mongoose.Types.ObjectId(practiceBookId);

    if (assign) {
      if (!school.assignedPracticeSets.includes(practiceObjectId)) {
        school.assignedPracticeSets.push(practiceObjectId);
      }
    } else {
      school.assignedPracticeSets = school.assignedPracticeSets.filter(
        id => id.toString() !== practiceBookId
      );
    }

    await school.save();

    return NextResponse.json({
      success: true,
      assignedPracticeSets: school.assignedPracticeSets,
    });
  } catch (error: any) {
    console.error('Error updating assigned practice books:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update practice books.' },
      { status: 500 }
    );
  }
}
