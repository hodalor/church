import 'package:flutter/material.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../visitors_utils.dart';

class FollowUpCard extends StatelessWidget {
  const FollowUpCard({
    super.key,
    required this.followUp,
    this.onTap,
    this.onComplete,
  });

  final Map<String, dynamic> followUp;
  final VoidCallback? onTap;
  final VoidCallback? onComplete;

  @override
  Widget build(BuildContext context) {
    final scheduledAt = DateTime.tryParse((followUp['scheduledDate'] ?? '').toString());
    final method = (followUp['method'] ?? 'call').toString();

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.inputBorder),
        ),
        child: Row(
          children: <Widget>[
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(
                followUpMethodIcon(method),
                color: AppColors.primary,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    (followUp['visitorName'] ?? 'Visitor').toString(),
                    style: AppTextStyles.bodyLarge.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    (followUp['visitorPhone'] ?? 'No phone').toString(),
                    style: AppTextStyles.bodyMedium,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    scheduledAt == null ? 'Time unavailable' : timeago.format(scheduledAt),
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            OutlinedButton(
              onPressed: onComplete,
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.accent,
                side: const BorderSide(color: AppColors.accent),
              ),
              child: const Text('Complete'),
            ),
          ],
        ),
      ),
    );
  }
}
