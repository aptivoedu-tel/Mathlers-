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
  coverImage?: string;
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
  // Show all published practice books for now (for testing)
  queryOr.push({});

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
      .select('name description difficulty type subject grade questions timeLimit coverImage')
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {(practiceSets as PracticeSetItem[]).map((set) => (
              <div key={set._id.toString()} className="group relative">
                <Link href={`/student/practice/${set._id}`} className="block">
                  <div className="relative aspect-[2/3] max-h-[250px] rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    {set.coverImage ? (
                      <img
                        src={set.coverImage}
                        alt={set.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-brand-primary to-brand-primary/80 flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-white/80" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="font-bold text-white text-sm line-clamp-2 mb-1">{set.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-white/80">
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {set.questions?.length || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {Math.round((set.timeLimit || 1800) / 60)}m
                        </span>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2">
                      <StatusChip
                        variant={
                          set.difficulty === 'easy' ? 'success' :
                          set.difficulty === 'medium' ? 'warning' :
                          set.difficulty === 'hard' ? 'danger' : 'neutral'
                        }
                        className="text-[10px]"
                      >
                        {set.difficulty || 'mixed'}
                      </StatusChip>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="flex flex-wrap gap-1">
                      {set.subject && (
                        <span className="text-[10px] bg-brand-lighter/70 text-brand-primary font-semibold px-2 py-0.5 rounded-full">
                          {set.subject.name}
                        </span>
                      )}
                      {set.grade && (
                        <span className="text-[10px] bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full">
                          {set.grade.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1">{set.description || 'No description'}</p>
                  </div>
                </Link>
              </div>
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
