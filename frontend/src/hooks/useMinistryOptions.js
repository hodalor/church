import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllMinistries } from '../api/endpoints/ministry';
import { useAuth } from './useAuth';

export default function useMinistryOptions({
  tenantId,
  enabled = true,
  includeCurrent = '',
} = {}) {
  const { role } = useAuth();
  const isSuperAdmin = role === 'super_admin';

  const ministriesQuery = useQuery({
    queryKey: ['ministry-options', isSuperAdmin ? tenantId || 'super-admin' : 'tenant'],
    queryFn: () =>
      getAllMinistries(isSuperAdmin && tenantId ? { tenantId, limit: 200 } : { limit: 200 }),
    enabled: enabled && (!isSuperAdmin || Boolean(tenantId)),
  });

  const ministryOptions = useMemo(() => {
    const liveMinistryNames = (ministriesQuery.data?.ministries || ministriesQuery.data?.items || [])
      .map((item) => item.name)
      .filter(Boolean);

    return [...new Set(includeCurrent ? [includeCurrent, ...liveMinistryNames] : liveMinistryNames)];
  }, [ministriesQuery.data?.items, ministriesQuery.data?.ministries, includeCurrent]);

  const isLoading = ministriesQuery.isLoading;
  const hasOptions = ministryOptions.length > 0;

  return {
    ministryOptions,
    ministriesQuery,
    isLoading,
    hasOptions,
    selectPlaceholder: isLoading
      ? 'Loading ministries...'
      : hasOptions
        ? 'Select ministry'
        : 'No ministries created yet',
  };
}
