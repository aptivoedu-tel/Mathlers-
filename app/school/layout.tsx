import Link from 'next/link';
import { redirect } from 'next/navigation';
import SignOutButton from '@/components/ui/SignOutButton';
import { auth } from '@/lib/auth/auth';
import { UserRole } from '@/models/User';

export default async function SchoolLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== UserRole.ADMIN) redirect('/sign-in');
  return <div className="min-h-screen bg-slate-50"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"><Link href="/school" className="font-bold text-slate-950">Mathlers <span className="font-medium text-slate-500">School</span></Link><nav className="flex items-center gap-5 text-sm font-semibold text-slate-600"><Link href="/school">Overview</Link><Link href="/school/people">People</Link><Link href="/school/students">Students</Link><div className="w-32"><SignOutButton /></div></nav></div></header><main className="mx-auto max-w-6xl p-6">{children}</main></div>;
}
