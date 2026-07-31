import Link from 'next/link';
import PublicLayout from '@/components/layouts/PublicLayout';

type LegalNoticeProps = {
  title: string;
  children: React.ReactNode;
};

export default function LegalNotice({ title, children }: LegalNoticeProps) {
  return (
    <PublicLayout>
      <div className="relative min-h-screen bg-gradient-to-b from-white via-brand-lighter/10 to-gray-50/70">
        {/* Fading Grid Pattern Overlay */}
        <div 
          className="absolute inset-0 bg-grid-pattern pointer-events-none"
          style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)' }}
        />
        {/* Subtle radial brand glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,_rgba(var(--brand-primary-rgb),0.07),transparent)] pointer-events-none" />

        <section className="relative z-10 mx-auto max-w-3xl px-6 py-20 sm:py-28">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary">Mathlers legal</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-sail text-gray-950 drop-shadow-sm">{title}</h1>
          <div className="mt-8 space-y-6 rounded-2xl border border-gray-200 bg-white p-8 text-gray-700 shadow-sm">
            {children}
          </div>
          <p className="mt-8 text-sm text-gray-500">Questions about these notices? <a className="text-brand-primary hover:underline" href="mailto:info@mathlers.com?subject=Mathlers%20legal%20question">Contact Mathlers</a>.</p>
          <Link href="/landing" className="mt-6 inline-block text-sm font-semibold text-brand-primary hover:underline">Back to Mathlers</Link>
        </section>
      </div>
    </PublicLayout>
  );
}
