export default function DeliveryRateBar({ sent = 0, delivered = 0, total = 0 }) {
  const safeTotal = Math.max(total || sent || delivered, 1);
  const failed = Math.max(sent - delivered, 0);
  const pending = Math.max(safeTotal - sent, 0);
  const deliveredPercent = (delivered / safeTotal) * 100;
  const failedPercent = (failed / safeTotal) * 100;
  const pendingPercent = (pending / safeTotal) * 100;
  const rate = Math.round((delivered / safeTotal) * 100);

  return (
    <div className="space-y-2">
      <div className="h-2 overflow-hidden rounded-full bg-white/8">
        <div className="flex h-full w-full">
          <div className="bg-emerald-400" style={{ width: `${deliveredPercent}%` }} />
          <div className="bg-red-400" style={{ width: `${failedPercent}%` }} />
          <div className="bg-white/20" style={{ width: `${pendingPercent}%` }} />
        </div>
      </div>
      <p className="text-xs uppercase tracking-[0.18em] text-white/50">{rate}% delivered</p>
    </div>
  );
}
