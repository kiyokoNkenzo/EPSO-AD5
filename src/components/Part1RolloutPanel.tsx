import { AlertTriangle, CalendarCheck2, Check, ExternalLink, Eraser, Save } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import {
  ASSESSMENT_SOURCES,
  OFFICIAL_ONLINE_TESTING_SETUP,
  OFFICIAL_OPERATIONAL_RULES,
  OFFICIAL_PART1_ROLLOUT,
  OFFICIAL_TIMELINE,
  PART1_ROLLOUT_VERIFIED_AT
} from '../data/assessmentFramework';
import { formatDate } from '../lib/date';
import { part1NextStep, part1StageLabel, type Part1RolloutStatus } from '../lib/part1Rollout';
import { useAppState } from '../state/AppState';
import type { Part1Logistics } from '../types';

const ROLLOUT_SOURCE = ASSESSMENT_SOURCES.find((source) => source.id === 'testing-rollout-update');
const TAO_SOURCE = ASSESSMENT_SOURCES.find((source) => source.id === 'online-testing-instructions');

export function Part1RolloutPanel({ status }: { status: Part1RolloutStatus }) {
  const { state, updatePart1Logistics } = useAppState();
  const [draft, setDraft] = useState<Part1Logistics>(state.part1Logistics);
  const [saved, setSaved] = useState(false);

  useEffect(() => setDraft(state.part1Logistics), [state.part1Logistics]);

  const setField = (field: keyof Part1Logistics, value: string) => {
    const next = { ...draft };
    if (value) next[field] = value;
    else delete next[field];
    setDraft(next);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    updatePart1Logistics(draft);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const steps = [
    {
      title: 'Invitation letter',
      detail: `${OFFICIAL_PART1_ROLLOUT.invitation.channel}. ${OFFICIAL_PART1_ROLLOUT.invitation.leadDisplay}. ${OFFICIAL_PART1_ROLLOUT.invitation.content}`,
      done: status.stage !== 'awaiting-invitation'
    },
    {
      title: 'Exact date and time',
      detail: `${OFFICIAL_PART1_ROLLOUT.exactSlot.channel}. ${OFFICIAL_PART1_ROLLOUT.exactSlot.leadDisplay}.`,
      done: status.stage === 'slot-confirmed' || status.stage === 'completed'
    },
    {
      title: 'Technical prerequisite check',
      detail: OFFICIAL_ONLINE_TESTING_SETUP.prerequisiteCheck,
      done: status.prerequisiteDone
    },
    {
      title: 'Test day',
      detail: `${OFFICIAL_OPERATIONAL_RULES.part1SessionRule} ${OFFICIAL_PART1_ROLLOUT.rescheduling}`,
      done: status.stage === 'completed'
    }
  ];

  const dirty = JSON.stringify(draft) !== JSON.stringify(state.part1Logistics);

  return (
    <section className="card part1-card" id="part1" aria-labelledby="part1-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">PART 1 ROLL-OUT · {OFFICIAL_TIMELINE.part1.display.toUpperCase()}</p>
          <h2 id="part1-title">Your invitation and test slot</h2>
          <p>
            Copy the details from your own invitation and the testing platform. Countdowns and the
            study plan then follow them instead of your planning target.
          </p>
        </div>
        <span className={`stage-pill stage-${status.stage}`}>{part1StageLabel(status.stage)}</span>
      </div>

      <p className="part1-next">
        <CalendarCheck2 size={18} aria-hidden="true" />
        <span>{part1NextStep(status, state.part1Logistics.testTime)}</span>
      </p>

      <ol className="rollout-steps">
        {steps.map((step, index) => (
          <li className={step.done ? 'done' : ''} key={step.title}>
            <span className="rollout-step-mark" aria-hidden="true">{step.done ? <Check size={14} /> : index + 1}</span>
            <div>
              <strong>{step.title}</strong>
              <small>{step.detail}</small>
            </div>
          </li>
        ))}
      </ol>

      <form className="part1-form" onSubmit={submit}>
        <div className="form-grid">
          <label className="field">
            <span>Testing week start <small>invitation</small></span>
            <input type="date" value={draft.testingWeekStart ?? ''} onChange={(event) => setField('testingWeekStart', event.target.value)} />
          </label>
          <label className="field">
            <span>Prerequisite deadline <small>invitation</small></span>
            <input type="date" value={draft.prerequisiteDeadline ?? ''} onChange={(event) => setField('prerequisiteDeadline', event.target.value)} />
          </label>
          <label className="field">
            <span>Exact test date <small>testing platform</small></span>
            <input type="date" value={draft.testDate ?? ''} onChange={(event) => setField('testDate', event.target.value)} />
          </label>
          <label className="field">
            <span>Start time <small>as shown</small></span>
            <input type="time" value={draft.testTime ?? ''} disabled={!draft.testDate} onChange={(event) => setField('testTime', event.target.value)} />
          </label>
        </div>
        {status.testDateOutsideWeek && (
          <p className="field-error"><AlertTriangle size={15} /> The test date is outside the testing week you recorded. Re-check both against EPSO’s messages.</p>
        )}
        <div className="part1-form-actions">
          <button className="button primary" type="submit" disabled={!dirty}>
            {saved ? <><Check size={17} /> Saved</> : <><Save size={17} /> Save invitation details</>}
          </button>
          {Object.keys(state.part1Logistics).length > 0 && (
            <button className="button secondary" type="button" onClick={() => updatePart1Logistics({})}>
              <Eraser size={17} /> Clear
            </button>
          )}
        </div>
      </form>

      {status.stage === 'invited' && status.slotLookupFrom && status.slotOverdueAfter && (
        <p className="part1-arithmetic">
          <span className="rule-label coaching">App arithmetic</span>
          Look for the exact slot from {formatDate(status.slotLookupFrom)}. If nothing is visible after{' '}
          {formatDate(status.slotOverdueAfter)}, EPSO’s two-week minimum lead has passed for every day of that week.
        </p>
      )}
      {status.stage === 'awaiting-invitation' && (
        <p className="part1-arithmetic">
          <span className="rule-label coaching">App arithmetic</span>
          A 1 November start minus about three weeks puts the earliest invitations around{' '}
          {formatDate(status.invitationWatchFrom)}. EPSO has published no exact testing dates.
        </p>
      )}

      <footer className="part1-sources">
        {ROLLOUT_SOURCE && (
          <a href={ROLLOUT_SOURCE.url} target="_blank" rel="noreferrer" className="source-badge compact">
            <span>EPSO roll-out update</span>
            <ExternalLink size={12} />
          </a>
        )}
        {TAO_SOURCE && (
          <a href={TAO_SOURCE.url} target="_blank" rel="noreferrer" className="source-badge compact">
            <span>TAO testing instructions</span>
            <ExternalLink size={12} />
          </a>
        )}
        <small>Checked {formatDate(PART1_ROLLOUT_VERIFIED_AT)}. Your own invitation prevails; note the time zone of any time it gives.</small>
      </footer>
    </section>
  );
}
