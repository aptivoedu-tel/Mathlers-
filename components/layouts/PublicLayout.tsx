'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import SignOutButton from '@/components/ui/SignOutButton';

/** Return the correct dashboard path based on the user's role. */
function getDashboardUrl(role?: string): string {
  switch (role) {
    case 'super_admin': return '/admin/dashboard';
    case 'admin':       return '/school/dashboard';
    case 'teacher':     return '/teacher/dashboard';
    case 'student':     return '/student/dashboard';
    default:            return '/sign-in';
  }
}

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isMenuContentVisible, setIsMenuContentVisible] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const year = new Date().getFullYear();

  const isLanding = pathname === '/' || pathname === '/landing';

  // On landing page, listen to scroll to turn the nav opaque after hero
  React.useEffect(() => {
    if (!isLanding) return;
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isLanding]);

  const closeMenu = () => {
    setIsMenuContentVisible(false);
    setTimeout(() => setIsMenuOpen(false), 200);
  };

  const toggleMenu = () => {
    if (isMenuOpen) {
      // Closing: hide content first, then wait 200ms to hide background
      closeMenu();
    } else {
      // Opening: show background first, wait 300ms, then show content
      setIsMenuOpen(true);
      setTimeout(() => setIsMenuContentVisible(true), 300);
    }
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    if (typeof window !== 'undefined') {
      const onLanding = window.location.pathname === '/' || window.location.pathname === '/landing';
      if (onLanding) {
        e.preventDefault();
        closeMenu();
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Landing: fixed + fully transparent at top of page, glass when scrolled OR menu is open
  // Other pages: sticky with solid border
  const headerClass = isLanding
    ? `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || isMenuOpen
          ? 'bg-white/90 backdrop-blur-md shadow-sm'
          : 'bg-transparent'
      }`
    : 'sticky top-0 z-40 border-b border-gray-200/80 bg-white/90 backdrop-blur-md';

  return (
    <div className="min-h-screen flex flex-col">
      <header className={headerClass}>
        <nav className="container mx-auto px-4 py-3.5">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">M</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">Mathlers</span>
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
              {status === 'loading' ? null : isLanding ? (
                // On landing: always show Sign In + Request Access
                // If already signed in, Sign In goes straight to dashboard
                <div className="flex items-center gap-3">
                  <Link
                    href={session ? getDashboardUrl((session.user as any)?.role) : '/sign-in'}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:border-brand-primary/30 hover:text-brand-primary hover:bg-brand-lighter/30"
                  >
                    Sign in
                  </Link>
                  <Link href="/request-access" className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark">
                    Request access
                  </Link>
                </div>
              ) : session ? (
                <div className="w-32"><SignOutButton /></div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/sign-in" className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:border-brand-primary/30 hover:text-brand-primary hover:bg-brand-lighter/30">
                    Sign in
                  </Link>
                  <Link href="/request-access" className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark">
                    Request access
                  </Link>
                </div>
              )}
            </div>

            <button
              className="md:hidden p-2 text-gray-700 hover:text-brand-primary"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {isMenuOpen && (
            <div 
              className={`md:hidden mt-4 space-y-3 pt-4 transition-all duration-200 ease-in-out ${
                isMenuContentVisible 
                  ? 'opacity-100 max-h-[400px] border-t border-gray-100 pb-4' 
                  : 'opacity-0 max-h-0 border-transparent pb-0 pointer-events-none'
              }`}
            >
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
              {status === 'loading' ? null : isLanding ? (
                <div className="pt-2 flex flex-col gap-2">
                  <Link
                    href={session ? getDashboardUrl((session.user as any)?.role) : '/sign-in'}
                    className="block w-full text-center rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:text-brand-primary"
                  >
                    Sign in
                  </Link>
                  <Link href="/request-access" className="block w-full text-center rounded-xl bg-brand-primary py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
                    Request access
                  </Link>
                </div>
              ) : session ? (
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
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">M</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">Mathlers</span>
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
