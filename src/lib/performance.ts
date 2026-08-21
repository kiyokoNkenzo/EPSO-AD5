/**
 * Evidence-aware performance analytics for practice data.
 *
 * All functions are deterministic and side-effect free. In particular, recency
 * is only calculated when callers supply an explicit `now` value.
 */

export type DateInput = string | number | Date;

export interface ScoredAttempt {
  /** Stable category key, for example `verbal` or `eu-knowledge`. */
  category: string;
  /** Number of correct scored items in this attempt. */
  correct: number;
  /** Number of scored items in this attempt. */
  total: number;
  /** Used for recency and trend; invalid or missing dates do not invalidate scores. */
  completedAt?: DateInput;
  /** Whole-attempt elapsed time. */
  durationSeconds?: number;
  /** Whole-attempt target or official time allowance. */
  targetDurationSeconds?: number;
  /** Predicted probability of a correct response, from 0 to 1. */
  confidence?: number | null;
}

export interface PerformanceOptions {
  /** Required to calculate days-since-last-attempt and recency. */
  now?: DateInput;
  /** A recency score halves after this many days. Defaults to 30. */
  recencyHalfLifeDays?: number;
  /** Minimum scored items in each half of the trend comparison. Defaults to 5. */
  trendMinimumItemsPerWindow?: number;
  /** Absolute accuracy change treated as stable. Defaults to 0.03. */
  trendStableThreshold?: number;
  /** Z value used by the Wilson interval. Defaults to 1.96 (approximately 95%). */
  wilsonZ?: number;
}

export type TrendDirection =
  | 'insufficient-evidence'
  | 'improving'
  | 'stable'
  | 'declining';

export interface TrendMetrics {
  direction: TrendDirection;
  /** Recent-window accuracy minus previous-window accuracy. */
  change: number | null;
  previousAccuracy: number | null;
  recentAccuracy: number | null;
  previousSampleCount: number;
  recentSampleCount: number;
}

export interface CalibrationMetrics {
  /** Number of scored items attached to valid confidence estimates. */
  sampleCount: number;
  attemptCount: number;
  /** 0 is perfect and 1 is worst for binary predictions. */
  brierScore: number;
  meanConfidence: number;
  observedAccuracy: number;
  /** Positive means confidence exceeded observed accuracy. */
  calibrationGap: number;
  absoluteCalibrationGap: number;
}

export interface CategoryMetrics {
  category: string;
  /** Scored items, rather than test-session count. */
  sampleCount: number;
  attemptCount: number;
  correctCount: number;
  accuracy: number | null;
  /** Conservative lower bound for the underlying accuracy. */
  wilsonLowerBound: number;
  latestAttemptAt: string | null;
  daysSinceLastAttempt: number | null;
  /** Exponential score from 0 to 1; null when `now` or valid dates are absent. */
  recencyScore: number | null;
  /** Actual time divided by target time. <= 1 means at or faster than target pace. */
  paceRatio: number | null;
  timedAttemptCount: number;
  timedSampleCount: number;
  averageSecondsPerItem: number | null;
  onPaceRate: number | null;
  trend: TrendMetrics;
  calibration: CalibrationMetrics | null;
}

export interface WeightedScoreComponent {
  id: string;
  score: number;
  maximum: number;
  /** Relative or percentage weight. All positive scales are accepted. */
  weight: number;
}

export interface WeightedComponentResult extends WeightedScoreComponent {
  normalizedScore: number;
  weightedPoints: number;
  wasClamped: boolean;
}

export interface WeightedScoreResult {
  components: WeightedComponentResult[];
  weightedPoints: number;
  maximumWeightedPoints: number;
  /** Normalized weighted result from 0 to 100. */
  percentage: number;
  validComponentCount: number;
  excludedComponentIds: string[];
  isComplete: boolean;
}

export type GateBasis = 'accuracy' | 'wilson-lower-bound';

export interface PassGateDefinition {
  id: string;
  categories: readonly string[];
  /** Required proportion correct, from 0 to 1. */
  threshold: number;
  /** Practice evidence required before returning a meets/below result. */
  minimumSamples: number;
  /** Defaults to the conservative Wilson lower bound. */
  basis?: GateBasis;
}

