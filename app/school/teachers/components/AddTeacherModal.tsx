'use client';

import { useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';

interface AddTeacherModalProps {
  domain: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface TeacherForm {
  name: string;
  username: string;
  subject: string;
  password: string;
}

export default function AddTeacherModal({ domain, onClose, onSuccess }: AddTeacherModalProps) {
  const [forms, setForms] = useState<TeacherForm[]>([{ name: '', username: '', subject: '', password: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddMore = () => {
    // Do NOT auto-fill Subject when adding more teachers
    setForms([...forms, { name: '', username: '', subject: '', password: '' }]);
  };

  const handleRemoveForm = (index: number) => {
    setForms(forms.filter((_, i) => i !== index));
  };

  const updateForm = (index: number, field: keyof TeacherForm, value: string) => {
    const newForms = [...forms];
    newForms[index][field] = value;
    setForms(newForms);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/school/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teachers: forms }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details && data.details.length > 0) {
          throw new Error(data.details.join('\n'));
        }
        throw new Error(data.error || 'Failed to add teachers');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in outline-none">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden outline-none">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">Add Teachers</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-200 text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm whitespace-pre-line border border-red-100">
              {error}
            </div>
          )}

          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 text-blue-800 text-sm">
            <p><strong>Note:</strong> Teachers will log in using their automatically generated email (e.g. <code>username.{domain}@mathlers.com</code>) and password. Subject is for identification only.</p>
          </div>

          <form id="add-teachers-form" onSubmit={handleSubmit} className="space-y-6">
            {forms.map((form, index) => (
              <div key={index} className="p-5 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-4 relative">
                {forms.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveForm(index)}
                    className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 shadow-sm transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Teacher Name</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Sarah Khan"
                      value={form.name}
                      onChange={(e) => updateForm(index, 'name', e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Subject</label>
                    <input
                      type="text"
                      placeholder="e.g. Mathematics"
                      value={form.subject}
                      onChange={(e) => updateForm(index, 'subject', e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Username</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. sarah"
                      value={form.username}
                      onChange={(e) => updateForm(index, 'username', e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Password</label>
                    <input
                      required
                      minLength={8}
                      type="text"
                      placeholder="Min 8 characters"
                      value={form.password}
                      onChange={(e) => updateForm(index, 'password', e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 px-3 border-t border-gray-50 flex flex-wrap gap-2 text-[11px] text-gray-500 font-medium">
                  <span>Generated Email:</span>
                  <span className="font-mono font-bold text-brand-primary">
                    {form.username ? `${form.username}.${domain}@mathlers.com` : `[username].${domain}@mathlers.com`}
                  </span>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddMore}
              className="inline-flex items-center justify-center w-full gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:text-brand-primary hover:border-brand-primary hover:bg-brand-lighter/20 transition-all font-bold text-sm"
            >
              <Plus className="w-4 h-4" /> Add Another Teacher
            </button>
          </form>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-teachers-form"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-primary hover:bg-brand-secondary text-white text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-70"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              'Save Teachers'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
