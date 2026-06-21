import { useEffect, useMemo, useRef, useState } from 'react';

export default function PinInput({
  value = '',
  onChange,
  length = 6,
  minLength = 4,
  error,
  tone = 'dark',
}) {
  const normalizedLength = Math.max(minLength, Math.min(length, 6));
  const refs = useRef([]);
  const initialDigits = useMemo(() => {
    const digits = value.split('').filter((char) => /\d/.test(char)).slice(0, normalizedLength);
    return [...digits, ...Array(normalizedLength - digits.length).fill('')];
  }, [value, normalizedLength]);
  const [digits, setDigits] = useState(initialDigits);

  useEffect(() => {
    setDigits(initialDigits);
  }, [initialDigits]);

  const emitChange = (nextDigits) => {
    setDigits(nextDigits);
    onChange?.(nextDigits.join('').trim());
  };

  const handleChange = (index, rawValue) => {
    const nextValue = rawValue.replace(/\D/g, '').slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = nextValue;
    emitChange(nextDigits);

    if (nextValue && index < normalizedLength - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus();
    }

    if (event.key === 'ArrowRight' && index < normalizedLength - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, normalizedLength)
      .split('');

    if (!pasted.length) {
      return;
    }

    const nextDigits = [...Array(normalizedLength).fill('')];
    pasted.forEach((digit, index) => {
      nextDigits[index] = digit;
    });
    emitChange(nextDigits);
    refs.current[Math.min(pasted.length, normalizedLength) - 1]?.focus();
  };

  const inputClass = tone === 'light'
    ? 'h-12 w-10 rounded-2xl border border-slate-300 bg-white text-center text-base font-semibold text-slate-900 shadow-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30 sm:h-14 sm:w-12 sm:text-lg'
    : 'h-12 w-10 rounded-2xl border border-white/10 bg-[#0f172a] text-center text-base font-semibold text-white shadow-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30 sm:h-14 sm:w-12 sm:text-lg';
  const helperClass = tone === 'light' ? 'text-xs text-slate-500' : 'text-xs text-white/45';
  const errorClass = tone === 'light' ? 'text-sm text-red-600' : 'text-sm text-red-400';

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              refs.current[index] = element;
            }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={digit}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            className={inputClass}
          />
        ))}
      </div>
      <p className={helperClass}>Enter 4 to 6 digits.</p>
      {error ? <span className={errorClass}>{error}</span> : null}
    </div>
  );
}
