import { ArrowLeft, ArrowRight, BookOpen, Brain, CheckCircle2, Download, Flame, Layers3, ListChecks, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { SourceBadge } from '../components/SourceBadge';
import { phase2Cards, phase2Deck, type Phase2Card } from '../data/cards';
import { isDue } from '../lib/spacedRepetition';
import { useAppState } from '../state/AppState';
import type { ReviewRating } from '../types';

type ReviewView = 'overview' | 'session' | 'complete';

export function ReviewPage() {
  const { state, gradeCard } = useAppState();
  const [view, setView] = useState<ReviewView>('overview');
  const [showAnswer, setShowAnswer] = useState(false);
  const [position, setPosition] = useState(0);
  const [reviewed, setReviewed] = useState(0);
  const [topic, setTopic] = useState('all');
  const [sessionCardIds, setSessionCardIds] = useState<string[]>([]);

  const dueCards = useMemo(() => phase2Cards.filter((card) => topic === 'all' || card.topic === topic).filter((card) => isDue(state.schedules[card.id])).slice(0, 20), [state.schedules, topic]);
  const sessionCards = useMemo(
    () => sessionCardIds.map((id) => phase2Cards.find((card) => card.id === id)).filter(Boolean) as Phase2Card[],
    [sessionCardIds]
  );
  const seen = Object.values(state.schedules).filter((schedule) => schedule.repetitions > 0).length;
  const mature = Object.values(state.schedules).filter((schedule) => schedule.intervalDays >= 14).length;
  const topics = [...new Set(phase2Cards.map((card) => card.topic))];

  const begin = () => {
    setSessionCardIds(dueCards.map((card) => card.id));
    setPosition(0);
    setReviewed(0);
    setShowAnswer(false);
    setView(dueCards.length ? 'session' : 'complete');
  };

  const grade = (rating: ReviewRating) => {
    const card = sessionCards[position];
    if (!card) return;
    gradeCard(card.id, rating);
    const nextReviewed = reviewed + 1;
    setReviewed(nextReviewed);
    if (position >= sessionCards.length - 1) setView('complete');
    else {
      setPosition((value) => value + 1);
      setShowAnswer(false);
    }
  };

  if (view === 'session' && sessionCards[position]) {
    const card = sessionCards[position];
    return <ReviewSession card={card} current={position + 1} total={sessionCards.length} showAnswer={showAnswer} setShowAnswer={setShowAnswer} grade={grade} exit={() => setView('overview')} />;
  }

  if (view === 'complete') {
    return (
      <div className="page narrow-page review-complete-page">
        <section className="card review-complete">
          <div className="complete-burst"><Sparkles size={36} /></div>
          <p className="eyebrow">REVIEW COMPLETE</p>
          <h1>{reviewed ? `${reviewed} cards strengthened` : 'Nothing due right now'}</h1>
          <p>{reviewed ? 'Your next intervals have been scheduled locally. Keep checking sources for high-volatility cards.' : 'The scheduler will bring cards back when they are due.'}</p>
          <button className="button primary" onClick={() => setView('overview')}>Back to deck</button>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="SPACED RETRIEVAL · OFFLINE READY"
        title="Phase 2 review"
        description="An SM-2-style queue for official-EU background and EPSO guidance. It is deliberately labelled as interim until EPSO publishes its definitive knowledge source pack."
        actions={<><Link className="button primary" to="/mistakes"><ListChecks size={17} /> Error journal</Link><Link className="button secondary" to="/library"><BookOpen size={17} /> Readings</Link><a className="button secondary" href="/downloads/epso-ad5-phase2.apkg" download><Download size={17} /> Anki deck</a></>}
      />

      <section className="review-hero card">
        <div className="deck-illustration"><Layers3 size={45} /><span>{phase2Cards.length}</span></div>
        <div className="review-hero-copy"><p className="eyebrow">EPSO AD5 · PHASE 2</p><h2>{dueCards.length} cards ready today</h2><p>{phase2Deck.disclaimer}</p><div className="review-downloads"><a href="/downloads/epso-ad5-phase2.apkg" download>.APKG for Anki</a><span>·</span><a href="/downloads/epso-ad5-phase2.tsv" download>TSV fallback</a></div></div>
        <button className="button primary large-button" onClick={begin}>{dueCards.length ? 'Start review' : 'Check queue'} <ArrowRight size={18} /></button>
      </section>

      <section className="review-metrics">
        <div className="card"><Brain size={21} /><strong>{seen}</strong><span>cards seen</span></div>
        <div className="card"><CheckCircle2 size={21} /><strong>{mature}</strong><span>mature cards</span></div>
        <div className="card"><RotateCcw size={21} /><strong>{dueCards.length}</strong><span>due now</span></div>
        <div className="card"><ShieldCheck size={21} /><strong>100%</strong><span>source-linked</span></div>
      </section>

      <section className="card topic-browser">
        <div className="section-heading"><div><p className="eyebrow">FILTER QUEUE</p><h2>Knowledge areas</h2></div></div>
        <div className="topic-pills"><button className={topic === 'all' ? 'active' : ''} onClick={() => setTopic('all')}>All topics <span>{phase2Cards.length}</span></button>{topics.map((item) => <button key={item} className={topic === item ? 'active' : ''} onClick={() => setTopic(item)}>{item} <span>{phase2Cards.filter((card) => card.topic === item).length}</span></button>)}</div>
      </section>

      <section className="guidance-warning">
        <Flame size={20} /><div><strong>Update discipline matters</strong><p>Cards marked medium or high volatility should be rechecked before Part 2. Office-holders and current priorities are especially time-sensitive.</p></div>
      </section>
    </div>
  );
}

function ReviewSession({ card, current, total, showAnswer, setShowAnswer, grade, exit }: { card: Phase2Card; current: number; total: number; showAnswer: boolean; setShowAnswer: (value: boolean) => void; grade: (rating: ReviewRating) => void; exit: () => void }) {
  return (
    <div className="review-session-page">
      <header className="review-session-header"><button className="back-button" onClick={exit}><ArrowLeft size={17} /> Exit review</button><div><span>{current} / {total}</span><div className="review-progress"><i style={{ width: `${(current / total) * 100}%` }} /></div></div><span className={`volatility ${card.source.volatility.toLowerCase()}`}>{card.source.volatility} volatility</span></header>
      <div className="review-card-stage">
        <article className={`flashcard ${showAnswer ? 'revealed' : ''}`}>
          <div className="flashcard-top"><span>{card.topic}</span><span>{card.source.source_tier.replaceAll('_', ' ')}</span></div>
          <div className="flashcard-content">
            <p className="eyebrow">PROMPT</p><h1>{card.front}</h1>
            {showAnswer && <div className="flash-answer"><p className="eyebrow">ANSWER</p><h2>{card.back}</h2><p>{card.detail}</p><SourceBadge href={card.source.url} label={card.source.source_title} locator={card.source.locator} /></div>}
          </div>
          {!showAnswer ? <button className="button primary reveal-button" onClick={() => setShowAnswer(true)}>Reveal answer</button> : <div className="rating-row"><button onClick={() => grade('again')}><strong>Again</strong><small>1 day</small></button><button onClick={() => grade('hard')}><strong>Hard</strong><small>shorter</small></button><button onClick={() => grade('good')}><strong>Good</strong><small>normal</small></button><button onClick={() => grade('easy')}><strong>Easy</strong><small>longer</small></button></div>}
        </article>
      </div>
    </div>
  );
}
