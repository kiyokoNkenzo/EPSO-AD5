import { ArrowRight, CheckCircle2, ExternalLink, FileCheck2, Filter, Info, Search, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { ASSESSMENT_SOURCES } from '../data/assessmentFramework';
import { phase2Cards } from '../data/cards';
import { competition, officialUpdateStatus } from '../data/competition';
import { externalPracticeResources } from '../data/externalPractice';
import { questions } from '../data/questions';

type SourceRow = {
  id: string;
  publisher: string;
  title: string;
  url: string;
  locator: string;
  tier: string;
  answer: string;
  answerUrl?: string;
  verified: string;
  status: 'official' | 'embedded' | 'background' | 'link-only';
};

const OFFICIAL_TIER_LABELS = {
  'official-binding': 'Binding rule',
  'official-guidance': 'EPSO guidance',
  'official-technical-framework': 'Technical framework',
  'official-informational-consolidation': 'Info only'
} as const;

export function SourcesPage() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | SourceRow['status']>('all');
  const rows = useMemo<SourceRow[]>(() => {
    const officialRows = ASSESSMENT_SOURCES.map((source) => ({
      id: source.id,
      publisher: source.publisher,
      title: source.title,
      url: source.url,
      locator: source.locator,
      tier: OFFICIAL_TIER_LABELS[source.classification],
      answer: 'note' in source ? source.note : 'Competition rule or timing source',
      verified: source.verifiedAt,
      status: 'official' as const
    }));
    const questionRows = questions.map((question) => ({
      id: question.id,
      publisher: question.source.publisher,
      title: `${question.source.title} · ${question.source.itemId}`,
      url: question.source.canonicalUrl,
      locator: question.source.locator,
      tier: 'Published sample',
      answer: question.source.answerLocator,
      verified: question.source.verifiedAt,
      status: 'embedded' as const
    }));
    const cardRows = phase2Cards.map((card) => ({
      id: card.id,
      publisher: card.source.source_title,
      title: card.front,
      url: card.source.url,
      locator: card.source.locator,
      tier: card.source.source_tier.replaceAll('_', ' '),
      answer: 'Fact evidenced at locator',
      verified: card.source.verified_at,
      status: 'background' as const
    }));
    const externalRows = externalPracticeResources.map((resource) => ({
      id: resource.id,
      publisher: resource.publisher,
      title: resource.title,
      url: resource.url,
      locator: resource.kind,
      tier: resource.evidenceRole === 'official-epso-calibration'
        ? 'EPSO calibration'
        : resource.evidenceRole === 'phase2-background'
          ? 'EU background'
          : 'Transfer practice',
      answer: resource.solutionStatus,
      answerUrl: resource.solutionsUrl,
      verified: resource.verifiedAt,
      status: 'link-only' as const
    }));
    return [...officialRows, ...questionRows, ...cardRows, ...externalRows];
  }, []);

  const filtered = rows.filter((row) => {
    const matchesStatus = status === 'all' || row.status === status;
    const haystack = `${row.publisher} ${row.title} ${row.locator} ${row.tier}`.toLowerCase();
    return matchesStatus && haystack.includes(query.toLowerCase());
  });

  const groupedCount = {
    embedded: questions.length,
    background: phase2Cards.length,
    'link-only': externalPracticeResources.length
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="PROVENANCE REGISTER"
        title="Trust, then verify"
        description="Every competition rule source, embedded question, fact card and external practice recommendation is listed here with its publisher, exact locator, answer trail and verification date."
        actions={<a className="button secondary" href={competition.bindingNoticeUrl} target="_blank" rel="noreferrer">Binding notice <ExternalLink size={16} /></a>}
      />

      <section className="source-policy-grid">
        <article className="card policy-card"><span className="policy-icon blue"><FileCheck2 size={23} /></span><div><strong>{groupedCount.embedded}</strong><h3>Embedded questions</h3><p>Published EPSO examples, reproduced with item-level answer-key links.</p></div></article>
        <article className="card policy-card"><span className="policy-icon mint"><ShieldCheck size={23} /></span><div><strong>{groupedCount.background}</strong><h3>Phase 2 cards</h3><p>Derived from official EU texts; never presented as real EPSO questions.</p></div></article>
        <article className="card policy-card"><span className="policy-icon gold"><ExternalLink size={23} /></span><div><strong>{groupedCount['link-only']}</strong><h3>Link-only banks</h3><p>Answer-backed publisher resources kept at source, with EPSO calibration separated from transfer practice.</p></div></article>
      </section>

      <section className="source-pack-alert card">
        <div className="alert-mark"><TriangleAlert size={24} /></div><div><p className="eyebrow">KNOWN GAP · NOT CONCEALED</p><h2>{officialUpdateStatus.title}</h2><p>{officialUpdateStatus.body}</p></div><a href={competition.sourcePackFaqUrl} target="_blank" rel="noreferrer">Check EPSO <ExternalLink size={15} /></a>
      </section>

      <section className="source-register card">
        <div className="source-toolbar">
          <label><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search publisher, title or locator" /></label>
          <div className="filter-tabs compact"><Filter size={16} />{(['all', 'official', 'embedded', 'background', 'link-only'] as const).map((value) => <button key={value} className={status === value ? 'active' : ''} onClick={() => setStatus(value)}>{value === 'all' ? 'All' : value.replace('-', ' ')}</button>)}</div>
        </div>
        <div className="source-table-wrap">
          <table className="source-table">
            <thead><tr><th>Publisher & item</th><th>Locator</th><th>Evidence</th><th>Tier</th><th>Checked</th><th /></tr></thead>
            <tbody>{filtered.map((row) => <tr key={`${row.status}-${row.id}`}><td><span className={`source-status ${row.status}`} /> <div><strong>{row.publisher}</strong><small>{row.title}</small></div></td><td>{row.locator}</td><td>{row.answerUrl ? <a className="evidence-link" href={row.answerUrl} target="_blank" rel="noreferrer">{row.answer} <ExternalLink size={12} /></a> : row.answer}</td><td><span className="tier-tag">{row.tier}</span></td><td>{row.verified}</td><td><a href={row.url} target="_blank" rel="noreferrer" aria-label={`Open source for ${row.title}`}><ArrowRight size={16} /></a></td></tr>)}</tbody>
          </table>
          {filtered.length === 0 && <div className="empty-table"><Info size={22} /><p>No source matches that filter.</p></div>}
        </div>
      </section>

      <section className="method-card">
        <CheckCircle2 size={21} /><div><h3>Content rule</h3><p>If a resource has no published solution, it does not enter the practice catalog. If reuse rights are restrictive, the app links out and stores only your completion—not the copyrighted prompt.</p></div>
      </section>
    </div>
  );
}
