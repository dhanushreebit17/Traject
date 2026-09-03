// components/EmptyState.jsx
export default function EmptyState({ title, body, cta }) {
  return (
    <div className="text-center py-12 border border-dashed border-ink/20 rounded-xl">
      <p className="font-serif text-lg text-ink mb-1">{title}</p>
      <p className="text-sm text-ink/60 mb-4">{body}</p>
      {cta}
    </div>
  );
}