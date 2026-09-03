// components/ContributionBar.jsx
export default function ContributionBar({ name, count, average, onExpand, expanded, logs }) {
  const pct = average > 0 ? Math.min(100, Math.round((count / (average * 2)) * 100)) : count > 0 ? 100 : 0;
  const zero = count === 0;

  return (
    <div className="mb-3">
      <div
        className="flex items-center justify-between text-sm cursor-pointer"
        onClick={onExpand}
      >
        <span>{name} {zero && <span className="text-rose">⚠</span>}</span>
        <span className="mono-timestamp">{count} updates</span>
      </div>
      <div className={`h-3 rounded-full mt-1 ${zero ? 'border border-rose bg-transparent' : 'bg-ink/10'}`}>
        {!zero && <div className="h-3 rounded-full bg-sage" style={{ width: `${pct}%` }} />}
      </div>
      {expanded && (
        <div className="mt-2 pl-2 border-l-2 border-ink/10 space-y-1">
          {logs.length === 0 ? (
            <p className="text-xs text-ink/40">No updates logged yet this period.</p>
          ) : (
            logs.map((l) => (
              <p key={l.id} className="text-xs text-ink/70">
                <span className="mono-timestamp mr-1">{new Date(l.created_at).toLocaleDateString()}</span>
                {l.update_text}
              </p>
            ))
          )}
        </div>
      )}
    </div>
  );
}