import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'core/services/connectivity_service.dart';
import 'core/utils/app_colors.dart';
import 'core/utils/app_theme.dart';
import 'features/ai/screens/ai_assistant_screen.dart';
import 'features/analytics/screens/hq_overview_screen.dart';
import 'features/analytics/screens/insights_screen.dart';
import 'features/analytics/screens/intelligence_screen.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/communication/screens/inbox_screen.dart';
import 'features/communication/screens/message_detail_screen.dart';
import 'features/communication/screens/polls_screen.dart';
import 'features/communication/screens/prayer_requests_screen.dart';
import 'features/communication/screens/submit_prayer_request_screen.dart';
import 'features/attendance/screens/attendance_history_screen.dart';
import 'features/attendance/screens/attendance_screen.dart';
import 'features/attendance/screens/check_in_screen.dart';
import 'features/attendance/screens/leader_checkin_scanner.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/dashboard/screens/dashboard_screen.dart';
import 'features/events/screens/event_detail_screen.dart';
import 'features/events/screens/event_qr_screen.dart';
import 'features/events/screens/events_screen.dart';
import 'features/events/screens/my_tickets_screen.dart';
import 'features/members/screens/member_detail_screen.dart';
import 'features/members/screens/members_screen.dart';
import 'features/members/screens/my_profile_screen.dart';
import 'features/members/widgets/member_bottom_navigation.dart';
import 'features/volunteers/screens/my_volunteer_screen.dart';
import 'features/volunteers/screens/roster_detail_screen.dart';
import 'features/volunteers/screens/roster_list_screen.dart';
import 'features/visitors/screens/follow_ups_screen.dart';
import 'features/visitors/screens/kiosk_registration_screen.dart';
import 'features/visitors/screens/visitor_detail_screen.dart';
import 'features/visitors/screens/visitor_registration_screen.dart';
import 'features/visitors/screens/visitors_screen.dart';
import 'shared/widgets/app_loading_indicator.dart';

final GlobalKey<NavigatorState> rootNavigatorKey = GlobalKey<NavigatorState>();

class AppRouterRegistry {
  AppRouterRegistry._();

  static final AppRouterRegistry instance = AppRouterRegistry._();

  GoRouter? router;
}

class PrynovaApp extends ConsumerWidget {
  const PrynovaApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final authRouterNotifier = ref.watch(authRouterRefreshProvider);

