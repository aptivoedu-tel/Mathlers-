import connectDB from '@/lib/db/mongodb';
import CompetitionModel from '@/models/Competition';
import QuestionModel from '@/models/Question';
import ResultModel from '@/models/Result';
import UserModel, { UserRole } from '@/models/User';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import GlassCard from '@/components/ui/GlassCard';
import { BarChart3, FileQuestion, Trophy, Users, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export default async function AnalyticsPage() {
  await connectDB();
  const [students, questions, competitions, results] = await Promise.all([
    UserModel.countDocuments({ role: UserRole.STUDENT, isActive: true }),
    QuestionModel.countDocuments(),
    CompetitionModel.countDocuments(),
    ResultModel.countDocuments(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Analytics & Performance"
        subtitle="Comprehensive view of platform engagement, student activity, and assessment coverage."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Analytics' }
        ]}
        actions={
          <Link href="/admin/analytics/questions" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 shadow-xs">
            <BarChart3 className="h-3.5 w-3.5" /> Question Analytics
          </Link>
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="w-5 h-5 text-brand-primary" />}
          value={students}
          label="Active Students"
          trend="+12%"
        />
        <StatCard
          icon={<FileQuestion className="w-5 h-5 text-brand-primary" />}
          value={questions}
          label="Question Bank"
          trend="+45"
        />
        <StatCard
          icon={<Trophy className="w-5 h-5 text-brand-primary" />}
          value={competitions}
          label="Competitions"
          trend="+3"
        />
        <StatCard
          icon={<BarChart3 className="w-5 h-5 text-brand-primary" />}
          value={results}
          label="Completed Results"
          trend="+89"
        />
      </div>

      <GlassCard className="p-6 bg-white border border-gray-200/90 shadow-card space-y-4">
        <h2 className="text-base font-bold text-gray-900 tracking-tight">Reporting Modules</h2>
        <p className="text-xs text-gray-500">Deep-dive reports available for individual curriculum topics and student performance metrics.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <Link href="/admin/analytics/questions" className="p-4 bg-gray-50 hover:bg-gray-100/80 border border-gray-200/60 rounded-xl transition flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-lighter/60 text-brand-primary flex items-center justify-center font-bold">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Question Item Analysis</p>
                <p className="text-xs text-gray-500">Accuracy rate, attempt counts, and difficulty breakdown</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition" />
          </Link>

          <Link href="/admin/results" className="p-4 bg-gray-50 hover:bg-gray-100/80 border border-gray-200/60 rounded-xl transition flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Competition & Test Results</p>
                <p className="text-xs text-gray-500">Student submissions, scores, and leaderboards</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition" />
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