export type PassGateStatus =
  | 'insufficient-evidence'
  | 'meets-gate'
  | 'below-gate';

export interface PassGateResult {
  id: string;
  status: PassGateStatus;
  basis: GateBasis;
  threshold: number;
  evidenceValue: number | null;
  observedAccuracy: number | null;
  wilsonLowerBound: number;
  sampleCount: number;
  minimumSamples: number;
  samplesStillNeeded: number;
  reason: 'invalid-definition' | 'not-enough-samples' | 'evaluated';
  /** Gate results estimate practice performance and are not official results. */
  isEstimate: true;
}

export interface ReadinessRequirement {
  category: string;
  weight: number;
  /** Full evidence credit is reached at this sample count. Defaults to 30. */
  minimumSamples?: number;
  /** Optional comparison target; it does not inflate the index. */
  targetAccuracy?: number;
}

export interface ReadinessComponent {
  category: string;
  weight: number;
  sampleCount: number;
  evidenceFactor: number;
  freshnessFactor: number;
  conservativeAccuracy: number;
  targetAccuracy: number | null;
  conservativeTargetMargin: number | null;
  index: number;
}

export type ReadinessBand =
  | 'insufficient-evidence'
  | 'building'
  | 'progressing'
  | 'competitive'
  | 'strong';

export interface ReadinessResult {
  /** Conservative weighted index from 0 to 100. */
  index: number;
  band: ReadinessBand;
  /** Weighted proportion of the requested minimum sample evidence, from 0 to 1. */
  evidenceCoverage: number;
  components: ReadinessComponent[];
  validRequirementCount: number;
  excludedCategories: string[];
  notice: string;
}

export const PERFORMANCE_ESTIMATE_NOTICE =
  'This readiness estimate is based on practice evidence; it is not a guarantee of passing or selection.';

const DAY_MS = 86_400_000;
const DEFAULT_Z = 1.96;
const DEFAULT_RECENCY_HALF_LIFE_DAYS = 30;
const DEFAULT_TREND_MINIMUM = 5;
const DEFAULT_TREND_STABLE_THRESHOLD = 0.03;
const DEFAULT_READINESS_MINIMUM = 30;
const MINIMUM_FRESHNESS_FACTOR = 0.7;

interface NormalizedAttempt {
  category: string;
  correct: number;
  total: number;
  completedTimestamp: number | null;
  durationSeconds: number | null;
  targetDurationSeconds: number | null;
  confidence: number | null;
  originalIndex: number;
}

/** Wilson score interval lower bound for a binomial proportion. */
export function wilsonLowerBound(successes: number, trials: number, z = DEFAULT_Z): number {
  if (!Number.isFinite(trials) || trials <= 0 || !Number.isFinite(successes)) return 0;

  const safeZ = Number.isFinite(z) && z > 0 ? z : DEFAULT_Z;
  const boundedSuccesses = clamp(successes, 0, trials);
  const proportion = boundedSuccesses / trials;
  const zSquared = safeZ * safeZ;
  const denominator = 1 + zSquared / trials;
  const centre = proportion + zSquared / (2 * trials);
  const margin =
    safeZ *
    Math.sqrt((proportion * (1 - proportion) + zSquared / (4 * trials)) / trials);

  return clamp((centre - margin) / denominator, 0, 1);
}

/** Builds one conservative summary per valid category, sorted by category key. */
export function calculateCategoryMetrics(
  attempts: readonly ScoredAttempt[],
  options: PerformanceOptions = {}
): CategoryMetrics[] {
  const grouped = new Map<string, NormalizedAttempt[]>();

  attempts.forEach((attempt, index) => {
    const normalized = normalizeAttempt(attempt, index);
    if (!normalized) return;
    const current = grouped.get(normalized.category) ?? [];
    current.push(normalized);
    grouped.set(normalized.category, current);
  });

  return [...grouped.entries()]
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([category, categoryAttempts]) => summarizeNormalized(category, categoryAttempts, options));
}

/** Summarizes one category; attempts from other categories are ignored. */
export function summarizeCategory(
  category: string,
  attempts: readonly ScoredAttempt[],
  options: PerformanceOptions = {}
): CategoryMetrics {
  const normalizedCategory = typeof category === 'string' ? category.trim() : '';
  const normalized = attempts
    .map((attempt, index) => normalizeAttempt(attempt, index))
    .filter((attempt): attempt is NormalizedAttempt =>
      Boolean(attempt && attempt.category === normalizedCategory)
    );

  return summarizeNormalized(normalizedCategory, normalized, options);
}

