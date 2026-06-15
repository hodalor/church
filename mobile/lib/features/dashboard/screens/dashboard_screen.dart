import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/utils/app_colors.dart';
import '../../../core/utils/role_helper.dart';
import '../../../shared/widgets/app_loading_indicator.dart';
import '../../../shared/widgets/empty_state_widget.dart';
import '../../analytics/data/models/branch_metric.dart';
import '../../analytics/data/models/hq_overview.dart';
import '../../analytics/providers/hq_provider.dart';
import '../../attendance/data/models/member_attendance_history.dart';
import '../../attendance/providers/attendance_provider.dart';
import '../../attendance/providers/my_attendance_provider.dart';
import '../../auth/providers/auth_provider.dart';
import '../../communication/data/models/inbox_message.dart';
import '../../communication/providers/inbox_provider.dart';
import '../../events/data/models/event.dart';
import '../../events/providers/events_provider.dart';
import '../../events/widgets/event_banner_card.dart';
import '../../members/widgets/member_bottom_navigation.dart';
import '../../visitors/providers/follow_ups_provider.dart';
import '../../volunteers/data/models/roster.dart';
import '../../volunteers/data/models/volunteer.dart';
import '../../volunteers/providers/volunteer_roster_provider.dart';
import '../../volunteers/widgets/upcoming_assignment_card.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  String? _dismissedBannerId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final inboxNotifier = ref.read(inboxProvider.notifier);
      if (ref.read(inboxProvider).messages.isEmpty) {
        inboxNotifier.loadMessages();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final role = user?.role ?? '';
    final dashboardMode = _resolveMode(role);
    final attendanceState = ref.watch(attendanceProvider);
    final eventsState = ref.watch(eventsProvider);
    final followUpsState = ref.watch(followUpsProvider);
    final inboxState = ref.watch(inboxProvider);
    final unreadCount = ref.watch(unreadCountProvider).value ?? inboxState.unreadCount;
    final insightsState = RoleHelper.isLeader(role) || RoleHelper.isPastor(role)
        ? ref.watch(insightsProvider)
        : null;
    final hqOverviewAsync = dashboardMode == _DashboardMode.pastor
        ? ref.watch(hqOverviewProvider)
        : null;
    final branchComparisonAsync = dashboardMode == _DashboardMode.pastor
        ? ref.watch(branchComparisonProvider)
        : null;
    final attendanceHistoryAsync = dashboardMode == _DashboardMode.member
        ? ref.watch(myAttendanceHistoryProvider)
        : null;
    final volunteerAsync = dashboardMode == _DashboardMode.volunteer
        ? ref.watch(myVolunteerProfileProvider)
        : null;
    final volunteerRosterState = dashboardMode == _DashboardMode.volunteer
        ? ref.watch(volunteerRosterProvider)
        : null;

    final openService = attendanceState.currentService;
    final upcomingEvents = eventsState.events
        .where((event) => event.isUpcoming || event.isOngoing)
        .take(5)
        .toList();
    final announcements = inboxState.messages
        .where(
          (message) =>
              message.type.toLowerCase() == 'announcement' ||
              message.type.toLowerCase() == 'broadcast' ||
              message.type.toLowerCase() == 'devotional',
        )
        .take(3)
        .toList();
    final criticalInsight = insightsState?.items
        .where((item) => item.severity.toLowerCase() == 'critical')
        .cast<dynamic>()
        .firstWhere((_) => true, orElse: () => null);
    final todayKey = DateTime.now().toIso8601String().split('T').first;
    final followUpsToday = followUpsState.myFollowUps
        .where(
          (item) => (item['scheduledDate'] ?? '').toString().startsWith(todayKey),
        )
        .take(4)
        .toList();
    final nextRoster = volunteerRosterState?.upcomingRosters
        .where((roster) => roster.myAssignment != null)
        .cast<Roster?>()
        .firstWhere((item) => item != null, orElse: () => null);
    final banner = _buildBannerData(openService, criticalInsight);
    final showBanner = banner != null && banner.id != _dismissedBannerId;

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: Row(
          children: <Widget>[
            CircleAvatar(
              radius: 20,
              backgroundColor: AppColors.primary.withValues(alpha: 0.12),
              child: Text(
                _tenantInitial(user?.tenantId),
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w800,
                    ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    'Good ${_timeGreeting()}, ${_firstName(user?.fullName, user?.username)}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    _tenantLabel(user?.tenantId),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: <Widget>[
          IconButton(
            onPressed: () => context.push('/inbox'),
            icon: Badge(
              isLabelVisible: unreadCount > 0,
              label: Text(unreadCount > 99 ? '99+' : '$unreadCount'),
              child: const Icon(Icons.notifications_none_rounded),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: InkWell(
              borderRadius: BorderRadius.circular(40),
              onTap: () => context.push('/profile'),
              child: CircleAvatar(
                radius: 18,
                backgroundColor: AppColors.accent.withValues(alpha: 0.22),
                child: Text(
                  _profileInitials(user?.fullName, user?.username),
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w700,
                      ),
                ),
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: const MemberBottomNavigation(currentIndex: 0),
      body: RefreshIndicator(
        onRefresh: () => _refreshDashboard(dashboardMode),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          children: <Widget>[
            if (showBanner) ...<Widget>[
              _TopBanner(
                data: banner,
                onTap: () => context.push(banner.route),
                onDismiss: () {
                  setState(() {
                    _dismissedBannerId = banner.id;
                  });
                },
              ),
              const SizedBox(height: 16),
            ],
            _buildHeaderCard(context, role),
            const SizedBox(height: 16),
            switch (dashboardMode) {
              _DashboardMode.care => _buildCareDashboard(
                  context: context,
                  followUpsState: followUpsState,
                  followUpsToday: followUpsToday,
                ),
              _DashboardMode.pastor => _buildPastorDashboard(
                  context: context,
                  hqOverviewAsync: hqOverviewAsync!,
                  branchComparisonAsync: branchComparisonAsync!,
                  insightsState: insightsState!,
                  canAccessHq: RoleHelper.canAccessHQ(role),
                ),
              _DashboardMode.volunteer => _buildVolunteerDashboard(
                  context: context,
                  volunteerAsync: volunteerAsync!,
                  volunteerRosterState: volunteerRosterState!,
                  nextRoster: nextRoster,
                  upcomingEvents: upcomingEvents,
                ),
              _DashboardMode.member => _buildMemberDashboard(
                  context: context,
                  role: role,
                  attendanceHistoryAsync: attendanceHistoryAsync!,
                  upcomingEvents: upcomingEvents,
                  announcements: announcements,
                ),
            },
          ],
        ),
      ),
    );
  }

  Future<void> _refreshDashboard(_DashboardMode mode) async {
    final attendanceNotifier = ref.read(attendanceProvider.notifier);
    final eventsNotifier = ref.read(eventsProvider.notifier);
    final inboxNotifier = ref.read(inboxProvider.notifier);

    await attendanceNotifier.loadCurrentService();
    await attendanceNotifier.loadUpcomingServices();
    await eventsNotifier.refresh();
    await inboxNotifier.refresh();

    switch (mode) {
      case _DashboardMode.member:
        ref.invalidate(myAttendanceHistoryProvider);
        break;
      case _DashboardMode.care:
        await ref.read(followUpsProvider.notifier).refresh();
        break;
      case _DashboardMode.pastor:
        ref.invalidate(hqOverviewProvider);
        ref.invalidate(branchComparisonProvider);
        await ref.read(insightsProvider.notifier).refresh();
        break;
      case _DashboardMode.volunteer:
        ref.invalidate(myVolunteerProfileProvider);
        await ref.read(volunteerRosterProvider.notifier).refresh();
        break;
    }
  }

  _DashboardMode _resolveMode(String role) {
    if (role == 'care_leader') {
      return _DashboardMode.care;
    }
    if (role == 'volunteer_leader') {
      return _DashboardMode.volunteer;
    }
    if (RoleHelper.isPastor(role)) {
      return _DashboardMode.pastor;
    }
    return _DashboardMode.member;
  }

  Widget _buildHeaderCard(BuildContext context, String role) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          colors: <Color>[AppColors.primary, Color(0xFF293B63)],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            'Prynova Mobile',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: AppColors.accent,
                  letterSpacing: 1.1,
                ),
          ),
          const SizedBox(height: 10),
          Text(
            _dashboardHeadline(role),
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: Colors.white,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            _dashboardSubtitle(role),
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: Colors.white.withValues(alpha: 0.82),
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildMemberDashboard({
    required BuildContext context,
    required String role,
    required AsyncValue<MemberAttendanceHistory> attendanceHistoryAsync,
    required List<Event> upcomingEvents,
    required List<InboxMessage> announcements,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text('My Attendance', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        attendanceHistoryAsync.when(
          data: (history) => _SectionCard(
            child: Row(
              children: <Widget>[
                Expanded(
                  child: _MetricColumn(
                    label: 'Streak',
                    value: '${history.streak}',
                    tone: AppColors.primary,
                  ),
                ),
                Expanded(
                  child: _MetricColumn(
                    label: 'Rate',
                    value: '${history.attendanceRate.toStringAsFixed(0)}%',
                    tone: Colors.green.shade700,
                  ),
                ),
                Expanded(
                  child: _MetricColumn(
                    label: 'Attended',
                    value: '${history.attended}/${history.totalServices}',
                    tone: AppColors.accent,
                  ),
                ),
              ],
            ),
          ),
          loading: () => const _SectionCard(
            child: SizedBox(height: 92, child: Center(child: AppLoadingIndicator())),
          ),
          error: (_, __) => const _SectionCard(
            child: Text('Attendance history is not available right now.'),
          ),
        ),
        const SizedBox(height: 20),
        _SectionHeader(
          title: 'Upcoming Events',
          actionLabel: 'See all',
          onAction: () => context.push('/events'),
        ),
        const SizedBox(height: 12),
        _EventsStrip(upcomingEvents: upcomingEvents),
        const SizedBox(height: 20),
        _SectionHeader(
          title: 'Recent Announcements',
          actionLabel: 'Inbox',
          onAction: () => context.push('/inbox'),
        ),
        const SizedBox(height: 12),
        if (announcements.isEmpty)
          const EmptyStateWidget(
            icon: Icons.campaign_outlined,
            title: 'No recent announcements',
            message: 'Your latest devotionals and church notices appear here.',
          )
        else
          ...announcements.map((message) => _AnnouncementTile(message: message)),
        const SizedBox(height: 20),
        Text('Quick Actions', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: <Widget>[
            _QuickActionCard(
              label: 'Give',
              icon: Icons.account_balance_wallet_rounded,
              onTap: () => context.push('/finance'),
            ),
            _QuickActionCard(
              label: 'Prayer Request',
              icon: Icons.favorite_rounded,
              onTap: () => context.push('/prayer-requests/submit'),
            ),
            _QuickActionCard(
              label: 'My QR',
              icon: Icons.qr_code_rounded,
              onTap: () => context.push('/profile'),
            ),
            _QuickActionCard(
              label: 'Events',
              icon: Icons.event_rounded,
              onTap: () => context.push('/events'),
            ),
            _QuickActionCard(
              label: 'Ministries',
              icon: Icons.groups_3_rounded,
              onTap: () => context.push('/ministry'),
            ),
            if (RoleHelper.canAccessCBS(role))
              _QuickActionCard(
                label: 'CBS Group',
                icon: Icons.menu_book_rounded,
                onTap: () => context.push('/cbs'),
              ),
          ],
        ),
      ],
    );
  }

  Widget _buildCareDashboard({
    required BuildContext context,
    required dynamic followUpsState,
    required List<Map<String, dynamic>> followUpsToday,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text('My Cases Summary', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        _SectionCard(
          child: Row(
            children: <Widget>[
              Expanded(
                child: _MetricColumn(
                  label: 'Open',
                  value: '${followUpsState.myFollowUps.length}',
                  tone: AppColors.primary,
                ),
              ),
              Expanded(
                child: _MetricColumn(
                  label: 'Urgent',
                  value: '${followUpsState.overdueFollowUps.length}',
                  tone: AppColors.danger,
                ),
              ),
              Expanded(
                child: _MetricColumn(
                  label: 'Today',
                  value: '${followUpsToday.length}',
                  tone: AppColors.accent,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        _SectionHeader(
          title: 'Follow-ups Today',
          actionLabel: 'View all',
          onAction: () => context.push('/visitors/follow-ups'),
        ),
        const SizedBox(height: 12),
        if (followUpsToday.isEmpty)
          const EmptyStateWidget(
            icon: Icons.schedule_rounded,
            title: 'No follow-ups due today',
            message: 'Assigned follow-ups scheduled for today appear here.',
          )
        else
          ...followUpsToday.map(
            (item) => _SectionCard(
              margin: const EdgeInsets.only(bottom: 10),
              child: ListTile(
                contentPadding: EdgeInsets.zero,
                leading: CircleAvatar(
                  backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                  child: const Icon(Icons.person_outline_rounded),
                ),
                title: Text((item['visitorName'] ?? 'Visitor').toString()),
                subtitle: Text((item['notes'] ?? item['status'] ?? 'Follow up').toString()),
                trailing: TextButton(
                  onPressed: () => context.push('/visitors/follow-ups'),
                  child: const Text('Open'),
                ),
              ),
            ),
          ),
        const SizedBox(height: 20),
        Text('Quick Actions', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: <Widget>[
            _QuickActionCard(
              label: 'New Case',
              icon: Icons.add_circle_outline_rounded,
              onTap: () => context.push('/pastoral/cases/new'),
            ),
            _QuickActionCard(
              label: 'Follow-ups',
              icon: Icons.checklist_rounded,
              onTap: () => context.push('/visitors/follow-ups'),
            ),
            _QuickActionCard(
              label: 'Visitors',
              icon: Icons.person_add_alt_1_rounded,
              onTap: () => context.push('/visitors'),
            ),
            _QuickActionCard(
              label: 'Prayer',
              icon: Icons.favorite_outline_rounded,
              onTap: () => context.push('/prayer-requests'),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildPastorDashboard({
    required BuildContext context,
    required AsyncValue<HQOverview> hqOverviewAsync,
    required AsyncValue<dynamic> branchComparisonAsync,
    required dynamic insightsState,
    required bool canAccessHq,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text('HQ Mini Overview', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        hqOverviewAsync.when(
          data: (overview) => Wrap(
            spacing: 12,
            runSpacing: 12,
            children: <Widget>[
              _MiniStatCard(
                label: 'Members',
                value: '${overview.summary.totalMembers}',
                subtitle: '${overview.summary.totalBranches} branches',
              ),
              _MiniStatCard(
                label: 'Attendance',
                value: '${overview.thisMonth.attendance}',
                subtitle: 'This month',
              ),
              _MiniStatCard(
                label: 'Income',
                value: overview.thisMonth.income.toStringAsFixed(0),
                subtitle: 'This month',
              ),
            ],
          ),
          loading: () => const _SectionCard(
            child: SizedBox(height: 110, child: Center(child: AppLoadingIndicator())),
          ),
          error: (_, __) => const _SectionCard(
            child: Text('HQ summary is not available right now.'),
          ),
        ),
        const SizedBox(height: 20),
        Text('Critical Insights', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        if (insightsState.items
            .where((item) => item.severity.toLowerCase() == 'critical')
            .isEmpty)
          const _SectionCard(
            child: Text('No critical insights right now. All systems look healthy.'),
          )
        else
          ...insightsState.items
              .where((item) => item.severity.toLowerCase() == 'critical')
              .take(2)
              .map(
                (insight) => _InsightAlertTile(
                  title: insight.title,
                  message: insight.message,
                  onTap: () => context.push('/insights'),
                ),
              ),
        const SizedBox(height: 20),
        _SectionHeader(
          title: 'Branch Health Summary',
          actionLabel: 'Open',
          onAction: () => context.push('/intelligence'),
        ),
        const SizedBox(height: 12),
        branchComparisonAsync.when(
          data: (comparison) {
            final items = comparison.items.cast<BranchMetric>().take(4).toList();
            if (items.isEmpty) {
              return const EmptyStateWidget(
                icon: Icons.hub_outlined,
                title: 'No branch metrics yet',
                message: 'Branch intelligence appears here after data sync.',
              );
            }
            return Column(
              children: items
                  .map(
                    (branch) => _BranchHealthTile(branch: branch),
                  )
                  .toList(),
            );
          },
          loading: () => const _SectionCard(
            child: SizedBox(height: 120, child: Center(child: AppLoadingIndicator())),
          ),
          error: (_, __) => const _SectionCard(
            child: Text('Branch health data is unavailable right now.'),
          ),
        ),
        const SizedBox(height: 20),
        Text('Quick Actions', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: <Widget>[
            _QuickActionCard(
              label: 'Scorecard',
              icon: Icons.track_changes_rounded,
              onTap: () => context.push('/strategic/scorecard'),
            ),
            _QuickActionCard(
              label: 'Leadership',
              icon: Icons.account_tree_rounded,
              onTap: () => context.push('/leadership/pipeline'),
            ),
            _QuickActionCard(
              label: 'Ministries',
              icon: Icons.groups_3_rounded,
              onTap: () => context.push('/ministry'),
            ),
            _QuickActionCard(
              label: canAccessHq ? 'HQ Overview' : 'Intelligence',
              icon: Icons.hub_rounded,
              onTap: () => context.push(canAccessHq ? '/hq' : '/intelligence'),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildVolunteerDashboard({
    required BuildContext context,
    required AsyncValue<Volunteer?> volunteerAsync,
    required dynamic volunteerRosterState,
    required Roster? nextRoster,
    required List<Event> upcomingEvents,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text('Next Roster', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        if (nextRoster != null && nextRoster.myAssignment != null)
          UpcomingAssignmentCard(
            roster: nextRoster,
            assignment: nextRoster.myAssignment!,
            onTap: () => context.push('/volunteer/rosters/${nextRoster.rosterId}'),
            onConfirm: () => ref
                .read(volunteerRosterProvider.notifier)
                .confirmAssignment(nextRoster.myAssignment!.assignmentId),
          )
        else
          const EmptyStateWidget(
            icon: Icons.event_note_rounded,
            title: 'No upcoming roster',
            message: 'Your next team assignment appears here.',
          ),
        const SizedBox(height: 20),
        Text(
          'Volunteer Reliability',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 12),
        volunteerAsync.when(
          data: (volunteer) {
            if (volunteer == null) {
              return const EmptyStateWidget(
                icon: Icons.volunteer_activism_outlined,
                title: 'Volunteer profile not found',
                message: 'Ask your church admin to link your volunteer record.',
              );
            }
            return _SectionCard(
              child: Row(
                children: <Widget>[
                  Expanded(
                    child: _MetricColumn(
                      label: 'Reliability',
                      value:
                          '${volunteer.performance.reliabilityScore.toStringAsFixed(0)}%',
                      tone: Colors.green.shade700,
                    ),
                  ),
                  Expanded(
                    child: _MetricColumn(
                      label: 'Assignments',
                      value: '${volunteer.performance.totalAssignments}',
                      tone: AppColors.primary,
                    ),
                  ),
                  Expanded(
                    child: _MetricColumn(
                      label: 'Department',
                      value: volunteer.primaryDepartment,
                      tone: AppColors.accent,
                    ),
                  ),
                ],
              ),
            );
          },
          loading: () => const _SectionCard(
            child: SizedBox(height: 92, child: Center(child: AppLoadingIndicator())),
          ),
          error: (_, __) => const _SectionCard(
            child: Text('Volunteer profile is unavailable right now.'),
          ),
        ),
        const SizedBox(height: 20),
        _SectionHeader(
          title: 'Upcoming Events',
          actionLabel: 'See all',
          onAction: () => context.push('/events'),
        ),
        const SizedBox(height: 12),
        _EventsStrip(upcomingEvents: upcomingEvents),
        const SizedBox(height: 20),
        Text('Quick Actions', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: <Widget>[
            _QuickActionCard(
              label: 'Roster',
              icon: Icons.event_note_rounded,
              onTap: () => context.push('/volunteer/rosters'),
            ),
            _QuickActionCard(
              label: 'Volunteers',
              icon: Icons.people_alt_rounded,
              onTap: () => context.push('/volunteer'),
            ),
            _QuickActionCard(
              label: 'Events',
              icon: Icons.event_rounded,
              onTap: () => context.push('/events'),
            ),
            _QuickActionCard(
              label: 'Attendance',
              icon: Icons.fact_check_rounded,
              onTap: () => context.push('/attendance'),
            ),
          ],
        ),
      ],
    );
  }

  _BannerData? _buildBannerData(dynamic openService, dynamic criticalInsight) {
    if (openService != null && openService.checkInOpen == true) {
      return _BannerData(
        id: 'service-${openService.serviceId}',
        route: '/attendance/checkin/${openService.serviceId}',
        label:
            '${openService.title} is LIVE - Check In',
        color: Colors.green.shade700,
        icon: Icons.live_tv_rounded,
      );
    }
    if (criticalInsight != null) {
      return _BannerData(
        id: 'insight-${criticalInsight.id}',
        route: '/insights',
        label: criticalInsight.title.toString(),
        color: AppColors.danger,
        icon: Icons.priority_high_rounded,
      );
    }
    return null;
  }

  String _timeGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) {
      return 'morning';
    }
    if (hour < 17) {
      return 'afternoon';
    }
    return 'evening';
  }

  String _firstName(String? fullName, String? username) {
    final display = (fullName ?? username ?? 'there').trim();
    if (display.isEmpty) {
      return 'there';
    }
    return display.split(' ').first;
  }

  String _tenantLabel(String? tenantId) {
    if (tenantId == null || tenantId.trim().isEmpty) {
      return 'Prynova church workspace';
    }
    return tenantId.replaceAll('_', ' ');
  }

  String _tenantInitial(String? tenantId) {
    final label = _tenantLabel(tenantId).trim();
    return label.isEmpty ? 'P' : label[0].toUpperCase();
  }

  String _profileInitials(String? fullName, String? username) {
    final source = (fullName ?? username ?? 'P').trim();
    if (source.isEmpty) {
      return 'P';
    }
    final parts = source.split(' ').where((part) => part.isNotEmpty).toList();
    if (parts.length == 1) {
      return parts.first.substring(0, 1).toUpperCase();
    }
    return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
  }

  String _dashboardHeadline(String role) {
    switch (_resolveMode(role)) {
      case _DashboardMode.care:
        return 'Care leadership at a glance';
      case _DashboardMode.pastor:
        return 'Leadership intelligence on mobile';
      case _DashboardMode.volunteer:
        return 'Ready for your next assignment';
      case _DashboardMode.member:
        return 'Your church life in one place';
    }
  }

  String _dashboardSubtitle(String role) {
    switch (_resolveMode(role)) {
      case _DashboardMode.care:
        return 'Track follow-ups, prayer needs, and care actions for today.';
      case _DashboardMode.pastor:
        return 'Monitor branch health, critical insights, and AI tools from anywhere.';
      case _DashboardMode.volunteer:
        return 'Stay in sync with rosters, events, and reliability updates.';
      case _DashboardMode.member:
        return 'See attendance, events, devotionals, and announcements tailored to you.';
    }
  }
}

enum _DashboardMode { member, care, pastor, volunteer }

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.title,
    required this.actionLabel,
    required this.onAction,
  });

  final String title;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: <Widget>[
        Expanded(
          child: Text(
            title,
            style: Theme.of(context).textTheme.titleLarge,
          ),
        ),
        TextButton(
          onPressed: onAction,
          child: Text(actionLabel),
        ),
      ],
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({
    required this.child,
    this.margin,
  });

  final Widget child;
  final EdgeInsetsGeometry? margin;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: margin,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.inputBorder),
      ),
      child: child,
    );
  }
}

class _MetricColumn extends StatelessWidget {
  const _MetricColumn({
    required this.label,
    required this.value,
    required this.tone,
  });

  final String label;
  final String value;
  final Color tone;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(
          label,
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 8),
        Text(
          value,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(color: tone),
        ),
      ],
    );
  }
}

class _MiniStatCard extends StatelessWidget {
  const _MiniStatCard({
    required this.label,
    required this.value,
    required this.subtitle,
  });

  final String label;
  final String value;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 156,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.inputBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(label, style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 10),
          Text(value, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 4),
          Text(subtitle, style: Theme.of(context).textTheme.bodyMedium),
        ],
      ),
    );
  }
}

class _AnnouncementTile extends StatelessWidget {
  const _AnnouncementTile({required this.message});

  final InboxMessage message;

  @override
  Widget build(BuildContext context) {
    return _SectionCard(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        contentPadding: EdgeInsets.zero,
        leading: CircleAvatar(
          backgroundColor: message.typeColor.withValues(alpha: 0.12),
          child: Icon(message.typeIcon, color: message.typeColor),
        ),
        title: Text(message.title),
        subtitle: Text(
          message.message,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        trailing: const Icon(Icons.chevron_right_rounded),
      ),
    );
  }
}

class _BranchHealthTile extends StatelessWidget {
  const _BranchHealthTile({required this.branch});

  final BranchMetric branch;

  @override
  Widget build(BuildContext context) {
    final gradeColor = switch (branch.grade.toUpperCase()) {
      'A' => Colors.green.shade700,
      'B' => Colors.teal.shade600,
      'C' => Colors.orange.shade600,
      _ => AppColors.danger,
    };

    return _SectionCard(
      margin: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: <Widget>[
          CircleAvatar(
            backgroundColor: AppColors.primary.withValues(alpha: 0.1),
            child: Text(branch.branchName.isEmpty ? 'B' : branch.branchName[0]),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  branch.branchName,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${branch.members} members • ${branch.attendance.toStringAsFixed(0)} attendance',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: gradeColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              branch.grade,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: gradeColor,
                    fontWeight: FontWeight.w800,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}

class _InsightAlertTile extends StatelessWidget {
  const _InsightAlertTile({
    required this.title,
    required this.message,
    required this.onTap,
  });

  final String title;
  final String message;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return _SectionCard(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            const Icon(Icons.warning_amber_rounded, color: AppColors.danger),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    title,
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    message,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Icon(Icons.chevron_right_rounded),
          ],
        ),
      ),
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  const _QuickActionCard({
    required this.label,
    required this.icon,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: (MediaQuery.of(context).size.width - 44) / 2,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppColors.inputBorder),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Icon(icon, color: AppColors.primary),
              const SizedBox(height: 14),
              Text(
                label,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _EventsStrip extends StatelessWidget {
  const _EventsStrip({required this.upcomingEvents});

  final List<Event> upcomingEvents;

  @override
  Widget build(BuildContext context) {
    if (upcomingEvents.isEmpty) {
      return const EmptyStateWidget(
        icon: Icons.event_busy_rounded,
        title: 'No upcoming events',
        message: 'Upcoming church events appear here once they are published.',
      );
    }

    return SizedBox(
      height: 205,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: upcomingEvents.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (context, index) => EventBannerCard(
          event: upcomingEvents[index],
          onTap: () => context.push('/events/${upcomingEvents[index].eventId}'),
        ),
      ),
    );
  }
}

class _TopBanner extends StatelessWidget {
  const _TopBanner({
    required this.data,
    required this.onTap,
    required this.onDismiss,
  });

  final _BannerData data;
  final VoidCallback onTap;
  final VoidCallback onDismiss;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: data.color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: data.color.withValues(alpha: 0.25)),
        ),
        child: Row(
          children: <Widget>[
            Icon(data.icon, color: data.color),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                data.label,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: data.color,
                      fontWeight: FontWeight.w700,
                    ),
              ),
            ),
            IconButton(
              visualDensity: VisualDensity.compact,
              onPressed: onDismiss,
              icon: const Icon(Icons.close_rounded),
            ),
          ],
        ),
      ),
    );
  }
}

class _BannerData {
  const _BannerData({
    required this.id,
    required this.route,
    required this.label,
    required this.color,
    required this.icon,
  });

  final String id;
  final String route;
  final String label;
  final Color color;
  final IconData icon;
}
