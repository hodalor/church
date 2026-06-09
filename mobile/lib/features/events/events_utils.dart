import 'package:flutter/material.dart';
import '../../core/utils/app_colors.dart';

String formatEventDateRange(DateTime? start, DateTime? end) {
  if (start == null) {
    return 'Date TBD';
  }

  final startLabel = _formatDate(start);
  if (end == null || _isSameDay(start, end)) {
    return startLabel;
  }

  return '$startLabel - ${_formatDate(end)}';
}

String formatEventTimeRange(String? startTime, String? endTime) {
  if ((startTime ?? '').isEmpty && (endTime ?? '').isEmpty) {
    return 'Time TBD';
  }
  if ((endTime ?? '').isEmpty) {
    return startTime ?? 'Time TBD';
  }
  return '${startTime ?? ''} - ${endTime ?? ''}';
}

String buildCountdownLabel(DateTime? date) {
  if (date == null) {
    return 'Date TBD';
  }

  final now = DateTime.now();
  final difference = date.difference(now);
  if (difference.isNegative) {
    return 'Started';
  }

  if (difference.inDays >= 1) {
    return 'Starts in ${difference.inDays} day${difference.inDays == 1 ? '' : 's'}';
  }

  final hours = difference.inHours;
  if (hours >= 1) {
    return 'Starts in $hours hour${hours == 1 ? '' : 's'}';
  }

  final minutes = difference.inMinutes.clamp(1, 59);
  return 'Starts in $minutes min';
}

Color eventStatusColor(String status) {
  switch (status) {
    case 'registration_open':
    case 'published':
    case 'completed':
      return AppColors.success;
    case 'registration_closed':
      return Colors.orange.shade700;
    case 'cancelled':
      return AppColors.danger;
    case 'ongoing':
      return Colors.deepPurple;
    default:
      return AppColors.primary;
  }
}

Color countdownColor(DateTime? date) {
  if (date == null) {
    return AppColors.accent;
  }

  final diff = date.difference(DateTime.now());
  if (diff.inDays > 7) {
    return AppColors.accent;
  }
  if (diff.inDays >= 2) {
    return Colors.orange.shade700;
  }
  return AppColors.danger;
}

String registrationStatusLabel({
  required bool requiresRegistration,
  required bool isFree,
  required String status,
}) {
  if (!requiresRegistration) {
    return 'Walk-in';
  }
  if (status == 'registration_open') {
    return isFree ? 'Free' : 'Open';
  }
  if (status == 'registration_closed') {
    return 'Closed';
  }
  return status.replaceAll('_', ' ');
}

String _formatDate(DateTime date) {
  const months = <String>[
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return '${date.day} ${months[date.month - 1]} ${date.year}';
}

bool _isSameDay(DateTime left, DateTime right) {
  return left.year == right.year &&
      left.month == right.month &&
      left.day == right.day;
}
