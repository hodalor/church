import 'package:flutter/material.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../data/models/assignment.dart';
import '../volunteers_utils.dart';

class VolunteerAssignmentTile extends StatelessWidget {
  const VolunteerAssignmentTile({
    super.key,
    required this.assignment,
    this.leaderMode = false,
    this.onAttended,
    this.onAbsent,
  });

  final Assignment assignment;
  final bool leaderMode;
  final VoidCallback? onAttended;
  final VoidCallback? onAbsent;

  @override
  Widget build(BuildContext context) {
    final statusColor = assignmentStatusColor(assignment.status);
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.inputBorder),
      ),
      child: Row(
        children: <Widget>[
          CircleAvatar(
            radius: 24,
            backgroundColor: AppColors.primary.withValues(alpha: 0.1),
            backgroundImage: assignment.memberPhoto != null && assignment.memberPhoto!.isNotEmpty
                ? NetworkImage(assignment.memberPhoto!)
                : null,
            child: assignment.memberPhoto == null || assignment.memberPhoto!.isEmpty
                ? Text(
                    assignment.memberName.isNotEmpty ? assignment.memberName[0].toUpperCase() : 'V',
                    style: AppTextStyles.titleMedium.copyWith(color: AppColors.primary),
                  )
                : null,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(assignment.memberName, style: AppTextStyles.bodyLarge.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text('${assignment.role} • ${assignment.department}', style: AppTextStyles.bodyMedium),
              ],
            ),
          ),
          if (leaderMode) ...<Widget>[
            TextButton(onPressed: onAttended, child: const Text('Attended')),
            TextButton(onPressed: onAbsent, child: const Text('Absent')),
          ] else
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
        ],
      ),
    );
  }
}
