import 'package:flutter/material.dart';
import '../../../../core/utils/app_colors.dart';
import '../data/models/branch_metric.dart';

class BranchPerformanceCard extends StatelessWidget {
  const BranchPerformanceCard({
    super.key,
    required this.branch,
    this.onTap,
  });

  final BranchMetric branch;
  final VoidCallback? onTap;

  Color get _gradeColor {
    switch (branch.grade) {
      case 'A':
        return AppColors.success;
      case 'B':
        return Colors.teal;
      case 'C':
        return Colors.amber.shade700;
      case 'D':
        return Colors.orange.shade700;
      default:
        return AppColors.danger;
    }
  }

  IconData get _trendIcon {
    switch (branch.trend) {
      case 'up':
      case 'improving':
        return Icons.trending_up_rounded;
      case 'down':
      case 'declining':
        return Icons.trending_down_rounded;
      default:
        return Icons.trending_flat_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    final card = Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.inputBorder),
      ),
      child: Row(
        children: <Widget>[
          CircleAvatar(
            radius: 24,
            backgroundColor: AppColors.primary.withValues(alpha: 0.1),
            child: Text(
              branch.branchName.isNotEmpty ? branch.branchName[0].toUpperCase() : 'B',
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Row(
                  children: <Widget>[
                    Expanded(
                      child: Text(
                        branch.branchName,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: _gradeColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        branch.grade,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: _gradeColor,
                              fontWeight: FontWeight.w800,
                            ),
                      ),
                    ),
                  ],
                ),
                if ((branch.city ?? '').isNotEmpty) ...<Widget>[
                  const SizedBox(height: 4),
                  Text(branch.city!, style: Theme.of(context).textTheme.bodyMedium),
                ],
                const SizedBox(height: 12),
                Wrap(
                  spacing: 12,
                  runSpacing: 8,
                  children: <Widget>[
                    _miniStat(context, 'Members', branch.members.toString()),
                    _miniStat(context, 'Attendance', branch.attendance.toStringAsFixed(0)),
                    _miniStat(context, 'Income', branch.finance.toStringAsFixed(0)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Icon(_trendIcon, color: _gradeColor),
        ],
      ),
    );

    if (onTap == null) {
      return card;
    }

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: card,
    );
  }

  Widget _miniStat(BuildContext context, String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(label, style: Theme.of(context).textTheme.bodyMedium),
        const SizedBox(height: 2),
        Text(
          value,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                fontWeight: FontWeight.w700,
              ),
        ),
      ],
    );
  }
}
