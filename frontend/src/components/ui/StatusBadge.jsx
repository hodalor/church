export default function StatusBadge({ status }) {
  const normalizedStatus = String(status || '').toLowerCase();
  const isActive = normalizedStatus === 'active';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
        isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
      }`}
    >
      {isActive ? 'Active' : 'Suspended'}
    </span>
  );
}
