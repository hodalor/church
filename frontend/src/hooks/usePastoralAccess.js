import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { useCapabilities } from './useCapabilities';
import {
  canAccessConfidentialNotes,
  canAccessPastoralUI,
  canCreatePastoralRecords,
  canManagePastoralRecords,
  canSeeTenantWidePastoralData,
} from '../utils/pastoral';

export const usePastoralAccess = () => {
  const { role, user } = useAuth();
  const { hasCapability } = useCapabilities();

  return useMemo(
    () => ({
      role,
      user,
      canViewPastoral: canAccessPastoralUI(role, hasCapability),
      canCreatePastoral: canCreatePastoralRecords(role, hasCapability),
      canManagePastoral: canManagePastoralRecords(role, hasCapability),
      canViewConfidential: canAccessConfidentialNotes(role),
      canViewTenantWide: canSeeTenantWidePastoralData(role),
      isSuperAdmin: role === 'super_admin',
    }),
    [hasCapability, role, user],
  );
};
