import { auth, isAdmin } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/db/mongodb';
import UserModel from '@/models/User';
import CompetitionModel from '@/models/Competition';
import QuestionModel from '@/models/Question';
import ResultModel from '@/models/Result';
import GlassCard from '@/components/ui/GlassCard';
import StatCard from '@/components/ui/StatCard';
import PrimaryButton from '@/components/ui/PrimaryButton';
import Link from 'next/link';
import { Users, Trophy, Target, Award, TrendingUp, Activity } from 'lucide-react';

export default async function AdminDashboard() {
  const session = await auth();
  
  if (!session || !isAdmin(session.user.role)) {
    redirect('/sign-in');
  }

  await connectDB();

  const [students, competitions, questions, results] = await Promise.all([
    UserModel.countDocuments({ isActive: true }),
    CompetitionModel.countDocuments(),
    QuestionModel.countDocuments(),
    ResultModel.countDocuments()
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Overview of platform activity and metrics</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Users className="w-6 h-6 text-brand-primary" />}
          value={students}
          label="Total Students"
          trend="+12% this month"
        />
        <StatCard
          icon={<Trophy className="w-6 h-6 text-brand-primary" />}
          value={competitions}
          label="Competitions"
          trend="+3 this month"
        />
        <StatCard
          icon={<Target className="w-6 h-6 text-brand-primary" />}
          value={questions}
          label="Questions"
          trend="+45 this week"
        />
        <StatCard
          icon={<Award className="w-6 h-6 text-brand-primary" />}
          value={results}
          label="Results"
          trend="+89 this week"
        />
      </div>

      {/* Activity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
            <PrimaryButton variant="secondary" size="sm">View All</PrimaryButton>
          </div>
          <div className="space-y-4">
            {[
              { action: 'New student registered', time: '2 minutes ago', type: 'user' },
              { action: 'Competition created', time: '15 minutes ago', type: 'competition' },
              { action: 'Question added', time: '1 hour ago', type: 'question' },
              { action: 'Test completed', time: '2 hours ago', type: 'result' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-white/50 rounded-xl">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  activity.type === 'user' ? 'bg-blue-100' :
                  activity.type === 'competition' ? 'bg-purple-100' :
                  activity.type === 'question' ? 'bg-green-100' :
                  'bg-orange-100'
                }`}>
                  <Activity className="w-5 h-5 text-gray-700" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/admin/questions" className="p-4 bg-brand-lighter rounded-xl hover:scale-105 transition-transform">
              <Target className="w-8 h-8 text-brand-primary mb-2" />
              <p className="font-semibold text-gray-900">Add Question</p>
              <p className="text-sm text-gray-600">Create new question</p>
            </Link>
            <Link href="/admin/competitions/create" className="p-4 bg-brand-lighter rounded-xl hover:scale-105 transition-transform">
              <Trophy className="w-8 h-8 text-brand-primary mb-2" />
              <p className="font-semibold text-gray-900">Create Competition</p>
              <p className="text-sm text-gray-600">Start new event</p>
            </Link>
            <Link href="/admin/students" className="p-4 bg-brand-lighter rounded-xl hover:scale-105 transition-transform">
              <Users className="w-8 h-8 text-brand-primary mb-2" />
              <p className="font-semibold text-gray-900">Manage Students</p>
              <p className="text-sm text-gray-600">View all students</p>
            </Link>
            <Link href="/admin/analytics" className="p-4 bg-brand-lighter rounded-xl hover:scale-105 transition-transform">
              <TrendingUp className="w-8 h-8 text-brand-primary mb-2" />
              <p className="font-semibold text-gray-900">View Analytics</p>
              <p className="text-sm text-gray-600">Platform insights</p>
            </Link>
          </div>
        </GlassCard>
      </div>

      {/* Platform Health */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Platform Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Student Engagement</span>
              <span className="font-semibold text-gray-900">78%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-brand-primary h-2 rounded-full" style={{ width: '78%' }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Competition Participation</span>
              <span className="font-semibold text-gray-900">65%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-brand-primary h-2 rounded-full" style={{ width: '65%' }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Question Accuracy</span>
              <span className="font-semibold text-gray-900">72%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-brand-primary h-2 rounded-full" style={{ width: '72%' }} />
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
