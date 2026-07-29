import { auth, isAdmin } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/db/mongodb';
import CompetitionModel from '@/models/Competition';
import GlassCard from '@/components/ui/GlassCard';
import PrimaryButton from '@/components/ui/PrimaryButton';
import PageHeader from '@/components/ui/PageHeader';
import StatusChip from '@/components/ui/StatusChip';
import EmptyState from '@/components/ui/EmptyState';
import { Plus, Edit, Trophy } from 'lucide-react';
import Link from 'next/link';

type CompetitionRow = {
  _id: { toString(): string };
  name: string;
  description?: string;
  category?: string;
  status?: string;
  schedule?: { competitionStartDate?: Date };
  competition?: { startDate?: Date };
  analytics?: { totalRegistrations?: number; registrations?: number };
  eligibility?: { maxParticipants?: number };
  registration?: { maxParticipants?: number };
  sections?: unknown[];
  rounds?: unknown[];
};

export default async function CompetitionsPage() {
  const session = await auth();

  if (!session || !isAdmin(session.user.role)) {
    redirect('/sign-in');
  }

  await connectDB();

  const competitions = await CompetitionModel.find()
    .select('name description category status schedule competition analytics eligibility registration sections rounds createdAt')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean<CompetitionRow[]>();

  const categoryIcon: Record<string, string> = { public: '🌍', grade: '🏫', championship: '🥊' };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Competitions Management"
        subtitle="Manage all public, grade, and championship competitions across the platform."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Competitions' }
        ]}
        actions={
          <Link href="/admin/competitions/create">
            <PrimaryButton size="sm">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Create Competition
            </PrimaryButton>
          </Link>
        }
      />

      <GlassCard className="p-6 bg-white border border-gray-200/90 shadow-card space-y-4">
        <div className="flex items-center justify-between gap-4 pb-2">
          <h2 className="text-base font-bold text-gray-900 tracking-tight">Active & Upcoming Competitions</h2>
        </div>

        {competitions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Competition</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Start Date</th>
                  <th className="py-3 px-3">Registrations</th>
                  <th className="py-3 px-3">Sections</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {competitions.map((comp) => {
                  const startDate = comp.schedule?.competitionStartDate || comp.competition?.startDate;
                  const totalRegs = comp.analytics?.totalRegistrations ?? comp.analytics?.registrations ?? 0;
                  const maxParts = comp.eligibility?.maxParticipants || comp.registration?.maxParticipants || '∞';
                  const sectionCount = comp.sections?.length ?? comp.rounds?.length ?? 0;
                  const cat = String(comp.category || 'public');

                  return (
                    <tr key={comp._id.toString()} className="hover:bg-gray-50/80 transition">
                      <td className="py-3 px-3">
                        <Link href={`/admin/competitions/${comp._id.toString()}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-brand-lighter/60 text-brand-primary rounded-lg flex items-center justify-center shrink-0">
                              <Trophy className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 hover:text-brand-primary transition-colors">{comp.name}</p>
                              <p className="text-[11px] text-gray-400 truncate max-w-xs">{comp.description}</p>
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="py-3 px-3 text-gray-600 font-medium">
                        {categoryIcon[cat]} {cat.toUpperCase()}
                      </td>
                      <td className="py-3 px-3 text-gray-500">
                        {startDate ? new Date(startDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-gray-600 font-medium">{totalRegs} / {maxParts}</td>
                      <td className="py-3 px-3 text-gray-600">{sectionCount} Sections</td>
                      <td className="py-3 px-3">
                        <StatusChip
                          variant={
                            String(comp.status) === 'in_progress' ? 'success' :
                            String(comp.status) === 'registration_open' ? 'info' : 'neutral'
                          }
                        >
                          {String(comp.status).replace(/_/g, ' ').toUpperCase()}
                        </StatusChip>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex justify-end items-center gap-2">
                          <Link href={`/admin/competitions/${comp._id.toString()}/results`} title="View Leaderboard">
                            <button className="px-2.5 py-1 hover:bg-amber-50 text-amber-600 rounded-lg transition border border-amber-200/60 flex items-center gap-1 font-semibold text-[11px]">
                              <Trophy className="w-3.5 h-3.5" /> Results
                            </button>
                          </Link>
                          <Link href={`/admin/competitions/${comp._id.toString()}/edit`} title="Edit Competition">
                            <button className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-gray-900 rounded-lg transition">
                              <Edit className="w-4 h-4" />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon="file"
            title="No Competitions Found"
            description="Create your first competition to get started with live events."
          />
        )}
      </GlassCard>
    </div>
  );
}
