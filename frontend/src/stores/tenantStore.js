import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createSafeStorage } from './createSafeStorage';

export const useTenantStore = create(
  persist(
    (set) => ({
      tenantId: null,
      churchName: null,
      country: null,
      countryCode: null,
      currencyCode: 'USD',
      currencySymbol: '$',
      setTenant: ({ tenantId, churchName, country, countryCode, currencyCode, currencySymbol }) =>
        set({
          tenantId,
          churchName,
          country: country || null,
          countryCode: countryCode || null,
          currencyCode: currencyCode || 'USD',
          currencySymbol: currencySymbol || '$',
        }),
      resetTenant: () =>
        set({
          tenantId: null,
          churchName: null,
          country: null,
          countryCode: null,
          currencyCode: 'USD',
          currencySymbol: '$',
        }),
    }),
    {
      name: 'prynova-tenant',
      storage: createSafeStorage(),
    },
  ),
);
