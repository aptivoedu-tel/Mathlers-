import connectDB from '@/lib/db/mongodb';
import PracticeSetModel from '@/models/PracticeSet';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import GlassCard from '@/components/ui/GlassCard';
import StatusChip from '@/components/ui/StatusChip';
import EmptyState from '@/components/ui/EmptyState';
import { BookOpen, Clock3, FileQuestion, Layers3 } from 'lucide-react';

export default async function LearningPage() {
  await connectDB();

  const practiceSets = await PracticeSetModel.find()
    .populate('subject', 'name')
    .populate('grade', 'name')
    .sort({ createdAt: -1 })
    .limit(12)
    .lean();
  const published = practiceSets.filter((set) => set.isPublished).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Learning"
        subtitle="Review the practice books currently available to Mathlers students."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Learning' }
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard icon={<Layers3 className="w-5 h-5 text-brand-primary" />} value={practiceSets.length} label="Practice Books" />
        <StatCard icon={<BookOpen className="w-5 h-5 text-brand-primary" />} value={published} label="Published" />
        <StatCard icon={<FileQuestion className="w-5 h-5 text-brand-primary" />} value={practiceSets.reduce((total, set) => total + set.questions.length, 0)} label="Questions Included" />
      </div>

      <GlassCard className="p-0 bg-white border border-gray-200/90 shadow-card overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/80">
          <h2 className="text-xs font-bold text-gray-900 tracking-tight">Recent Practice Books</h2>
        </div>
        {practiceSets.map((set) => {
          const subject = set.subject as unknown as { name?: string } | null;
          const grade = set.grade as unknown as { name?: string } | null;
          return (
            <div key={set._id.toString()} className="flex flex-col gap-3 border-b border-gray-50 px-5 py-3.5 last:border-0 sm:flex-row sm:items-center sm:justify-between hover:bg-gray-50/60 transition">
              <div>
                <p className="text-xs font-bold text-gray-900">{set.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{subject?.name || 'Subject'} · {grade?.name || 'Grade'} · {set.questions.length} questions</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                  <Clock3 className="h-3 w-3" /> {Math.round(set.timeLimit / 60)} min
                </span>
                <StatusChip variant={set.isPublished ? 'success' : 'neutral'}>
                  {set.isPublished ? 'Published' : 'Draft'}
                </StatusChip>
              </div>
            </div>
          );
        })}
        {!practiceSets.length && (
          <div className="p-6">
            <EmptyState
              icon="file"
              title="No Practice Books"
              description="Practice books will appear here once they are created."
            />
          </div>
        )}
      </GlassCard>
    </div>
  );
}
