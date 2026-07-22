export default function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}) {
  const variants = {
    primary:
      'border border-white/10 bg-[#141c2b] text-white hover:bg-[#1a2436] hover:border-white/15',
    secondary:
      'bg-[#d1aa47] text-[#111827] shadow-[0_12px_28px_rgba(201,168,76,0.22)] hover:bg-[#ddb962]',
    ghost:
      'border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:border-white/15',
    subtle:
      'border border-slate-300 bg-white text-slate-800 hover:border-accent/35 hover:bg-slate-50 hover:text-slate-900',
  };

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-xl px-3.5 py-2.5 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
