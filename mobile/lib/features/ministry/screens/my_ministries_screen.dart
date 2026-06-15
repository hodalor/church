import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/utils/app_colors.dart';
import '../../../../shared/widgets/empty_state_widget.dart';
import '../../auth/providers/auth_provider.dart';
import '../../members/widgets/member_bottom_navigation.dart';
import '../data/ministry_repository.dart';
import '../data/models/ministry.dart';
import 'ministry_detail_screen.dart';

class MyMinistriesScreen extends ConsumerWidget {
  const MyMinistriesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final memberId = user?.memberId;

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(title: const Text('My Ministries')),
      bottomNavigationBar: const MemberBottomNavigation(currentIndex: 0),
      body: memberId == null || memberId.isEmpty
          ? const EmptyStateWidget(
              icon: Icons.group_off_rounded,
              title: 'No member profile linked',
              message: 'This account is not linked to a member profile yet.',
            )
          : FutureBuilder<List<Ministry>>(
              future: ref.read(ministryRepositoryProvider).getMemberMinistries(memberId),
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
                    title: 'You are not assigned to any ministry yet',
                    message: 'Contact your pastor to be assigned',
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async => ref.invalidate(ministryRepositoryProvider),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(20),
                    itemCount: ministries.length,
                    itemBuilder: (context, index) {
                      final ministry = ministries[index];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 14),
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
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: <Widget>[
                              const SizedBox(height: 6),
                              Text('${ministry.memberRole ?? 'Member'} • Joined ${_formatDate(ministry.joinedAt)}'),
                              const SizedBox(height: 4),
                              Text(
                                ministry.nextMeetingAt == null
                                    ? 'Next meeting will appear here'
                                    : 'Next meeting ${_formatDate(ministry.nextMeetingAt)} • ${ministry.meetingSchedule.time ?? 'Time TBD'}',
                              ),
                            ],
                          ),
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute<void>(
                                builder: (_) => MinistryDetailScreen(
                                  repository: ref.read(ministryRepositoryProvider),
                                  ministryId: ministry.ministryId,
                                  readOnly: true,
                                ),
                              ),
                            );
                          },
                        ),
                      );
                    },
                  ),
                );
              },
            ),
    );
  }

  String _formatDate(DateTime? date) {
    if (date == null) {
      return 'TBD';
    }
    return '${date.day}/${date.month}/${date.year}';
  }
}
