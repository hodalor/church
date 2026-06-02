import 'dart:async';

import 'package:flutter/material.dart';

import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../../members/widgets/member_avatar.dart';

enum CheckInOverlayType { success, warning, error }

class CheckInSuccessOverlay extends StatefulWidget {
  const CheckInSuccessOverlay({
    super.key,
    required this.title,
    required this.message,
    this.memberName,
    this.photoUrl,
    this.timeLabel,
    this.onDismiss,
    this.dismissLabel = 'Dismiss',
    this.type = CheckInOverlayType.success,
    this.autoDismissDuration = const Duration(seconds: 2),
  });

  final String title;
  final String message;
  final String? memberName;
  final String? photoUrl;
  final String? timeLabel;
  final VoidCallback? onDismiss;
  final String dismissLabel;
  final CheckInOverlayType type;
  final Duration autoDismissDuration;

  @override
  State<CheckInSuccessOverlay> createState() => _CheckInSuccessOverlayState();
}

class _CheckInSuccessOverlayState extends State<CheckInSuccessOverlay>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  Timer? _timer;

  Color get _backgroundColor {
    switch (widget.type) {
      case CheckInOverlayType.warning:
        return const Color(0xFFE2A93B);
      case CheckInOverlayType.error:
        return AppColors.danger;
      case CheckInOverlayType.success:
        return AppColors.success;
    }
  }

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 650),
    )..forward();

    if (widget.onDismiss != null) {
      _timer = Timer(widget.autoDismissDuration, widget.onDismiss!);
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: Material(
        color: Colors.black.withValues(alpha: 0.32),
        child: Center(
          child: ScaleTransition(
            scale: CurvedAnimation(parent: _controller, curve: Curves.easeOutBack),
            child: Container(
              margin: const EdgeInsets.all(24),
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: <Color>[
                    _backgroundColor,
                    _backgroundColor.withValues(alpha: 0.9),
                  ],
                ),
                borderRadius: BorderRadius.circular(32),
                boxShadow: <BoxShadow>[
                  BoxShadow(
                    color: _backgroundColor.withValues(alpha: 0.35),
                    blurRadius: 28,
                    offset: const Offset(0, 12),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 500),
                    width: 110,
                    height: 110,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.18),
                      shape: BoxShape.circle,
                    ),
                    child: CustomPaint(
                      painter: _CheckmarkPainter(
                        color: Colors.white,
                        isError: widget.type == CheckInOverlayType.error,
                      ),
                    ),
                  ),
                  if (widget.memberName != null && widget.memberName!.trim().isNotEmpty) ...<Widget>[
                    const SizedBox(height: 20),
                    MemberAvatar(
                      photoUrl: widget.photoUrl,
                      firstName: widget.memberName!,
                      lastName: '',
                      radius: 28,
                    ),
                  ],
                  const SizedBox(height: 18),
                  Text(
                    widget.title,
                    textAlign: TextAlign.center,
                    style: AppTextStyles.headlineMedium.copyWith(color: Colors.white),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    widget.message,
                    textAlign: TextAlign.center,
                    style: AppTextStyles.bodyLarge.copyWith(
                      color: Colors.white.withValues(alpha: 0.92),
                    ),
                  ),
                  if (widget.timeLabel != null && widget.timeLabel!.isNotEmpty) ...<Widget>[
                    const SizedBox(height: 14),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.16),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        widget.timeLabel!,
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                  if (widget.onDismiss != null) ...<Widget>[
                    const SizedBox(height: 20),
                    TextButton(
                      onPressed: widget.onDismiss,
                      style: TextButton.styleFrom(
                        foregroundColor: Colors.white,
                      ),
                      child: Text(widget.dismissLabel),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _CheckmarkPainter extends CustomPainter {
  const _CheckmarkPainter({
    required this.color,
    required this.isError,
  });

  final Color color;
  final bool isError;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 8
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    if (isError) {
      canvas.drawLine(
        Offset(size.width * 0.32, size.height * 0.32),
        Offset(size.width * 0.68, size.height * 0.68),
        paint,
      );
      canvas.drawLine(
        Offset(size.width * 0.68, size.height * 0.32),
        Offset(size.width * 0.32, size.height * 0.68),
        paint,
      );
      return;
    }

    final path = Path()
      ..moveTo(size.width * 0.28, size.height * 0.54)
      ..lineTo(size.width * 0.46, size.height * 0.7)
      ..lineTo(size.width * 0.74, size.height * 0.36);
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _CheckmarkPainter oldDelegate) {
    return oldDelegate.color != color || oldDelegate.isError != isError;
  }
}
