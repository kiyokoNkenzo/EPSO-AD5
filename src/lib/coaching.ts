import type { AppState, QuestionCategory, TestAttempt } from '../types';
import { COACHING_READINESS_TARGETS } from '../data/assessmentFramework';
import { phase2Cards } from '../data/cards';
import { externalPracticeById } from '../data/externalPractice';
import { questionsById, testDefinitions } from '../data/questions';
import {
  calculateCategoryMetrics,
  calculateReadinessIndex,
  evaluatePassGate,
  type CategoryMetrics,
  type ReadinessResult,
  type ScoredAttempt
} from './performance';
import { formatDate } from './date';
import {
  PREREQUISITE_CHECKLIST_ID,
  isChecklistItemApplicable,
  part1RolloutStatus,
  type Part1RolloutStatus
} from './part1Rollout';
import { isDue } from './spacedRepetition';

export type CoachingCategory = QuestionCategory | 'eufte';

export const OPERATION_CHECKLIST_IDS = [
  'supporting-documents',
  'portal-routine',
  'email-current',
  'tao-public-session',
  'test-environment',
  'language-and-id',
  PREREQUISITE_CHECKLIST_ID
] as const;

export interface CoachingSnapshot {
  metrics: CategoryMetrics[];
  readiness: ReadinessResult;
  gates: ReturnType<typeof evaluatePassGate>[];
  dueCards: number;
  dueMistakes: number;
  unresolvedMistakes: number;
  checklistComplete: number;
  checklistTotal: number;
  writingAverage: number | null;
  part1: Part1RolloutStatus;
  nextActions: CoachingAction[];
}

export interface CoachingAction {
  id: string;
  priority: number;
  title: string;
  detail: string;
  href: string;
  minutes: number;
  category?: CoachingCategory;
}

export const READINESS_REQUIREMENTS = [
  { category: 'verbal', weight: 35, minimumSamples: 30, targetAccuracy: 0.8 },
  { category: 'numerical', weight: 12.5, minimumSamples: 20, targetAccuracy: 0.8 },
  { category: 'abstract', weight: 12.5, minimumSamples: 20, targetAccuracy: 0.8 },
  { category: 'eu-knowledge', weight: 15, minimumSamples: 30, targetAccuracy: 0.8 },
  { category: 'digital-skills', weight: 15, minimumSamples: 30, targetAccuracy: 0.8 },
  { category: 'eufte', weight: 10, minimumSamples: 5, targetAccuracy: 0.8 }
] as const;

export function buildCoachingSnapshot(state: AppState, now = new Date()): CoachingSnapshot {
  const scored = toScoredAttempts(state, now);
  const metrics = calculateCategoryMetrics(scored, { now, recencyHalfLifeDays: 21 });
  const readiness = calculateReadinessIndex(metrics, READINESS_REQUIREMENTS);
  const gates = [
    evaluatePassGate(scored, { id: 'verbal', categories: ['verbal'], threshold: 0.5, minimumSamples: 20 }),
    evaluatePassGate(scored, { id: 'numerical-abstract', categories: ['numerical', 'abstract'], threshold: 0.5, minimumSamples: 20 }),
    evaluatePassGate(scored, { id: 'eu-knowledge', categories: ['eu-knowledge'], threshold: 0.5, minimumSamples: 30 }),
    evaluatePassGate(scored, { id: 'digital-skills', categories: ['digital-skills'], threshold: 0.5, minimumSamples: 40 }),
    evaluatePassGate(scored, { id: 'eufte', categories: ['eufte'], threshold: 0.5, minimumSamples: 5, basis: 'accuracy' })
  ];
  const unresolvedMistakes = state.mistakes.filter((mistake) => !mistake.resolved);
  const nowTime = now.getTime();
  const dueMistakes = unresolvedMistakes.filter((mistake) => {
    if (!mistake.nextReviewAt) return true;
    const dueTime = new Date(mistake.nextReviewAt).getTime();
    return Number.isNaN(dueTime) || dueTime <= nowTime;
  }).length;
  const dueCards = phase2Cards.filter((card) => isDue(state.schedules[card.id], now)).length;
  const writingAverage = state.writingPractices.length
    ? state.writingPractices.reduce((sum, practice) => sum + writingPracticeRatio(practice), 0) / state.writingPractices.length
    : null;
  const part1 = part1RolloutStatus(state, now);
  const applicableChecklist = OPERATION_CHECKLIST_IDS.filter((id) => isChecklistItemApplicable(id, part1));
  const snapshotBase = {
    metrics,
    readiness,
    gates,
    dueCards,
    dueMistakes,
    unresolvedMistakes: unresolvedMistakes.length,
    checklistComplete: applicableChecklist.filter((id) => state.completedChecklistItems.includes(id)).length,
    checklistTotal: applicableChecklist.length,
    writingAverage,
    part1
  };

  return { ...snapshotBase, nextActions: recommendActions(state, snapshotBase) };
}