/** Calculates proper binary Brier scoring for attempts with confidence values. */
export function calculateCalibration(
  attempts: readonly ScoredAttempt[]
): CalibrationMetrics | null {
  const normalized = attempts
    .map((attempt, index) => normalizeAttempt(attempt, index))
    .filter((attempt): attempt is NormalizedAttempt => Boolean(attempt));
  return calibrationFor(normalized);
}

/**
 * Calculates a weighted result. Weights may be supplied as fractions, points,
 * or percentages because the final percentage is normalized by their sum.
 */
export function calculateWeightedScore(
  components: readonly WeightedScoreComponent[]
): WeightedScoreResult {
  const valid: WeightedComponentResult[] = [];
  const excludedComponentIds: string[] = [];

  components.forEach((component, index) => {
    const fallbackId = `component-${index + 1}`;
    const id = typeof component.id === 'string' && component.id.trim() ? component.id : fallbackId;
    const isValid =
      Number.isFinite(component.score) &&
      Number.isFinite(component.maximum) &&
      component.maximum > 0 &&
      Number.isFinite(component.weight) &&
      component.weight > 0;

    if (!isValid) {
      excludedComponentIds.push(id);
      return;
    }

    const boundedScore = clamp(component.score, 0, component.maximum);
    const normalizedScore = boundedScore / component.maximum;
    valid.push({
      id,
      score: boundedScore,
      maximum: component.maximum,
      weight: component.weight,
      normalizedScore,
      weightedPoints: normalizedScore * component.weight,
      wasClamped: boundedScore !== component.score
    });
  });

  const weightedPoints = sum(valid.map((component) => component.weightedPoints));
  const maximumWeightedPoints = sum(valid.map((component) => component.weight));

  return {
    components: valid,
    weightedPoints,
    maximumWeightedPoints,
    percentage:
      maximumWeightedPoints > 0 ? clamp((weightedPoints / maximumWeightedPoints) * 100, 0, 100) : 0,
    validComponentCount: valid.length,
    excludedComponentIds,
    isComplete: components.length > 0 && valid.length === components.length
  };
}

/** Evaluates a practice-evidence pass gate across one or more categories. */
export function evaluatePassGate(
  attempts: readonly ScoredAttempt[],
  gate: PassGateDefinition,
  options: Pick<PerformanceOptions, 'wilsonZ'> = {}
): PassGateResult {
  const basis: GateBasis = gate.basis ?? 'wilson-lower-bound';
  const categories = new Set(
    Array.isArray(gate.categories)
      ? gate.categories.filter((category) => typeof category === 'string' && category.trim())
      : []
  );
  const definitionIsValid =
    typeof gate.id === 'string' &&
    categories.size > 0 &&
    Number.isFinite(gate.threshold) &&
    gate.threshold >= 0 &&
    gate.threshold <= 1 &&
    Number.isInteger(gate.minimumSamples) &&
    gate.minimumSamples > 0 &&
    (basis === 'accuracy' || basis === 'wilson-lower-bound');

  const eligible = attempts
    .map((attempt, index) => normalizeAttempt(attempt, index))
    .filter(
      (attempt): attempt is NormalizedAttempt =>
        Boolean(attempt && categories.has(attempt.category))
    );
  const correct = sum(eligible.map((attempt) => attempt.correct));
  const total = sum(eligible.map((attempt) => attempt.total));
  const accuracy = total > 0 ? correct / total : null;
  const lowerBound = wilsonLowerBound(correct, total, options.wilsonZ);

  if (!definitionIsValid) {
    return {
      id: typeof gate.id === 'string' ? gate.id : '',
      status: 'insufficient-evidence',
      basis,
      threshold: Number.isFinite(gate.threshold) ? gate.threshold : 0,
      evidenceValue: null,
      observedAccuracy: accuracy,
      wilsonLowerBound: lowerBound,
      sampleCount: total,
      minimumSamples: Number.isInteger(gate.minimumSamples) && gate.minimumSamples > 0
        ? gate.minimumSamples
        : 0,
      samplesStillNeeded: 0,
      reason: 'invalid-definition',
      isEstimate: true
    };
  }

  const samplesStillNeeded = Math.max(0, gate.minimumSamples - total);
  if (samplesStillNeeded > 0) {
    return {
      id: gate.id,
      status: 'insufficient-evidence',
      basis,
      threshold: gate.threshold,
      evidenceValue: null,
      observedAccuracy: accuracy,
      wilsonLowerBound: lowerBound,
      sampleCount: total,
      minimumSamples: gate.minimumSamples,
      samplesStillNeeded,
      reason: 'not-enough-samples',
      isEstimate: true
    };
  }

  const evidenceValue = basis === 'accuracy' ? (accuracy ?? 0) : lowerBound;
  return {
    id: gate.id,
    status: evidenceValue >= gate.threshold ? 'meets-gate' : 'below-gate',
    basis,
    threshold: gate.threshold,
    evidenceValue,
    observedAccuracy: accuracy,
    wilsonLowerBound: lowerBound,
    sampleCount: total,
    minimumSamples: gate.minimumSamples,
    samplesStillNeeded: 0,
    reason: 'evaluated',
    isEstimate: true
  };
}

