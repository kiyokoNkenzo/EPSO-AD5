export type Phase = 1 | 2;

export type QuestionCategory =
  | 'verbal'
  | 'numerical'
  | 'abstract'
  | 'eu-knowledge'
  | 'digital-skills';

export interface QuestionOption {
  id: string;
  text: string;
}

export interface QuestionSource {
  publisher: string;
  title: string;
  canonicalUrl: string;
  itemId: string;
  locator: string;
  answerLocator: string;
  licence: string;
  attribution: string;
  adaptationNote?: string;
  verifiedAt: string;
}

export interface QuestionTable {
  caption: string;
  headers: string[];
  rows: string[][];
}

export interface StudyQuestion {
  id: string;
  phase: Phase;
  category: QuestionCategory;
  title?: string;
  context?: string;
  prompt: string;
  options: QuestionOption[];
  correctOptionId: string;
  solution: string;
  timeSeconds?: number;
  table?: QuestionTable;
  source: QuestionSource;
}

export interface TestDefinition {
  id: string;
  phase: Phase;
  title: string;
  description: string;
  category?: QuestionCategory;
  questionIds: string[];
  durationSeconds: number;
  accent: 'blue' | 'gold' | 'coral' | 'mint';
  officialFormatNote: string;
}

export interface AttemptAnswer {
  questionId: string;
  selectedOptionId?: string;
  correct: boolean;
  /** The learner's confidence before seeing the published solution. */
  confidence?: AnswerConfidence;
  /** Active time spent on this question, excluding pauses. */
  elapsedSeconds?: number;
}

export type AnswerConfidence = 'low' | 'medium' | 'high';

export interface TestAttempt {
  id: string;
  testId: string;
  title: string;
  phase: Phase;
  category?: QuestionCategory;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  answers: AttemptAnswer[];
  score: number;
  total: number;
}

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export interface CardSchedule {
  cardId: string;
  dueAt: string;
  intervalDays: number;
  ease: number;
  repetitions: number;
  lapses: number;
  lastReviewedAt?: string;
}

export interface UserProfile {
  name: string;
  language1: string;
  language2: string;
  phase1Target: string;
  phase2Target: string;
  weeklyGoal: number;
}

export interface ExternalCompletion {
  resourceId: string;
  completedAt: string;
  category?: QuestionCategory;
  durationSeconds?: number;
  score?: number;
  total?: number;
  note?: string;
}

/** Learner-selected causes used by the coaching error journal. */
export type MistakeCause =
  | 'knowledge-gap'
  | 'misread-prompt'
  | 'reasoning-error'
  | 'calculation-error'
  | 'time-pressure'
  | 'careless-error'
  | 'confidence-miscalibration'
  | 'other';

export interface MistakeRecord {
  id: string;
  questionId: string;
  attemptId?: string;
  category?: QuestionCategory;
  cause: MistakeCause;
  note?: string;
  createdAt: string;
  updatedAt: string;
  reviewCount?: number;
  lastReviewedAt?: string;
  nextReviewAt?: string;
  resolved?: boolean;
  resolvedAt?: string;
}

export type MistakeInput = Omit<
  MistakeRecord,
  'createdAt' | 'updatedAt' | 'reviewCount' | 'resolved' | 'resolvedAt' | 'lastReviewedAt'
> &
  Partial<Pick<MistakeRecord, 'createdAt' | 'updatedAt' | 'reviewCount' | 'resolved' | 'resolvedAt' | 'lastReviewedAt'>>;

/**
 * Learner coaching scores for EPSO's five published EUFTE communication
 * anchors. Each value is 0, 1, or 2 (needs work / developing / demonstrated).
 * This app scale is not an official EPSO scoring scale or Selection Board mark.
 */
export interface WritingAnchorScores {
  logicalFlow: number;
  concision: number;
  clarity: number;
  audienceAndPurpose: number;
  useOfInformation: number;
}

export interface WritingPracticeRecord {
  id: string;
  title: string;
  sourceUrl?: string;
  completedAt: string;
  durationSeconds: number;
  anchorScores: WritingAnchorScores;
  text?: string;
  excerpt?: string;
  notes?: string;
}

export type CoachSessionType = 'review' | 'planning' | 'practice' | 'writing' | 'reflection' | 'other';

export interface CoachSessionLog {
  id: string;
  completedAt: string;
  type: CoachSessionType;
  focus: string;
  minutes?: number;
  category?: QuestionCategory;
  summary?: string;
  actionItems?: string[];
}

/**
 * Details the learner copies from their own Part 1 invitation and the testing
 * platform. Every field stays optional until EPSO actually provides it.
 */
export interface Part1Logistics {
  /** First day of the testing week stated in the invitation letter (YYYY-MM-DD). */
  testingWeekStart?: string;
  /** Prerequisite-check deadline stated in the invitation letter (YYYY-MM-DD). */
  prerequisiteDeadline?: string;
  /** Exact test date shown on the testing platform (YYYY-MM-DD). */
  testDate?: string;
  /** Exact start time exactly as shown on the testing platform (HH:mm). */
  testTime?: string;
}

export interface AppState {
  schemaVersion: number;
  profile: UserProfile;
  part1Logistics: Part1Logistics;
  attempts: TestAttempt[];
  schedules: Record<string, CardSchedule>;
  completedReadings: string[];
  externalCompletions: ExternalCompletion[];
  mistakes: MistakeRecord[];
  writingPractices: WritingPracticeRecord[];
  coachSessions: CoachSessionLog[];
  completedChecklistItems: string[];
  studyDates: string[];
  sourcePackAcknowledged: boolean;
}