    if (authState.isLoading && !authState.isAuthenticated && authState.user == null) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light(),
        home: const _LaunchScreen(),
      );
    }

    final router = GoRouter(
      initialLocation: '/',
      refreshListenable: authRouterNotifier,
      navigatorKey: rootNavigatorKey,
      routes: <RouteBase>[
        GoRoute(
          path: '/',
          builder: (context, state) => const _LaunchScreen(),
        ),
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/dashboard',
          builder: (context, state) => const DashboardScreen(),
        ),
        GoRoute(
          path: '/visitors',
          builder: (context, state) => const VisitorsScreen(),
        ),
        GoRoute(
          path: '/visitors/register',
          builder: (context, state) => const VisitorRegistrationScreen(),
        ),
        GoRoute(
          path: '/visitors/:visitorId',
          builder: (context, state) => VisitorDetailScreen(
            visitorId: state.pathParameters['visitorId'] ?? '',
          ),
        ),
        GoRoute(
          path: '/visitors/follow-ups',
          builder: (context, state) => const FollowUpsScreen(),
        ),
        GoRoute(
          path: '/kiosk',
          builder: (context, state) => const KioskRegistrationScreen(),
        ),
        GoRoute(
          path: '/members',
          builder: (context, state) => const MembersScreen(),
        ),
        GoRoute(
          path: '/events',
          builder: (context, state) => const EventsScreen(),
        ),
        GoRoute(
          path: '/events/my-tickets',
          builder: (context, state) => const MyTicketsScreen(),
        ),
        GoRoute(
          path: '/events/:eventId/qr',
          builder: (context, state) => EventQrScreen(
            eventId: state.pathParameters['eventId'] ?? '',
          ),
        ),
        GoRoute(
          path: '/events/:eventId',
          builder: (context, state) => EventDetailScreen(
            eventId: state.pathParameters['eventId'] ?? '',
          ),
        ),
        GoRoute(
          path: '/volunteer',
          builder: (context, state) => const MyVolunteerScreen(),
        ),
        GoRoute(
          path: '/volunteer/rosters',
          builder: (context, state) => const RosterListScreen(),
        ),
        GoRoute(
          path: '/volunteer/rosters/:rosterId',
          builder: (context, state) => RosterDetailScreen(
            rosterId: state.pathParameters['rosterId'] ?? '',
          ),
        ),
        GoRoute(
          path: '/members/:memberId',
          builder: (context, state) => MemberDetailScreen(
            memberId: state.pathParameters['memberId'] ?? '',
          ),
        ),
        GoRoute(
          path: '/profile',
          builder: (context, state) => const MyProfileScreen(),
        ),
        GoRoute(
          path: '/finance',
          builder: (context, state) => const _ModulePlaceholderScreen(
            title: 'Finance',
            message:
                'Giving history, transaction approvals, and pledge tools continue here on mobile.',
          ),
        ),
        GoRoute(
          path: '/finance/history',
          builder: (context, state) => const _ModulePlaceholderScreen(
            title: 'Finance History',
            message: 'Your recent giving and finance records appear here.',
          ),
        ),
        GoRoute(
          path: '/finance/transactions/:id',
          builder: (context, state) => _ModulePlaceholderScreen(
            title: 'Transaction Detail',
            message:
                'Detailed transaction information for ${state.pathParameters['id'] ?? 'this item'} appears here.',
          ),
        ),
        GoRoute(
          path: '/finance/pledges',
          builder: (context, state) => const _ModulePlaceholderScreen(
            title: 'Pledges',
            message: 'Pledges and recurring giving commitments appear here.',
          ),
        ),
        GoRoute(
          path: '/inbox',
          builder: (context, state) => const InboxScreen(),
        ),
        GoRoute(
          path: '/inbox/:messageId',
          builder: (context, state) => MessageDetailScreen(
            messageId: state.pathParameters['messageId'] ?? '',
          ),
        ),
        GoRoute(
          path: '/prayer-requests',
          builder: (context, state) => const PrayerRequestsScreen(),
        ),
        GoRoute(
          path: '/prayer-requests/submit',
          builder: (context, state) => const SubmitPrayerRequestScreen(),
        ),
        GoRoute(
          path: '/prayer-requests/:requestId',
          builder: (context, state) => PrayerRequestsScreen(
            focusRequestId: state.pathParameters['requestId'],
          ),
        ),
        GoRoute(
          path: '/polls',
          builder: (context, state) => const PollsScreen(),
        ),
        GoRoute(
          path: '/pastoral',
          builder: (context, state) => const _ModulePlaceholderScreen(
            title: 'Pastoral Care',
            message:
                'Pastoral cases, care actions, and discipleship tools open from this workspace.',
          ),
        ),
        GoRoute(
          path: '/pastoral/cases',
          builder: (context, state) => const _ModulePlaceholderScreen(
            title: 'Pastoral Cases',
            message: 'Assigned care cases and updates appear here.',
          ),
        ),
        GoRoute(
          path: '/pastoral/cases/new',
          builder: (context, state) => const _ModulePlaceholderScreen(
            title: 'New Case',
            message: 'Create and assign a new pastoral case from this screen.',
          ),
        ),
        GoRoute(
          path: '/pastoral/cases/:caseId',
          builder: (context, state) => _ModulePlaceholderScreen(
            title: 'Case Detail',
            message:
                'Pastoral case ${state.pathParameters['caseId'] ?? ''} appears here with notes and actions.',
          ),
        ),
        GoRoute(
          path: '/pastoral/enrollment/:id',
          builder: (context, state) => _ModulePlaceholderScreen(
            title: 'Discipleship Enrollment',
            message:
                'Enrollment record ${state.pathParameters['id'] ?? ''} appears here.',
          ),
        ),
        GoRoute(
          path: '/attendance',
          builder: (context, state) => const AttendanceScreen(),
        ),
        GoRoute(
          path: '/attendance/checkin/:serviceId',
          builder: (context, state) => CheckInScreen(
            serviceId: state.pathParameters['serviceId'] ?? '',
          ),
        ),
        GoRoute(
          path: '/attendance/history',
          builder: (context, state) => const AttendanceHistoryScreen(),
        ),
        GoRoute(
          path: '/attendance/scanner/:serviceId',
          builder: (context, state) => LeaderCheckInScanner(
            serviceId: state.pathParameters['serviceId'] ?? '',
          ),
        ),
        GoRoute(
          path: '/hq',
          builder: (context, state) => const HQOverviewScreen(),
        ),
        GoRoute(
          path: '/intelligence',
          builder: (context, state) => const IntelligenceScreen(),
        ),
        GoRoute(
          path: '/insights',
          builder: (context, state) => const InsightsScreen(),
        ),
        GoRoute(
          path: '/ai-assistant',
          builder: (context, state) => const AIAssistantScreen(),
        ),
      ],
      redirect: (context, state) {
        final location = state.matchedLocation;
        final isRoot = location == '/';
        final isLoggingIn = state.matchedLocation == '/login';
        final isAuthenticated = authState.isAuthenticated;
        final isKiosk = location == '/kiosk';

        if (authState.isLoading) {
          return isRoot ? null : '/';
        }

        if (!isAuthenticated && !isLoggingIn) {
          if (isKiosk) {
            return null;
          }
          return '/login';
        }

        if (isAuthenticated && (isLoggingIn || isRoot)) {
          return '/dashboard';
        }

        if (!isAuthenticated && isRoot) {
          return '/login';
        }

        return null;
      },
    );
    AppRouterRegistry.instance.router = router;

    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'Prynova',
      theme: AppTheme.light(),
      builder: (context, child) => _ConnectivityBannerShell(
        child: child ?? const SizedBox.shrink(),
      ),
      routerConfig: router,
    );
  }
}

