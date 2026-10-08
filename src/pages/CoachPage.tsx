import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Circle,
  ExternalLink,
  Gauge,
  ShieldCheck,
  Target,
  TimerReset
} from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Part1RolloutPanel } from '../components/Part1RolloutPanel';
import {
  ASSESSMENT_INTERPRETATION_BOUNDARY,
  ASSESSMENT_SOURCES,
  OFFICIAL_LANGUAGE_RULES,
  OFFICIAL_ONLINE_TESTING_SETUP,
  OFFICIAL_OPERATIONAL_RULES,
  OFFICIAL_TEST_FORMATS,
  OFFICIAL_TIMELINE,
  type AssessmentSourceId
} from '../data/assessmentFramework';
import {
  READINESS_REQUIREMENTS,
  buildCoachingSnapshot,
  coachingTarget,
  labelCategory
} from '../lib/coaching';
import {
  PREREQUISITE_CHECKLIST_ID,
  isChecklistItemApplicable,
  type Part1RolloutStatus
} from '../lib/part1Rollout';
import { useAppState } from '../state/AppState';

interface OperationItem {
  id: string;
  title: string;
  detail: string;
  evidenceLabel: string;
  sourceId: AssessmentSourceId;
  sourceLocator: string;
  /** Shown instead of a checkbox until EPSO has made the item actionable. */
  lockedReason?: string;
}

function operationItems(part1: Part1RolloutStatus): OperationItem[] {
  const deadline = OFFICIAL_TIMELINE.supportingDocumentsDeadline;
  return [
    {
      id: 'supporting-documents',
      title: 'Supporting documents uploaded and checked',
      detail: part1.supportingDocumentsDeadlinePassed
        ? `The deadline passed on ${deadline.display}. Confirm your account shows each document attached to the right field; if anything is missing, contact EPSO without delay.`
        : `Complete by ${deadline.display}. Re-open the files once to verify they are readable and correctly attached.`,
      evidenceLabel: 'Official deadline + coaching verification step',
      sourceId: 'original-notice',
      sourceLocator: deadline.sourceLocator
    },
    {
      id: 'portal-routine',
      title: 'Single Candidate Portal checked at least every three calendar days',
      detail: 'Your Part 1 invitation and the steps to your exact slot arrive there. Confirm only when this is an active routine; a one-off visit does not satisfy the official communication rule.',
      evidenceLabel: 'Official candidate communication rule + roll-out update',
      sourceId: 'original-notice',
      sourceLocator: OFFICIAL_OPERATIONAL_RULES.sourceLocator
    },
    {
      id: 'email-current',
      title: 'Email address linked to the EPSO account is current',
      detail: 'Confirm after checking the address saved in the account and that you can receive messages there.',
      evidenceLabel: 'Official candidate communication rule',
      sourceId: 'original-notice',
      sourceLocator: OFFICIAL_OPERATIONAL_RULES.sourceLocator
    },
    {
      id: 'tao-public-session',
      title: 'Public TAO session tried on your test computer',
      detail: `${OFFICIAL_ONLINE_TESTING_SETUP.publicSessions} Learn the navigation and on-screen tools before your own prerequisite check.`,
      evidenceLabel: 'Official optional practice + coaching step',
      sourceId: 'online-testing-instructions',
      sourceLocator: 'TAO instructions: public sessions'
    },
    {
      id: 'test-environment',
      title: 'Computer, browser and room meet the TAO + Proctorio requirements',
      detail: `${OFFICIAL_ONLINE_TESTING_SETUP.platform}: ${OFFICIAL_ONLINE_TESTING_SETUP.requirements.join(' · ')}. ${OFFICIAL_ONLINE_TESTING_SETUP.firstTaoTestingEvidence}`,
      evidenceLabel: 'Official TAO instructions + coaching rehearsal',
      sourceId: 'online-testing-instructions',
      sourceLocator: OFFICIAL_ONLINE_TESTING_SETUP.sourceLocator
    },
    {
      id: 'language-and-id',
      title: 'Declared test languages and invitation identity instructions checked',
      detail: 'Confirm after matching language 1 and language 2 to your application and reviewing the identity requirements in your individual invitation.',
      evidenceLabel: 'Official language allocation + invitation check',
      sourceId: 'consolidated-notice',
      sourceLocator: OFFICIAL_LANGUAGE_RULES.sourceLocator
    },
    {
      id: PREREQUISITE_CHECKLIST_ID,
      title: 'Mandatory technical prerequisite check completed',
      detail: `${OFFICIAL_ONLINE_TESTING_SETUP.prerequisiteCheck} Run it on the exact computer, room and connection you will use on test day.`,
      evidenceLabel: 'Official requirement; the deadline is in your invitation',
      sourceId: 'online-testing-instructions',
      sourceLocator: 'TAO instructions: technical prerequisite check',
      ...(isChecklistItemApplicable(PREREQUISITE_CHECKLIST_ID, part1)
        ? {}
        : { lockedReason: 'Unlocks when you record your invitation or its prerequisite-check deadline above.' })
    }
  ];
}

