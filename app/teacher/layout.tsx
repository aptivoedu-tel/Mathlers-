import { redirect } from 'next/navigation';
import Link from 'next/link';
import SignOutButton from '@/components/ui/SignOutButton';
import { auth, isTeacher } from '@/lib/auth/auth';

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || !isTeacher(session.user.role)) redirect('/sign-in');
  return <div className="min-h-screen bg-slate-50"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"><Link href="/teacher" className="font-bold text-slate-950">Mathlers <span className="font-medium text-slate-500">Teacher</span></Link><div className="w-32"><SignOutButton /></div></div></header><main className="mx-auto max-w-6xl p-6">{children}</main></div>;
}
