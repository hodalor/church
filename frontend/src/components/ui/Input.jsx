import { forwardRef } from 'react';

const Input = forwardRef(function Input({ label, error, className = '', ...props }, ref) {
  return (
    <label className="block space-y-1.5">
      {label ? <span className="text-[13px] font-medium text-white/75">{label}</span> : null}
      <input
        ref={ref}
        className={`w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white shadow-sm outline-none transition placeholder:text-white/28 focus:border-accent focus:ring-2 focus:ring-accent/20 ${className}`}
        {...props}
      />
      {error ? <span className="text-[13px] text-red-600">{error}</span> : null}
    </label>
  );
});

export default Input;
