import type {
  AnswerConfidence,
  AppState,
  CardSchedule,
  CoachSessionLog,
  CoachSessionType,
  ExternalCompletion,
  MistakeCause,
  MistakeRecord,
  Part1Logistics,
  QuestionCategory,
  TestAttempt,
  UserProfile,
  WritingAnchorScores,
  WritingPracticeRecord
} from '../types';

export const APP_STATE_SCHEMA_VERSION = 2;
export const APP_STATE_STORAGE_KEY = 'ad5-companion-state-v2';
export const LEGACY_APP_STATE_STORAGE_KEYS = ['ad5-companion-state-v1'] as const;

export interface AppStateStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  language1: 'English',
  language2: 'French',
  phase1Target: '2026-11-01',
  phase2Target: '2027-03-15',
  weeklyGoal: 5
};

const QUESTION_CATEGORIES: readonly QuestionCategory[] = [
  'verbal',
  'numerical',
  'abstract',
  'eu-knowledge',
  'digital-skills'
];
const ANSWER_CONFIDENCES: readonly AnswerConfidence[] = ['low', 'medium', 'high'];
const MISTAKE_CAUSES: readonly MistakeCause[] = [
  'knowledge-gap',
  'misread-prompt',
  'reasoning-error',
  'calculation-error',
  'time-pressure',
  'careless-error',
  'confidence-miscalibration',
  'other'
];
const COACH_SESSION_TYPES: readonly CoachSessionType[] = [
  'review',
  'planning',
  'practice',
  'writing',
  'reflection',
  'other'
];

const MAX_ATTEMPTS = 200;
const MAX_EXTERNAL_COMPLETIONS = 100;
const MAX_MISTAKES = 500;
const MAX_WRITING_PRACTICES = 200;
const MAX_COACH_SESSIONS = 500;
const MAX_TEXT = 20_000;
const MAX_LONG_TEXT = 250_000;

export function createDefaultState(): AppState {
  return {
    schemaVersion: APP_STATE_SCHEMA_VERSION,
    profile: { ...DEFAULT_PROFILE },
    part1Logistics: {},
    attempts: [],
    schedules: {},
    completedReadings: [],
    externalCompletions: [],
    mistakes: [],
    writingPractices: [],
    coachSessions: [],
    completedChecklistItems: [],
    studyDates: [],
    sourcePackAcknowledged: false
  };
}

/**
 * Converts an untrusted local-storage or import payload to the current schema.
 * Known valid records survive independently: one malformed record never drops
 * unrelated progress, and unknown keys are discarded.
 */
export function migrateAppState(input: unknown): AppState {
  const fallback = createDefaultState();
  if (!isRecord(input)) return fallback;

  return {
    schemaVersion: APP_STATE_SCHEMA_VERSION,
    profile: sanitizeProfile(input.profile, fallback.profile),
    part1Logistics: sanitizePart1Logistics(input.part1Logistics),
    attempts: sanitizeArray(input.attempts, sanitizeAttempt, MAX_ATTEMPTS),
    schedules: sanitizeSchedules(input.schedules),
    completedReadings: uniqueStrings(input.completedReadings),
    externalCompletions: sanitizeArray(
      input.externalCompletions,
      sanitizeExternalCompletion,
      MAX_EXTERNAL_COMPLETIONS
    ),
    mistakes: sanitizeArray(input.mistakes, sanitizeMistake, MAX_MISTAKES),
    writingPractices: sanitizeArray(
      input.writingPractices,
      sanitizeWritingPractice,
      MAX_WRITING_PRACTICES
    ),
    coachSessions: sanitizeArray(input.coachSessions, sanitizeCoachSession, MAX_COACH_SESSIONS),
    completedChecklistItems: uniqueStrings(input.completedChecklistItems),
    studyDates: uniqueIsoDates(input.studyDates),
    sourcePackAcknowledged: input.sourcePackAcknowledged === true
  };
}

/** Parse and sanitize a JSON export without allowing malformed data to escape. */
export function parseImportedAppState(raw: string): AppState | undefined {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || (parsed.schemaVersion !== 1 && parsed.schemaVersion !== APP_STATE_SCHEMA_VERSION)) {
      return undefined;
    }
    return migrateAppState(parsed);
  } catch {
    return undefined;
  }
}

