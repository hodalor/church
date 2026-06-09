import { useMemo } from 'react';
import { useCapabilities } from './useCapabilities';

export default function useVolunteersAccess() {
  const { hasAnyCapability } = useCapabilities();

  return useMemo(
    () => ({
      canViewVolunteers: hasAnyCapability(['volunteers.view', 'volunteers.overview.view']),
      canCreateVolunteers: hasAnyCapability(['volunteers.create', 'volunteers.overview.create']),
      canModifyVolunteers: hasAnyCapability(['volunteers.modify', 'volunteers.overview.modify']),
      canDeleteVolunteers: hasAnyCapability(['volunteers.delete']),
      canViewVolunteerReports: hasAnyCapability(['volunteers.view', 'volunteers.reports.view']),
      canManageTrainings: hasAnyCapability(['volunteers.modify', 'volunteers.trainings.create']),
      canViewRosters: hasAnyCapability(['volunteers.view', 'volunteers.rosters.view']),
      canCreateRosters: hasAnyCapability(['volunteers.create', 'volunteers.rosters.create']),
      canModifyRosters: hasAnyCapability(['volunteers.modify', 'volunteers.rosters.modify']),
      canPublishRosters: hasAnyCapability(['volunteers.modify', 'volunteers.rosters.publish']),
    }),
    [hasAnyCapability],
  );
}
