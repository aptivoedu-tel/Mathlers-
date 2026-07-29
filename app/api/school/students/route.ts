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
    const { students } = body as { students: any[] };

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    await connectDB();

    let school = await SchoolModel.findById(session.user.id);
    if (!school && session.user.role === UserRole.ADMIN) {
      // Might be a school user logging in via UserModel
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

    // Validate all usernames first to ensure uniqueness across the school
    const usernames = students.map(s => s.username?.toLowerCase().trim());
    const existingUsers = await UserModel.find({ 
      school: school._id, 
      playerId: { $in: usernames } // We map username to playerId for login consistency if needed, but email is primary.
    });
    
    // Check if generated emails already exist across the entire platform
    const emails = usernames.map(u => `${u}.${domain}@mathlers.com`);
    const existingEmails = await UserModel.find({ email: { $in: emails } });

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const username = student.username?.toLowerCase().trim();
      const email = `${username}.${domain}@mathlers.com`;

      if (!student.name || !username || !student.password) {
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

      if (students.filter(s => s.username?.toLowerCase().trim() === username).length > 1) {
        errors.push(`Row ${i + 1}: Username '${username}' is duplicated in the current request.`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(student.password, 10);

      const newUser = await UserModel.create({
        fullName: student.name,
        email: email,
        password: hashedPassword,
        playerId: username, // Using username as playerId for backward compatibility/identification
        role: UserRole.STUDENT,
        school: school._id,
        schoolName: school.name,
        isEmailVerified: true,
        profileComplete: true,
        isActive: true,
        // Store roll number conceptually if needed, or just let it exist in metadata
      });

      createdIds.push(newUser._id.toString());
    }

    if (createdIds.length > 0) {
      // Update school total students
      school.totalStudents += createdIds.length;
      school.activeStudents += createdIds.length;
      await school.save();
    }

    if (errors.length > 0 && createdIds.length === 0) {
      return NextResponse.json({ error: 'Failed to create students', details: errors }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${createdIds.length} student(s).`,
      details: errors,
    });
  } catch (error: any) {
    console.error('Create students error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
