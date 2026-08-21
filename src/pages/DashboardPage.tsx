import {
  ArrowRight,
  BookOpenCheck,
  BellRing,
  Check,
  Clock3,
  FileText,
  Flame,
  Info,
  Sparkles,
  Target,
  TimerReset
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { ProgressRing } from '../components/ProgressRing';
import { competition, officialUpdateStatus } from '../data/competition';
import { currentStreak, daysUntil, formatDate } from '../lib/date';
import { buildCoachingSnapshot, labelCategory } from '../lib/coaching';
import { useAppState } from '../state/AppState';

export function DashboardPage() {
  const { state } = useAppState();
  const days = daysUntil(state.profile.phase1Target);
  const coaching = buildCoachingSnapshot(state);
  const totalAnswers = state.attempts.reduce((sum, attempt) => sum + attempt.total, 0);
  const totalCorrect = state.attempts.reduce((sum, attempt) => sum + attempt.score, 0);
  const accuracy = totalAnswers ? (totalCorrect / totalAnswers) * 100 : 0;
  const reviewed = Object.values(state.schedules).filter((schedule) => schedule.repetitions > 0).length;
  const evidenceItems = coaching.metrics.reduce((sum, metric) => sum + metric.sampleCount, 0);
  const weakest = [...coaching.readiness.components].sort((left, right) => left.index - right.index || left.sampleCount - right.sampleCount)[0];
  const primaryAction = coaching.nextActions[0] ?? {
    title: 'Build your first scored baseline',
    detail: 'Start with published EPSO sample questions.',
    href: '/practice/guided-phase1',
    minutes: 20
  };
  const name = state.profile.name.trim();

  return (
    <div className="page dashboard-page">
      <PageHeader
        eyebrow="EPSO/AD/427/26 · SOURCE-FIRST PREPARATION"
        title={`${greeting()}${name ? `, ${name}` : ''}`}
        description="Build speed for Part 1 while keeping Part 2 knowledge warm. Every question in this app links back to a published answer key."
        actions={<><Link className="button secondary" to="/reminders"><BellRing size={16} /> Daily reminder</Link><Link className="button secondary" to="/sources">Audit sources <ArrowRight size={16} /></Link></>}
      />

      <section className="dashboard-hero">
        <div className="hero-copy">
          <div className="status-row">
            <span className="status-dot" />
            <strong>COACHING ESTIMATE · NOT AN EPSO RESULT</strong>
            <span className="official-window">{formatReadinessBand(coaching.readiness.band)}</span>
          </div>
          <h2>{days > 0 ? `${days} days to your planning target` : 'Your planning target is here'}</h2>
          <p>
            Your conservative readiness estimate combines accuracy, sample depth and recency across the assessed areas. It has <strong>{Math.round(coaching.readiness.evidenceCoverage * 100)}% evidence coverage</strong> from {evidenceItems} scored item{evidenceItems === 1 ? '' : 's'}; it is not a guarantee of passing, ranking or recruitment.
          </p>
          <div className="hero-actions">
            <Link className="button primary" to={primaryAction.href}>{primaryAction.title} <ArrowRight size={17} /></Link>
            <Link className="button ghost" to="/analytics">Open full analysis</Link>
          </div>
          <div className="hero-facts">
            <span><Clock3 size={15} /> Target {formatDate(state.profile.phase1Target)}</span>
            <span><FileText size={15} /> {coaching.dueCards} cards due</span>
            <span><Target size={15} /> {weakest ? `${labelCategory(weakest.category)} least ready` : 'Baseline needed'}</span>
          </div>
        </div>
        <div className="hero-visual" aria-label={`${Math.round(coaching.readiness.index)} percent evidence-based readiness estimate`}>
          <ProgressRing value={coaching.readiness.index} size={150} label="readiness estimate" />
          <div className="orbit-note top"><Sparkles size={15} /><span>{Math.round(coaching.readiness.evidenceCoverage * 100)}%<small>evidence coverage</small></span></div>
          <div className="orbit-note bottom"><Flame size={15} /><span>{currentStreak(state.studyDates)}<small>day streak</small></span></div>
        </div>
      </section>

      <section className="source-watch card">
        <div className="notice-icon"><Info size={21} /></div>
        <div>
          <p className="eyebrow">LIVE CURRICULUM WATCH</p>
          <h3>{officialUpdateStatus.title}</h3>
          <p>{officialUpdateStatus.body}</p>
        </div>
        <div className="watch-meta"><span>{officialUpdateStatus.status}</span><small>Checked {officialUpdateStatus.checkedAt}</small></div>
      </section>

      <div className="dashboard-grid">
        <section className="card next-card">
          <div className="section-heading">
            <div><p className="eyebrow">TODAY'S COACHING LOOP</p><h3>Act on the evidence</h3></div>
            <span className="mini-goal">{state.profile.weeklyGoal} sessions / week</span>
          </div>
          <div className="next-list">
            <Link to={primaryAction.href} className="next-item">
              <span className="next-icon gold"><Sparkles size={20} /></span>
              <span><strong>{primaryAction.title}</strong><small>{primaryAction.detail} · about {primaryAction.minutes} min</small></span>
              <ArrowRight size={17} />
            </Link>
            <Link to="/mistakes" className="next-item">
              <span className="next-icon coral"><TimerReset size={20} /></span>
              <span><strong>{coaching.dueMistakes} mistake{coaching.dueMistakes === 1 ? '' : 's'} due for repair</strong><small>{coaching.unresolvedMistakes} unresolved · re-solve against the published solution</small></span>
              <ArrowRight size={17} />
            </Link>
            <Link to="/review" className="next-item">
              <span className="next-icon mint"><BookOpenCheck size={20} /></span>
              <span><strong>{coaching.dueCards} Phase 2 card{coaching.dueCards === 1 ? '' : 's'} due</strong><small>Spaced retrieval from source-linked EU briefs</small></span>
              <ArrowRight size={17} />
            </Link>
            <Link to="/analytics" className="next-item">
              <span className="next-icon gold"><Target size={20} /></span>
              <span><strong>{weakest ? labelCategory(weakest.category) : 'All areas'}: weakest or least evidenced</strong><small>{weakest ? `${weakest.sampleCount} scored items · ${Math.round(weakest.index)}% conservative component index` : 'Complete a scored baseline to identify it'}</small></span>
              <ArrowRight size={17} />
            </Link>
          </div>
        </section>

        <section className="card pulse-card">
          <div className="section-heading"><div><p className="eyebrow">EVIDENCE PULSE</p><h3>What the data supports</h3></div></div>
          <div className="metric-grid">
            <div><strong>{Math.round(coaching.readiness.index)}%</strong><span>readiness estimate</span></div>
            <div><strong>{Math.round(coaching.readiness.evidenceCoverage * 100)}%</strong><span>evidence coverage</span></div>
            <div><strong>{totalAnswers ? `${Math.round(accuracy)}%` : '—'}</strong><span>embedded accuracy</span></div>
            <div><strong>{reviewed}</strong><span>cards reviewed</span></div>
          </div>
          {state.attempts.length > 0 ? (
            <div className="attempt-sparkline" aria-label="Recent attempt scores">
              {state.attempts.slice(0, 8).reverse().map((attempt) => (
                <span key={attempt.id} style={{ height: `${Math.max(12, (attempt.score / attempt.total) * 100)}%` }} title={`${attempt.title}: ${attempt.score}/${attempt.total}`} />
              ))}
            </div>
          ) : (
            <div className="empty-metric"><Info size={20} /><span>No scored baseline yet. Low sample counts deliberately keep this estimate low.</span></div>
          )}
          <div className="empty-metric"><Info size={18} /><span>{coaching.readiness.notice} Repeated familiar questions become less diagnostic.</span></div>
        </section>
      </div>

      <section className="card roadmap-card">
        <div className="section-heading">
          <div><p className="eyebrow">THE REAL SELECTION PATH</p><h3>What the amended notice says</h3></div>
          <a className="text-link" href={competition.noticeUrl} target="_blank" rel="noreferrer">Consolidated notice <ArrowRight size={15} /></a>
        </div>
        <div className="roadmap">
          <RoadmapStep number="01" title="Reasoning" note="Oct/Nov 2026" detail="Verbal · numerical · abstract" current />
          <RoadmapStep number="02" title="Part 1 result" note="Date unannounced" detail="Both pass gates required" />
          <RoadmapStep number="03" title="Remaining tests" note="2027 · date TBD" detail="EU knowledge · digital · EUFTE" provisional />
          <RoadmapStep number="04" title="Final ranking" note="1,490 sought" detail="Weighted score + eligibility" />
        </div>
      </section>
    </div>
  );
}

function RoadmapStep({ number, title, note, detail, current, provisional }: { number: string; title: string; note: string; detail: string; current?: boolean; provisional?: boolean }) {
  return (
    <div className={`roadmap-step ${current ? 'current' : ''}`}>
      <div className="roadmap-number">{current ? <Check size={16} /> : number}</div>
      <div><span>{title}</span><strong>{note}</strong><small>{detail}</small>{provisional && <em>Schedule pending</em>}</div>
    </div>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatReadinessBand(band: string) {
  return band.replaceAll('-', ' ');
}
