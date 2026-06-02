import 'dart:math' as math;

import 'data/models/attendance_record.dart';
import 'data/models/service.dart';

const Set<String> kLeaderAttendanceRoles = <String>{
  'head_pastor',
  'associate_pastor',
  'branch_pastor',
  'volunteer_leader',
  'care_leader',
};

bool isLeaderAttendanceRole(String? role) => kLeaderAttendanceRoles.contains(role);

String formatAttendanceDate(DateTime? value) {
  if (value == null) {
    return 'Date unavailable';
  }

  return '${weekdayLabel(value)}, ${monthLabel(value.month)} ${value.day}, ${value.year}';
}

String formatShortDate(DateTime? value) {
  if (value == null) {
    return '--';
  }

  return '${monthLabel(value.month)} ${value.day}';
}

String formatMonthYear(int month, int year) {
  return '${monthLabel(month)} $year';
}

String monthLabel(int month) {
  const labels = <String>[
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

  if (month < 1 || month > 12) {
    return 'Month';
  }

  return labels[month - 1];
}

String weekdayLabel(DateTime date) {
  const labels = <String>[
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
    'Sun',
  ];
  return labels[date.weekday - 1];
}

String formatTimeOfDay(DateTime? value) {
  if (value == null) {
    return '--';
  }

  final hour = value.hour % 12 == 0 ? 12 : value.hour % 12;
  final minute = value.minute.toString().padLeft(2, '0');
  final suffix = value.hour >= 12 ? 'PM' : 'AM';
  return '$hour:$minute $suffix';
}

String formatServiceTime(Service service) {
  final start = service.startTime?.trim();
  final end = service.endTime?.trim();

  if ((start == null || start.isEmpty) && (end == null || end.isEmpty)) {
    return 'Time to be announced';
  }

  if (start != null && start.isNotEmpty && end != null && end.isNotEmpty) {
    return '$start - $end';
  }

  return start?.isNotEmpty == true ? start! : end!;
}

String formatCountdown(DateTime date) {
  final now = DateTime.now();
  final difference = date.difference(now);

  if (difference.isNegative) {
    return 'Service time has passed';
  }

  final days = difference.inDays;
  final hours = difference.inHours.remainder(24);
  final minutes = difference.inMinutes.remainder(60);

  if (days > 0) {
    return 'Next service in $days day${days == 1 ? '' : 's'}, $hours hour${hours == 1 ? '' : 's'}';
  }
  if (difference.inHours > 0) {
    return 'Next service in ${difference.inHours} hour${difference.inHours == 1 ? '' : 's'}, $minutes minute${minutes == 1 ? '' : 's'}';
  }
  return 'Next service in ${math.max(difference.inMinutes, 1)} minute${difference.inMinutes == 1 ? '' : 's'}';
}

double normalizeRate(double rate) {
  if (rate > 1) {
    return (rate / 100).clamp(0, 1);
  }
  return rate.clamp(0, 1);
}

String formatPercentage(double rate) {
  final normalized = normalizeRate(rate);
  return '${(normalized * 100).round()}%';
}

String attendeeTypeLabel(String type) {
  switch (type.toLowerCase()) {
    case 'visitor':
      return 'Visitor';
    case 'child':
      return 'Child';
    case 'online':
      return 'Online';
    default:
      return 'Member';
  }
}

String checkInMethodLabel(String method) {
  switch (method.toLowerCase()) {
    case 'qr':
      return 'QR';
    case 'online':
      return 'Online';
    case 'manual':
      return 'Manual';
    default:
      return method.isEmpty ? 'Check-in' : method;
  }
}

bool responseLooksLikeAlreadyCheckedIn(Map<String, dynamic> payload) {
  final message = (payload['message'] ?? payload['status'] ?? '').toString().toLowerCase();
  return payload['alreadyCheckedIn'] == true ||
      payload['alreadyChecked'] == true ||
      message.contains('already checked');
}

String responseMessage(Map<String, dynamic> payload, {String fallback = 'Action completed'}) {
  final raw = payload['message'] ?? payload['status'] ?? payload['detail'];
  final text = raw?.toString().trim();
  if (text == null || text.isEmpty) {
    return fallback;
  }
  return text;
}

DateTime? responseCheckInTime(Map<String, dynamic> payload) {
  final candidates = <dynamic>[
    payload['checkInTime'],
    payload['checkedInAt'],
    payload['time'],
    if (payload['attendance'] is Map<String, dynamic>)
      (payload['attendance'] as Map<String, dynamic>)['checkInTime'],
    if (payload['attendance'] is Map<String, dynamic>)
      (payload['attendance'] as Map<String, dynamic>)['checkedInAt'],
  ];

  for (final value in candidates) {
    final parsed = DateTime.tryParse((value ?? '').toString());
    if (parsed != null) {
      return parsed;
    }
  }
  return null;
}

String resolveRecordTitle(AttendanceRecord record) {
  return record.serviceTitle?.trim().isNotEmpty == true
      ? record.serviceTitle!.trim()
      : 'Church Service';
}
