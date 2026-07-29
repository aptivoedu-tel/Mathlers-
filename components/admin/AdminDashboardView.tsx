"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users, Trophy, Target, Award, Search, Plus, Share2, Printer,
  Mail, Bell, Check, Calendar, MoreHorizontal, ArrowRight, Activity,
  Star, ChevronRight, TrendingUp, Sparkles, Filter
} from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import GlassCard from '@/components/ui/GlassCard';
import TabPills from '@/components/ui/TabPills';
import StatusChip from '@/components/ui/StatusChip';
import AvatarCluster from '@/components/ui/AvatarCluster';
import PrimaryButton from '@/components/ui/PrimaryButton';

interface AdminDashboardViewProps {
  studentsCount: number;
  competitionsCount: number;
  questionsCount: number;
  resultsCount: number;
}

export default function AdminDashboardView({
  studentsCount,
  competitionsCount,
  questionsCount,
  resultsCount,
}: AdminDashboardViewProps) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { label: 'Overview', value: 'Overview' },
    { label: 'Student Journeys', value: 'Student Journeys' },
    { label: 'Competitions', value: 'Competitions', count: competitionsCount },
    { label: 'Question Bank', value: 'Question Bank', count: questionsCount },
    { label: 'Analytics', value: 'Analytics' },
    { label: 'Reports', value: 'Reports' },
  ];

  const adminTeam = [
    { initials: 'AK', alt: 'Alex Kim' },
    { initials: 'SJ', alt: 'Sarah Jenkins' },
    { initials: 'MR', alt: 'Marcus Rodriguez' },
    { initials: 'EL', alt: 'Emma Liu' },
    { initials: 'DC', alt: 'David Chen' },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ─── Top Bar & Navigation (SugarCRM Header Pattern) ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-gray-200/80">
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Student Journeys</h1>
          <TabPills
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
            size="sm"
          />
        </div>

        {/* Top Right Utilities / Actions */}
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search portal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-xs bg-white border border-gray-200 rounded-full focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 w-48 transition-all"
            />
          </div>
          <button className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500 transition shadow-xs" title="Add">
            <Plus className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500 transition shadow-xs" title="Share">
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500 transition shadow-xs" title="Print">
            <Printer className="w-3.5 h-3.5" />
          </button>
          <button className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500 transition shadow-xs" title="Messages">
            <Mail className="w-3.5 h-3.5" />
          </button>
          <button className="relative w-8 h-8 rounded-full bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500 transition shadow-xs" title="Notifications">
            <Bell className="w-3.5 h-3.5" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-primary ring-2 ring-white" />
          </button>
        </div>
      </div>

      {/* ─── Metric Stat Cards Row ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={<Users className="w-5 h-5 text-brand-primary" />}
          value={studentsCount}
          label="Active Students"
          trend="+12% this month"
        />
        <StatCard
          icon={<Trophy className="w-5 h-5 text-brand-primary" />}
          value={competitionsCount}
          label="Live Competitions"
          trend="+3 new"
        />
        <StatCard
          icon={<Target className="w-5 h-5 text-brand-primary" />}
          value={questionsCount}
          label="Question Bank"
          trend="+45 added"
        />
        <StatCard
          icon={<Award className="w-5 h-5 text-brand-primary" />}
          value={resultsCount}
          label="Completed Tests"
          trend="+89 completed"
        />
      </div>

      {/* ─── SugarCRM Style Visual Flow / Workflow Diagram ─── */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Active Curriculum Workflow</h2>
            <p className="text-xs text-gray-500 mt-0.5">Live student case handling & progression lifecycle</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-400">Assigned Team:</span>
            <AvatarCluster avatars={adminTeam} max={4} size="sm" />
          </div>
        </div>

        {/* Diagram Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 relative">
          {/* Stage 1 Column */}
          <div className="bg-gray-50/70 border border-gray-200/60 rounded-xl p-4 space-y-3 relative">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Stage 1: Allocation</div>
            
            {/* Card 1 */}
            <div className="bg-white border border-gray-200/80 rounded-xl p-3.5 shadow-xs space-y-3 relative group hover:border-brand-primary/40 transition">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">AK</div>
                  <span className="text-xs font-semibold text-gray-800">Allocate Practice to Grade 5</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <Calendar className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-gray-200/80 rounded-xl p-3.5 shadow-xs space-y-3 relative group hover:border-brand-primary/40 transition">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">SJ</div>
                  <span className="text-xs font-semibold text-gray-800">Acknowledge Case Receipt</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <Calendar className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            <div className="text-[11px] font-semibold text-gray-400 text-center pt-1">Case Allocation</div>
          </div>

          {/* Stage 2 Column */}
          <div className="bg-gray-50/70 border border-gray-200/60 rounded-xl p-4 space-y-3 relative">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Stage 2: Identification</div>

            <div className="bg-white border border-gray-200/80 rounded-xl p-3 shadow-xs flex items-center justify-between text-xs font-medium text-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center">MR</div>
                <span>Identify Issue Category</span>
              </div>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            </div>

            <div className="bg-white border border-gray-200/80 rounded-xl p-3 shadow-xs flex items-center justify-between text-xs font-medium text-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center">EL</div>
                <span>Identify Issue Severity</span>
              </div>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            </div>

            <div className="bg-white border border-gray-200/80 rounded-xl p-3 shadow-xs flex items-center justify-between text-xs font-medium text-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold flex items-center justify-center">DC</div>
                <span>Allocate Resolution Team</span>
              </div>
              <MoreHorizontal className="w-3.5 h-3.5 text-gray-400" />
            </div>

            <div className="text-[11px] font-semibold text-gray-400 text-center pt-1">Issue Identification</div>
          </div>

          {/* Stage 3 Column */}
          <div className="bg-gray-50/70 border border-gray-200/60 rounded-xl p-4 space-y-3 relative">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Stage 3: Resolution</div>

            <div className="bg-white border border-gray-200/80 rounded-xl p-3 shadow-xs flex items-center gap-2 text-xs font-medium text-gray-700">
              <Plus className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>Identify Dependencies</span>
            </div>

            <div className="bg-white border border-gray-200/80 rounded-xl p-3 shadow-xs flex items-center gap-2 text-xs font-medium text-gray-700">
              <Plus className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>Identify Issue Solution</span>
            </div>

            <div className="bg-white border border-gray-200/80 rounded-xl p-3.5 shadow-xs flex items-center justify-between text-xs font-bold text-gray-900 border-l-4 border-l-brand-primary">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center">AK</div>
                <span>Estimate Resolution Time</span>
              </div>
              <MoreHorizontal className="w-3.5 h-3.5 text-gray-400" />
            </div>

            <div className="text-[11px] font-semibold text-gray-400 text-center pt-1">Technical Resolution</div>
          </div>

          {/* Stage 4 Column */}
          <div className="bg-gray-50/70 border border-gray-200/60 rounded-xl p-4 space-y-3 relative">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Stage 4: Completion</div>

            <div className="bg-gray-900 text-white rounded-xl p-4 shadow-sm space-y-1">
              <div className="text-xs font-bold">Request Processing</div>
              <p className="text-[11px] text-gray-300">Auto-grading & Score publishing active</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white border border-gray-200/80 rounded-xl p-3 text-center text-xs font-medium text-gray-700">
                Problem Resolution
              </div>
              <div className="bg-white border border-gray-200/80 rounded-xl p-3 text-center text-xs font-medium text-gray-700">
                Student Verification
              </div>
            </div>

            <div className="text-[11px] font-semibold text-gray-400 text-center pt-1">New Tasks</div>
          </div>
        </div>
      </div>

      {/* ─── SugarCRM Style "Suggested Knowledge" & Recent Activity Table ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200/90 rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Suggested Knowledge & Topics</h2>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600">
                <Plus className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600">
                <Share2 className="w-3.5 h-3.5" />
              </button>
              <button className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600">
                <Printer className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3 w-8"></th>
                  <th className="py-3 px-3">Subject</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Start Date</th>
                  <th className="py-3 px-3">End Date</th>
                  <th className="py-3 px-3">Assigned Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                <tr className="hover:bg-gray-50/80 transition">
                  <td className="py-3 px-3"><Star className="w-3.5 h-3.5 text-gray-300 hover:text-amber-400 cursor-pointer" /></td>
                  <td className="py-3 px-3 font-semibold text-gray-900">Design Sprint Math Module</td>
                  <td className="py-3 px-3"><StatusChip variant="info">Executed</StatusChip></td>
                  <td className="py-3 px-3 text-gray-500">2026-09-30 01:12</td>
                  <td className="py-3 px-3 text-gray-500">2026-10-01</td>
                  <td className="py-3 px-3 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center">AK</div>
                    <span>Alex Kim</span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50/80 transition">
                  <td className="py-3 px-3"><Star className="w-3.5 h-3.5 text-amber-400 cursor-pointer" /></td>
                  <td className="py-3 px-3 font-semibold text-gray-900">Algebraic Fundamentals Review</td>
                  <td className="py-3 px-3"><StatusChip variant="danger">Scheduled</StatusChip></td>
                  <td className="py-3 px-3 text-gray-500">2026-10-01 09:00</td>
                  <td className="py-3 px-3 text-gray-500">2026-10-05</td>
                  <td className="py-3 px-3 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center justify-center">SJ</div>
                    <span>Sarah Jenkins</span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50/80 transition">
                  <td className="py-3 px-3"><Star className="w-3.5 h-3.5 text-gray-300 hover:text-amber-400 cursor-pointer" /></td>
                  <td className="py-3 px-3 font-semibold text-gray-900">Championship Pass Verification</td>
                  <td className="py-3 px-3"><StatusChip variant="success">Completed</StatusChip></td>
                  <td className="py-3 px-3 text-gray-500">2026-07-28 14:00</td>
                  <td className="py-3 px-3 text-gray-500">2026-07-29</td>
                  <td className="py-3 px-3 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center">MR</div>
                    <span>Marcus Rodriguez</span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50/80 transition">
                  <td className="py-3 px-3"><Star className="w-3.5 h-3.5 text-gray-300 hover:text-amber-400 cursor-pointer" /></td>
                  <td className="py-3 px-3 font-semibold text-gray-900">Geometry Section Assessment</td>
                  <td className="py-3 px-3"><StatusChip variant="warning">In Review</StatusChip></td>
                  <td className="py-3 px-3 text-gray-500">2026-08-05 10:30</td>
                  <td className="py-3 px-3 text-gray-500">2026-08-10</td>
                  <td className="py-3 px-3 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center">EL</div>
                    <span>Emma Liu</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Management Actions */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-card space-y-4">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3">
            <Link href="/admin/questions" className="p-3.5 bg-gray-50 hover:bg-gray-100/80 border border-gray-200/60 rounded-xl transition flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-brand-lighter/60 text-brand-primary flex items-center justify-center group-hover:scale-105 transition">
                <Target className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900">Question Bank</p>
                <p className="text-[11px] text-gray-500 truncate">Create & edit math questions</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
            </Link>

            <Link href="/admin/competitions/create" className="p-3.5 bg-gray-50 hover:bg-gray-100/80 border border-gray-200/60 rounded-xl transition flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900">Create Competition</p>
                <p className="text-[11px] text-gray-500 truncate">Start new student event</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
            </Link>

            <Link href="/admin/students" className="p-3.5 bg-gray-50 hover:bg-gray-100/80 border border-gray-200/60 rounded-xl transition flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900">Manage Students</p>
                <p className="text-[11px] text-gray-500 font-normal truncate">View active enrollments</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
            </Link>

            <Link href="/admin/analytics" className="p-3.5 bg-gray-50 hover:bg-gray-100/80 border border-gray-200/60 rounded-xl transition flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900">View Analytics</p>
                <p className="text-[11px] text-gray-500 truncate">Platform engagement insights</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
