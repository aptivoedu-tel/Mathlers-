import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongodb';
import UserModel, { UserRole } from '@/models/User';
import SchoolModel from '@/models/School';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { teachers } = body as { teachers: any[] };

    if (!Array.isArray(teachers) || teachers.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    await connectDB();

    let school = await SchoolModel.findById(session.user.id);
    if (!school && session.user.role === UserRole.ADMIN) {
      const user = await UserModel.findById(session.user.id);
      if (user?.school) school = await SchoolModel.findById(user.school);
    }

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    if (!school.domain) {
      return NextResponse.json({ error: 'School domain is not configured. Please contact support.' }, { status: 400 });
    }

    const domain = school.domain;
    const errors: string[] = [];
    const createdIds: string[] = [];

    const usernames = teachers.map(t => t.username?.toLowerCase().trim());
    const existingUsers = await UserModel.find({ 
      school: school._id, 
      playerId: { $in: usernames } 
    });
    
    const emails = usernames.map(u => `${u}.${domain}@mathlers.com`);
    const existingEmails = await UserModel.find({ email: { $in: emails } });

    for (let i = 0; i < teachers.length; i++) {
      const teacher = teachers[i];
      const username = teacher.username?.toLowerCase().trim();
      const email = `${username}.${domain}@mathlers.com`;

      if (!teacher.name || !username || !teacher.password) {
        errors.push(`Row ${i + 1}: Name, Username, and Password are required.`);
        continue;
      }

      if (username.length < 3) {
        errors.push(`Row ${i + 1}: Username must be at least 3 characters.`);
        continue;
      }

      if (existingUsers.some(u => u.playerId === username)) {
        errors.push(`Row ${i + 1}: Username '${username}' is already taken within this school.`);
        continue;
      }
      
      if (existingEmails.some(u => u.email === email)) {
        errors.push(`Row ${i + 1}: The generated email '${email}' is already in use.`);
        continue;
      }

      if (teachers.filter(t => t.username?.toLowerCase().trim() === username).length > 1) {
        errors.push(`Row ${i + 1}: Username '${username}' is duplicated in the current request.`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(teacher.password, 10);

      const newUser = await UserModel.create({
        fullName: teacher.name,
        email: email,
        password: hashedPassword,
        playerId: username,
        role: UserRole.TEACHER,
        school: school._id,
        schoolName: school.name,
        isEmailVerified: true,
        profileComplete: true,
        isActive: true,
      });

      createdIds.push(newUser._id.toString());
    }

    if (errors.length > 0 && createdIds.length === 0) {
      return NextResponse.json({ error: 'Failed to create teachers', details: errors }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${createdIds.length} teacher(s).`,
      details: errors,
    });
  } catch (error: any) {
    console.error('Create teachers error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
