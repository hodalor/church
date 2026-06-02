const currencySymbols = {
  USD: '$',
  GHS: 'GHs',
  NGN: 'NGN',
  KES: 'KES',
  GBP: 'GBP',
  EUR: 'EUR',
};

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
  xl: 'text-4xl',
};

export default function AmountDisplay({
  amount = 0,
  currency = 'USD',
  size = 'md',
  color = 'text-white',
}) {
  const symbol = currencySymbols[currency] || currency;
  return (
    <span className={`font-semibold ${sizeClasses[size] || sizeClasses.md} ${color}`}>
      {symbol} {Number(amount || 0).toLocaleString()}
    </span>
  );
}
