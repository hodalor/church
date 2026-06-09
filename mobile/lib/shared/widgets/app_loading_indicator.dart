import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/utils/app_colors.dart';

class AppLoadingIndicator extends StatelessWidget {
  const AppLoadingIndicator({
    super.key,
    this.label = 'Loading...',
    this.showLabel = true,
    this.size = 56,
  });

  final String label;
  final bool showLabel;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        Stack(
          alignment: Alignment.center,
          children: <Widget>[
            Container(
              width: size,
              height: size,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.accent, width: 3),
              ),
            )
                .animate(onPlay: (controller) => controller.repeat())
                .rotate(duration: 900.ms),
            const Icon(
              Icons.church_rounded,
              color: AppColors.primary,
              size: 28,
            ),
          ],
        ),
        if (showLabel) ...<Widget>[
          const SizedBox(height: 14),
          Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w600,
                ),
          ),
        ],
      ],
    );
  }
}
