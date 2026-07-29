import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/db/mongodb';
import ResultModel, { IResult } from '@/models/Result';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import PrimaryButton from '@/components/ui/PrimaryButton';
import Link from 'next/link';
import { CheckCircle2, TrendingUp, Target, ArrowRight } from 'lucide-react';

type ProgressResult = Pick<IResult, 'score' | 'accuracy' | 'completedAt'>;

export default async function ProgressPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/sign-in');
  }

  await connectDB();

  const results = (await ResultModel.find({ student: session.user.id })
    .sort({ completedAt: -1 })
    .limit(50)) as unknown as ProgressResult[];

  const totalTests = results.length;
  const passedTests = results.filter((result) => result.accuracy >= 70).length;
  const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

  const weeklyProgress: Record<string, { count: number; score: number }> = {};
  results.forEach((result) => {
    const date = new Date(result.completedAt);
    const weekKey = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
    if (!weeklyProgress[weekKey]) {
      weeklyProgress[weekKey] = { count: 0, score: 0 };
    }
    weeklyProgress[weekKey].count += 1;
    weeklyProgress[weekKey].score += result.score;
  });

  const weeklyData = Object.entries(weeklyProgress)
    .map(([week, data]) => ({
      week,
      tests: data.count,
      avgScore: Math.round(data.score / data.count),
    }))
    .slice(-8);

  const strengths: Record<string, number[]> = {};
  const weaknesses: Record<string, number[]> = {};
  results.forEach((result) => {
    const subject = 'General';
    const avg = result.accuracy;
    if (!strengths[subject]) strengths[subject] = [];
    if (!weaknesses[subject]) weaknesses[subject] = [];
    if (avg >= 80) strengths[subject].push(avg);
    if (avg < 60) weaknesses[subject].push(avg);
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="My Progress"
        subtitle="Track your weekly activity, pass rates, and improvement areas."
        breadcrumbs={[
          { label: 'Student', href: '/student/dashboard' },
          { label: 'Progress' }
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard icon={<CheckCircle2 className="w-5 h-5 text-brand-primary" />} value={totalTests} label="Tests Completed" />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-brand-primary" />} value={`${passRate}%`} label="Pass Rate" />
        <StatCard icon={<Target className="w-5 h-5 text-brand-primary" />} value={passedTests} label="Tests Passed" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GlassCard className="p-6 bg-white border border-gray-200/90 shadow-card space-y-4">
          <h2 className="text-base font-bold text-gray-900 tracking-tight">Weekly Progress</h2>
          <div className="space-y-2">
            {weeklyData.map((data) => (
              <div key={data.week} className="flex justify-between items-center p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                <div>
                  <p className="text-xs font-bold text-gray-900">{data.week}</p>
                  <p className="text-[10px] text-gray-400">{data.tests} tests</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{data.avgScore} avg</p>
                </div>
              </div>
            ))}
            {weeklyData.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">No activity data yet.</p>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-6 bg-white border border-gray-200/90 shadow-card space-y-4">
          <h2 className="text-base font-bold text-gray-900 tracking-tight">Strengths & Weaknesses</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-emerald-700 mb-2 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Strengths
              </h3>
              {Object.keys(strengths).length > 0 ? (
                <div className="space-y-1.5">
                  {Object.entries(strengths).map(([subject, scores]) => (
                    <div key={subject} className="flex justify-between text-xs p-2 bg-emerald-50/60 rounded-lg border border-emerald-100/60">
                      <span className="text-gray-700 font-medium">{subject}</span>
                      <span className="text-emerald-600 font-bold">{scores.length} high scores</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-gray-400">No strengths identified yet</p>
              )}
            </div>
            <div>
              <h3 className="text-xs font-bold text-red-600 mb-2 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> Areas to Improve
              </h3>
              {Object.keys(weaknesses).length > 0 ? (
                <div className="space-y-1.5">
                  {Object.entries(weaknesses).map(([subject, scores]) => (
                    <div key={subject} className="flex justify-between text-xs p-2 bg-red-50/60 rounded-lg border border-red-100/60">
                      <span className="text-gray-700 font-medium">{subject}</span>
                      <span className="text-red-600 font-bold">{scores.length} low scores</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-gray-400">No weaknesses identified</p>
              )}
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-6 bg-white border border-gray-200/90 shadow-card space-y-4">
        <h2 className="text-base font-bold text-gray-900 tracking-tight">Recommended Actions</h2>
        <div className="space-y-3">
          {passRate < 70 && (
            <div className="p-3 bg-amber-50/80 border border-amber-200/60 rounded-xl text-xs text-amber-800 font-medium">
              Focus on practice sets to improve your pass rate.
            </div>
          )}
          {totalTests < 10 && (
            <div className="p-3 bg-blue-50/80 border border-blue-200/60 rounded-xl text-xs text-blue-800 font-medium">
              Complete more practice tests to get better insights.
            </div>
          )}
          {passedTests >= 5 && (
            <div className="p-3 bg-emerald-50/80 border border-emerald-200/60 rounded-xl text-xs text-emerald-800 font-medium">
              Great progress! Consider joining competitions to challenge yourself.
            </div>
          )}
          <Link href="/student/practice">
            <PrimaryButton size="sm" className="w-full justify-center gap-1.5 mt-2">
              View Practice Sets <ArrowRight className="w-3.5 h-3.5" />
            </PrimaryButton>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
