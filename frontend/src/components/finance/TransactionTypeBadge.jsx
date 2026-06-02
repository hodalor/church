const toneMap = {
  tithe: 'bg-accent/20 text-accent',
  offering: 'bg-blue-500/20 text-blue-300',
  pledge_payment: 'bg-purple-500/20 text-purple-300',
  donation: 'bg-emerald-500/20 text-emerald-300',
  special_seed: 'bg-fuchsia-500/20 text-fuchsia-300',
  welfare: 'bg-amber-500/20 text-amber-300',
  building_fund: 'bg-cyan-500/20 text-cyan-300',
  mission_fund: 'bg-pink-500/20 text-pink-300',
  thanksgiving: 'bg-orange-500/20 text-orange-300',
  other_income: 'bg-white/15 text-white',
};

export default function TransactionTypeBadge({ type }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
        toneMap[type] || toneMap.other_income
      }`}
    >
      {String(type || 'other_income').replaceAll('_', ' ')}
    </span>
  );
}
