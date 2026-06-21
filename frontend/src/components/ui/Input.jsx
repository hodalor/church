import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { label, error, className = '', labelClassName = 'text-white/75', ...props },
  ref,
) {
  return (
    <label className="block space-y-1.5">
      {label ? <span className={`text-[13px] font-medium ${labelClassName}`}>{label}</span> : null}
      <input
        ref={ref}
        className={`w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-accent focus:ring-2 focus:ring-accent/20 ${className}`}
        {...props}
      />
      {error ? <span className="text-[13px] text-red-600">{error}</span> : null}
    </label>
  );
});

export default Input;
