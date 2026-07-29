'use client';

import { useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/ui/PageHeader';
import { Trophy, Medal, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LeaderboardEntry {
  id: string;
  name: string;
  playerId: string;
  score: number;
}

export interface CurrentUserLeaderboardData {
  id: string;
  points: number;
}

export default function LeaderboardClient({
  nationalLeaderboard,
  schoolLeaderboard,
  userNationalRank,
  userSchoolRank,
  currentUser,
  hasSchool
}: {
  nationalLeaderboard: LeaderboardEntry[];
  schoolLeaderboard: LeaderboardEntry[];
  userNationalRank: number | null;
  userSchoolRank: number | null;
  currentUser: CurrentUserLeaderboardData | null;
  hasSchool: boolean;
}) {
  const [activeTab, setActiveTab] = useState<'national' | 'school'>(hasSchool ? 'school' : 'national');
  
  const currentLeaderboard = activeTab === 'national' ? nationalLeaderboard : schoolLeaderboard;
  const currentRank = activeTab === 'national' ? userNationalRank : userSchoolRank;
  
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Leaderboard"
        subtitle="See how you rank against other Mathlers students nationwide."
        breadcrumbs={[
          { label: 'Student', href: '/student/dashboard' },
          { label: 'Leaderboard' }
        ]}
      />
      
      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('national')}
          className={cn(
            "px-3.5 py-2 rounded-xl font-semibold text-xs transition-all",
            activeTab === 'national' 
              ? "bg-brand-primary text-white shadow-xs" 
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          )}
        >
          National
        </button>
        <button
          onClick={() => setActiveTab('school')}
          className={cn(
            "px-3.5 py-2 rounded-xl font-semibold text-xs transition-all",
            activeTab === 'school' 
              ? "bg-brand-primary text-white shadow-xs" 
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          )}
        >
          My School
        </button>
      </div>

      <GlassCard className="p-6 bg-white border border-gray-200/90 shadow-card">
        <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 tracking-tight">
              {activeTab === 'national' ? 'Your National Rank' : 'Your School Rank'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {activeTab === 'school' && !hasSchool 
                ? "You are not associated with any school." 
                : "Keep practicing to improve your ranking!"}
            </p>
          </div>
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-brand-primary">
                {activeTab === 'school' && !hasSchool ? '-' : `#${currentRank || '-'}`}
              </p>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-1">
                {activeTab === 'national' ? 'National Rank' : 'School Rank'}
              </p>
            </div>
            {currentUser && (
              <div className="text-center hidden sm:block">
                <p className="text-3xl font-bold text-gray-900">{currentUser.points || 0}</p>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-1">Total Points</p>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6 bg-white border border-gray-200/90 shadow-card space-y-4">
        <h2 className="text-base font-bold text-gray-900 tracking-tight">
          {activeTab === 'national' ? 'Top National Performers' : 'Top School Performers'}
        </h2>
        
        {activeTab === 'school' && !hasSchool ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">You are not enrolled in any school.</h3>
          </div>
        ) : (
          <div className="space-y-4">
            {currentLeaderboard.map((entry, index) => {
              const isCurrentUser = entry.id === currentUser?.id;
              return (
                <div
                  key={entry.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl transition-all",
                    isCurrentUser ? "bg-brand-lighter border border-brand-primary/20" : "bg-gray-50 hover:bg-gray-100"
                  )}
                >
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg",
                      index === 0 ? "bg-yellow-100 text-yellow-600" :
                      index === 1 ? "bg-gray-200 text-gray-600" :
                      index === 2 ? "bg-amber-100 text-amber-700" :
                      "bg-white text-gray-400 border border-gray-200 shadow-sm"
                    )}>
                      {index === 0 ? <Trophy className="w-6 h-6" /> :
                       index === 1 ? <Medal className="w-6 h-6" /> :
                       index === 2 ? <Award className="w-6 h-6" /> :
                       index + 1}
                    </div>
                    <div>
                      <p className={cn("font-bold", isCurrentUser ? "text-brand-dark" : "text-gray-900")}>
                        {entry.name}
                      </p>
                      <p className="text-sm text-gray-500 font-mono">{entry.playerId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-xl font-bold", isCurrentUser ? "text-brand-primary" : "text-gray-900")}>
                      {entry.score}
                    </p>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Points</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
