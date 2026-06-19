import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllBranches } from '../api/endpoints/branches';
import { useAuth } from './useAuth';

export default function useBranchOptions({
  tenantId,
  enabled = true,
  includeCurrent = '',
} = {}) {
  const { role } = useAuth();
  const isSuperAdmin = role === 'super_admin';

  const branchesQuery = useQuery({
    queryKey: ['branch-options', isSuperAdmin ? tenantId || 'super-admin' : 'tenant'],
    queryFn: () =>
      getAllBranches(isSuperAdmin && tenantId ? { tenantId, limit: 200 } : { limit: 200 }),
    enabled: enabled && (!isSuperAdmin || Boolean(tenantId)),
  });

  const branchOptions = useMemo(() => {
    const liveBranchNames = (branchesQuery.data?.items || [])
      .map((item) => item.branchName)
      .filter(Boolean);

    return [...new Set(includeCurrent ? [includeCurrent, ...liveBranchNames] : liveBranchNames)];
  }, [branchesQuery.data?.items, includeCurrent]);

  return {
    branchOptions,
    branchesQuery,
  };
}
