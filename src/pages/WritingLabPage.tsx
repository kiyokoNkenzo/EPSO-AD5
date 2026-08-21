import {
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Pause,
  Play,
  RotateCcw,
  Save,
  ShieldCheck
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { PageHeader } from '../components/PageHeader';
import {
  ASSESSMENT_SOURCES,
  OFFICIAL_EUFTE_ANCHORS,
  OFFICIAL_EUFTE_RUBRIC_STATUS
} from '../data/assessmentFramework';
import { useAppState } from '../state/AppState';
import type { WritingAnchorScores, WritingPracticeRecord } from '../types';

const SESSION_SECONDS = 40 * 60;
const WRITTEN_TEST_SOURCE = ASSESSMENT_SOURCES.find((source) => source.id === 'written-test-page');
const AD5_TESTING_SOURCE = ASSESSMENT_SOURCES.find((source) => source.id === 'ad5-testing-page');

type AnchorKey = keyof WritingAnchorScores;
type DraftScores = Record<AnchorKey, 0 | 1 | 2 | null>;

const ANCHOR_KEYS: Record<(typeof OFFICIAL_EUFTE_ANCHORS)[number]['id'], AnchorKey> = {
  'logical-flow': 'logicalFlow',
  concision: 'concision',
  clarity: 'clarity',
  'audience-and-purpose': 'audienceAndPurpose',
  'effective-use-of-information': 'useOfInformation'
};

function blankScores(): DraftScores {
  return {
    logicalFlow: null,
    concision: null,
    clarity: null,
    audienceAndPurpose: null,
    useOfInformation: null
  };
}

function formatClock(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

function validSourceUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function makeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `writing-${crypto.randomUUID()}`
    : `writing-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function completedScores(scores: DraftScores): WritingAnchorScores | undefined {
  const values = Object.values(scores);
  if (values.some((value) => value === null)) return undefined;
  return scores as WritingAnchorScores;
}

function scoreTotal(scores: WritingAnchorScores): number {
  return Object.values(scores).reduce((sum, value) => sum + value, 0);
}

export function WritingLabPage() {
  const { state, saveWritingPractice, logCoachSession } = useAppState();
  const [assignment, setAssignment] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [draft, setDraft] = useState('');
  const [notes, setNotes] = useState('');
  const [scores, setScores] = useState<DraftScores>(blankScores);
  const [remainingSeconds, setRemainingSeconds] = useState(SESSION_SECONDS);
  const [running, setRunning] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const [message, setMessage] = useState('');
  const deadlineRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const deadline = deadlineRef.current;
      if (!deadline) return;
      const next = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemainingSeconds(next);
      if (next === 0) setRunning(false);
    };
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [running]);

  const wordCount = useMemo(() => draft.trim() ? draft.trim().split(/\s+/u).length : 0, [draft]);
  const elapsedSeconds = SESSION_SECONDS - remainingSeconds;
  const finalScores = completedScores(scores);

  const startTimer = () => {
    deadlineRef.current = Date.now() + remainingSeconds * 1000;
    setTimerStarted(true);
    setRunning(true);
    setMessage('');
  };

  const pauseTimer = () => {
    if (deadlineRef.current) {
      setRemainingSeconds(Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000)));
    }
    setRunning(false);
  };

  const resetTimer = () => {
    setRunning(false);
    setTimerStarted(false);
    deadlineRef.current = undefined;
    setRemainingSeconds(SESSION_SECONDS);
  };

  const resetForm = () => {
    setAssignment('');
    setSourceUrl('');
    setDraft('');
    setNotes('');
    setScores(blankScores());
    resetTimer();
  };

  const save = (event: FormEvent) => {
    event.preventDefault();
    const cleanAssignment = assignment.trim();
    const cleanSource = sourceUrl.trim();
    const cleanDraft = draft.trim();

    if (!cleanAssignment) return setMessage('Enter the exact assignment wording or a precise assignment title.');
    if (!validSourceUrl(cleanSource)) return setMessage('Enter the HTTPS URL of the assignment or source pack you actually used.');
    if (!cleanDraft) return setMessage('Write or paste your completed response before saving.');
    if (!timerStarted || elapsedSeconds <= 0) return setMessage('Start the 40-minute timer so this attempt records real practice time.');
    if (!finalScores) return setMessage('Complete all five coaching-only reflection scores.');

    pauseTimer();
    const completedAt = new Date().toISOString();
    const practice: WritingPracticeRecord = {
      id: makeId(),
      title: cleanAssignment,
      sourceUrl: cleanSource,
      completedAt,
      durationSeconds: Math.max(1, elapsedSeconds),
      anchorScores: finalScores,
      text: cleanDraft,
      excerpt: cleanDraft.slice(0, 240),
      notes: notes.trim() || undefined
    };
    saveWritingPractice(practice);
    logCoachSession({
      id: `coach-${practice.id}`,
      completedAt,
      type: 'writing',
      focus: 'Source-bound EUFTE writing practice',
      minutes: Math.max(1, Math.round(practice.durationSeconds / 60)),
      summary: `Self-reflection ${scoreTotal(finalScores)}/10 on the app's coaching-only five-anchor scale.`,
      actionItems: notes.trim() ? [notes.trim()] : undefined
    });
    resetForm();
    setMessage('Writing practice saved locally. The self-reflection total is coaching-only, not an EPSO mark.');
  };

  return (
    <div className="page writing-lab-page">
      <PageHeader
        eyebrow="PART 2 · SOURCE-BOUND PRACTICE"
        title="EUFTE writing lab"
        description="Rehearse the official 40-minute format against an assignment and documents you can cite. This app never invents an exam prompt; you supply the exact EPSO assignment or another deliberately chosen source-bound exercise."
        actions={WRITTEN_TEST_SOURCE && (
          <a className="button secondary" href={WRITTEN_TEST_SOURCE.url} target="_blank" rel="noreferrer">
            EPSO written-test page <ExternalLink size={16} />
          </a>
        )}
      />

      <section className="writing-official-grid" aria-label="Official EUFTE facts and app boundary">
        <article className="card writing-fact-card official">
          <ShieldCheck size={24} />
          <div><p className="eyebrow">OFFICIAL EPSO INFORMATION</p><h2>40 minutes · overall mark /10 · pass 5/10</h2><p>EPSO publishes five communication anchors and states that candidates use the information provided to address the assignment.</p></div>
        </article>
        <article className="card writing-fact-card coaching">
          <AlertTriangle size={24} />
          <div><p className="eyebrow">APP COACHING SCALE</p><h2>0–2 per anchor for self-reflection</h2><p>EPSO has not published per-anchor weights or performance bands in the reviewed sources. A total here is not an official score, cut-off or prediction.</p></div>
        </article>
      </section>

      <form className="writing-workspace" onSubmit={save}>
        <section className="card writing-source-card">
          <div className="section-heading">
            <div><p className="eyebrow">1 · BIND THE SESSION TO A REAL SOURCE</p><h2>Assignment and documentation</h2><p>Use an EPSO-published assignment when available for this competition, or another source/document exercise you deliberately select. Do not substitute an app-generated prompt.</p></div>
            <BookOpenCheck size={27} />
          </div>
          <div className="form-grid">
            <label className="field full">
              <span>Exact assignment wording or precise title</span>
              <textarea rows={3} value={assignment} onChange={(event) => setAssignment(event.target.value)} placeholder="Paste the assignment wording, or record its precise published title." required />
            </label>
            <label className="field full">
              <span>Assignment or source-pack URL</span>
              <input type="url" inputMode="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://…" required />
              <small>The URL is stored with the attempt so you can audit what the response was based on.</small>
            </label>
          </div>
          <div className="writing-source-links">
            {AD5_TESTING_SOURCE && <a className="text-link" href={AD5_TESTING_SOURCE.url} target="_blank" rel="noreferrer">AD5 tests and preparation <ExternalLink size={14} /></a>}
            {WRITTEN_TEST_SOURCE && <a className="text-link" href={WRITTEN_TEST_SOURCE.url} target="_blank" rel="noreferrer">EPSO written-test guidance <ExternalLink size={14} /></a>}
          </div>
        </section>

        <section className="card writing-draft-card">
          <div className="writing-timer-row">
            <div>
              <p className="eyebrow">2 · PLAN, DRAFT AND CHECK</p>
              <h2>Timed response</h2>
            </div>
            <output className={`writing-timer ${remainingSeconds <= 300 ? 'urgent' : ''}`} aria-live="polite" aria-label={`${formatClock(remainingSeconds)} remaining`}>
              <Clock3 size={21} /> {formatClock(remainingSeconds)}
            </output>
            <div className="writing-timer-actions">
              {!running ? (
                <button type="button" className="button primary" onClick={startTimer} disabled={remainingSeconds === 0}>
                  <Play size={16} /> {timerStarted ? 'Resume' : 'Start 40 min'}
                </button>
              ) : (
                <button type="button" className="button secondary" onClick={pauseTimer}><Pause size={16} /> Pause</button>
              )}
              <button type="button" className="button ghost" onClick={resetTimer}><RotateCcw size={16} /> Reset timer</button>
            </div>
          </div>
          <label className="field writing-editor">
            <span>Your response</span>
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Draft only after reading the real assignment and its documents…" spellCheck rows={20} required />
          </label>
          <div className="writing-editor-meta"><span>{wordCount} words</span><span>{formatDuration(elapsedSeconds)} active timer time recorded</span><span>Stored only in this app’s local data</span></div>
        </section>

        <section className="card writing-reflection-card">
          <div className="section-heading">
            <div><p className="eyebrow">3 · REFLECT AGAINST PUBLISHED ANCHORS</p><h2>Five-anchor check</h2><p>Use 0 = needs work, 1 = developing, 2 = demonstrated. These descriptors and equal point values are coaching conventions created by this app—not EPSO scoring bands or weights.</p></div>
            <FileText size={27} />
          </div>
          <div className="writing-anchor-list">
            {OFFICIAL_EUFTE_ANCHORS.map((anchor) => {
              const key = ANCHOR_KEYS[anchor.id];
              return (
                <fieldset className="writing-anchor" key={anchor.id}>
                  <legend><span>{anchor.order}</span>{anchor.text}</legend>
                  <div className="writing-score-options">
                    {([0, 1, 2] as const).map((value) => (
                      <label key={value} className={scores[key] === value ? 'selected' : ''}>
                        <input
                          type="radio"
                          name={`anchor-${anchor.id}`}
                          value={value}
                          checked={scores[key] === value}
                          onChange={() => setScores((current) => ({ ...current, [key]: value }))}
                        />
                        <strong>{value}</strong>
                        <span>{value === 0 ? 'Needs work' : value === 1 ? 'Developing' : 'Demonstrated'}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              );
            })}
          </div>
          <label className="field writing-notes">
            <span>Next-action note <small>(optional)</small></span>
            <textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Name one concrete change for the next rehearsal." />
          </label>
          {message && <p className="writing-message" role="status">{message}</p>}
          <div className="writing-save-row">
            <p><strong>{finalScores ? `${scoreTotal(finalScores)}/10` : '—/10'}</strong><span>coaching-only reflection total</span></p>
            <button className="button primary large-button" type="submit"><Save size={17} /> Save practice</button>
          </div>
        </section>
      </form>

      <section className="writing-history">
        <div className="section-heading"><div><p className="eyebrow">LOCAL PRACTICE RECORD</p><h2>Writing history</h2><p>Each entry retains the source link, response and coaching-only reflection so progress can be reviewed without presenting it as an EPSO mark.</p></div></div>
        <div className="writing-history-list">
          {state.writingPractices.map((practice) => <WritingHistoryCard key={practice.id} practice={practice} />)}
          {!state.writingPractices.length && (
            <div className="card mistake-empty"><FileText size={30} /><h3>No writing attempts saved yet</h3><p>Complete a source-bound timed response above to establish a baseline.</p></div>
          )}
        </div>
      </section>

      <aside className="guidance-warning">
        <AlertTriangle size={20} />
        <div><strong>No practice result guarantees progression</strong><p>{OFFICIAL_EUFTE_RUBRIC_STATUS.statement}</p></div>
      </aside>
    </div>
  );
}

function WritingHistoryCard({ practice }: { practice: WritingPracticeRecord }) {
  const total = scoreTotal(practice.anchorScores);
  return (
    <article className="card writing-history-card">
      <div className="writing-history-head">
        <div><p className="eyebrow">{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(practice.completedAt))}</p><h3>{practice.title}</h3></div>
        <div className="writing-history-score"><strong>{total}/10</strong><span>coaching only</span></div>
      </div>
      <div className="writing-history-meta"><span><Clock3 size={14} /> {formatDuration(practice.durationSeconds)}</span><span><FileText size={14} /> {practice.text?.trim().split(/\s+/u).filter(Boolean).length ?? 0} words</span></div>
      {practice.excerpt && <p>{practice.excerpt}{practice.text && practice.text.length > practice.excerpt.length ? '…' : ''}</p>}
      <div className="writing-history-anchors">
        {OFFICIAL_EUFTE_ANCHORS.map((anchor) => <span key={anchor.id}>{anchor.text.split(/[,.]/u)[0]} <strong>{practice.anchorScores[ANCHOR_KEYS[anchor.id]]}/2</strong></span>)}
      </div>
      <details>
        <summary>Review full response and reflection</summary>
        {practice.text && <div className="writing-history-response">{practice.text}</div>}
        {practice.notes && <p><strong>Next action:</strong> {practice.notes}</p>}
      </details>
      {practice.sourceUrl && <a className="text-link" href={practice.sourceUrl} target="_blank" rel="noreferrer"><CheckCircle2 size={14} /> Open recorded source <ExternalLink size={13} /></a>}
    </article>
  );
}
