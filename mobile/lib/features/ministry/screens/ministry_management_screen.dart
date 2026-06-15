import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/utils/app_colors.dart';
import '../../../../core/utils/role_helper.dart';
import '../../../../shared/widgets/empty_state_widget.dart';
import '../../auth/providers/auth_provider.dart';
import '../../members/widgets/member_bottom_navigation.dart';
import '../data/ministry_repository.dart';
import '../data/models/ministry.dart';
import 'ministry_detail_screen.dart';

class MinistryManagementScreen extends ConsumerWidget {
  const MinistryManagementScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final role = ref.watch(authProvider).user?.role ?? '';
    final memberId = ref.watch(authProvider).user?.memberId ?? '';
    final isHeadPastor = role == 'head_pastor' || role == 'super_admin';

    return DefaultTabController(
      length: isHeadPastor ? 2 : 1,
      child: Scaffold(
        backgroundColor: AppColors.surface,
        appBar: AppBar(
          title: const Text('Ministry Management'),
          bottom: TabBar(
            tabs: <Widget>[
              const Tab(text: 'My Ministries'),
              if (isHeadPastor) const Tab(text: 'All Ministries'),
            ],
          ),
        ),
        bottomNavigationBar: const MemberBottomNavigation(currentIndex: 0),
        body: TabBarView(
          children: <Widget>[
            _MinistryListScope(
              future: ref.read(ministryRepositoryProvider).getMemberMinistries(memberId),
            ),
            if (isHeadPastor)
              _MinistryListScope(
                future: ref.read(ministryRepositoryProvider).getAllMinistries(),
              ),
          ],
        ),
      ),
    );
  }
}

class _MinistryListScope extends ConsumerWidget {
  const _MinistryListScope({required this.future});

  final Future<List<Ministry>> future;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return FutureBuilder<List<Ministry>>(
      future: future,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Center(child: Text(snapshot.error.toString()));
        }

        final ministries = snapshot.data ?? const <Ministry>[];
        if (ministries.isEmpty) {
          return const EmptyStateWidget(
            icon: Icons.handshake_outlined,
            title: 'No ministries found',
            message: 'Ministry records will appear here once available.',
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(20),
          itemCount: ministries.length,
          itemBuilder: (context, index) {
            final ministry = ministries[index];
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: AppColors.inputBorder),
              ),
              child: ListTile(
                contentPadding: const EdgeInsets.all(16),
                leading: CircleAvatar(
                  radius: 26,
                  backgroundColor: ministry.typeColor.withValues(alpha: 0.16),
                  child: Icon(ministry.typeIcon, color: ministry.typeColor),
                ),
                title: Text(ministry.name),
                subtitle: Text('${ministry.memberCount} members • ${ministry.leaderName ?? 'No leader assigned'}'),
                trailing: Icon(
                  ministry.isActive ? Icons.check_circle_rounded : Icons.pause_circle_rounded,
                  color: ministry.isActive ? AppColors.success : AppColors.accent,
                ),
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => MinistryDetailScreen(
                        repository: ref.read(ministryRepositoryProvider),
                        ministryId: ministry.ministryId,
                        readOnly: false,
                      ),
                    ),
                  );
                },
              ),
            );
          },
        );
      },
    );
  }
}
