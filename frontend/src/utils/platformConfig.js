export const DEFAULT_ELIGIBLE_COUNTRIES = [
  { name: 'Ghana', countryCode: 'GH', currencyCode: 'GHS', currencySymbol: 'GHs' },
  { name: 'Nigeria', countryCode: 'NG', currencyCode: 'NGN', currencySymbol: 'NGN' },
  { name: 'Kenya', countryCode: 'KE', currencyCode: 'KES', currencySymbol: 'KES' },
  { name: 'South Africa', countryCode: 'ZA', currencyCode: 'ZAR', currencySymbol: 'R' },
  { name: 'United Kingdom', countryCode: 'GB', currencyCode: 'GBP', currencySymbol: 'GBP' },
  { name: 'United States', countryCode: 'US', currencyCode: 'USD', currencySymbol: '$' },
];

export const normalizeEligibleCountries = (countries) => {
  const source = Array.isArray(countries) && countries.length ? countries : DEFAULT_ELIGIBLE_COUNTRIES;
  const seen = new Set();

  return source
    .map((item) => ({
      name: String(item?.name || '').trim(),
      countryCode: String(item?.countryCode || '').trim().toUpperCase(),
      currencyCode: String(item?.currencyCode || 'USD').trim().toUpperCase(),
      currencySymbol: String(item?.currencySymbol || '$').trim(),
    }))
    .filter((item) => {
      if (!item.name) {
        return false;
      }

      const key = item.name.toLowerCase();
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
};

export const getCountryOptionByName = (countries, countryName) =>
  normalizeEligibleCountries(countries).find((item) => item.name === countryName) ||
  normalizeEligibleCountries(countries)[0];
