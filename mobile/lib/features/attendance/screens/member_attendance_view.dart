import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../../../shared/widgets/app_button.dart';
import '../../members/providers/member_detail_provider.dart';
import '../../members/widgets/qr_code_sheet.dart';
import '../attendance_utils.dart';
import '../providers/attendance_provider.dart';
import '../providers/my_attendance_provider.dart';
import '../widgets/attendance_calendar_widget.dart';
import '../widgets/attendance_history_tile.dart';
import '../widgets/service_live_card.dart';
import '../widgets/streak_badge_widget.dart';

class MemberAttendanceView extends ConsumerWidget {
  const MemberAttendanceView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final attendanceState = ref.watch(attendanceProvider);
    final historyAsync = ref.watch(myAttendanceHistoryProvider);
    final profileAsync = ref.watch(myProfileProvider);
    final currentService = attendanceState.currentService;
    final nextService = attendanceState.upcomingServices.isNotEmpty
        ? attendanceState.upcomingServices.first
        : null;

    return RefreshIndicator(
      onRefresh: () async {
        await ref.read(attendanceProvider.notifier).loadCurrentService();
        await ref.read(attendanceProvider.notifier).loadUpcomingServices();
        ref.invalidate(myAttendanceHistoryProvider);
        ref.invalidate(myProfileProvider);
      },
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        children: <Widget>[
          Text(
            'Show up. Stay consistent. Grow in community.',
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.primary.withValues(alpha: 0.72),
            ),
          ),
          const SizedBox(height: 16),
          if (currentService != null && currentService.checkInOpen)
            ServiceLiveCard(
              service: currentService,
              liveCount: currentService.stats.totalCheckedIn,
              buttonLabel: 'CHECK IN NOW',
              onPressed: () => context.push('/attendance/checkin/${currentService.serviceId}'),
            )
          else
            _UpcomingServiceCard(
              serviceTitle: nextService?.title ?? 'No open service right now',
              subtitle: nextService != null
                  ? '${formatAttendanceDate(nextService.date)} • ${formatServiceTime(nextService)}'
                  : 'We will show the next service here once it is scheduled.',
              countdown: nextService != null
                  ? formatCountdown(nextService.date)
                  : 'Check back later for upcoming services.',
              onViewQr: profileAsync.maybeWhen(
                data: (member) => () {
                  showModalBottomSheet<void>(
                    context: context,
                    isScrollControlled: true,
                    backgroundColor: AppColors.surface,
                    shape: const RoundedRectangleBorder(
                      borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                    ),
                    builder: (_) => QrCodeSheet(member: member),
                  );
                },
                orElse: () => null,
              ),
            ),
          const SizedBox(height: 24),
          Text('My Attendance', style: AppTextStyles.titleMedium),
          const SizedBox(height: 14),
          historyAsync.when(
            data: (history) => Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Row(
                  children: <Widget>[
                    Expanded(
                      child: _StatCard(
                        label: 'Attendance Rate',
                        value: formatPercentage(history.attendanceRate),
                        helper: '${history.attended}/${history.totalServices} services',
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _StatCard(
                        label: 'Current Streak',
                        value: '${history.streak}',
                        helper: 'weeks',
                        trailing: StreakBadgeWidget(streak: history.streak),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _StatCard(
                        label: 'Total Attended',
                        value: '${history.attended}',
                        helper: 'services',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                AttendanceCalendarWidget(history: history, months: 3),
                const SizedBox(height: 10),
                Text('Recent Services', style: AppTextStyles.titleMedium),
                const SizedBox(height: 10),
                ...history.attendedServices.take(5).map(
                      (record) => AttendanceHistoryTile(record: record),
                    ),
                if (history.attendedServices.isEmpty)
                  _EmptyStateCard(
                    message: 'Your attended services will appear here after your first check-in.',
                  ),
                const SizedBox(height: 8),
                AppButton(
                  label: 'View Full History',
                  onPressed: () => context.push('/attendance/history'),
                ),
              ],
            ),
            loading: () => const Padding(
              padding: EdgeInsets.all(24),
              child: Center(child: CircularProgressIndicator()),
            ),
            error: (error, _) => _EmptyStateCard(message: error.toString()),
          ),
        ],
      ),
    );
  }
}

class _UpcomingServiceCard extends StatelessWidget {
  const _UpcomingServiceCard({
    required this.serviceTitle,
    required this.subtitle,
    required this.countdown,
    this.onViewQr,
  });

  final String serviceTitle;
  final String subtitle;
  final String countdown;
  final VoidCallback? onViewQr;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFECEEF3),
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: AppColors.inputBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            serviceTitle,
            style: AppTextStyles.headlineMedium.copyWith(fontSize: 26),
          ),
          const SizedBox(height: 10),
          Text(subtitle, style: AppTextStyles.bodyMedium),
          const SizedBox(height: 12),
          Text(
            countdown,
            style: AppTextStyles.bodyLarge.copyWith(
              color: AppColors.primary,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: onViewQr,
              icon: const Icon(Icons.qr_code_rounded),
              label: const Text('View My QR Code'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primary,
                side: const BorderSide(color: AppColors.primary),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(18),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.helper,
    this.trailing,
  });

  final String label;
  final String value;
  final String helper;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.inputBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(label, style: AppTextStyles.bodyMedium),
          const SizedBox(height: 8),
          Text(
            value,
            style: AppTextStyles.headlineMedium.copyWith(fontSize: 30),
          ),
          const SizedBox(height: 6),
          Text(helper, style: AppTextStyles.bodyMedium),
          if (trailing != null) ...<Widget>[
            const SizedBox(height: 12),
            trailing!,
          ],
        ],
      ),
    );
  }
}

class _EmptyStateCard extends StatelessWidget {
  const _EmptyStateCard({
    required this.message,
  });

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.inputBorder),
      ),
      child: Text(
        message,
        style: AppTextStyles.bodyMedium,
      ),
    );
  }
}
