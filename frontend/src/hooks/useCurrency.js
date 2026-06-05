import { useMemo } from 'react';
import { useTenant } from './useTenant';
import { formatAmount, getCurrencyOptions, getCurrencySymbol } from '../utils/currency';

export const useCurrency = () => {
  const { currencyCode = 'USD', currencySymbol = '$' } = useTenant();

  const currencyOptions = useMemo(
    () => getCurrencyOptions(currencyCode, currencySymbol),
    [currencyCode, currencySymbol],
  );

  const formatCurrency = (amount, overrides = {}) =>
    formatAmount(amount, {
      currencyCode,
      currencySymbol: currencySymbol || getCurrencySymbol(currencyCode),
      maximumFractionDigits: 0,
      ...overrides,
    });

  return {
    currencyCode,
    currencySymbol: currencySymbol || getCurrencySymbol(currencyCode),
    currencyOptions,
    formatCurrency,
  };
};

export default useCurrency;
