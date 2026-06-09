import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/utils/app_colors.dart';
import '../../../core/utils/role_helper.dart';
import '../../auth/providers/auth_provider.dart';
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
    final authState = ref.watch(authProvider);
    final role = authState.user?.role ?? '';
    final unreadAsync = ref.watch(unreadCountProvider);
    final unreadCount = unreadAsync.value ?? 0;
    final overdueCount = ref.watch(followUpsProvider).overdueFollowUps.length;
    final location = GoRouterState.of(context).matchedLocation;
    final layout = _resolveLayout(role);
    final destinations = _buildDestinations(
      layout: layout,
      unreadCount: unreadCount,
      overdueCount: overdueCount,
      canAccessHq: RoleHelper.canAccessHQ(role),
    );
    final selectedIndex = _resolveSelectedIndex(
      location: location,
      fallbackIndex: widget.currentIndex,
      destinations: destinations,
      layout: layout,
    );

    return NavigationBar(
      selectedIndex: selectedIndex,
      onDestinationSelected: (index) {
        final destination = destinations[index];
        if (destination.route == _moreRoute) {
          _openMoreSheet(context, role);
          return;
        }
        if (destination.route.isNotEmpty) {
          context.go(destination.route);
        }
      },
      destinations: destinations
          .map(
            (destination) => NavigationDestination(
              icon: destination.icon,
              selectedIcon: destination.selectedIcon,
              label: destination.label,
            ),
          )
          .toList(),
    );
  }

  _NavLayout _resolveLayout(String role) {
    if (RoleHelper.isPastor(role)) {
      return _NavLayout.pastor;
    }
    if (RoleHelper.isLeader(role)) {
      return _NavLayout.leader;
    }
    return _NavLayout.member;
  }

  List<_NavDestinationConfig> _buildDestinations({
    required _NavLayout layout,
    required int unreadCount,
    required int overdueCount,
    required bool canAccessHq,
  }) {
    switch (layout) {
      case _NavLayout.pastor:
        return <_NavDestinationConfig>[
          _NavDestinationConfig(
            label: 'Home',
            route: '/dashboard',
            matches: const <String>['/dashboard'],
            icon: const Icon(Icons.home_outlined),
            selectedIcon: const Icon(Icons.home_rounded),
          ),
          _NavDestinationConfig(
            label: 'HQ',
            route: canAccessHq ? '/hq' : '/intelligence',
            matches: const <String>['/hq', '/intelligence', '/insights'],
            icon: const Icon(Icons.hub_outlined),
            selectedIcon: const Icon(Icons.hub_rounded),
          ),
          _NavDestinationConfig(
            label: 'AI',
            route: '/ai-assistant',
            matches: const <String>['/ai-assistant'],
            icon: const Icon(Icons.auto_awesome_outlined),
            selectedIcon: const Icon(Icons.auto_awesome_rounded),
          ),
          _NavDestinationConfig(
            label: 'Inbox',
            route: '/inbox',
            matches: const <String>['/inbox'],
            icon: _buildInboxIcon(unreadCount, rounded: false),
            selectedIcon: _buildInboxIcon(unreadCount, rounded: true),
          ),
          _NavDestinationConfig(
            label: 'More',
            route: _moreRoute,
            matches: const <String>[],
            icon: const Icon(Icons.menu_open_rounded),
            selectedIcon: const Icon(Icons.menu_rounded),
          ),
        ];
      case _NavLayout.leader:
        return <_NavDestinationConfig>[
          _NavDestinationConfig(
            label: 'Home',
            route: '/dashboard',
            matches: const <String>['/dashboard'],
            icon: const Icon(Icons.home_outlined),
            selectedIcon: const Icon(Icons.home_rounded),
          ),
          _NavDestinationConfig(
            label: 'Care',
            route: '/visitors/follow-ups',
            matches: const <String>[
              '/pastoral',
              '/visitors/follow-ups',
              '/prayer-requests',
            ],
            icon: _buildCareIcon(overdueCount, rounded: false),
            selectedIcon: _buildCareIcon(overdueCount, rounded: true),
          ),
          _NavDestinationConfig(
            label: 'Events',
            route: '/events',
            matches: const <String>['/events'],
            icon: const Icon(Icons.event_outlined),
            selectedIcon: const Icon(Icons.event_rounded),
          ),
          _NavDestinationConfig(
            label: 'Inbox',
            route: '/inbox',
            matches: const <String>['/inbox'],
            icon: _buildInboxIcon(unreadCount, rounded: false),
            selectedIcon: _buildInboxIcon(unreadCount, rounded: true),
          ),
          _NavDestinationConfig(
            label: 'More',
            route: _moreRoute,
            matches: const <String>[],
            icon: const Icon(Icons.menu_open_rounded),
            selectedIcon: const Icon(Icons.menu_rounded),
          ),
        ];
      case _NavLayout.member:
        return <_NavDestinationConfig>[
          _NavDestinationConfig(
            label: 'Home',
            route: '/dashboard',
            matches: const <String>['/dashboard', '/attendance'],
            icon: const Icon(Icons.home_outlined),
            selectedIcon: const Icon(Icons.home_rounded),
          ),
          _NavDestinationConfig(
            label: 'Members',
            route: '/members',
            matches: const <String>['/members'],
            icon: const Icon(Icons.groups_outlined),
            selectedIcon: const Icon(Icons.groups_rounded),
          ),
          _NavDestinationConfig(
            label: 'Finance',
            route: '/finance',
            matches: const <String>['/finance'],
            icon: const Icon(Icons.account_balance_wallet_outlined),
            selectedIcon: const Icon(Icons.account_balance_wallet_rounded),
          ),
          _NavDestinationConfig(
            label: 'Inbox',
            route: '/inbox',
            matches: const <String>['/inbox', '/polls', '/prayer-requests'],
            icon: _buildInboxIcon(unreadCount, rounded: false),
            selectedIcon: _buildInboxIcon(unreadCount, rounded: true),
          ),
          _NavDestinationConfig(
            label: 'Profile',
            route: '/profile',
            matches: const <String>['/profile'],
            icon: const Icon(Icons.person_outline_rounded),
            selectedIcon: const Icon(Icons.person_rounded),
          ),
        ];
    }
  }

  int _resolveSelectedIndex({
    required String location,
    required int fallbackIndex,
    required List<_NavDestinationConfig> destinations,
    required _NavLayout layout,
  }) {
    for (var i = 0; i < destinations.length; i++) {
      final destination = destinations[i];
      if (destination.matches.any(
        (prefix) => location == prefix || location.startsWith('$prefix/'),
      )) {
        return i;
      }
    }

    if (layout != _NavLayout.member) {
      return destinations.length - 1;
    }

    return fallbackIndex.clamp(0, destinations.length - 1);
  }

  Widget _buildInboxIcon(int unreadCount, {required bool rounded}) {
    final child = Icon(
      rounded ? Icons.inbox_rounded : Icons.inbox_outlined,
    );
    if (unreadCount <= 0) {
      return child;
    }
    return Badge(
      label: Text(unreadCount > 99 ? '99+' : '$unreadCount'),
      backgroundColor: AppColors.accent,
      child: child,
    );
  }

  Widget _buildCareIcon(int overdueCount, {required bool rounded}) {
    final child = Icon(
      rounded ? Icons.favorite_rounded : Icons.favorite_border_rounded,
    );
    if (overdueCount <= 0) {
      return child;
    }
    return Badge(
      label: Text(overdueCount > 99 ? '99+' : '$overdueCount'),
      backgroundColor: AppColors.danger,
      child: child,
    );
  }

  Future<void> _openMoreSheet(BuildContext context, String role) async {
    final items = <_MoreNavItem>[
      if (RoleHelper.canAccessHQ(role))
        const _MoreNavItem(
          label: 'HQ Overview',
          route: '/hq',
          icon: Icons.hub_rounded,
        ),
      if (RoleHelper.isLeader(role))
        const _MoreNavItem(
          label: 'Intelligence',
          route: '/intelligence',
          icon: Icons.insights_rounded,
        ),
      if (RoleHelper.isLeader(role))
        const _MoreNavItem(
          label: 'AI Assistant',
          route: '/ai-assistant',
          icon: Icons.auto_awesome_rounded,
        ),
      if (RoleHelper.canAccessPastoral(role))
        const _MoreNavItem(
          label: 'Pastoral Care',
          route: '/pastoral',
          icon: Icons.volunteer_activism_rounded,
        ),
      const _MoreNavItem(
        label: 'Members',
        route: '/members',
        icon: Icons.groups_rounded,
      ),
      const _MoreNavItem(
        label: 'Events',
        route: '/events',
        icon: Icons.event_rounded,
      ),
      const _MoreNavItem(
        label: 'Attendance',
        route: '/attendance',
        icon: Icons.event_available_rounded,
      ),
      const _MoreNavItem(
        label: 'Visitors',
        route: '/visitors',
        icon: Icons.person_search_rounded,
      ),
      const _MoreNavItem(
        label: 'Finance',
        route: '/finance',
        icon: Icons.account_balance_wallet_rounded,
      ),
      const _MoreNavItem(
        label: 'Profile',
        route: '/profile',
        icon: Icons.person_rounded,
      ),
    ];

    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.white,
      showDragHandle: true,
      builder: (sheetContext) {
        return SafeArea(
          child: ListView(
            shrinkWrap: true,
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
            children: <Widget>[
              Text(
                'More',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 12),
              ...items.map(
                (item) => ListTile(
                  leading: Icon(item.icon, color: AppColors.primary),
                  title: Text(item.label),
                  onTap: () {
                    Navigator.of(sheetContext).pop();
                    context.go(item.route);
                  },
                ),
              ),
              const Divider(height: 24),
              ListTile(
                leading: const Icon(Icons.logout_rounded, color: AppColors.danger),
                title: const Text('Logout'),
                onTap: () async {
                  Navigator.of(sheetContext).pop();
                  await ref.read(authProvider.notifier).logout();
                },
              ),
            ],
          ),
        );
      },
    );
  }
}

const String _moreRoute = '__more__';

enum _NavLayout { member, leader, pastor }

class _NavDestinationConfig {
  const _NavDestinationConfig({
    required this.label,
    required this.route,
    required this.matches,
    required this.icon,
    required this.selectedIcon,
  });

  final String label;
  final String route;
  final List<String> matches;
  final Widget icon;
  final Widget selectedIcon;
}

class _MoreNavItem {
  const _MoreNavItem({
    required this.label,
    required this.route,
    required this.icon,
  });

  final String label;
  final String route;
  final IconData icon;
}
