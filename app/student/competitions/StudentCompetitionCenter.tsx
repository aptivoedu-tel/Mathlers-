'use client';

import React, { useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import PrimaryButton from '@/components/ui/PrimaryButton';
import PageHeader from '@/components/ui/PageHeader';
import { Trophy, Calendar, Users, Layers, Tag, CheckCircle2, Search, Download, X } from 'lucide-react';
import Link from 'next/link';
import JoinWithCodeSection from './JoinWithCodeSection';

type CompetitionTab = 'upcoming' | 'my' | 'code' | 'live' | 'completed';

export interface CompetitionCard {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  status: string;
  schedule?: { competitionStartDate?: string };
  analytics?: { totalRegistrations?: number };
  sections?: unknown[];
}

export interface EnrollmentSummary {
  participantId?: string;
  status?: string;
}

interface CompetitionPass {
  competition: CompetitionCard;
  enrollment: EnrollmentSummary;
}

interface Props {
  competitions: CompetitionCard[];
  enrolledCompetitions: CompetitionCard[];
  enrollmentMap: Record<string, EnrollmentSummary>;
  studentName: string;
}

export default function StudentCompetitionCenter({
  competitions,
  enrolledCompetitions,
  enrollmentMap,
  studentName,
}: Props) {
  const [activeTab, setActiveTab] = useState<CompetitionTab>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPass, setSelectedPass] = useState<CompetitionPass | null>(null);

  const liveCompetitions = competitions.filter(c => c.status === 'in_progress');
  const completedCompetitions = competitions.filter(c => c.status === 'completed');
  const upcomingCompetitions = competitions.filter(c => c.status === 'registration_open' || c.status === 'draft');

  const filteredCompetitions = (
    activeTab === 'upcoming' ? upcomingCompetitions :
    activeTab === 'my' ? enrolledCompetitions :
    activeTab === 'live' ? liveCompetitions :
    activeTab === 'completed' ? completedCompetitions :
    competitions
  ).filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.description?.toLowerCase().includes(searchQuery.toLowerCase()));

  const categoryIcon: Record<string, string> = { public: '🌍', grade: '🏫', championship: '🥊' };
  const tabs: { id: CompetitionTab; label: string; count?: number }[] = [
    { id: 'upcoming', label: 'Upcoming Competitions', count: upcomingCompetitions.length },
    { id: 'my', label: 'My Competitions', count: enrolledCompetitions.length },
    { id: 'code', label: '🏷 Join with Code' },
    { id: 'live', label: '🔴 Live Competitions', count: liveCompetitions.length },
    { id: 'completed', label: 'Completed', count: completedCompetitions.length },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <PageHeader
        title="Competition Center"
        subtitle="Discover, join, and track your performance in active Mathlers competitions."
        breadcrumbs={[
          { label: 'Student', href: '/student/dashboard' },
          { label: 'Competitions' }
        ]}
        actions={
          <button
            onClick={() => setActiveTab('code')}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white rounded-xl font-semibold text-xs shadow-sm hover:bg-brand-dark transition-all"
          >
            <Tag className="w-3.5 h-3.5" /> Join with Code
          </button>
        }
      />

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-gray-100">
        <div className="flex gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold text-xs transition-all ${
                activeTab === tab.id
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      {activeTab !== 'code' && (
        <div className="relative max-w-md">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search competitions by name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white/80 backdrop-blur-md rounded-xl border border-gray-200 focus:border-brand-primary outline-none text-sm text-gray-900 placeholder-gray-500 shadow-sm"
          />
        </div>
      )}

      {/* Tab Content — Join with Code */}
      {activeTab === 'code' && (
        <JoinWithCodeSection studentName={studentName} />
      )}

      {/* Tab Content — Competition Grid */}
      {activeTab !== 'code' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompetitions.map((comp) => {
            const isEnrolled = !!enrollmentMap[comp._id.toString()];
            const enrollment = enrollmentMap[comp._id.toString()];
            const isConfirmed = ['approved', 'in_progress', 'completed'].includes(enrollment?.status || '');
            const startDate = comp.schedule?.competitionStartDate
              ? new Date(comp.schedule.competitionStartDate).toLocaleDateString()
              : 'TBA';
            const cat = String(comp.category || 'public');

            return (
              <GlassCard key={comp._id.toString()} className="p-6 h-full flex flex-col hover:shadow-xl transition-all duration-300 relative group">
                <Link href={`/student/competitions/${comp._id.toString()}`} className="block">
                  <div className="relative mb-4">
                    <div className="w-full h-32 bg-gradient-to-br from-brand-primary to-brand-dark rounded-xl flex items-center justify-center">
                      <Trophy className="w-12 h-12 text-white opacity-80 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="absolute top-3 left-3 text-xs px-3 py-1 rounded-full font-semibold bg-white/90 text-gray-700">
                      {categoryIcon[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </span>
                    <span className={`absolute top-3 right-3 text-xs px-3 py-1 rounded-full font-semibold ${
                      String(comp.status) === 'in_progress' ? 'bg-green-500 text-white animate-pulse' :
                      String(comp.status) === 'registration_open' ? 'bg-blue-500 text-white' :
                      'bg-gray-500 text-white'
                    }`}>
                      {String(comp.status).replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-1">{comp.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">{comp.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-brand-primary" />
                      <span>{startDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span>{comp.analytics?.totalRegistrations || 0} Participants</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Layers className="w-4 h-4 text-orange-500" />
                      <span>{comp.sections?.length || 0} Sections</span>
                    </div>
                  </div>
                </Link>

                {isEnrolled && isConfirmed ? (
                  <div className="space-y-3 pt-2 border-t border-gray-100 mt-auto">
                    <div className="p-3 bg-green-50 rounded-xl border border-green-200 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-green-700 font-semibold text-xs">
                          <CheckCircle2 className="w-4 h-4" /> Enrolled
                        </div>
                        <p className="font-mono text-xs text-gray-600 font-bold mt-0.5">
                          ID: {enrollment?.participantId}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPass({ competition: comp, enrollment });
                        }}
                        className="p-2 bg-gray-900 hover:bg-brand-primary text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm text-xs font-medium"
                        title="View printable competition pass"
                      >
                        <Download className="w-4 h-4" />
                        <span>Pass</span>
                      </button>
                    </div>

                    {comp.status === 'in_progress' ? (
                      <Link href={`/student/competitions/${comp._id.toString()}/start`} className="block">
                        <div className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-center font-bold text-xs shadow-md transition-all animate-pulse">
                          🚀 Enter Live Exam Now →
                        </div>
                      </Link>
                    ) : comp.status === 'completed' || enrollment?.status === 'completed' ? (
                      <Link href={`/student/competitions/${comp._id.toString()}/results`} className="block">
                        <div className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-center font-semibold text-xs transition-colors">
                          🏆 View Score & Results →
                        </div>
                      </Link>
                    ) : (
                      <Link href={`/student/competitions/${comp._id.toString()}`} className="block">
                        <div className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-center font-semibold text-xs transition-colors">
                          View Competition →
                        </div>
                      </Link>
                    )}
                  </div>
                ) : isEnrolled ? (
                  <div className="mt-auto space-y-3 border-t border-gray-100 pt-4"><div className={`rounded-xl border p-3 text-sm ${enrollment?.status === 'pending' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-red-200 bg-red-50 text-red-700'}`}>{enrollment?.status === 'pending' ? 'Enrollment is awaiting approval.' : 'This enrollment is not approved.'}</div><Link href={`/student/competitions/${comp._id.toString()}`} className="block"><div className="w-full rounded-lg bg-gray-100 py-2 text-center text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-200">View Competition →</div></Link></div>
                ) : (
                  <Link href={`/student/competitions/${comp._id.toString()}`} className="block mt-auto">
                    <div className="w-full py-3 bg-brand-primary text-white rounded-xl text-center font-semibold text-sm group-hover:bg-brand-dark transition-colors">
                      View Details & Enroll →
                    </div>
                  </Link>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}

      {selectedPass && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full relative shadow-2xl space-y-6">
            <button
              onClick={() => setSelectedPass(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Pass Printable Card */}
            <div className="print-pass-card p-6 bg-gradient-to-br from-brand-dark via-brand-primary to-indigo-900 rounded-2xl text-white shadow-xl space-y-4 relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 opacity-10">
                <Trophy className="w-48 h-48 text-white" />
              </div>

              <div className="flex justify-between items-center border-b border-white/20 pb-3">
                <span className="font-extrabold tracking-wider text-xs uppercase bg-white/20 px-3 py-1 rounded-full">
                  OFFICIAL COMPETITION PASS
                </span>
                <span className="text-xs text-white/70 font-semibold">Participant pass</span>
              </div>

              <div>
                <p className="text-xs text-white/70 uppercase">Competition</p>
                <h4 className="text-xl font-bold">{selectedPass.competition.name}</h4>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-white/70">Student Name</p>
                  <p className="font-semibold">{studentName}</p>
                </div>
                <div>
                  <p className="text-xs text-white/70">Participant ID</p>
                  <p className="font-mono font-bold text-yellow-300">{selectedPass.enrollment?.participantId}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl flex items-center justify-between text-gray-900 shadow-inner">
                <div>
                  <p className="text-xs text-gray-500">Participant ID</p>
                  <p className="font-mono text-sm font-bold text-brand-primary mt-1">
                    {selectedPass.enrollment?.participantId}
                  </p>
                </div>
                <p className="max-w-36 text-right text-xs text-gray-500">Keep this ID available for event check-in.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <PrimaryButton onClick={() => window.print()} className="w-full">
                <Download className="w-4 h-4 mr-2" /> Print / Save Pass
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {activeTab !== 'code' && filteredCompetitions.length === 0 && (
        <GlassCard className="p-12 text-center max-w-lg mx-auto">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Competitions Found</h3>
          <p className="text-gray-600 text-sm mb-4">
            {searchQuery ? `No competitions matching "${searchQuery}"` : `There are no competitions in this section right now.`}
          </p>
          <button
            onClick={() => setActiveTab('code')}
            className="px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-semibold hover:bg-brand-dark transition-colors"
          >
            Have a Code? Join Private Event
          </button>
        </GlassCard>
      )}
    </div>
  );
}
