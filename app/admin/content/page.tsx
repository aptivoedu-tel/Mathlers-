'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { BookOpen, Check, Pencil, Plus, Tags, Trash2, X, GraduationCap } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import PageHeader from '@/components/ui/PageHeader';
import PrimaryButton from '@/components/ui/PrimaryButton';

type Subject = { _id: string; name: string; code: string; grades?: Grade[]; description?: string; color?: string; order: number; isActive: boolean };
type Grade = { _id: string; name: string; code: string; order: number; isActive: boolean };
type Chapter = { _id: string; name: string; grade: { _id: string }; subject: { _id: string } };
type Subtopic = { _id?: string; name: string; code?: string };
type Topic = {
  _id: string; name: string; code: string; description?: string; grade: string | { _id: string; name: string };
  chapter: string | { _id: string; name: string }; subject: string | { _id: string; name: string };
  subjects?: Array<{ _id: string; name: string }>; subtopics: Subtopic[]; order: number; isActive: boolean;
};

const emptySubject = { name: '', code: '', grades: [] as string[], description: '', color: '#C1121F', order: 0, isActive: true };
const emptyGrade = { name: '', code: '', order: 0, isActive: true };
const emptyTopic = { name: '', code: '', description: '', grade: '', chapter: '', subjects: [] as string[], subtopics: [] as Subtopic[], order: 0, isActive: true };

type GradeForm = typeof emptyGrade;
type SubjectForm = typeof emptySubject;

const api = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.error || 'Request failed');
  return data;
};
const idOf = (value: string | { _id: string }) => typeof value === 'string' ? value : value._id;
const inputClass = 'mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500';
const inlineInputClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500';
const modalFooterClass = 'sticky bottom-0 -mx-5 -mb-5 mt-6 flex flex-col-reverse gap-3 border-t border-gray-200 bg-white/95 px-5 py-4 backdrop-blur sm:-mx-6 sm:-mb-6 sm:flex-row sm:justify-end sm:px-6';
const modalButtonClass = 'inline-flex min-h-11 w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand-primary/25 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-28';

function ModalField({ label, htmlFor, helper, children }: { label: string; htmlFor: string; helper?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-gray-800">{label}</label>
      {children}
      {helper && <p className="mt-1.5 text-xs leading-5 text-gray-500">{helper}</p>}
    </div>
  );
}

