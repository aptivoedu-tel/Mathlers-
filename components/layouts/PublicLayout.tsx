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

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">M</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">Mathlers</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/#features" className="text-gray-700 hover:text-brand-primary transition-colors">
                Features
              </Link>
              <Link href="/#access" className="text-gray-700 hover:text-brand-primary transition-colors">
                Access
              </Link>
              <Link href="/#contact" className="text-gray-700 hover:text-brand-primary transition-colors">
                Contact
              </Link>
              {status === 'loading' ? null : session ? (
                <div className="w-32"><SignOutButton /></div>
              ) : (
                <>
                  <Link href="/sign-in" className="rounded-xl border border-transparent px-3 py-2 text-gray-700 transition-colors hover:border-gray-300 hover:text-brand-primary">Sign in</Link>
                  <Link href="/request-access" className="rounded-xl border border-transparent bg-brand-primary px-4 py-2 font-semibold text-white transition-colors hover:border-brand-dark hover:bg-brand-dark">Request access</Link>
                </>
              )}
            </div>

            <button
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-4">
              <Link href="/#features" className="block text-gray-700 hover:text-brand-primary transition-colors">
                Features
              </Link>
              <Link href="/#access" className="block text-gray-700 hover:text-brand-primary transition-colors">
                Access
              </Link>
              <Link href="/#contact" className="block text-gray-700 hover:text-brand-primary transition-colors">
                Contact
              </Link>
              {status === 'loading' ? null : session ? (
                <div className="w-32"><SignOutButton /></div>
              ) : (
                <>
                  <Link href="/sign-in" className="block text-gray-700 hover:text-brand-primary">Sign in</Link>
                  <Link href="/request-access" className="mt-3 inline-block rounded-xl border border-transparent bg-brand-primary px-4 py-2 font-semibold text-white transition-colors hover:border-brand-dark hover:bg-brand-dark">Request access</Link>
                </>
              )}
            </div>
          )}
        </nav>
      </header>

      <main>{children}</main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">M</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">Mathlers</span>
              </div>
              <p className="text-gray-600">
                Making mathematics engaging through structured practice and competitive events.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/#features" className="text-gray-600 hover:text-brand-primary transition-colors">Features</Link></li>
                <li><Link href="/#access" className="text-gray-600 hover:text-brand-primary transition-colors">Access</Link></li>
                <li><Link href="/#contact" className="text-gray-600 hover:text-brand-primary transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-gray-600 hover:text-red-primary transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="text-gray-600 hover:text-red-primary transition-colors">Terms</Link></li>
                <li><Link href="/cookies" className="text-gray-600 hover:text-red-primary transition-colors">Cookies</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="mailto:info@mathlers.com" className="hover:text-brand-primary">info@mathlers.com</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-600">
            <p>&copy; {year} Mathlers. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
