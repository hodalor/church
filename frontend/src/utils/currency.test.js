import {
  formatAmount,
  getCurrencyOptions,
  getCurrencySymbol,
} from './currency';

describe('currency utilities', () => {
  it('formats amounts with the provided symbol', () => {
    expect(formatAmount(1250, { currencySymbol: '$' })).toBe('$ 1,250');
  });

  it('returns a known currency symbol when available', () => {
    expect(getCurrencySymbol('ZAR')).toBe('R');
  });

  it('includes the primary currency first in the options list', () => {
    const options = getCurrencyOptions('KES', 'KSh');

    expect(options[0]).toEqual({ code: 'KES', symbol: 'KSh' });
  });
});
