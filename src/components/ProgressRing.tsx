export function ProgressRing({ value, size = 92, label }: { value: number; size?: number; label?: string }) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div className="progress-ring" style={{ '--progress': `${safe * 3.6}deg`, width: size, height: size } as React.CSSProperties}>
      <div className="progress-ring-inner">
        <strong>{Math.round(safe)}%</strong>
        {label && <small>{label}</small>}
      </div>
    </div>
  );
}
