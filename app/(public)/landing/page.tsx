'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  School,
  Trophy,
  BarChart3,
  FileText,
  Award,
  Building2,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import PublicLayout from '@/components/layouts/PublicLayout';

const features = [
  {
    icon: BookOpen,
    title: 'Focused Practice',
    description: 'Practice mathematics by grade, topic, and skill with instant scoring and structured step guidance.',
  },
  {
    icon: Trophy,
    title: 'Competition Operations',
    description: 'Enroll, follow rulebooks, and complete scheduled competition rounds under secure environment rules.',
  },
  {
    icon: School,
    title: 'School Access Management',
    description: 'Schools provision student accounts, manage teachers, and oversee class participation effortlessly.',
  },
  {
    icon: BarChart3,
    title: 'Dual Rank Leaderboards',
    description: 'Real-time student rank tracking featuring separate National and School leaderboard views.',
  },
  {
    icon: FileText,
    title: 'Curriculum Practice Books',
    description: 'Structured problem sets and practice materials designed to build core mathematical mastery.',
  },
  {
    icon: Award,
    title: 'Certificates & Badges',
    description: 'Automated achievement recognition and certificates of distinction for participating students.',
  },
];

const steps = [
  {
    step: '01',
    title: 'School Organization Provisioning',
    description: 'School administrators submit a registration request and get their verified organization workspace.',
  },
  {
    step: '02',
    title: 'Teacher & Student Provisioning',
    description: 'School admins generate and distribute secure login credentials for their teachers and students.',
  },
  {
    step: '03',
    title: 'Structured Practice & Competitions',
    description: 'Students log in to practice daily, enter official competitions, and earn national rank distinctions.',
  },
];

export default function LandingPage() {
  return (
    <PublicLayout>
      <main className="overflow-hidden">
        {/* ─── HERO SECTION ─── */}
        {/* Fixed nav overlays this section — one shared background, zero seam */}
        <section className="relative bg-gradient-to-b from-white via-brand-lighter/10 to-gray-50/70 px-6 pt-32 pb-20 sm:pt-40 sm:pb-28">
          {/* Fading Grid Pattern Overlay */}
          <div 
            className="absolute inset-0 bg-grid-pattern pointer-events-none"
            style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)' }}
          />
          {/* Subtle radial brand glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,_rgba(var(--brand-primary-rgb),0.07),transparent)] pointer-events-none" />

          <div className="relative mx-auto max-w-5xl text-center">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-lighter/50 px-4 py-1.5 text-xs font-bold text-brand-primary shadow-xs mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Structured Mathematics & Competition Platform</span>
            </div>

            {/* Sail Font Main Heading */}
            <h1 className="text-5xl tracking-tight text-gray-950 sm:text-7xl leading-[1.15]">
              <span className="font-sail">Mathematics</span>,{' '}
              <span className="font-sail bg-gradient-to-r from-brand-primary via-brand-dark to-brand-primary bg-clip-text text-transparent">
                Made Ready for Competition.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-gray-600 font-normal">
              A school-provisioned platform empowering students through targeted skill practice, curriculum alignment, and official national mathematics competitions.
            </p>

            {/* Action Buttons */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/sign-in"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-primary px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-primary/25 transition-all hover:bg-brand-dark hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                Sign in <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/request-access"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white px-7 py-3.5 text-sm font-semibold text-gray-800 shadow-xs transition-all hover:border-brand-primary/40 hover:text-brand-primary hover:bg-brand-lighter/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                <Building2 className="h-4 w-4 text-brand-primary" />
                Request organization access
              </Link>
            </div>

          </div>
        </section>

        {/* ─── FEATURES SECTION ─── */}
        <section id="features" className="scroll-mt-20 bg-gray-50/70 px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">
                Built for schools & students
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-normal tracking-tight text-gray-950 font-sail">
                One clear path from practice to event day.
              </h2>
              <p className="mt-3 text-sm sm:text-base text-gray-600">
                Everything required to run engaging practice sessions and secure mathematical events.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="group rounded-2xl border border-gray-200/80 bg-white p-7 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-brand-primary/30 hover:shadow-md"
                >
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-lighter/50 text-brand-primary transition-colors group-hover:bg-brand-primary group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-gray-950">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── ACCESS MODEL SECTION ─── */}
        <section id="access" className="scroll-mt-20 border-y border-gray-200/80 bg-white px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">
                Secure access model
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-normal tracking-tight text-gray-950 font-sail">
                No public student sign-up.
              </h2>
              <p className="mt-3 text-sm sm:text-base text-gray-600">
                To guarantee academic integrity and verified enrollment, accounts are provisioned exclusively through registered school organizations.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {steps.map(({ step, title, description }) => (
                <div
                  key={step}
                  className="relative rounded-2xl border border-gray-200/80 bg-surface-secondary p-7 shadow-xs transition-all hover:border-brand-primary/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-primary to-brand-dark text-white font-bold text-sm font-sail shadow-sm">
                      {step}
                    </span>
                    <ShieldCheck className="h-5 w-5 text-brand-primary/40" />
                  </div>
                  <h3 className="mt-6 text-base font-bold text-gray-950">{title}</h3>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-gray-600">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA SECTION ─── */}
        <section className="px-6 py-20 bg-gray-50/50">
          <div className="mx-auto max-w-5xl">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-primary via-brand-dark to-gray-950 p-10 sm:p-16 text-white shadow-xl">
              <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />

              <div className="relative max-w-2xl">
                <h2 className="text-3xl sm:text-5xl font-normal tracking-tight font-sail leading-tight">
                  Ready to bring Mathlers to your school?
                </h2>
                <p className="mt-4 text-sm sm:text-base text-white/85 leading-relaxed">
                  Submit a registration request to get your school organization workspace configured for practice and upcoming competition rounds.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/request-access"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-semibold text-brand-primary shadow-md transition-all hover:bg-gray-100 hover:scale-[1.02]"
                  >
                    Request School Registration <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
