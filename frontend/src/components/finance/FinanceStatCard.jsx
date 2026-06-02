import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import Card from '../ui/Card';
import AmountDisplay from './AmountDisplay';

const trendMeta = {
  up: { icon: ArrowUpRight, className: 'text-emerald-400' },
  down: { icon: ArrowDownRight, className: 'text-red-400' },
  flat: { icon: ArrowRight, className: 'text-white/50' },
};

export default function FinanceStatCard({
  label,
  value,
  currency = 'USD',
  trend,
  changePercent,
  helper,
  color = 'text-white',
}) {
  const meta = trendMeta[trend] || trendMeta.flat;
  const Icon = meta.icon;

  return (
    <Card className="space-y-2 p-4">
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/50">{label}</p>
      <AmountDisplay amount={value} currency={currency} size="lg" color={color} />
      {typeof changePercent !== 'undefined' ? (
        <div className={`inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold ${meta.className}`}>
          <Icon className="h-3.5 w-3.5" />
          {Math.abs(Number(changePercent || 0)).toLocaleString()}%
        </div>
      ) : null}
      {helper ? <p className="text-xs text-white/45">{helper}</p> : null}
    </Card>
  );
}
