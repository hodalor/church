import { useTenant } from '../../hooks/useTenant';
import { formatAmount, getCurrencySymbol } from '../../utils/currency';

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
  xl: 'text-4xl',
};

export default function AmountDisplay({
  amount = 0,
  currency,
  size = 'md',
  color = 'text-white',
}) {
  const tenant = useTenant();
  const resolvedCurrency = currency || tenant.currencyCode || 'USD';
  const symbol = tenant.currencyCode === resolvedCurrency
    ? tenant.currencySymbol || getCurrencySymbol(resolvedCurrency)
    : getCurrencySymbol(resolvedCurrency);

  return (
    <span className={`font-semibold ${sizeClasses[size] || sizeClasses.md} ${color}`}>
      {formatAmount(amount, {
        currencyCode: resolvedCurrency,
        currencySymbol: symbol,
        maximumFractionDigits: 0,
      })}
    </span>
  );
}
