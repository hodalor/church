import { volunteerDayKeys, volunteerDayLabels } from '../../utils/volunteers';

export default function AvailabilityDots({ availability = {}, stacked = false }) {
  return (
    <div className={`flex ${stacked ? 'flex-col gap-1.5' : 'items-center gap-1.5'}`}>
      {volunteerDayKeys.map((key, index) => {
        const available = availability?.[key] === true;
        return (
          <div key={key} className="flex items-center gap-1">
            <span className="text-[11px] uppercase tracking-[0.2em] text-white/35">
              {volunteerDayLabels[index]}
            </span>
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                available ? 'bg-accent shadow-[0_0_0_3px_rgba(201,168,76,0.12)]' : 'bg-white/15'
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}
