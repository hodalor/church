import 'package:flutter/material.dart';

import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../attendance_utils.dart';
import '../data/models/service.dart';

class ServiceLiveCard extends StatefulWidget {
  const ServiceLiveCard({
    super.key,
    required this.service,
    required this.liveCount,
    required this.buttonLabel,
    required this.onPressed,
  });

  final Service service;
  final int liveCount;
  final String buttonLabel;
  final VoidCallback onPressed;

  @override
  State<ServiceLiveCard> createState() => _ServiceLiveCardState();
}

class _ServiceLiveCardState extends State<ServiceLiveCard>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _glow;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);
    _glow = Tween<double>(begin: 0.22, end: 0.78).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _glow,
      builder: (context, _) {
        return Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppColors.primary,
            borderRadius: BorderRadius.circular(26),
            border: Border.all(
              color: Colors.greenAccent.withValues(alpha: _glow.value),
              width: 1.8,
            ),
            boxShadow: <BoxShadow>[
              BoxShadow(
                color: Colors.greenAccent.withValues(alpha: _glow.value * 0.2),
                blurRadius: 24,
                spreadRadius: 2,
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                children: <Widget>[
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.success.withValues(alpha: 0.22),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      'LIVE',
                      style: AppTextStyles.labelSmall.copyWith(
                        color: Colors.white,
                        letterSpacing: 1.4,
                      ),
                    ),
                  ),
                  const Spacer(),
                  Text(
                    '${widget.liveCount} checked in',
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: AppColors.accent,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Text(
                widget.service.title,
                style: AppTextStyles.headlineMedium.copyWith(color: Colors.white),
              ),
              const SizedBox(height: 8),
              Text(
                '${formatAttendanceDate(widget.service.date)} • ${formatServiceTime(widget.service)}',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: Colors.white.withValues(alpha: 0.78),
                ),
              ),
              if (widget.service.branch?.isNotEmpty == true) ...<Widget>[
                const SizedBox(height: 6),
                Text(
                  widget.service.branch!,
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: Colors.white.withValues(alpha: 0.72),
                  ),
                ),
              ],
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: widget.onPressed,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accent,
                    foregroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(18),
                    ),
                  ),
                  child: Text(
                    widget.buttonLabel,
                    style: AppTextStyles.bodyLarge.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
