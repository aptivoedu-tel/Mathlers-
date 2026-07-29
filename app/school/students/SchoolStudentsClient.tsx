'use client';

import { useState } from 'react';
import { Plus, Upload, Download, Search, Users } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import AddStudentModal from './components/AddStudentModal';
import BulkUploadModal from './components/BulkUploadModal';
import StatusChip from '@/components/ui/StatusChip';
import EmptyState from '@/components/ui/EmptyState';
import { useRouter } from 'next/navigation';

export type SerializedStudent = {
  _id: string;
  fullName: string;
  playerId: string;
  email: string;
  grade: string;
  points: number;
  isActive: boolean;
};

interface SchoolStudentsClientProps {
  initialStudents: SerializedStudent[];
  domain: string;
}

export default function SchoolStudentsClient({ initialStudents, domain }: SchoolStudentsClientProps) {
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredStudents = initialStudents.filter(s => 
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    s.playerId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search students by name or roll no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
          />
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setIsBulkModalOpen(true)}
            className="flex-1 sm:flex-none inline-flex justify-center items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Upload className="h-4 w-4" /> Bulk Upload
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 sm:flex-none inline-flex justify-center items-center gap-2 px-4 py-2 bg-brand-primary text-white text-sm font-bold rounded-xl hover:bg-brand-secondary transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add Student
          </button>
        </div>
      </div>

      <GlassCard className="p-0 overflow-hidden bg-white border border-gray-200 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Roll Number</th>
                <th className="px-6 py-4">Generated Email</th>
                <th className="px-6 py-4">Grade</th>
                <th className="px-6 py-4">Points</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">{student.fullName}</td>
                    <td className="px-6 py-4 font-mono text-xs">{student.playerId}</td>
                    <td className="px-6 py-4 text-gray-500">{student.email}</td>
                    <td className="px-6 py-4">{student.grade}</td>
                    <td className="px-6 py-4 font-bold text-brand-primary">{student.points.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <StatusChip variant={student.isActive ? 'success' : 'danger'}>
                        {student.isActive ? 'Active' : 'Inactive'}
                      </StatusChip>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <EmptyState 
                      icon="custom"
                      customIcon={<Users className="w-12 h-12 text-gray-300" />}
                      title="No students found"
                      description={search ? "Try adjusting your search query." : "Start by adding a student individually or via bulk upload."}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {isAddModalOpen && (
        <AddStudentModal 
          domain={domain}
          onClose={() => setIsAddModalOpen(false)} 
          onSuccess={() => {
            setIsAddModalOpen(false);
            router.refresh();
          }} 
        />
      )}

      {isBulkModalOpen && (
        <BulkUploadModal 
          domain={domain}
          uploadType="students"
          onClose={() => setIsBulkModalOpen(false)}
          onSuccess={() => {
            setIsBulkModalOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
