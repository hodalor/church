export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`${className} card-surface rounded-[18px] border border-slate-200 bg-white p-3.5 text-slate-900 shadow-[0_12px_28px_rgba(15,23,42,0.08)]`}
      {...props}
    >
      {children}
    </div>
  );
}
