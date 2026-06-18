import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useTenantStore } from './tenantStore';
import { useBrandingStore } from './brandingStore';
import { createSafeStorage } from './createSafeStorage';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      tenantId: null,
      role: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: async (credentials) => {
        set({ isLoading: true, error: null });

        try {
          const { loginUser } = await import('../api/endpoints/auth');
          const data = await loginUser(credentials);
          const user = data.user || {};
          const tenantId = user.tenantId || credentials.tenantId;
          const role = user.role || null;

          set({
            user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            tenantId,
            role,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          useTenantStore.getState().setTenant({
            tenantId,
            churchName: data.churchName || tenantId,
            country: data.user?.role === 'super_admin' ? null : data.tenant?.country || data.country || null,
            countryCode: data.tenant?.countryCode || data.countryCode || null,
            currencyCode: data.tenantFinancial?.currencyCode || 'USD',
            currencySymbol: data.tenantFinancial?.currencySymbol || '$',
          });
          useBrandingStore.getState().setTenantBranding({
            appName: data.tenantBranding?.appName || data.churchName || '',
            logoUrl: data.tenantBranding?.logoUrl || '',
            tagline: data.tenantBranding?.tagline || 'Tenant workspace',
          });
          if (role === 'super_admin') {
            useBrandingStore.getState().setPlatformConfig(data.platformConfig || {});
          }

          return role;
        } catch (error) {
          const message = error.response?.data?.message || 'Unable to sign in right now.';
          set({
            isLoading: false,
            isAuthenticated: false,
            error: message,
          });
          throw error;
        }
      },
      logout: async ({ redirect = true } = {}) => {
        const state = useAuthStore.getState();

        try {
          if (state.accessToken || state.refreshToken) {
            const { logoutUser } = await import('../api/endpoints/auth');
            await logoutUser(
              state.refreshToken
                ? { refreshToken: state.refreshToken }
                : {},
            );
          }
        } catch {
          // Ignore logout request failures and clear local session anyway.
        } finally {
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem('prynova-auth');
            window.localStorage.removeItem('prynova-tenant');
            window.localStorage.removeItem('prynova-branding');
          }

          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            tenantId: null,
            role: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          useTenantStore.getState().resetTenant();
          useBrandingStore.getState().resetTenantBranding();
          useBrandingStore.getState().resetPlatformConfig();

          if (redirect && typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.replace('/login');
          }
        }
      },
      refreshAccessToken: async () => {
        const currentRefreshToken = useAuthStore.getState().refreshToken;

        if (!currentRefreshToken) {
          throw new Error('No refresh token available');
        }

        const { refreshToken } = await import('../api/endpoints/auth');
        const data = await refreshToken({ refreshToken: currentRefreshToken });

        set((state) => ({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken || state.refreshToken,
        }));

        return data.accessToken;
      },
      clearError: () => set({ error: null }),
    }),
    {
      name: 'prynova-auth',
      storage: createSafeStorage(),
    },
  ),
);
