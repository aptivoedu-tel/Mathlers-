import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/db/mongodb';
import ResultModel, { IResult } from '@/models/Result';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import StatusChip from '@/components/ui/StatusChip';
import EmptyState from '@/components/ui/EmptyState';
import PrimaryButton from '@/components/ui/PrimaryButton';
import Link from 'next/link';
import { CheckCircle2, TrendingUp, Target, ArrowRight } from 'lucide-react';

type ResultListItem = Pick<IResult, 'type' | 'score' | 'totalMarks' | 'accuracy' | 'completedAt'> & {
  _id: { toString(): string };
};

export default async function ResultsPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/sign-in');
  }

  await connectDB();

  const results = (await ResultModel.find({ student: session.user.id })
    .sort({ completedAt: -1 })
    .limit(20)) as unknown as ResultListItem[];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Your Results"
        subtitle="Review your scores and performance across all tests, practices, and competitions."
        breadcrumbs={[
          { label: 'Student', href: '/student/dashboard' },
          { label: 'Results' }
        ]}
      />

      {results.length > 0 ? (
        <GlassCard className="p-6 bg-white border border-gray-200/90 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900 tracking-tight">Recent Results</h2>
            <span className="text-xs text-gray-400 font-semibold">{results.length} entries</span>
          </div>

          <div className="space-y-2">
            {results.map((result) => (
              <div key={result._id.toString()} className="flex justify-between items-center p-4 bg-gray-50/80 rounded-xl border border-gray-100 hover:bg-gray-100/60 transition">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-lighter/60 text-brand-primary flex items-center justify-center">
                    {result.type === 'competition' ? <Target className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">
                      {result.type === 'practice' ? 'Practice Set' : result.type === 'test' ? 'Test' : 'Competition'}
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Score: {result.score}/{result.totalMarks} · {result.accuracy}% accuracy
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <StatusChip variant={result.accuracy >= 80 ? 'success' : result.accuracy >= 50 ? 'warning' : 'danger'}>
                    {result.accuracy}%
                  </StatusChip>
                  <span className="text-[10px] text-gray-400">
                    {result.completedAt?.toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="p-6 bg-white border border-gray-200/90 shadow-card">
          <EmptyState
            icon="file"
            title="No Results Yet"
            description="Start practicing to see your performance here."
          />
          <div className="flex justify-center mt-4">
            <Link href="/student/practice">
              <PrimaryButton size="sm">
                Start Practicing <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </PrimaryButton>
            </Link>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
