import { describe, expect, it } from 'vitest';

import {
  PERFORMANCE_ESTIMATE_NOTICE,
  calculateCalibration,
  calculateCategoryMetrics,
  calculateReadinessIndex,
  calculateWeightedScore,
  evaluatePassGate,
  summarizeCategory,
  wilsonLowerBound,
  type ScoredAttempt
} from './performance';

const NOW = '2026-08-13T12:00:00.000Z';

function attempt(overrides: Partial<ScoredAttempt> = {}): ScoredAttempt {
  return {
    category: 'verbal',
    correct: 1,
    total: 1,
    completedAt: '2026-08-12T12:00:00.000Z',
    ...overrides
  };
}

describe('wilsonLowerBound', () => {
  it('matches a known 95% lower bound and remains conservative', () => {
    expect(wilsonLowerBound(5, 10)).toBeCloseTo(0.2366, 4);
    expect(wilsonLowerBound(10, 10)).toBeCloseTo(0.7225, 4);
    expect(wilsonLowerBound(10, 10)).toBeLessThan(1);
  });

  it('handles empty and invalid inputs without returning NaN', () => {
    expect(wilsonLowerBound(0, 0)).toBe(0);
    expect(wilsonLowerBound(Number.NaN, 10)).toBe(0);
    expect(wilsonLowerBound(2, Number.POSITIVE_INFINITY)).toBe(0);
  });

  it('bounds impossible success counts and falls back from an invalid z value', () => {
    expect(wilsonLowerBound(-4, 10)).toBeCloseTo(wilsonLowerBound(0, 10));
    expect(wilsonLowerBound(14, 10)).toBeCloseTo(wilsonLowerBound(10, 10));
    expect(wilsonLowerBound(7, 10, -1)).toBeCloseTo(wilsonLowerBound(7, 10));
  });
});

