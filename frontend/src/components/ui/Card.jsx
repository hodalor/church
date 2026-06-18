export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`rounded-[18px] border border-white/8 bg-[linear-gradient(135deg,rgba(18,28,47,0.96),rgba(10,15,26,0.98))] p-3.5 text-white shadow-[0_12px_28px_rgba(0,0,0,0.18)] backdrop-blur-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
