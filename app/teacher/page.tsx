import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { Sparkles, BookOpen, BarChart3, MessageSquare } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

export default async function TeacherPage() {
  const session = await auth();
  if (!session) redirect('/sign-in');

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in py-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-primary via-indigo-900 to-slate-900 p-8 md:p-12 text-white shadow-2xl">
        <div className="absolute -top-12 -right-12 h-64 w-64 rounded-full bg-brand-light/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold backdrop-blur-md border border-white/15 text-amber-300">
            <Sparkles className="h-4 w-4" /> Coming Soon
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
            Teacher Portal
          </h1>
          <p className="text-sm md:text-base text-gray-300 max-w-xl leading-relaxed">
            Welcome, <strong className="text-white">{session.user.name}</strong>! The Teacher Portal is currently under development. Once available, you&apos;ll have access to powerful tools for managing your classroom.
          </p>
        </div>
      </div>

      {/* Upcoming Features */}
      <GlassCard className="p-6 md:p-8 bg-white border border-gray-200/80 shadow-card space-y-6">
        <h2 className="text-lg font-bold text-gray-900">What to expect</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: BookOpen,
              title: 'Assignments',
              description: 'Create and manage assignments for your students.',
            },
            {
              icon: BarChart3,
              title: 'Analytics',
              description: 'Track student progress with detailed performance reports.',
            },
            {
              icon: MessageSquare,
              title: 'Communication',
              description: 'Stay connected with students and school admins.',
            },
          ].map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2 hover:border-brand-primary/30 hover:bg-brand-lighter/10 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-lighter/60 text-brand-primary flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">{feature.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl bg-blue-50/80 border border-blue-200 p-4 text-xs text-blue-900 leading-relaxed">
          <strong>Stay tuned!</strong> We&apos;re building a comprehensive set of tools tailored specifically for teachers. You&apos;ll be notified once the Teacher Portal is live.
        </div>
      </GlassCard>
    </div>
  );
}
