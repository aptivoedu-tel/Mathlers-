import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';

export default async function NotificationsPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/sign-in');
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Notifications"
        subtitle="Stay updated with competition alerts, results, and platform announcements."
        breadcrumbs={[
          { label: 'Student', href: '/student/dashboard' },
          { label: 'Notifications' }
        ]}
      />

      <GlassCard className="p-6 bg-white border border-gray-200/90 shadow-card">
        <EmptyState
          icon="file"
          title="No Notifications Yet"
          description="Competition registration and result alerts will appear here when notifications are enabled."
        />
      </GlassCard>
    </div>
  );
}
