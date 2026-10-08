import { describe, expect, it } from 'vitest';
import { defaultState } from '../state/AppState';
import type { AppState } from '../types';
import { buildCoachingSnapshot, toScoredAttempts } from './coaching';

describe('coaching snapshot', () => {
  it('does not treat no evidence as readiness', () => {
    const snapshot = buildCoachingSnapshot(defaultState, new Date('2026-08-13T12:00:00Z'));
    expect(snapshot.readiness.index).toBe(0);
    expect(snapshot.readiness.band).toBe('insufficient-evidence');
    expect(snapshot.nextActions.length).toBeGreaterThan(0);
  });

  it('splits question evidence by authentic source category', () => {
    const state: AppState = {
      ...defaultState,
      attempts: [{
        id: 'a', testId: 'mixed', title: 'Mixed', phase: 1, startedAt: '2026-08-12T10:00:00Z', completedAt: '2026-08-12T10:10:00Z', durationSeconds: 600,
        answers: [
          { questionId: 'epso-verbal-01', selectedOptionId: 'A', correct: true, confidence: 'high', elapsedSeconds: 80 },
          { questionId: 'epso-numerical-01', selectedOptionId: 'B', correct: true, confidence: 'medium', elapsedSeconds: 100 }
        ], score: 2, total: 2
      }]
    };
    const rows = toScoredAttempts(state);
    expect(rows.map((row) => row.category).sort()).toEqual(['numerical', 'verbal']);
    expect(rows.every((row) => row.total === 1)).toBe(true);
  });

  it('keeps transfer-practice scores out of the EPSO readiness estimate', () => {
    const state: AppState = {
      ...defaultState,
      externalCompletions: [
        { resourceId: 'ucat-official-question-banks', completedAt: '2026-08-12T10:00:00Z', category: 'verbal', score: 40, total: 40 },
        { resourceId: 'epso-ad-abstract-samples', completedAt: '2026-08-12T11:00:00Z', category: 'abstract', score: 8, total: 10 }
      ]
    };
    const rows = toScoredAttempts(state);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ category: 'abstract', correct: 8, total: 10 });
  });

  it('puts due mistake repair ahead of ordinary review', () => {
    const state: AppState = {
      ...defaultState,
      mistakes: [{ id: 'm1', questionId: 'epso-verbal-01', cause: 'misread-prompt', note: '', createdAt: '2026-08-10T10:00:00Z', updatedAt: '2026-08-10T10:00:00Z', nextReviewAt: '2026-08-12T10:00:00Z' }]
    };
    const snapshot = buildCoachingSnapshot(state, new Date('2026-08-13T12:00:00Z'));
    expect(snapshot.dueMistakes).toBe(1);
    expect(snapshot.nextActions.some((action) => action.id === 'mistakes')).toBe(true);
  });

  it('compares mistake review timestamps exactly across UTC/local date boundaries', () => {
    const state: AppState = {
      ...defaultState,
      mistakes: [{
        id: 'm-future',
        questionId: 'epso-verbal-01',
        cause: 'other',
        createdAt: '2026-08-12T23:15:00Z',
        updatedAt: '2026-08-12T23:15:00Z',
        nextReviewAt: '2026-08-13T23:15:00Z',
        reviewCount: 0,
        resolved: false
      }]
    };
    const snapshot = buildCoachingSnapshot(state, new Date('2026-08-12T23:16:00Z'));
    expect(snapshot.dueMistakes).toBe(0);
    expect(snapshot.unresolvedMistakes).toBe(1);
    expect(snapshot.nextActions.some((action) => action.id === 'mistakes')).toBe(false);
  });

  it('only counts the prerequisite check as an open risk once an invitation is recorded', () => {
    const before = buildCoachingSnapshot(defaultState, new Date('2026-10-08T12:00:00Z'));
    expect(before.checklistTotal).toBe(6);
    const invited: AppState = { ...defaultState, part1Logistics: { testingWeekStart: '2026-11-16' } };
    expect(buildCoachingSnapshot(invited, new Date('2026-10-30T12:00:00Z')).checklistTotal).toBe(7);
  });

  it('puts an imminent prerequisite-check deadline above every training action', () => {
    const state: AppState = {
      ...defaultState,
      part1Logistics: { testingWeekStart: '2026-11-16', prerequisiteDeadline: '2026-11-06' }
    };
    const snapshot = buildCoachingSnapshot(state, new Date('2026-11-02T12:00:00Z'));
    expect(snapshot.nextActions[0]).toMatchObject({ id: 'prerequisite-check', href: '/coach#part1' });
    expect(snapshot.nextActions.some((action) => action.id === 'exact-slot')).toBe(true);

    const done = buildCoachingSnapshot(
      { ...state, completedChecklistItems: ['prerequisite-check'] },
      new Date('2026-11-02T12:00:00Z')
    );
    expect(done.nextActions.some((action) => action.id === 'prerequisite-check')).toBe(false);
  });

  it('prompts an invitation check only once the estimated invitation window is open', () => {
    const early = buildCoachingSnapshot(defaultState, new Date('2026-10-08T12:00:00Z'));
    expect(early.nextActions.some((action) => action.id === 'invitation-watch')).toBe(false);
    const open = buildCoachingSnapshot(defaultState, new Date('2026-10-12T12:00:00Z'));
    expect(open.nextActions.some((action) => action.id === 'invitation-watch')).toBe(true);
  });

  it('switches to a one-sitting rehearsal in the final week and stops logistics after the test', () => {
    const state: AppState = {
      ...defaultState,
      part1Logistics: { testingWeekStart: '2026-11-16', testDate: '2026-11-18' }
    };
    const testWeek = buildCoachingSnapshot(state, new Date('2026-11-13T12:00:00Z'));
    expect(testWeek.nextActions.some((action) => action.id === 'test-week')).toBe(true);
    const after = buildCoachingSnapshot(state, new Date('2026-11-20T12:00:00Z'));
    expect(after.part1.stage).toBe('completed');
    expect(after.nextActions.some((action) => ['test-week', 'exact-slot', 'invitation-watch'].includes(action.id))).toBe(false);
  });
});
