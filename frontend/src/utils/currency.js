export const formatAmount = (
  amount,
  {
    currencyCode = 'USD',
    currencySymbol = '$',
    locale = 'en-US',
    maximumFractionDigits = 0,
  } = {},
) => {
  const numericValue = Number(amount || 0);
  const formattedNumber = new Intl.NumberFormat(locale, {
    maximumFractionDigits,
  }).format(numericValue);

  return `${currencySymbol} ${formattedNumber}`.trim();
};

export const COMMON_CURRENCY_CODES = ['USD', 'GHS', 'NGN', 'KES', 'ZAR', 'GBP', 'EUR'];

export const getCurrencySymbol = (currencyCode = 'USD') =>
  (
    {
      USD: '$',
      GHS: 'GHs',
      NGN: 'NGN',
      KES: 'KES',
      ZAR: 'R',
      GBP: 'GBP',
      EUR: 'EUR',
    }[String(currencyCode || 'USD').toUpperCase()] || currencyCode
  );

export const getCurrencyOptions = (primaryCurrencyCode = 'USD', primaryCurrencySymbol = '$') => {
  const normalizedPrimaryCode = String(primaryCurrencyCode || 'USD').toUpperCase();
  const seen = new Set();

  return [normalizedPrimaryCode, ...COMMON_CURRENCY_CODES]
    .filter((currencyCode) => {
      if (seen.has(currencyCode)) {
        return false;
      }

      seen.add(currencyCode);
      return true;
    })
    .map((currencyCode) => ({
      code: currencyCode,
      symbol:
        currencyCode === normalizedPrimaryCode
          ? primaryCurrencySymbol || getCurrencySymbol(currencyCode)
          : getCurrencySymbol(currencyCode),
    }));
};
