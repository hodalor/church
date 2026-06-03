import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../../attendance/attendance_utils.dart';
import '../../attendance/providers/attendance_provider.dart';
import '../../auth/providers/auth_provider.dart';
import '../../members/widgets/member_bottom_navigation.dart';
import '../../visitors/providers/follow_ups_provider.dart';
import '../../visitors/visitors_utils.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final storage = ref.watch(secureStorageProvider);
    final attendanceState = ref.watch(attendanceProvider);
    final followUpsState = ref.watch(followUpsProvider);
    final authState = ref.watch(authProvider);
    final openService = attendanceState.currentService;
    final isLeader = isVisitorLeaderRole(authState.user?.role);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.primary,
        elevation: 0,
        title: Text(
          'Prynova',
          style: AppTextStyles.titleMedium,
        ),
        actions: <Widget>[
          TextButton(
            onPressed: () => ref.read(authProvider.notifier).logout(),
            child: const Text('Logout'),
          ),
        ],
      ),
      bottomNavigationBar: const MemberBottomNavigation(currentIndex: 0),
      body: FutureBuilder<String>(
        future: _resolveTenantDisplay(storage),
        builder: (context, snapshot) {
          final tenantName = snapshot.data ?? 'your church family';

          return Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                if (openService != null && openService.checkInOpen) ...<Widget>[
                  InkWell(
                    onTap: () => context.go('/attendance/checkin/${openService.serviceId}'),
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      width: double.infinity,
                      margin: const EdgeInsets.only(bottom: 16),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.success.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: AppColors.success.withValues(alpha: 0.34),
                        ),
                      ),
                      child: Row(
                        children: <Widget>[
                          const Icon(Icons.circle, size: 12, color: AppColors.success),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              '${openService.title} check-in is OPEN - Tap to check in',
                              style: AppTextStyles.bodyLarge.copyWith(
                                color: AppColors.primary,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(28),
                    gradient: const LinearGradient(
                      colors: <Color>[AppColors.primary, Color(0xFF24365E)],
                    ),
                    boxShadow: const <BoxShadow>[
                      BoxShadow(
                        color: Color(0x1F1E2A4A),
                        blurRadius: 34,
                        offset: Offset(0, 16),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text(
                        'PRYNOVA MEMBER APP',
                        style: AppTextStyles.labelSmall.copyWith(color: AppColors.accent),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Welcome to Prynova',
                        style: AppTextStyles.displayLarge.copyWith(color: Colors.white),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Connected to $tenantName',
                        style: AppTextStyles.bodyLarge.copyWith(
                          color: Colors.white.withValues(alpha: 0.78),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'Your member dashboard is now ready for announcements, inbox updates, prayer requests, polls, giving history, and member profile updates.',
                  style: AppTextStyles.bodyLarge,
                ),
                const SizedBox(height: 24),
                Row(
                  children: <Widget>[
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => context.go('/members'),
                        icon: const Icon(Icons.groups_outlined),
                        label: const Text('Members'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => context.go('/profile'),
                        icon: const Icon(Icons.person_outline_rounded),
                        label: const Text('My Profile'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () => context.go('/attendance'),
                    icon: const Icon(Icons.event_available_rounded),
                    label: Text(
                      openService != null
                          ? 'Open Attendance'
                          : 'Attendance & Check-in',
                    ),
                  ),
                ),
                if (openService != null) ...<Widget>[
                  const SizedBox(height: 8),
                  Text(
                    '${formatAttendanceDate(openService.date)} • ${formatServiceTime(openService)}',
                    style: AppTextStyles.bodyMedium,
                  ),
                ],
                const SizedBox(height: 12),
                Row(
                  children: <Widget>[
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => context.go('/inbox'),
                        icon: const Icon(Icons.inbox_outlined),
                        label: const Text('Inbox'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => context.go('/polls'),
                        icon: const Icon(Icons.how_to_vote_outlined),
                        label: const Text('Polls'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () => context.go('/visitors'),
                    icon: const Icon(Icons.person_add_alt_1_rounded),
                    label: Text(
                      isLeader
                          ? 'Visitors & Follow-ups'
                          : 'Invite a Friend',
                    ),
                  ),
                ),
                if (isLeader && followUpsState.overdueFollowUps.isNotEmpty) ...<Widget>[
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.danger.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppColors.danger.withValues(alpha: 0.22)),
                    ),
                    child: Text(
                      '${followUpsState.overdueFollowUps.length} overdue follow-up${followUpsState.overdueFollowUps.length == 1 ? '' : 's'} need attention.',
                      style: AppTextStyles.bodyLarge.copyWith(
                        color: AppColors.danger,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () => context.go('/prayer-requests'),
                    icon: const Text('🙏'),
                    label: const Text('Prayer Requests'),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<String> _resolveTenantDisplay(SecureStorageService storage) async {
    final user = await storage.getUserProfile();
    if (user?.tenantId != null && user!.tenantId.isNotEmpty) {
      return user.tenantId;
    }

    final tenantId = await storage.getTenantId();
    return tenantId ?? 'your church family';
  }
}
