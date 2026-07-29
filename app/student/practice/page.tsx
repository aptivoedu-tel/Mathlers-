import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/db/mongodb';
import PracticeSetModel, { IPracticeSet } from '@/models/PracticeSet';
import UserModel from '@/models/User';
import SchoolModel from '@/models/School';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/ui/PageHeader';
import StatusChip from '@/components/ui/StatusChip';
import EmptyState from '@/components/ui/EmptyState';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { BookOpen, Target, Clock, Filter, ArrowRight } from 'lucide-react';
import SubjectModel from '@/models/Subject';
import Link from 'next/link';

type ListItem = { _id: { toString(): string }; name: string };

type PracticeSetItem = {
  _id: { toString(): string };
  name: string;
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed' | 'all';
  type?: string;
  subject?: { name?: string };
  grade?: { name?: string };
  questions?: unknown[];
  timeLimit?: number;
};

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; difficulty?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const session = await auth();

  if (!session) {
    redirect('/sign-in');
  }

  await connectDB();

  const now = new Date();

  const user = await UserModel.findById(session.user.id).select('school');
  let school = null;
  if (user?.school) {
    school = await SchoolModel.findById(user.school).select('assignedPracticeSets');
  }

  const queryOr: any[] = [];
  if (school && school.assignedPracticeSets) {
    queryOr.push({ _id: { $in: school.assignedPracticeSets } });
  } else {
    // Note: If no school, we fallback to showing all published practice sets
    // Since PracticeSets don't have a status, we assume isPublished: true is enough.
    // The query object structure dictates we don't necessarily need a fallback OR here, 
    // but we can add an empty object to represent "match all" for the $or.
    queryOr.push({});
  }

  const [practiceSets, subjects] = await Promise.all([
    PracticeSetModel.find({
      isPublished: true,
      $or: queryOr,
      $and: [
        {
          $or: [
            { 'availability.startDate': { $exists: false } },
            { 'availability.startDate': { $lte: now } },
          ],
        },
        {
          $or: [
            { 'availability.endDate': { $exists: false } },
            { 'availability.endDate': { $gte: now } },
          ],
        },
      ],
      ...(resolvedSearchParams.subject ? { subject: resolvedSearchParams.subject } : {}),
      ...(resolvedSearchParams.difficulty && resolvedSearchParams.difficulty !== 'all'
        ? { difficulty: resolvedSearchParams.difficulty as IPracticeSet['difficulty'] }
        : {}),
    })
      .populate('subject', 'name')
      .populate('grade', 'name')
      .select('name description difficulty type subject grade questions timeLimit')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
    SubjectModel.find({ isActive: true }).select('name').sort({ order: 1 }).lean(),
  ]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Practice Arena"
        subtitle="Select a practice book to start improving your problem-solving skills."
        breadcrumbs={[
          { label: 'Student', href: '/student/dashboard' },
          { label: 'Practice Arena' }
        ]}
      />

      <GlassCard className="p-6 bg-white border border-gray-200/90 shadow-card space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900 tracking-tight">Available Practice Sets</h2>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Subject:
            </span>
            <Link href={`/student/practice?difficulty=${resolvedSearchParams.difficulty || ''}`}>
              <span className={`text-xs px-3 py-1.5 rounded-full font-semibold transition cursor-pointer ${!resolvedSearchParams.subject ? 'bg-brand-primary text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'}`}>
                All
              </span>
            </Link>
            {(subjects as ListItem[]).map((sub) => (
              <Link key={sub._id.toString()} href={`/student/practice?subject=${sub._id}&difficulty=${resolvedSearchParams.difficulty || ''}`}>
                <span className={`text-xs px-3 py-1.5 rounded-full font-semibold transition cursor-pointer ${resolvedSearchParams.subject === sub._id.toString() ? 'bg-brand-primary text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'}`}>
                  {sub.name}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {practiceSets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(practiceSets as PracticeSetItem[]).map((set) => (
              <GlassCard key={set._id.toString()} className="p-5 bg-white border border-gray-200/80 hover:border-brand-primary/40 transition-all flex flex-col h-full shadow-xs hover:shadow-card group">
                <div className="flex justify-between items-start mb-3 gap-2">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm group-hover:text-brand-primary transition-colors">{set.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{set.description || 'No description provided.'}</p>
                  </div>
                  <StatusChip
                    variant={
                      set.difficulty === 'easy' ? 'success' :
                      set.difficulty === 'medium' ? 'warning' :
                      set.difficulty === 'hard' ? 'danger' : 'neutral'
                    }
                  >
                    {set.difficulty || 'mixed'}
                  </StatusChip>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {set.subject && (
                    <span className="text-[11px] bg-brand-lighter/70 text-brand-primary font-semibold px-2.5 py-0.5 rounded-full">
                      {set.subject.name}
                    </span>
                  )}
                  {set.grade && (
                    <span className="text-[11px] bg-blue-50 text-blue-600 font-semibold px-2.5 py-0.5 rounded-full">
                      {set.grade.name}
                    </span>
                  )}
                  {set.type && (
                    <span className="text-[11px] bg-purple-50 text-purple-600 font-semibold px-2.5 py-0.5 rounded-full capitalize">
                      {set.type.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500 mb-5 mt-auto pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-gray-400" />
                    <span>{set.questions?.length || 0} Questions</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>{Math.round((set.timeLimit || 1800) / 60)} min</span>
                  </div>
                </div>

                <Link href={`/student/practice/${set._id}`}>
                  <PrimaryButton size="sm" className="w-full justify-center gap-1.5">
                    Start Practice <ArrowRight className="w-3.5 h-3.5" />
                  </PrimaryButton>
                </Link>
              </GlassCard>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="file"
            title="No Practice Books Found"
            description="No practice sets match your selected filters. Try choosing a different subject."
          />
        )}
      </GlassCard>
    </div>
  );
}
