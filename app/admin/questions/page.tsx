'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import GlassCard from '@/components/ui/GlassCard';
import PrimaryButton from '@/components/ui/PrimaryButton';
import Modal from '@/components/ui/Modal';
import QuestionForm from '@/components/forms/admin/QuestionForm';
import PageHeader from '@/components/ui/PageHeader';
import { AlertCircle, BarChart3, CheckCircle2, Download, Edit, FileSpreadsheet, Filter, Layers3, Plus, Search, Trash2, Upload, X } from 'lucide-react';

interface QuestionFormData {
  subject: string;
  grade?: string;
  chapter?: string;
  topic?: string;
  subtopic?: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  estimatedTime: number;
  status: 'active' | 'inactive' | 'archived';
}

interface Question {
  _id: string;
  subject: { _id: string; name: string };
  grade?: { _id: string; name: string };
  chapter?: { _id: string; name: string };
  topic?: { _id: string; name: string; subtopics?: Array<{ _id: string; name: string }> };
  subtopic?: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  estimatedTime: number;
  status: 'active' | 'inactive' | 'archived';
  analytics: {
    totalAttempts: number;
    correctPercentage: number;
  };
}

interface Subject {
  _id: string;
  name: string;
  code: string;
  grades?: Array<{ _id: string; name: string }>;
}

interface Grade {
  _id: string;
  name: string;
  level: string;
}

interface QuestionsResponse {
  success?: boolean;
  data?: Question[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
  error?: string;
}

interface LookupResponse<T> {
  success?: boolean;
  data?: T[];
  error?: string;
}

interface BulkUploadResponse {
  success?: boolean;
  message?: string;
  inserted?: number;
  failed?: number;
  errors?: Array<{ row: number; error: string }>;
  error?: string;
}

type BulkQuestionPayload = Partial<QuestionFormData> & {
  options?: Partial<QuestionFormData['options']>;
};

interface UploadPreview {
  name: string;
  questions: BulkQuestionPayload[];
}

const parseCsv = (text: string) => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);

  const [headers = [], ...dataRows] = rows;
  return dataRows.map((values) =>
    headers.reduce<Record<string, string>>((item, header, index) => {
      item[header.trim()] = values[index]?.trim() || '';
      return item;
    }, {})
  );
};

const cellValue = (value: unknown) => typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();

const normalizeBulkRow = (row: Record<string, unknown>): BulkQuestionPayload => {
  const nestedOptions = typeof row.options === 'object' && row.options !== null
    ? row.options as Record<string, unknown>
    : {};

  return {
  subject: cellValue(row.subject || row.subjectId),
  grade: cellValue(row.grade || row.gradeId),
  chapter: cellValue(row.chapter || row.chapterId),
  topic: cellValue(row.topic || row.topicId),
  subtopic: cellValue(row.subtopic || row.subtopicId),
  question: cellValue(row.question),
  options: {
    A: cellValue(row.optionA || row.A || nestedOptions.A),
    B: cellValue(row.optionB || row.B || nestedOptions.B),
    C: cellValue(row.optionC || row.C || nestedOptions.C),
    D: cellValue(row.optionD || row.D || nestedOptions.D),
  },
  correctAnswer: cellValue(row.correctAnswer).toUpperCase() as QuestionFormData['correctAnswer'],
  explanation: cellValue(row.explanation),
  difficulty: cellValue(row.difficulty || 'medium') as QuestionFormData['difficulty'],
  marks: Number(row.marks || 1),
  estimatedTime: Number(row.estimatedTime || 60),
  status: cellValue(row.status || 'active') as QuestionFormData['status'],
  };
};

const toFormData = (question: Question): QuestionFormData => ({
  subject: question.subject?._id || '',
  grade: question.grade?._id || '',
  chapter: question.chapter?._id || '',
  topic: question.topic?._id || '',
  subtopic: question.subtopic || '',
  question: question.question,
  options: question.options,
  correctAnswer: question.correctAnswer,
  explanation: question.explanation,
  difficulty: question.difficulty,
  marks: question.marks,
  estimatedTime: question.estimatedTime,
  status: question.status,
});

