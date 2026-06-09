import 'package:flutter/material.dart';
import '../../../core/utils/app_text_styles.dart';
import '../events_utils.dart';

class CountdownChip extends StatelessWidget {
  const CountdownChip({
    super.key,
    required this.targetDate,
  });

  final DateTime? targetDate;

  @override
  Widget build(BuildContext context) {
    final color = countdownColor(targetDate);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Icon(Icons.schedule_rounded, size: 16, color: color),
          const SizedBox(width: 6),
          Text(
            buildCountdownLabel(targetDate),
            style: AppTextStyles.bodyMedium.copyWith(
              color: color,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
