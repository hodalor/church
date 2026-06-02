import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createSafeStorage } from './createSafeStorage';

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

export const useBrandingStore = create(
  persist(
    (set) => ({
      globalBranding: defaultGlobalBranding,
      tenantBranding: defaultTenantBranding,
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
      resetTenantBranding: () => set({ tenantBranding: defaultTenantBranding }),
    }),
    {
      name: 'prynova-branding',
      storage: createSafeStorage(),
    },
  ),
);
