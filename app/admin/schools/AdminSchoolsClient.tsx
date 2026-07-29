'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/ui/GlassCard';
import StatusChip from '@/components/ui/StatusChip';
import EmptyState from '@/components/ui/EmptyState';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import {
  Building2,
  Users,
  MapPin,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Clock,
  Phone,
  Mail,
  UserCheck,
} from 'lucide-react';

export type SerializedSchool = {
  _id: string;
  name: string;
  domain?: string;
  username?: string;
  contactPerson?: string;
  contactNumber: string;
  email?: string;
  address: string;
  city: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Blocked';
  totalStudents: number;
  activeStudents: number;
  createdAt: string;
};

interface AdminSchoolsClientProps {
  initialSchools: SerializedSchool[];
  totalStudents: number;
}

export default function AdminSchoolsClient({
  initialSchools,
  totalStudents,
}: AdminSchoolsClientProps) {
  const router = useRouter();
  const [schools, setSchools] = useState<SerializedSchool[]>(initialSchools);
  const [activeTab, setActiveTab] = useState<'Approved' | 'Pending' | 'Rejected' | 'Blocked'>('Approved');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const approvedCount = schools.filter((s) => s.status === 'Approved' || (!s.status && (s as any).isActive)).length;
  const pendingCount = schools.filter((s) => s.status === 'Pending').length;
  const rejectedCount = schools.filter((s) => s.status === 'Rejected').length;
  const blockedCount = schools.filter((s) => s.status === 'Blocked').length;

  const handleStatusChange = async (schoolId: string, newStatus: 'Approved' | 'Rejected' | 'Blocked') => {
    let domain = undefined;
    if (newStatus === 'Approved') {
      domain = window.prompt('Enter a unique domain for this school (e.g., "qbh"). This domain will be used to generate login emails for students and teachers.');
      if (domain === null) return; // User cancelled
      if (!domain.trim()) {
        alert('A valid domain is required to approve a school.');
        return;
      }
    }

    setActionLoading(schoolId);
    try {
      const res = await fetch(`/api/admin/schools/${schoolId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, domain: domain?.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status.');
      }

      setSchools((prev) =>
        prev.map((s) => (s._id === schoolId ? { ...s, status: newStatus, domain: data.school?.domain || domain || s.domain } : s))
      );
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'An error occurred.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDomainChange = async (schoolId: string, currentDomain?: string) => {
    const newDomain = window.prompt('Enter the new domain for this school:', currentDomain || '');
    if (newDomain === null) return;
    if (!newDomain.trim()) {
      alert('Domain cannot be empty.');
      return;
    }

    setActionLoading(schoolId);
    try {
      const res = await fetch(`/api/admin/schools/${schoolId}/domain`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update domain.');
      }

      setSchools((prev) =>
        prev.map((s) => (s._id === schoolId ? { ...s, domain: data.domain } : s))
      );
      router.refresh();
      alert('Domain updated successfully.');
    } catch (err: any) {
      alert(err.message || 'An error occurred.');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredSchools = schools.filter((s) => {
    const status = s.status || 'Approved';
    return status === activeTab;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Schools Management"
        subtitle="Review registration requests and manage active school organizations."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Schools' },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Building2 className="w-5 h-5 text-emerald-600" />}
          value={approvedCount}
          label="Approved Schools"
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          value={pendingCount}
          label="Pending Requests"
        />
        <StatCard
          icon={<Users className="w-5 h-5 text-brand-primary" />}
          value={totalStudents}
          label="Total Students"
        />
        <StatCard
          icon={<ShieldAlert className="w-5 h-5 text-red-600" />}
          value={blockedCount}
          label="Blocked Schools"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-4 pt-3 rounded-t-2xl">
        {(['Approved', 'Pending', 'Rejected', 'Blocked'] as const).map((tab) => {
          const count =
            tab === 'Approved'
              ? approvedCount
              : tab === 'Pending'
              ? pendingCount
              : tab === 'Rejected'
              ? rejectedCount
              : blockedCount;

          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition-colors ${
                isActive
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <span>{tab}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  isActive
                    ? 'bg-brand-lighter text-brand-primary'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <GlassCard className="p-0 bg-white border border-gray-200/90 shadow-card overflow-hidden rounded-t-none">
        <div className="overflow-x-auto">
          {filteredSchools.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredSchools.map((school) => (
                <div
                  key={school._id}
                  className="p-5 hover:bg-gray-50/60 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-sm font-bold text-gray-900">{school.name}</h3>
                      <StatusChip
                        variant={
                          school.status === 'Approved'
                            ? 'success'
                            : school.status === 'Pending'
                            ? 'warning'
                            : school.status === 'Blocked'
                            ? 'danger'
                            : 'neutral'
                        }
                      >
                        {school.status || 'Approved'}
                      </StatusChip>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                      {school.domain && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-gray-400" /> Domain:{' '}
                          <strong className="text-brand-primary">{school.domain}</strong>
                        </span>
                      )}
                      {school.username && (
                        <span className="flex items-center gap-1">
                          <UserCheck className="h-3.5 w-3.5 text-gray-400" /> Username:{' '}
                          <strong className="text-gray-900">{school.username}</strong>
                        </span>
                      )}
                      {school.contactPerson && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-gray-400" /> Contact:{' '}
                          {school.contactPerson}
                        </span>
                      )}
                      {school.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5 text-gray-400" /> {school.email}
                        </span>
                      )}
                      {school.contactNumber && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 text-gray-400" /> {school.contactNumber}
                        </span>
                      )}
                      <span className="flex items-center gap-1 sm:col-span-2">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" /> {school.address}, {school.city}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                    {activeTab === 'Pending' && (
                      <>
                        <button
                          disabled={actionLoading === school._id}
                          onClick={() => handleStatusChange(school._id, 'Approved')}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </button>

                        <button
                          disabled={actionLoading === school._id}
                          onClick={() => handleStatusChange(school._id, 'Rejected')}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition disabled:opacity-50"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </button>

                        <button
                          disabled={actionLoading === school._id}
                          onClick={() => handleStatusChange(school._id, 'Blocked')}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                        >
                          <ShieldAlert className="h-3.5 w-3.5" /> Block
                        </button>
                      </>
                    )}

                    {activeTab === 'Approved' && (
                      <>
                        <button
                          disabled={actionLoading === school._id}
                          onClick={() => handleDomainChange(school._id, school.domain)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition disabled:opacity-50"
                        >
                          <Building2 className="h-3.5 w-3.5" /> Edit Domain
                        </button>
                        <button
                          disabled={actionLoading === school._id}
                          onClick={() => handleStatusChange(school._id, 'Blocked')}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                        >
                          <ShieldAlert className="h-3.5 w-3.5" /> Block
                        </button>
                      </>
                    )}

                    {activeTab === 'Rejected' && (
                      <button
                        disabled={actionLoading === school._id}
                        onClick={() => handleStatusChange(school._id, 'Approved')}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </button>
                    )}

                    {activeTab === 'Blocked' && (
                      <button
                        disabled={actionLoading === school._id}
                        onClick={() => handleStatusChange(school._id, 'Approved')}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                      >
                        Unblock & Approve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8">
              <EmptyState
                icon="file"
                title={`No ${activeTab} Schools`}
                description={`There are currently no school records in ${activeTab.toLowerCase()} status.`}
              />
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
