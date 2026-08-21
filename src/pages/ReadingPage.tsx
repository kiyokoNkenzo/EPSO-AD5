import { ArrowLeft, Check, CheckCircle2, Clock3, ExternalLink, ShieldCheck } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { SourceBadge } from '../components/SourceBadge';
import { phase2Readings } from '../data/readings';
import { useAppState } from '../state/AppState';

export function ReadingPage() {
  const { readingId } = useParams();
  const { state, toggleReading } = useAppState();
  const reading = phase2Readings.find((item) => item.id === readingId);
  if (!reading) return <div className="page narrow-page"><div className="card not-found"><h1>Reading not found</h1><Link className="button primary" to="/library">Return to library</Link></div></div>;
  const completed = state.completedReadings.includes(reading.id);
  return (
    <article className="reading-page">
      <header className="reading-header">
        <Link className="back-button" to="/library"><ArrowLeft size={17} /> Library</Link>
        <div className="reading-heading"><p className="eyebrow">{reading.eyebrow} · PHASE 2 GUIDANCE</p><h1>{reading.title}</h1><p>{reading.summary}</p><div><span><Clock3 size={15} /> {reading.minutes} minute read</span><span><ShieldCheck size={15} /> Official sources only</span></div></div>
      </header>
      <div className="reading-layout">
        <aside className="reading-toc card"><p className="eyebrow">IN THIS BRIEF</p>{reading.sections.map((section, index) => <a key={section.heading} href={`#section-${index + 1}`}><span>{String(index + 1).padStart(2, '0')}</span>{section.heading}</a>)}</aside>
        <div className="reading-article card">
          <div className="interim-label"><ShieldCheck size={18} /><p><strong>Official-EU background</strong> · Not the future EPSO source pack</p></div>
          {reading.sections.map((section, index) => (
            <section id={`section-${index + 1}`} key={section.heading}>
              <p className="section-number">{String(index + 1).padStart(2, '0')}</p><h2>{section.heading}</h2>
              {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.bullets && <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
              <div className="section-sources"><p className="eyebrow">CHECK THE SOURCE</p>{section.sources.map((source) => <SourceBadge key={`${source.url}-${source.locator}`} href={source.url} label={source.title} locator={source.locator} compact />)}</div>
            </section>
          ))}
          <div className="reading-finish"><CheckCircle2 size={28} /><div><h3>{completed ? 'Brief completed' : 'Finished reading?'}</h3><p>Marking this complete updates your local study plan.</p></div><button className={`button ${completed ? 'secondary' : 'primary'}`} onClick={() => toggleReading(reading.id)}>{completed ? <><Check size={17} /> Completed</> : 'Mark complete'}</button></div>
        </div>
      </div>
    </article>
  );
}
