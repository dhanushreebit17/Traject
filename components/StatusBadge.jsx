// components/StatusBadge.jsx
const STYLES = {
  pending: 'bg-terracotta/15 text-terracotta',
  approved: 'bg-sage/15 text-sage',
  revise: 'bg-rose/15 text-rose',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${STYLES[status] || ''}`}>
      {status}
    </span>
  );
}