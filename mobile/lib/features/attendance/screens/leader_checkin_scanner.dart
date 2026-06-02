import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../../auth/providers/auth_provider.dart';
import '../attendance_utils.dart';
import '../providers/attendance_provider.dart';
import '../providers/leader_attendance_provider.dart';
import '../widgets/checkin_success_overlay.dart';
import '../widgets/leader_checkin_bottom_sheets.dart';

class LeaderCheckInScanner extends ConsumerStatefulWidget {
  const LeaderCheckInScanner({
    super.key,
    required this.serviceId,
  });

  final String serviceId;

  @override
  ConsumerState<LeaderCheckInScanner> createState() => _LeaderCheckInScannerState();
}

class _LeaderCheckInScannerState extends ConsumerState<LeaderCheckInScanner> {
  final MobileScannerController _scannerController = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
    formats: const <BarcodeFormat>[BarcodeFormat.qrCode],
  );

  Timer? _refreshTimer;
  bool _isProcessing = false;
  _ScannerOverlayState? _overlay;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(leaderAttendanceProvider.notifier).selectService(widget.serviceId);
    });

    _refreshTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      ref.read(leaderAttendanceProvider.notifier).refreshLive();
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    _scannerController.dispose();
    super.dispose();
  }

  Future<void> _handleBarcode(String qrData) async {
    if (_isProcessing || qrData.trim().isEmpty) {
      return;
    }

    _isProcessing = true;
    await _scannerController.stop();

    try {
      final result = await ref
          .read(attendanceRepositoryProvider)
          .qrCheckIn(qrData, widget.serviceId);
      await ref.read(leaderAttendanceProvider.notifier).refreshLive();

      final isAlreadyChecked = responseLooksLikeAlreadyCheckedIn(result);
      final type = isAlreadyChecked
          ? CheckInOverlayType.warning
          : CheckInOverlayType.success;
      final title = isAlreadyChecked ? 'Already Checked In' : 'Checked In';
      final message = isAlreadyChecked
          ? responseMessage(result, fallback: 'Member was already checked in.')
          : responseMessage(result, fallback: 'Attendance recorded successfully.');

      if (!mounted) {
        return;
      }

      setState(() {
        _overlay = _ScannerOverlayState(
          type: type,
          title: title,
          message: message,
          memberName: (result['memberName'] ??
                  result['name'] ??
                  result['attendance']?['memberName'])
              ?.toString(),
          photoUrl: (result['photoUrl'] ??
                  result['attendance']?['photoUrl'])
              ?.toString(),
          timeLabel: formatTimeOfDay(responseCheckInTime(result)),
        );
      });

      await Future<void>.delayed(
        Duration(milliseconds: isAlreadyChecked ? 1500 : 2000),
      );
    } catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _overlay = _ScannerOverlayState(
          type: CheckInOverlayType.error,
          title: 'Check-in Failed',
          message: _mapError(error),
        );
      });

      await Future<void>.delayed(const Duration(seconds: 2));
    } finally {
      if (mounted) {
        setState(() {
          _overlay = null;
        });
      }
      _isProcessing = false;
      await _scannerController.start();
    }
  }

  Future<void> _handleBottomAction(
    Future<Map<String, dynamic>?> Function() action,
  ) async {
    final result = await action();
    await ref.read(leaderAttendanceProvider.notifier).refreshLive();

    if (result == null || !mounted) {
      return;
    }

    final pickupCode = (result['pickupCode'] ?? '').toString();
    if (pickupCode.isNotEmpty) {
      await Clipboard.setData(ClipboardData(text: pickupCode));
      if (!mounted) {
        return;
      }
      await showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Pickup Code'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              Text(
                pickupCode,
                style: AppTextStyles.headlineMedium.copyWith(
                  color: AppColors.primary,
                  fontSize: 34,
                ),
              ),
              const SizedBox(height: 10),
              const Text('Copy Code'),
            ],
          ),
          actions: <Widget>[
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Close'),
            ),
          ],
        ),
      );
      return;
    }

    if (!mounted) {
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(responseMessage(result))),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final leaderState = ref.watch(leaderAttendanceProvider);
    final service = leaderState.selectedService;

    if (!isLeaderAttendanceRole(authState.user?.role)) {
      return Scaffold(
        appBar: AppBar(
          title: Text('Attendance Scanner', style: AppTextStyles.titleMedium),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              'Only approved leaders can use the attendance scanner.',
              textAlign: TextAlign.center,
              style: AppTextStyles.bodyLarge,
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(service?.title ?? 'Attendance Scanner'),
            Text(
              '${leaderState.liveCount} live',
              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.accent),
            ),
          ],
        ),
        actions: <Widget>[
          IconButton(
            onPressed: () => _scannerController.toggleTorch(),
            icon: const Icon(Icons.flash_on_rounded),
          ),
        ],
      ),
      body: Stack(
        children: <Widget>[
          MobileScanner(
            controller: _scannerController,
            onDetect: (capture) {
              final qrData = capture.barcodes.firstOrNull?.rawValue;
              if (qrData != null) {
                _handleBarcode(qrData);
              }
            },
          ),
          const _ScannerFrame(),
          Positioned(
            left: 16,
            right: 16,
            bottom: 18,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.68),
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Row(
                    children: <Widget>[
                      _BottomActionButton(
                        label: 'Manual Entry',
                        icon: Icons.person_search_rounded,
                        onPressed: () => _handleBottomAction(
                          () => showManualCheckInSheet(
                            context,
                            serviceId: widget.serviceId,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      _BottomActionButton(
                        label: 'Visitor',
                        icon: Icons.person_add_alt_1_rounded,
                        onPressed: () => _handleBottomAction(
                          () => showVisitorCheckInSheet(
                            context,
                            serviceId: widget.serviceId,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      _BottomActionButton(
                        label: 'Child',
                        icon: Icons.child_care_rounded,
                        onPressed: () => _handleBottomAction(
                          () => showChildCheckInSheet(
                            context,
                            serviceId: widget.serviceId,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          if (_overlay != null)
            CheckInSuccessOverlay(
              type: _overlay!.type,
              title: _overlay!.title,
              message: _overlay!.message,
              memberName: _overlay!.memberName,
              photoUrl: _overlay!.photoUrl,
              timeLabel: _overlay!.timeLabel,
            ),
        ],
      ),
    );
  }

  String _mapError(Object error) {
    if (error is DioException) {
      final data = error.response?.data;
      if (data is Map<String, dynamic> && data['message'] != null) {
        return data['message'].toString();
      }
      if (error.message != null && error.message!.isNotEmpty) {
        return error.message!;
      }
    }
    return error.toString();
  }
}

class _BottomActionButton extends StatelessWidget {
  const _BottomActionButton({
    required this.label,
    required this.icon,
    required this.onPressed,
  });

  final String label;
  final IconData icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: ElevatedButton.icon(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.white,
          foregroundColor: AppColors.primary,
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
        icon: Icon(icon, size: 18),
        label: Text(label, overflow: TextOverflow.ellipsis),
      ),
    );
  }
}

class _ScannerFrame extends StatefulWidget {
  const _ScannerFrame();

  @override
  State<_ScannerFrame> createState() => _ScannerFrameState();
}

class _ScannerFrameState extends State<_ScannerFrame>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Center(
        child: Container(
          width: 270,
          height: 270,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.18),
              width: 1.2,
            ),
          ),
          child: Stack(
            children: <Widget>[
              const Positioned(
                left: 0,
                top: 0,
                child: _CornerMarker(alignment: Alignment.topLeft),
              ),
              const Positioned(
                right: 0,
                top: 0,
                child: _CornerMarker(alignment: Alignment.topRight),
              ),
              const Positioned(
                left: 0,
                bottom: 0,
                child: _CornerMarker(alignment: Alignment.bottomLeft),
              ),
              const Positioned(
                right: 0,
                bottom: 0,
                child: _CornerMarker(alignment: Alignment.bottomRight),
              ),
              Positioned.fill(
                child: AnimatedBuilder(
                  animation: _controller,
                  builder: (context, _) {
                    return CustomPaint(
                      painter: _ScanLinePainter(progress: _controller.value),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CornerMarker extends StatelessWidget {
  const _CornerMarker({
    required this.alignment,
  });

  final Alignment alignment;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.only(
          topLeft: alignment == Alignment.topLeft ? const Radius.circular(28) : Radius.zero,
          topRight:
              alignment == Alignment.topRight ? const Radius.circular(28) : Radius.zero,
          bottomLeft:
              alignment == Alignment.bottomLeft ? const Radius.circular(28) : Radius.zero,
          bottomRight:
              alignment == Alignment.bottomRight ? const Radius.circular(28) : Radius.zero,
        ),
        border: Border(
          left: BorderSide(
            color: alignment == Alignment.topLeft || alignment == Alignment.bottomLeft
                ? AppColors.accent
                : Colors.transparent,
            width: 5,
          ),
          top: BorderSide(
            color: alignment == Alignment.topLeft || alignment == Alignment.topRight
                ? AppColors.accent
                : Colors.transparent,
            width: 5,
          ),
          right: BorderSide(
            color: alignment == Alignment.topRight || alignment == Alignment.bottomRight
                ? AppColors.accent
                : Colors.transparent,
            width: 5,
          ),
          bottom: BorderSide(
            color: alignment == Alignment.bottomLeft || alignment == Alignment.bottomRight
                ? AppColors.accent
                : Colors.transparent,
            width: 5,
          ),
        ),
      ),
    );
  }
}

class _ScanLinePainter extends CustomPainter {
  const _ScanLinePainter({
    required this.progress,
  });

  final double progress;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..shader = LinearGradient(
        colors: <Color>[
          Colors.transparent,
          Colors.greenAccent.withValues(alpha: 0.85),
          Colors.transparent,
        ],
      ).createShader(
        Rect.fromLTWH(0, size.height * progress, size.width, 4),
      );

    final y = size.height * progress;
    canvas.drawRect(Rect.fromLTWH(20, y, size.width - 40, 4), paint);
  }

  @override
  bool shouldRepaint(covariant _ScanLinePainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}

class _ScannerOverlayState {
  const _ScannerOverlayState({
    required this.type,
    required this.title,
    required this.message,
    this.memberName,
    this.photoUrl,
    this.timeLabel,
  });

  final CheckInOverlayType type;
  final String title;
  final String message;
  final String? memberName;
  final String? photoUrl;
  final String? timeLabel;
}
