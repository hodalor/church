import { useMemo } from 'react';
import { useCapabilities } from './useCapabilities';

export default function useEventsAccess() {
  const { hasAnyCapability } = useCapabilities();

  return useMemo(
    () => ({
      canViewEvents: hasAnyCapability(['events.view', 'events.overview.view']),
      canCreateEvents: hasAnyCapability(['events.create', 'events.overview.create']),
      canModifyEvents: hasAnyCapability(['events.modify', 'events.overview.modify']),
      canDeleteEvents: hasAnyCapability(['events.delete']),
      canPublishEvents: hasAnyCapability(['events.modify', 'events.overview.publish']),
      canViewEventReports: hasAnyCapability(['events.view', 'events.reports.view']),
      canViewRegistrations: hasAnyCapability(['events.registrations.view', 'events.view']),
      canCreateRegistrations: hasAnyCapability(['events.registrations.create', 'events.view']),
      canModifyRegistrations: hasAnyCapability(['events.registrations.modify', 'events.modify']),
      canCheckInRegistrations: hasAnyCapability([
        'events.registrations.check_in',
        'events.registrations.modify',
      ]),
      canApproveRegistrations: hasAnyCapability([
        'events.registrations.approve',
        'events.registrations.modify',
      ]),
    }),
    [hasAnyCapability],
  );
}
