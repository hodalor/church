import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../data/models/health_score.dart';

class HealthScoreCard extends StatelessWidget {
  const HealthScoreCard({
    super.key,
    required this.healthScore,
  });

  final HealthScore healthScore;

  @override
  Widget build(BuildContext context) {
    final progress = (healthScore.overall / 100).clamp(0, 1).toDouble();

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.inputBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Expanded(
                child: Text('Health Score', style: AppTextStyles.titleMedium),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: healthScore.statusColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  healthScore.statusLabel,
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: healthScore.statusColor,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: <Widget>[
              SizedBox(
                width: 104,
                height: 104,
                child: CustomPaint(
                  painter: _HealthRingPainter(
                    progress: progress,
                    color: healthScore.statusColor,
                  ),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: <Widget>[
                        Text(
                          '${healthScore.overall.round()}',
                          style: AppTextStyles.headlineMedium.copyWith(fontSize: 30),
                        ),
                        Text('Overall', style: AppTextStyles.bodyMedium.copyWith(fontSize: 12)),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 18),
              Expanded(
                child: Column(
                  children: <Widget>[
                    _SubScoreRow(label: 'Attendance', value: healthScore.attendance, max: 30),
                    _SubScoreRow(label: 'Giving', value: healthScore.giving, max: 25),
                    _SubScoreRow(label: 'Participation', value: healthScore.participation, max: 25),
                    _SubScoreRow(label: 'Involvement', value: healthScore.involvement, max: 20),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SubScoreRow extends StatelessWidget {
  const _SubScoreRow({
    required this.label,
    required this.value,
    required this.max,
  });

  final String label;
  final double value;
  final double max;

  @override
  Widget build(BuildContext context) {
    final progress = max == 0 ? 0.0 : (value / max).clamp(0, 1).toDouble();

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Expanded(child: Text(label, style: AppTextStyles.bodyMedium)),
              Text(
                value.toStringAsFixed(0),
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 7,
              backgroundColor: AppColors.inputBorder,
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.accent),
            ),
          ),
        ],
      ),
    );
  }
}

class _HealthRingPainter extends CustomPainter {
  _HealthRingPainter({
    required this.progress,
    required this.color,
  });

  final double progress;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    const strokeWidth = 10.0;
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (math.min(size.width, size.height) / 2) - strokeWidth;
    final backgroundPaint = Paint()
      ..color = AppColors.inputBorder
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;
    final progressPaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, backgroundPaint);
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      2 * math.pi * progress,
      false,
      progressPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _HealthRingPainter oldDelegate) {
    return oldDelegate.progress != progress || oldDelegate.color != color;
  }
}
