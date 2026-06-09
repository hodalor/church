import 'dart:convert';
import 'dart:typed_data';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../data/models/registration.dart';

class RegistrationTicketCard extends StatelessWidget {
  const RegistrationTicketCard({
    super.key,
    required this.registration,
    this.bannerUrl,
    this.onTapQr,
  });

  final Registration registration;
  final String? bannerUrl;
  final VoidCallback? onTapQr;

  Uint8List? _decodeQr(String? value) {
    if (value == null || value.isEmpty) {
      return null;
    }
    final encoded = value.contains(',') ? value.split(',').last : value;
    try {
      return base64Decode(encoded);
    } catch (_) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final qrBytes = _decodeQr(registration.qrCode);
    return CustomPaint(
      painter: _TicketBorderPainter(),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          children: <Widget>[
            Row(
              children: <Widget>[
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: SizedBox(
                    width: 70,
                    height: 70,
                    child: (bannerUrl ?? '').isNotEmpty
                        ? CachedNetworkImage(imageUrl: bannerUrl!, fit: BoxFit.cover)
                        : Container(
                            decoration: const BoxDecoration(
                              gradient: LinearGradient(
                                colors: <Color>[AppColors.primary, Color(0xFF31446F)],
                              ),
                            ),
                          ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text(registration.eventTitle, style: AppTextStyles.titleMedium),
                      const SizedBox(height: 6),
                      Text(
                        registration.attendeeName,
                        style: AppTextStyles.bodyLarge.copyWith(fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              height: 1,
              color: AppColors.inputBorder,
            ),
            const SizedBox(height: 16),
            Row(
              children: <Widget>[
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      _TicketMeta(label: 'Tier', value: registration.tierName ?? 'General'),
                      const SizedBox(height: 12),
                      _TicketMeta(label: 'Registration ID', value: registration.registrationId),
                      const SizedBox(height: 12),
                      _TicketMeta(
                        label: 'Status',
                        value: registration.status.replaceAll('_', ' '),
                      ),
                    ],
                  ),
                ),
                GestureDetector(
                  onTap: onTapQr,
                  child: Container(
                    width: 82,
                    height: 82,
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: qrBytes != null
                        ? Image.memory(qrBytes, fit: BoxFit.contain)
                        : const Icon(Icons.qr_code_2_rounded, size: 44, color: AppColors.primary),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _TicketMeta extends StatelessWidget {
  const _TicketMeta({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(label, style: AppTextStyles.bodyMedium),
        const SizedBox(height: 2),
        Text(
          value,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: AppTextStyles.bodyLarge.copyWith(
            color: AppColors.primary,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

class _TicketBorderPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final rect = RRect.fromRectAndRadius(
      Offset.zero & size,
      const Radius.circular(24),
    );
    final borderPaint = Paint()
      ..color = AppColors.primary.withValues(alpha: 0.16)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;

    final path = Path()..addRRect(rect);
    _drawDashedPath(canvas, path, borderPaint);

    final perforationPaint = Paint()..color = AppColors.surface;
    canvas.drawCircle(Offset(0, size.height / 2), 10, perforationPaint);
    canvas.drawCircle(Offset(size.width, size.height / 2), 10, perforationPaint);
  }

  void _drawDashedPath(Canvas canvas, Path path, Paint paint) {
    for (final metric in path.computeMetrics()) {
      double distance = 0;
      const dash = 8.0;
      const gap = 6.0;
      while (distance < metric.length) {
        final next = distance + dash;
        canvas.drawPath(metric.extractPath(distance, next.clamp(0, metric.length)), paint);
        distance += dash + gap;
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
