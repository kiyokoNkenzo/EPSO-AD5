import { describe, expect, it } from 'vitest';
import type { StudyQuestion, TestAttempt } from '../types';
import { buildGuidedTest, isGuidedTrainingMode } from './adaptiveTraining';

const source = {
  publisher: 'EPSO',
  title: 'Published sample',
  canonicalUrl: 'https://selection.eu-careers.europa.eu/sample.pdf',
  itemId: 'Q1',
  locator: 'p. 1',
  answerLocator: 'p. 2',
  licence: 'link',
  attribution: 'EPSO',
  verifiedAt: '2026-08-12'
};

const questions: StudyQuestion[] = [
  { id: 'v1', phase: 1, category: 'verbal', prompt: 'v1', options: [{ id: 'A', text: 'a' }, { id: 'B', text: 'b' }], correctOptionId: 'A', solution: 'A', timeSeconds: 100, source },
  { id: 'v2', phase: 1, category: 'verbal', prompt: 'v2', options: [{ id: 'A', text: 'a' }, { id: 'B', text: 'b' }], correctOptionId: 'A', solution: 'A', timeSeconds: 100, source },
  { id: 'n1', phase: 1, category: 'numerical', prompt: 'n1', options: [{ id: 'A', text: 'a' }, { id: 'B', text: 'b' }], correctOptionId: 'A', solution: 'A', timeSeconds: 120, source },
  { id: 'e1', phase: 2, category: 'eu-knowledge', prompt: 'e1', options: [{ id: 'A', text: 'a' }, { id: 'B', text: 'b' }], correctOptionId: 'A', solution: 'A', timeSeconds: 60, source }
];

const attempt: TestAttempt = {
  id: 'a1', testId: 'sample', title: 'Sample', phase: 1, startedAt: '2026-08-01T10:00:00Z', completedAt: '2026-08-01T10:05:00Z', durationSeconds: 300,
  answers: [
    { questionId: 'v1', selectedOptionId: 'B', correct: false, confidence: 'high', elapsedSeconds: 140 },
    { questionId: 'v2', selectedOptionId: 'A', correct: true, confidence: 'low', elapsedSeconds: 50 },
    { questionId: 'n1', selectedOptionId: 'A', correct: true, confidence: 'high', elapsedSeconds: 200 }
  ],
  score: 2, total: 3
};

describe('adaptive authentic-item training', () => {
  it('recognises only supported guided modes', () => {
    expect(isGuidedTrainingMode('phase1')).toBe(true);
    expect(isGuidedTrainingMode('invented')).toBe(false);
  });

  it('never introduces a question outside the supplied authentic bank', () => {
    const test = buildGuidedTest('weakness', [attempt], questions, 3);
    expect(test.questionIds.every((id) => questions.some((question) => question.id === id))).toBe(true);
    expect(new Set(test.questionIds).size).toBe(test.questionIds.length);
  });

  it('keeps Phase 1 and Phase 2 guided sets separate', () => {
    const phase1 = buildGuidedTest('phase1', [], questions, 10);
    const phase2 = buildGuidedTest('phase2', [], questions, 10);
    expect(phase1.questionIds).toEqual(['n1', 'v1', 'v2']);
    expect(phase2.questionIds).toEqual(['e1']);
  });

  it('prioritises an overconfident error in confidence mode', () => {
    expect(buildGuidedTest('confidence', [attempt], questions, 1).questionIds).toEqual(['v1']);
  });

  it('prioritises the slowest relative item in pace mode', () => {
    expect(buildGuidedTest('pace', [attempt], questions, 1).questionIds).toEqual(['n1']);
  });

  it('derives the timer only from selected published items', () => {
    const test = buildGuidedTest('phase2', [], questions, 1);
    expect(test.durationSeconds).toBe(60);
  });
});
