import { auth, isSuperAdmin } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/layout/AdminSidebar';
import MainContent from '@/components/layout/MainContent';
import { SidebarProvider } from '@/components/layout/SidebarContext';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/sign-in');
  if (!isSuperAdmin(session.user.role)) redirect('/school');

  return (
    <SidebarProvider>
      <div data-portal="admin" className="min-h-screen bg-gray-50">
        <AdminSidebar isSuperAdmin />
        <MainContent>{children}</MainContent>
      </div>
    </SidebarProvider>
  );
}
