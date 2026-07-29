import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/db/mongodb';
import UserModel from '@/models/User';
import ResultModel, { IResult } from '@/models/Result';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/ui/PageHeader';
import { User, Mail, Edit, Award, TrendingUp, Target } from 'lucide-react';

type ProfileResult = Pick<IResult, 'score' | 'accuracy' | 'type' | 'completedAt'> & {
  _id: { toString(): string };
};

export default async function StudentProfilePage() {
  const session = await auth();
  
  if (!session) {
    redirect('/sign-in');
  }

  await connectDB();

  const user = await UserModel.findById(session.user.id);
  const results = (await ResultModel.find({ student: session.user.id })) as unknown as ProfileResult[];

  const totalPoints = results.reduce((sum, r) => sum + (r.score || 0), 0);
  const accuracy = results.length > 0 
    ? Math.round(results.reduce((sum, r) => sum + (r.accuracy || 0), 0) / results.length)
    : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="My Profile"
        subtitle="View your personal information, statistics, and recent activity."
        breadcrumbs={[
          { label: 'Student', href: '/student/dashboard' },
          { label: 'Profile' }
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile Card */}
        <GlassCard className="p-6 bg-white border border-gray-200/90 shadow-card">
          <div className="text-center mb-5">
            <div className="w-24 h-24 bg-brand-lighter/60 text-brand-primary rounded-2xl mx-auto mb-3 flex items-center justify-center text-3xl font-bold">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <h2 className="text-base font-bold text-gray-900">{user?.fullName}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 font-mono">ID: {user?.playerId}</p>
          </div>

          <button className="w-full mb-4 inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 shadow-xs">
            <Edit className="w-3.5 h-3.5" /> Edit Profile
          </button>

          <div className="space-y-2.5 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2.5 text-xs">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Student</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 truncate">{user?.email}</span>
            </div>
          </div>
        </GlassCard>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Statistics */}
          <GlassCard className="p-6 bg-white border border-gray-200/90 shadow-card space-y-4">
            <h3 className="text-base font-bold text-gray-900 tracking-tight">Statistics</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-4 text-center">
                <Award className="w-6 h-6 mx-auto mb-2 text-brand-primary" />
                <p className="text-lg font-bold text-gray-900">{totalPoints.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Total Points</p>
              </div>
              <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-4 text-center">
                <Target className="w-6 h-6 mx-auto mb-2 text-brand-primary" />
                <p className="text-lg font-bold text-gray-900">{results.length}</p>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Tests Taken</p>
              </div>
              <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-4 text-center">
                <TrendingUp className="w-6 h-6 mx-auto mb-2 text-brand-primary" />
                <p className="text-lg font-bold text-gray-900">{accuracy}%</p>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Accuracy</p>
              </div>
            </div>
          </GlassCard>

          {/* Personal Information */}
          <GlassCard className="p-6 bg-white border border-gray-200/90 shadow-card space-y-4">
            <h3 className="text-base font-bold text-gray-900 tracking-tight">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Full Name</label>
                <p className="text-xs text-gray-900 font-bold">{user?.fullName}</p>
              </div>
              <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Email</label>
                <p className="text-xs text-gray-900 font-bold">{user?.email}</p>
              </div>
              <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Player ID</label>
                <p className="text-xs text-gray-900 font-bold font-mono">{user?.playerId}</p>
              </div>
              <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Role</label>
                <p className="text-xs text-gray-900 font-bold capitalize">{user?.role}</p>
              </div>
            </div>
          </GlassCard>

          {/* Recent Activity */}
          <GlassCard className="p-6 bg-white border border-gray-200/90 shadow-card space-y-4">
            <h3 className="text-base font-bold text-gray-900 tracking-tight">Recent Activity</h3>
            <div className="space-y-2">
              {results.slice(0, 5).map((result) => (
                <div key={result._id.toString()} className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                  <div className="w-8 h-8 bg-brand-lighter/60 rounded-lg flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4 text-brand-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900">
                      {result.type === 'practice' ? 'Practice Set' : result.type === 'test' ? 'Test' : 'Competition'}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Score: {result.score} · Accuracy: {result.accuracy}%
                    </p>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">
                    {new Date(result.completedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {results.length === 0 && (
                <div className="text-center py-6 text-xs text-gray-400">
                  No recent activity
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