class _LaunchScreen extends StatelessWidget {
  const _LaunchScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: AppColors.primary,
      body: Center(
        child: AppLoadingIndicator(
          showLabel: true,
          label: 'Loading Prynova...',
          textColor: Colors.white,
        ),
      ),
    );
  }
}

class _ConnectivityBannerShell extends ConsumerWidget {
  const _ConnectivityBannerShell({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final connectivity = ref.watch(connectivityProvider);

    return Stack(
      children: <Widget>[
        child,
        IgnorePointer(
          ignoring: connectivity.isOnline,
          child: AnimatedSlide(
            duration: const Duration(milliseconds: 220),
            offset: connectivity.isOnline ? const Offset(0, -1.1) : Offset.zero,
            child: SafeArea(
              child: Align(
                alignment: Alignment.topCenter,
                child: Container(
                  margin: const EdgeInsets.all(12),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF3CD),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFE0B14A)),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: <Widget>[
                      Icon(Icons.wifi_off_rounded, color: Color(0xFF8A6D1A)),
                      SizedBox(width: 8),
                      Text(
                        'No internet connection',
                        style: TextStyle(
                          color: Color(0xFF8A6D1A),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _ModulePlaceholderScreen extends StatelessWidget {
  const _ModulePlaceholderScreen({
    required this.title,
    required this.message,
  });

  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      bottomNavigationBar: const MemberBottomNavigation(currentIndex: 0),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Container(
            constraints: const BoxConstraints(maxWidth: 420),
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.inputBorder),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                CircleAvatar(
                  radius: 28,
                  backgroundColor: AppColors.primary.withValues(alpha: 0.12),
                  child: const Icon(
                    Icons.widgets_outlined,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  title,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 8),
                Text(
                  message,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
