// ============================================
// PowerPath / Timeback API Service Layer
// ============================================

const TIMEBACK_BASE = 'https://timeback-xi5l.vercel.app/api';
const POWERPATH_BASE = 'https://api.alpha-1edtech.ai/powerpath';

// --- Token cache (in-memory, server-side) ---

let cachedToken: string | null = null;
let tokenExpiresAt = 0; // epoch ms

/**
 * Get a Cognito OAuth token from Timeback.
 * Cached in memory with a 50-minute TTL (Cognito tokens typically last 60 min).
 */
export async function getToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const res = await fetch(`${TIMEBACK_BASE}/get-auth`);
  if (!res.ok) {
    throw new Error(`Failed to get auth token: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  cachedToken = data.token;
  // Cache for 50 minutes (Cognito tokens last ~60 min)
  tokenExpiresAt = now + 50 * 60 * 1000;

  return cachedToken!;
}

/**
 * Make an authenticated request to the PowerPath API (alpha-1edtech).
 */
async function powerpathFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getToken();
  return fetch(`${POWERPATH_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

/**
 * Make an authenticated request to the Timeback API.
 */
async function timebackFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getToken();
  return fetch(`${TIMEBACK_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

// ============================================
// Student Lookup
// ============================================

/**
 * Look up a student's PowerPath sourcedId by their email address.
 * The email should match the one used when they registered with Timeback.
 */
export async function getStudentByEmail(
  email: string
): Promise<{ studentSourcedId: string } | null> {
  const res = await timebackFetch(
    `/get-student?email=${encodeURIComponent(email)}`
  );
  if (!res.ok) {
    console.error(`Student lookup failed: ${res.status} ${res.statusText}`);
    return null;
  }
  const data = await res.json();
  return data?.studentSourcedId ? { studentSourcedId: data.studentSourcedId } : null;
}

// ============================================
// Course Content
// ============================================

export interface LineItem {
  assessmentLineItemSourcedId: string;
  title: string;
  type: string; // e.g. "Video", "Article", "Quiz"
  [key: string]: unknown;
}

export interface CourseContentResponse {
  courseProgress: {
    lineItems: LineItem[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Get course content and line items for a course + student.
 * Returns assessmentLineItemSourcedId values needed for completion reporting.
 */
export async function getCourseContent(
  courseId: string,
  studentId: string
): Promise<CourseContentResponse> {
  const res = await timebackFetch(
    `/course-content?courseId=${encodeURIComponent(courseId)}&userId=${encodeURIComponent(studentId)}`
  );
  if (!res.ok) {
    throw new Error(`Failed to get course content: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// ============================================
// Video / Article Completion (OneRoster Gradebook)
// ============================================

export interface SubmitResultParams {
  assessmentLineItemSourcedId: string;
  studentSourcedId: string;
  score: number;
  scoreStatus: string;
  comment: string;
  metadata: {
    'timeback.xp': number;
    'timeback.total': number;
    'timeback.passed': boolean;
    'timeback.correct': number;
    'timeback.stepType': 'Video' | 'Article';
    'timeback.courseTitle': string;
    'timeback.lessonTitle': string;
    'timeback.enrollmentId': string;
  };
}

export interface SubmitResultResponse {
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

/**
 * Submit a video or article completion result to the OneRoster Gradebook.
 */
export async function submitResult(
  params: SubmitResultParams
): Promise<SubmitResultResponse> {
  const res = await timebackFetch('/submit-result', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Submit result failed: ${res.status} – ${text}`);
  }
  return res.json();
}

// ============================================
// Quiz / PowerPath-100 Flow
// ============================================

export interface AssessmentProgress {
  score: number;
  correctQuestions: number;
  totalQuestions: number;
  accuracy: number;
  attempt: number;
}

/**
 * Get the current assessment progress for a student + lesson.
 */
export async function getAssessmentProgress(
  studentId: string,
  lessonId: string
): Promise<AssessmentProgress> {
  const res = await powerpathFetch(
    `/getAssessmentProgress?student=${encodeURIComponent(studentId)}&lesson=${encodeURIComponent(lessonId)}`
  );
  if (!res.ok) {
    throw new Error(`Get assessment progress failed: ${res.status}`);
  }
  return res.json();
}

export interface QuizQuestion {
  id: string;
  content: {
    rawXml: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface NextQuestionResponse {
  score: number;
  question: QuizQuestion;
}

/**
 * Get the next question for a quiz/PowerPath-100 lesson.
 */
export async function getNextQuestion(
  studentId: string,
  lessonId: string
): Promise<NextQuestionResponse> {
  const res = await powerpathFetch(
    `/getNextQuestion?student=${encodeURIComponent(studentId)}&lesson=${encodeURIComponent(lessonId)}`
  );
  if (!res.ok) {
    throw new Error(`Get next question failed: ${res.status}`);
  }
  return res.json();
}

export interface SubmitAnswerParams {
  student: string;
  lesson: string;
  question: string; // NOTE: field is "question", NOT "questionId"
  response: string; // A, B, C, or D
}

export interface SubmitAnswerResponse {
  powerpathScore: number;
  correctQuestions: number;
  totalQuestions: number;
  accuracy: number;
}

/**
 * Submit a student's answer to a quiz question.
 * Uses PUT and the field name "question" (not "questionId").
 */
export async function submitAnswer(
  params: SubmitAnswerParams
): Promise<SubmitAnswerResponse> {
  const res = await powerpathFetch('/updateStudentQuestionResponse', {
    method: 'PUT',
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error(`Submit answer failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Reset the quiz attempt for a student + lesson (optional, starts fresh).
 */
export async function resetAttempt(
  studentId: string,
  lessonId: string
): Promise<void> {
  const res = await powerpathFetch('/resetAttempt', {
    method: 'POST',
    body: JSON.stringify({ student: studentId, lesson: lessonId }),
  });
  if (!res.ok) {
    throw new Error(`Reset attempt failed: ${res.status}`);
  }
}

// ============================================
// Helpers
// ============================================

/**
 * Extract the correct answer letter from QTI XML.
 * Looks for <qti-correct-response><qti-value>X</qti-value></qti-correct-response>
 */
export function extractCorrectAnswer(rawXml: string): string | null {
  const match = rawXml.match(
    /<qti-correct-response>\s*<qti-value>([A-D])<\/qti-value>\s*<\/qti-correct-response>/
  );
  return match ? match[1] : null;
}