export default function ContentPage() {
  const [section, setSection] = useState<'subjects' | 'grades' | 'topics'>('subjects');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  const [subjectForm, setSubjectForm] = useState(emptySubject);
  const [gradeForm, setGradeForm] = useState(emptyGrade);
  const [gradeRows, setGradeRows] = useState<GradeForm[]>([{ ...emptyGrade }]);
  const [topicForm, setTopicForm] = useState(emptyTopic);

  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

  const [subjectModal, setSubjectModal] = useState(false);
  const [gradeModal, setGradeModal] = useState(false);
  const [topicModal, setTopicModal] = useState(false);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      const [subjectData, gradeData, topicData] = await Promise.all([
        api('/api/admin/subjects'), api('/api/admin/grades'), api('/api/admin/topics'),
      ]);
      setSubjects(subjectData.data);
      setGrades(gradeData.data);
      setTopics(topicData.data);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to load curriculum'); }
  }, []);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const loadChapters = useCallback(async (grade: string, subject: string) => {
    if (!grade || !subject) return setChapters([]);
    try { setChapters((await api(`/api/admin/chapters?grade=${grade}&subject=${subject}`)).data); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to load chapters'); }
  }, []);

  const openSubject = (subject?: Subject) => {
    setEditingSubject(subject || null);
    setSubjectForm(subject ? { name: subject.name, code: subject.code, grades: subject.grades?.map((grade) => grade._id) || [], description: subject.description || '', color: subject.color || '#C1121F', order: subject.order, isActive: subject.isActive } : emptySubject);
    setSubjectModal(true);
  };

  const openGrade = (grade?: Grade) => {
    setEditingGrade(grade || null);
    if (grade) {
      setGradeForm({ name: grade.name, code: grade.code, order: grade.order || 0, isActive: grade.isActive ?? true });
    } else {
      setGradeRows([{ ...emptyGrade }]);
    }
    setGradeModal(true);
  };

  const openTopic = (topic?: Topic) => {
    setEditingTopic(topic || null);
    const linkedSubjects = topic?.subjects?.map((subject) => subject._id) || (topic ? [idOf(topic.subject)] : []);
    const form = topic ? {
      name: topic.name, code: topic.code, description: topic.description || '', grade: idOf(topic.grade), chapter: idOf(topic.chapter),
      subjects: linkedSubjects, subtopics: topic.subtopics || [], order: topic.order, isActive: topic.isActive,
    } : emptyTopic;
    setTopicForm(form);
    void loadChapters(form.grade, form.subjects[0] || '');
    setTopicModal(true);
  };

  const saveSubject = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      await api(editingSubject ? `/api/admin/subjects/${editingSubject._id}` : '/api/admin/subjects', {
        method: editingSubject ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(subjectForm),
      });
      setSubjectModal(false); setMessage(`Subject ${editingSubject ? 'updated' : 'created'}.`); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save subject'); }
    finally { setSaving(false); }
  };

  const saveGrade = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      if (editingGrade) {
        await api(`/api/admin/grades/${editingGrade._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(gradeForm) });
        setMessage('Grade updated.');
      } else {
        const results = await Promise.allSettled(
          gradeRows.filter(r => r.name.trim() && r.code.trim()).map(row =>
            api('/api/admin/grades', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(row) })
          )
        );
        const failed = results.filter(r => r.status === 'rejected');
        const created = results.filter(r => r.status === 'fulfilled').length;
        setMessage(failed.length ? `${created} created; ${failed.length} failed: ${(failed[0] as PromiseRejectedResult).reason?.message}` : `${created} grade${created !== 1 ? 's' : ''} created.`);
      }
      setGradeModal(false); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save grade'); }
    finally { setSaving(false); }
  };

  const saveTopic = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      await api(editingTopic ? `/api/admin/topics/${editingTopic._id}` : '/api/admin/topics', {
        method: editingTopic ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(topicForm),
      });
      setTopicModal(false); setMessage(`Topic ${editingTopic ? 'updated' : 'created'}.`); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save topic'); }
    finally { setSaving(false); }
  };

  const remove = async (type: 'subjects' | 'grades' | 'topics', id: string) => {
    if (!window.confirm(`Delete this ${type.slice(0, -1)}?`)) return;
    try { await api(`/api/admin/${type}/${id}`, { method: 'DELETE' }); setMessage('Deleted.'); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to delete item'); }
  };

  const toggleSubject = (id: string) => setTopicForm((form) => {
    const subjects = form.subjects.includes(id) ? form.subjects.filter((value) => value !== id) : [...form.subjects, id];
    void loadChapters(form.grade, subjects[0] || '');
    return { ...form, subjects, chapter: '' };
  });

  const toggleSubjectGrade = (id: string) => setSubjectForm((form) => ({ ...form, grades: form.grades.includes(id) ? form.grades.filter((value) => value !== id) : [...form.grades, id] }));

  const setTopicGrade = (grade: string) => {
    setTopicForm((form) => {
      const available = subjects.filter((subject) => !grade || !subject.grades?.length || subject.grades.some((item) => item._id === grade)).map((subject) => subject._id);
      const linkedSubjects = form.subjects.filter((subject) => available.includes(subject));
      void loadChapters(grade, linkedSubjects[0] || '');
      return { ...form, grade, chapter: '', subjects: linkedSubjects };
    });
  };

  const setSubtopic = (index: number, field: keyof Subtopic, value: string) => setTopicForm((form) => ({ ...form, subtopics: form.subtopics.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) }));

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Subjects, Grades & Topics"
        subtitle="Build the taxonomy used when authors create questions and competitions."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Content' }
        ]}
        actions={
          <PrimaryButton size="sm" onClick={() => section === 'subjects' ? openSubject() : section === 'grades' ? openGrade() : openTopic()}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add {section === 'subjects' ? 'Subject' : section === 'grades' ? 'Grade' : 'Topic'}
          </PrimaryButton>
        }
      />

      <div className="flex gap-2">
        <button onClick={() => setSection('subjects')} className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${section === 'subjects' ? 'bg-brand-primary text-white shadow-xs' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
          <BookOpen className="h-3.5 w-3.5" /> Subjects ({subjects.length})
        </button>
        <button onClick={() => setSection('grades')} className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${section === 'grades' ? 'bg-brand-primary text-white shadow-xs' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
          <GraduationCap className="h-3.5 w-3.5" /> Grades ({grades.length})
        </button>
        <button onClick={() => setSection('topics')} className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${section === 'topics' ? 'bg-brand-primary text-white shadow-xs' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
          <Tags className="h-3.5 w-3.5" /> Topics ({topics.length})
        </button>
      </div>

      {message && <div className="flex items-center justify-between rounded-lg border border-brand-primary/20 bg-brand-lighter/40 px-4 py-3 text-sm text-gray-800"><span>{message}</span><button onClick={() => setMessage('')} aria-label="Dismiss message"><X className="h-4 w-4" /></button></div>}

      {section === 'subjects' ? (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="grid grid-cols-[minmax(180px,1.2fr)_100px_minmax(160px,1fr)_minmax(180px,1.4fr)_100px_110px] gap-4 border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-gray-500"><span>Subject</span><span>Code</span><span>Grades</span><span>Description</span><span>Status</span><span className="text-right">Actions</span></div>
          {subjects.map((subject) => <div key={subject._id} className="grid grid-cols-[minmax(180px,1.2fr)_100px_minmax(160px,1fr)_minmax(180px,1.4fr)_100px_110px] items-center gap-4 border-b border-gray-100 px-5 py-4 last:border-0">
            <div className="flex min-w-0 items-center gap-3"><span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: subject.color || '#C1121F' }} /><span className="truncate font-semibold text-gray-950">{subject.name}</span></div>
            <span className="font-mono text-sm text-gray-600">{subject.code}</span>
            <span className="truncate text-sm text-gray-600">{subject.grades?.length ? subject.grades.map((grade) => grade.name).join(', ') : 'All grades'}</span>
            <span className="truncate text-sm text-gray-600">{subject.description || 'No description'}</span>
            <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${subject.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{subject.isActive ? 'Active' : 'Hidden'}</span>
            <div className="flex justify-end gap-1"><button onClick={() => openSubject(subject)} className="rounded-md p-2 text-gray-600 hover:bg-gray-100" aria-label={`Edit ${subject.name}`}><Pencil className="h-4 w-4" /></button><button onClick={() => void remove('subjects', subject._id)} className="rounded-md p-2 text-red-600 hover:bg-red-50" aria-label={`Delete ${subject.name}`}><Trash2 className="h-4 w-4" /></button></div>
          </div>)}
          {!subjects.length && <div className="px-5 py-16 text-center text-sm text-gray-500">No subjects yet. Add the first one to begin organizing the question bank.</div>}
        </div>
      ) : section === 'grades' ? (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="grid grid-cols-[minmax(180px,1.5fr)_120px_100px_100px_110px] gap-4 border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-gray-500"><span>Grade Name</span><span>Code</span><span>Order</span><span>Status</span><span className="text-right">Actions</span></div>
          {grades.map((grade) => (
            <div key={grade._id} className="grid grid-cols-[minmax(180px,1.5fr)_120px_100px_100px_110px] items-center gap-4 border-b border-gray-100 px-5 py-4 last:border-0">
              <span className="font-semibold text-gray-950">{grade.name}</span>
              <span className="font-mono text-sm text-gray-600">{grade.code}</span>
              <span className="text-sm text-gray-600">{grade.order}</span>
              <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${grade.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{grade.isActive ? 'Active' : 'Hidden'}</span>
              <div className="flex justify-end gap-1">
                <button onClick={() => openGrade(grade)} className="rounded-md p-2 text-gray-600 hover:bg-gray-100"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => void remove('grades', grade._id)} className="rounded-md p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
          {!grades.length && <div className="px-5 py-16 text-center text-sm text-gray-500">No grades yet. Add a grade to start organizing curriculum level limits.</div>}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="grid grid-cols-[minmax(180px,1.2fr)_minmax(170px,1fr)_minmax(140px,0.8fr)_minmax(170px,1fr)_100px] gap-4 border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-gray-500"><span>Topic</span><span>Subjects</span><span>Grade</span><span>Subtopics</span><span className="text-right">Actions</span></div>
          {topics.map((topic) => <div key={topic._id} className="grid grid-cols-[minmax(180px,1.2fr)_minmax(170px,1fr)_minmax(140px,0.8fr)_minmax(170px,1fr)_100px] items-center gap-4 border-b border-gray-100 px-5 py-4 last:border-0">
            <div><p className="font-semibold text-gray-950">{topic.name}</p><p className="mt-1 font-mono text-xs text-gray-500">{topic.code}</p></div>
            <div className="flex flex-wrap gap-1">{(topic.subjects?.length ? topic.subjects : [topic.subject]).map((subject) => <span key={idOf(subject)} className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">{typeof subject === 'string' ? 'Subject' : subject.name}</span>)}</div>
            <span className="text-sm text-gray-600">{typeof topic.grade === 'string' ? (topic.grade || 'All Grades') : (topic.grade?.name || 'All Grades')}</span>
            <div className="flex flex-wrap gap-1">{topic.subtopics?.length ? topic.subtopics.map((subtopic) => <span key={subtopic._id || subtopic.name} className="rounded-md bg-brand-lighter/60 px-2 py-1 text-xs font-medium text-brand-dark">{subtopic.name}</span>) : <span className="text-sm text-gray-500">None</span>}</div>
            <div className="flex justify-end gap-1"><button onClick={() => openTopic(topic)} className="rounded-md p-2 text-gray-600 hover:bg-gray-100" aria-label={`Edit ${topic.name}`}><Pencil className="h-4 w-4" /></button><button onClick={() => void remove('topics', topic._id)} className="rounded-md p-2 text-red-600 hover:bg-red-50" aria-label={`Delete ${topic.name}`}><Trash2 className="h-4 w-4" /></button></div>
          </div>)}
          {!topics.length && <div className="px-5 py-16 text-center text-sm text-gray-500">No topics yet. Create a topic, connect its subjects, then add its subtopics.</div>}
        </div>
      )}

      {/* Subject Modal */}
      <Modal
        isOpen={subjectModal}
        onClose={() => setSubjectModal(false)}
        title={editingSubject ? 'Edit subject' : 'Add subject'}
      >
        <form id="subject-form" onSubmit={saveSubject} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <ModalField label="Name" htmlFor="subject-name" helper="Shown in lists and authoring filters.">
              <input id="subject-name" required value={subjectForm.name} onChange={(event) => setSubjectForm({ ...subjectForm, name: event.target.value })} className={inputClass} placeholder="Mathematics" />
            </ModalField>
            <ModalField label="Code" htmlFor="subject-code" helper="Use a short unique code.">
              <input id="subject-code" required value={subjectForm.code} onChange={(event) => setSubjectForm({ ...subjectForm, code: event.target.value.toUpperCase() })} className={`${inputClass} font-mono uppercase`} placeholder="MATH" />
            </ModalField>
          </div>

          <ModalField label="Description" htmlFor="subject-description" helper="Optional context for admins reviewing the subject list.">
            <textarea id="subject-description" value={subjectForm.description} onChange={(event) => setSubjectForm({ ...subjectForm, description: event.target.value })} className={`${inputClass} min-h-24 resize-y`} rows={3} />
          </ModalField>

          <fieldset className="rounded-lg border border-gray-200 bg-gray-50/70 p-4">
            <legend className="px-1 text-sm font-semibold text-gray-800">Grades</legend>
            <p className="mt-1 text-xs leading-5 text-gray-500">Leave empty when the subject is available to every student grade.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {grades.map((grade) => {
                const selected = subjectForm.grades.includes(grade._id);
                return (
                  <label key={grade._id} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm font-medium transition focus-within:ring-2 focus-within:ring-brand-primary/20 ${selected ? 'border-brand-primary bg-brand-lighter/40 text-gray-950' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}>
                    <input type="checkbox" checked={selected} onChange={() => toggleSubjectGrade(grade._id)} className="sr-only" />
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${selected ? 'border-brand-primary bg-brand-primary text-white' : 'border-gray-300 bg-white'}`}>{selected && <Check className="h-3.5 w-3.5" />}</span>
                    <span className="min-w-0 truncate">{grade.name}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <ModalField label="Color" htmlFor="subject-color">
              <div className="mt-2 flex items-center gap-3 rounded-lg border border-gray-300 bg-white px-3 py-2">
                <input id="subject-color" type="color" value={subjectForm.color} onChange={(event) => setSubjectForm({ ...subjectForm, color: event.target.value })} className="h-8 w-12 shrink-0 cursor-pointer rounded-md border-0 bg-transparent p-0" />
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Hex</span>
                <output htmlFor="subject-color" className="font-mono text-sm text-gray-700">{subjectForm.color.toUpperCase()}</output>
              </div>
            </ModalField>
            <ModalField label="Display order" htmlFor="subject-order">
              <input id="subject-order" type="number" value={subjectForm.order} onChange={(event) => setSubjectForm({ ...subjectForm, order: Number(event.target.value) })} className={inputClass} />
            </ModalField>
          </div>

          <div className={modalFooterClass}>
            <button type="button" onClick={() => setSubjectModal(false)} className={`${modalButtonClass} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50`}>Cancel</button>
            <button type="submit" disabled={saving} className={`${modalButtonClass} bg-brand-primary text-white shadow-sm hover:bg-brand-dark`}>{saving ? 'Saving...' : 'Save subject'}</button>
          </div>
        </form>
      </Modal>

      {/* Grade Modal */}
      <Modal
        isOpen={gradeModal}
        onClose={() => setGradeModal(false)}
        title={editingGrade ? 'Edit grade' : 'Add grade'}
      >
        <form onSubmit={saveGrade} className="space-y-4">
          {editingGrade ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <ModalField label="Grade Name" htmlFor="grade-name" helper="e.g. Grade 1, Grade 7, O Levels">
                  <input id="grade-name" required value={gradeForm.name} onChange={(e) => setGradeForm({ ...gradeForm, name: e.target.value })} className={inputClass} placeholder="Grade 7" />
                </ModalField>
                <ModalField label="Code" htmlFor="grade-code" helper="Unique short code, e.g. G7">
                  <input id="grade-code" required value={gradeForm.code} onChange={(e) => setGradeForm({ ...gradeForm, code: e.target.value.toUpperCase() })} className={`${inputClass} font-mono uppercase`} placeholder="G7" />
                </ModalField>
              </div>
              <ModalField label="Display Order" htmlFor="grade-order" helper="Lower numbers appear first">
                <input id="grade-order" type="number" value={gradeForm.order} onChange={(e) => setGradeForm({ ...gradeForm, order: Number(e.target.value) })} className={inputClass} />
              </ModalField>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-500">Fill in one or more grades below. Click <strong>+ Add More</strong> to add additional rows.</p>
              <div className="space-y-2">
                {gradeRows.map((row, i) => (
                  <div key={i} className="grid grid-cols-[1fr_120px_60px_44px] gap-2 items-center">
                    <input required value={row.name} onChange={(e) => setGradeRows(rows => rows.map((r, idx) => idx === i ? { ...r, name: e.target.value } : r))} className={inlineInputClass} placeholder="Grade 7" />
                    <input required value={row.code} onChange={(e) => setGradeRows(rows => rows.map((r, idx) => idx === i ? { ...r, code: e.target.value.toUpperCase() } : r))} className={`${inlineInputClass} font-mono uppercase`} placeholder="G7" />
                    <input type="number" value={row.order} onChange={(e) => setGradeRows(rows => rows.map((r, idx) => idx === i ? { ...r, order: Number(e.target.value) } : r))} className={inlineInputClass} placeholder="0" title="Order" />
                    <button type="button" disabled={gradeRows.length === 1} onClick={() => setGradeRows(rows => rows.filter((_, idx) => idx !== i))} className="inline-flex h-11 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setGradeRows(rows => [...rows, { ...emptyGrade }])} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 w-full justify-center">
                <Plus className="h-4 w-4" /> Add More
              </button>
            </>
          )}
          <div className={modalFooterClass}>
            <button type="button" onClick={() => setGradeModal(false)} className={`${modalButtonClass} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50`}>Cancel</button>
            <button type="submit" disabled={saving} className={`${modalButtonClass} bg-brand-primary text-white shadow-sm hover:bg-brand-dark`}>{saving ? 'Saving...' : editingGrade ? 'Save grade' : `Save ${gradeRows.filter(r=>r.name.trim()).length || 1} grade${gradeRows.filter(r=>r.name.trim()).length !== 1 ? 's' : ''}`}</button>
          </div>
        </form>
      </Modal>

      {/* Topic Modal */}
      <Modal isOpen={topicModal} onClose={() => setTopicModal(false)} title={editingTopic ? 'Edit topic' : 'Add topic'} size="xl">
        <form onSubmit={saveTopic} className="space-y-6">
          <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <ModalField label="Topic name" htmlFor="topic-name">
                <input id="topic-name" required value={topicForm.name} onChange={(event) => setTopicForm({ ...topicForm, name: event.target.value })} className={inputClass} />
              </ModalField>
              <ModalField label="Code" htmlFor="topic-code">
                <input id="topic-code" required value={topicForm.code} onChange={(event) => setTopicForm({ ...topicForm, code: event.target.value })} className={`${inputClass} font-mono`} />
              </ModalField>
            </div>
            <ModalField label="Description" htmlFor="topic-description">
              <textarea id="topic-description" value={topicForm.description} onChange={(event) => setTopicForm({ ...topicForm, description: event.target.value })} className={`${inputClass} min-h-20 resize-y`} rows={2} />
            </ModalField>
          </section>

          <fieldset className="rounded-lg border border-gray-200 bg-gray-50/70 p-4">
            <legend className="px-1 text-sm font-semibold text-gray-800">Linked subjects</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {subjects.filter((subject) => subject.isActive && (!topicForm.grade || !subject.grades?.length || subject.grades.some((grade) => grade._id === topicForm.grade))).map((subject) => {
                const selected = topicForm.subjects.includes(subject._id);
                return (
                  <label key={subject._id} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${selected ? 'border-brand-primary bg-brand-lighter/40 text-gray-950' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}>
                    <input type="checkbox" checked={selected} onChange={() => toggleSubject(subject._id)} className="sr-only" />
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${selected ? 'border-brand-primary bg-brand-primary text-white' : 'border-gray-300 bg-white'}`}>{selected && <Check className="h-3.5 w-3.5" />}</span>
                    <span className="min-w-0 truncate">{subject.name}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <section className="grid gap-4 sm:grid-cols-1">
            <ModalField label="Grade (Optional)" htmlFor="topic-grade" helper="Select a grade or leave as All Grades for universal topics">
              <select id="topic-grade" value={topicForm.grade} onChange={(event) => setTopicGrade(event.target.value)} className={inputClass}>
                <option value="">All Grades (Optional)</option>
                {grades.map((grade) => <option key={grade._id} value={grade._id}>{grade.name}</option>)}
              </select>
            </ModalField>
          </section>

          <section className="rounded-lg border border-gray-200 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Subtopics</h3>
              </div>
              <button type="button" onClick={() => setTopicForm({ ...topicForm, subtopics: [...topicForm.subtopics, { name: '', code: '' }] })} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
                <Plus className="h-4 w-4" /> Add subtopic
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {topicForm.subtopics.map((subtopic, index) => (
                <div key={subtopic._id || index} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px_44px]">
                  <input required value={subtopic.name} onChange={(event) => setSubtopic(index, 'name', event.target.value)} className={inlineInputClass} placeholder="Subtopic name" />
                  <input value={subtopic.code || ''} onChange={(event) => setSubtopic(index, 'code', event.target.value)} className={`${inlineInputClass} font-mono`} placeholder="Code" />
                  <button type="button" onClick={() => setTopicForm({ ...topicForm, subtopics: topicForm.subtopics.filter((_, itemIndex) => itemIndex !== index) })} className="inline-flex h-11 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </section>

          <div className={modalFooterClass}>
            <button type="button" onClick={() => setTopicModal(false)} className={`${modalButtonClass} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50`}>Cancel</button>
            <button type="submit" disabled={saving} className={`${modalButtonClass} bg-brand-primary text-white shadow-sm hover:bg-brand-dark`}>{saving ? 'Saving...' : 'Save topic'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
