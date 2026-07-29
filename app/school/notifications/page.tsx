import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongodb';
import UserModel from '@/models/User';
import SchoolModel from '@/models/School';
import NotificationModel from '@/models/Notification';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { Bell, Clock } from 'lucide-react';

export default async function SchoolNotificationsPage() {
  const session = await auth();
  if (!session) redirect('/sign-in');

  await connectDB();

  let school = null;
  const user = await UserModel.findById(session.user.id).select('school');
  if (user?.school) {
    school = await SchoolModel.findById(user.school);
  }

  // Fetch notifications for the school admin user
  const notifications = await NotificationModel.find({
    recipient: session.user.id,
  }).sort({ sentAt: -1 }).lean();

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Notifications"
        subtitle="View notifications and announcements from the administration."
        breadcrumbs={[
          { label: 'School Portal', href: '/school/dashboard' },
          { label: 'Notifications' },
        ]}
      />

      <GlassCard className="p-0 overflow-hidden bg-white border border-gray-200/90 shadow-card">
        {notifications.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification._id.toString()}
                className={`p-5 hover:bg-gray-50/60 transition flex items-start gap-4 ${
                  notification.isRead ? '' : 'bg-brand-lighter/10'
                }`}
              >
                <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${
                  notification.isRead
                    ? 'bg-gray-100 text-gray-400'
                    : 'bg-brand-lighter text-brand-primary'
                }`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className={`text-sm font-bold ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                        {notification.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-3">{notification.message}</p>
                    </div>
                    {!notification.isRead && (
                      <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-brand-primary mt-1.5" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(notification.sentAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8">
            <EmptyState
              icon="custom"
              customIcon={<Bell className="w-12 h-12 text-gray-300" />}
              title="No Notifications"
              description="You don't have any notifications yet. Notifications from the administration will appear here."
            />
          </div>
        )}
      </GlassCard>
    </div>
  );
}
