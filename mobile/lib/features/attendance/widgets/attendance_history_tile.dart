import 'package:flutter/material.dart';

import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../attendance_utils.dart';
import '../data/models/attendance_record.dart';

class AttendanceHistoryTile extends StatelessWidget {
  const AttendanceHistoryTile({
    super.key,
    required this.record,
  });

  final AttendanceRecord record;

  IconData _resolveIcon() {
    switch (record.attendeeType.toLowerCase()) {
      case 'visitor':
        return Icons.person_add_alt_1_rounded;
      case 'child':
        return Icons.child_care_rounded;
      case 'online':
        return Icons.laptop_mac_rounded;
      default:
        return Icons.event_available_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isRecent = record.serviceDate != null &&
        DateTime.now().difference(record.serviceDate!).inDays <= 14;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isRecent
            ? AppColors.accent.withValues(alpha: 0.12)
            : AppColors.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isRecent
              ? AppColors.accent.withValues(alpha: 0.4)
              : AppColors.inputBorder,
        ),
      ),
      child: Row(
        children: <Widget>[
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(_resolveIcon(), color: AppColors.primary),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  resolveRecordTitle(record),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTextStyles.bodyLarge.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${formatAttendanceDate(record.serviceDate)} • ${attendeeTypeLabel(record.attendeeType)}',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: AppTextStyles.bodyMedium,
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              formatTimeOfDay(record.checkInTime),
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.primary,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
