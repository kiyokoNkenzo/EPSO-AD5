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
});
