'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import SignOutButton from '@/components/ui/SignOutButton';
interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { data: session, status } = useSession();
  const year = new Date().getFullYear();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    if (typeof window !== 'undefined') {
      const isLandingPage = window.location.pathname === '/' || window.location.pathname === '/landing';
      if (isLandingPage) {
        e.preventDefault();
        setIsMenuOpen(false);
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/90 backdrop-blur-md transition-all">
        <nav className="container mx-auto px-4 py-3.5">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-dark rounded-xl flex items-center justify-center shadow-md shadow-brand-primary/20 group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-xl font-sail">M</span>
              </div>
              <span className="text-2xl font-bold text-gray-900 tracking-tight font-sail">Mathlers</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a
                href="/#features"
                onClick={(e) => handleNavClick(e, 'features')}
                className="text-sm font-semibold text-gray-700 hover:text-brand-primary transition-colors cursor-pointer"
              >
                Features
              </a>
              <a
                href="/#access"
                onClick={(e) => handleNavClick(e, 'access')}
                className="text-sm font-semibold text-gray-700 hover:text-brand-primary transition-colors cursor-pointer"
              >
                Access
              </a>
              {status === 'loading' ? null : session ? (
                <div className="w-32"><SignOutButton /></div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/sign-in" className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:border-brand-primary/30 hover:text-brand-primary hover:bg-brand-lighter/30">
                    Sign in
                  </Link>
                  <Link href="/request-access" className="rounded-xl bg-brand-primary px-4.5 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-primary/20 transition-all hover:bg-brand-dark hover:scale-[1.02]">
                    Request access
                  </Link>
                </div>
              )}
            </div>

            <button
              className="md:hidden p-2 text-gray-700 hover:text-brand-primary"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-3 border-t border-gray-100 pt-4">
              <a
                href="/#features"
                onClick={(e) => handleNavClick(e, 'features')}
                className="block text-sm font-semibold text-gray-700 hover:text-brand-primary transition-colors"
              >
                Features
              </a>
              <a
                href="/#access"
                onClick={(e) => handleNavClick(e, 'access')}
                className="block text-sm font-semibold text-gray-700 hover:text-brand-primary transition-colors"
              >
                Access
              </a>
              {status === 'loading' ? null : session ? (
                <div className="w-32 pt-2"><SignOutButton /></div>
              ) : (
                <div className="pt-2 flex flex-col gap-2">
                  <Link href="/sign-in" className="block w-full text-center rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:text-brand-primary">
                    Sign in
                  </Link>
                  <Link href="/request-access" className="block w-full text-center rounded-xl bg-brand-primary py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
                    Request access
                  </Link>
                </div>
              )}
            </div>
          )}
        </nav>
      </header>

      <main className="flex-grow">{children}</main>

      <footer className="border-t border-gray-200/80 bg-white mt-auto">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 bg-gradient-to-br from-brand-primary to-brand-dark rounded-xl flex items-center justify-center text-white font-bold text-lg font-sail shadow-sm">
                  M
                </div>
                <span className="text-2xl font-bold text-gray-900 tracking-tight font-sail">Mathlers</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed max-w-sm">
                Empowering students and schools through structured practice and national mathematics competitions.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-4">Navigation</h4>
              <ul className="space-y-2.5 text-sm font-medium">
                <li>
                  <a href="/#features" onClick={(e) => handleNavClick(e, 'features')} className="text-gray-600 hover:text-brand-primary transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="/#access" onClick={(e) => handleNavClick(e, 'access')} className="text-gray-600 hover:text-brand-primary transition-colors">
                    Access Model
                  </a>
                </li>
                <li>
                  <Link href="/request-access" className="text-gray-600 hover:text-brand-primary transition-colors">
                    Request Organization Access
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-4">Legal & Policies</h4>
              <ul className="space-y-2.5 text-sm font-medium">
                <li><Link href="/privacy" className="text-gray-600 hover:text-brand-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-gray-600 hover:text-brand-primary transition-colors">Terms of Service</Link></li>
                <li><Link href="/cookies" className="text-gray-600 hover:text-brand-primary transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-100 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <p>&copy; {year} Mathlers. All rights reserved.</p>
            <p className="text-gray-400">Structured Mathematics & Competition Operations Platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
