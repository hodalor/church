import { useEffect, useState } from 'react';

export default function AttendanceCounter({ count = 0, animated = true, label = 'Checked In' }) {
  const [displayCount, setDisplayCount] = useState(animated ? 0 : count);

  useEffect(() => {
    if (!animated) {
      setDisplayCount(count);
      return undefined;
    }

    const duration = 500;
    const start = performance.now();
    let frameId;

    const tick = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      setDisplayCount(Math.round(progress * count));
      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [animated, count]);

  return (
    <div className="text-center">
      <p className="text-[12px] uppercase tracking-[0.28em] text-[#f3deb0]/80">{label}</p>
      <p className="mt-2 text-5xl font-semibold leading-none text-[#f7e8c0] sm:text-6xl">
        {displayCount}
      </p>
    </div>
  );
}