export function toScoredAttempts(state: AppState, now = new Date()): ScoredAttempt[] {
  const attempts: ScoredAttempt[] = [];
  for (const attempt of state.attempts) attempts.push(...attemptRows(attempt));
  for (const completion of state.externalCompletions) {
    if (!completion.category || typeof completion.score !== 'number' || typeof completion.total !== 'number') continue;
    // Transfer drills and background quizzes remain valuable training volume, but
    // only a publisher-hosted EPSO sample is comparable enough to enter readiness.
    if (externalPracticeById.get(completion.resourceId)?.evidenceRole !== 'official-epso-calibration') continue;
    attempts.push({
      category: completion.category,
      correct: completion.score,
      total: completion.total,
      completedAt: completion.completedAt,
      durationSeconds: completion.durationSeconds
    });
  }
  for (const practice of state.writingPractices) {
    attempts.push({
      category: 'eufte',
      // The analytics engine deliberately accepts only whole scored-item counts.
      // Treat the five 0–2 coaching anchors as ten internal coaching points; this
      // remains explicitly separate from EPSO's unpublished marking rubric.
      correct: writingPracticePoints(practice),
      total: 10,
      completedAt: practice.completedAt,
      durationSeconds: practice.durationSeconds,
      targetDurationSeconds: 40 * 60
    });
  }
  return attempts.filter((attempt) => {
    const completed = attempt.completedAt ? new Date(attempt.completedAt).getTime() : now.getTime();
    return !Number.isNaN(completed);
  });
}

function attemptRows(attempt: TestAttempt): ScoredAttempt[] {
  const definition = testDefinitions.find((test) => test.id === attempt.testId);
  const categoryGroups = new Map<string, typeof attempt.answers>();
  for (const answer of attempt.answers) {
    const category = questionsById.get(answer.questionId)?.category ?? attempt.category;
    if (!category) continue;
    categoryGroups.set(category, [...(categoryGroups.get(category) ?? []), answer]);
  }
  return [...categoryGroups.entries()].map(([category, answers]) => {
    const elapsed = answers.reduce((sum, answer) => sum + (answer.elapsedSeconds ?? 0), 0);
    const target = answers.reduce((sum, answer) => sum + (questionsById.get(answer.questionId)?.timeSeconds ?? 0), 0);
    const confidenceValues: number[] = answers
      .map((answer) => answer.confidence === 'high' ? 0.9 : answer.confidence === 'medium' ? 0.65 : answer.confidence === 'low' ? 0.35 : null)
      .filter((value): value is 0.9 | 0.65 | 0.35 => value !== null);
    return {
      category,
      correct: answers.filter((answer) => answer.correct).length,
      total: answers.length,
      completedAt: attempt.completedAt,
      durationSeconds: elapsed || (categoryGroups.size === 1 ? attempt.durationSeconds : undefined),
      targetDurationSeconds: target || (categoryGroups.size === 1 ? definition?.durationSeconds : undefined),
      confidence: confidenceValues.length ? confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length : null
    };
  });
}

function writingPracticeRatio(practice: AppState['writingPractices'][number]): number {
  const scores = Object.values(practice.anchorScores);
  return scores.length ? scores.reduce((sum, value) => sum + value, 0) / (scores.length * 2) : 0;
}

function writingPracticePoints(practice: AppState['writingPractices'][number]): number {
  return Math.round(Object.values(practice.anchorScores).reduce((sum, value) => sum + value, 0));
}

