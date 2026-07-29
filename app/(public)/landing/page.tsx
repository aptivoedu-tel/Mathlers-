'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, School, Trophy } from 'lucide-react';
import PublicLayout from '@/components/layouts/PublicLayout';

const features = [
  { icon: BookOpen, title: 'Focused practice', description: 'Practice mathematics by grade, topic, and skill.' },
  { icon: Trophy, title: 'Competition operations', description: 'Enroll, follow rulebooks, and complete scheduled competition rounds.' },
  { icon: School, title: 'School access', description: 'Schools provision student accounts and manage their own teachers.' },
];

export default function LandingPage() {
  return (
    <PublicLayout>
      <main>
        <section className="border-b border-gray-200 bg-white px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-primary">Mathlers</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-950 sm:text-6xl">Mathematics, made ready for competition.</h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">A school-provisioned platform for structured practice and secure mathematics competitions.</p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/sign-in" className="inline-flex items-center justify-center gap-2 rounded-xl border border-transparent bg-brand-primary px-5 py-3 font-semibold text-white transition-colors hover:border-brand-dark hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2">Sign in <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/request-access" className="inline-flex items-center justify-center rounded-xl border border-transparent px-5 py-3 font-semibold text-brand-primary transition-colors hover:border-brand-primary hover:bg-brand-lighter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2">Request organization access</Link>
            </div>
          </div>
        </section>

        <section id="features" className="bg-gray-50 px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-primary">Built for schools</p><h2 className="mt-3 text-3xl font-bold text-gray-950">One clear path from practice to event day.</h2></div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => <article key={title} className="rounded-xl border border-gray-200 bg-white p-6"><Icon className="h-5 w-5 text-brand-primary" /><h3 className="mt-5 text-lg font-bold text-gray-950">{title}</h3><p className="mt-2 text-sm leading-6 text-gray-600">{description}</p></article>)}
            </div>
          </div>
        </section>

        <section id="access" className="border-y border-gray-200 bg-white px-6 py-20">
          <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_2fr]">
            <div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-primary">How access works</p><h2 className="mt-3 text-3xl font-bold text-gray-950">No public student sign-up.</h2></div>
            <ol className="space-y-5 text-gray-700"><li className="flex gap-4"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-lighter text-sm font-bold text-brand-primary">1</span><span><strong className="text-gray-950">A developer creates the school.</strong><br />School administrators are provisioned with their organization.</span></li><li className="flex gap-4"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-lighter text-sm font-bold text-brand-primary">2</span><span><strong className="text-gray-950">The school provisions teachers and students.</strong><br />Credentials can be securely exported for distribution.</span></li><li className="flex gap-4"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-lighter text-sm font-bold text-brand-primary">3</span><span><strong className="text-gray-950">Students sign in and participate.</strong><br />Their school and competition eligibility remain enforced throughout.</span></li></ol>
          </div>
        </section>

        <section id="contact" className="bg-gray-50 px-6 py-20 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold text-gray-950">Need access for your school?</h2>
            <p className="mt-3 text-gray-600">Submit a registration request to get your school organization workspace.</p>
            <Link href="/request-access" className="mt-6 inline-flex rounded-xl border border-transparent bg-brand-primary px-6 py-3 font-semibold text-white transition-colors hover:border-brand-dark hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2">
              Request School Registration
            </Link>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
