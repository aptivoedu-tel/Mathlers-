'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import StatusChip from '@/components/ui/StatusChip';
import EmptyState from '@/components/ui/EmptyState';

interface SerializedPracticeSet {
  _id: string;
  name: string;
  difficulty: string;
  type: string;
  subjectName: string;
  gradeName: string;
}

interface SchoolPracticeBooksClientProps {
  practiceSets: SerializedPracticeSet[];
  initialAssignedIds: string[];
}

export default function SchoolPracticeBooksClient({ practiceSets, initialAssignedIds }: SchoolPracticeBooksClientProps) {
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set(initialAssignedIds));
  const [search, setSearch] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredPracticeSets = practiceSets.filter(ps =>
    ps.name.toLowerCase().includes(search.toLowerCase()) ||
    ps.subjectName.toLowerCase().includes(search.toLowerCase())
  );

  const togglePracticeBook = async (id: string, currentlyAssigned: boolean) => {
    setLoadingId(id);
    try {
      const res = await fetch('/api/school/practice-books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ practiceBookId: id, assign: !currentlyAssigned }),
      });
      const data = await res.json();
      if (res.ok) {
        setAssignedIds(new Set(data.assignedPracticeSets));
      } else {
        alert(data.error || 'Failed to update practice book assignment.');
      }
    } catch (err) {
      alert('An error occurred.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative w-full sm:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search practice books..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
        />
      </div>

      <GlassCard className="p-0 overflow-hidden bg-white border border-gray-200 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Book Name</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Grade</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Available to Students</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPracticeSets.length > 0 ? (
                filteredPracticeSets.map((ps) => {
                  const isAssigned = assignedIds.has(ps._id);
                  const isLoading = loadingId === ps._id;

                  return (
                    <tr key={ps._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">{ps.name}</td>
                      <td className="px-6 py-4">{ps.subjectName}</td>
                      <td className="px-6 py-4">{ps.gradeName}</td>
                      <td className="px-6 py-4 capitalize">{ps.type.replace('_', ' ')}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => togglePracticeBook(ps._id, isAssigned)}
                          disabled={isLoading}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 ${
                            isAssigned ? 'bg-brand-primary' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              isAssigned ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                          {isLoading && (
                            <span className="absolute inset-0 flex items-center justify-center">
                              <Loader2 className="w-3 h-3 text-white animate-spin mix-blend-difference" />
                            </span>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <EmptyState 
                      icon="search"
                      title="No practice books found"
                      description="Try adjusting your search query or check back later."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
