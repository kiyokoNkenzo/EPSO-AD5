import { ArrowRight, CheckCircle2, ExternalLink, FileCheck2, Filter, Info, Link2, LockKeyhole, Timer, Trophy } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { competition } from '../data/competition';
import { externalPracticeResources, type ExternalPracticeResource } from '../data/externalPractice';
import { testDefinitions } from '../data/questions';
import { useAppState } from '../state/AppState';
import type { QuestionCategory } from '../types';

type PracticeFilter = 'all' | '1' | '2' | 'external';
type SectionFilter = 'any' | QuestionCategory;

const SECTION_FILTERS: readonly (readonly [SectionFilter, string])[] = [
  ['any', 'Every section'],
  ['verbal', 'Verbal'],
  ['numerical', 'Numerical'],
  ['abstract', 'Abstract'],
  ['eu-knowledge', 'EU knowledge'],
  ['digital-skills', 'Digital skills']
];

/** Official EPSO sets first, because only they enter the readiness estimate. */
const EVIDENCE_ORDER = { 'official-epso-calibration': 0, 'transfer-practice': 1, 'phase2-background': 2 } as const;

interface ResultDraft {
  category: QuestionCategory;
  score: string;
  total: string;
  durationMinutes: string;
  note: string;
}

const guidedTraining = [
  { id: 'guided-phase1', phase: 'PART 1', title: 'Guided Part 1 repair set', description: 'Prioritises unseen and previously missed verbal and numerical EPSO samples.', accent: 'blue', focus: 'Accuracy + retrieval' },
  { id: 'guided-phase2', phase: 'PART 2', title: 'Guided Part 2 retrieval set', description: 'Prioritises unseen and missed EU knowledge and digital-skills EPSO samples.', accent: 'mint', focus: 'Knowledge retrieval' },
  { id: 'guided-weakness', phase: 'PART 1', title: 'Weakness repair drill', description: 'Puts unseen and repeatedly missed published Part 1 EPSO items first.', accent: 'coral', focus: 'Error repair' },
  { id: 'guided-pace', phase: 'PART 1', title: 'Pacing repair drill', description: 'Prioritises published Part 1 items where your recorded response time is slowest.', accent: 'gold', focus: 'Time control' },
  { id: 'guided-confidence', phase: 'PART 1', title: 'Confidence calibration drill', description: 'Targets overconfident errors and uncertain correct answers from published Part 1 items.', accent: 'coral', focus: 'Calibration' }
] as const;

