import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import connectDB from '@/lib/db/mongodb';
import ResultModel from '@/models/Result';
import EnrollmentModel from '@/models/Enrollment';
import CompetitionModel, { CompetitionStatus } from '@/models/Competition';
import GlassCard from '@/components/ui/GlassCard';
import StatCard from '@/components/ui/StatCard';
import PrimaryButton from '@/components/ui/PrimaryButton';
import PageHeader from '@/components/ui/PageHeader';
import StatusChip from '@/components/ui/StatusChip';
import IconCircle from '@/components/ui/IconCircle';
import { Flame, Trophy, Target, TrendingUp, Bell, ChevronRight, Zap, PlayCircle, KeyRound } from 'lucide-react';
import { isValidObjectId } from '@/lib/utils/isValidObjectId';

type ResultRow = {
  _id: { toString(): string };
  type?: string;
  score?: number;
  accuracy?: number;
  completedAt?: Date;
};

type EnrollmentRow = {
  _id: { toString(): string };
};

type UpcomingCompetitionRow = {
  _id: { toString(): string };
  name: string;
  status: string;
  schedule?: { competitionStartDate?: Date };
  competition?: { startDate?: Date };
  analytics?: { totalRegistrations?: number; registrations?: number };
  sections?: unknown[];
  rounds?: unknown[];
};

