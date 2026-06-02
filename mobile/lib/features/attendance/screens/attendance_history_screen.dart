import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../attendance_utils.dart';
import '../data/models/attendance_record.dart';
import '../data/models/member_attendance_history.dart';
import '../data/models/monthly_attendance.dart';
import '../providers/my_attendance_provider.dart';
import '../widgets/attendance_history_tile.dart';
import '../widgets/streak_badge_widget.dart';

class AttendanceHistoryScreen extends ConsumerStatefulWidget {
  const AttendanceHistoryScreen({super.key});

  @override
  ConsumerState<AttendanceHistoryScreen> createState() => _AttendanceHistoryScreenState();
}

class _AttendanceHistoryScreenState extends ConsumerState<AttendanceHistoryScreen> {
  DateTime? _selectedMonth;

  List<DateTime> _lastSixMonths() {
    final now = DateTime.now();
    return List<DateTime>.generate(
      6,
      (index) => DateTime(now.year, now.month - index, 1),
    );
  }

  @override
  Widget build(BuildContext context) {
    final historyAsync = ref.watch(myAttendanceHistoryProvider);
    final monthOptions = _lastSixMonths();

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: Text('My Attendance History', style: AppTextStyles.titleMedium),
      ),
      body: historyAsync.when(
        data: (history) {
          final selectedMonth = _selectedMonth;
          final filteredRecords = selectedMonth == null
              ? history.attendedServices
              : history.attendedServices.where((record) {
                  final serviceDate = record.serviceDate;
                  return serviceDate != null &&
                      serviceDate.year == selectedMonth.year &&
                      serviceDate.month == selectedMonth.month;
                }).toList();

          final grouped = _groupByMonth(filteredRecords);

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(myAttendanceHistoryProvider),
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
              children: <Widget>[
                _HeaderStatsCard(history: history),
                const SizedBox(height: 20),
                Text('Filter by Month', style: AppTextStyles.titleMedium),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: monthOptions.map((month) {
                    final isSelected = selectedMonth != null &&
                        selectedMonth.year == month.year &&
                        selectedMonth.month == month.month;
                    return ChoiceChip(
                      label: Text(formatMonthYear(month.month, month.year)),
                      selected: isSelected,
                      onSelected: (_) {
                        setState(() {
                          _selectedMonth = isSelected ? null : month;
                        });
                      },
                      selectedColor: AppColors.primary,
                      labelStyle: AppTextStyles.bodyMedium.copyWith(
                        color: isSelected ? Colors.white : AppColors.primary,
                        fontWeight: FontWeight.w700,
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 22),
                if (grouped.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppColors.card,
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(color: AppColors.inputBorder),
                    ),
                    child: Text(
                      'No attendance history found for the selected month.',
                      style: AppTextStyles.bodyMedium,
                    ),
                  )
                else
                  ...grouped.entries.map((entry) {
                    final month = entry.key;
                    final breakdown = _breakdownFor(history, month);
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Row(
                            children: <Widget>[
                              Text(
                                formatMonthYear(month.month, month.year),
                                style: AppTextStyles.titleMedium,
                              ),
                              const Spacer(),
                              Text(
                                breakdown != null
                                    ? formatPercentage(breakdown.rate)
                                    : '--',
                                style: AppTextStyles.bodyMedium.copyWith(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          ...entry.value.map(
                            (record) => AttendanceHistoryTile(record: record),
                          ),
                        ],
                      ),
                    );
                  }),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              error.toString(),
              textAlign: TextAlign.center,
              style: AppTextStyles.bodyLarge,
            ),
          ),
        ),
      ),
    );
  }

  Map<DateTime, List<AttendanceRecord>> _groupByMonth(List<AttendanceRecord> records) {
    final result = <DateTime, List<AttendanceRecord>>{};
    for (final record in records) {
      final serviceDate = record.serviceDate;
      if (serviceDate == null) {
        continue;
      }
      final key = DateTime(serviceDate.year, serviceDate.month, 1);
      result.putIfAbsent(key, () => <AttendanceRecord>[]).add(record);
    }
    final sortedEntries = result.entries.toList()
      ..sort((a, b) => b.key.compareTo(a.key));
    return Map<DateTime, List<AttendanceRecord>>.fromEntries(sortedEntries);
  }

  MonthlyAttendance? _breakdownFor(MemberAttendanceHistory history, DateTime month) {
    for (final item in history.monthlyBreakdown) {
      if (item.month == month.month && item.year == month.year) {
        return item;
      }
    }
    return null;
  }
}

class _HeaderStatsCard extends StatelessWidget {
  const _HeaderStatsCard({
    required this.history,
  });

  final MemberAttendanceHistory history;

  @override
  Widget build(BuildContext context) {
    final normalizedRate = normalizeRate(history.attendanceRate);

    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: AppColors.inputBorder),
      ),
      child: Row(
        children: <Widget>[
          SizedBox(
            width: 96,
            height: 96,
            child: Stack(
              alignment: Alignment.center,
              children: <Widget>[
                CircularProgressIndicator(
                  value: normalizedRate,
                  strokeWidth: 10,
                  backgroundColor: AppColors.inputBorder,
                  valueColor: const AlwaysStoppedAnimation<Color>(AppColors.accent),
                ),
                Text(
                  formatPercentage(history.attendanceRate),
                  style: AppTextStyles.titleMedium,
                ),
              ],
            ),
          ),
          const SizedBox(width: 18),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text('Overall Attendance', style: AppTextStyles.titleMedium),
                const SizedBox(height: 10),
                StreakBadgeWidget(streak: history.streak),
                const SizedBox(height: 12),
                Text(
                  'Longest streak: ${history.longestStreak} week${history.longestStreak == 1 ? '' : 's'}',
                  style: AppTextStyles.bodyMedium,
                ),
                const SizedBox(height: 4),
                Text(
                  'Total attended: ${history.attended}',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
