'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import GlassCard from '@/components/ui/GlassCard';
import PrimaryButton from '@/components/ui/PrimaryButton';
import Loading from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import { MathRenderer } from '@/components/math/MathRenderer';
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, XCircle, BookOpen, Play, ArrowRight, List } from 'lucide-react';

type OptionKey = 'A' | 'B' | 'C' | 'D';

type PracticeQuestion = {
  id: string;
  question: string;
  options: Record<OptionKey, string>;
  difficulty: string;
  marks: number;
  explanation?: string;
  correctAnswer?: OptionKey;
};

type PracticeSet = {
  id: string;
  name: string;
  subject: string;
  grade: string;
  timeLimit: number;
  questions: PracticeQuestion[];
  description?: string;
  sections?: {
    name: string;
    instructions?: string;
    questions: PracticeQuestion[];
  }[];
};

type PracticeResult = {
  score: number;
  totalMarks: number;
  correctAnswers: number;
  wrongAnswers: number;
  skipped: number;
  accuracy: number;
  timeTaken: number;
  answers: {
    questionId: string;
    selectedAnswer: OptionKey | null;
    isCorrect: boolean;
    correctAnswer: OptionKey;
    explanation: string;
  }[];
};

async function responseData(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { error: response.status === 401 ? 'Your session has ended. Please sign in again.' : 'The server returned an unexpected response.' };
  }
}