export default async function StudentDashboard() {
  const session = await auth();

  if (!session) {
    redirect('/sign-in');
  }

  await connectDB();

  const userId = session.user.id;
  const hasValidId = isValidObjectId(userId);

  const [results, enrollments, upcomingCompetitions] = await Promise.all([
    hasValidId
      ? ResultModel.find({ student: userId })
        .select('type score accuracy completedAt')
        .sort({ completedAt: -1 })
        .limit(5)
        .lean<ResultRow[]>()
      : Promise.resolve([]),
    hasValidId
      ? EnrollmentModel.find({ student: userId })
        .select('_id')
        .lean<EnrollmentRow[]>()
      : Promise.resolve([]),
    CompetitionModel.find({
      status: { $in: [CompetitionStatus.REGISTRATION_OPEN, CompetitionStatus.DRAFT, CompetitionStatus.IN_PROGRESS] }
    })
      .select('name status schedule analytics sections rounds')
      .sort({ 'schedule.competitionStartDate': 1 })
      .limit(1)
      .lean<UpcomingCompetitionRow[]>(),
  ]);

  const totalPoints = results.reduce((sum, r) => sum + (r.score || 0), 0);
  const accuracy = results.length > 0 
    ? Math.round(results.reduce((sum, r) => sum + (r.accuracy || 0), 0) / results.length)
    : 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  const upcomingComp = upcomingCompetitions[0];
  const startDate = upcomingComp?.schedule?.competitionStartDate || upcomingComp?.competition?.startDate;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ─── Page Header ─── */}
      <PageHeader
        title={`${greeting}, ${session.user.name} 👋`}
        subtitle="Ready for today's math challenge and practice sessions?"
        actions={
          <div className="flex items-center gap-3">
            <Link
              href="/student/notifications"
              className="w-9 h-9 rounded-full bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500 shadow-xs transition"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
            </Link>
            <Link
              href="/student/profile"
              className="w-9 h-9 bg-brand-primary text-white font-bold text-sm rounded-full flex items-center justify-center shadow-sm"
              title="Profile"
            >
              {session.user.name?.charAt(0)}
            </Link>
          </div>
        }
      />

      {/* ─── Metric Stat Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={<Trophy className="w-5 h-5 text-brand-primary" />}
          value={totalPoints.toLocaleString()}
          label="Total Score Points"
          trend="+150 pts"
        />
        <StatCard
          icon={<Target className="w-5 h-5 text-brand-primary" />}
          value={results.length}
          label="Tests & Quizzes Taken"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-brand-primary" />}
          value={`${accuracy}%`}
          label="Average Accuracy"
          trend="+4%"
        />
        <StatCard
          icon={<Flame className="w-5 h-5 text-brand-primary" />}
          value={enrollments.length}
          label="Joined Competitions"
        />
      </div>

      {/* ─── Featured Competition & Quick Actions Row ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Featured Competition Card */}
        {upcomingComp ? (
          <GlassCard className="lg:col-span-2 p-6 bg-white border border-gray-200/90 shadow-card space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-brand-primary uppercase tracking-wider">Featured Competition</span>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight mt-1">{upcomingComp.name}</h2>
              </div>
              <StatusChip variant="info">
                {String(upcomingComp.status).replace(/_/g, ' ')}
              </StatusChip>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50/80 rounded-xl border border-gray-100">
              <div>
                <p className="text-xs text-gray-400 font-medium">Starts On</p>
                <p className="text-sm font-semibold text-gray-800">{startDate ? new Date(startDate).toLocaleDateString() : 'TBA'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium font-medium">Participants</p>
                <p className="text-sm font-semibold text-gray-800">{upcomingComp.analytics?.totalRegistrations ?? upcomingComp.analytics?.registrations ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Sections</p>
                <p className="text-sm font-semibold text-gray-800">{upcomingComp.sections?.length ?? upcomingComp.rounds?.length ?? 0}</p>
              </div>
            </div>

            <div className="flex justify-end">
              <Link href={`/student/competitions/${upcomingComp._id.toString()}`}>
                <PrimaryButton className="gap-2">
                  View Competition <ChevronRight className="w-4 h-4" />
                </PrimaryButton>
              </Link>
            </div>
          </GlassCard>
        ) : (
          <GlassCard className="lg:col-span-2 p-8 bg-white border border-gray-200/90 shadow-card text-center flex flex-col items-center justify-center">
            <IconCircle icon={Trophy} size="xl" variant="brand" className="mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">No Upcoming Competitions</h3>
            <p className="text-xs text-gray-500 mb-5 max-w-sm">Check back later or browse available practice sets to sharpen your skills.</p>
            <Link href="/student/competitions">
              <PrimaryButton variant="secondary">Browse Competitions</PrimaryButton>
            </Link>
          </GlassCard>
        )}

        {/* Quick Actions */}
        <GlassCard className="p-6 bg-white border border-gray-200/90 shadow-card space-y-4">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">Quick Actions</h3>
          <div className="space-y-3">
            <Link href="/student/competitions/join" className="block">
              <div className="p-3.5 bg-gray-50 hover:bg-gray-100/80 border border-gray-200/60 rounded-xl transition flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-900">Join with Code</p>
                  <p className="text-[11px] text-gray-500">Enter competition pass key</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </div>
            </Link>

            <Link href="/student/practice" className="block">
              <div className="p-3.5 bg-gray-50 hover:bg-gray-100/80 border border-gray-200/60 rounded-xl transition flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-lg bg-brand-lighter/60 text-brand-primary flex items-center justify-center group-hover:scale-105 transition">
                  <PlayCircle className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-900">Start Practice</p>
                  <p className="text-[11px] text-gray-500">Solve daily problem sets</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </div>
            </Link>

            <Link href="/student/competitions" className="block">
              <div className="p-3.5 bg-gray-50 hover:bg-gray-100/80 border border-gray-200/60 rounded-xl transition flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition">
                  <Trophy className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-900">Browse Events</p>
                  <p className="text-[11px] text-gray-500">See all active tournaments</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </div>
            </Link>
          </div>
        </GlassCard>
      </div>

      {/* ─── Recent Activity ─── */}
      <GlassCard className="p-6 bg-white border border-gray-200/90 shadow-card space-y-4">
        <h2 className="text-lg font-bold text-gray-900 tracking-tight">Recent Activity</h2>
        <div className="space-y-3">
          {results.map((result) => (
            <div key={result._id.toString()} className="flex items-center gap-4 p-3.5 bg-gray-50/70 border border-gray-100 rounded-xl hover:bg-gray-50 transition">
              <IconCircle icon={Trophy} variant="brand" size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900">
                  {result.type === 'practice' ? 'Practice Set' : result.type === 'test' ? 'Test' : 'Competition'}
                </p>
                <p className="text-[11px] text-gray-500">
                  Score: {result.score} • Accuracy: {result.accuracy}%
                </p>
              </div>
              <StatusChip variant="success">
                {result.completedAt ? new Date(result.completedAt).toLocaleDateString() : 'Recently'}
              </StatusChip>
            </div>
          ))}
          {results.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-xs font-medium">
              No recent activity. Start practicing to see your progress here!
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
