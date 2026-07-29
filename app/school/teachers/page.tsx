import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongodb';
import UserModel, { UserRole } from '@/models/User';
import SchoolModel from '@/models/School';
import PageHeader from '@/components/ui/PageHeader';
import SchoolTeachersClient from './SchoolTeachersClient';

export default async function SchoolTeachersPage() {
  const session = await auth();
  if (!session) redirect('/sign-in');

  await connectDB();

  let school = await SchoolModel.findById(session.user.id).select('name domain');
  if (!school && session.user.role === UserRole.ADMIN) {
    const user = await UserModel.findById(session.user.id);
    if (user?.school) school = await SchoolModel.findById(user.school).select('name domain');
  }

  if (!school) {
    return <div>School not found</div>;
  }

  const rawTeachers = await UserModel.find({
    school: school._id,
    role: UserRole.TEACHER,
    isActive: true,
  }).sort({ createdAt: -1 }).lean();

  const serializedTeachers = rawTeachers.map((t: any) => ({
    _id: t._id.toString(),
    fullName: t.fullName,
    playerId: t.playerId,
    email: t.email,
    isActive: t.isActive,
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Teacher Management"
        subtitle="View, add, and manage your school's teachers."
        breadcrumbs={[
          { label: 'School Portal', href: '/school/dashboard' },
          { label: 'Teachers' },
        ]}
      />
      <SchoolTeachersClient initialTeachers={serializedTeachers} domain={school.domain || ''} />
    </div>
  );
}