/**
 * Produces a conservative readiness index. Wilson accuracy is multiplied by a
 * linear evidence factor, so a perfect result from one or two questions cannot
 * produce a high index. Missing required categories contribute zero.
 */
export function calculateReadinessIndex(
  metrics: readonly CategoryMetrics[],
  requirements: readonly ReadinessRequirement[]
): ReadinessResult {
  const metricsByCategory = new Map(metrics.map((metric) => [metric.category, metric]));
  const validRequirements: Array<Required<Pick<ReadinessRequirement, 'category' | 'weight' | 'minimumSamples'>> & {
    targetAccuracy: number | null;
  }> = [];
  const excludedCategories: string[] = [];

  requirements.forEach((requirement, index) => {
    const category =
      typeof requirement.category === 'string' && requirement.category.trim()
        ? requirement.category.trim()
        : `requirement-${index + 1}`;
    const minimumSamples = requirement.minimumSamples ?? DEFAULT_READINESS_MINIMUM;
    const valid =
      typeof requirement.category === 'string' &&
      Boolean(requirement.category.trim()) &&
      Number.isFinite(requirement.weight) &&
      requirement.weight > 0 &&
      Number.isInteger(minimumSamples) &&
      minimumSamples > 0;

    if (!valid) {
      excludedCategories.push(category);
      return;
    }

    const targetAccuracy =
      requirement.targetAccuracy !== undefined &&
      Number.isFinite(requirement.targetAccuracy) &&
      requirement.targetAccuracy >= 0 &&
      requirement.targetAccuracy <= 1
        ? requirement.targetAccuracy
        : null;

    validRequirements.push({
      category,
      weight: requirement.weight,
      minimumSamples,
      targetAccuracy
    });
  });

  const components: ReadinessComponent[] = validRequirements.map((requirement) => {
    const metric = metricsByCategory.get(requirement.category);
    const sampleCount = metric?.sampleCount ?? 0;
    const evidenceFactor = clamp(sampleCount / requirement.minimumSamples, 0, 1);
    const conservativeAccuracy = clamp(metric?.wilsonLowerBound ?? 0, 0, 1);
    const freshnessFactor =
      metric?.recencyScore === null || metric?.recencyScore === undefined
        ? 1
        : MINIMUM_FRESHNESS_FACTOR +
          (1 - MINIMUM_FRESHNESS_FACTOR) * clamp(metric.recencyScore, 0, 1);
    const componentIndex =
      conservativeAccuracy * evidenceFactor * freshnessFactor * 100;

    return {
      category: requirement.category,
      weight: requirement.weight,
      sampleCount,
      evidenceFactor,
      freshnessFactor,
      conservativeAccuracy,
      targetAccuracy: requirement.targetAccuracy,
      conservativeTargetMargin:
        requirement.targetAccuracy === null
          ? null
          : conservativeAccuracy - requirement.targetAccuracy,
      index: componentIndex
    };
  });

  const totalWeight = sum(components.map((component) => component.weight));
  const index =
    totalWeight > 0
      ? sum(components.map((component) => component.index * component.weight)) / totalWeight
      : 0;
  const evidenceCoverage =
    totalWeight > 0
      ? sum(components.map((component) => component.evidenceFactor * component.weight)) /
        totalWeight
      : 0;

  return {
    index: clamp(index, 0, 100),
    band: readinessBand(index, evidenceCoverage),
    evidenceCoverage: clamp(evidenceCoverage, 0, 1),
    components,
    validRequirementCount: validRequirements.length,
    excludedCategories,
    notice: PERFORMANCE_ESTIMATE_NOTICE
  };
}

