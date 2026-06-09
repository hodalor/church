import 'package:flutter/material.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../data/models/volunteer.dart';

class BadgeRowWidget extends StatelessWidget {
  const BadgeRowWidget({
    super.key,
    required this.badges,
  });

  final List<VolunteerBadge> badges;

  @override
  Widget build(BuildContext context) {
    if (badges.isEmpty) {
      return Text('No badges yet', style: AppTextStyles.bodyMedium.copyWith(color: Colors.white70));
    }

    return SizedBox(
      height: 46,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: badges.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (context, index) {
          final badge = badges[index];
          return Tooltip(
            message: badge.earnedDate != null
                ? '${badge.name} • ${badge.earnedDate!.day}/${badge.earnedDate!.month}/${badge.earnedDate!.year}'
                : badge.name,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.14),
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: Colors.white.withValues(alpha: 0.16)),
              ),
              child: Row(
                children: <Widget>[
                  const Icon(Icons.workspace_premium_rounded, size: 18, color: AppColors.accent),
                  const SizedBox(width: 8),
                  Text(
                    badge.name,
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
