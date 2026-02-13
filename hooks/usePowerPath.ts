'use client';

import { useState, useCallback } from 'react';

// ============================================
// Types
// ============================================

interface SubmitResultMetadata {
  assessmentLineItemSourcedId: string;
  courseTitle: string;
  lessonTitle: string;
  enrollmentId: string;
  comment?: string;
  total?: number;
  correct?: number;
}

interface SubmitResultResponse {
  status: string;
  resultId: string;
  response: {
    assessmentResult: {
      score: number;
      scoreStatus: string;
      dateLastModified: string;
    };
  };
}

interface CourseContentResponse {
  courseProgress: {
    lineItems: Array<{
      assessmentLineItemSourcedId: string;
      title: string;
      type: string;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface QuizProgress {
  score: number;
  correctQuestions: number;
  totalQuestions: number;
  accuracy: number;
  attempt: number;
}

interface NextQuestionResponse {
  score: number;
  question: {
    id: string;
    content: {
      rawXml: string;
      [key: string]: unknown;
    };
  };
}

interface SubmitAnswerResponse {
  powerpathScore: number;
  correctQuestions: number;
  totalQuestions: number;
  accuracy: number;
}

// ============================================
// Hook
// ============================================

export function usePowerPath() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Video Completion ---

  const submitVideoComplete = useCallback(
    async (metadata: SubmitResultMetadata): Promise<SubmitResultResponse | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/powerpath/submit-result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...metadata,
            stepType: 'Video',
            comment:
              metadata.comment ||
              `${metadata.lessonTitle} - Video completed`,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Request failed: ${res.status}`);
        }
        return await res.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('submitVideoComplete error:', message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // --- Article Completion ---

  const submitArticleComplete = useCallback(
    async (metadata: SubmitResultMetadata): Promise<SubmitResultResponse | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/powerpath/submit-result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...metadata,
            stepType: 'Article',
            comment:
              metadata.comment ||
              `${metadata.lessonTitle} - Article completed`,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Request failed: ${res.status}`);
        }
        return await res.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('submitArticleComplete error:', message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // --- Course Content ---

  const fetchCourseContent = useCallback(
    async (courseId: string): Promise<CourseContentResponse | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/powerpath/course-content?courseId=${encodeURIComponent(courseId)}`
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Request failed: ${res.status}`);
        }
        return await res.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('fetchCourseContent error:', message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // --- Quiz Flow ---

  const quizFlow = {
    getProgress: async (lessonId: string): Promise<QuizProgress | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/powerpath/quiz/progress?lessonId=${encodeURIComponent(lessonId)}`
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Request failed: ${res.status}`);
        }
        return await res.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('quizFlow.getProgress error:', message);
        return null;
      } finally {
        setLoading(false);
      }
    },

    getNextQuestion: async (
      lessonId: string
    ): Promise<NextQuestionResponse | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/powerpath/quiz/next-question?lessonId=${encodeURIComponent(lessonId)}`
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Request failed: ${res.status}`);
        }
        return await res.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('quizFlow.getNextQuestion error:', message);
        return null;
      } finally {
        setLoading(false);
      }
    },

    submitAnswer: async (
      lessonId: string,
      questionId: string,
      response: string
    ): Promise<SubmitAnswerResponse | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/powerpath/quiz/submit-answer', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId, questionId, response }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Request failed: ${res.status}`);
        }
        return await res.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('quizFlow.submitAnswer error:', message);
        return null;
      } finally {
        setLoading(false);
      }
    },

    resetAttempt: async (lessonId: string): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/powerpath/quiz/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Request failed: ${res.status}`);
        }
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('quizFlow.resetAttempt error:', message);
        return false;
      } finally {
        setLoading(false);
      }
    },
  };

  return {
    loading,
    error,
    submitVideoComplete,
    submitArticleComplete,
    fetchCourseContent,
    quizFlow,
  };
}
