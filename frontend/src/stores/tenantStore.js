import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createSafeStorage } from './createSafeStorage';

export const useTenantStore = create(
  persist(
    (set) => ({
      tenantId: null,
      churchName: null,
      setTenant: ({ tenantId, churchName }) => set({ tenantId, churchName }),
      resetTenant: () => set({ tenantId: null, churchName: null }),
    }),
    {
      name: 'prynova-tenant',
      storage: createSafeStorage(),
    },
  ),
);
