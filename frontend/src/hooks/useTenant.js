import { useTenantStore } from '../stores/tenantStore';

export const useTenant = () => {
  return useTenantStore();
};
