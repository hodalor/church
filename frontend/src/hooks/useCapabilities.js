import { useMemo } from 'react';
import { useAuth } from './useAuth';
import {
  getRoleDefaultCapabilities,
  hasAnyCapability as checkAnyCapability,
  hasCapability as checkCapability,
  normalizeCapabilities,
} from '../constants/capabilities';

export const useCapabilities = () => {
  const { role, user } = useAuth();

  const capabilities = useMemo(() => {
    if (role === 'super_admin') {
      return getRoleDefaultCapabilities('super_admin');
    }

    return normalizeCapabilities(user?.capabilities, getRoleDefaultCapabilities(role));
  }, [role, user?.capabilities]);

  return {
    capabilities,
    hasCapability: (capability) => checkCapability(capabilities, capability),
    hasAnyCapability: (capabilityOptions) => checkAnyCapability(capabilities, capabilityOptions),
  };
};
