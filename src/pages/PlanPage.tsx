import { ArrowRight, BrainCircuit, CircleDashed, Clock3, Flag, Info, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { OFFICIAL_TIMELINE } from '../data/assessmentFramework';
import { competition } from '../data/competition';
import { buildCoachingSnapshot, labelCategory } from '../lib/coaching';
import { addDaysIso, daysUntil, formatDate, todayIso } from '../lib/date';
import { useAppState } from '../state/AppState';

export function PlanPage() {
  const { state } = useAppState();
  const snapshot = buildCoachingSnapshot(state);
  const part1 = snapshot.part1;
  const part1Days = Math.max(0, part1.daysToTarget);
  const afterPart1 = part1.stage === 'completed';
  const part1Card = PART1_TARGET_COPY[part1.targetSource];
  const weakest = [...snapshot.readiness.components].sort((left, right) => left.index - right.index)[0];
  const primaryAction = snapshot.nextActions[0];
  const weeks = buildWeeks(
    part1.targetDate,
    state.profile.weeklyGoal,
    afterPart1,
    snapshot.nextActions.map((action) => action.title),
    primaryAction?.href
  );

  return (
    <div className="page">
      <PageHeader
        eyebrow="ADAPTIVE ROADMAP"
        title="Your study plan"
        description="A local plan keyed to your invitation details or editable targets. It prioritises the only scheduled next sitting—Part 1 reasoning—without letting Phase 2 go cold."
        actions={<Link className="button secondary" to="/settings">Adjust targets <ArrowRight size={16} /></Link>}
      />

      <section className="plan-summary">
        <div className="card plan-target primary-target">
          <div className="target-icon"><Target size={24} /></div>
          <div><p className="eyebrow">{part1Card.eyebrow}</p><h2>{formatDate(part1.targetDate)}</h2><p>{part1Days ? `${part1Days} days remaining` : 'Target reached'} · EPSO: {OFFICIAL_TIMELINE.part1.display}</p></div>
          <span className={part1Card.official ? 'verified-tag' : 'pending-tag'}>{part1Card.tag}</span>
        </div>
        <div className="card plan-target">
          <div className="target-icon phase2"><Flag size={24} /></div>
          <div><p className="eyebrow">PART 2 PLACEHOLDER</p><h2>{formatDate(state.profile.phase2Target)}</h2><p>Your planning assumption · EPSO confirms only “2027”</p></div>
          <span className="pending-tag">Not official</span>
        </div>
      </section>

      <section className="card allocation-card">
        <div className="section-heading"><div><p className="eyebrow">CURRENT ALLOCATION</p><h3>{afterPart1 ? 'Shift to Phase 2' : 'Protect the next gate'}</h3></div></div>
        <div className="allocation-layout">
          <div className="allocation-bar" aria-label="Recommended study allocation">
            <span className="verbal" style={{ flex: afterPart1 ? 1 : 4 }}>Verbal</span>
            <span className="number" style={{ flex: afterPart1 ? 1 : 2 }}>Numerical</span>
            <span className="abstract" style={{ flex: afterPart1 ? 1 : 2 }}>Abstract</span>
            <span className="phase2" style={{ flex: afterPart1 ? 7 : 2 }}>Phase 2</span>
          </div>
          <p>{afterPart1 ? '70% EU knowledge, digital skills and writing; 30% reasoning maintenance until your result.' : '80% reasoning, led by verbal because it carries final-ranking weight; 20% Phase 2 maintenance.'} {weakest ? `Current weakest evidence signal: ${labelCategory(weakest.category)} (${weakest.sampleCount} scored item${weakest.sampleCount === 1 ? '' : 's'}).` : ''}</p>
        </div>
      </section>

      <section className="card adaptive-plan-card">
        <span><BrainCircuit size={23} /></span>
        <div>
          <p className="eyebrow">EVIDENCE-ADAPTIVE NEXT MOVE</p>
          <h3>{primaryAction?.title ?? 'Build your first diagnostic baseline'}</h3>
          <p>{primaryAction?.detail ?? 'Complete a timed, source-backed set so the plan can react to accuracy, pace and confidence.'} Recommendations are coaching heuristics—not an EPSO forecast.</p>
        </div>
        <Link className="button primary" to={primaryAction?.href ?? '/practice/guided-phase1'}>{primaryAction ? `${primaryAction.minutes} min block` : 'Start baseline'} <ArrowRight size={16} /></Link>
      </section>

      <div className="plan-heading-row">
        <div><p className="eyebrow">NEXT SIX WEEKS</p><h2>Weekly rhythm</h2></div>
        <span><Clock3 size={16} /> Aim for 25–40 min per session</span>
      </div>

      <section className="weeks-list">
        {weeks.map((week, index) => {
          const completedThisWeek = index === 0 ? countRecentActivity(state, 7) : 0;
          return (
            <article className={`card week-card ${index === 0 ? 'current' : ''}`} key={week.start}>
              <div className="week-date">
                <span>{index === 0 ? 'THIS WEEK' : `WEEK ${index + 1}`}</span>
                <strong>{formatDate(week.start, { day: 'numeric', month: 'short' })}</strong>
                <small>to {formatDate(week.end, { day: 'numeric', month: 'short' })}</small>
              </div>
              <div className="week-content">
                <div className="week-title"><h3>{week.title}</h3><span>{completedThisWeek}/{state.profile.weeklyGoal} logged</span></div>
                <div className="session-chips">
                  {week.sessions.map((session, sessionIndex) => (
                    <span key={`${session}-${sessionIndex}`}><CircleDashed size={14} />{session}</span>
                  ))}
                </div>
              </div>
              <Link className="icon-button week-action" to={week.link} aria-label={`Open ${week.title}`}><ArrowRight size={19} /></Link>
            </article>
          );
        })}
      </section>

      <section className="plan-notice">
        <Info size={20} />
        <div><strong>Automatic curriculum checkpoint</strong><p>About two months before Part 2, replace guidance cards with the source list EPSO publishes. This build records the current source tier on every card so the migration can be audited.</p></div>
        <a href={competition.sourcePackFaqUrl} target="_blank" rel="noreferrer">EPSO FAQ <ArrowRight size={15} /></a>
      </section>
    </div>
  );
}

const PART1_TARGET_COPY = {
  'testing-platform': { eyebrow: 'PART 1 TEST DATE', tag: 'From testing platform', official: true },
  'invitation-week': { eyebrow: 'PART 1 TESTING WEEK', tag: 'From your invitation', official: true },
  'official-week': { eyebrow: 'PART 1 TESTING WEEK', tag: 'EPSO, all candidates', official: true }
} as const;

function buildWeeks(target: string, goal: number, afterPart1: boolean, priorities: string[], primaryHref?: string) {
  const first = todayIso();
  return Array.from({ length: 6 }, (_, index) => {
    const start = addDaysIso(first, index * 7);
    const end = addDaysIso(start, 6);
    const remaining = daysUntil(target, new Date(`${start}T12:00:00`));
    const intensive = remaining <= 42 && !afterPart1;
    const sessions = afterPart1
      ? ['EU institutions review', 'DigComp cards', 'EU policy brief', 'EUFTE drill', 'Reasoning upkeep']
      : intensive
        ? ['Timed verbal', 'Numerical sprint', 'Official abstract test', 'Mixed sample', 'Mistake review']
        : ['Verbal accuracy', 'Numerical method', 'Official abstract test', 'Spaced review', 'Phase 2 brief'];
    const adaptiveSessions = index === 0 ? [...new Set([...priorities, ...sessions])] : sessions;
    return {
      start,
      end,
      title: afterPart1 ? 'Phase 2 build' : intensive ? 'Timed performance' : 'Reasoning foundations',
      sessions: adaptiveSessions.slice(0, Math.max(3, Math.min(5, goal))),
      link: index === 0 && primaryHref ? primaryHref : afterPart1 ? '/library' : '/practice'
    };
  });
}

function countRecentActivity(state: ReturnType<typeof useAppState>['state'], days: number) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const attempts = state.attempts.filter((attempt) => new Date(attempt.completedAt) >= cutoff).length;
  const reviews = Object.values(state.schedules).filter((schedule) => schedule.lastReviewedAt && new Date(schedule.lastReviewedAt) >= cutoff).length;
  return Math.min(state.profile.weeklyGoal, attempts + (reviews > 0 ? 1 : 0));
}
