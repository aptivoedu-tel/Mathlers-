import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/db/mongodb';
import ResultModel from '@/models/Result';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/ui/PageHeader';
import { Award, Trophy, Star, Medal, Target, Zap, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default async function AchievementsPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/sign-in');
  }

  await connectDB();

  const results = await ResultModel.find({ student: session.user.id });
  const totalPoints = results.reduce((sum, r) => sum + (r.score || 0), 0);
  const totalAttempts = results.length;
  const testsTaken = results.filter(r => r.type === 'test' || r.type === 'practice').length;
  const competitionAttempts = results.filter(r => r.type === 'competition').length;

  const achievementsList = [
    {
      id: 'first_test',
      title: 'First Steps',
      description: 'Complete your first test or practice session.',
      icon: Star,
      condition: testsTaken > 0,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50'
    },
    {
      id: 'point_collector',
      title: 'Point Collector',
      description: 'Earn a total of 100 points.',
      icon: Zap,
      condition: totalPoints >= 100,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'math_wiz',
      title: 'Math Wiz',
      description: 'Earn a total of 500 points.',
      icon: Trophy,
      condition: totalPoints >= 500,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'accuracy_master',
      title: 'Sharpshooter',
      description: 'Achieve 100% accuracy in any test.',
      icon: Target,
      condition: results.some(r => r.accuracy === 100),
      color: 'text-red-500',
      bgColor: 'bg-red-50'
    },
    {
      id: 'dedicated_learner',
      title: 'Dedicated Learner',
      description: 'Complete 10 total tests or practices.',
      icon: Medal,
      condition: totalAttempts >= 10,
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    },
    {
      id: 'champion',
      title: 'Mathlers Champion',
      description: 'Earn a total of 1000 points.',
      icon: Award,
      condition: totalPoints >= 1000,
      color: 'text-brand-primary',
      bgColor: 'bg-brand-lighter/60'
    }
  ];

  const unlockedCount = achievementsList.filter(a => a.condition).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Achievements"
        subtitle="Track your progress and unlock new badges as you improve."
        breadcrumbs={[
          { label: 'Student', href: '/student/dashboard' },
          { label: 'Achievements' }
        ]}
      />

      {/* Progress Summary Card */}
      <GlassCard className="p-6 bg-white border border-gray-200/90 shadow-card">
        <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 tracking-tight">Your Progress</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              You have unlocked <span className="font-bold text-brand-primary">{unlockedCount}</span> out of {achievementsList.length} achievements.
            </p>
          </div>
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{totalPoints}</p>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Total Points</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{testsTaken}</p>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Tests Taken</p>
            </div>
            <div className="text-center hidden sm:block">
              <p className="text-2xl font-bold text-gray-900">{competitionAttempts}</p>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Competitions</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Achievement Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {achievementsList.map((achievement) => {
          const Icon = achievement.icon;
          const isUnlocked = achievement.condition;

          return (
            <GlassCard 
              key={achievement.id} 
              className={cn(
                "p-5 transition-all duration-300 relative overflow-hidden bg-white border border-gray-200/80 shadow-xs hover:shadow-card",
                !isUnlocked && "opacity-60 grayscale-[0.3]"
              )}
            >
              {!isUnlocked && (
                <div className="absolute top-4 right-4">
                  <Lock className="w-4 h-4 text-gray-300" />
                </div>
              )}
              
              <div className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center mb-3",
                isUnlocked ? achievement.bgColor : "bg-gray-100"
              )}>
                <Icon className={cn(
                  "w-5 h-5", 
                  isUnlocked ? achievement.color : "text-gray-400"
                )} />
              </div>
              
              <h3 className="text-sm font-bold text-gray-900 mb-1">
                {achievement.title}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                {achievement.description}
              </p>
              
              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  isUnlocked ? "text-emerald-600" : "text-gray-400"
                )}>
                  {isUnlocked ? '✓ Unlocked' : '🔒 Locked'}
                </span>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