function summarizeNormalized(
  category: string,
  attempts: readonly NormalizedAttempt[],
  options: PerformanceOptions
): CategoryMetrics {
  const correctCount = sum(attempts.map((attempt) => attempt.correct));
  const sampleCount = sum(attempts.map((attempt) => attempt.total));
  const accuracy = sampleCount > 0 ? correctCount / sampleCount : null;
  const dated = attempts.filter((attempt) => attempt.completedTimestamp !== null);
  const latestTimestamp = dated.reduce<number | null>((latest, attempt) => {
    const timestamp = attempt.completedTimestamp as number;
    return latest === null || timestamp > latest ? timestamp : latest;
  }, null);
  const nowTimestamp = parseTimestamp(options.now);
  const halfLife = positiveFinite(options.recencyHalfLifeDays)
    ? (options.recencyHalfLifeDays as number)
    : DEFAULT_RECENCY_HALF_LIFE_DAYS;
  const daysSinceLastAttempt =
    latestTimestamp !== null && nowTimestamp !== null
      ? Math.max(0, (nowTimestamp - latestTimestamp) / DAY_MS)
      : null;
  const recencyScore =
    daysSinceLastAttempt === null ? null : Math.pow(0.5, daysSinceLastAttempt / halfLife);

  const timed = attempts.filter(
    (attempt) => attempt.durationSeconds !== null && attempt.targetDurationSeconds !== null
  );
  const totalDuration = sum(timed.map((attempt) => attempt.durationSeconds as number));
  const totalTargetDuration = sum(
    timed.map((attempt) => attempt.targetDurationSeconds as number)
  );
  const timedSampleCount = sum(timed.map((attempt) => attempt.total));
  const onPaceSamples = sum(
    timed
      .filter(
        (attempt) =>
          (attempt.durationSeconds as number) <= (attempt.targetDurationSeconds as number)
      )
      .map((attempt) => attempt.total)
  );

  return {
    category,
    sampleCount,
    attemptCount: attempts.length,
    correctCount,
    accuracy,
    wilsonLowerBound: wilsonLowerBound(correctCount, sampleCount, options.wilsonZ),
    latestAttemptAt:
      latestTimestamp === null ? null : new Date(latestTimestamp).toISOString(),
    daysSinceLastAttempt,
    recencyScore,
    paceRatio: totalTargetDuration > 0 ? totalDuration / totalTargetDuration : null,
    timedAttemptCount: timed.length,
    timedSampleCount,
    averageSecondsPerItem: timedSampleCount > 0 ? totalDuration / timedSampleCount : null,
    onPaceRate: timedSampleCount > 0 ? onPaceSamples / timedSampleCount : null,
    trend: trendFor(dated, options),
    calibration: calibrationFor(attempts)
  };
}

