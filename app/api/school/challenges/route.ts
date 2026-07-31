import { NextResponse } from 'next/server';
import { auth, isAdmin } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongodb';
import UserModel from '@/models/User';
import SchoolModel from '@/models/School';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !isAdmin(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 403 });
    }

    const body = await request.json();
    const { challengeId, assign } = body;

    if (!challengeId || typeof assign !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
    }

    await connectDB();

    let schoolId = session.user.id;
    const user = await UserModel.findById(session.user.id).select('school');
    if (user?.school) {
      schoolId = user.school.toString();
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

    const compObjectId = new mongoose.Types.ObjectId(challengeId);

    if (assign) {
      if (!school.assignedCompetitions.includes(compObjectId)) {
        school.assignedCompetitions.push(compObjectId);
      }
    } else {
      school.assignedCompetitions = school.assignedCompetitions.filter(
        id => id.toString() !== challengeId
      );
    }

    await school.save();

    return NextResponse.json({
      success: true,
      assignedCompetitions: school.assignedCompetitions,
    });
  } catch (error: any) {
    console.error('Error updating assigned challenges:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update challenges.' },
      { status: 500 }
    );
  }
}
