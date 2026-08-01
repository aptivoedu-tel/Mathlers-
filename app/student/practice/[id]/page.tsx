'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import GlassCard from '@/components/ui/GlassCard';
import PrimaryButton from '@/components/ui/PrimaryButton';
import Loading from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import { MathRenderer } from '@/components/math/MathRenderer';
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, XCircle, BookOpen, Play, ArrowRight } from 'lucide-react';

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
  const [currentPage, setCurrentPage] = useState<'intro' | 'breakdown' | 'questions'>('intro');
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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/student/practice')} className="p-2 rounded-lg hover:bg-gray-100">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-sm text-gray-600">{practiceSet.subject} • {practiceSet.grade}</p>
            <h1 className="text-3xl font-bold text-gray-900">{practiceSet.name}</h1>
          </div>
        </div>

        <GlassCard className="p-8">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="w-20 h-28 bg-gradient-to-br from-brand-primary to-brand-primary/80 rounded-lg flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-white/80" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-3">About This Practice Book</h2>
              <p className="text-gray-600 leading-relaxed">
                {practiceSet.description || 'This practice book contains carefully curated questions to help you master the subject. Take your time to understand each question and learn from the explanations provided.'}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-brand-primary">{practiceSet.questions.length}</p>
              <p className="text-sm text-gray-600">Questions</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-brand-primary">{Math.round(practiceSet.timeLimit / 60)}</p>
              <p className="text-sm text-gray-600">Minutes</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-brand-primary">{practiceSet.sections?.length || 1}</p>
              <p className="text-sm text-gray-600">Sections</p>
            </div>
          </div>
        </GlassCard>

        <PrimaryButton onClick={() => setCurrentPage('breakdown')} className="w-full justify-center gap-2 py-4">
          View Breakdown <ArrowRight className="w-5 h-5" />
        </PrimaryButton>
      </div>
    );
  }

  // Breakdown Page
  if (currentPage === 'breakdown') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentPage('intro')} className="p-2 rounded-lg hover:bg-gray-100">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-sm text-gray-600">{practiceSet.subject} • {practiceSet.grade}</p>
            <h1 className="text-3xl font-bold text-gray-900">{practiceSet.name}</h1>
          </div>
        </div>

        <GlassCard className="p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Practice Book Breakdown</h2>
          
          <div className="space-y-4">
            {practiceSet.sections && practiceSet.sections.length > 0 ? (
              practiceSet.sections.map((section, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900">Section {index + 1}: {section.name}</h3>
                    <span className="text-sm text-gray-600">{section.questions.length} Questions</span>
                  </div>
                  {section.instructions && (
                    <p className="text-sm text-gray-600 mb-3">{section.instructions}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      ~{Math.round((section.questions.length / practiceSet.questions.length) * practiceSet.timeLimit / 60)} min
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-900">All Questions</h3>
                  <span className="text-sm text-gray-600">{practiceSet.questions.length} Questions</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {Math.round(practiceSet.timeLimit / 60)} min
                  </span>
                </div>
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-6 bg-brand-lighter/30 border-brand-primary/20">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <Play className="w-12 h-12 text-brand-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">Ready to Start?</h3>
              <p className="text-sm text-gray-600">You have {Math.round(practiceSet.timeLimit / 60)} minutes to complete all questions.</p>
            </div>
          </div>
        </GlassCard>

        <PrimaryButton 
          onClick={() => setCurrentPage('questions')} 
          className="w-full justify-center gap-2 py-4"
        >
          Start Practice <Play className="w-5 h-5" />
        </PrimaryButton>
      </div>
    );
  }

  const question = practiceSet.questions[currentQuestion];
  const selectedAnswer = answers[question.id] || null;
  const checkedAnswer = checkedAnswers[question.id];
  const gradedAnswer = result?.answers.find((answer) => answer.questionId === question.id);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-gray-600">{practiceSet.subject} • {practiceSet.grade}</p>
          <h1 className="text-3xl font-bold text-gray-900">{practiceSet.name}</h1>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-brand-lighter rounded-xl">
          <Clock className="w-5 h-5 text-brand-primary" />
          <span className="font-bold text-brand-primary">{formatTime(result ? result.timeTaken : timeLeft)}</span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <GlassCard className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-brand-primary">{result.score}/{result.totalMarks}</p>
              <p className="text-sm text-gray-600">Score</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{result.correctAnswers}</p>
              <p className="text-sm text-gray-600">Correct</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{result.wrongAnswers}</p>
              <p className="text-sm text-gray-600">Wrong</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-700">{result.skipped}</p>
              <p className="text-sm text-gray-600">Skipped</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-primary">{result.accuracy}%</p>
              <p className="text-sm text-gray-600">Accuracy</p>
            </div>
          </div>
        </GlassCard>
      )}

      <div className="flex justify-between items-center">
        <div>
          <span className="text-sm text-gray-600">Question </span>
          <span className="text-2xl font-bold text-gray-900">{currentQuestion + 1}</span>
          <span className="text-sm text-gray-600"> of {practiceSet.questions.length}</span>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-gray-700">
          {question.difficulty}
        </span>
      </div>

      <GlassCard className="p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          <MathRenderer>{question.question}</MathRenderer>
        </h2>
        <div className="space-y-4">
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
                className={`w-full p-5 text-left rounded-2xl border-2 transition-all font-medium text-lg ${
                  isCorrect
                    ? 'border-green-500 bg-green-50 text-green-800'
                    : isWrongSelection
                    ? 'border-red-500 bg-red-50 text-red-800'
                    : isSelected
                    ? 'border-brand-primary bg-brand-lighter text-brand-primary shadow-lg'
                    : 'border-gray-200 hover:border-brand-primary hover:bg-gray-50'
                } ${isDisabled ? 'cursor-not-allowed opacity-70' : ''}`}
              >
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white text-gray-700 mr-4 text-sm font-semibold">
                  {optionKey}
                </span>
                <MathRenderer>{question.options[optionKey]}</MathRenderer>
                {(isCorrect && (result || checkedAnswer)) && <CheckCircle2 className="float-right w-6 h-6" />}
                {isWrongSelection && <XCircle className="float-right w-6 h-6" />}
              </button>
            );
          })}
        </div>

        {(gradedAnswer || checkedAnswer) && (
          <div className="mt-6 rounded-xl bg-white/70 p-4">
            <p className="font-semibold text-gray-900">Explanation</p>
            <MathRenderer display className="mt-1 text-gray-700">
              {gradedAnswer?.explanation || checkedAnswer?.explanation || 'No explanation provided.'}
            </MathRenderer>
          </div>
        )}
      </GlassCard>

      <div className="flex justify-between items-center">
        <PrimaryButton
          variant="secondary"
          onClick={() => setCurrentQuestion((prev) => Math.max(prev - 1, 0))}
          disabled={currentQuestion === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </PrimaryButton>

        {result ? (
          <PrimaryButton onClick={() => router.push('/student/results')} className="px-8">
            View Results
          </PrimaryButton>
        ) : checkedAnswer ? (
          currentQuestion === practiceSet.questions.length - 1 ? (
            <PrimaryButton onClick={submitPractice} isLoading={isSubmitting} className="px-8">
              Submit Practice
            </PrimaryButton>
          ) : (
            <PrimaryButton
              onClick={() => {
                setCurrentQuestion((prev) => Math.min(prev + 1, practiceSet.questions.length - 1));
              }}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </PrimaryButton>
          )
        ) : selectedAnswer ? (
          <PrimaryButton
            onClick={() => handleCheckAnswer(question.id)}
            className="px-8"
          >
            Check Answer
          </PrimaryButton>
        ) : timeLeft === 0 ? (
          <PrimaryButton onClick={submitPractice} isLoading={isSubmitting} className="px-8">
            Retry submission
          </PrimaryButton>
        ) : (
          <PrimaryButton
            onClick={() => setCurrentQuestion((prev) => Math.min(prev + 1, practiceSet.questions.length - 1))}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
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
