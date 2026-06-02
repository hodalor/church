export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`rounded-[20px] border border-white/8 bg-[#0d1320] p-4 text-white shadow-[0_14px_32px_rgba(0,0,0,0.16)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
