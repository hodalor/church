import 'package:flutter/material.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../data/models/assignment.dart';
import '../data/models/roster.dart';
import '../volunteers_utils.dart';

class UpcomingAssignmentCard extends StatelessWidget {
  const UpcomingAssignmentCard({
    super.key,
    required this.roster,
    required this.assignment,
    this.onTap,
    this.onConfirm,
  });

  final Roster roster;
  final Assignment assignment;
  final VoidCallback? onTap;
  final VoidCallback? onConfirm;

  @override
  Widget build(BuildContext context) {
    final statusColor = assignmentStatusColor(assignment.status);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: AppColors.inputBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(roster.title, style: AppTextStyles.titleMedium),
            const SizedBox(height: 8),
            Text(
              roster.date != null
                  ? '${roster.date!.day}/${roster.date!.month}/${roster.date!.year}'
                  : 'Date TBD',
              style: AppTextStyles.bodyMedium,
            ),
            const SizedBox(height: 12),
            Text(
              '${assignment.role} • ${assignment.department}',
              style: AppTextStyles.bodyLarge.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 12),
            Row(
              children: <Widget>[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    assignment.status.replaceAll('_', ' '),
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: statusColor,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                const Spacer(),
                if (assignment.status == 'assigned')
                  TextButton(
                    onPressed: onConfirm,
                    child: const Text('Confirm'),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
