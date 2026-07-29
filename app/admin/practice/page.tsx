'use client';

import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Eye, FilePlus2, Filter, Plus, Trash2 } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Modal from '@/components/ui/Modal';
import PrimaryButton from '@/components/ui/PrimaryButton';
import PageHeader from '@/components/ui/PageHeader';

type Lookup = { _id: string; name: string };
type Topic = { _id: string; name: string; subtopics?: { _id: string; name: string }[] };
type Question = { _id: string; question: string; subject?: Lookup; grade?: Lookup; topic?: Topic; subtopic?: string; difficulty: string; marks: number };
type Section = { name: string; instructions: string; questions: string[] };
type SectionFilter = { subject: string; grade: string; topic: string; subtopic: string };
type PracticeBook = { _id: string; name: string; description?: string; type: string; difficulty: string; sections: { name: string; questions: string[] }[]; questions: string[]; timeLimit: number; attemptsAllowed: number; isPublished: boolean };

const blankSection = (): Section => ({ name: '', instructions: '', questions: [] });
const blankFilter = (): SectionFilter => ({ subject: '', grade: '', topic: '', subtopic: '' });

export default function AdminPracticePage() {
  const [books, setBooks] = useState<PracticeBook[]>([]);
  const [subjects, setSubjects] = useState<Lookup[]>([]);
  const [grades, setGrades] = useState<Lookup[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ name: '', description: '', type: 'mixed_practice', difficulty: 'mixed', timeLimit: 1800, attemptsAllowed: 3, startDate: '', endDate: '', isPublished: false, sections: [blankSection()] });
  const [filters, setFilters] = useState<Record<number, SectionFilter>>({ 0: blankFilter() });
  const [topicsMap, setTopicsMap] = useState<Record<number, Topic[]>>({});

  const load = useCallback(async () => {
    const [bookRes, subjectRes, gradeRes, questionRes] = await Promise.all([
      fetch('/api/admin/practice'),
      fetch('/api/public/subjects'),
      fetch('/api/public/grades'),
      fetch('/api/admin/questions?status=active&limit=500'),
    ]);
    const [bd, sd, gd, qd] = await Promise.all([bookRes.json(), subjectRes.json(), gradeRes.json(), questionRes.json()]);
    if (bd.success) setBooks(bd.data);
    if (sd.success) setSubjects(sd.data);
    if (gd.success) setGrades(gd.data);
    if (qd.success) setAllQuestions(qd.data);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  const fetchTopics = useCallback(async (index: number, subjectId: string) => {
    if (!subjectId) { setTopicsMap(p => ({ ...p, [index]: [] })); return; }
    try {
      const res = await fetch(`/api/admin/topics?subject=${subjectId}`);
      const data = await res.json();
      setTopicsMap(p => ({ ...p, [index]: data.success ? data.data : [] }));
    } catch { setTopicsMap(p => ({ ...p, [index]: [] })); }
  }, []);

  const updateFilter = (index: number, changes: Partial<SectionFilter>) => {
    const current = filters[index] || blankFilter();
    const next = { ...current, ...changes };
    setFilters(p => ({ ...p, [index]: next }));
    if ('subject' in changes) {
      void fetchTopics(index, changes.subject || '');
      if (changes.subject !== current.subject) setFilters(p => ({ ...p, [index]: { ...next, topic: '', subtopic: '' } }));
    }
    if ('topic' in changes) setFilters(p => ({ ...p, [index]: { ...next, subtopic: '' } }));
  };

  const visibleQuestions = (index: number) => {
    const f = filters[index] || blankFilter();
    return allQuestions.filter(q => {
      if (f.subject && q.subject?._id !== f.subject) return false;
      if (f.grade && q.grade?._id !== f.grade) return false;
      if (f.topic && q.topic?._id !== f.topic) return false;
      if (f.subtopic && String(q.subtopic) !== f.subtopic) return false;
      return true;
    });
  };

  const updateSection = (index: number, changes: Partial<Section>) => {
    setForm(c => ({ ...c, sections: c.sections.map((s, i) => i === index ? { ...s, ...changes } : s) }));
  };

  const toggleQuestion = (index: number, id: string) => {
    const s = form.sections[index];
    updateSection(index, { questions: s.questions.includes(id) ? s.questions.filter(q => q !== id) : [...s.questions, id] });
  };

  const addSection = () => {
    const idx = form.sections.length;
    setForm(c => ({ ...c, sections: [...c.sections, blankSection()] }));
    setFilters(p => ({ ...p, [idx]: blankFilter() }));
  };

  const removeSection = (index: number) => {
    setForm(c => ({ ...c, sections: c.sections.filter((_, i) => i !== index) }));
    setFilters(p => { const n = { ...p }; delete n[index]; return n; });
  };

  const createBook = async (event: React.FormEvent) => {
    event.preventDefault();
    setNotice('');

    // Client-side pre-validation
    for (let i = 0; i < form.sections.length; i++) {
      const s = form.sections[i];
      if (!s.name.trim()) { setNotice(`Section ${i + 1} needs a name.`); return; }
      if (s.questions.length === 0) { setNotice(`Section ${i + 1} ("${s.name}") has no questions selected. Use the filters to browse and check questions.`); return; }
    }

    setSaving(true);
    try {
      const payload = { ...form, startDate: form.startDate || undefined, endDate: form.endDate || undefined };
      const res = await fetch('/api/admin/practice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      console.log('[Practice API response]', res.status, data);
      if (!data.success) throw new Error(data.error || 'Unable to create practice book');
      setOpen(false);
      setForm({ name: '', description: '', type: 'mixed_practice', difficulty: 'mixed', timeLimit: 1800, attemptsAllowed: 3, startDate: '', endDate: '', isPublished: false, sections: [blankSection()] });
      setFilters({ 0: blankFilter() });
      setTopicsMap({});
      setNotice('Practice book created.');
      await load();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Unable to create practice book');
    } finally { setSaving(false); }

  };

  const setPublished = async (book: PracticeBook) => {
    const res = await fetch(`/api/admin/practice/${book._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isPublished: !book.isPublished }) });
    const data = await res.json();
    setNotice(data.success ? `${book.name} is now ${book.isPublished ? 'a draft' : 'published'}.` : data.error || 'Unable to update');
    if (data.success) await load();
  };

  const removeBook = async (book: PracticeBook) => {
    if (!confirm(`Delete "${book.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/practice/${book._id}`, { method: 'DELETE' });
    const data = await res.json();
    setNotice(data.success ? 'Practice book deleted.' : data.error || 'Unable to delete');
    if (data.success) await load();
  };

  const totalSelected = form.sections.reduce((a, s) => a + s.questions.length, 0);

  return <div className="mx-auto max-w-7xl space-y-6 animate-fade-in pb-12">
    <PageHeader
      title="Practice Books"
      subtitle="Build practice sets from any mix of questions across subjects, topics, and grades."
      breadcrumbs={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Practice Books' }
      ]}
      actions={
        <PrimaryButton size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Create Book
        </PrimaryButton>
      }
    />

    {notice && <div className="flex items-center justify-between rounded-lg border border-brand-primary/20 bg-brand-lighter/40 px-4 py-3 text-sm text-gray-800"><span>{notice}</span><button onClick={() => setNotice('')} className="font-semibold text-brand-primary">Dismiss</button></div>}

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {books.map(book => <GlassCard key={book._id} className="flex min-h-64 flex-col p-5 bg-white border border-gray-200/90 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold text-gray-900">{book.name}</h2>
            <p className="mt-1 text-xs text-gray-500 line-clamp-2">{book.description || 'No description provided'}</p>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${book.isPublished ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-gray-100 text-gray-600'}`}>
            {book.isPublished ? 'Published' : 'Draft'}
          </span>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs text-gray-600"><div><strong className="block text-base text-gray-950">{book.sections?.length || 0}</strong>Sections</div><div><strong className="block text-base text-gray-950">{book.questions?.length || 0}</strong>Questions</div><div><strong className="block text-base text-gray-950">{Math.round(book.timeLimit / 60)}</strong>Minutes</div></div>
        <div className="mt-auto flex gap-2 pt-5"><button onClick={() => void setPublished(book)} className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">{book.isPublished ? 'Unpublish' : 'Publish'}</button><button onClick={() => void removeBook(book)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-red-600 hover:bg-red-50" aria-label={`Delete ${book.name}`}><Trash2 className="h-4 w-4" /></button></div>
      </GlassCard>)}
      {!books.length && <div className="col-span-full border-y border-gray-200 py-16 text-center text-gray-500"><BookOpen className="mx-auto mb-3 h-10 w-10 text-gray-300" /><p>No practice books yet. Create one from the question bank.</p></div>}
    </div>

    <Modal isOpen={open} onClose={() => setOpen(false)} title="Create practice book" size="xl">
      <form onSubmit={createBook} className="space-y-6">
        {/* Book-level details */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-gray-700">Book name *<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-brand-primary" placeholder="Algebra foundations" /></label>
          <label className="text-sm font-semibold text-gray-700">Practice type<select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5"><option value="chapter_practice">Chapter practice</option><option value="revision_practice">Revision practice</option><option value="speed_practice">Speed practice</option><option value="mixed_practice">Mixed practice</option></select></label>
        </div>
        <label className="block text-sm font-semibold text-gray-700">Student instructions<textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1.5 min-h-20 w-full rounded-lg border border-gray-300 px-3 py-2.5" placeholder="What should students focus on?" /></label>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-semibold text-gray-700">Difficulty<select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })} className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5"><option value="mixed">🔀 Mixed / All</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
          <label className="text-sm font-semibold text-gray-700">Time (minutes)<input type="number" min="1" value={form.timeLimit / 60} onChange={e => setForm({ ...form, timeLimit: Number(e.target.value) * 60 })} className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5" /></label>
          <label className="text-sm font-semibold text-gray-700">Attempts<input type="number" min="1" value={form.attemptsAllowed} onChange={e => setForm({ ...form, attemptsAllowed: Number(e.target.value) })} className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5" /></label>
          <label className="mt-6 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700"><input type="checkbox" checked={form.isPublished} onChange={e => setForm({ ...form, isPublished: e.target.checked })} className="h-4 w-4 accent-brand-primary" />Publish now</label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-gray-700">Available from (optional)<input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5" /></label>
          <label className="text-sm font-semibold text-gray-700">Available until (optional)<input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5" /></label>
        </div>

        {/* Sections */}
        <section className="space-y-4 border-t border-gray-200 pt-5">
          <div className="flex items-center justify-between">
            <div><h3 className="font-bold text-gray-950">Book sections</h3><p className="text-sm text-gray-600">Each section groups questions. Use filters to browse &mdash; they won&apos;t be saved.</p></div>
            <button type="button" onClick={addSection} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"><Plus className="h-4 w-4" />Section</button>
          </div>

          {form.sections.map((section, index) => {
            const f = filters[index] || blankFilter();
            const topics = topicsMap[index] || [];
            const activeTopic = topics.find((t: Topic) => t._id === f.topic);
            const visible = visibleQuestions(index);
            return (
              <div key={index} className="space-y-4 rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                {/* Section name + remove */}
                <div className="flex items-center justify-between gap-3">
                  <label className="flex-1 text-sm font-semibold text-gray-700">Section {index + 1} name *
                    <input required value={section.name} onChange={e => updateSection(index, { name: e.target.value })} className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5" placeholder="e.g. Algebra" />
                  </label>
                  {form.sections.length > 1 && <button type="button" onClick={() => removeSection(index)} className="mt-6 h-10 w-10 shrink-0 rounded-lg text-red-600 hover:bg-red-50" aria-label="Remove section"><Trash2 className="mx-auto h-4 w-4" /></button>}
                </div>

                <label className="block text-sm font-semibold text-gray-700">Section instructions (optional)
                  <textarea value={section.instructions} onChange={e => updateSection(index, { instructions: e.target.value })} className="mt-1.5 min-h-14 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5" placeholder="Optional directions for this section" />
                </label>

                {/* Filters — UI only */}
                <div className="rounded-lg border border-dashed border-gray-300 bg-white p-3 space-y-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500"><Filter className="h-3.5 w-3.5" />Question bank filters (not saved)</p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="text-xs font-semibold text-gray-600">Subject
                      <select value={f.subject} onChange={e => updateFilter(index, { subject: e.target.value, grade: '', topic: '', subtopic: '' })} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-sm">
                        <option value="">All subjects</option>{subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                      </select>
                    </label>
                    <label className="text-xs font-semibold text-gray-600">Grade
                      <select value={f.grade} onChange={e => updateFilter(index, { grade: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-sm">
                        <option value="">All grades</option>{grades.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                      </select>
                    </label>
                    {topics.length > 0 && <label className="text-xs font-semibold text-gray-600">Topic
                      <select value={f.topic} onChange={e => updateFilter(index, { topic: e.target.value, subtopic: '' })} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-sm">
                        <option value="">All topics</option>{topics.map((t: Topic) => <option key={t._id} value={t._id}>{t.name}</option>)}
                      </select>
                    </label>}
                    {(activeTopic?.subtopics?.length ?? 0) > 0 && <label className="text-xs font-semibold text-gray-600">Subtopic
                      <select value={f.subtopic} onChange={e => updateFilter(index, { subtopic: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-sm">
                        <option value="">All subtopics</option>{activeTopic?.subtopics?.map((s: { _id: string; name: string }) => <option key={s._id} value={s._id}>{s.name}</option>)}
                      </select>
                    </label>}
                  </div>
                  {(f.subject || f.grade || f.topic || f.subtopic) && (
                    <button type="button" onClick={() => updateFilter(index, blankFilter())} className="text-xs text-brand-primary hover:underline">Clear filters</button>
                  )}
                </div>

                {/* Question checklist */}
                <div className="rounded-lg border border-gray-200 bg-white">
                  <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 text-sm">
                    <span className="font-semibold text-gray-800">Question bank</span>
                    <span className="text-gray-500">{section.questions.length} selected · {visible.length} shown</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto p-2">
                    {visible.length === 0
                      ? <p className="px-2 py-4 text-sm text-gray-400">No questions match the current filters.</p>
                      : visible.map(q => (
                          <label key={q._id} className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 hover:bg-gray-50">
                            <input type="checkbox" checked={section.questions.includes(q._id)} onChange={() => toggleQuestion(index, q._id)} className="mt-1 h-4 w-4 accent-brand-primary" />
                            <span className="min-w-0">
                              <span className="block text-sm text-gray-800">{q.question}</span>
                              <span className="mt-0.5 block text-xs text-gray-400">
                                {[q.subject?.name, q.grade?.name, q.topic?.name].filter(Boolean).join(' · ')} &mdash; {q.difficulty} · {q.marks}m
                              </span>
                            </span>
                          </label>
                        ))
                    }
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 pt-5">
          <span className="text-sm text-gray-500">{totalSelected} question{totalSelected !== 1 ? 's' : ''} across {form.sections.length} section{form.sections.length !== 1 ? 's' : ''}</span>
          <div className="flex gap-3">
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="button" onClick={() => setPreview(true)} className="inline-flex items-center gap-2 rounded-lg border border-brand-primary px-4 py-2.5 text-sm font-semibold text-brand-primary hover:bg-brand-lighter/30"><Eye className="h-4 w-4" />Preview</button>
            <button disabled={saving} type="submit" className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><FilePlus2 className="h-4 w-4" />{saving ? 'Creating...' : 'Create practice book'}</button>
          </div>
        </div>
      </form>
    </Modal>

    {/* Preview Modal */}
    <Modal isOpen={preview} onClose={() => setPreview(false)} title="Practice book preview" size="xl">
      <div className="space-y-5">
        <div className="rounded-xl bg-gray-50 p-4 space-y-2">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-brand-lighter/60 px-3 py-1 text-xs font-semibold text-brand-primary">{form.type.replace(/_/g, ' ')}</span>
            <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 capitalize">{form.difficulty}</span>
            <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">{Math.round(form.timeLimit / 60)} min</span>
            <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">{form.attemptsAllowed} attempt{form.attemptsAllowed !== 1 ? 's' : ''}</span>
            {form.isPublished && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Published</span>}
          </div>
          <h2 className="text-lg font-bold text-gray-950">{form.name || <span className="italic text-gray-400">Untitled</span>}</h2>
          {form.description && <p className="text-sm text-gray-600">{form.description}</p>}
          {(form.startDate || form.endDate) && <p className="text-xs text-gray-400">Available: {form.startDate || '∞'} → {form.endDate || '∞'}</p>}
        </div>
        <div className="space-y-3">
          {form.sections.map((section, idx) => {
            const picked = allQuestions.filter(q => section.questions.includes(q._id));
            return (
              <div key={idx} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Section {idx + 1}: {section.name || <span className="italic text-gray-400">Unnamed</span>}</p>
                    {section.instructions && <p className="mt-0.5 text-xs italic text-gray-500">{section.instructions}</p>}
                  </div>
                  <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">{picked.length} Q</span>
                </div>
                {picked.length > 0 && (
                  <ul className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
                    {picked.map((q, qi) => (
                      <li key={q._id} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="mt-0.5 shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-gray-500">{qi + 1}</span>
                        <span className="line-clamp-2">{q.question}</span>
                        <span className="ml-auto shrink-0 text-xs text-gray-400">{q.marks}m</span>
                      </li>
                    ))}
                  </ul>
                )}
                {picked.length === 0 && <p className="mt-3 border-t border-gray-100 pt-3 text-xs italic text-gray-400">No questions selected yet.</p>}
              </div>
            );
          })}
        </div>
        <div className="flex justify-end border-t border-gray-200 pt-4">
          <button type="button" onClick={() => setPreview(false)} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Back to edit</button>
        </div>
      </div>
    </Modal>
  </div>;
}
