import connectDB from '@/lib/db/mongodb';
import SchoolModel from '@/models/School';
import UserModel from '@/models/User';
import { auth, isSuperAdmin } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import GlassCard from '@/components/ui/GlassCard';
import StatusChip from '@/components/ui/StatusChip';
import EmptyState from '@/components/ui/EmptyState';
import { Building2, MapPin, Users } from 'lucide-react';

export default async function SchoolsPage() {
  const session = await auth();
  if (!session) redirect('/sign-in');
  await connectDB();
  const operator = await UserModel.findById(session.user.id).select('school');
  const schools = await SchoolModel.find(isSuperAdmin(session.user.role) ? {} : { _id: operator?.school }).sort({ totalStudents: -1, name: 1 }).limit(50).lean();
  const activeSchools = schools.filter((school) => school.isActive).length;
  const students = schools.reduce((total, school) => total + school.totalStudents, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Schools"
        subtitle="Monitor school participation and enrolled Mathlers students."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Schools' }
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard icon={<Building2 className="w-5 h-5 text-brand-primary" />} value={schools.length} label="Total Schools" />
        <StatCard icon={<Users className="w-5 h-5 text-brand-primary" />} value={students} label="Total Students" />
        <StatCard icon={<Building2 className="w-5 h-5 text-brand-primary" />} value={activeSchools} label="Active Schools" />
      </div>

      <GlassCard className="p-0 bg-white border border-gray-200/90 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <div className="grid grid-cols-[minmax(180px,1.4fr)_minmax(130px,1fr)_100px_100px] gap-4 border-b border-gray-100 bg-gray-50/80 px-5 py-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">School</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Location</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Students</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</span>
          </div>
          {schools.map((school) => (
            <div key={school._id.toString()} className="grid grid-cols-[minmax(180px,1.4fr)_minmax(130px,1fr)_100px_100px] items-center gap-4 border-b border-gray-50 px-5 py-3.5 last:border-0 hover:bg-gray-50/60 transition">
              <div>
                <p className="text-xs font-bold text-gray-900">{school.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{school.coordinatorName || 'No coordinator assigned'}</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-gray-600">
                <MapPin className="h-3.5 w-3.5 text-gray-400" />{school.city}
              </span>
              <span className="text-xs font-bold text-gray-900">{school.totalStudents}</span>
              <StatusChip variant={school.isActive ? 'success' : 'neutral'}>
                {school.isActive ? 'Active' : 'Inactive'}
              </StatusChip>
            </div>
          ))}
          {!schools.length && (
            <div className="p-6">
              <EmptyState
                icon="file"
                title="No Schools Added"
                description="Schools will appear here once they are registered on the platform."
              />
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