/** Load the best available local backup without allowing storage failures to escape. */
export function loadAppStateFromStorage(storage: Pick<AppStateStorage, 'getItem'> | undefined): AppState {
  if (!storage) return createDefaultState();
  const keys = [APP_STATE_STORAGE_KEY, ...LEGACY_APP_STATE_STORAGE_KEYS];
  for (const key of keys) {
    let raw: string | null;
    try {
      raw = storage.getItem(key);
    } catch {
      return createDefaultState();
    }
    if (!raw) continue;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isRecord(parsed) || !hasRecognizedStateField(parsed)) continue;
      return migrateAppState(parsed);
    } catch {
      // Try a legacy backup when the current-key payload is broken JSON.
    }
  }
  return createDefaultState();
}

/** Persist progress opportunistically; callers can remain usable if it fails. */
export function persistAppState(
  storage: Pick<AppStateStorage, 'setItem'> | undefined,
  state: AppState
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

function sanitizeProfile(value: unknown, fallback: UserProfile): UserProfile {
  if (!isRecord(value)) return { ...fallback };
  return {
    name: optionalString(value.name, 200) ?? fallback.name,
    language1: nonEmptyString(value.language1, 100) ?? fallback.language1,
    language2: nonEmptyString(value.language2, 100) ?? fallback.language2,
    phase1Target: isoDate(value.phase1Target) ?? fallback.phase1Target,
    phase2Target: isoDate(value.phase2Target) ?? fallback.phase2Target,
    weeklyGoal: finiteInteger(value.weeklyGoal, 1, 14) ?? fallback.weeklyGoal
  };
}

/** Keeps only well-formed invitation dates; a time is kept only with its date. */
export function sanitizePart1Logistics(value: unknown): Part1Logistics {
  if (!isRecord(value)) return {};
  const testingWeekStart = isoDate(value.testingWeekStart);
  const prerequisiteDeadline = isoDate(value.prerequisiteDeadline);
  const testDate = isoDate(value.testDate);
  const testTime = clockTime(value.testTime);
  return {
    ...(testingWeekStart ? { testingWeekStart } : {}),
    ...(prerequisiteDeadline ? { prerequisiteDeadline } : {}),
    ...(testDate ? { testDate } : {}),
    ...(testDate && testTime ? { testTime } : {})
  };
}

function sanitizeAttempt(value: unknown): TestAttempt | undefined {
  if (!isRecord(value)) return undefined;
  const id = nonEmptyString(value.id);
  const testId = nonEmptyString(value.testId);
  const title = nonEmptyString(value.title);
  const startedAt = isoTimestamp(value.startedAt);
  const completedAt = isoTimestamp(value.completedAt);
  const phase = value.phase === 1 || value.phase === 2 ? value.phase : undefined;
  if (!id || !testId || !title || !startedAt || !completedAt || !phase) return undefined;

  const answers = sanitizeArray(value.answers, (answer) => {
    if (!isRecord(answer)) return undefined;
    const questionId = nonEmptyString(answer.questionId);
    if (!questionId || typeof answer.correct !== 'boolean') return undefined;
    const selectedOptionId = optionalString(answer.selectedOptionId, 200);
    const confidence = enumValue(answer.confidence, ANSWER_CONFIDENCES);
    const elapsedSeconds = finiteNumber(answer.elapsedSeconds, 0, 86_400);
    return {
      questionId,
      ...(selectedOptionId ? { selectedOptionId } : {}),
      correct: answer.correct,
      ...(confidence ? { confidence } : {}),
      ...(elapsedSeconds !== undefined ? { elapsedSeconds } : {})
    };
  }, 1_000);

  const category = enumValue(value.category, QUESTION_CATEGORIES);
  const durationSeconds = finiteNumber(value.durationSeconds, 0, 604_800) ?? 0;
  const computedScore = answers.filter((answer) => answer.correct).length;
  const storedTotal = finiteInteger(value.total, 0, 1_000);
  const total = storedTotal !== undefined ? Math.max(storedTotal, answers.length) : answers.length;
  const storedScore = finiteInteger(value.score, 0, total);

  return {
    id,
    testId,
    title,
    phase,
    ...(category ? { category } : {}),
    startedAt,
    completedAt,
    durationSeconds,
    answers,
    score: storedScore ?? computedScore,
    total
  };
}

function sanitizeSchedules(value: unknown): Record<string, CardSchedule> {
  if (!isRecord(value)) return {};
  const schedules: Record<string, CardSchedule> = {};
  for (const [key, candidate] of Object.entries(value).slice(0, 10_000)) {
    if (!isRecord(candidate)) continue;
    const cardId = nonEmptyString(candidate.cardId) ?? nonEmptyString(key);
    const dueAt = isoDate(candidate.dueAt);
    const intervalDays = finiteInteger(candidate.intervalDays, 0, 36_500);
    const ease = finiteNumber(candidate.ease, 1.3, 3.2);
    const repetitions = finiteInteger(candidate.repetitions, 0, 1_000_000);
    const lapses = finiteInteger(candidate.lapses, 0, 1_000_000);
    if (!cardId || !dueAt || intervalDays === undefined || ease === undefined || repetitions === undefined || lapses === undefined) {
      continue;
    }
    const lastReviewedAt = isoTimestamp(candidate.lastReviewedAt);
    schedules[cardId] = {
      cardId,
      dueAt,
      intervalDays,
      ease,
      repetitions,
      lapses,
      ...(lastReviewedAt ? { lastReviewedAt } : {})
    };
  }
  return schedules;
}

function sanitizeExternalCompletion(value: unknown): ExternalCompletion | undefined {
  if (!isRecord(value)) return undefined;
  const resourceId = nonEmptyString(value.resourceId);
  const completedAt = isoTimestamp(value.completedAt);
  if (!resourceId || !completedAt) return undefined;
  const category = enumValue(value.category, QUESTION_CATEGORIES);
  const durationSeconds = finiteNumber(value.durationSeconds, 0, 604_800);
  const score = finiteNumber(value.score, 0, Number.MAX_SAFE_INTEGER);
  const total = finiteNumber(value.total, 0, Number.MAX_SAFE_INTEGER);
  const safeScore = score !== undefined && (total === undefined || score <= total) ? score : undefined;
  const note = optionalString(value.note, MAX_TEXT);
  return {
    resourceId,
    completedAt,
    ...(category ? { category } : {}),
    ...(durationSeconds !== undefined ? { durationSeconds } : {}),
    ...(safeScore !== undefined ? { score: safeScore } : {}),
    ...(total !== undefined ? { total } : {}),
    ...(note !== undefined ? { note } : {})
  };
}

function sanitizeMistake(value: unknown): MistakeRecord | undefined {
  if (!isRecord(value)) return undefined;
  const id = nonEmptyString(value.id);
  const questionId = nonEmptyString(value.questionId);
  const cause = value.cause === 'misread' ? 'misread-prompt' : enumValue(value.cause, MISTAKE_CAUSES);
  const createdAt = isoTimestamp(value.createdAt);
  if (!id || !questionId || !cause || !createdAt) return undefined;
  const updatedAt = isoTimestamp(value.updatedAt) ?? createdAt;
  const attemptId = optionalString(value.attemptId, 500);
  const category = enumValue(value.category, QUESTION_CATEGORIES);
  const note = optionalString(value.note, MAX_TEXT);
  const reviewCount = finiteInteger(value.reviewCount, 0, 1_000_000) ?? 0;
  const lastReviewedAt = isoTimestamp(value.lastReviewedAt);
  const nextReviewAt = isoTimestamp(value.nextReviewAt);
  const resolved = value.resolved === true;
  const resolvedAt = resolved ? isoTimestamp(value.resolvedAt) : undefined;
  return {
    id,
    questionId,
    ...(attemptId ? { attemptId } : {}),
    ...(category ? { category } : {}),
    cause,
    ...(note !== undefined ? { note } : {}),
    createdAt,
    updatedAt,
    reviewCount,
    ...(lastReviewedAt ? { lastReviewedAt } : {}),
    ...(nextReviewAt ? { nextReviewAt } : {}),
    resolved,
    ...(resolvedAt ? { resolvedAt } : {})
  };
}

function sanitizeWritingPractice(value: unknown): WritingPracticeRecord | undefined {
  if (!isRecord(value)) return undefined;
  const id = nonEmptyString(value.id);
  const title = nonEmptyString(value.title);
  const completedAt = isoTimestamp(value.completedAt);
  const durationSeconds = finiteNumber(value.durationSeconds, 0, 86_400);
  const anchorScores = sanitizeAnchorScores(value.anchorScores);
  if (!id || !title || !completedAt || durationSeconds === undefined || !anchorScores) return undefined;
  const sourceUrl = httpsUrl(value.sourceUrl);
  const text = optionalString(value.text, MAX_LONG_TEXT);
  const excerpt = optionalString(value.excerpt, MAX_TEXT);
  const notes = optionalString(value.notes, MAX_TEXT);
  return {
    id,
    title,
    ...(sourceUrl ? { sourceUrl } : {}),
    completedAt,
    durationSeconds,
    anchorScores,
    ...(text !== undefined ? { text } : {}),
    ...(excerpt !== undefined ? { excerpt } : {}),
    ...(notes !== undefined ? { notes } : {})
  };
}

function sanitizeAnchorScores(value: unknown): WritingAnchorScores | undefined {
  if (!isRecord(value)) return undefined;
  const logicalFlow = finiteInteger(value.logicalFlow, 0, 2);
  const concision = finiteInteger(value.concision, 0, 2);
  const clarity = finiteInteger(value.clarity, 0, 2);
  const audienceAndPurpose = finiteInteger(value.audienceAndPurpose, 0, 2);
  const useOfInformation = finiteInteger(value.useOfInformation, 0, 2);
  if (
    logicalFlow === undefined ||
    concision === undefined ||
    clarity === undefined ||
    audienceAndPurpose === undefined ||
    useOfInformation === undefined
  ) return undefined;
  return { logicalFlow, concision, clarity, audienceAndPurpose, useOfInformation };
}

function sanitizeCoachSession(value: unknown): CoachSessionLog | undefined {
  if (!isRecord(value)) return undefined;
  const id = nonEmptyString(value.id);
  const completedAt = isoTimestamp(value.completedAt);
  const type = enumValue(value.type, COACH_SESSION_TYPES);
  const focus = nonEmptyString(value.focus);
  if (!id || !completedAt || !type || !focus) return undefined;
  const minutes = finiteNumber(value.minutes, 0, 1_440);
  const category = enumValue(value.category, QUESTION_CATEGORIES);
  const summary = optionalString(value.summary, MAX_TEXT);
  const actionItems = uniqueStrings(value.actionItems);
  return {
    id,
    completedAt,
    type,
    focus,
    ...(minutes !== undefined ? { minutes } : {}),
    ...(category ? { category } : {}),
    ...(summary !== undefined ? { summary } : {}),
    ...(actionItems.length ? { actionItems } : {})
  };
}

function sanitizeArray<T>(
  value: unknown,
  sanitizer: (entry: unknown) => T | undefined,
  maximum: number
): T[] {
  if (!Array.isArray(value)) return [];
  const result: T[] = [];
  for (const entry of value) {
    const sanitized = sanitizer(entry);
    if (sanitized !== undefined) result.push(sanitized);
    if (result.length >= maximum) break;
  }
  return result;
}

function uniqueStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const result: string[] = [];
  const seen = new Set<string>();
  for (const candidate of value) {
    const text = nonEmptyString(candidate);
    if (text && !seen.has(text)) {
      result.push(text);
      seen.add(text);
    }
    if (result.length >= 10_000) break;
  }
  return result;
}

