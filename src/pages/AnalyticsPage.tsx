import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  ExternalLink,
  Gauge,
  Info,
  Scale,
  ShieldCheck,
  Target
} from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import {
  ASSESSMENT_INTERPRETATION_BOUNDARY,
  ASSESSMENT_SOURCES,
  OFFICIAL_RANKING_RULES,
  OFFICIAL_TEST_FORMATS
} from '../data/assessmentFramework';
import { buildCoachingSnapshot, coachingTarget, labelCategory } from '../lib/coaching';
import {
  PERFORMANCE_ESTIMATE_NOTICE,
  calculateWeightedScore,
  type CategoryMetrics,
  type WeightedScoreResult
} from '../lib/performance';
import { useAppState } from '../state/AppState';

type ScoringStage = 'preliminary' | 'final';

interface Projection {
  stage: ScoringStage;
  observed: WeightedScoreResult;
  conservative: WeightedScoreResult;
  coverageWeight: number;
  components: Array<{
    id: string;
    name: string;
    weight: number;
    metric?: CategoryMetrics;
  }>;
}

export function AnalyticsPage() {
  const { state } = useAppState();
  const snapshot = useMemo(() => buildCoachingSnapshot(state), [state]);
  const preliminary = useMemo(
    () => buildProjection('preliminary', snapshot.metrics),
    [snapshot.metrics]
  );
  const final = useMemo(() => buildProjection('final', snapshot.metrics), [snapshot.metrics]);
  const scoringSource = ASSESSMENT_SOURCES.find((source) => source.id === 'assessment-overview');

  return (
    <div className="page analytics-page">
      <PageHeader
        eyebrow="PERFORMANCE ANALYTICS"
        title="Know what the evidence really says"
        description="Accuracy is shown beside sample size, a conservative 95% Wilson lower bound, pace, trend and confidence calibration so a flattering small sample cannot masquerade as mastery."
        actions={
          <Link className="button secondary" to="/coach">
            Coach view <ArrowRight size={17} />
          </Link>
        }
      />

      <section className="analytics-summary" aria-label="Evidence summary">
        <article className="card analytics-summary-card">
          <Gauge size={22} />
          <div>
            <strong>{Math.round(snapshot.readiness.index)}%</strong>
            <span>conservative readiness index</span>
          </div>
          <small>{formatBand(snapshot.readiness.band)}</small>
        </article>
        <article className="card analytics-summary-card">
          <ShieldCheck size={22} />
          <div>
            <strong>{Math.round(snapshot.readiness.evidenceCoverage * 100)}%</strong>
            <span>minimum evidence coverage</span>
          </div>
          <small>Across six app components</small>
        </article>
        <article className="card analytics-summary-card">
          <Activity size={22} />
          <div>
            <strong>{snapshot.metrics.reduce((sum, metric) => sum + metric.sampleCount, 0)}</strong>
            <span>scored evidence units</span>
          </div>
          <small>{snapshot.metrics.reduce((sum, metric) => sum + metric.attemptCount, 0)} category attempts</small>
        </article>
        <article className="card analytics-summary-card">
          <AlertTriangle size={22} />
          <div>
            <strong>{snapshot.unresolvedMistakes}</strong>
            <span>open error records</span>
          </div>
          <small>{snapshot.dueMistakes} due now</small>
        </article>
      </section>

      <section className="card analytics-detail" aria-labelledby="category-analysis-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">CATEGORY DIAGNOSTICS</p>
            <h2 id="category-analysis-title">Accuracy, certainty and speed</h2>
            <p>Empty cells mean the app has no valid, scored evidence for that measure yet.</p>
          </div>
        </div>
        <div className="table-scroll">
          <table className="source-table analytics-table">
            <caption className="sr-only">Performance diagnostics by EPSO test category</caption>
            <thead>
              <tr>
                <th scope="col">Test</th>
                <th scope="col">Evidence</th>
                <th scope="col">Observed</th>
                <th scope="col"><abbr title="95% Wilson score interval lower bound">Conservative</abbr></th>
                <th scope="col">Pace</th>
                <th scope="col">Trend</th>
                <th scope="col">Confidence calibration</th>
              </tr>
            </thead>
            <tbody>
              {OFFICIAL_TEST_FORMATS.map((format) => {
                const metric = snapshot.metrics.find((item) => item.category === format.id);
                const target = coachingTarget(format.id);
                return (
                  <tr key={format.id}>
                    <th scope="row">
                      <span className={`source-status phase-${format.phase}`} aria-hidden="true" />
                      <span>
                        <strong>{format.name}</strong>
                        <small>
                          Phase {format.phase} · {describePassRule(format.passRule)}
                        </small>
                      </span>
                    </th>
                    <td>
                      {metric ? (
                        <>
                          <strong>{metric.sampleCount} units</strong>
                          <small>{metric.attemptCount} attempt{metric.attemptCount === 1 ? '' : 's'}</small>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <strong>{formatPercent(metric?.accuracy)}</strong>
                      <small>{target?.targetLabel ?? 'No coaching target'}</small>
                    </td>
                    <td>
                      {format.id === 'eufte' ? (
                        <>
                          <strong>Self-check only</strong>
                          <small>Not an EPSO mark</small>
                        </>
                      ) : metric?.sampleCount ? (
                        <>
                          <strong>{formatPercent(metric.wilsonLowerBound)}</strong>
                          <small>Penalises small samples</small>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{formatPace(metric)}</td>
                    <td>{formatTrend(metric)}</td>
                    <td>{formatCalibration(metric)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="analytics-table-notes">
          <p><strong>Evidence unit:</strong> one scored multiple-choice item. EUFTE uses the app’s ten-point anchor self-check only.</p>
          <p><strong>Pace ratio:</strong> elapsed time divided by the sourced or official allowance; 100% is exactly on allowance.</p>
          <p><strong>Calibration:</strong> confidence minus observed accuracy. A positive gap means overconfidence.</p>
        </div>
      </section>

      <section className="projection-section" aria-labelledby="projection-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">WEIGHTED-SCORE SANDBOX</p>
            <h2 id="projection-title">Practice projection under official weights</h2>
            <p>
              The weights are official. The inputs are your practice results, so the outputs are not
              EPSO marks or qualifying scores.
            </p>
          </div>
          {scoringSource && (
            <a className="source-badge" href={scoringSource.url} target="_blank" rel="noreferrer">
              <span>Verify official scoring</span>
              <ExternalLink size={13} />
            </a>
          )}
        </div>
        <div className="projection-grid">
          <ProjectionCard projection={preliminary} />
          <ProjectionCard projection={final} />
        </div>
        <div className="projection-exclusions">
          <Info size={19} />
          <p>
            Numerical and abstract reasoning must clear their official combined gate but carry no
            preliminary or final ranking weight. EUFTE carries 15% only in final ranking. Missing
            categories are excluded—not silently treated as zero—and coverage is shown on every card.
          </p>
        </div>
      </section>

      <section className="analytics-method-grid" aria-labelledby="method-title">
        <h2 id="method-title" className="sr-only">How to interpret the analytics</h2>
        <article className="card method-card">
          <ShieldCheck size={22} />
          <h3>Official facts</h3>
          <p>Formats, pass marks, language allocation and ranking weights come from the cited EPSO notice and guidance.</p>
        </article>
        <article className="card method-card">
          <Target size={22} />
          <h3>Coaching heuristics</h3>
          <p>The 80% targets, evidence minimums, Wilson checks and readiness bands are app rules designed to create margin.</p>
        </article>
        <article className="card method-card">
          <Scale size={22} />
          <h3>No published competitive cut-off</h3>
          <p>
            EPSO has not published a fixed preliminary or final competitive cut-off. Ranking depends
            on the eligible cohort; {OFFICIAL_RANKING_RULES.successfulCandidatesSought.toLocaleString()} successful candidates are sought.
          </p>
        </article>
      </section>

      <aside className="coach-boundary" aria-label="Analytics interpretation warning">
        <BarChart3 size={22} />
        <div>
          <strong>{PERFORMANCE_ESTIMATE_NOTICE}</strong>
          <p>{ASSESSMENT_INTERPRETATION_BOUNDARY.unknownCompetitiveCutOff}</p>
        </div>
      </aside>
    </div>
  );
}

function ProjectionCard({ projection }: { projection: Projection }) {
  const hasEvidence = projection.observed.validComponentCount > 0;
  const title = projection.stage === 'preliminary' ? 'Preliminary ranking' : 'Final ranking';
  const complete = projection.coverageWeight === 100;

  return (
    <article className="card projection-card">
      <header>
        <div>
          <p className="eyebrow">{projection.stage.toUpperCase()} SCORING</p>
          <h3>{title}</h3>
        </div>
        <span className={complete ? 'projection-complete' : 'projection-partial'}>
          {complete ? 'All weighted areas covered' : 'Partial evidence'}
        </span>
      </header>
      <dl className="projection-summary">
        <div>
          <dt>Observed mean</dt>
          <dd>{hasEvidence ? `${projection.observed.percentage.toFixed(1)}%` : '—'}</dd>
        </div>
        <div>
          <dt>Conservative mean</dt>
          <dd>{hasEvidence ? `${projection.conservative.percentage.toFixed(1)}%` : '—'}</dd>
        </div>
        <div>
          <dt>Official weight represented</dt>
          <dd>{projection.coverageWeight}/100</dd>
        </div>
      </dl>
      <div className="projection-components">
        {projection.components.map((component) => {
          const contribution = component.metric?.accuracy === null || component.metric?.accuracy === undefined
            ? null
            : component.metric.accuracy * component.weight;
          return (
            <div key={component.id}>
              <span>
                <strong>{component.name}</strong>
                <small>{component.weight}% official weight</small>
              </span>
              <span>{contribution === null ? 'No evidence' : `${contribution.toFixed(1)} / ${component.weight}`}</span>
            </div>
          );
        })}
      </div>
      <footer>
        <strong>
          {hasEvidence
            ? `${projection.observed.weightedPoints.toFixed(1)} / ${projection.coverageWeight} covered weight points`
            : 'Complete scored practice to calculate a projection'}
        </strong>
        <small>
          {complete
            ? 'Coverage is complete; representativeness still is not guaranteed.'
            : 'The percentage is normalised across covered components only.'}
        </small>
      </footer>
    </article>
  );
}

function buildProjection(stage: ScoringStage, metrics: readonly CategoryMetrics[]): Projection {
  const components = OFFICIAL_TEST_FORMATS.map((format) => ({
    id: format.id,
    name: format.name,
    weight: stage === 'preliminary' ? format.preliminaryWeightPercent : format.finalWeightPercent,
    metric: metrics.find((candidate) => candidate.category === format.id)
  })).filter((component) => component.weight > 0);

  const weightedInput = components.map((component) => ({
    id: component.id,
    score: component.metric?.accuracy === null || component.metric?.accuracy === undefined
      ? Number.NaN
      : component.metric.accuracy * 100,
    maximum: 100,
    weight: component.weight
  }));
  const conservativeInput = components.map((component) => ({
    id: component.id,
    score: component.metric?.sampleCount ? component.metric.wilsonLowerBound * 100 : Number.NaN,
    maximum: 100,
    weight: component.weight
  }));
  const coverageWeight = components.reduce(
    (sum, component) => sum + (component.metric?.accuracy === null || component.metric?.accuracy === undefined ? 0 : component.weight),
    0
  );

  return {
    stage,
    observed: calculateWeightedScore(weightedInput),
    conservative: calculateWeightedScore(conservativeInput),
    coverageWeight,
    components
  };
}

function formatPace(metric: CategoryMetrics | undefined) {
  if (!metric || metric.paceRatio === null) return '—';
  const onPace = metric.paceRatio <= 1;
  return (
    <>
      <strong>{Math.round(metric.paceRatio * 100)}% of allowance</strong>
      <small>
        {onPace ? 'On pace' : 'Over allowance'}
        {metric.onPaceRate === null ? '' : ` · ${Math.round(metric.onPaceRate * 100)}% attempts on pace`}
      </small>
    </>
  );
}

function formatTrend(metric: CategoryMetrics | undefined) {
  if (!metric || metric.trend.direction === 'insufficient-evidence') return 'More evidence needed';
  const change = metric.trend.change ?? 0;
  const sign = change > 0 ? '+' : '';
  return (
    <>
      <strong className={`trend-${metric.trend.direction}`}>{formatBand(metric.trend.direction)}</strong>
      <small>{sign}{Math.round(change * 100)} percentage points</small>
    </>
  );
}

function formatCalibration(metric: CategoryMetrics | undefined) {
  if (!metric?.calibration) return 'Confidence not logged';
  const gap = metric.calibration.calibrationGap;
  const interpretation = Math.abs(gap) < 0.05
    ? 'Well aligned'
    : gap > 0
      ? 'Overconfident'
      : 'Underconfident';
  return (
    <>
      <strong>{interpretation} ({gap > 0 ? '+' : ''}{Math.round(gap * 100)} pp)</strong>
      <small>
        Mean {Math.round(metric.calibration.meanConfidence * 100)}% · Brier {metric.calibration.brierScore.toFixed(2)} · n={metric.calibration.sampleCount}
      </small>
    </>
  );
}

function describePassRule(passRule: (typeof OFFICIAL_TEST_FORMATS)[number]['passRule']) {
  return passRule.mode === 'individual'
    ? `official pass ${passRule.display}`
    : `official combined pass ${passRule.minimumCombined}/${passRule.maximumCombined}`;
}

function formatPercent(value: number | null | undefined) {
  return value === null || value === undefined ? '—' : `${Math.round(value * 100)}%`;
}

function formatBand(value: string) {
  return value.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}
