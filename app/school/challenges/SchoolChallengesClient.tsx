'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import StatusChip from '@/components/ui/StatusChip';
import EmptyState from '@/components/ui/EmptyState';

interface SerializedCompetition {
  _id: string;
  name: string;
  category: string;
  difficultyLevel: string;
  status: string;
}

interface SchoolChallengesClientProps {
  competitions: SerializedCompetition[];
  initialAssignedIds: string[];
}

export default function SchoolChallengesClient({ competitions, initialAssignedIds }: SchoolChallengesClientProps) {
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set(initialAssignedIds));
  const [search, setSearch] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredCompetitions = competitions.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleChallenge = async (id: string, currentlyAssigned: boolean) => {
    setLoadingId(id);
    try {
      const res = await fetch('/api/school/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: id, assign: !currentlyAssigned }),
      });
      const data = await res.json();
      if (res.ok) {
        setAssignedIds(new Set(data.assignedCompetitions));
      } else {
        alert(data.error || 'Failed to update challenge assignment.');
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
          placeholder="Search challenges..."
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
                <th className="px-6 py-4">Challenge Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Difficulty</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Available to Students</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCompetitions.length > 0 ? (
                filteredCompetitions.map((comp) => {
                  const isAssigned = assignedIds.has(comp._id);
                  const isLoading = loadingId === comp._id;

                  return (
                    <tr key={comp._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">{comp.name}</td>
                      <td className="px-6 py-4 capitalize">{comp.category}</td>
                      <td className="px-6 py-4 capitalize">{comp.difficultyLevel}</td>
                      <td className="px-6 py-4">
                        <StatusChip variant={
                          comp.status === 'in_progress' ? 'success' : 
                          comp.status === 'registration_open' ? 'warning' : 'neutral'
                        }>
                          {comp.status.replace('_', ' ')}
                        </StatusChip>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => toggleChallenge(comp._id, isAssigned)}
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
                      title="No challenges found"
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
