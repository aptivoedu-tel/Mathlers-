import { NextResponse } from 'next/server';
import { auth, isSuperAdmin } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongodb';
import SchoolModel from '@/models/School';
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
    const { domain } = body as { domain: string };

    if (!domain || domain.trim() === '') {
      return NextResponse.json({ error: 'A valid domain is required.' }, { status: 400 });
    }

    const newDomain = domain.trim().toLowerCase();

    await connectDB();

    const school = await SchoolModel.findById(id);
    if (!school) {
      return NextResponse.json({ error: 'School not found.' }, { status: 404 });
    }

    // Check if domain is already taken
    const existingDomain = await SchoolModel.findOne({ domain: newDomain, _id: { $ne: id } });
    if (existingDomain) {
      return NextResponse.json({ error: 'The provided domain is already in use by another school.' }, { status: 400 });
    }

    // Check if any students or teachers are associated with this school
    const userCount = await UserModel.countDocuments({ 
      school: id, 
      role: { $in: [UserRole.STUDENT, UserRole.TEACHER] } 
    } as any);

    if (userCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot update domain because student or teacher accounts have already been created under this school.' 
      }, { status: 400 });
    }

    school.domain = newDomain;
    await school.save();

    return NextResponse.json({
      success: true,
      message: 'School domain updated successfully.',
      domain: newDomain,
    });
  } catch (error: any) {
    console.error('Error updating school domain:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update school domain.' },
      { status: 500 }
    );
  }
}
