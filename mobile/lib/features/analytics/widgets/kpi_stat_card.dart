import 'package:flutter/material.dart';
import '../../../../core/utils/app_colors.dart';

class KpiStatCard extends StatelessWidget {
  const KpiStatCard({
    super.key,
    required this.label,
    required this.value,
    this.percentChange,
    this.trend = 'stable',
    this.onTap,
  });

  final String label;
  final String value;
  final double? percentChange;
  final String trend;
  final VoidCallback? onTap;

  Color get _trendColor {
    if (trend == 'up' || trend == 'improving') {
      return AppColors.success;
    }
    if (trend == 'down' || trend == 'declining') {
      return AppColors.danger;
    }
    return AppColors.mutedText;
  }

  IconData get _trendIcon {
    if (trend == 'up' || trend == 'improving') {
      return Icons.arrow_upward_rounded;
    }
    if (trend == 'down' || trend == 'declining') {
      return Icons.arrow_downward_rounded;
    }
    return Icons.horizontal_rule_rounded;
  }

  @override
  Widget build(BuildContext context) {
    final child = Container(
      width: 164,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.inputBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontSize: 22,
                ),
          ),
          const SizedBox(height: 10),
          Row(
            children: <Widget>[
              Icon(_trendIcon, size: 16, color: _trendColor),
              const SizedBox(width: 4),
              Text(
                percentChange == null ? 'Stable' : '${percentChange!.toStringAsFixed(1)}%',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: _trendColor,
                      fontWeight: FontWeight.w700,
                    ),
              ),
            ],
          ),
        ],
      ),
    );

    if (onTap == null) {
      return child;
    }

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: child,
    );
  }
}
