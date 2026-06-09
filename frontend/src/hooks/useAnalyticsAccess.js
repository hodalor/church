import { useMemo } from 'react';
import { useCapabilities } from './useCapabilities';
import { useAuth } from './useAuth';

export default function useAnalyticsAccess() {
  const { role } = useAuth();
  const { hasAnyCapability } = useCapabilities();

  return useMemo(
    () => ({
      role,
      canViewHQ: hasAnyCapability(['hq.view', 'hq.overview.view']),
      canViewBranches: hasAnyCapability(['branches.view']),
      canManageBranches: hasAnyCapability(['branches.create', 'branches.modify']),
      canViewBranchMetrics: hasAnyCapability(['branches.metrics.view', 'branches.view']),
      canRefreshBranchCache: hasAnyCapability(['branches.metrics.refresh', 'branches.modify']),
      canViewIntelligence: hasAnyCapability([
        'hq.view',
        'hq.comparison.view',
        'hq.growth.view',
        'hq.finance.view',
        'hq.members.view',
        'hq.operations.view',
        'analytics.view',
      ]),
      canViewReports: hasAnyCapability(['hq.reports.view', 'analytics.view']),
      canViewInsights: hasAnyCapability(['insights.view']),
      canManageInsights: hasAnyCapability(['insights.modify', 'insights.management.modify']),
      canGenerateInsights: hasAnyCapability(['insights.create']),
      canViewAI: hasAnyCapability(['ai.view', 'ai.create']),
      canViewAIHistory: hasAnyCapability(['ai.history.view', 'ai.view']),
      canUseAI: hasAnyCapability(['ai.create']),
      canViewAnalyticsSnapshots: hasAnyCapability(['analytics.view', 'analytics.snapshots.view']),
      canGenerateSnapshots: hasAnyCapability(['analytics.create', 'analytics.snapshots.create']),
      canViewPlatformBI: role === 'super_admin',
    }),
    [hasAnyCapability, role],
  );
}