function recommendActions(
  state: AppState,
  snapshot: Omit<CoachingSnapshot, 'nextActions'>
): CoachingAction[] {
  const actions: CoachingAction[] = [...part1Actions(snapshot.part1)];
  if (snapshot.checklistComplete < snapshot.checklistTotal) {
    actions.push({ id: 'logistics', priority: 100, title: 'Close an operational risk', detail: 'Review the official deadline, portal and test-day checklist.', href: '/coach#operations', minutes: 5 });
  }
  if (snapshot.dueMistakes > 0) {
    actions.push({ id: 'mistakes', priority: 95, title: `Repair ${snapshot.dueMistakes} due mistake${snapshot.dueMistakes === 1 ? '' : 's'}`, detail: 'Re-solve the published item, classify the cause and verify the official solution.', href: '/mistakes', minutes: Math.min(30, snapshot.dueMistakes * 5) });
  }
  const weakest = [...snapshot.readiness.components].sort((a, b) => a.index - b.index)[0];
  if (weakest) {
    const phase2 = weakest.category === 'eu-knowledge' || weakest.category === 'digital-skills' || weakest.category === 'eufte';
    actions.push({
      id: 'weakness',
      priority: 90,
      title: `${labelCategory(weakest.category)} needs the next block`,
      detail: weakest.sampleCount < 5 ? 'Evidence is too thin to trust. Build a sourced baseline.' : `Conservative readiness is ${Math.round(weakest.index)}%.`,
      href: weakest.category === 'eufte' ? '/writing' : `/practice/guided-${phase2 ? 'phase2' : 'weakness'}`,
      minutes: weakest.category === 'eufte' ? 40 : 20,
      category: weakest.category as CoachingCategory
    });
  }
  if (snapshot.dueCards > 0) {
    actions.push({ id: 'cards', priority: 75, title: `Retrieve ${Math.min(20, snapshot.dueCards)} due Phase 2 cards`, detail: 'Use spaced retrieval before rereading.', href: '/review', minutes: 15 });
  }
  if (state.writingPractices.length === 0) {
    actions.push({ id: 'writing', priority: 70, title: 'Create an EUFTE baseline', detail: 'Run a 40-minute source-bound drill and self-check all five official anchors.', href: '/writing', minutes: 45, category: 'eufte' });
  }
  return actions.sort((a, b) => b.priority - a.priority).slice(0, 4);
}

/** Time-sensitive Part 1 logistics outrank training only while EPSO's own deadlines are live. */
function part1Actions(part1: Part1RolloutStatus): CoachingAction[] {
  const actions: CoachingAction[] = [];
  const href = '/coach#part1';
  if (part1.stage === 'completed') return actions;
  if (part1.prerequisiteDeadline && part1.prerequisiteDaysLeft !== undefined && !part1.prerequisiteDone) {
    const daysLeft = part1.prerequisiteDaysLeft;
    actions.push(daysLeft < 0
      ? { id: 'prerequisite-check', priority: 110, title: 'Prerequisite-check deadline has passed', detail: 'Tick it if you completed the check; otherwise contact EPSO immediately.', href, minutes: 5 }
      : { id: 'prerequisite-check', priority: daysLeft <= 7 ? 110 : 96, title: 'Run the mandatory technical prerequisite check', detail: `Deadline ${formatDate(part1.prerequisiteDeadline)} (${daysLeft === 0 ? 'today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}). Use the computer, room and connection you will test with.`, href, minutes: 30 });
  }
  if (part1.slotOverdue) {
    actions.push({ id: 'exact-slot', priority: 105, title: 'Exact test slot still missing', detail: 'EPSO says the date and time appear on the testing platform at least two weeks before the test. Check again, then contact EPSO.', href, minutes: 10 });
  } else if (part1.slotLookupDue) {
    actions.push({ id: 'exact-slot', priority: 97, title: 'Look up your exact test date and time', detail: 'Follow the steps in your invitation letter to the testing platform, then record the slot here.', href, minutes: 5 });
  }
  if (part1.invitationWatchOpen) {
    actions.push({ id: 'invitation-watch', priority: 92, title: 'Check the Single Candidate Portal for your invitation', detail: 'Part 1 invitations give the testing week about three weeks before testing starts. Record it here when it arrives.', href, minutes: 3 });
  }
  if ((part1.stage === 'invited' || part1.stage === 'slot-confirmed') && part1.daysToTarget >= 0 && part1.daysToTarget <= 7) {
    actions.push({ id: 'test-week', priority: 94, title: 'Rehearse the one-sitting sequence', detail: 'All three reasoning tests run in one session: practise verbal, numerical and abstract back to back at official timing, then review only your own mistakes.', href: '/practice', minutes: 65 });
  }
  return actions;
}

export function coachingTarget(category: CoachingCategory) {
  return COACHING_READINESS_TARGETS.find((target) => target.testId === category);
}

export function labelCategory(category: string): string {
  return category === 'eu-knowledge' ? 'EU knowledge' : category === 'digital-skills' ? 'Digital skills' : category === 'eufte' ? 'EUFTE writing' : category.charAt(0).toUpperCase() + category.slice(1);
}
