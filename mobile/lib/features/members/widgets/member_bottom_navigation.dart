import 'package:flutter/material.dart';
import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/utils/app_colors.dart';
import '../../communication/providers/inbox_provider.dart';
import '../../visitors/providers/follow_ups_provider.dart';

class MemberBottomNavigation extends ConsumerStatefulWidget {
  const MemberBottomNavigation({
    super.key,
    required this.currentIndex,
  });

  final int currentIndex;

  @override
  ConsumerState<MemberBottomNavigation> createState() =>
      _MemberBottomNavigationState();
}

class _MemberBottomNavigationState
    extends ConsumerState<MemberBottomNavigation> {
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    _refreshTimer = Timer.periodic(const Duration(seconds: 60), (_) {
      ref.read(inboxRefreshTickProvider.notifier).state++;
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final unreadAsync = ref.watch(unreadCountProvider);
    final unreadCount = unreadAsync.value ?? 0;
    final followUpsState = ref.watch(followUpsProvider);
    final overdueCount = followUpsState.overdueFollowUps.length;

    return NavigationBar(
      selectedIndex: widget.currentIndex,
      indicatorColor: AppColors.accent.withValues(alpha: 0.18),
      backgroundColor: Colors.white,
      onDestinationSelected: (index) {
        switch (index) {
          case 0:
            context.go('/dashboard');
            return;
          case 1:
            context.go('/visitors');
            return;
          case 2:
            context.go('/members');
            return;
          case 3:
            context.go('/finance');
            return;
          case 4:
            context.go('/inbox');
            return;
          case 5:
            context.go('/profile');
            return;
        }
      },
      destinations: <NavigationDestination>[
        NavigationDestination(
          icon: Icon(Icons.dashboard_outlined),
          selectedIcon: Icon(Icons.dashboard_rounded),
          label: 'Home',
        ),
        NavigationDestination(
          icon: overdueCount > 0
              ? Badge(
                  label: Text(overdueCount > 99 ? '99+' : '$overdueCount'),
                  backgroundColor: AppColors.danger,
                  child: const Icon(Icons.person_add_alt_1_outlined),
                )
              : const Icon(Icons.person_add_alt_1_outlined),
          selectedIcon: overdueCount > 0
              ? Badge(
                  label: Text(overdueCount > 99 ? '99+' : '$overdueCount'),
                  backgroundColor: AppColors.danger,
                  child: const Icon(Icons.person_add_alt_1_rounded),
                )
              : const Icon(Icons.person_add_alt_1_rounded),
          label: 'Visitors',
        ),
        NavigationDestination(
          icon: Icon(Icons.groups_outlined),
          selectedIcon: Icon(Icons.groups_rounded),
          label: 'Members',
        ),
        NavigationDestination(
          icon: const Icon(Icons.account_balance_wallet_outlined),
          selectedIcon: const Icon(Icons.account_balance_wallet_rounded),
          label: 'Finance',
        ),
        NavigationDestination(
          icon: unreadCount > 0
              ? Badge(
                  label: Text(unreadCount > 99 ? '99+' : '$unreadCount'),
                  backgroundColor: AppColors.accent,
                  child: const Icon(Icons.inbox_outlined),
                )
              : const Icon(Icons.inbox_outlined),
          selectedIcon: unreadCount > 0
              ? Badge(
                  label: Text(unreadCount > 99 ? '99+' : '$unreadCount'),
                  backgroundColor: AppColors.accent,
                  child: const Icon(Icons.inbox_rounded),
                )
              : const Icon(Icons.inbox_rounded),
          label: 'Inbox',
        ),
        NavigationDestination(
          icon: Icon(Icons.person_outline_rounded),
          selectedIcon: Icon(Icons.person_rounded),
          label: 'Profile',
        ),
      ],
    );
  }
}
