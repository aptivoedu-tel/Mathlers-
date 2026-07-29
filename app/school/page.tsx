import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongodb';
import SchoolModel from '@/models/School';
import UserModel, { UserRole } from '@/models/User';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { Users, GraduationCap, UserPlus } from 'lucide-react';

export default async function SchoolPage() {
  const session = await auth();
  if (!session) redirect('/sign-in');

  await connectDB();
  const operator = await UserModel.findById(session.user.id).select('school');
  const school = operator?.school ? await SchoolModel.findById(operator.school).select('name') : null;

  if (!school) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-amber-900 text-sm font-medium">
        Your administrator account has not been assigned to a school yet. Please contact a Mathlers administrator.
      </div>
    );
  }

  const [students, teachers] = await Promise.all([
    UserModel.countDocuments({ school: school._id, role: UserRole.STUDENT, isActive: true }),
    UserModel.countDocuments({ school: school._id, role: UserRole.TEACHER, isActive: true })
  ]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <PageHeader
        title={`${school.name} Workspace`}
        subtitle="Manage your teachers and student access for your school."
        breadcrumbs={[
          { label: 'School', href: '/school' },
          { label: 'Workspace' }
        ]}
        actions={
          <Link href="/school/people">
            <PrimaryButton size="sm">
              <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Provision People
            </PrimaryButton>
          </Link>
        }
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <StatCard
          icon={<GraduationCap className="w-5 h-5 text-brand-primary" />}
          value={students}
          label="Active Students"
        />
        <StatCard
          icon={<Users className="w-5 h-5 text-brand-primary" />}
          value={teachers}
          label="Assigned Teachers"
        />
      </div>
    </div>
  );
}
