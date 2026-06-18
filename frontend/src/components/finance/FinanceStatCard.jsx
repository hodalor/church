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
    <Card className="space-y-2 bg-[linear-gradient(135deg,rgba(201,168,76,0.16),rgba(14,22,36,0.98))] p-3.5">
      <p className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-[#f3deb0]">
        {label}
      </p>
      <AmountDisplay amount={value} currency={currency} size="lg" color={color} />
      {typeof changePercent !== 'undefined' ? (
        <div className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold ${meta.className}`}>
          <Icon className="h-3.5 w-3.5" />
          {Math.abs(Number(changePercent || 0)).toLocaleString()}%
        </div>
      ) : null}
      {helper ? <p className="text-xs text-white/45">{helper}</p> : null}
    </Card>
  );
}
