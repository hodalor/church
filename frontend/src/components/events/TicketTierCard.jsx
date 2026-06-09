import { useCurrency } from '../../hooks/useCurrency';

export default function TicketTierCard({ tier, onRegister, compact = false }) {
  const { formatCurrency } = useCurrency();
  const remaining = Math.max(Number(tier.quantity || 0) - Number(tier.sold || 0), 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#101827] p-4">
      <div className={`flex ${compact ? 'items-center justify-between gap-3' : 'flex-col gap-3'}`}>
        <div>
          <p className="text-lg font-semibold text-white">{tier.name}</p>
          <p className="mt-1 text-sm text-white/55">{tier.description || 'Ticket tier'}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold text-accent">
            {formatCurrency(tier.price || 0, {
              currencyCode: tier.currency || undefined,
            })}
          </p>
          <p className="text-xs text-white/45">{remaining} spots left</p>
        </div>
      </div>
      {onRegister ? (
        <button
          type="button"
          onClick={() => onRegister?.(tier)}
          className="mt-4 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-sm font-semibold text-accent"
        >
          Register Now
        </button>
      ) : null}
    </div>
  );
}
