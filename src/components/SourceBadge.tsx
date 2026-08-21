import { ExternalLink, ShieldCheck } from 'lucide-react';

export function SourceBadge({ href, label = 'Verified source', locator, compact = false }: {
  href: string;
  label?: string;
  locator?: string;
  compact?: boolean;
}) {
  return (
    <a className={`source-badge ${compact ? 'compact' : ''}`} href={href} target="_blank" rel="noreferrer">
      <ShieldCheck size={compact ? 14 : 16} />
      <span>{label}{locator ? ` · ${locator}` : ''}</span>
      <ExternalLink size={compact ? 12 : 14} />
    </a>
  );
}
