import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createSafeStorage } from './createSafeStorage';
import { DEFAULT_ELIGIBLE_COUNTRIES } from '../utils/platformConfig';

const defaultGlobalBranding = {
  appName: 'Ecclesia',
  logoUrl: '',
  tagline: 'Church OS',
};

const defaultTenantBranding = {
  appName: '',
  logoUrl: '',
  tagline: 'Tenant workspace',
};

const defaultPlatformConfig = {
  eligibleCountries: DEFAULT_ELIGIBLE_COUNTRIES,
};

export const useBrandingStore = create(
  persist(
    (set) => ({
      globalBranding: defaultGlobalBranding,
      tenantBranding: defaultTenantBranding,
      platformConfig: defaultPlatformConfig,
      updateGlobalBranding: (payload) =>
        set((state) => ({
          globalBranding: {
            ...state.globalBranding,
            ...payload,
          },
        })),
      updateTenantBranding: (payload) =>
        set((state) => ({
          tenantBranding: {
            ...state.tenantBranding,
            ...payload,
          },
        })),
      setTenantBranding: (payload) =>
        set({
          tenantBranding: {
            ...defaultTenantBranding,
            ...payload,
          },
        }),
      updatePlatformConfig: (payload) =>
        set((state) => ({
          platformConfig: {
            ...state.platformConfig,
            ...payload,
          },
        })),
      setPlatformConfig: (payload) =>
        set({
          platformConfig: {
            ...defaultPlatformConfig,
            ...payload,
          },
        }),
      resetTenantBranding: () => set({ tenantBranding: defaultTenantBranding }),
      resetPlatformConfig: () => set({ platformConfig: defaultPlatformConfig }),
    }),
    {
      name: 'prynova-branding',
      storage: createSafeStorage(),
    },
  ),
);
