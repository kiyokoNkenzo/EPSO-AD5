import { AlertCircle, ArrowLeft, ArrowRight, Check, Clock3, ExternalLink, Flag, Gauge, Pause, Play, RotateCcw, ShieldCheck, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { SourceBadge } from '../components/SourceBadge';
import { questions, testDefinitions } from '../data/questions';
import { buildGuidedTest, isGuidedTrainingMode } from '../lib/adaptiveTraining';
import { useAppState } from '../state/AppState';
import type { AnswerConfidence, StudyQuestion, TestAttempt, TestDefinition } from '../types';

type ViewState = 'intro' | 'test' | 'result';

export function TestSessionPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { state, saveAttempt, upsertMistake } = useAppState();
  const startingAttempts = useRef(state.attempts);
  const definition = useMemo<TestDefinition | undefined>(() => {
    const staticDefinition = testDefinitions.find((test) => test.id === testId);
    if (staticDefinition) return staticDefinition;
    const mode = testId?.startsWith('guided-') ? testId.slice('guided-'.length) : undefined;
    return isGuidedTrainingMode(mode) ? buildGuidedTest(mode, startingAttempts.current, questions) : undefined;
  }, [testId]);
  const selectedQuestions = useMemo(() => definition ? definition.questionIds.map((id) => questions.find((q) => q.id === id)).filter(Boolean) as StudyQuestion[] : [], [definition]);
  const [view, setView] = useState<ViewState>('intro');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confidences, setConfidences] = useState<Record<string, AnswerConfidence>>({});
  const [elapsedByQuestion, setElapsedByQuestion] = useState<Record<string, number>>({});
  const [remaining, setRemaining] = useState(definition?.durationSeconds ?? 0);
  const [paused, setPaused] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const startedAt = useRef(new Date());
  const submitted = useRef(false);

  useEffect(() => {
    if (view !== 'test' || paused || remaining <= 0) return;
    const activeQuestionId = selectedQuestions[current]?.id;
    const timer = window.setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1));
      if (activeQuestionId) {
        setElapsedByQuestion((value) => ({ ...value, [activeQuestionId]: (value[activeQuestionId] ?? 0) + 1 }));
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [view, paused, remaining, current, selectedQuestions]);

  useEffect(() => {
    if (view === 'test' && remaining === 0 && definition && !submitted.current) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, view, definition]);

  if (!definition || selectedQuestions.length === 0) {
    return <div className="page narrow-page"><div className="card not-found"><AlertCircle size={34} /><h1>Practice set unavailable</h1><Link className="button primary" to="/practice">Return to practice</Link></div></div>;
  }

  const question = selectedQuestions[current];
  const score = selectedQuestions.filter((item) => answers[item.id] === item.correctOptionId).length;

  function start() {
    submitted.current = false;
    startedAt.current = new Date();
    setRemaining(definition!.durationSeconds);
    setCurrent(0);
    setAnswers({});
    setConfidences({});
    setElapsedByQuestion({});
    setPaused(false);
    setReviewMode(false);
    setView('test');
  }

  function finish() {
    if (submitted.current) return;
    submitted.current = true;
    const completedAt = new Date();
    const attemptId = crypto.randomUUID();
    const attempt: TestAttempt = {
      id: attemptId,
      testId: definition!.id,
      title: definition!.title,
      phase: definition!.phase,
      category: definition!.category,
      startedAt: startedAt.current.toISOString(),
      completedAt: completedAt.toISOString(),
      durationSeconds: Math.max(0, definition!.durationSeconds - remaining),
      answers: selectedQuestions.map((item) => ({
        questionId: item.id,
        selectedOptionId: answers[item.id],
        correct: answers[item.id] === item.correctOptionId,
        confidence: confidences[item.id],
        elapsedSeconds: elapsedByQuestion[item.id] ?? 0
      })),
      score: selectedQuestions.filter((item) => answers[item.id] === item.correctOptionId).length,
      total: selectedQuestions.length
    };
    saveAttempt(attempt);
    const nextReview = new Date(completedAt.getTime() + 24 * 60 * 60 * 1000).toISOString();
    selectedQuestions.forEach((item) => {
      if (answers[item.id] === item.correctOptionId) return;
      upsertMistake({
        id: `${attemptId}:${item.id}`,
        questionId: item.id,
        attemptId,
        category: item.category,
        cause: 'other',
        note: 'Unclassified error — re-solve from the published prompt, then record the real cause.',
        nextReviewAt: nextReview
      });
    });
    setView('result');
  }

  if (view === 'intro') {
    return (
      <div className="session-page intro-page">
        <button className="back-button" onClick={() => navigate('/practice')}><ArrowLeft size={17} /> Practice room</button>
        <section className="session-intro card">
          <div className={`large-session-icon accent-${definition.accent}`}><ShieldCheck size={34} /></div>
          <p className="eyebrow">PART {definition.phase} · SOURCE-VERIFIED ITEMS</p>
          <h1>{definition.title}</h1>
          <p>{definition.description}</p>
          <div className="intro-stats"><div><strong>{selectedQuestions.length}</strong><span>published items</span></div><div><strong>{Math.ceil(definition.durationSeconds / 60)}</strong><span>minutes</span></div><div><strong>100%</strong><span>source-linked</span></div></div>
          <div className="session-rules"><h3>Before you begin</h3><ul><li>Use only the information in each prompt.</li><li>The timer is calibrated from the bundled source-backed item allowances.</li><li>Record confidence before moving on; active time is captured per item.</li><li>Solutions and exact answer-key locators unlock after submission.</li><li>{definition.officialFormatNote}</li></ul></div>
          <button className="button primary large-button" onClick={start}>Begin timed sprint <ArrowRight size={18} /></button>
          <a className="text-link" href={selectedQuestions[0].source.canonicalUrl} target="_blank" rel="noreferrer">Inspect source before starting <ExternalLink size={14} /></a>
        </section>
      </div>
    );
  }

  if (view === 'result') {
    const percent = Math.round((score / selectedQuestions.length) * 100);
    const reviewedQuestion = selectedQuestions[current];
    return (
      <div className="session-page results-page">
        {!reviewMode ? (
          <section className="result-summary card">
            <div className={`result-orb ${percent >= 70 ? 'success' : 'steady'}`}><strong>{score}/{selectedQuestions.length}</strong><span>{percent}%</span></div>
            <p className="eyebrow">SPRINT COMPLETE</p><h1>{percent >= 80 ? 'Sharp work.' : percent >= 50 ? 'A useful baseline.' : 'Now the learning starts.'}</h1>
            <p>Every item can be traced to the publisher’s prompt and answer key. Wrong or omitted answers have entered your repair journal for deliberate review.</p>
            <div className="result-actions"><button className="button primary" onClick={() => { setReviewMode(true); setCurrent(0); }}>Review answers <ArrowRight size={17} /></button><Link className="button secondary" to="/mistakes">Repair mistakes</Link><button className="button secondary" onClick={start}><RotateCcw size={17} /> Retake</button></div>
            <Link className="text-link" to="/practice">Back to practice room</Link>
          </section>
        ) : (
          <section className="review-result-layout">
            <header className="session-header"><button className="back-button" onClick={() => setReviewMode(false)}><ArrowLeft size={17} /> Score</button><div><strong>Answer review</strong><span>{current + 1} / {selectedQuestions.length}</span></div></header>
            <article className="question-card card">
              <div className="question-kicker"><span>{reviewedQuestion.category.replace('-', ' ')}</span><span>Question {current + 1}</span></div>
              {reviewedQuestion.context && <div className="question-context">{reviewedQuestion.context}</div>}
              {reviewedQuestion.table && <DataTable question={reviewedQuestion} />}
              <h2>{reviewedQuestion.prompt}</h2>
              <div className="options-list review-options">
                {reviewedQuestion.options.map((option) => {
                  const isCorrect = option.id === reviewedQuestion.correctOptionId;
                  const chosen = answers[reviewedQuestion.id] === option.id;
                  return <div key={option.id} className={`option-row ${isCorrect ? 'correct' : ''} ${chosen && !isCorrect ? 'wrong' : ''}`}><span>{option.id}</span><p>{option.text}</p>{isCorrect && <Check size={18} />}{chosen && !isCorrect && <X size={18} />}</div>;
                })}
              </div>
              <div className="solution-box"><p className="eyebrow">PUBLISHED SOLUTION</p><h3>{reviewedQuestion.solution}</h3><SourceBadge href={reviewedQuestion.source.canonicalUrl} label={reviewedQuestion.source.publisher} locator={`${reviewedQuestion.source.locator}; answer: ${reviewedQuestion.source.answerLocator}`} /></div>
              <div className="answer-diagnostics" aria-label="Recorded answer diagnostics">
                <span><Gauge size={15} /> Confidence <strong>{confidences[reviewedQuestion.id] ?? 'not recorded'}</strong></span>
                <span><Clock3 size={15} /> Active time <strong>{formatSeconds(elapsedByQuestion[reviewedQuestion.id] ?? 0)}</strong></span>
              </div>
              <div className="review-navigation"><button className="button secondary" disabled={current === 0} onClick={() => setCurrent((value) => value - 1)}><ArrowLeft size={16} /> Previous</button><button className="button primary" disabled={current === selectedQuestions.length - 1} onClick={() => setCurrent((value) => value + 1)}>Next <ArrowRight size={16} /></button></div>
            </article>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="session-page active-session">
      <header className="session-header">
        <button className="back-button" onClick={() => navigate('/practice')}><X size={18} /> Exit</button>
        <div><strong>{definition.title}</strong><span>Question {current + 1} of {selectedQuestions.length}</span></div>
        <div className={`timer-chip ${remaining < 60 ? 'urgent' : ''}`}><Clock3 size={16} /> {formatSeconds(remaining)}</div>
      </header>
      <div className="session-progress"><span style={{ width: `${((current + 1) / selectedQuestions.length) * 100}%` }} /></div>
      <div className="question-layout">
        <aside className="question-map card">
          <p className="eyebrow">QUESTION MAP</p>
          <div>{selectedQuestions.map((item, index) => <button key={item.id} onClick={() => setCurrent(index)} className={`${index === current ? 'active' : ''} ${answers[item.id] ? 'answered' : ''}`}>{index + 1}</button>)}</div>
          <button className="pause-button" onClick={() => setPaused((value) => !value)}>{paused ? <Play size={16} /> : <Pause size={16} />}{paused ? 'Resume' : 'Pause'}</button>
        </aside>
        <article className="question-card card">
          {paused && <div className="paused-overlay"><Pause size={32} /><h2>Timer paused</h2><button className="button primary" onClick={() => setPaused(false)}>Resume</button></div>}
          <div className="question-kicker"><span>{question.category.replace('-', ' ')}</span><span>{question.source.publisher} sample</span></div>
          {question.context && <div className="question-context">{question.context}</div>}
          {question.table && <DataTable question={question} />}
          <h1>{question.prompt}</h1>
          <div className="options-list">
            {question.options.map((option) => (
              <button key={option.id} className={`option-row ${answers[question.id] === option.id ? 'selected' : ''}`} onClick={() => setAnswers({ ...answers, [question.id]: option.id })}>
                <span>{option.id}</span><p>{option.text}</p>{answers[question.id] === option.id && <Check size={18} />}
              </button>
            ))}
          </div>
          <div className="confidence-check" role="group" aria-label="Confidence in this answer">
            <div><Gauge size={17} /><span><strong>Confidence before checking</strong><small>This calibrates judgment; it does not change your score.</small></span></div>
            <div>
              {(['low', 'medium', 'high'] as const).map((level) => (
                <button key={level} type="button" aria-pressed={confidences[question.id] === level} className={confidences[question.id] === level ? 'selected' : ''} onClick={() => setConfidences((value) => ({ ...value, [question.id]: level }))}>{level}</button>
              ))}
            </div>
          </div>
          <div className="question-footer">
            <button className="button secondary" disabled={current === 0} onClick={() => setCurrent((value) => value - 1)}><ArrowLeft size={16} /> Back</button>
            {current === selectedQuestions.length - 1 ? <button className="button primary" onClick={finish}><Flag size={16} /> Submit {Object.keys(answers).length}/{selectedQuestions.length}</button> : <button className="button primary" onClick={() => setCurrent((value) => value + 1)}>Next <ArrowRight size={16} /></button>}
          </div>
        </article>
      </div>
    </div>
  );
}

function DataTable({ question }: { question: StudyQuestion }) {
  if (!question.table) return null;
  return <div className="table-scroll"><table className="question-table"><caption>{question.table.caption}</caption><thead><tr>{question.table.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{question.table.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody></table></div>;
}

function formatSeconds(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