export function PracticePage() {
  const { state, completeExternal } = useAppState();
  const [filter, setFilter] = useState<PracticeFilter>('all');
  const [section, setSection] = useState<SectionFilter>('any');
  const [loggingResource, setLoggingResource] = useState<ExternalPracticeResource | null>(null);
  const [savedResourceId, setSavedResourceId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [draft, setDraft] = useState<ResultDraft>({ category: 'verbal', score: '', total: '', durationMinutes: '', note: '' });
  const visibleTests = testDefinitions.filter((test) => filter === 'all' || filter === String(test.phase));
  const phaseExternalResources = externalPracticeResources
    .filter((resource) => filter === 'all' || filter === 'external' || filter === String(resource.phase));
  const visibleExternalResources = phaseExternalResources
    .filter((resource) => section === 'any' || resource.categories.includes(section))
    .sort((left, right) => EVIDENCE_ORDER[left.evidenceRole] - EVIDENCE_ORDER[right.evidenceRole]);
  const officialCount = visibleExternalResources.filter((resource) => resource.evidenceRole === 'official-epso-calibration').length;
  const visibleGuided = filter === 'external'
    ? []
    : guidedTraining.filter((training) => filter === 'all' || training.phase === `PART ${filter}`);

  const openLogger = (resource: ExternalPracticeResource) => {
    setLoggingResource(resource);
    setDraft({ category: resource.categories[0], score: '', total: '', durationMinutes: '', note: '' });
    setFormError('');
  };

  const closeLogger = () => {
    setLoggingResource(null);
    setFormError('');
  };

  const submitResult = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!loggingResource) return;
    const score = Number(draft.score);
    const total = Number(draft.total);
    const durationMinutes = Number(draft.durationMinutes);
    if (!Number.isInteger(score) || !Number.isInteger(total) || score < 0 || total < 1 || score > total) {
      setFormError('Enter whole scored-item counts, with the score between 0 and the total.');
      return;
    }
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0 || durationMinutes > 600) {
      setFormError('Enter a practice duration between 1 and 600 minutes.');
      return;
    }
    if (!loggingResource.categories.includes(draft.category)) {
      setFormError('Choose one of the categories covered by this source.');
      return;
    }
    completeExternal({
      resourceId: loggingResource.id,
      completedAt: new Date().toISOString(),
      category: draft.category,
      score,
      total,
      durationSeconds: Math.round(durationMinutes * 60),
      note: draft.note.trim() || undefined
    });
    setSavedResourceId(loggingResource.id);
    closeLogger();
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="REAL QUESTIONS · PUBLISHED SOLUTIONS"
        title="Practice room"
        description="Embedded sprints use only published EPSO sample items with official answer keys. Larger copyrighted banks open at their official source and are never copied into this app."
      />

      <div className="filter-tabs" role="group" aria-label="Filter practice resources">
        <Filter size={17} />
        {([['all', 'All'], ['1', 'Part 1'], ['2', 'Part 2'], ['external', 'Publisher links']] as const).map(([value, label]) => (
          <button key={value} className={filter === value ? 'active' : ''} onClick={() => { setFilter(value); setSection('any'); }}>{label}</button>
        ))}
      </div>

      {visibleGuided.length > 0 && (
        <section aria-labelledby="guided-training-title">
          <div className="section-heading">
            <div><p className="eyebrow">ADAPTIVE · AUTHENTIC ITEMS ONLY</p><h2 id="guided-training-title">Guided training</h2><p>These modes change order and focus only. They use the embedded, source-audited EPSO sample bank and never generate a question.</p></div>
          </div>
          <div className="practice-grid">
            {visibleGuided.map((training) => (
              <article key={training.id} className={`practice-card card accent-${training.accent}`}>
                <div className="practice-topline"><span>{training.phase}</span><span>ADAPTIVE ORDER</span></div>
                <div className="practice-icon"><FileCheck2 size={25} /></div>
                <h2>{training.title}</h2>
                <p>{training.description}</p>
                <div className="practice-stats"><span><Timer size={15} /> {training.focus}</span><span><LockKeyhole size={15} /> Published solutions</span></div>
                <div className="practice-note"><Info size={15} /><span>Repetition aids repair but becomes less diagnostic as the items grow familiar.</span></div>
                <Link className="button primary full-button" to={`/practice/${training.id}`}>Start guided drill <ArrowRight size={17} /></Link>
              </article>
            ))}
          </div>
        </section>
      )}

      {visibleTests.length > 0 && (
        <section aria-labelledby="fixed-training-title">
          <div className="section-heading">
            <div><p className="eyebrow">FIXED VERIFIED SPRINTS</p><h2 id="fixed-training-title">Published EPSO samples</h2><p>Fixed sets make repeat scores comparable, while familiarity should still be considered.</p></div>
          </div>
          <div className="practice-grid">
            {visibleTests.map((test) => {
              const attempts = state.attempts.filter((attempt) => attempt.testId === test.id);
              const best = attempts.reduce((value, attempt) => Math.max(value, Math.round((attempt.score / attempt.total) * 100)), 0);
              return (
                <article key={test.id} className={`practice-card card accent-${test.accent}`}>
                  <div className="practice-topline"><span>PART {test.phase}</span><span>{test.questionIds.length} items</span></div>
                  <div className="practice-icon"><FileCheck2 size={25} /></div>
                  <h2>{test.title}</h2>
                  <p>{test.description}</p>
                  <div className="practice-stats">
                    <span><Timer size={15} /> {Math.ceil(test.durationSeconds / 60)} min</span>
                    <span><LockKeyhole size={15} /> Official key</span>
                    {best > 0 && <span><Trophy size={15} /> Best {best}%</span>}
                  </div>
                  <div className="practice-note"><Info size={15} /><span>{test.officialFormatNote}</span></div>
                  <Link className="button primary full-button" to={`/practice/${test.id}`}>{attempts.length ? 'Try again' : 'Start sprint'} <ArrowRight size={17} /></Link>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {phaseExternalResources.length > 0 && (
        <section className="external-section">
          <div className="section-heading">
            <div><p className="eyebrow">CURATED PUBLISHER-HOSTED PRACTICE</p><h2>Open at the publisher</h2><p>Every entry exposes an answer trail. Only official EPSO samples enter the readiness estimate; transfer drills and EU background quizzes remain training evidence.</p></div>
          </div>
          <div className="filter-tabs compact-tabs" role="group" aria-label="Filter linked practice by test section">
            {SECTION_FILTERS.map(([value, label]) => (
              <button key={value} className={section === value ? 'active' : ''} aria-pressed={section === value} onClick={() => setSection(value)}>{label}</button>
            ))}
          </div>
          <p className="external-count" role="status">{visibleExternalResources.length ? `${visibleExternalResources.length} resource${visibleExternalResources.length === 1 ? '' : 's'}${officialCount ? `, ${officialCount} official EPSO` : ''}` : 'No linked resource covers this section for the selected part.'}</p>
          <div className="external-list">
            {visibleExternalResources.map((resource) => {
              const completions = state.externalCompletions.filter((entry) => entry.resourceId === resource.id);
              return (
                <article className="external-card card" key={resource.id}>
                  <div className="external-logo">{initials(resource.publisher)}</div>
                  <div className="external-main">
                    <div className="external-tags"><span>PART {resource.phase}</span><span>{resource.publisher}</span><span>{resource.kind}</span>{resource.reuse === 'link-only' && <span>LINK ONLY</span>}</div>
                    <h3>{resource.title}</h3>
                    <p>{resource.description}</p>
                    <div className="external-meta"><span><CheckCircle2 size={14} /> {resource.solutionStatus}</span><span><Link2 size={14} /> {resource.reuseNote}</span></div>
                    <details>
                      <summary className="text-button">Answers, access and licence</summary>
                      <p><strong>Solutions:</strong> {resource.solutionsNote}</p>
                      {resource.accessNote && <p><strong>Access:</strong> {resource.accessNote}</p>}
                      <p><strong>Evidence use:</strong> {resource.evidenceNote}</p>
                      <p><strong>Licence:</strong> {resource.licenceNote}</p>
                      <p><small>{resource.verificationNote ?? `Link checked ${resource.verifiedAt}.`} No prompts are copied into this app.</small></p>
                    </details>
                  </div>
                  <div className="external-actions">
                    <a className="button secondary" href={resource.url} target="_blank" rel="noreferrer">Open official resource <ExternalLink size={16} /></a>
                    {resource.solutionsUrl && <a className="text-link" href={resource.solutionsUrl} target="_blank" rel="noreferrer">Open answer material <ExternalLink size={14} /></a>}
                    <button className="text-button" onClick={() => openLogger(resource)} aria-label={`Log score and duration for ${resource.title}`}>Log score / result</button>
                    {completions.length > 0 && <small>{completionSummary(completions[0])} · {completions.length} logged</small>}
                    {savedResourceId === resource.id && <small role="status">Result saved locally.</small>}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="format-banner">
        <div><p className="eyebrow">OFFICIAL PART 1 FORMAT</p><h3>20 verbal · 10 numerical · 10 abstract</h3><p>35 + 20 + 10 minutes, in Language 1. The app’s embedded bank is smaller because it does not fabricate questions.</p></div>
        <a href={competition.noticeUrl} target="_blank" rel="noreferrer">See Tables 2–5 <ExternalLink size={15} /></a>
      </section>

      <Modal open={Boolean(loggingResource)} onClose={closeLogger} title="Log publisher-hosted result">
        {loggingResource && (
          <form className="settings-card" onSubmit={submitResult}>
            <p>
              Enter the score shown by <strong>{loggingResource.publisher}</strong> or calculated from its published answer material. {loggingResource.evidenceRole === 'official-epso-calibration'
                ? 'This official EPSO sample can enter the conservative readiness estimate, although repetition makes it less diagnostic.'
                : 'This result stays in your training log and cannot inflate the EPSO readiness estimate.'}
            </p>
            <div className="form-grid">
              <label className="field full">
                <span>Category</span>
                <select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as QuestionCategory })}>
                  {loggingResource.categories.map((category) => <option value={category} key={category}>{categoryLabel(category)}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Correct</span>
                <input type="number" inputMode="numeric" min="0" step="1" required value={draft.score} onChange={(event) => setDraft({ ...draft, score: event.target.value })} />
              </label>
              <label className="field">
                <span>Total scored items</span>
                <input type="number" inputMode="numeric" min="1" step="1" required value={draft.total} onChange={(event) => setDraft({ ...draft, total: event.target.value })} />
              </label>
              <label className="field full">
                <span>Duration in minutes</span>
                <input type="number" inputMode="decimal" min="1" max="600" step="0.5" required value={draft.durationMinutes} onChange={(event) => setDraft({ ...draft, durationMinutes: event.target.value })} />
              </label>
              <label className="field full">
                <span>Notes <small>optional</small></span>
                <textarea rows={3} value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} placeholder="Set used, pacing issue, or follow-up action" style={{ width: '100%', resize: 'vertical', border: '1px solid #ccd4d4', borderRadius: 10, padding: 12, color: 'inherit', background: '#fff', font: 'inherit' }} />
              </label>
            </div>
            {formError && <p className="field-error" role="alert"><Info size={15} /> {formError}</p>}
            <div className="data-actions">
              <button className="button secondary" type="button" onClick={closeLogger}>Cancel</button>
              <button className="button primary" type="submit">Save scored result</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

function initials(value: string) {
  return value.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function categoryLabel(category: QuestionCategory) {
  return category === 'eu-knowledge' ? 'EU knowledge' : category === 'digital-skills' ? 'Digital skills' : category.charAt(0).toUpperCase() + category.slice(1);
}

function completionSummary(completion: { score?: number; total?: number; durationSeconds?: number }) {
  const score = typeof completion.score === 'number' && typeof completion.total === 'number'
    ? `${completion.score}/${completion.total}`
    : 'Unscored';
  const duration = typeof completion.durationSeconds === 'number'
    ? ` · ${Math.round(completion.durationSeconds / 60)} min`
    : '';
  return `Latest ${score}${duration}`;
}
