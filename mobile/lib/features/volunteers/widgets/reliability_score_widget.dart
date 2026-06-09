import 'package:flutter/material.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../volunteers_utils.dart';

class ReliabilityScoreWidget extends StatelessWidget {
  const ReliabilityScoreWidget({
    super.key,
    required this.score,
    this.size = 96,
  });

  final double score;
  final double size;

  @override
  Widget build(BuildContext context) {
    final color = reliabilityColor(score);
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: <Widget>[
          SizedBox(
            width: size,
            height: size,
            child: CircularProgressIndicator(
              value: (score.clamp(0, 100)) / 100,
              strokeWidth: 8,
              backgroundColor: AppColors.inputBorder,
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              Text(
                '${score.round()}%',
                style: AppTextStyles.titleMedium.copyWith(
                  fontSize: 20,
                  color: color,
                ),
              ),
              const Icon(Icons.star_rounded, color: AppColors.accent, size: 18),
            ],
          ),
        ],
      ),
    );
  }
}