describe('category metrics', () => {
  it('aggregates accuracy, session and sample counts, recency, and pace', () => {
    const metrics = summarizeCategory(
      'verbal',
      [
        attempt({
          correct: 7,
          total: 10,
          completedAt: '2026-08-03T12:00:00.000Z',
          durationSeconds: 700,
          targetDurationSeconds: 600
        }),
        attempt({
          correct: 9,
          total: 10,
          durationSeconds: 500,
          targetDurationSeconds: 600
        }),
        attempt({ category: 'numerical', correct: 5, total: 5 })
      ],
      { now: NOW, recencyHalfLifeDays: 1 }
    );

    expect(metrics).toMatchObject({
      category: 'verbal',
      sampleCount: 20,
      attemptCount: 2,
      correctCount: 16,
      accuracy: 0.8,
      latestAttemptAt: '2026-08-12T12:00:00.000Z',
      daysSinceLastAttempt: 1,
      timedAttemptCount: 2,
      timedSampleCount: 20,
      averageSecondsPerItem: 60,
      paceRatio: 1,
      onPaceRate: 0.5
    });
    expect(metrics.recencyScore).toBeCloseTo(0.5);
    expect(metrics.wilsonLowerBound).toBeLessThan(metrics.accuracy as number);
  });

  it('does not read the system clock when no explicit now is supplied', () => {
    const metrics = summarizeCategory('verbal', [attempt()]);

    expect(metrics.latestAttemptAt).toBe('2026-08-12T12:00:00.000Z');
    expect(metrics.daysSinceLastAttempt).toBeNull();
    expect(metrics.recencyScore).toBeNull();
  });

  it('groups categories deterministically and ignores malformed scoring rows', () => {
    const metrics = calculateCategoryMetrics([
      attempt({ category: 'verbal', correct: 8, total: 10 }),
      attempt({ category: 'abstract', correct: 4, total: 5 }),
      attempt({ category: '', correct: 1, total: 1 }),
      attempt({ category: 'verbal', correct: 11, total: 10 }),
      attempt({ category: 'verbal', correct: 1, total: 0 }),
      attempt({ category: 'verbal', correct: 1.5, total: 2 })
    ]);

    expect(metrics.map((metric) => metric.category)).toEqual(['abstract', 'verbal']);
    expect(metrics.find((metric) => metric.category === 'verbal')).toMatchObject({
      sampleCount: 10,
      attemptCount: 1,
      accuracy: 0.8
    });
  });

  it('returns explicit empty states for a category without evidence', () => {
    const metrics = summarizeCategory('digital-skills', []);

    expect(metrics).toMatchObject({
      sampleCount: 0,
      attemptCount: 0,
      correctCount: 0,
      accuracy: null,
      wilsonLowerBound: 0,
      latestAttemptAt: null,
      paceRatio: null,
      calibration: null
    });
    expect(metrics.trend.direction).toBe('insufficient-evidence');
  });

  it('marks improvement, decline, stability, and too-little trend evidence', () => {
    const improving = summarizeCategory(
      'verbal',
      [
        attempt({ correct: 5, total: 10, completedAt: '2026-08-01' }),
        attempt({ correct: 9, total: 10, completedAt: '2026-08-02' })
      ],
      { trendMinimumItemsPerWindow: 5 }
    );
    const declining = summarizeCategory(
      'verbal',
      [
        attempt({ correct: 9, total: 10, completedAt: '2026-08-01' }),
        attempt({ correct: 5, total: 10, completedAt: '2026-08-02' })
      ],
      { trendMinimumItemsPerWindow: 5 }
    );
    const stable = summarizeCategory(
      'verbal',
      [
        attempt({ correct: 8, total: 10, completedAt: '2026-08-01' }),
        attempt({ correct: 8, total: 10, completedAt: '2026-08-02' })
      ],
      { trendMinimumItemsPerWindow: 5 }
    );
    const sparse = summarizeCategory(
      'verbal',
      [
        attempt({ correct: 1, total: 1, completedAt: '2026-08-01' }),
        attempt({ correct: 1, total: 1, completedAt: '2026-08-02' })
      ],
      { trendMinimumItemsPerWindow: 5 }
    );

    expect(improving.trend).toMatchObject({ direction: 'improving', change: 0.4 });
    expect(declining.trend).toMatchObject({ direction: 'declining', change: -0.4 });
    expect(stable.trend).toMatchObject({ direction: 'stable', change: 0 });
    expect(sparse.trend).toMatchObject({
      direction: 'insufficient-evidence',
      change: null,
      previousSampleCount: 1,
      recentSampleCount: 1
    });
  });

  it('ignores invalid dates, timings, and confidence without discarding valid scores', () => {
    const metrics = summarizeCategory('verbal', [
      attempt({
        correct: 1,
        total: 2,
        completedAt: 'not-a-date',
        durationSeconds: -10,
        targetDurationSeconds: 20,
        confidence: 2
      })
    ]);

    expect(metrics.accuracy).toBe(0.5);
    expect(metrics.latestAttemptAt).toBeNull();
    expect(metrics.paceRatio).toBeNull();
    expect(metrics.calibration).toBeNull();
  });
});

describe('confidence calibration', () => {
  it('calculates proper binary Brier score and overconfidence gap', () => {
    const calibration = calculateCalibration([
      attempt({ correct: 8, total: 10, confidence: 0.8 }),
      attempt({ correct: 0, total: 1, confidence: 1 })
    ]);

    expect(calibration).not.toBeNull();
    expect(calibration?.sampleCount).toBe(11);
    expect(calibration?.attemptCount).toBe(2);
    expect(calibration?.brierScore).toBeCloseTo(2.6 / 11);
    expect(calibration?.meanConfidence).toBeCloseTo(9 / 11);
    expect(calibration?.observedAccuracy).toBeCloseTo(8 / 11);
    expect(calibration?.calibrationGap).toBeCloseTo(1 / 11);
  });

  it('accepts boundary probabilities and returns null without valid confidence', () => {
    expect(calculateCalibration([attempt({ correct: 1, confidence: 1 })])?.brierScore).toBe(0);
    expect(calculateCalibration([attempt({ confidence: -0.1 })])).toBeNull();
    expect(calculateCalibration([])).toBeNull();
  });
});

