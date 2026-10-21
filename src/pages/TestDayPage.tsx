import {
  AlertTriangle,
  ArrowRight,
  Ban,
  CalendarClock,
  CheckCircle2,
  Circle,
  ExternalLink,
  LifeBuoy,
  ListOrdered,
  PackageCheck,
  Power,
  Wrench
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { ASSESSMENT_SOURCES, OFFICIAL_OPERATIONAL_RULES, OFFICIAL_PART1_ROLLOUT } from '../data/assessmentFramework';
import { SETUP_CHECKS, TAO_TEST_DAY } from '../data/onlineTesting';
import { buildCoachingSnapshot } from '../lib/coaching';
import { formatDate } from '../lib/date';
import { PART1_TEST_MINUTES } from '../lib/part1Calendar';
import { describeTestTime, part1CountdownHeadline, part1NextStep } from '../lib/part1Rollout';
import { useAppState } from '../state/AppState';

const INSTRUCTIONS = ASSESSMENT_SOURCES.find((source) => source.id === TAO_TEST_DAY.sourceId);

export function TestDayPage() {
  const { state, toggleChecklistItem } = useAppState();
  const part1 = buildCoachingSnapshot(state).part1;
  const testTime = describeTestTime(state.part1Logistics);
  const setupDone = SETUP_CHECKS.filter((check) => state.completedChecklistItems.includes(check.id)).length;

  return (
    <div className="page test-day-page">
      <PageHeader
        eyebrow="EPSO/AD/427/26 · TAO + PROCTORIO"
        title="Test day"
        description="Rehearse the remote set-up and know the rules before the reasoning tests. This is a summary in our own words of EPSO’s competition instructions; the full document and your invitation prevail."
        actions={INSTRUCTIONS && <a className="button secondary" href={INSTRUCTIONS.url} target="_blank" rel="noreferrer">EPSO instructions <ExternalLink size={16} /></a>}
      />

      <section className="card test-day-session">
        <span className="test-day-icon"><CalendarClock size={22} /></span>
        <div>
          <p className="eyebrow">YOUR SESSION</p>
          <h2>{part1CountdownHeadline(part1)}</h2>
          <p>{part1NextStep(part1, testTime)} {OFFICIAL_OPERATIONAL_RULES.part1SessionRule} {OFFICIAL_PART1_ROLLOUT.rescheduling} Official test time: {PART1_TEST_MINUTES} minutes in total.</p>
        </div>
        <Link className="button primary" to="/coach#part1">{part1.stage === 'awaiting-invitation' ? 'Record invitation' : 'Edit dates'} <ArrowRight size={16} /></Link>
      </section>

      <section className="card test-day-section" aria-labelledby="setup-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">SET-UP REHEARSAL · COACHING STEPS FROM EPSO RULES</p>
            <h2 id="setup-title">Get the computer and room ready</h2>
            <p>Do these on the computer, room and connection you will test with, before your one prerequisite attempt.</p>
          </div>
          <strong className="checklist-count">{setupDone}/{SETUP_CHECKS.length}</strong>
        </div>
        <div className="operation-list">
          {SETUP_CHECKS.map((check) => {
            const checked = state.completedChecklistItems.includes(check.id);
            return (
              <article className={`operation-item ${checked ? 'complete' : ''}`} key={check.id}>
                <label>
                  <input type="checkbox" checked={checked} onChange={() => toggleChecklistItem(check.id)} />
                  <span className="operation-check" aria-hidden="true">{checked ? <CheckCircle2 size={20} /> : <Circle size={20} />}</span>
                  <span>
                    <strong>{check.title}</strong>
                    <small>{check.detail}</small>
                    <em>EPSO instructions {check.locator}</em>
                  </span>
                </label>
              </article>
            );
          })}
        </div>
      </section>

      <div className="test-day-grid">
        <RuleCard icon={<ListOrdered size={20} />} eyebrow="ON THE DAY" title="Log-in sequence" locator={TAO_TEST_DAY.loginSequence.locator}>
          <ol className="test-day-steps">{TAO_TEST_DAY.loginSequence.steps.map((step) => <li key={step}>{step}</li>)}</ol>
        </RuleCard>
        <RuleCard icon={<Wrench size={20} />} eyebrow="INSIDE THE TEST" title="Tools you can use" locator={TAO_TEST_DAY.tools.locator}>
          <ul>{TAO_TEST_DAY.tools.items.map((item) => <li key={item}>{item}</li>)}</ul>
          <p>
            Try them before test day: <a href={TAO_TEST_DAY.tools.publicSessionsUrl} target="_blank" rel="noreferrer">EPSO’s public TAO sessions</a> (anonymous, unscored)
            or the <a href={TAO_TEST_DAY.tools.sampleTestsUrl} target="_blank" rel="noreferrer">AD5 sample tests on the OAT platform</a> in all 24 EU languages.
          </p>
        </RuleCard>
        <RuleCard icon={<PackageCheck size={20} />} eyebrow="ALLOWED" title="What may be on or near the desk" locator={TAO_TEST_DAY.allowed.locator} tone="allowed">
          <ul>{TAO_TEST_DAY.allowed.items.map((item) => <li key={item}>{item}</li>)}</ul>
        </RuleCard>
        <RuleCard icon={<Ban size={20} />} eyebrow="FORBIDDEN · POSSIBLE DISQUALIFICATION" title="What must not be there or happen" locator={TAO_TEST_DAY.forbidden.locator} tone="forbidden">
          <ul>{TAO_TEST_DAY.forbidden.items.map((item) => <li key={item}>{item}</li>)}</ul>
        </RuleCard>
      </div>

      <RuleCard icon={<Power size={20} />} eyebrow="AUTOMATIC TERMINATION" title="Actions that can end the test automatically" locator={TAO_TEST_DAY.autoTermination.locator} tone="forbidden">
        <div className="test-day-columns">
          <div><h4>Within your control</h4><ul>{TAO_TEST_DAY.autoTermination.withinYourControl.map((item) => <li key={item}>{item}</li>)}</ul></div>
          <div><h4>Beyond your control</h4><ul>{TAO_TEST_DAY.autoTermination.beyondYourControl.map((item) => <li key={item}>{item}</li>)}</ul></div>
        </div>
        <div><h4>If it happens</h4><ol>{TAO_TEST_DAY.autoTermination.ifItHappens.map((item) => <li key={item}>{item}</li>)}</ol></div>
      </RuleCard>

      <div className="test-day-grid">
        <RuleCard icon={<LifeBuoy size={20} />} eyebrow="IF SOMETHING GOES WRONG" title="TAO support" locator={TAO_TEST_DAY.support.locator}>
          <p className="test-day-phone"><a href={`tel:${TAO_TEST_DAY.support.phone.replaceAll(' ', '')}`}>{TAO_TEST_DAY.support.phone}</a></p>
          <ul>
            <li>{TAO_TEST_DAY.support.hours}; staff speak {TAO_TEST_DAY.support.languages}.</li>
            <li>{TAO_TEST_DAY.support.email}: {TAO_TEST_DAY.support.emailScope.charAt(0).toLowerCase() + TAO_TEST_DAY.support.emailScope.slice(1)}</li>
            <li>If a problem occurs before entering the test, restart the computer first.</li>
          </ul>
        </RuleCard>
        <RuleCard icon={<AlertTriangle size={20} />} eyebrow="TECHNICAL COMPLAINT" title="For it to be admissible" locator={TAO_TEST_DAY.complaint.locator}>
          <ul>{TAO_TEST_DAY.complaint.conditions.map((item) => <li key={item}>{item}</li>)}</ul>
          <p>{TAO_TEST_DAY.complaint.retest} {TAO_TEST_DAY.forceMajeure.text}</p>
        </RuleCard>
      </div>

      <RuleCard icon={<CheckCircle2 size={20} />} eyebrow="AFTER THE TEST" title="Finish and keep proof" locator={TAO_TEST_DAY.afterTest.locator}>
        <ul>{TAO_TEST_DAY.afterTest.items.map((item) => <li key={item}>{item}</li>)}</ul>
      </RuleCard>

      <p className="test-day-footnote">
        Source: {TAO_TEST_DAY.edition}, checked on EU Careers {formatDate(TAO_TEST_DAY.verifiedAt)}. Section numbers refer to that document. If EPSO has granted you special accommodations, your own rules may differ.
      </p>
    </div>
  );
}

function RuleCard({ icon, eyebrow, title, locator, tone, children }: { icon: ReactNode; eyebrow: string; title: string; locator: string; tone?: 'allowed' | 'forbidden'; children: ReactNode }) {
  return (
    <section className={`card test-day-rule ${tone ? `tone-${tone}` : ''}`}>
      <header>
        <span className="test-day-icon">{icon}</span>
        <div><p className="eyebrow">{eyebrow}</p><h3>{title}</h3></div>
      </header>
      {children}
      <small className="test-day-locator">EPSO instructions {locator}</small>
    </section>
  );
}
