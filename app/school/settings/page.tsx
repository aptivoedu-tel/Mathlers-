import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongodb';
import UserModel from '@/models/User';
import SchoolModel from '@/models/School';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/ui/PageHeader';
import { Building2, MapPin, Phone, Mail, User, Globe, ShieldCheck } from 'lucide-react';

export default async function SchoolSettingsPage() {
  const session = await auth();
  if (!session) redirect('/sign-in');

  await connectDB();

  let school = null;
  const user = await UserModel.findById(session.user.id).select('school');
  if (user?.school) {
    school = await SchoolModel.findById(user.school);
  } else {
    school = await SchoolModel.findOne({
      $or: [{ email: session.user.email }, { username: session.user.playerId }],
    });
  }

  if (!school) {
    return <div>School not found</div>;
  }

  const infoRows = [
    { icon: Building2, label: 'School Name', value: school.name },
    { icon: Globe, label: 'Domain', value: school.domain || 'Not Assigned' },
    { icon: ShieldCheck, label: 'Username', value: school.username || '-' },
    { icon: User, label: 'Contact Person', value: school.contactPerson || '-' },
    { icon: Mail, label: 'Email', value: school.email || '-' },
    { icon: Phone, label: 'Contact Number', value: school.contactNumber },
    { icon: MapPin, label: 'Address', value: `${school.address}, ${school.city}` },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="School Settings"
        subtitle="View your school profile and account information."
        breadcrumbs={[
          { label: 'School Portal', href: '/school/dashboard' },
          { label: 'Settings' },
        ]}
      />

      <GlassCard className="p-6 bg-white border border-gray-200/90 shadow-card">
        <div className="flex items-center gap-4 pb-6 border-b border-gray-100 mb-6">
          <div className="w-16 h-16 bg-brand-lighter/60 text-brand-primary rounded-2xl flex items-center justify-center text-2xl font-black border border-brand-primary/10">
            {school.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{school.name}</h2>
            <p className="text-sm text-gray-500">Registered School Organization</p>
          </div>
        </div>

        <div className="space-y-4">
          {infoRows.map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.label} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/80 border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{row.label}</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{row.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl bg-amber-50/80 border border-amber-200 p-4 text-xs text-amber-900 leading-relaxed">
          <strong>Note:</strong> To update school information, please contact the platform administrator.
        </div>
      </GlassCard>
    </div>
  );
}