function trendFor(
  datedAttempts: readonly NormalizedAttempt[],
  options: PerformanceOptions
): TrendMetrics {
  const ordered = [...datedAttempts].sort((left, right) => {
    const timestampDifference =
      (left.completedTimestamp as number) - (right.completedTimestamp as number);
    return timestampDifference || left.originalIndex - right.originalIndex;
  });
  const splitAt = Math.floor(ordered.length / 2);
  const previous = ordered.slice(0, splitAt);
  const recent = ordered.slice(splitAt);
  const previousSamples = sum(previous.map((attempt) => attempt.total));
  const recentSamples = sum(recent.map((attempt) => attempt.total));
  const minimum =
    Number.isInteger(options.trendMinimumItemsPerWindow) &&
    (options.trendMinimumItemsPerWindow as number) > 0
      ? (options.trendMinimumItemsPerWindow as number)
      : DEFAULT_TREND_MINIMUM;

  if (previousSamples < minimum || recentSamples < minimum) {
    return {
      direction: 'insufficient-evidence',
      change: null,
      previousAccuracy: previousSamples > 0
        ? sum(previous.map((attempt) => attempt.correct)) / previousSamples
        : null,
      recentAccuracy: recentSamples > 0
        ? sum(recent.map((attempt) => attempt.correct)) / recentSamples
        : null,
      previousSampleCount: previousSamples,
      recentSampleCount: recentSamples
    };
  }

  const previousAccuracy = sum(previous.map((attempt) => attempt.correct)) / previousSamples;
  const recentAccuracy = sum(recent.map((attempt) => attempt.correct)) / recentSamples;
  const change = recentAccuracy - previousAccuracy;
  const stableThreshold =
    Number.isFinite(options.trendStableThreshold) &&
    (options.trendStableThreshold as number) >= 0
      ? (options.trendStableThreshold as number)
      : DEFAULT_TREND_STABLE_THRESHOLD;
  const direction: TrendDirection =
    change > stableThreshold
      ? 'improving'
      : change < -stableThreshold
        ? 'declining'
        : 'stable';

  return {
    direction,
    change,
    previousAccuracy,
    recentAccuracy,
    previousSampleCount: previousSamples,
    recentSampleCount: recentSamples
  };
}

function calibrationFor(attempts: readonly NormalizedAttempt[]): CalibrationMetrics | null {
  const calibrated = attempts.filter((attempt) => attempt.confidence !== null);
  if (!calibrated.length) return null;

  const sampleCount = sum(calibrated.map((attempt) => attempt.total));
  const correct = sum(calibrated.map((attempt) => attempt.correct));
  const confidenceSum = sum(
    calibrated.map((attempt) => (attempt.confidence as number) * attempt.total)
  );
  const brierTotal = sum(
    calibrated.map((attempt) => {
      const confidence = attempt.confidence as number;
      return (
        attempt.correct * (1 - confidence) ** 2 +
        (attempt.total - attempt.correct) * confidence ** 2
      );
    })
  );
  const meanConfidence = confidenceSum / sampleCount;
  const observedAccuracy = correct / sampleCount;
  const calibrationGap = meanConfidence - observedAccuracy;

  return {
    sampleCount,
    attemptCount: calibrated.length,
    brierScore: brierTotal / sampleCount,
    meanConfidence,
    observedAccuracy,
    calibrationGap,
    absoluteCalibrationGap: Math.abs(calibrationGap)
  };
}

function normalizeAttempt(attempt: ScoredAttempt, originalIndex: number): NormalizedAttempt | null {
  if (!attempt || typeof attempt.category !== 'string') return null;
  const category = attempt.category.trim();
  const validScore =
    category.length > 0 &&
    Number.isInteger(attempt.total) &&
    attempt.total > 0 &&
    Number.isInteger(attempt.correct) &&
    attempt.correct >= 0 &&
    attempt.correct <= attempt.total;
  if (!validScore) return null;

  return {
    category,
    correct: attempt.correct,
    total: attempt.total,
    completedTimestamp: parseTimestamp(attempt.completedAt),
    durationSeconds: positiveFinite(attempt.durationSeconds)
      ? (attempt.durationSeconds as number)
      : null,
    targetDurationSeconds: positiveFinite(attempt.targetDurationSeconds)
      ? (attempt.targetDurationSeconds as number)
      : null,
    confidence:
      Number.isFinite(attempt.confidence) &&
      (attempt.confidence as number) >= 0 &&
      (attempt.confidence as number) <= 1
        ? (attempt.confidence as number)
        : null,
    originalIndex
  };
}

function parseTimestamp(input: DateInput | undefined): number | null {
  if (input === undefined) return null;
  const timestamp = input instanceof Date ? input.getTime() : new Date(input).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function readinessBand(index: number, evidenceCoverage: number): ReadinessBand {
  if (evidenceCoverage < 0.6) return 'insufficient-evidence';
  if (index < 50) return 'building';
  if (index < 70) return 'progressing';
  if (index < 85) return 'competitive';
  return 'strong';
}

function positiveFinite(value: number | undefined): boolean {
  return Number.isFinite(value) && (value as number) > 0;
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
