import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/sign-in');
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Settings"
        subtitle="Manage your account preferences, notifications, and security."
        breadcrumbs={[
          { label: 'Student', href: '/student/dashboard' },
          { label: 'Settings' }
        ]}
      />

      <SettingsClient user={session.user} />
    </div>
  );
}