const GATE_LABELS: Record<string, { title: string; officialRule: string }> = {
  verbal: { title: 'Verbal reasoning', officialRule: 'Official pass mark: 10/20' },
  'numerical-abstract': {
    title: 'Numerical + abstract',
    officialRule: 'Official combined pass mark: 10/20'
  },
  'eu-knowledge': { title: 'EU knowledge', officialRule: 'Official pass mark: 15/30' },
  'digital-skills': { title: 'Digital skills', officialRule: 'Official pass mark: 20/40' },
  eufte: { title: 'EUFTE writing', officialRule: 'Official pass mark: 5/10' }
};

export function CoachPage() {
  const { state, toggleChecklistItem } = useAppState();
  const snapshot = useMemo(() => buildCoachingSnapshot(state), [state]);
  const metricsByCategory = useMemo(
    () => new Map(snapshot.metrics.map((metric) => [metric.category, metric])),
    [snapshot.metrics]
  );

  return (
    <div className="page coach-page">
      <PageHeader
        eyebrow="EVIDENCE-AWARE COACH"
        title="Turn practice into the next right action"
        description="Readiness combines conservative accuracy, amount of evidence and recency. It is a planning signal—not an EPSO result, selection probability or guarantee."
        actions={
          <Link className="button secondary" to="/analytics">
            <BarChart3 size={17} /> Full analytics
          </Link>
        }
      />

      <section className="coach-overview" aria-labelledby="readiness-title">
        <article className="card readiness-card">
          <div className="readiness-copy">
            <p className="eyebrow">CONSERVATIVE READINESS SIGNAL</p>
            <h2 id="readiness-title">{Math.round(snapshot.readiness.index)}%</h2>
            <p className={`readiness-band band-${snapshot.readiness.band}`}>
              {formatBand(snapshot.readiness.band)}
            </p>
            <p>
              The index discounts small samples and stale practice. A high score on a handful of
              questions will therefore remain a low-confidence signal.
            </p>
          </div>
          <div className="readiness-evidence">
            <label htmlFor="readiness-index">Current readiness index</label>
            <progress id="readiness-index" max={100} value={snapshot.readiness.index}>
              {Math.round(snapshot.readiness.index)}%
            </progress>
            <div>
              <strong>{Math.round(snapshot.readiness.evidenceCoverage * 100)}%</strong>
              <span>minimum evidence coverage</span>
            </div>
          </div>
        </article>

        <div className="coach-signal-grid" aria-label="Current study signals">
          <SignalCard
            icon={<TimerReset size={20} />}
            value={snapshot.dueMistakes}
            label="mistakes due"
            href="/mistakes"
          />
          <SignalCard
            icon={<Target size={20} />}
            value={snapshot.dueCards}
            label="cards due"
            href="/review"
          />
          <SignalCard
            icon={<ShieldCheck size={20} />}
            value={`${snapshot.checklistComplete}/${snapshot.checklistTotal}`}
            label="operations checked"
            href="#operations"
          />
          <SignalCard
            icon={<Gauge size={20} />}
            value={snapshot.writingAverage === null ? '—' : `${Math.round(snapshot.writingAverage * 100)}%`}
            label="writing self-check"
            href="/writing"
          />
        </div>
      </section>

      <section className="card coach-actions" aria-labelledby="next-actions-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PRIORITISED TRAINING</p>
            <h2 id="next-actions-title">Do these next</h2>
          </div>
          <span className="mini-goal">Based on saved evidence</span>
        </div>
        <div className="coach-action-list">
          {snapshot.nextActions.length ? (
            snapshot.nextActions.map((action, index) => (
              <Link className="coach-action" to={action.href} key={action.id}>
                <span className="coach-action-rank">{String(index + 1).padStart(2, '0')}</span>
                <span className="coach-action-copy">
                  <strong>{action.title}</strong>
                  <small>{action.detail}</small>
                </span>
                <span className="coach-action-time">{action.minutes} min</span>
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            ))
          ) : (
            <Link className="coach-action" to="/practice">
              <span className="coach-action-rank">01</span>
              <span className="coach-action-copy">
                <strong>Keep the evidence current</strong>
                <small>Run a sourced, timed practice block and review every error.</small>
              </span>
              <span className="coach-action-time">20 min</span>
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          )}
        </div>
      </section>

      <section className="coach-category-section" aria-labelledby="category-readiness-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">OFFICIAL RULES VS COACHING TARGETS</p>
            <h2 id="category-readiness-title">Readiness by test</h2>
            <p>Official pass marks are rules. The 80% targets are deliberately demanding app heuristics.</p>
          </div>
        </div>
        <div className="coach-category-grid">
          {snapshot.readiness.components.map((component) => {
            const metric = metricsByCategory.get(component.category);
            const format = OFFICIAL_TEST_FORMATS.find((item) => item.id === component.category);
            const requirement = READINESS_REQUIREMENTS.find((item) => item.category === component.category);
            const target = format ? coachingTarget(format.id) : undefined;
            return (
              <article className="card coach-category-card" key={component.category}>
                <header>
                  <div>
                    <p className="eyebrow">PHASE {format?.phase ?? '—'}</p>
                    <h3>{labelCategory(component.category)}</h3>
                  </div>
                  <strong>{Math.round(component.index)}%</strong>
                </header>
                <progress max={100} value={component.index}>
                  {Math.round(component.index)}%
                </progress>
                <dl className="coach-category-facts">
                  <div>
                    <dt>Observed accuracy</dt>
                    <dd>{formatPercent(metric?.accuracy)}</dd>
                  </div>
                  <div>
                    <dt>Conservative lower bound</dt>
                    <dd>{metric?.sampleCount ? formatPercent(metric.wilsonLowerBound) : '—'}</dd>
                  </div>
                  <div>
                    <dt>Evidence</dt>
                    <dd>
                      {component.sampleCount}/{requirement?.minimumSamples ?? 0} items
                    </dd>
                  </div>
                </dl>
                <div className="rule-stack">
                  <p>
                    <span className="rule-label official">Official</span>
                    {format ? describePassRule(format.passRule) : 'No format found'}
                  </p>
                  <p>
                    <span className="rule-label coaching">Coaching only</span>
                    {target?.targetLabel ?? 'No coaching target'}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="card gate-card" aria-labelledby="gates-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PASS-GATE PRACTICE CHECK</p>
            <h2 id="gates-title">Would the evidence clear the fixed floors?</h2>
            <p>The answer uses practice evidence; the official test is scored independently by EPSO.</p>
          </div>
        </div>
        <div className="gate-list">
          {snapshot.gates.map((gate) => {
            const gateMeta = GATE_LABELS[gate.id];
            return (
              <article className={`gate-row gate-${gate.status}`} key={gate.id}>
                <GateIcon status={gate.status} />
                <div>
                  <h3>{gateMeta?.title ?? gate.id}</h3>
                  <p>{gateMeta?.officialRule}</p>
                </div>
                <div className="gate-evidence">
                  <strong>{gateStatusLabel(gate.status)}</strong>
                  <small>
                    {gate.status === 'insufficient-evidence'
                      ? `${gate.samplesStillNeeded} more scored item${gate.samplesStillNeeded === 1 ? '' : 's'} requested by the app`
                      : `${gate.basis === 'accuracy' ? 'Observed' : '95% Wilson lower bound'} ${formatPercent(gate.evidenceValue)}`}
                  </small>
                </div>
              </article>
            );
          })}
        </div>
        <p className="gate-method-note">
          “Meets” is intentionally conservative: most rows compare the 95% Wilson lower bound with
          the official 50% floor after an app-defined minimum sample. EUFTE uses coaching self-check
          evidence, not an official Selection Board mark.
        </p>
      </section>

      <Part1RolloutPanel status={snapshot.part1} />

      <section className="card operations-card" id="operations" aria-labelledby="operations-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">OPERATIONAL RISK CONTROL</p>
            <h2 id="operations-title">Competition checklist</h2>
            <p>Ticks are your own confirmation. Open the cited official source whenever the invitation or dates change.</p>
          </div>
          <strong className="checklist-count">
            {snapshot.checklistComplete}/{snapshot.checklistTotal}
          </strong>
        </div>
        <div className="operation-list">
          {operationItems(snapshot.part1).map((item) => {
            const checked = state.completedChecklistItems.includes(item.id);
            const source = ASSESSMENT_SOURCES.find((candidate) => candidate.id === item.sourceId);
            return (
              <article className={`operation-item ${checked ? 'complete' : ''} ${item.lockedReason ? 'locked' : ''}`} key={item.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={Boolean(item.lockedReason)}
                    onChange={() => toggleChecklistItem(item.id)}
                  />
                  <span className="operation-check" aria-hidden="true">
                    {checked ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  </span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.detail}</small>
                    <em>{item.evidenceLabel}</em>
                    <em>Official locator: {item.sourceLocator}</em>
                    {item.lockedReason && <em className="operation-locked">{item.lockedReason}</em>}
                  </span>
                </label>
                {source && (
                  <a href={source.url} target="_blank" rel="noreferrer" className="source-badge compact">
                    <span>{source.publisher}</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <aside className="coach-boundary" aria-label="Readiness interpretation warning">
        <AlertTriangle size={22} />
        <div>
          <strong>No score in this app can guarantee success.</strong>
          <p>{ASSESSMENT_INTERPRETATION_BOUNDARY.noGuarantee}</p>
        </div>
      </aside>
    </div>
  );
}

function SignalCard({
  icon,
  value,
  label,
  href
}: {
  icon: ReactNode;
  value: number | string;
  label: string;
  href: string;
}) {
  return (
    <Link className="card coach-signal" to={href}>
      <span>{icon}</span>
      <strong>{value}</strong>
      <small>{label}</small>
    </Link>
  );
}

function GateIcon({ status }: { status: 'insufficient-evidence' | 'meets-gate' | 'below-gate' }) {
  if (status === 'meets-gate') return <CheckCircle2 size={22} aria-hidden="true" />;
  if (status === 'below-gate') return <AlertTriangle size={22} aria-hidden="true" />;
  return <Gauge size={22} aria-hidden="true" />;
}

function gateStatusLabel(status: 'insufficient-evidence' | 'meets-gate' | 'below-gate') {
  if (status === 'meets-gate') return 'Practice signal meets floor';
  if (status === 'below-gate') return 'Practice signal below floor';
  return 'More evidence needed';
}

function describePassRule(passRule: (typeof OFFICIAL_TEST_FORMATS)[number]['passRule']) {
  return passRule.mode === 'individual'
    ? `Pass mark ${passRule.display}`
    : `Combined numerical + abstract pass mark ${passRule.minimumCombined}/${passRule.maximumCombined}`;
}

function formatPercent(value: number | null | undefined) {
  return value === null || value === undefined ? '—' : `${Math.round(value * 100)}%`;
}

function formatBand(band: string) {
  return band.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}
