import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/db/mongodb';
import ResultModel, { IResult } from '@/models/Result';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { BarChart3, Target, TrendingUp, CheckCircle2 } from 'lucide-react';

type ResultSummary = Pick<IResult, 'score' | 'totalMarks' | 'accuracy' | 'type' | 'completedAt'> & {
  _id: { toString(): string };
};

export default async function AnalyticsPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/sign-in');
  }

  await connectDB();

  const results = (await ResultModel.find({ student: session.user.id })
    .sort({ completedAt: -1 })
    .limit(100)) as unknown as ResultSummary[];

  const totalTests = results.length;
  const totalScore = results.reduce((sum, result) => sum + result.score, 0);
  const totalPossible = results.reduce((sum, result) => sum + result.totalMarks, 0);
  const averageAccuracy = results.length > 0 
    ? Math.round(results.reduce((sum, result) => sum + result.accuracy, 0) / results.length)
    : 0;

  const subjectPerformance: Record<string, { total: number; count: number }> = {};
  results.forEach((result) => {
    const subject = 'General';
    if (!subjectPerformance[subject]) {
      subjectPerformance[subject] = { total: 0, count: 0 };
    }
    subjectPerformance[subject].total += result.score;
    subjectPerformance[subject].count += 1;
  });

  const recentResults = results.slice(0, 10);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Performance Analytics"
        subtitle="Track your scores, accuracy trends, and subject performance over time."
        breadcrumbs={[
          { label: 'Student', href: '/student/dashboard' },
          { label: 'Analytics' }
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <StatCard icon={<BarChart3 className="w-5 h-5 text-brand-primary" />} value={totalTests} label="Total Tests" />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-brand-primary" />} value={totalScore} label="Total Score" />
        <StatCard icon={<Target className="w-5 h-5 text-brand-primary" />} value={`${averageAccuracy}%`} label="Avg Accuracy" />
        <StatCard icon={<CheckCircle2 className="w-5 h-5 text-brand-primary" />} value={`${totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0}%`} label="Success Rate" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GlassCard className="p-6 bg-white border border-gray-200/90 shadow-card space-y-4">
          <h2 className="text-base font-bold text-gray-900 tracking-tight">Subject Performance</h2>
          <div className="space-y-4">
            {Object.entries(subjectPerformance).map(([subject, data]) => (
              <div key={subject}>
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700">{subject}</span>
                  <span className="text-xs font-bold text-gray-900">{Math.round(data.total / data.count)} avg</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-brand-primary h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (data.total / data.count) / 10)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6 bg-white border border-gray-200/90 shadow-card space-y-4">
          <h2 className="text-base font-bold text-gray-900 tracking-tight">Recent Performance</h2>
          <div className="space-y-2">
            {recentResults.map((result) => (
              <div key={result._id.toString()} className="flex justify-between items-center p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                <div>
                  <p className="text-xs font-bold text-gray-900">
                    {result.type === 'practice' ? 'Practice' : result.type === 'test' ? 'Test' : 'Competition'}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(result.completedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{result.score}</p>
                  <p className="text-[10px] text-gray-400">{result.accuracy}% accuracy</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