describe('official-style weighted scoring', () => {
  it('normalizes supplied official weights without requiring a particular scale', () => {
    const result = calculateWeightedScore([
      { id: 'verbal', score: 16, maximum: 20, weight: 40 },
      { id: 'eu-knowledge', score: 24, maximum: 30, weight: 30 },
      { id: 'digital', score: 30, maximum: 40, weight: 30 }
    ]);

    expect(result.weightedPoints).toBe(78.5);
    expect(result.maximumWeightedPoints).toBe(100);
    expect(result.percentage).toBe(78.5);
    expect(result.isComplete).toBe(true);
  });

  it('clamps out-of-range scores and excludes invalid components explicitly', () => {
    const result = calculateWeightedScore([
      { id: 'above', score: 12, maximum: 10, weight: 2 },
      { id: 'below', score: -2, maximum: 10, weight: 1 },
      { id: 'bad-max', score: 2, maximum: 0, weight: 1 },
      { id: 'bad-weight', score: 2, maximum: 10, weight: 0 }
    ]);

    expect(result.percentage).toBeCloseTo(200 / 3);
    expect(result.components.map((component) => component.wasClamped)).toEqual([true, true]);
    expect(result.excludedComponentIds).toEqual(['bad-max', 'bad-weight']);
    expect(result.isComplete).toBe(false);
  });

  it('returns a safe zero result for no usable components', () => {
    expect(calculateWeightedScore([])).toEqual({
      components: [],
      weightedPoints: 0,
      maximumWeightedPoints: 0,
      percentage: 0,
      validComponentCount: 0,
      excludedComponentIds: [],
      isComplete: false
    });
  });
});

describe('practice pass gates', () => {
  it('requires the configured amount of evidence before evaluating', () => {
    const result = evaluatePassGate(
      [attempt({ correct: 10, total: 10 })],
      {
        id: 'verbal-gate',
        categories: ['verbal'],
        threshold: 0.5,
        minimumSamples: 20
      }
    );

    expect(result).toMatchObject({
      status: 'insufficient-evidence',
      sampleCount: 10,
      samplesStillNeeded: 10,
      reason: 'not-enough-samples',
      evidenceValue: null,
      isEstimate: true
    });
  });

  it('supports exact-accuracy and conservative Wilson evaluation bases', () => {
    const data = [attempt({ correct: 12, total: 20 })];
    const definition = {
      id: 'verbal-gate',
      categories: ['verbal'],
      threshold: 0.5,
      minimumSamples: 20
    } as const;

    expect(evaluatePassGate(data, { ...definition, basis: 'accuracy' }).status).toBe(
      'meets-gate'
    );
    expect(evaluatePassGate(data, definition).status).toBe('below-gate');
  });

  it('combines categories for a joint gate', () => {
    const result = evaluatePassGate(
      [
        attempt({ category: 'numerical', correct: 8, total: 10 }),
        attempt({ category: 'abstract', correct: 7, total: 10 }),
        attempt({ category: 'verbal', correct: 0, total: 10 })
      ],
      {
        id: 'reasoning-combined',
        categories: ['numerical', 'abstract'],
        threshold: 0.5,
        minimumSamples: 20,
        basis: 'accuracy'
      }
    );

    expect(result).toMatchObject({
      status: 'meets-gate',
      observedAccuracy: 0.75,
      sampleCount: 20
    });
  });

  it('returns an explicit invalid-definition state', () => {
    const result = evaluatePassGate([attempt()], {
      id: 'broken',
      categories: [],
      threshold: 1.5,
      minimumSamples: 0
    });

    expect(result).toMatchObject({
      status: 'insufficient-evidence',
      reason: 'invalid-definition',
      evidenceValue: null
    });
  });
});

