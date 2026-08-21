import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  Filter,
  RotateCcw,
  Save,
  Search,
  ShieldCheck
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { SourceBadge } from '../components/SourceBadge';
import { questions } from '../data/questions';
import { useAppState } from '../state/AppState';
import type { MistakeCause, MistakeRecord, QuestionCategory, StudyQuestion } from '../types';

type MistakeFilter = 'due' | 'open' | 'resolved' | 'all';

const CAUSE_OPTIONS: ReadonlyArray<{ value: MistakeCause; label: string }> = [
  { value: 'knowledge-gap', label: 'Knowledge gap' },
  { value: 'misread-prompt', label: 'Misread prompt or source' },
  { value: 'reasoning-error', label: 'Reasoning error' },
  { value: 'calculation-error', label: 'Calculation error' },
  { value: 'time-pressure', label: 'Time pressure' },
  { value: 'careless-error', label: 'Careless error' },
  { value: 'confidence-miscalibration', label: 'Confidence miscalibration' },
  { value: 'other', label: 'Other / not classified yet' }
];

const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  verbal: 'Verbal reasoning',
  numerical: 'Numerical reasoning',
  abstract: 'Abstract reasoning',
  'eu-knowledge': 'EU knowledge',
  'digital-skills': 'Digital skills'
};

function isDue(mistake: MistakeRecord, now: number): boolean {
  if (mistake.resolved) return false;
  if (!mistake.nextReviewAt) return true;
  const dueAt = Date.parse(mistake.nextReviewAt);
  return !Number.isFinite(dueAt) || dueAt <= now;
}

function formatDate(value?: string): string {
  if (!value) return 'Unscheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unscheduled';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

function causeLabel(cause: MistakeCause): string {
  return CAUSE_OPTIONS.find((option) => option.value === cause)?.label ?? cause;
}

export function MistakesPage() {
  const { state, upsertMistake, reviewMistake, resolveMistake } = useAppState();
  const [filter, setFilter] = useState<MistakeFilter>('due');
  const [query, setQuery] = useState('');
  const now = Date.now();

  const counts = useMemo(() => {
    const due = state.mistakes.filter((mistake) => isDue(mistake, now)).length;
    const open = state.mistakes.filter((mistake) => !mistake.resolved).length;
    const resolved = state.mistakes.filter((mistake) => mistake.resolved).length;
    return { due, open, resolved, all: state.mistakes.length };
  }, [now, state.mistakes]);

  const visibleMistakes = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return [...state.mistakes]
      .filter((mistake) => {
        if (filter === 'due') return isDue(mistake, now);
        if (filter === 'open') return !mistake.resolved;
        if (filter === 'resolved') return mistake.resolved;
        return true;
      })
      .filter((mistake) => {
        if (!normalizedQuery) return true;
        const question = questions.find((item) => item.id === mistake.questionId);
        return [
          question?.title,
          question?.prompt,
          mistake.questionId,
          mistake.category,
          causeLabel(mistake.cause),
          mistake.note
        ]
          .filter(Boolean)
          .some((value) => String(value).toLocaleLowerCase().includes(normalizedQuery));
      })
      .sort((a, b) => {
        if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
        const aDue = a.nextReviewAt ? Date.parse(a.nextReviewAt) : 0;
        const bDue = b.nextReviewAt ? Date.parse(b.nextReviewAt) : 0;
        return aDue - bDue || Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
      });
  }, [filter, now, query, state.mistakes]);

  return (
    <div className="page">
      <PageHeader
        eyebrow="LEARNER-CLASSIFIED · SOURCE-LINKED"
        title="Mistake journal"
        description="Turn every miss into a specific correction and a scheduled recheck. The app never guesses the cause: you classify it after inspecting the authentic item and its published solution."
      />

      <section className="review-metrics" aria-label="Mistake journal summary">
        <div className="card"><CalendarClock size={21} /><strong>{counts.due}</strong><span>due to review</span></div>
        <div className="card"><AlertTriangle size={21} /><strong>{counts.open}</strong><span>open mistakes</span></div>
        <div className="card"><CheckCircle2 size={21} /><strong>{counts.resolved}</strong><span>resolved</span></div>
        <div className="card"><ShieldCheck size={21} /><strong>{counts.all}</strong><span>source-linked records</span></div>
      </section>

      <section className="mistake-toolbar card" aria-label="Filter mistake journal">
        <div className="filter-tabs compact" role="group" aria-label="Mistake status">
          <Filter size={17} />
          {(
            [
              ['due', `Due ${counts.due}`],
              ['open', `Open ${counts.open}`],
              ['resolved', `Resolved ${counts.resolved}`],
              ['all', `All ${counts.all}`]
            ] as const
          ).map(([value, label]) => (
            <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>
              {label}
            </button>
          ))}
        </div>
        <label className="mistake-search">
          <Search size={16} />
          <span className="sr-only">Search mistake journal</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search question, category, cause…" />
        </label>
      </section>

      <aside className="guidance-warning" aria-label="Coaching-method notice">
        <AlertTriangle size={20} />
        <div>
          <strong>Cause labels and review dates are coaching tools</strong>
          <p>They are not EPSO classifications or a prediction of selection. Question wording, answer keys and source locators come from the linked publisher record.</p>
        </div>
      </aside>

      <section className="mistake-list" aria-live="polite">
        {visibleMistakes.map((mistake) => {
          const question = questions.find((item) => item.id === mistake.questionId);
          return (
            <MistakeCard
              key={mistake.id}
              mistake={mistake}
              question={question}
              onSave={(cause, note) => upsertMistake({ ...mistake, cause, note })}
              onReview={(days) => {
                const nextReview = new Date();
                nextReview.setDate(nextReview.getDate() + days);
                reviewMistake(mistake.id, nextReview.toISOString());
              }}
              onResolve={() => resolveMistake(mistake.id, !mistake.resolved)}
            />
          );
        })}

        {!visibleMistakes.length && (
          <div className="card mistake-empty">
            <CheckCircle2 size={30} />
            <h2>{state.mistakes.length ? 'No records match this view' : 'No mistakes recorded yet'}</h2>
            <p>{state.mistakes.length ? 'Try another status or search term.' : 'Incorrect answers from practice sessions will appear here for classification and follow-up.'}</p>
          </div>
        )}
      </section>
    </div>
  );
}

