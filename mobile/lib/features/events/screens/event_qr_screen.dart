import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:screen_brightness/screen_brightness.dart';
import 'package:share_plus/share_plus.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../../../shared/widgets/app_button.dart';
import '../providers/events_provider.dart';
import '../providers/my_registrations_provider.dart';

class EventQrScreen extends ConsumerStatefulWidget {
  const EventQrScreen({
    super.key,
    required this.eventId,
  });

  final String eventId;

  @override
  ConsumerState<EventQrScreen> createState() => _EventQrScreenState();
}

class _EventQrScreenState extends ConsumerState<EventQrScreen> {
  double? _previousBrightness;
  bool _boosted = false;

  @override
  void initState() {
    super.initState();
    _boostBrightness();
  }

  @override
  void dispose() {
    _restoreBrightness();
    super.dispose();
  }

  Future<void> _boostBrightness() async {
    try {
      _previousBrightness ??= await ScreenBrightness().current;
      await ScreenBrightness().setScreenBrightness(1.0);
      _boosted = true;
    } catch (_) {}
  }

  Future<void> _restoreBrightness() async {
    if (!_boosted) {
      return;
    }
    try {
      if (_previousBrightness != null) {
        await ScreenBrightness().setScreenBrightness(_previousBrightness!);
      }
    } catch (_) {}
  }

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

  Future<void> _share(Uint8List bytes, String registrationId) async {
    final file = XFile.fromData(
      bytes,
      mimeType: 'image/png',
      name: '$registrationId.png',
    );
    await SharePlus.instance.share(
      ShareParams(
        files: <XFile>[file],
        text: 'Prynova event ticket QR',
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final registrationsAsync = ref.watch(myRegistrationsProvider);
    final events = ref.watch(eventsProvider).events;
    final event = events.where((item) => item.eventId == widget.eventId).cast<dynamic>().firstWhere(
          (item) => item != null,
          orElse: () => null,
        );

    return Scaffold(
      backgroundColor: AppColors.primary,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        title: const Text('Event QR'),
      ),
      body: registrationsAsync.when(
        data: (registrations) {
          final registration = registrations.where((item) => item.eventId == widget.eventId).cast<dynamic>().firstWhere(
                (item) => item != null,
                orElse: () => null,
              );
          if (registration == null) {
            return Center(
              child: Text(
                'No ticket found for this event.',
                style: AppTextStyles.bodyLarge.copyWith(color: Colors.white),
              ),
            );
          }

          final qrBytes = _decodeQr(registration.qrCode);
          return SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: <Widget>[
                  const Spacer(),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(28),
                    ),
                    child: Column(
                      children: <Widget>[
                        Text(
                          event?.title?.toString() ?? registration.eventTitle,
                          textAlign: TextAlign.center,
                          style: AppTextStyles.titleMedium.copyWith(fontSize: 24),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          registration.attendeeName,
                          style: AppTextStyles.bodyLarge.copyWith(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 18),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(24),
                          ),
                          child: qrBytes != null
                              ? Image.memory(qrBytes, width: 260, height: 260, fit: BoxFit.contain)
                              : const Icon(Icons.qr_code_2_rounded, size: 220, color: AppColors.primary),
                        ),
                        const SizedBox(height: 18),
                        Text(
                          '${registration.tierName ?? 'General'} • ${registration.registrationId}',
                          textAlign: TextAlign.center,
                          style: AppTextStyles.bodyMedium,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  AppButton(
                    label: 'Share',
                    onPressed: qrBytes != null ? () => _share(qrBytes, registration.registrationId) : null,
                    icon: Icons.share_outlined,
                  ),
                  const Spacer(),
                ],
              ),
            ),
          );
        },
        loading: () => const Center(
          child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation<Color>(AppColors.accent)),
        ),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              error.toString(),
              style: AppTextStyles.bodyLarge.copyWith(color: Colors.white),
              textAlign: TextAlign.center,
            ),
          ),
        ),
      ),
    );
  }
}
