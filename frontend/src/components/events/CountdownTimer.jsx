import { useEffect, useState } from 'react';
import { buildEventCountdown } from '../../utils/events';

export default function CountdownTimer({ targetDate, className = '' }) {
  const [label, setLabel] = useState(buildEventCountdown(targetDate));

  useEffect(() => {
    setLabel(buildEventCountdown(targetDate));
    const interval = window.setInterval(() => {
      setLabel(buildEventCountdown(targetDate));
    }, 60000);

    return () => window.clearInterval(interval);
  }, [targetDate]);

  return <p className={`text-sm text-white/70 ${className}`}>{label}</p>;
}
