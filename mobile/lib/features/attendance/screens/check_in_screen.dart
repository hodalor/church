import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:screen_brightness/screen_brightness.dart';

import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../../../shared/widgets/app_button.dart';
import '../../members/data/models/member.dart';
import '../../members/providers/member_detail_provider.dart';
import '../../members/providers/members_provider.dart';
import '../attendance_utils.dart';
import '../providers/attendance_provider.dart';
import '../providers/my_attendance_provider.dart';
import '../widgets/checkin_success_overlay.dart';

class CheckInScreen extends ConsumerStatefulWidget {
  const CheckInScreen({
    super.key,
    required this.serviceId,
  });

  final String serviceId;

  @override
  ConsumerState<CheckInScreen> createState() => _CheckInScreenState();
}

class _CheckInScreenState extends ConsumerState<CheckInScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  Map<String, dynamic>? _successPayload;
  double? _previousBrightness;
  bool _brightnessBoosted = false;
  int _qrRefreshTick = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this)
      ..addListener(_handleTabChange);
  }

  @override
  void dispose() {
    _tabController.removeListener(_handleTabChange);
    _tabController.dispose();
    _restoreBrightness();
    super.dispose();
  }

  Future<void> _handleTabChange() async {
    if (_tabController.indexIsChanging) {
      return;
    }

    if (_tabController.index == 1) {
      await _boostBrightness();
    } else {
      await _restoreBrightness();
    }
  }

  Future<void> _boostBrightness() async {
    if (_brightnessBoosted) {
      return;
    }

    try {
      _previousBrightness ??= await ScreenBrightness().current;
      await ScreenBrightness().setScreenBrightness(1.0);
      _brightnessBoosted = true;
    } catch (_) {
      // Brightness control is best-effort.
    }
  }

  Future<void> _restoreBrightness() async {
    if (!_brightnessBoosted) {
      return;
    }

    try {
      if (_previousBrightness != null) {
        await ScreenBrightness().setScreenBrightness(_previousBrightness!);
      } else {
        await ScreenBrightness().resetScreenBrightness();
      }
    } catch (_) {
      // Ignore restore errors to avoid trapping the user on this screen.
    } finally {
      _brightnessBoosted = false;
    }
  }

  Uint8List? _decodeQrBytes(String rawValue) {
    if (rawValue.isEmpty) {
      return null;
    }

    final encoded = rawValue.contains(',') ? rawValue.split(',').last : rawValue;
    try {
      return base64Decode(encoded);
    } catch (_) {
      return null;
    }
  }

  Future<Uint8List?> _resolveQrBytes(Member member, int refreshTick) async {
    final inlineQr = member.qrCode ?? '';
    final decoded = _decodeQrBytes(inlineQr);
    if (decoded != null) {
      return decoded;
    }

    final fresh = await ref.read(memberRepositoryProvider).getMemberQrCode(member.memberId);
    return _decodeQrBytes(fresh);
  }

  @override
  Widget build(BuildContext context) {
    final checkInState = ref.watch(attendanceProvider);
    final serviceAsync = ref.watch(attendanceServiceProvider(widget.serviceId));
    final profileAsync = ref.watch(myProfileProvider);

    ref.listen<AttendanceState>(attendanceProvider, (previous, next) {
      final completedCheckIn = previous?.isCheckingIn == true && !next.isCheckingIn;
      if (!completedCheckIn) {
        return;
      }

      if (next.error != null && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(next.error!)),
        );
      }

      final payload = next.checkInResult;
      if (payload == null) {
        return;
      }

      if (responseLooksLikeAlreadyCheckedIn(payload)) {
        showDialog<void>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Already Checked In'),
            content: const Text(
              "You're already checked in for this service.",
            ),
            actions: <Widget>[
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('OK'),
              ),
            ],
          ),
        );
      } else {
        setState(() {
          _successPayload = payload;
        });
      }

      ref.read(attendanceProvider.notifier).clearResult();
    });

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: Text('Check In', style: AppTextStyles.titleMedium),
      ),
      body: Stack(
        children: <Widget>[
          serviceAsync.when(
            data: (service) {
              return ListView(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
                children: <Widget>[
                  Container(
                    decoration: BoxDecoration(
                      color: AppColors.card,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: AppColors.inputBorder),
                    ),
                    child: Column(
                      children: <Widget>[
                        TabBar(
                          controller: _tabController,
                          indicatorColor: AppColors.accent,
                          labelColor: AppColors.primary,
                          unselectedLabelColor: AppColors.mutedText,
                          tabs: const <Tab>[
                            Tab(text: 'Online Check-in'),
                            Tab(text: 'Show My QR'),
                          ],
                        ),
                        SizedBox(
                          height: 560,
                          child: TabBarView(
                            controller: _tabController,
                            children: <Widget>[
                              Padding(
                                padding: const EdgeInsets.all(20),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: <Widget>[
                                    _ServiceInfoCard(
                                      title: service.title,
                                      subtitle:
                                          '${formatAttendanceDate(service.date)} • ${formatServiceTime(service)}',
                                    ),
                                    const SizedBox(height: 28),
                                    Center(
                                      child: Container(
                                        width: 120,
                                        height: 120,
                                        decoration: const BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: AppColors.primary,
                                        ),
                                        child: const Icon(
                                          Icons.check_rounded,
                                          color: Colors.white,
                                          size: 58,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 28),
                                    Text(
                                      'I am joining online today',
                                      textAlign: TextAlign.center,
                                      style: AppTextStyles.bodyMedium,
                                    ),
                                    const SizedBox(height: 16),
                                    AppButton(
                                      label: 'Check Me In',
                                      onPressed: () => ref
                                          .read(attendanceProvider.notifier)
                                          .checkInOnline(widget.serviceId),
                                      isLoading: checkInState.isCheckingIn,
                                    ),
                                  ],
                                ),
                              ),
                              profileAsync.when(
                                data: (member) => Padding(
                                  padding: const EdgeInsets.all(20),
                                  child: _QrDisplayPanel(
                                    member: member,
                                    qrFuture: _resolveQrBytes(member, _qrRefreshTick),
                                    onRefresh: () {
                                      ref.invalidate(myProfileProvider);
                                      setState(() {
                                        _qrRefreshTick++;
                                      });
                                    },
                                  ),
                                ),
                                loading: () => const Center(
                                  child: CircularProgressIndicator(),
                                ),
                                error: (error, _) => Center(
                                  child: Padding(
                                    padding: const EdgeInsets.all(24),
                                    child: Text(
                                      error.toString(),
                                      textAlign: TextAlign.center,
                                      style: AppTextStyles.bodyMedium,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, _) => Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  error.toString(),
                  textAlign: TextAlign.center,
                  style: AppTextStyles.bodyLarge,
                ),
              ),
            ),
          ),
          if (_successPayload != null)
            CheckInSuccessOverlay(
              title: "You're Checked In! ✓",
              message: serviceAsync.value?.title ?? 'Attendance recorded',
              timeLabel: formatTimeOfDay(responseCheckInTime(_successPayload!)),
              dismissLabel: 'Done',
              onDismiss: () {
                setState(() {
                  _successPayload = null;
                });
                context.pop();
              },
            ),
        ],
      ),
    );
  }
}

class _ServiceInfoCard extends StatelessWidget {
  const _ServiceInfoCard({
    required this.title,
    required this.subtitle,
  });

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(title, style: AppTextStyles.titleMedium),
          const SizedBox(height: 6),
          Text(subtitle, style: AppTextStyles.bodyMedium),
        ],
      ),
    );
  }
}

class _QrDisplayPanel extends StatelessWidget {
  const _QrDisplayPanel({
    required this.member,
    required this.qrFuture,
    required this.onRefresh,
  });

  final Member member;
  final Future<Uint8List?> qrFuture;
  final VoidCallback onRefresh;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: <Widget>[
        Text(
          'Let an usher scan your QR code',
          style: AppTextStyles.bodyMedium,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 20),
        FutureBuilder<Uint8List?>(
          future: qrFuture,
          builder: (context, snapshot) {
            final qrBytes = snapshot.data;
            return Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(28),
                border: Border.all(color: AppColors.inputBorder),
                boxShadow: const <BoxShadow>[
                  BoxShadow(
                    color: Color(0x141E2A4A),
                    blurRadius: 24,
                    offset: Offset(0, 12),
                  ),
                ],
              ),
              child: qrBytes != null
                  ? Image.memory(
                      qrBytes,
                      width: 250,
                      height: 250,
                      fit: BoxFit.contain,
                    )
                  : const SizedBox(
                      width: 250,
                      height: 250,
                      child: Center(child: CircularProgressIndicator()),
                    ),
            );
          },
        ),
        const SizedBox(height: 18),
        Text(
          member.fullName,
          style: AppTextStyles.titleMedium,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 6),
        Text(member.memberId, style: AppTextStyles.bodyMedium),
        const SizedBox(height: 20),
        OutlinedButton.icon(
          onPressed: onRefresh,
          icon: const Icon(Icons.refresh_rounded),
          label: const Text('Refresh QR'),
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.primary,
            side: const BorderSide(color: AppColors.primary),
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(18),
            ),
          ),
        ),
      ],
    );
  }
}
