import { ArrowRight, BookMarked, Check, Clock3, Download, FileText, Info, LibraryBig, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { phase2Readings } from '../data/readings';
import { useAppState } from '../state/AppState';

export function LibraryPage() {
  const { state } = useAppState();
  return (
    <div className="page">
      <PageHeader
        eyebrow="OFFLINE PHASE 2 READER"
        title="Study library"
        description="Concise readings built from official EU and EPSO publications. These are cited background notes—not the definitive EU Knowledge source pack, which EPSO has not yet published."
        actions={<a className="button secondary" href="/downloads/epso-ad5-phase2.apkg" download><Download size={17} /> Export deck</a>}
      />

      <section className="library-banner">
        <div className="library-banner-icon"><LibraryBig size={34} /></div>
        <div><p className="eyebrow">READ NOW · REVIEW LATER</p><h2>Seven briefs, one provenance trail</h2><p>Each section cites an official source and exact locator. Finish a brief, then retrieve its facts in the review queue or Anki.</p></div>
        <div className="library-progress"><strong>{state.completedReadings.length}/{phase2Readings.length}</strong><span>completed</span></div>
      </section>

      <section className="reading-grid">
        {phase2Readings.map((reading, index) => {
          const complete = state.completedReadings.includes(reading.id);
          return (
            <Link key={reading.id} to={`/library/${reading.id}`} className={`reading-card card reading-${(index % 4) + 1}`}>
              <div className="reading-number">{complete ? <Check size={18} /> : String(index + 1).padStart(2, '0')}</div>
              <div className="reading-body"><div className="reading-meta"><span>{reading.eyebrow}</span><span><Clock3 size={13} /> {reading.minutes} min</span></div><h2>{reading.title}</h2><p>{reading.summary}</p><div className="reading-source-count"><ShieldCheck size={14} /> {countSources(reading)} cited sections</div></div>
              <ArrowRight className="reading-arrow" size={19} />
            </Link>
          );
        })}
      </section>

      <section className="offline-note card">
        <div><Info size={21} /></div><div><h3>Designed for offline use</h3><p>The briefs, flashcards and source metadata are included in the installed web app. External source links need connectivity when you want to audit the original.</p></div><a href="/downloads/epso-ad5-phase2.tsv" download>Download TSV <Download size={15} /></a>
      </section>
    </div>
  );
}

function countSources(reading: (typeof phase2Readings)[number]) {
  return reading.sections.reduce((sum, section) => sum + section.sources.length, 0);
}
