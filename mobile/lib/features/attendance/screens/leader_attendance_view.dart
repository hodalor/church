import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../../members/widgets/member_avatar.dart';
import '../attendance_utils.dart';
import '../data/models/attendance_record.dart';
import '../data/models/service.dart';
import '../providers/attendance_provider.dart';
import '../providers/leader_attendance_provider.dart';
import '../widgets/leader_checkin_bottom_sheets.dart';
import '../widgets/service_live_card.dart';

class LeaderAttendanceView extends ConsumerStatefulWidget {
  const LeaderAttendanceView({super.key});

  @override
  ConsumerState<LeaderAttendanceView> createState() => _LeaderAttendanceViewState();
}

class _LeaderAttendanceViewState extends ConsumerState<LeaderAttendanceView> {
  Timer? _refreshTimer;
  bool _seededServiceSelection = false;

  @override
  void initState() {
    super.initState();
    _refreshTimer = Timer.periodic(const Duration(seconds: 10), (_) {
      ref.read(leaderAttendanceProvider.notifier).refreshLive();
      ref.read(attendanceProvider.notifier).loadCurrentService();
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final attendanceState = ref.watch(attendanceProvider);
    final leaderState = ref.watch(leaderAttendanceProvider);
    final services = _buildServiceOptions(
      attendanceState.currentService,
      attendanceState.upcomingServices,
    );

    if (!_seededServiceSelection &&
        leaderState.selectedService == null &&
        services.isNotEmpty) {
      _seededServiceSelection = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref
            .read(leaderAttendanceProvider.notifier)
            .selectService(services.first.serviceId);
      });
    }

    final selectedService = leaderState.selectedService;
    final recentCheckIns = leaderState.attendanceList.take(10).toList();
    final stats = selectedService?.stats;

    return RefreshIndicator(
      onRefresh: () async {
        await ref.read(attendanceProvider.notifier).loadCurrentService();
        await ref.read(attendanceProvider.notifier).loadUpcomingServices();
        await ref.read(leaderAttendanceProvider.notifier).refreshLive();
      },
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        children: <Widget>[
          if (attendanceState.currentService != null) ...<Widget>[
            ServiceLiveCard(
              service: attendanceState.currentService!,
              liveCount: leaderState.liveCount,
              buttonLabel: 'Open Scanner',
              onPressed: () => context.push(
                '/attendance/scanner/${attendanceState.currentService!.serviceId}',
              ),
            ),
            const SizedBox(height: 20),
          ],
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: AppColors.inputBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text('Service Selector', style: AppTextStyles.titleMedium),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: selectedService?.serviceId ??
                      (services.isNotEmpty ? services.first.serviceId : null),
                  items: services
                      .map(
                        (service) => DropdownMenuItem<String>(
                          value: service.serviceId,
                          child: Text(
                            '${service.title} • ${formatShortDate(service.date)}',
                          ),
                        ),
                      )
                      .toList(),
                  onChanged: services.isEmpty
                      ? null
                      : (serviceId) {
                          if (serviceId == null) {
                            return;
                          }
                          ref
                              .read(leaderAttendanceProvider.notifier)
                              .selectService(serviceId);
                        },
                  decoration: const InputDecoration(
                    hintText: 'Select a service',
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(24),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  'Live Attendance',
                  style: AppTextStyles.titleMedium.copyWith(color: Colors.white),
                ),
                const SizedBox(height: 10),
                Text(
                  '${leaderState.liveCount}',
                  style: AppTextStyles.displayLarge.copyWith(
                    color: AppColors.accent,
                    fontSize: 46,
                  ),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: <Widget>[
                    _BreakdownPill(label: 'Members', value: stats?.members ?? 0),
                    _BreakdownPill(label: 'Visitors', value: stats?.visitors ?? 0),
                    _BreakdownPill(label: 'Children', value: stats?.children ?? 0),
                    _BreakdownPill(label: 'Online', value: stats?.online ?? 0),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          Text('Quick Actions', style: AppTextStyles.titleMedium),
          const SizedBox(height: 12),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: <Widget>[
              _ActionChip(
                label: 'Scan QR',
                icon: Icons.qr_code_scanner_rounded,
                onTap: selectedService == null
                    ? null
                    : () => context.push(
                          '/attendance/scanner/${selectedService.serviceId}',
                        ),
              ),
              _ActionChip(
                label: 'Manual Check-in',
                icon: Icons.person_search_rounded,
                onTap: selectedService == null
                    ? null
                    : () async {
                        final result = await showManualCheckInSheet(
                          context,
                          serviceId: selectedService.serviceId,
                        );
                        await _handleToolResult(result);
                      },
              ),
              _ActionChip(
                label: 'Visitor Check-in',
                icon: Icons.person_add_alt_1_rounded,
                onTap: selectedService == null
                    ? null
                    : () async {
                        final result = await showVisitorCheckInSheet(
                          context,
                          serviceId: selectedService.serviceId,
                        );
                        await _handleToolResult(result);
                      },
              ),
              _ActionChip(
                label: 'Child Check-in',
                icon: Icons.child_care_rounded,
                onTap: selectedService == null
                    ? null
                    : () async {
                        final result = await showChildCheckInSheet(
                          context,
                          serviceId: selectedService.serviceId,
                        );
                        await _handleToolResult(result);
                      },
              ),
            ],
          ),
          const SizedBox(height: 18),
          Row(
            children: <Widget>[
              Text('Recent Check-ins', style: AppTextStyles.titleMedium),
              const Spacer(),
              if (leaderState.isLoading)
                const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2.2),
                ),
            ],
          ),
          const SizedBox(height: 12),
          if (leaderState.error != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(
                leaderState.error!,
                style: AppTextStyles.bodyMedium.copyWith(color: AppColors.danger),
              ),
            ),
          if (recentCheckIns.isEmpty)
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: AppColors.inputBorder),
              ),
              child: Text(
                'Recent check-ins will stream here during service.',
                style: AppTextStyles.bodyMedium,
              ),
            )
          else
            ...recentCheckIns.map((record) => _RecentCheckInTile(record: record)),
        ],
      ),
    );
  }

  List<Service> _buildServiceOptions(Service? current, List<Service> upcoming) {
    final unique = <String, Service>{};
    if (current != null) {
      unique[current.serviceId] = current;
    }
    for (final service in upcoming) {
      unique.putIfAbsent(service.serviceId, () => service);
    }
    return unique.values.toList();
  }

  Future<void> _handleToolResult(Map<String, dynamic>? result) async {
    if (result == null) {
      return;
    }

    await ref.read(leaderAttendanceProvider.notifier).refreshLive();

    if (!mounted) {
      return;
    }

    final pickupCode = (result['pickupCode'] ?? '').toString();
    if (pickupCode.isNotEmpty) {
      await showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Pickup Code'),
          content: Text('Show this code to the parent: $pickupCode'),
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

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          responseMessage(result, fallback: 'Attendance updated successfully.'),
        ),
      ),
    );
  }
}

class _BreakdownPill extends StatelessWidget {
  const _BreakdownPill({
    required this.label,
    required this.value,
  });

  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        '$label: $value',
        style: AppTextStyles.bodyMedium.copyWith(
          color: Colors.white,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _ActionChip extends StatelessWidget {
  const _ActionChip({
    required this.label,
    required this.icon,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        decoration: BoxDecoration(
          color: onTap == null ? AppColors.inputBorder : AppColors.card,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.inputBorder),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Icon(icon, color: AppColors.primary),
            const SizedBox(width: 8),
            Text(
              label,
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.primary,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RecentCheckInTile extends StatelessWidget {
  const _RecentCheckInTile({
    required this.record,
  });

  final AttendanceRecord record;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.inputBorder),
      ),
      child: Row(
        children: <Widget>[
          MemberAvatar(
            photoUrl: record.photoUrl,
            firstName: record.displayName,
            lastName: '',
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  record.displayName,
                  style: AppTextStyles.bodyLarge.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${attendeeTypeLabel(record.attendeeType)} • ${checkInMethodLabel(record.checkInMethod)}',
                  style: AppTextStyles.bodyMedium,
                ),
              ],
            ),
          ),
          Text(
            formatTimeOfDay(record.checkInTime),
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.primary,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
