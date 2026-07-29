import { auth, isAdmin, isSuperAdmin } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/db/mongodb';
import UserModel, { UserRole } from '@/models/User';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/ui/PageHeader';
import StatusChip from '@/components/ui/StatusChip';
import EmptyState from '@/components/ui/EmptyState';
import { Users, Search, Filter } from 'lucide-react';

type StudentRow = {
  _id: { toString(): string };
  fullName?: string;
  email?: string;
  playerId?: string;
  role?: string;
  isActive?: boolean;
  isSuspended?: boolean;
};

export default async function StudentsPage() {
  const session = await auth();

  if (!session || !isAdmin(session.user.role)) {
    redirect('/sign-in');
  }

  await connectDB();

  const operator = await UserModel.findById(session.user.id).select('school');
  const studentScope = isSuperAdmin(session.user.role) ? {} : { school: operator?.school };
  const students = await UserModel.find({ ...studentScope, role: UserRole.STUDENT, isActive: true })
    .select('fullName email playerId role isActive isSuspended')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean<StudentRow[]>();

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Students Directory"
        subtitle={`Review and manage registered student accounts${isSuperAdmin(session.user.role) ? ' across all schools' : ' at your school'}.`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Students' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
              Total: {students.length}
            </span>
          </div>
        }
      />

      <GlassCard className="p-6 bg-white border border-gray-200/90 shadow-card space-y-4">
        <div className="flex items-center justify-between gap-4 pb-2">
          <h2 className="text-base font-bold text-gray-900 tracking-tight">Active Students</h2>
        </div>

        {students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Email Address</th>
                  <th className="py-3 px-3">Player ID</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {students.map((student) => (
                  <tr key={student._id.toString()} className="hover:bg-gray-50/80 transition">
                    <td className="py-3 px-3 font-semibold text-gray-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-lighter/60 text-brand-primary font-bold text-xs flex items-center justify-center">
                          {student.fullName?.charAt(0) || 'S'}
                        </div>
                        <span>{student.fullName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gray-500">{student.email}</td>
                    <td className="py-3 px-3 font-mono text-gray-600">{student.playerId || 'N/A'}</td>
                    <td className="py-3 px-3">
                      <StatusChip variant="info">{student.role || 'student'}</StatusChip>
                    </td>
                    <td className="py-3 px-3">
                      {student.isActive && !student.isSuspended ? (
                        <StatusChip variant="success">Active</StatusChip>
                      ) : (
                        <StatusChip variant="danger">Suspended</StatusChip>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon="file"
            title="No Students Found"
            description="There are currently no active students registered in the system."
          />
        )}
      </GlassCard>
    </div>
  );
}
