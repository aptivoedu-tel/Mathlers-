import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongodb';
import UserModel, { UserRole } from '@/models/User';
import SchoolModel from '@/models/School';
import GlassCard from '@/components/ui/GlassCard';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import { Trophy, Target, TrendingUp, Award, Star, BarChart3 } from 'lucide-react';

export default async function SchoolPerformancePage() {
  const session = await auth();
  if (!session) redirect('/sign-in');

  await connectDB();

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

  // Get all students in this school
  const students = await UserModel.find({
    school: school._id,
    role: UserRole.STUDENT,
    isActive: true,
  }).sort({ points: -1 }).lean();

  const totalStudents = students.length;
  const totalPoints = students.reduce((sum, s) => sum + (s.points || 0), 0);
  const avgAccuracy = totalStudents > 0 ? students.reduce((sum, s) => sum + (s.accuracy || 0), 0) / totalStudents : 0;
  const avgPoints = totalStudents > 0 ? totalPoints / totalStudents : 0;
  const totalQuestions = students.reduce((sum, s) => sum + (s.totalQuestions || 0), 0);
  const totalCorrect = students.reduce((sum, s) => sum + (s.correctAnswers || 0), 0);
  const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

  const topPerformers = students.slice(0, 10);
  const lowestPerformers = [...students].sort((a, b) => (a.points || 0) - (b.points || 0)).slice(0, 10);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Student Performance"
        subtitle="Monitor and analyze student performance across your school."
        breadcrumbs={[
          { label: 'School Portal', href: '/school/dashboard' },
          { label: 'Performance' },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Trophy className="w-5 h-5 text-amber-500" />} value={totalPoints.toLocaleString()} label="Total Points" />
        <StatCard icon={<Target className="w-5 h-5 text-blue-500" />} value={`${overallAccuracy.toFixed(1)}%`} label="Overall Accuracy" />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-emerald-500" />} value={`${avgAccuracy.toFixed(1)}%`} label="Avg Student Accuracy" />
        <StatCard icon={<BarChart3 className="w-5 h-5 text-purple-500" />} value={Math.round(avgPoints).toLocaleString()} label="Avg Points/Student" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <GlassCard className="p-6 bg-white border border-gray-200/90 shadow-card">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" /> Top Performing Students
            </h3>
            <span className="text-xs text-gray-400 font-semibold">{topPerformers.length} students</span>
          </div>
          <div className="space-y-2">
            {topPerformers.map((student, index) => (
              <div
                key={student._id.toString()}
                className="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl border border-gray-100 hover:bg-gray-100/60 transition"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                    index === 0 ? 'bg-amber-100 text-amber-700' :
                    index === 1 ? 'bg-gray-200 text-gray-600' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-50 text-gray-500'
                  }`}>
                    #{index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{student.fullName}</p>
                    <p className="text-[10px] text-gray-400">{student.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-brand-primary">{(student.points || 0).toLocaleString()} pts</p>
                  <p className="text-[10px] text-gray-400">{(student.accuracy || 0).toFixed(1)}% acc</p>
                </div>
              </div>
            ))}
            {topPerformers.length === 0 && (
              <div className="text-center py-8 text-sm text-gray-400">No student data available yet.</div>
            )}
          </div>
        </GlassCard>

        {/* Lowest Performers */}
        <GlassCard className="p-6 bg-white border border-gray-200/90 shadow-card">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-red-400" /> Needs Improvement
            </h3>
            <span className="text-xs text-gray-400 font-semibold">{lowestPerformers.length} students</span>
          </div>
          <div className="space-y-2">
            {lowestPerformers.map((student) => (
              <div
                key={student._id.toString()}
                className="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl border border-gray-100 hover:bg-gray-100/60 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-50 text-red-400 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{student.fullName}</p>
                    <p className="text-[10px] text-gray-400">{student.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-700">{(student.points || 0).toLocaleString()} pts</p>
                  <p className="text-[10px] text-gray-400">{(student.accuracy || 0).toFixed(1)}% acc</p>
                </div>
              </div>
            ))}
            {lowestPerformers.length === 0 && (
              <div className="text-center py-8 text-sm text-gray-400">No student data available yet.</div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Full Leaderboard Table */}
      <GlassCard className="p-0 overflow-hidden bg-white border border-gray-200/90 shadow-card">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-900">School Leaderboard</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold border-b border-gray-100">
              <tr>
                <th className="px-6 py-3">Rank</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Points</th>
                <th className="px-6 py-3">Accuracy</th>
                <th className="px-6 py-3">Questions</th>
                <th className="px-6 py-3">Competitions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((student, index) => (
                <tr key={student._id.toString()} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3 font-bold text-gray-900">#{index + 1}</td>
                  <td className="px-6 py-3 font-semibold text-gray-900">{student.fullName}</td>
                  <td className="px-6 py-3 font-bold text-brand-primary">{(student.points || 0).toLocaleString()}</td>
                  <td className="px-6 py-3">{(student.accuracy || 0).toFixed(1)}%</td>
                  <td className="px-6 py-3">{student.totalQuestions || 0}</td>
                  <td className="px-6 py-3">{student.competitionsJoined || 0}</td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">No students enrolled yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
