import 'package:flutter/material.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import 'follow_up_card.dart';

class OverdueFollowUpCard extends StatelessWidget {
  const OverdueFollowUpCard({
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
    final overdueDays = int.tryParse((followUp['overdueDays'] ?? 0).toString()) ?? 0;

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.danger.withValues(alpha: 0.35)),
      ),
      child: Column(
        children: <Widget>[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: const BoxDecoration(
              color: Color(0xFFFFF2F0),
              borderRadius: BorderRadius.vertical(top: Radius.circular(21)),
            ),
            child: Row(
              children: <Widget>[
                const Icon(Icons.warning_amber_rounded, color: AppColors.danger, size: 18),
                const SizedBox(width: 8),
                Text(
                  'Overdue by $overdueDays day${overdueDays == 1 ? '' : 's'}',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.danger,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(1),
            child: FollowUpCard(
              followUp: followUp,
              onTap: onTap,
              onComplete: onComplete,
            ),
          ),
        ],
      ),
    );
  }
}
