import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import SchoolSidebar from '@/components/layout/SchoolSidebar';
import MainContent from '@/components/layout/MainContent';
import { SidebarProvider } from '@/components/layout/SidebarContext';
import { UserRole } from '@/models/User';

export default async function SchoolLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/sign-in');
  
  if (session.user.role !== UserRole.ADMIN) {
    if (session.user.role === UserRole.SUPER_ADMIN) redirect('/admin/dashboard');
    if (session.user.role === UserRole.STUDENT) redirect('/student/dashboard');
    if (session.user.role === UserRole.TEACHER) redirect('/teacher/dashboard');
    redirect('/sign-in');
  }

  return (
    <SidebarProvider>
      <div data-portal="school" className="min-h-screen bg-gray-50">
        <SchoolSidebar />
        <MainContent>{children}</MainContent>
      </div>
    </SidebarProvider>
  );
}
