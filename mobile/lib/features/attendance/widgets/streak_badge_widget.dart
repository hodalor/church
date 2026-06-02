import 'package:flutter/material.dart';

import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';

class StreakBadgeWidget extends StatefulWidget {
  const StreakBadgeWidget({
    super.key,
    required this.streak,
  });

  final int streak;

  @override
  State<StreakBadgeWidget> createState() => _StreakBadgeWidgetState();
}

class _StreakBadgeWidgetState extends State<StreakBadgeWidget>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _scale = Tween<double>(begin: 1, end: 1.14).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );

    if (widget.streak > 4) {
      _controller.repeat(reverse: true);
    }
  }

  @override
  void didUpdateWidget(covariant StreakBadgeWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.streak > 4 && !_controller.isAnimating) {
      _controller.repeat(reverse: true);
    }
    if (widget.streak <= 4 && _controller.isAnimating) {
      _controller.stop();
      _controller.reset();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isActive = widget.streak > 0;
    final color = isActive ? AppColors.accent : AppColors.mutedText;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          ScaleTransition(
            scale: _scale,
            child: Icon(Icons.local_fire_department_rounded, color: color),
          ),
          const SizedBox(width: 8),
          Text(
            '${widget.streak} week${widget.streak == 1 ? '' : 's'} streak',
            style: AppTextStyles.bodyMedium.copyWith(
              color: isActive ? AppColors.primary : AppColors.mutedText,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
