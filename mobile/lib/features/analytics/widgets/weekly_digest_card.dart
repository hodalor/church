import 'package:flutter/material.dart';
import '../../../../core/utils/app_colors.dart';
import '../data/models/weekly_digest.dart';

class WeeklyDigestCard extends StatelessWidget {
  const WeeklyDigestCard({
    super.key,
    required this.digest,
    this.onFullReport,
  });

  final WeeklyDigest digest;
  final VoidCallback? onFullReport;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.accent, width: 1.2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            digest.period,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: AppColors.primary,
                ),
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: <Widget>[
              _mini(context, 'Members', digest.members.toStringAsFixed(0)),
              _mini(context, 'Attendance', digest.attendance.toStringAsFixed(0)),
              _mini(context, 'Income', digest.finance.toStringAsFixed(0)),
              _mini(context, 'Visitors', digest.visitors.toStringAsFixed(0)),
            ],
          ),
          if (onFullReport != null) ...<Widget>[
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: onFullReport,
                child: const Text('Full Report'),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _mini(BuildContext context, String label, String value) {
    return SizedBox(
      width: 120,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(label, style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 4),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          ),
        ],
      ),
    );
  }
}
