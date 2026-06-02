import { useMemo } from 'react';

const toKey = (value) => new Date(value).toISOString().slice(0, 10);

export default function AttendanceCalendar({ months = 6, data = [] }) {
  const entries = useMemo(() => {
    const today = new Date();
    const monthsData = [];
    const map = new Map(data.map((item) => [item.date, item.status]));

    for (let monthOffset = months - 1; monthOffset >= 0; monthOffset -= 1) {
      const base = new Date(today.getFullYear(), today.getMonth() - monthOffset, 1);
      const label = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        year: 'numeric',
      }).format(base);
      const sundays = [];
      const cursor = new Date(base);
      while (cursor.getMonth() === base.getMonth()) {
        if (cursor.getDay() === 0) {
          const key = toKey(cursor);
          sundays.push({
            date: key,
            label: new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(cursor),
            status: map.get(key) || 'no_service',
          });
        }
        cursor.setDate(cursor.getDate() + 1);
      }
      monthsData.push({ label, sundays });
    }

    return monthsData;
  }, [data, months]);

  return (
    <div className="space-y-3">
      {entries.map((month) => (
        <div key={month.label} className="rounded-[18px] border border-white/10 bg-[#0b1120] p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">{month.label}</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">Sundays</p>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
            {month.sundays.map((day) => (
              <div
                key={day.date}
                className={`rounded-xl px-3 py-2 text-center text-xs font-semibold ${
                  day.status === 'attended'
                    ? 'bg-accent/25 text-[#f3deb0]'
                    : day.status === 'missed'
                      ? 'bg-red-500/20 text-red-300'
                      : 'bg-white/6 text-white/45'
                }`}
              >
                <p>{day.label}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