function MistakeCard({
  mistake,
  question,
  onSave,
  onReview,
  onResolve
}: {
  mistake: MistakeRecord;
  question?: StudyQuestion;
  onSave: (cause: MistakeCause, note?: string) => void;
  onReview: (days: number) => void;
  onResolve: () => void;
}) {
  const [cause, setCause] = useState<MistakeCause>(mistake.cause);
  const [note, setNote] = useState(mistake.note ?? '');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setCause(mistake.cause);
    setNote(mistake.note ?? '');
  }, [mistake.cause, mistake.note]);

  const dirty = cause !== mistake.cause || note.trim() !== (mistake.note ?? '').trim();
  const category = question?.category ?? mistake.category;

  const save = () => {
    onSave(cause, note.trim() || undefined);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  };

  return (
    <article className={`mistake-card card ${mistake.resolved ? 'resolved' : ''}`}>
      <div className="mistake-card-head">
        <div>
          <div className="mistake-tags">
            <span>PART {question?.phase ?? '—'}</span>
            {category && <span>{CATEGORY_LABELS[category]}</span>}
            <span>{mistake.resolved ? 'RESOLVED' : isDue(mistake, Date.now()) ? 'DUE NOW' : `NEXT ${formatDate(mistake.nextReviewAt)}`}</span>
          </div>
          <h2>{question?.title ?? `Question record ${mistake.questionId}`}</h2>
          <p>{question?.prompt ?? 'This question is no longer present in the embedded authenticated bank. The journal record has been retained.'}</p>
        </div>
        <div className="mistake-review-count"><strong>{mistake.reviewCount ?? 0}</strong><span>reviews</span></div>
      </div>

      {question ? <QuestionInspection question={question} /> : (
        <div className="practice-note"><AlertTriangle size={15} /><span>Source inspection is unavailable because the linked question record is missing.</span></div>
      )}

      <div className="mistake-edit-grid">
        <label className="field">
          <span>What caused this miss?</span>
          <select value={cause} onChange={(event) => { setCause(event.target.value as MistakeCause); setSaved(false); }}>
            {CAUSE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <small>Choose after comparing your reasoning with the published solution.</small>
        </label>
        <label className="field">
          <span>Correction note <small>(optional)</small></span>
          <textarea
            rows={4}
            value={note}
            onChange={(event) => { setNote(event.target.value); setSaved(false); }}
            placeholder="State the rule, clue or calculation you will use next time."
          />
        </label>
      </div>

      <div className="mistake-actions">
        <button className="button secondary" disabled={!dirty} onClick={save}>
          <Save size={16} /> {saved ? 'Saved' : 'Save classification'}
        </button>
        {!mistake.resolved && (
          <div className="mistake-review-actions" role="group" aria-label="Mark reviewed and schedule another review">
            <span>Reviewed; revisit in</span>
            {[1, 3, 7, 14].map((days) => (
              <button key={days} className="button ghost" onClick={() => onReview(days)}>{days}d</button>
            ))}
          </div>
        )}
        <button className={mistake.resolved ? 'button ghost' : 'button primary'} onClick={onResolve}>
          {mistake.resolved ? <><RotateCcw size={16} /> Reopen</> : <><CheckCircle2 size={16} /> Mark resolved</>}
        </button>
      </div>

      <footer className="mistake-meta">
        <span>Recorded {formatDate(mistake.createdAt)}</span>
        <span>Last reviewed {formatDate(mistake.lastReviewedAt)}</span>
        {mistake.attemptId && <span>Attempt {mistake.attemptId}</span>}
      </footer>
    </article>
  );
}

function QuestionInspection({ question }: { question: StudyQuestion }) {
  const correctOption = question.options.find((option) => option.id === question.correctOptionId);
  return (
    <details className="question-inspection">
      <summary>Inspect authentic item and published solution</summary>
      <div className="question-inspection-body">
        {question.context && <p className="question-context">{question.context}</p>}
        {question.table && (
          <div className="table-scroll">
            <table className="question-table">
              <caption>{question.table.caption}</caption>
              <thead><tr>{question.table.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
              <tbody>{question.table.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody>
            </table>
          </div>
        )}
        <h3>{question.prompt}</h3>
        <ol className="mistake-options" type="A">
          {question.options.map((option) => (
            <li key={option.id} className={option.id === question.correctOptionId ? 'correct' : ''}>{option.text}</li>
          ))}
        </ol>
        <div className="mistake-solution">
          <CheckCircle2 size={18} />
          <div><strong>Published key: {question.correctOptionId}</strong><p>{correctOption?.text}</p><small>{question.solution}</small></div>
        </div>
        <SourceBadge
          href={question.source.canonicalUrl}
          label={question.source.title}
          locator={`${question.source.locator}; answer: ${question.source.answerLocator}`}
        />
        <a className="text-link" href={question.source.canonicalUrl} target="_blank" rel="noreferrer">
          Verify at publisher <ExternalLink size={14} />
        </a>
      </div>
    </details>
  );
}
