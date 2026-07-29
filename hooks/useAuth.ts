'use client';

import { useSession } from 'next-auth/react';
import { UserRole } from '@/models/User';

export function useAuth() {
  const { data: session, status, update } = useSession();
  const user = session?.user ? {
    id: (session.user as any).id,
    email: session.user.email,
    name: session.user.name,
    role: (session.user as any).role as UserRole,
  } : undefined;

  const role = user?.role;

  const hasRole = (requiredRole: UserRole): boolean => {
    if (!role) return false;
    const roleHierarchy: Record<UserRole, number> = {
      [UserRole.STUDENT]: 1,
      [UserRole.TEACHER]: 2,
      [UserRole.COORDINATOR]: 3,
      [UserRole.ADMIN]: 4,
      [UserRole.SUPER_ADMIN]: 5,
    };
    return roleHierarchy[role] >= roleHierarchy[requiredRole];
  };

  const isStudent = role === UserRole.STUDENT;
  const isAdmin = hasRole(UserRole.ADMIN);
  const isSuperAdmin = role === UserRole.SUPER_ADMIN;

  return {
    user,
    session,
    isAuthenticated: !!session,
    isLoading: status === 'loading',
    hasRole,
    isStudent,
    isAdmin,
    isSuperAdmin,
    update,
  };
}
