export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`card-surface rounded-2xl border border-[#e8e1d3] bg-white p-4 text-slate-900 shadow-[0_2px_12px_rgba(15,23,42,0.05)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
