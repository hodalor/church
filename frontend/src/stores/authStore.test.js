import { act } from '@testing-library/react';
import { useAuthStore } from './authStore';
import { useBrandingStore } from './brandingStore';
import { useTenantStore } from './tenantStore';

const mockLoginUser = jest.fn();
const mockLogoutUser = jest.fn();
const mockRefreshToken = jest.fn();

jest.mock('../api/endpoints/auth', () => ({
  loginUser: (...args) => mockLoginUser(...args),
  logoutUser: (...args) => mockLogoutUser(...args),
  refreshToken: (...args) => mockRefreshToken(...args),
}));

describe('authStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockLoginUser.mockReset();
    mockLogoutUser.mockReset();
    mockRefreshToken.mockReset();

    useAuthStore.setState({
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
  });

  it('sets isAuthenticated to true after login', async () => {
    mockLoginUser.mockResolvedValue({
      user: {
        username: 'pastor',
        fullName: 'John',
        tenantId: 'calvary',
        role: 'head_pastor',
      },
      accessToken: 'abc123',
      refreshToken: 'xyz789',
      churchName: 'Calvary',
      tenantFinancial: {
        currencyCode: 'USD',
        currencySymbol: '$',
      },
      tenantBranding: {},
    });

    await act(async () => {
      await useAuthStore.getState().login({
        tenantId: 'calvary',
        username: 'pastor',
        pin: '1234',
      });
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().role).toBe('head_pastor');
  });

  it('clears state on logout', async () => {
    mockLoginUser.mockResolvedValue({
      user: {
        username: 'pastor',
        tenantId: 'calvary',
        role: 'head_pastor',
      },
      accessToken: 'abc123',
      refreshToken: 'xyz',
      churchName: 'Calvary',
      tenantFinancial: {
        currencyCode: 'USD',
        currencySymbol: '$',
      },
      tenantBranding: {},
    });
    mockLogoutUser.mockResolvedValue({});

    await act(async () => {
      await useAuthStore.getState().login({
        tenantId: 'calvary',
        username: 'pastor',
        pin: '1234',
      });
      await useAuthStore.getState().logout({ redirect: false });
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
