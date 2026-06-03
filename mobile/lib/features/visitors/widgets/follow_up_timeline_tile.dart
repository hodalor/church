import 'package:flutter/material.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../data/models/follow_up.dart';
import '../visitors_utils.dart';

class FollowUpTimelineTile extends StatelessWidget {
  const FollowUpTimelineTile({
    super.key,
    required this.followUp,
    this.isLast = false,
  });

  final FollowUp followUp;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final Color dotColor = followUp.isCompleted
        ? AppColors.success
        : followUp.isOverdue
            ? AppColors.danger
            : const Color(0xFF2563EB);

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          SizedBox(
            width: 28,
            child: Column(
              children: <Widget>[
                Container(
                  width: 14,
                  height: 14,
                  decoration: BoxDecoration(
                    color: dotColor,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    followUp.isCompleted
                        ? Icons.check_rounded
                        : followUp.isOverdue
                            ? Icons.schedule_rounded
                            : Icons.access_time_rounded,
                    size: 10,
                    color: Colors.white,
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      color: AppColors.inputBorder,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    (followUp.method ?? 'Follow-up').toUpperCase(),
                    style: AppTextStyles.labelSmall.copyWith(letterSpacing: 1.2),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    formatVisitorDate(followUp.scheduledAt),
                    style: AppTextStyles.bodyLarge.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  if ((followUp.outcome ?? '').isNotEmpty) ...<Widget>[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: dotColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        followUpOutcomeLabel(followUp.outcome ?? ''),
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: dotColor,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                  if ((followUp.notes ?? '').isNotEmpty) ...<Widget>[
                    const SizedBox(height: 8),
                    Text(followUp.notes!, style: AppTextStyles.bodyMedium),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
