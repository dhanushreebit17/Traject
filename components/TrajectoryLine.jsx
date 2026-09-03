const MILESTONES = ['Idea', 'Review 1', 'Review 2', 'Final'];

export default function TrajectoryLine({ current = 0, size = 'lg', status = 'pending' }) {
  const dotColor = { pending: 'bg-terracotta', approved: 'bg-sage', revise: 'bg-rose' }[status];
  const isSmall = size === 'sm';

  return (
    <div className={`flex items-center ${isSmall ? 'gap-1' : 'gap-2'}`}>
      {MILESTONES.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`rounded-full ${isSmall ? 'w-2 h-2' : 'w-3.5 h-3.5'} ${
                i < current ? 'bg-ink' : i === current ? dotColor : 'bg-ink/15'
              }`}
            />
            {!isSmall && <span className="mt-1 text-xs text-ink/50">{label}</span>}
          </div>
          {i < MILESTONES.length - 1 && (
            <div
              className={`${isSmall ? 'w-4' : 'w-10'} border-t-2 ${
                i < current ? 'border-ink border-solid' : 'border-ink/25 border-dotted'
              } mx-1`}
            />
          )}
        </div>
      ))}
    </div>
  );
}