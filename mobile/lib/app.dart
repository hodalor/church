import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'core/utils/app_colors.dart';
import 'core/utils/app_text_styles.dart';
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
import 'features/dashboard/screens/finance_placeholder_screen.dart';
import 'features/members/screens/member_detail_screen.dart';
import 'features/members/screens/members_screen.dart';
import 'features/members/screens/my_profile_screen.dart';
import 'features/visitors/screens/follow_ups_screen.dart';
import 'features/visitors/screens/kiosk_registration_screen.dart';
import 'features/visitors/screens/visitor_detail_screen.dart';
import 'features/visitors/screens/visitor_registration_screen.dart';
import 'features/visitors/screens/visitors_screen.dart';

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
        theme: _theme(),
        home: const _LaunchScreen(),
      );
    }

    final router = GoRouter(
      initialLocation: '/login',
      refreshListenable: authRouterNotifier,
      navigatorKey: rootNavigatorKey,
      routes: <RouteBase>[
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
          builder: (context, state) => const FinancePlaceholderScreen(),
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
          path: '/prayer-requests/:requestId',
          builder: (context, state) => PrayerRequestsScreen(
            focusRequestId: state.pathParameters['requestId'],
          ),
        ),
        GoRoute(
          path: '/prayer-requests/submit',
          builder: (context, state) => const SubmitPrayerRequestScreen(),
        ),
        GoRoute(
          path: '/polls',
          builder: (context, state) => const PollsScreen(),
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
      ],
      redirect: (context, state) {
        final isLoggingIn = state.matchedLocation == '/login';
        final isAuthenticated = authState.isAuthenticated;

        if (authState.isLoading) {
          return null;
        }

        if (!isAuthenticated && !isLoggingIn) {
          if (state.matchedLocation == '/kiosk') {
            return null;
          }
          return '/login';
        }

        if (isAuthenticated && isLoggingIn) {
          return '/dashboard';
        }

        return null;
      },
    );
    AppRouterRegistry.instance.router = router;

    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'Prynova',
      theme: _theme(),
      routerConfig: router,
    );
  }

  ThemeData _theme() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: AppColors.primary,
      primary: AppColors.primary,
      secondary: AppColors.accent,
      surface: AppColors.surface,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: AppColors.surface,
      textTheme: TextTheme(
        displayLarge: AppTextStyles.displayLarge,
        headlineMedium: AppTextStyles.headlineMedium,
        titleMedium: AppTextStyles.titleMedium,
        bodyLarge: AppTextStyles.bodyLarge,
        bodyMedium: AppTextStyles.bodyMedium,
      ),
      appBarTheme: const AppBarTheme(
        centerTitle: false,
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
        ),
      ),
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
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(AppColors.accent),
        ),
      ),
    );
  }
}