const subtopicName = (question: Question) => question.topic?.subtopics?.find((item) => item._id === question.subtopic)?.name;

const getErrorMessage = (error: unknown) => (
  error instanceof Error ? error.message : 'Something went wrong'
);

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedSubtopic, setSelectedSubtopic] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [topics, setTopics] = useState<Array<{ _id: string; name: string; subtopics?: Array<{ _id: string; name: string }> }>>([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<UploadPreview | null>(null);
  const [bulkResult, setBulkResult] = useState<BulkUploadResponse | null>(null);
  const [notice, setNotice] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTopics = useCallback(async (subjectId: string, gradeId?: string) => {
    try {
      let url = `/api/admin/topics?subject=${subjectId}`;
      if (gradeId) url += `&grade=${gradeId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Unable to load topics.');
      const data = await res.json();
      if (data.success && data.data) {
        setTopics(data.data);
      } else {
        setTopics([]);
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
      setTopics([]);
    }
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      const controller = new AbortController();
      void fetchTopics(selectedSubject, selectedGrade);
      return () => controller.abort();
    } else {
      setTopics([]);
      setSelectedTopic('');
      setSelectedSubtopic('');
    }
  }, [selectedSubject, selectedGrade, fetchTopics]);

  const fetchQuestions = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedSubject && { subject: selectedSubject }),
        ...(selectedGrade && { grade: selectedGrade }),
        ...(selectedTopic && { topic: selectedTopic }),
        ...(selectedSubtopic && { subtopic: selectedSubtopic }),
        ...(selectedDifficulty && { difficulty: selectedDifficulty })
      });

      const res = await fetch(`/api/admin/questions?${params}`);
      const data = await res.json() as QuestionsResponse;
      
      if (data.success && data.data && data.pagination) {
        setQuestions(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedDifficulty, selectedGrade, selectedSubject, selectedTopic, selectedSubtopic]);

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await fetch('/api/public/subjects');
      const data = await res.json() as LookupResponse<Subject>;
      if (data.success && data.data) {
        setSubjects(data.data);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  }, []);

  const fetchGrades = useCallback(async () => {
    try {
      const res = await fetch('/api/public/grades');
      const data = await res.json() as LookupResponse<Grade>;
      if (data.success && data.data) {
        setGrades(data.data);
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => {
      fetchQuestions();
      fetchSubjects();
      fetchGrades();
    });
  }, [fetchGrades, fetchQuestions, fetchSubjects]);

  const handleCreateQuestion = async (formData: QuestionFormData) => {
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (data.success) {
        setNotice('Question created successfully.');
        void fetchQuestions();
      } else {
        throw new Error(data.error || 'Failed to create question');
      }
    } catch (error) {
      console.error('Error creating question:', error);
      const message = getErrorMessage(error);
      setNotice(message);
      throw error;
    }
  };

  const handleUpdateQuestion = async (formData: QuestionFormData) => {
    if (!editingQuestion) return;
    
    try {
      const res = await fetch(`/api/admin/questions/${editingQuestion._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (data.success) {
        setNotice('Question updated successfully.');
        void fetchQuestions();
        setEditingQuestion(null);
      } else {
        throw new Error(data.error || 'Failed to update question');
      }
    } catch (error) {
      console.error('Error updating question:', error);
      const message = getErrorMessage(error);
      setNotice(message);
      throw error;
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this question? This action cannot be undone.')) return;
    
    try {
      const res = await fetch(`/api/admin/questions/${id}`, {
        method: 'DELETE'
      });
      
      const data = await res.json();
      
      if (data.success) {
        setNotice('Question deleted successfully.');
        fetchQuestions();
      } else {
        setNotice(data.error || 'Failed to delete question');
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      setNotice('Failed to delete question');
    }
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingQuestion(null);
  };

  const handleFilter = () => {
    fetchQuestions(1);
  };

  const downloadTemplate = () => {
    const template = [
      'subject,grade,chapter,topic,subtopic,question,optionA,optionB,optionC,optionD,correctAnswer,explanation,difficulty,marks,estimatedTime,status',
      'subject-id,grade-id,chapter-id,topic-id,subtopic-id,"Solve $x^2 = 9$.","$x = 3$","$x = -3$","$x = \\pm 3$","$x = 0$",C,"Because $x^2 = 9$ has two roots.",easy,1,60,active'
    ].join('\n');
    const url = URL.createObjectURL(new Blob([template], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'questions-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const parseBulkFile = async (file: File): Promise<BulkQuestionPayload[]> => {
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Choose a file smaller than 5 MB. Split larger uploads into smaller batches.');
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    let rawItems: unknown;

    if (extension === 'json') {
      rawItems = JSON.parse(await file.text());
    } else if (extension === 'csv') {
      rawItems = parseCsv(await file.text());
    } else {
      throw new Error('Use a CSV or JSON file.');
    }

    const items = Array.isArray(rawItems) ? rawItems : isRecord(rawItems) ? rawItems.questions : undefined;
    if (!Array.isArray(items) || !items.length || !items.every(isRecord)) {
      throw new Error('The file must contain one or more question rows. JSON may use an array or a { questions: [] } object.');
    }

    if (items.length > 250) {
      throw new Error('Upload up to 250 questions at a time. Split larger files into smaller batches.');
    }

    return items.map(normalizeBulkRow);
  };

  const handleBulkFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setBulkResult(null);
      setUploadPreview({ name: file.name, questions: await parseBulkFile(file) });
    } catch (error) {
      setBulkResult({ success: false, error: getErrorMessage(error) });
    } finally {
      event.target.value = '';
    }
  };

  const submitBulkUpload = async () => {
    if (!uploadPreview) return;

    try {
      setBulkUploading(true);
      const res = await fetch('/api/admin/questions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: uploadPreview.questions })
      });
      const data = await res.json() as BulkUploadResponse;

      setBulkResult(data);
      if (data.success) {
        setNotice(`${data.inserted || 0} questions uploaded${data.failed ? `; ${data.failed} need attention.` : '.'}`);
        void fetchQuestions();
      }
    } catch (error) {
      setBulkResult({ success: false, error: getErrorMessage(error) });
    } finally {
      setBulkUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <PageHeader
        title="Question Bank"
        subtitle={`${pagination.total} questions across configured subjects, topics, and subtopics.`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Question Bank' }
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json,application/json,text/csv"
              className="hidden"
              onChange={handleBulkFileSelect}
            />
            <button onClick={() => setIsUploadOpen(true)} disabled={bulkUploading} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 shadow-xs disabled:opacity-50">
              <Upload className="h-3.5 w-3.5" /> Upload File
            </button>
            <Link href="/admin/content" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 shadow-xs"><Layers3 className="h-3.5 w-3.5" /> Curriculum</Link>
            <PrimaryButton size="sm" onClick={() => setIsFormOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Question
            </PrimaryButton>
          </div>
        }
      />

      {notice && <div className="flex items-center justify-between rounded-lg border border-brand-primary/20 bg-brand-lighter/40 px-4 py-3 text-sm text-gray-800"><span>{notice}</span><button onClick={() => setNotice('')} className="font-semibold text-brand-primary">Dismiss</button></div>}

      <div className="grid gap-4 border-y border-gray-200 bg-white py-5 md:grid-cols-[auto_1fr] md:items-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-lighter text-brand-primary"><FileSpreadsheet className="h-5 w-5" /></div>
        <div><p className="font-semibold text-gray-950">Bulk question upload</p><p className="mt-1 text-sm text-gray-600">Import CSV or JSON using curriculum IDs. LaTeX is accepted in question, option, and explanation fields. Every row is validated before it reaches the question bank.</p></div>
      </div>

      {/* Search and Filters */}
      <GlassCard className="p-5">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none"
            />
          </div>
          <select 
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              setSelectedTopic('');
              setSelectedSubtopic('');
            }}
            className="px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none"
          >
            <option value="">All Subjects</option>
            {subjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {subject.name}
              </option>
            ))}
          </select>
          <select
            value={selectedGrade}
            onChange={(e) => {
              setSelectedGrade(e.target.value);
              setSelectedTopic('');
              setSelectedSubtopic('');
            }}
            className="px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none"
          >
            <option value="">All Student Grades</option>
            {grades.map((grade) => (
              <option key={grade._id} value={grade._id}>
                {grade.name}
              </option>
            ))}
          </select>

          {selectedSubject && topics.length > 0 && (
            <select
              value={selectedTopic}
              onChange={(e) => {
                setSelectedTopic(e.target.value);
                setSelectedSubtopic('');
              }}
              className="px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none"
            >
              <option value="">All Topics</option>
              {topics.map((topic) => (
                <option key={topic._id} value={topic._id}>
                  {topic.name}
                </option>
              ))}
            </select>
          )}

          {selectedTopic && (topics.find((t) => t._id === selectedTopic)?.subtopics?.length ?? 0) > 0 && (
            <select
              value={selectedSubtopic}
              onChange={(e) => setSelectedSubtopic(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none"
            >
              <option value="">All Subtopics</option>
              {topics.find((t) => t._id === selectedTopic)?.subtopics?.map((sub: { _id: string; name: string }) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name}
                </option>
              ))}
            </select>
          )}

          <select 
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <PrimaryButton variant="secondary" onClick={handleFilter}>
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </PrimaryButton>
        </div>
      </GlassCard>

      {/* Questions Table */}
      <GlassCard className="overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading questions...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-5 text-xs font-bold uppercase tracking-wide text-gray-500">Question</th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wide text-gray-500">Curriculum</th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wide text-gray-500">Difficulty</th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wide text-gray-500">Usage</th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wide text-gray-500">Success</th>
                  <th className="text-right py-3 px-5 text-xs font-bold uppercase tracking-wide text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q._id} className="border-b border-gray-100 transition hover:bg-gray-50">
                    <td className="py-4 px-5">
                      <p className="max-w-md truncate font-medium text-gray-900">{q.question}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm font-medium text-gray-800">{q.subject?.name || 'N/A'} <span className="font-normal text-gray-400">/</span> {q.topic?.name || 'N/A'}</p>
                      <p className="mt-1 text-xs text-gray-500">{q.grade?.name || 'N/A'}{subtopicName(q) ? ` · ${subtopicName(q)}` : ''}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                        q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">{q.analytics?.totalAttempts || 0} attempts</td>
                    <td className="py-4 px-4">
                      <span className={`font-medium ${
                        (q.analytics?.correctPercentage || 0) >= 70 ? 'text-green-600' :
                        (q.analytics?.correctPercentage || 0) >= 40 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {q.analytics?.correctPercentage || 0}%
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => handleEdit(q)}
                          className="rounded-md p-2 hover:bg-gray-100 transition-colors"
                          title="Edit question"
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                        <button 
                          onClick={() => handleDeleteQuestion(q._id)}
                          className="rounded-md p-2 hover:bg-red-50 transition-colors"
                          title="Delete question"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {questions.length === 0 && !loading && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 mb-2">No questions found</p>
            <p className="text-sm text-gray-500">Try adjusting your filters or add a new question</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => fetchQuestions(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-4 py-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchQuestions(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </GlassCard>

      {/* Question Form Modal */}
      <QuestionForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={editingQuestion ? handleUpdateQuestion : handleCreateQuestion}
        initialData={editingQuestion ? toFormData(editingQuestion) : undefined}
        subjects={subjects}
        grades={grades}
      />

      <Modal isOpen={isUploadOpen} onClose={() => { setIsUploadOpen(false); setUploadPreview(null); }} title="Import questions" size="xl">
        <div className="space-y-6">
          <div className="grid gap-4 border-y border-gray-200 py-5 md:grid-cols-3">
            <div><p className="text-sm font-semibold text-gray-950">1. Prepare</p><p className="mt-1 text-sm text-gray-600">Use subject, grade, chapter, topic, and optional subtopic IDs.</p></div>
            <div><p className="text-sm font-semibold text-gray-950">2. Preview</p><p className="mt-1 text-sm text-gray-600">Check the first rows before submitting the batch.</p></div>
            <div><p className="text-sm font-semibold text-gray-950">3. Resolve</p><p className="mt-1 text-sm text-gray-600">Valid rows import; row-level issues remain visible.</p></div>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="font-semibold text-gray-950">Accepted formats: CSV, JSON, XLSX, XLS</p><p className="mt-1 text-sm text-gray-600">Up to 250 questions or 5 MB per import. Use `$...$` or `$$...$$` for math.</p></div>
            <div className="flex shrink-0 gap-2">
              <button onClick={downloadTemplate} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"><Download className="h-4 w-4" /> Template</button>
              <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark"><Upload className="h-4 w-4" /> Choose file</button>
            </div>
          </div>

          {uploadPreview && (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3"><div><p className="font-semibold text-gray-950">{uploadPreview.name}</p><p className="text-sm text-gray-600">{uploadPreview.questions.length} questions ready for validation</p></div><button onClick={() => setUploadPreview(null)} className="inline-flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-950"><X className="h-4 w-4" /> Clear</button></div>
              <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500"><tr><th className="px-4 py-3">#</th><th className="px-4 py-3">Question</th><th className="px-4 py-3">Curriculum</th><th className="px-4 py-3">Answer</th></tr></thead><tbody>{uploadPreview.questions.slice(0, 5).map((item, index) => <tr key={`${item.question}-${index}`} className="border-t border-gray-100"><td className="px-4 py-3 text-gray-500">{index + 1}</td><td className="max-w-sm truncate px-4 py-3 font-medium text-gray-900">{item.question || 'Missing question text'}</td><td className="px-4 py-3 text-gray-600">{item.subject || 'No subject'} / {item.grade || 'No grade'} / {item.topic || 'No topic'}</td><td className="px-4 py-3 text-gray-600">{item.correctAnswer || 'Not set'}</td></tr>)}</tbody></table></div>
              {uploadPreview.questions.length > 5 && <p className="border-t border-gray-100 px-4 py-3 text-sm text-gray-600">Showing 5 of {uploadPreview.questions.length} rows. The server will validate every row.</p>}
            </div>
          )}

          {bulkResult && <div className={`rounded-lg border p-4 ${bulkResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}><div className="flex gap-3"><div className={bulkResult.success ? 'text-green-700' : 'text-red-700'}>{bulkResult.success ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}</div><div><p className="font-semibold text-gray-950">{bulkResult.success ? `${bulkResult.inserted || 0} questions imported` : 'Import needs attention'}</p><p className="mt-1 text-sm text-gray-700">{bulkResult.error || bulkResult.message || `${bulkResult.failed || 0} rows could not be imported.`}</p>{bulkResult.errors?.length ? <ul className="mt-3 space-y-1 text-sm text-gray-700">{bulkResult.errors.slice(0, 5).map((item) => <li key={`${item.row}-${item.error}`}>Row {item.row}: {item.error}</li>)}</ul> : null}</div></div></div>}

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-5"><PrimaryButton variant="secondary" onClick={() => setIsUploadOpen(false)}>Close</PrimaryButton><PrimaryButton onClick={submitBulkUpload} disabled={!uploadPreview || bulkUploading} isLoading={bulkUploading}>Validate and import</PrimaryButton></div>
        </div>
      </Modal>
    </div>
  );
}
