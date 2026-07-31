import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongodb';
import SchoolModel from '@/models/School';
import UserModel, { UserRole } from '@/models/User';
import CompetitionModel, { CompetitionStatus } from '@/models/Competition';
import NotificationModel from '@/models/Notification';
import GlassCard from '@/components/ui/GlassCard';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import { Building2, Users, GraduationCap, Trophy, Award, Target, Hash, Bell, Star } from 'lucide-react';
import Link from 'next/link';

export default async function SchoolDashboard() {
  const session = await auth();
  if (!session) redirect('/sign-in');

  await connectDB();

  // Retrieve school details
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

  // Aggregate statistics
  const [
    totalStudents,
    totalTeachers,
    currentCompetitions,
    pastCompetitions,
    studentsParticipated,
    studentStats,
    recentNotifications
  ] = await Promise.all([
    UserModel.countDocuments({ school: school._id, role: UserRole.STUDENT, isActive: true }),
    UserModel.countDocuments({ school: school._id, role: UserRole.TEACHER, isActive: true }),
    CompetitionModel.countDocuments({ status: { $in: [CompetitionStatus.REGISTRATION_OPEN, CompetitionStatus.REGISTRATION_CLOSED, CompetitionStatus.IN_PROGRESS] } }),
    CompetitionModel.countDocuments({ status: CompetitionStatus.COMPLETED }),
    UserModel.countDocuments({ school: school._id, role: UserRole.STUDENT, competitionsJoined: { $gt: 0 } }),
    UserModel.aggregate([
      { $match: { school: school._id, role: UserRole.STUDENT, isActive: true } },
      { $group: { _id: null, avgAccuracy: { $avg: '$accuracy' }, totalPoints: { $sum: '$points' } } }
    ]),
    NotificationModel.find({ 
      $or: [{ target: 'all' }, { target: 'schools' }, { targetSchools: school._id }]
    }).sort({ createdAt: -1 }).limit(5)
  ]);

  const avgAccuracy = studentStats[0]?.avgAccuracy || 0;
  const totalPoints = studentStats[0]?.totalPoints || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="School Dashboard"
        subtitle={`Welcome back, ${school.name}. Here's an overview of your school's performance.`}
        breadcrumbs={[
          { label: 'School Portal' },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-5 h-5 text-brand-primary" />} value={totalStudents} label="Total Students" />
        <StatCard icon={<GraduationCap className="w-5 h-5 text-indigo-600" />} value={totalTeachers} label="Total Teachers" />
        <StatCard icon={<Trophy className="w-5 h-5 text-amber-500" />} value={currentCompetitions} label="Active Competitions" />
        <StatCard icon={<Star className="w-5 h-5 text-emerald-500" />} value={totalPoints.toLocaleString()} label="Total Points Earned" />
        <StatCard icon={<Target className="w-5 h-5 text-blue-500" />} value={`${avgAccuracy.toFixed(1)}%`} label="Avg Accuracy" />
        <StatCard icon={<Award className="w-5 h-5 text-purple-500" />} value={studentsParticipated} label="Students Participated" />
        <StatCard icon={<Hash className="w-5 h-5 text-pink-500" />} value={school.schoolRank || '-'} label="School Rank" />
        <StatCard icon={<Building2 className="w-5 h-5 text-teal-500" />} value={pastCompetitions} label="Past Competitions" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6 bg-white border border-gray-200/90 shadow-card flex flex-col h-full">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
            <h3 className="font-bold text-gray-900 text-lg">School Information</h3>
          </div>
          <div className="space-y-4 flex-1">
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Domain</span>
              <span className="font-semibold text-gray-900 bg-brand-lighter/50 px-2 rounded-md">{school.domain || 'Not Assigned'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Contact Person</span>
              <span className="font-semibold text-gray-900">{school.contactPerson || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Location</span>
              <span className="font-semibold text-gray-900">{school.city}</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 bg-white border border-gray-200/90 shadow-card flex flex-col h-full">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <Bell className="w-5 h-5 text-brand-primary" /> Recent Notifications
            </h3>
            <Link href="/school/notifications" className="text-xs font-semibold text-brand-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto">
            {recentNotifications.length > 0 ? (
              recentNotifications.map(notification => (
                <div key={notification._id.toString()} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <h4 className="text-sm font-bold text-gray-800">{notification.title}</h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notification.message}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                No recent notifications.
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
