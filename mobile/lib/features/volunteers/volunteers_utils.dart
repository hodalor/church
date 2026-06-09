import 'package:flutter/material.dart';
import '../../core/utils/app_colors.dart';

Color reliabilityColor(double score) {
  if (score >= 80) {
    return AppColors.success;
  }
  if (score >= 60) {
    return Colors.orange.shade700;
  }
  return AppColors.danger;
}

Color assignmentStatusColor(String status) {
  switch (status) {
    case 'confirmed':
    case 'attended':
      return AppColors.success;
    case 'declined':
    case 'absent':
      return AppColors.danger;
    case 'assigned':
      return AppColors.primary;
    default:
      return Colors.orange.shade700;
  }
}

bool isVolunteerLeaderRole(String role) {
  return <String>{
    'super_admin',
    'head_pastor',
    'associate_pastor',
    'branch_pastor',
    'volunteer_leader',
  }.contains(role);
}

String formatRelativeDays(DateTime? date) {
  if (date == null) {
    return 'Never';
  }

  final diff = DateTime.now().difference(date);
  if (diff.inDays <= 0) {
    return 'today';
  }
  return '${diff.inDays} day${diff.inDays == 1 ? '' : 's'} ago';
}