describe('overall readiness', () => {
  it('does not let a perfect tiny sample overstate readiness', () => {
    const tinyMetrics = calculateCategoryMetrics([
      attempt({ category: 'verbal', correct: 1, total: 1 })
    ]);
    const result = calculateReadinessIndex(tinyMetrics, [
      { category: 'verbal', weight: 1, minimumSamples: 30 }
    ]);

    expect(result.evidenceCoverage).toBeCloseTo(1 / 30);
    expect(result.index).toBeLessThan(1);
    expect(result.band).toBe('insufficient-evidence');
    expect(result.notice).toBe(PERFORMANCE_ESTIMATE_NOTICE);
    expect(result.notice.toLowerCase()).toContain('not a guarantee');
  });

  it('rewards strong, adequately sampled evidence while retaining uncertainty', () => {
    const strongMetrics = calculateCategoryMetrics([
      attempt({ category: 'verbal', correct: 100, total: 100 })
    ]);
    const result = calculateReadinessIndex(strongMetrics, [
      { category: 'verbal', weight: 40, minimumSamples: 30, targetAccuracy: 0.8 }
    ]);

    expect(result.evidenceCoverage).toBe(1);
    expect(result.index).toBeGreaterThan(94);
    expect(result.index).toBeLessThan(100);
    expect(result.band).toBe('strong');
    expect(result.components[0].conservativeTargetMargin).toBeGreaterThan(0);
  });

  it('penalizes missing required categories instead of renormalizing them away', () => {
    const metrics = calculateCategoryMetrics([
      attempt({ category: 'verbal', correct: 100, total: 100 })
    ]);
    const result = calculateReadinessIndex(metrics, [
      { category: 'verbal', weight: 50, minimumSamples: 30 },
      { category: 'digital-skills', weight: 50, minimumSamples: 30 }
    ]);

    expect(result.evidenceCoverage).toBe(0.5);
    expect(result.index).toBeGreaterThan(45);
    expect(result.index).toBeLessThan(50);
    expect(result.band).toBe('insufficient-evidence');
    expect(result.components[1]).toMatchObject({
      category: 'digital-skills',
      sampleCount: 0,
      evidenceFactor: 0,
      index: 0
    });
  });

  it('applies a bounded freshness penalty when explicit recency data exists', () => {
    const fresh = calculateCategoryMetrics(
      [attempt({ correct: 100, total: 100, completedAt: NOW })],
      { now: NOW, recencyHalfLifeDays: 10 }
    );
    const stale = calculateCategoryMetrics(
      [attempt({ correct: 100, total: 100, completedAt: '2026-07-04T12:00:00.000Z' })],
      { now: NOW, recencyHalfLifeDays: 10 }
    );
    const requirements = [{ category: 'verbal', weight: 1, minimumSamples: 30 }];

    const freshReadiness = calculateReadinessIndex(fresh, requirements);
    const staleReadiness = calculateReadinessIndex(stale, requirements);

    expect(freshReadiness.components[0].freshnessFactor).toBe(1);
    expect(staleReadiness.components[0].freshnessFactor).toBeCloseTo(0.71875);
    expect(staleReadiness.index).toBeLessThan(freshReadiness.index);
  });

  it('handles empty and invalid requirements without NaN or inflated scores', () => {
    const metrics = calculateCategoryMetrics([attempt()]);
    const empty = calculateReadinessIndex(metrics, []);
    const invalid = calculateReadinessIndex(metrics, [
      { category: '', weight: 1 },
      { category: 'verbal', weight: 0 },
      { category: 'verbal', weight: 1, minimumSamples: -1 }
    ]);

    expect(empty).toMatchObject({
      index: 0,
      band: 'insufficient-evidence',
      evidenceCoverage: 0,
      validRequirementCount: 0
    });
    expect(invalid.index).toBe(0);
    expect(invalid.excludedCategories).toHaveLength(3);
  });
});
