import 'package:flutter/material.dart';

import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../attendance_utils.dart';
import '../data/models/attendance_record.dart';
import '../data/models/member_attendance_history.dart';
import '../data/models/monthly_attendance.dart';

enum AttendanceDayStatus { attended, missed, noService }

class AttendanceCalendarWidget extends StatelessWidget {
  const AttendanceCalendarWidget({
    super.key,
    required this.history,
    this.months = 3,
  });

  final MemberAttendanceHistory history;
  final int months;

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final monthCards = List<DateTime>.generate(
      months,
      (index) => DateTime(now.year, now.month - index, 1),
    );

    return Column(
      children: monthCards
          .map(
            (monthDate) => Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: _MonthAttendanceCard(
                monthDate: monthDate,
                history: history,
              ),
            ),
          )
          .toList(),
    );
  }
}

class _MonthAttendanceCard extends StatelessWidget {
  const _MonthAttendanceCard({
    required this.monthDate,
    required this.history,
  });

  final DateTime monthDate;
  final MemberAttendanceHistory history;

  MonthlyAttendance? get _monthlyData {
    for (final item in history.monthlyBreakdown) {
      if (item.month == monthDate.month && item.year == monthDate.year) {
        return item;
      }
    }
    return null;
  }

  Map<DateTime, AttendanceRecord> get _attendedMap {
    final output = <DateTime, AttendanceRecord>{};
    for (final record in history.attendedServices) {
      final date = record.serviceDate;
      if (date == null) {
        continue;
      }
      if (date.year == monthDate.year && date.month == monthDate.month) {
        output[DateTime(date.year, date.month, date.day)] = record;
      }
    }
    return output;
  }

  List<DateTime> _sundaysInMonth() {
    final dates = <DateTime>[];
    final totalDays = DateUtils.getDaysInMonth(monthDate.year, monthDate.month);
    for (var day = 1; day <= totalDays; day++) {
      final date = DateTime(monthDate.year, monthDate.month, day);
      if (date.weekday == DateTime.sunday) {
        dates.add(date);
      }
    }
    return dates;
  }

  Set<DateTime> _scheduledDays(List<DateTime> sundays) {
    final totalServices = _monthlyData?.total ?? 0;
    final now = DateTime.now();
    final pastOrToday = sundays
        .where((date) => !date.isAfter(DateTime(now.year, now.month, now.day)))
        .toList();

    if (totalServices <= 0 || pastOrToday.isEmpty) {
      return <DateTime>{};
    }

    final take = totalServices > pastOrToday.length ? pastOrToday.length : totalServices;
    return pastOrToday.take(take).map((date) => DateTime(date.year, date.month, date.day)).toSet();
  }

  @override
  Widget build(BuildContext context) {
    final sundays = _sundaysInMonth();
    final scheduledDays = _scheduledDays(sundays);
    final attendedMap = _attendedMap;
    final monthlyData = _monthlyData;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.inputBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Text(
                formatMonthYear(monthDate.month, monthDate.year),
                style: AppTextStyles.titleMedium,
              ),
              const Spacer(),
              Text(
                monthlyData != null ? formatPercentage(monthlyData.rate) : '--',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: sundays.map((date) {
              final normalized = DateTime(date.year, date.month, date.day);
              final record = attendedMap[normalized];
              final status = record != null
                  ? AttendanceDayStatus.attended
                  : scheduledDays.contains(normalized)
                      ? AttendanceDayStatus.missed
                      : AttendanceDayStatus.noService;

              return Tooltip(
                message: record != null
                    ? resolveRecordTitle(record)
                    : status == AttendanceDayStatus.missed
                        ? 'Missed service'
                        : 'No service recorded',
                child: _AttendanceDayChip(
                  date: date,
                  status: status,
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

class _AttendanceDayChip extends StatelessWidget {
  const _AttendanceDayChip({
    required this.date,
    required this.status,
  });

  final DateTime date;
  final AttendanceDayStatus status;

  Color get _backgroundColor {
    switch (status) {
      case AttendanceDayStatus.attended:
        return AppColors.accent;
      case AttendanceDayStatus.missed:
        return AppColors.danger.withValues(alpha: 0.78);
      case AttendanceDayStatus.noService:
        return AppColors.inputBorder;
    }
  }

  Color get _foregroundColor {
    switch (status) {
      case AttendanceDayStatus.attended:
        return AppColors.primary;
      case AttendanceDayStatus.missed:
        return Colors.white;
      case AttendanceDayStatus.noService:
        return AppColors.mutedText;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 58,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
      decoration: BoxDecoration(
        color: _backgroundColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: <Widget>[
          Text(
            'Sun',
            style: AppTextStyles.bodyMedium.copyWith(
              color: _foregroundColor.withValues(alpha: 0.8),
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '${date.day}',
            style: AppTextStyles.bodyLarge.copyWith(
              color: _foregroundColor,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}
