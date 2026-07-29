import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import StudentSidebar from '@/components/layout/StudentSidebar';
import MainContent from '@/components/layout/MainContent';
import { SidebarProvider } from '@/components/layout/SidebarContext';

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/sign-in');

  return (
    <SidebarProvider>
      <div data-portal="student" className="min-h-screen bg-gray-50">
        <StudentSidebar />
        <MainContent>{children}</MainContent>
      </div>
    </SidebarProvider>
  );
}
