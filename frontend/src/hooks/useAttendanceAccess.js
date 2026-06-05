import { useMemo } from 'react';
import { useCapabilities } from './useCapabilities';

export const useAttendanceAccess = () => {
  const { hasAnyCapability } = useCapabilities();

  return useMemo(
    () => ({
      canViewAttendance: hasAnyCapability([
        'attendance.view',
        'attendance.services.view',
        'attendance.reports.view',
        'attendance.absentees.view',
      ]),
      canViewServices: hasAnyCapability(['attendance.view', 'attendance.services.view']),
      canCreateServices: hasAnyCapability(['attendance.create', 'attendance.services.create']),
      canModifyServices: hasAnyCapability(['attendance.modify', 'attendance.services.modify']),
      canDeleteServices: hasAnyCapability(['attendance.delete', 'attendance.services.delete']),
      canCheckInServices: hasAnyCapability(['attendance.create', 'attendance.services.check_in']),
      canViewReports: hasAnyCapability(['attendance.view', 'attendance.reports.view']),
      canViewAbsentees: hasAnyCapability(['attendance.view', 'attendance.absentees.view']),
      canFollowUpAbsentees: hasAnyCapability([
        'attendance.modify',
        'attendance.absentees.follow_up',
      ]),
    }),
    [hasAnyCapability],
  );
};

export default useAttendanceAccess;
