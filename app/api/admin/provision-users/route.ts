import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { auth, isAdmin } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongodb';
import SchoolModel from '@/models/School';
import UserModel, { UserRole } from '@/models/User';

const accountSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  grade: z.enum(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']).optional(),
});

const requestSchema = z.object({
  role: z.enum([UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN]),
  schoolId: z.string().regex(/^[a-f\d]{24}$/i),
  accounts: z.array(accountSchema).min(1).max(100),
});

const temporaryPassword = () => `Mth!${randomBytes(12).toString('base64url')}`;
const playerId = () => `MTH-${new Date().getFullYear().toString().slice(-2)}-${randomBytes(4).toString('hex').toUpperCase()}`;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || !isAdmin(session.user.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const input = requestSchema.parse(await request.json());
    if (new Set(input.accounts.map((account) => account.email)).size !== input.accounts.length) {
      return NextResponse.json({ error: 'Each email address can be included only once.' }, { status: 400 });
    }

    await connectDB();
    const requester = await UserModel.findById(session.user.id).select('role school');
    if (!requester) return NextResponse.json({ error: 'Your operator profile is unavailable.' }, { status: 403 });
    const isDeveloper = requester.role === UserRole.SUPER_ADMIN;
    if (!isDeveloper && (input.role === UserRole.ADMIN || !requester.school || requester.school.toString() !== input.schoolId)) {
      return NextResponse.json({ error: 'School admins can provision teachers and students for their own school only.' }, { status: 403 });
    }

    const school = await SchoolModel.findById(input.schoolId).select('name isActive');
    if (!school?.isActive) return NextResponse.json({ error: 'Choose an active school.' }, { status: 400 });
    if (input.role !== UserRole.ADMIN && input.accounts.some((account) => !account.grade && input.role === UserRole.STUDENT)) {
      return NextResponse.json({ error: 'Every student needs a grade.' }, { status: 400 });
    }
    const existing = await UserModel.countDocuments({ email: { $in: input.accounts.map((account) => account.email) } });
    if (existing) return NextResponse.json({ error: 'One or more email addresses already belong to a Mathlers account.' }, { status: 409 });

    const created: Array<{ fullName: string; email: string; password: string; role: UserRole }> = [];
    for (const account of input.accounts) {
      const password = temporaryPassword();
      const hashedPassword = await bcrypt.hash(password, 10);
      try {
        const user = await UserModel.create({
          fullName: account.fullName, email: account.email, playerId: playerId(), role: input.role,
          password: hashedPassword,
          school: school._id, schoolName: school.name, grade: input.role === UserRole.STUDENT ? account.grade : undefined,
          isEmailVerified: false, profileComplete: input.role !== UserRole.STUDENT,
        });
        if (input.role === UserRole.ADMIN) {
          await SchoolModel.updateOne({ _id: school._id }, { $set: { coordinator: user._id, coordinatorName: user.fullName } });
        }
        created.push({ fullName: account.fullName, email: account.email, password, role: input.role });
      } catch {
        return NextResponse.json({ error: `Could not provision ${account.email}. ${created.length} account(s) were created; remove or retry the failed row.`, created }, { status: 409 });
      }
    }

    return NextResponse.json({ created }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    console.error('Provision users error:', error);
    return NextResponse.json({ error: 'Unable to provision accounts.' }, { status: 500 });
  }
}
