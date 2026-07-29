import { NextResponse } from 'next/server';
import { auth, isSuperAdmin } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongodb';
import SchoolModel, { SchoolStatus } from '@/models/School';
import UserModel, { UserRole } from '@/models/User';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !isSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, domain } = body as { status: SchoolStatus; domain?: string };

    const validStatuses: SchoolStatus[] = ['Pending', 'Approved', 'Rejected', 'Blocked'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status provided.' }, { status: 400 });
    }

    if (status === 'Approved') {
      if (!domain || domain.trim() === '') {
        return NextResponse.json({ error: 'A unique domain must be assigned to approve a school.' }, { status: 400 });
      }
    }

    await connectDB();

    const school = await SchoolModel.findById(id).select('+password');
    if (!school) {
      return NextResponse.json({ error: 'School not found.' }, { status: 404 });
    }

    if (status === 'Approved' && domain) {
      const existingDomain = await SchoolModel.findOne({ domain: domain.trim().toLowerCase(), _id: { $ne: id } });
      if (existingDomain) {
        return NextResponse.json({ error: 'The provided domain is already in use by another school.' }, { status: 400 });
      }
      school.domain = domain.trim().toLowerCase();
    }

    school.status = status;
    school.isActive = status === 'Approved';
    await school.save();

    // Sync or update corresponding UserModel admin account for the school
    if (school.email || school.username) {
      const userFilter = school.email ? { email: school.email } : { playerId: school.username };

      if (status === 'Approved') {
        const adminPassword = school.password;
        await UserModel.findOneAndUpdate(
          userFilter,
          {
            $set: {
              fullName: `${school.name} Admin`,
              email: school.email || `${school.username}@school.mathlers.com`,
              role: UserRole.ADMIN,
              school: school._id,
              schoolName: school.name,
              isActive: true,
              isSuspended: false,
              isEmailVerified: true,
              profileComplete: true,
            },
            $setOnInsert: {
              password: adminPassword,
              playerId: school.username || `SCH-${school._id.toString().slice(-6)}`,
              level: 1,
              points: 0,
              accuracy: 0,
              currentStreak: 0,
              totalQuestions: 0,
              correctAnswers: 0,
              wrongAnswers: 0,
              competitionsJoined: 0,
              competitionsWon: 0,
            },
          },
          { upsert: true, new: true }
        );
      } else if (status === 'Rejected') {
        await UserModel.updateMany(userFilter, {
          $set: { isActive: false },
        });
      } else if (status === 'Blocked') {
        await UserModel.updateMany(userFilter, {
          $set: { isActive: false, isSuspended: true, suspensionReason: 'School account blocked' },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `School status updated to ${status}.`,
      school: {
        id: school._id.toString(),
        name: school.name,
        status: school.status,
        isActive: school.isActive,
      },
    });
  } catch (error: any) {
    console.error('Error updating school status:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update school status.' },
      { status: 500 }
    );
  }
}
