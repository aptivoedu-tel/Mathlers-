import { auth, isAdmin } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/db/mongodb';
import ResultModel from '@/models/Result';
import { IUser } from '@/models/User';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import StatusChip from '@/components/ui/StatusChip';
import EmptyState from '@/components/ui/EmptyState';
import { Award, BarChart3, Users, CheckCircle2 } from 'lucide-react';

export default async function ResultsPage() {
  const session = await auth();
  
  if (!session || !isAdmin(session.user.role)) {
    redirect('/sign-in');
  }

  await connectDB();

  const results = await ResultModel.find()
    .populate<{ student: Pick<IUser, 'fullName' | 'playerId'> }>('student', 'fullName playerId')
    .sort({ completedAt: -1 })
    .limit(50)
    .lean();

  const avgAccuracy = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + (r.accuracy || 0), 0) / results.length)
    : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Results"
        subtitle="Latest recorded practice and competition results across all students."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Results' }
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard icon={<Award className="w-5 h-5 text-brand-primary" />} value={results.length} label="Total Results" />
        <StatCard icon={<BarChart3 className="w-5 h-5 text-brand-primary" />} value={`${avgAccuracy}%`} label="Avg Accuracy" />
        <StatCard icon={<Users className="w-5 h-5 text-brand-primary" />} value={new Set(results.map(r => String(r.student?.playerId || '')).filter(Boolean)).size} label="Active Students" />
      </div>

      <GlassCard className="p-0 bg-white border border-gray-200/90 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left py-3 px-5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Student</th>
                <th className="text-left py-3 px-5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Type</th>
                <th className="text-left py-3 px-5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Score</th>
                <th className="text-left py-3 px-5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Accuracy</th>
                <th className="text-left py-3 px-5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Time</th>
                <th className="text-left py-3 px-5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result._id.toString()} className="border-b border-gray-50 hover:bg-gray-50/60 transition">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-brand-lighter/60 rounded-xl flex items-center justify-center text-brand-primary text-xs font-bold">
                        {result.student?.fullName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{result.student?.fullName || 'Unknown'}</p>
                        <p className="text-[10px] text-gray-400">{result.student?.playerId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <StatusChip variant={
                      result.type === 'practice' ? 'info' :
                      result.type === 'test' ? 'warning' :
                      'success'
                    }>
                      {result.type}
                    </StatusChip>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="text-xs font-bold text-gray-900">{result.score}/{result.totalMarks || 100}</span>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className={`text-xs font-bold ${
                      result.accuracy >= 80 ? 'text-emerald-600' :
                      result.accuracy >= 60 ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {result.accuracy}%
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-xs text-gray-500">{result.timeTaken || 'N/A'}</td>
                  <td className="py-3.5 px-5 text-xs text-gray-500">
                    {new Date(result.completedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {results.length === 0 && (
          <div className="p-6">
            <EmptyState
              icon="file"
              title="No Results Found"
              description="Results will appear here as students complete tests and practice sets."
            />
          </div>
        )}
      </GlassCard>
    </div>
  );
}
