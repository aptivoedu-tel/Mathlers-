import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/db/mongodb';
import ResultModel, { IResult } from '@/models/Result';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { Award } from 'lucide-react';

type CertificateResult = Pick<IResult, 'score' | 'totalMarks' | 'completedAt'> & {
  _id: { toString(): string };
};

export default async function CertificatesPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/sign-in');
  }

  await connectDB();

  const results = (await ResultModel.find({
    student: session.user.id,
  })
  .sort({ completedAt: -1 })
  .limit(20)) as unknown as CertificateResult[];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="My Certificates"
        subtitle="View and download certificates earned from competitions and assessments."
        breadcrumbs={[
          { label: 'Student', href: '/student/dashboard' },
          { label: 'Certificates' }
        ]}
      />

      {results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {results.map((result) => (
            <GlassCard key={result._id.toString()} className="p-5 bg-white border border-gray-200/80 shadow-xs hover:shadow-card transition-all">
              <div className="text-center">
                <div className="w-12 h-12 bg-brand-lighter/60 text-brand-primary rounded-xl mx-auto mb-3 flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Competition Result</h3>
                <p className="text-xs text-gray-500 mb-3">
                  Score: <span className="font-bold text-gray-900">{result.score}/{result.totalMarks}</span>
                </p>
                <p className="text-[10px] text-gray-400 mb-3">
                  {new Date(result.completedAt).toLocaleDateString()}
                </p>
                <p className="text-[10px] text-gray-400 leading-relaxed">Certificates are shown here once an event organizer issues them.</p>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard className="p-6 bg-white border border-gray-200/90 shadow-card">
          <EmptyState
            icon="file"
            title="No Certificates Yet"
            description="Complete competitions to earn certificates. Your achievements will appear here."
          />
        </GlassCard>
      )}
    </div>
  );
}
