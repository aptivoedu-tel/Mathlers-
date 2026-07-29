import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/db/mongodb';
import UserModel, { UserRole } from '@/models/User';
import ResultModel from '@/models/Result';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { Award, Star, TrendingUp, Trophy, Hash } from 'lucide-react';

export default async function PlayerCardPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/sign-in');
  }

  await connectDB();

  const user = await UserModel.findById(session.user.id);
  const [resultCount, recentResults] = await Promise.all([
    ResultModel.countDocuments({ student: session.user.id }),
    ResultModel.find({ student: session.user.id }).sort({ completedAt: -1 }).limit(4).select('type score totalMarks completedAt'),
  ]);

  const totalPoints = user?.points || 0;
  const hasSchool = !!user?.school;
  
  let nationalRank = null;
  let schoolRank = null;

  if (user && user.role === UserRole.STUDENT) {
    const studentsWithHigherPoints = await UserModel.countDocuments({
      isActive: true,
      role: UserRole.STUDENT,
      points: { $gt: totalPoints },
    });
    nationalRank = studentsWithHigherPoints + 1;

    if (hasSchool) {
      const schoolStudentsWithHigherPoints = await UserModel.countDocuments({
        isActive: true,
        role: UserRole.STUDENT,
        school: user.school,
        points: { $gt: totalPoints },
      });
      schoolRank = schoolStudentsWithHigherPoints + 1;
    }
  }

  const level = Math.floor(totalPoints / 1000) + 1;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Player Card"
        subtitle="Your personal performance card with rankings and statistics."
        breadcrumbs={[
          { label: 'Student', href: '/student/dashboard' },
          { label: 'Player Card' }
        ]}
      />

      {/* Identity Card */}
      <GlassCard className="p-6 bg-white border border-gray-200/90 shadow-card">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-brand-lighter/60 text-brand-primary rounded-2xl flex items-center justify-center text-3xl font-bold border border-brand-primary/10">
              {user?.fullName?.charAt(0) || 'M'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">{user?.fullName}</h2>
              <p className="text-xs text-gray-500 mt-0.5 font-mono">ID: {user?.playerId}</p>
              {user?.schoolName && (
                <p className="text-xs text-brand-primary font-semibold mt-0.5">🏫 {user.schoolName}</p>
              )}
              <div className="flex items-center gap-1.5 mt-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="text-xs font-bold text-gray-700">Level {level}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-brand-primary">#{nationalRank}</p>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">National Rank</p>
            </div>
            {hasSchool && (
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">#{schoolRank}</p>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">School Rank</p>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard icon={<Award className="w-5 h-5 text-brand-primary" />} value={totalPoints.toLocaleString()} label="Total Points" />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-brand-primary" />} value={resultCount} label="Tests Completed" />
        <StatCard icon={<Star className="w-5 h-5 text-brand-primary" />} value={level} label="Current Level" />
      </div>

      {/* Recent Results */}
      <GlassCard className="p-6 bg-white border border-gray-200/90 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900 tracking-tight">Recent Results</h3>
          <span className="text-xs text-gray-400 font-semibold">{recentResults.length} entries</span>
        </div>
        <div className="space-y-2">
          {recentResults.map((result) => (
            <div key={result._id.toString()} className="flex items-center justify-between p-3.5 bg-gray-50/80 rounded-xl border border-gray-100 hover:bg-gray-100/60 transition">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-lighter/60 text-brand-primary flex items-center justify-center">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 capitalize">{result.type}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{new Date(result.completedAt).toLocaleDateString()}</p>
                </div>
              </div>
              <p className="text-sm font-bold text-brand-primary">{result.score} / {result.totalMarks}</p>
            </div>
          ))}
          {!recentResults.length && (
            <div className="text-center py-8 text-xs text-gray-400">
              Complete practice or a competition to see your results here.
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
