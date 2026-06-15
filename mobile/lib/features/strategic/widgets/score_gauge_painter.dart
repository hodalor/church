import 'dart:math' as math;

import 'package:flutter/material.dart';

class ScoreGaugePainter extends CustomPainter {
  ScoreGaugePainter({
    required this.score,
    required this.color,
  });

  final double score;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final strokeWidth = 14.0;
    final center = size.center(Offset.zero);
    final radius = (size.width / 2) - strokeWidth;
    final rect = Rect.fromCircle(center: center, radius: radius);

    final backgroundPaint = Paint()
      ..color = Colors.grey.shade300
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final progressPaint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(rect, math.pi * 0.75, math.pi * 1.5, false, backgroundPaint);
    canvas.drawArc(
      rect,
      math.pi * 0.75,
      math.pi * 1.5 * (score.clamp(0, 100) / 100),
      false,
      progressPaint,
    );
  }

  @override
  bool shouldRepaint(covariant ScoreGaugePainter oldDelegate) {
    return oldDelegate.score != score || oldDelegate.color != color;
  }
}