export default function PracticeSessionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [practiceSet, setPracticeSet] = useState<PracticeSet | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, OptionKey>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [currentPage, setCurrentPage] = useState<'intro' | 'breakdown' | 'toc' | 'questions'>('intro');
  const [minLoadingTime, setMinLoadingTime] = useState(true);
  const [checkedAnswers, setCheckedAnswers] = useState<Record<string, { isCorrect: boolean; explanation: string; correctAnswer?: OptionKey }>>({});
  const isMounted = useRef(true);
  const submitting = useRef(false);
  const autoSubmitStarted = useRef(false);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingTime(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    isMounted.current = true;
    autoSubmitStarted.current = false;
    submitting.current = false;

    async function loadPracticeSet() {
      if (isMounted.current) {
        setIsLoading(true);
      }

      try {
        const response = await fetch(`/api/practice/${params.id}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        const data = await responseData(response);

        if (!response.ok) {
          throw new Error(data.error || 'Unable to load practice set');
        }

        if (isMounted.current) {
          setPracticeSet(data.practiceSet);
          setTimeLeft(data.practiceSet.timeLimit || 1800);
          setResult(null);
          setAnswers({});
          setCurrentQuestion(0);
          setError(null);
          setCurrentPage('intro');
        }
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') {
          return;
        }

        if (isMounted.current) {
          setPracticeSet(null);
          setResult(null);
          setError(loadError instanceof Error ? loadError.message : 'Unable to load practice set');
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    }

    loadPracticeSet();

    return () => {
      controller.abort();
    };
  }, [params.id, loadAttempt]);

  const elapsedTime = useMemo(() => {
    if (!practiceSet) {
      return 0;
    }

    return Math.max((practiceSet.timeLimit || 1800) - timeLeft, 0);
  }, [practiceSet, timeLeft]);

  const submitPractice = useCallback(async () => {
    if (!practiceSet || submitting.current || result) {
      return;
    }

    submitting.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/practice/${practiceSet.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, timeTaken: elapsedTime }),
      });
      const data = await responseData(response);

      if (!response.ok) {
        throw new Error(data.error || 'Unable to submit practice');
      }

      if (isMounted.current) {
        setResult(data.result);
      }
    } catch (submitError) {
      if (isMounted.current) {
        setError(submitError instanceof Error ? submitError.message : 'Unable to submit practice');
      }
    } finally {
      submitting.current = false;
      if (isMounted.current) {
        setIsSubmitting(false);
      }
    }
  }, [answers, elapsedTime, practiceSet, result]);

  useEffect(() => {
    if (!practiceSet || result) {
      return;
    }

    if (timeLeft <= 0) {
      if (!autoSubmitStarted.current) {
        autoSubmitStarted.current = true;
        submitPractice();
      }
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [practiceSet, result, submitPractice, timeLeft]);

  const handleCheckAnswer = (questionId: string) => {
    const selectedAnswer = answers[questionId];
    if (!selectedAnswer || !practiceSet) return;

    const question = practiceSet.questions.find(q => q.id === questionId);
    if (!question || !question.correctAnswer) return;

    const isCorrect = selectedAnswer === question.correctAnswer;
    setCheckedAnswers(prev => ({
      ...prev,
      [questionId]: {
        isCorrect,
        explanation: question.explanation || 'No explanation provided.',
        correctAnswer: question.correctAnswer
      }
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading || minLoadingTime) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
            <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse" />
          </div>
        </div>
        <div className="p-8 bg-white rounded-lg border border-gray-200">
          <div className="flex items-start gap-6">
            <div className="w-20 h-28 bg-gray-200 rounded-lg animate-pulse" />
            <div className="flex-1 space-y-3">
              <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="h-10 bg-gray-200 rounded w-16 mx-auto animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-12 mx-auto animate-pulse" />
            </div>
            <div className="text-center space-y-2">
              <div className="h-10 bg-gray-200 rounded w-16 mx-auto animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-12 mx-auto animate-pulse" />
            </div>
            <div className="text-center space-y-2">
              <div className="h-10 bg-gray-200 rounded w-16 mx-auto animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-12 mx-auto animate-pulse" />
            </div>
          </div>
        </div>
        <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error && !practiceSet) {
    return (
      <EmptyState
        title="Practice unavailable"
        description={error}
        action={{ label: 'Try Again', onClick: () => setLoadAttempt((attempt) => attempt + 1) }}
      />
    );
  }

  if (!practiceSet || practiceSet.questions.length === 0) {
    return (
      <EmptyState
        title="No questions found"
        description="This practice set has no active questions yet."
        action={{ label: 'Choose Another Set', onClick: () => router.push('/student/practice') }}
      />
    );
  }

  // Intro Page
  if (currentPage === 'intro') {
    return (
      <div className="max-w-3xl mx-auto space-y-4 px-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/student/practice')} className="p-1.5 rounded-lg hover:bg-gray-100">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <p className="text-[10px] text-gray-600">{practiceSet.subject} • {practiceSet.grade}</p>
            <h1 className="text-xl font-bold text-gray-900">{practiceSet.name}</h1>
          </div>
        </div>

        <GlassCard className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-22 bg-gradient-to-br from-brand-primary to-brand-primary/80 rounded-lg flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-white/80" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-gray-900 mb-2">About This Practice Book</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                {practiceSet.description || 'This practice book contains carefully curated questions to help you master the subject. Take your time to understand each question and learn from the explanations provided.'}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-brand-primary">{practiceSet.questions.length}</p>
              <p className="text-xs text-gray-600">Questions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-primary">{Math.round(practiceSet.timeLimit / 60)}</p>
              <p className="text-xs text-gray-600">Minutes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-primary">{practiceSet.sections?.length || 1}</p>
              <p className="text-xs text-gray-600">Sections</p>
            </div>
          </div>
        </GlassCard>

        <PrimaryButton onClick={() => setCurrentPage('breakdown')} className="w-full justify-center gap-2 py-3 text-sm">
          View Breakdown <ArrowRight className="w-4 h-4" />
        </PrimaryButton>
      </div>
    );
  }

  // Breakdown Page
  if (currentPage === 'breakdown') {
    return (
      <div className="max-w-3xl mx-auto space-y-4 px-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentPage('intro')} className="p-1.5 rounded-lg hover:bg-gray-100">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <p className="text-[10px] text-gray-600">{practiceSet.subject} • {practiceSet.grade}</p>
            <h1 className="text-xl font-bold text-gray-900">{practiceSet.name}</h1>
          </div>
        </div>

        <GlassCard className="p-5">
          <h2 className="text-base font-bold text-gray-900 mb-4">Practice Book Breakdown</h2>
          
          <div className="space-y-2">
            {practiceSet.sections && practiceSet.sections.length > 0 ? (
              practiceSet.sections.map((section, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-sm text-gray-900">Section {index + 1}: {section.name}</h3>
                    <span className="text-xs text-gray-600">{section.questions.length} Questions</span>
                  </div>
                  {section.instructions && (
                    <p className="text-xs text-gray-600 mb-2">{section.instructions}</p>
                  )}
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      ~{Math.round((section.questions.length / practiceSet.questions.length) * practiceSet.timeLimit / 60)} min
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-sm text-gray-900">All Questions</h3>
                  <span className="text-xs text-gray-600">{practiceSet.questions.length} Questions</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {Math.round(practiceSet.timeLimit / 60)} min
                  </span>
                </div>
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-4 bg-brand-lighter/30 border-brand-primary/20">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Play className="w-10 h-10 text-brand-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm text-gray-900">Ready to Start?</h3>
              <p className="text-xs text-gray-600">You have {Math.round(practiceSet.timeLimit / 60)} minutes to complete all questions.</p>
            </div>
          </div>
        </GlassCard>

        <PrimaryButton 
          onClick={() => setCurrentPage('toc')} 
          className="w-full justify-center gap-2 py-3 text-sm"
        >
          View Table of Contents <ArrowRight className="w-4 h-4" />
        </PrimaryButton>
      </div>
    );
  }

  // Table of Contents Page
  if (currentPage === 'toc') {
    const totalPages = practiceSet.questions.length;
    const completedQuestions = Object.keys(checkedAnswers).length;
    const progress = (completedQuestions / totalPages) * 100;

    let currentSectionIndex = 0;
    let sectionStartPage = 1;

    return (
      <div className="max-w-3xl mx-auto space-y-4 px-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentPage('breakdown')} className="p-1.5 rounded-lg hover:bg-gray-100">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <p className="text-[10px] text-gray-600">{practiceSet.subject} • {practiceSet.grade}</p>
            <h1 className="text-xl font-bold text-gray-900">Table of Contents</h1>
          </div>
        </div>

        <GlassCard className="p-4 bg-gradient-to-r from-brand-primary/10 to-brand-primary/5 border-brand-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-700">Overall Progress</span>
            <span className="text-xs font-bold text-brand-primary">{completedQuestions} / {totalPages} Questions</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-brand-primary to-brand-primary/80 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-600 mt-1">{Math.round(progress)}% Complete</p>
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="text-base font-bold text-gray-900 mb-4">Sections</h2>
          
          <div className="space-y-2">
            {practiceSet.sections && practiceSet.sections.length > 0 ? (
              practiceSet.sections.map((section, index) => {
                const sectionEndPage = sectionStartPage + section.questions.length - 1;
                const sectionCompleted = section.questions.filter(q => checkedAnswers[q.id]).length;
                const sectionProgress = (sectionCompleted / section.questions.length) * 100;

                const sectionClick = () => {
                  const questionIndex = practiceSet.questions.findIndex(q => q.id === section.questions[0].id);
                  if (questionIndex >= 0) {
                    setCurrentQuestion(questionIndex);
                    setCurrentPage('questions');
                  }
                };

                return (
                  <button
                    key={index}
                    onClick={sectionClick}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-brand-primary hover:bg-brand-lighter/30 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-brand-primary/10 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-brand-primary">{index + 1}</span>
                        </div>
                        <h3 className="font-bold text-sm text-gray-900">{section.name}</h3>
                      </div>
                      <span className="text-xs text-gray-600">{section.questions.length} Questions</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                      <span>Pages {sectionStartPage} - {sectionEndPage}</span>
                      <span className="flex items-center gap-1">
                        {sectionCompleted > 0 && (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            {sectionCompleted}/{section.questions.length} completed
                          </>
                        )}
                      </span>
                    </div>
                    {sectionCompleted > 0 && (
                      <div className="mt-1.5 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                        <div 
                          className="h-full bg-green-500 transition-all duration-300"
                          style={{ width: `${sectionProgress}%` }}
                        />
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              <button
                onClick={() => setCurrentPage('questions')}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-brand-primary hover:bg-brand-lighter/30 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand-primary/10 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-brand-primary">1</span>
                    </div>
                    <h3 className="font-bold text-sm text-gray-900">All Questions</h3>
                  </div>
                  <span className="text-xs text-gray-600">{practiceSet.questions.length} Questions</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-500">
                  <span>Pages 1 - {practiceSet.questions.length}</span>
                  <span className="flex items-center gap-1">
                    {completedQuestions > 0 && (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                        {completedQuestions}/{practiceSet.questions.length} completed
                      </>
                    )}
                  </span>
                </div>
              </button>
            )}
          </div>
        </GlassCard>

        <PrimaryButton
          onClick={() => setCurrentPage('questions')}
          className="w-full justify-center gap-2 py-3 text-sm"
        >
          Start Practice <Play className="w-4 h-4" />
        </PrimaryButton>
      </div>
    );
  }

  const question = practiceSet.questions[currentQuestion];
  const selectedAnswer = answers[question.id] || null;
  const checkedAnswer = checkedAnswers[question.id];
  const gradedAnswer = result?.answers.find((answer) => answer.questionId === question.id);

  return (
    <div className="max-w-3xl mx-auto space-y-4 px-4">
      {/* Progress Bar */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 py-2 px-3 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-semibold text-gray-600">Progress</span>
          <span className="text-[10px] font-bold text-brand-primary">{currentQuestion + 1} / {practiceSet.questions.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-brand-primary to-brand-primary/80 transition-all duration-300 ease-out"
            style={{ width: `${((currentQuestion + 1) / practiceSet.questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] text-gray-600">{practiceSet.subject} • {practiceSet.grade}</p>
          <h1 className="text-xl font-bold text-gray-900">{practiceSet.name}</h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-lighter rounded-lg">
          <Clock className="w-4 h-4 text-brand-primary" />
          <span className="font-bold text-sm text-brand-primary">{formatTime(result ? result.timeTaken : timeLeft)}</span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <GlassCard className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-brand-primary">{result.score}/{result.totalMarks}</p>
              <p className="text-xs text-gray-600">Score</p>
            </div>
            <div>
              <p className="text-lg font-bold text-green-600">{result.correctAnswers}</p>
              <p className="text-xs text-gray-600">Correct</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-600">{result.wrongAnswers}</p>
              <p className="text-xs text-gray-600">Wrong</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-700">{result.skipped}</p>
              <p className="text-xs text-gray-600">Skipped</p>
            </div>
            <div>
              <p className="text-lg font-bold text-brand-primary">{result.accuracy}%</p>
              <p className="text-xs text-gray-600">Accuracy</p>
            </div>
          </div>
        </GlassCard>
      )}

      <div className="flex justify-between items-center">
        <div>
          <p className="text-[10px] font-semibold text-brand-primary uppercase tracking-wide mb-0.5">
            {practiceSet.sections && practiceSet.sections.length > 0 
              ? practiceSet.sections.find(s => s.questions.some(q => q.id === question.id))?.name || 'Practice'
              : 'Practice'
            }
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-600">Question </span>
            <span className="text-lg font-bold text-gray-900">{currentQuestion + 1}</span>
            <span className="text-xs text-gray-600"> of {practiceSet.questions.length}</span>
          </div>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700 border border-gray-200 shadow-sm">
          {question.difficulty}
        </span>
      </div>

      <GlassCard className="p-5 bg-[#FAFAF9] border-gray-200 rounded-lg shadow-md">
        {/* Page Number */}
        <div className="absolute top-3 right-3 text-[10px] text-gray-400 font-medium">
          Page {currentQuestion + 1} of {practiceSet.questions.length}
        </div>

        <h2 className="text-lg font-bold text-gray-900 mb-5 leading-relaxed">
          <MathRenderer>{question.question}</MathRenderer>
        </h2>
        <div className="space-y-3">
          {(Object.keys(question.options) as OptionKey[]).map((optionKey) => {
            const isSelected = selectedAnswer === optionKey;
            const isCorrect = gradedAnswer?.correctAnswer === optionKey || checkedAnswer?.correctAnswer === optionKey;
            const isWrongSelection = (result && isSelected && !isCorrect) || (checkedAnswer && isSelected && !checkedAnswer.isCorrect);
            const isDisabled = Boolean(checkedAnswer) || Boolean(result) || timeLeft === 0 || isSubmitting;

            return (
              <button
                key={optionKey}
                type="button"
                disabled={isDisabled}
                onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: optionKey }))}
                className={`w-full p-3 text-left rounded-lg border-2 transition-all font-medium text-sm relative overflow-hidden ${
                  isCorrect
                    ? 'border-green-500 bg-green-50 text-green-800 shadow-sm'
                    : isWrongSelection
                    ? 'border-red-500 bg-red-50 text-red-800 shadow-sm'
                    : isSelected
                    ? 'border-brand-primary bg-brand-lighter text-brand-primary shadow-md'
                    : 'border-gray-200 bg-white hover:border-brand-primary hover:bg-gray-50 hover:shadow-sm'
                } ${isDisabled ? 'cursor-not-allowed opacity-70' : ''}`}
              >
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/80 text-gray-700 mr-3 text-xs font-semibold shadow-sm">
                  {optionKey}
                </span>
                <MathRenderer>{question.options[optionKey]}</MathRenderer>
                {(isCorrect && (result || checkedAnswer)) && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5" />}
                {isWrongSelection && <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5" />}
              </button>
            );
          })}
        </div>

        {(gradedAnswer || checkedAnswer) && (
          <div className="mt-4 rounded-lg bg-white border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-brand-primary" />
              <p className="font-semibold text-sm text-gray-900">Explanation</p>
            </div>
            <MathRenderer display className="text-sm text-gray-700 leading-relaxed">
              {gradedAnswer?.explanation || checkedAnswer?.explanation || 'No explanation provided.'}
            </MathRenderer>
          </div>
        )}
      </GlassCard>

      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <PrimaryButton
            variant="secondary"
            onClick={() => setCurrentPage('toc')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs"
          >
            <List className="w-3.5 h-3.5" />
            TOC
          </PrimaryButton>
          <PrimaryButton
            variant="secondary"
            onClick={() => setCurrentQuestion((prev) => Math.max(prev - 1, 0))}
            disabled={currentQuestion === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-xs"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </PrimaryButton>
        </div>

        {result ? (
          <PrimaryButton onClick={() => router.push('/student/results')} className="px-4 py-2 text-xs">
            View Results
          </PrimaryButton>
        ) : checkedAnswer ? (
          currentQuestion === practiceSet.questions.length - 1 ? (
            <PrimaryButton onClick={submitPractice} isLoading={isSubmitting} className="px-4 py-2 text-xs">
              Submit Practice
            </PrimaryButton>
          ) : (
            <PrimaryButton
              onClick={() => {
                setCurrentQuestion((prev) => Math.min(prev + 1, practiceSet.questions.length - 1));
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </PrimaryButton>
          )
        ) : selectedAnswer ? (
          <PrimaryButton
            onClick={() => handleCheckAnswer(question.id)}
            className="px-4 py-2 text-xs"
          >
            Check Answer
          </PrimaryButton>
        ) : timeLeft === 0 ? (
          <PrimaryButton onClick={submitPractice} isLoading={isSubmitting} className="px-4 py-2 text-xs">
            Retry submission
          </PrimaryButton>
        ) : (
          <PrimaryButton
            onClick={() => setCurrentQuestion((prev) => Math.min(prev + 1, practiceSet.questions.length - 1))}
            className="flex items-center gap-1.5 px-3 py-2 text-xs"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </PrimaryButton>
        )}
      </div>

      <div className="flex justify-center flex-wrap gap-2">
        {practiceSet.questions.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCurrentQuestion(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              currentQuestion === index
                ? 'bg-brand-primary scale-125'
                : answers[item.id]
                ? 'bg-brand-lighter'
                : 'bg-gray-300'
            }`}
            aria-label={`Go to question ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
