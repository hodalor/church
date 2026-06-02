export default function Badge({ children, tone = 'primary' }) {
  const tones = {
    primary: 'bg-white/10 text-white',
    accent: 'bg-accent/20 text-accent',
    success: 'bg-emerald-500/15 text-emerald-300',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${tones[tone]}`}>
      {children}
    </span>
  );
}
