import connectDB from '@/lib/db/mongodb';
import NotificationModel from '@/models/Notification';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import GlassCard from '@/components/ui/GlassCard';
import StatusChip from '@/components/ui/StatusChip';
import EmptyState from '@/components/ui/EmptyState';
import { Bell, CheckCheck, Users } from 'lucide-react';

export default async function AdminNotificationsPage() {
  await connectDB();
  const notifications = await NotificationModel.find().populate('recipient', 'fullName playerId').sort({ sentAt: -1 }).limit(50).lean();
  const unread = notifications.filter((notification) => !notification.isRead).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Notifications"
        subtitle="Review recent messages delivered across the Mathlers platform."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Notifications' }
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard icon={<Bell className="w-5 h-5 text-brand-primary" />} value={notifications.length} label="Recent Notifications" />
        <StatCard icon={<CheckCheck className="w-5 h-5 text-brand-primary" />} value={unread} label="Unread" />
        <StatCard icon={<Users className="w-5 h-5 text-brand-primary" />} value={new Set(notifications.map((n) => n.recipient?._id?.toString())).size} label="Recipients Reached" />
      </div>

      <GlassCard className="p-0 bg-white border border-gray-200/90 shadow-card overflow-hidden">
        {notifications.map((notification) => {
          const recipient = notification.recipient as unknown as { fullName?: string; playerId?: string } | null;
          return (
            <div key={notification._id.toString()} className="border-b border-gray-50 px-5 py-4 last:border-0 hover:bg-gray-50/60 transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-brand-lighter/60 text-brand-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">{notification.title}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{notification.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      To {recipient?.fullName || 'Unknown student'}{recipient?.playerId ? ` · ${recipient.playerId}` : ''} · {new Date(notification.sentAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <StatusChip variant={notification.isRead ? 'neutral' : 'info'}>
                  {notification.isRead ? 'Read' : 'Unread'}
                </StatusChip>
              </div>
            </div>
          );
        })}
        {!notifications.length && (
          <div className="p-6">
            <EmptyState
              icon="file"
              title="No Notifications Sent"
              description="Notifications will appear here once platform messages are dispatched."
            />
          </div>
        )}
      </GlassCard>
    </div>
  );
}
