import { useMemo } from 'react';
import { useCapabilities } from './useCapabilities';

export const useVisitorsAccess = () => {
  const { hasAnyCapability } = useCapabilities();

  return useMemo(
    () => ({
      canViewVisitors: hasAnyCapability([
        'visitors.view',
        'visitors.overview.view',
        'visitors.register.view',
        'visitors.list.view',
        'visitors.pipeline.view',
        'visitors.followups.view',
        'visitors.workflow.view',
        'visitors.reports.view',
      ]),
      canOpenRegister: hasAnyCapability(['visitors.view', 'visitors.register.view']),
      canCreateVisitor: hasAnyCapability(['visitors.create', 'visitors.register.create']),
      canOpenList: hasAnyCapability(['visitors.view', 'visitors.list.view']),
      canAssignVisitors: hasAnyCapability(['visitors.modify', 'visitors.list.assign']),
      canRecordReturnVisit: hasAnyCapability(['visitors.modify', 'visitors.list.view']),
      canExportVisitors: hasAnyCapability(['visitors.list.export', 'visitors.reports.export']),
      canOpenPipeline: hasAnyCapability(['visitors.view', 'visitors.pipeline.view']),
      canMoveVisitors: hasAnyCapability(['visitors.modify', 'visitors.pipeline.move']),
      canOpenFollowUps: hasAnyCapability(['visitors.view', 'visitors.followups.view']),
      canCompleteFollowUps: hasAnyCapability(['visitors.modify', 'visitors.followups.complete']),
      canRescheduleFollowUps: hasAnyCapability(['visitors.modify', 'visitors.followups.reschedule']),
      canModifyVisitors: hasAnyCapability(['visitors.modify']),
      canConvertVisitors: hasAnyCapability([
        'visitors.modify',
        'visitors.list.convert',
        'visitors.pipeline.convert',
      ]),
      canOpenWorkflow: hasAnyCapability(['visitors.view', 'visitors.workflow.view']),
      canModifyWorkflow: hasAnyCapability(['visitors.modify', 'visitors.workflow.modify']),
      canOpenReports: hasAnyCapability(['visitors.view', 'visitors.reports.view']),
    }),
    [hasAnyCapability],
  );
};

export default useVisitorsAccess;
