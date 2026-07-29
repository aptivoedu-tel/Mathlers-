import { redirect } from 'next/navigation';
import { auth, isTeacher } from '@/lib/auth/auth';
import SignOutButton from '@/components/ui/SignOutButton';

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || !isTeacher(session.user.role)) redirect('/sign-in');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-primary rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <div>
              <span className="text-sm font-bold text-gray-900">Mathlers</span>
              <p className="text-[11px] text-gray-400">Teacher Portal</p>
            </div>
          </div>
          <div className="w-28">
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}