function uniqueIsoDates(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const dates = value.map(isoDate).filter((date): date is string => Boolean(date));
  return [...new Set(dates)];
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === 'string' && allowed.includes(value as T) ? (value as T) : undefined;
}

function nonEmptyString(value: unknown, maximum = MAX_TEXT): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  return text ? text.slice(0, maximum) : undefined;
}

function optionalString(value: unknown, maximum = MAX_TEXT): string | undefined {
  if (typeof value !== 'string') return undefined;
  return value.slice(0, maximum);
}

function finiteNumber(value: unknown, minimum: number, maximum: number): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= minimum && value <= maximum
    ? value
    : undefined;
}

function finiteInteger(value: unknown, minimum: number, maximum: number): number | undefined {
  const number = finiteNumber(value, minimum, maximum);
  return number !== undefined && Number.isInteger(number) ? number : undefined;
}

function isoDate(value: unknown): string | undefined {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : undefined;
}

function clockTime(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  return match && Number(match[1]) <= 23 && Number(match[2]) <= 59 ? value : undefined;
}

function isoTimestamp(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function httpsUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasRecognizedStateField(value: Record<string, unknown>): boolean {
  return [
    'schemaVersion',
    'profile',
    'part1Logistics',
    'attempts',
    'schedules',
    'completedReadings',
    'externalCompletions',
    'mistakes',
    'writingPractices',
    'coachSessions',
    'completedChecklistItems',
    'studyDates',
    'sourcePackAcknowledged'
  ].some((key) => key in value);
}
