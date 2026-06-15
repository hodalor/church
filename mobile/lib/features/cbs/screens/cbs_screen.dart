import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/utils/app_colors.dart';
import '../../../../core/utils/role_helper.dart';
import '../../../../shared/widgets/empty_state_widget.dart';
import '../../auth/providers/auth_provider.dart';
import '../../members/widgets/member_bottom_navigation.dart';
import '../data/models/cbs_prospect.dart';
import '../providers/cbs_provider.dart';

class CBSScreen extends ConsumerWidget {
  const CBSScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final role = ref.watch(authProvider).user?.role ?? '';
    final state = ref.watch(cbsProvider);

    if (!RoleHelper.canAccessCBS(role)) {
      return const Scaffold(
        body: Center(
          child: Text('You do not have access to the CBS mobile workspace.'),
        ),
      );
    }

    final group = state.group;
    final baptismCandidates = state.prospects.where((item) => item.studyStage == 'baptism_candidate').toList();

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('My CBS Group'),
        actions: <Widget>[
          IconButton(
            onPressed: () => ref.read(cbsProvider.notifier).loadMyGroup(),
            icon: const Icon(Icons.query_stats_rounded),
          ),
        ],
      ),
      bottomNavigationBar: const MemberBottomNavigation(currentIndex: 0),
      floatingActionButton: group == null
          ? null
          : FloatingActionButton.extended(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              onPressed: () => context.push('/cbs/session/new/${group.groupId}'),
              icon: const Icon(Icons.menu_book_rounded),
              label: const Text('Record Study'),
            ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(cbsProvider.notifier).loadMyGroup(),
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: <Widget>[
            if (state.isLoading && group == null)
              const Padding(
                padding: EdgeInsets.only(top: 120),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (group == null)
              const EmptyStateWidget(
                icon: Icons.groups_rounded,
                title: 'No CBS group assigned',
                message: 'Your CBS group will appear here once you are assigned as a leader or co-leader.',
              )
            else ...<Widget>[
              _GroupInfoCard(group: group, stats: state.stats),
              const SizedBox(height: 16),
              if (baptismCandidates.isNotEmpty) ...<Widget>[
                ...baptismCandidates.map((prospect) => _BaptismCandidateCard(prospect: prospect)),
                const SizedBox(height: 16),
              ],
              Row(
                children: <Widget>[
                  Text('Active Prospects', style: Theme.of(context).textTheme.titleMedium),
                  const Spacer(),
                  TextButton.icon(
                    onPressed: () => _showAddProspectSheet(context, ref, group.groupId),
                    icon: const Icon(Icons.person_add_alt_1_rounded),
                    label: const Text('Add Prospect'),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              if (state.prospects.isEmpty)
                const EmptyStateWidget(
                  icon: Icons.person_search_rounded,
                  title: 'No prospects yet',
                  message: 'Add prospects to start tracking the CBS journey on mobile.',
                )
              else
                ...state.prospects.map(
                  (prospect) => _ProspectListTile(prospect: prospect),
                ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _showAddProspectSheet(BuildContext context, WidgetRef ref, String groupId) async {
    final firstNameController = TextEditingController();
    final lastNameController = TextEditingController();
    final phoneController = TextEditingController();
    final emailController = TextEditingController();

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      backgroundColor: AppColors.surface,
      builder: (sheetContext) {
        return Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 12,
            bottom: MediaQuery.viewInsetsOf(sheetContext).bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              TextField(
                controller: firstNameController,
                decoration: const InputDecoration(labelText: 'First name'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: lastNameController,
                decoration: const InputDecoration(labelText: 'Last name'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: phoneController,
                decoration: const InputDecoration(labelText: 'Phone'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: emailController,
                decoration: const InputDecoration(labelText: 'Email'),
              ),
              const SizedBox(height: 18),
              ElevatedButton(
                onPressed: () async {
                  await ref.read(cbsProvider.notifier).addProspect(
                        <String, dynamic>{
                          'groupId': groupId,
                          'firstName': firstNameController.text.trim(),
                          'lastName': lastNameController.text.trim(),
                          'phone': phoneController.text.trim(),
                          'email': emailController.text.trim(),
                        },
                      );
                  if (!context.mounted) {
                    return;
                  }
                  Navigator.of(sheetContext).pop();
                },
                child: const Text('Add Prospect'),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _GroupInfoCard extends StatelessWidget {
  const _GroupInfoCard({
    required this.group,
    required this.stats,
  });

  final dynamic group;
  final Map<String, dynamic> stats;

  @override
  Widget build(BuildContext context) {
    final baptised = stats['prospectsByStage'] is Map<String, dynamic>
        ? ((stats['prospectsByStage'] as Map<String, dynamic>)['baptised'] ?? 0)
        : 0;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.accent, width: 1.3),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(group.name, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Text('${group.zone ?? 'Zone TBD'} • ${group.meetingSchedule.frequency ?? 'Schedule TBD'} • ${group.meetingSchedule.time ?? 'Time TBD'}'),
          const SizedBox(height: 16),
          Row(
            children: <Widget>[
              _StatPill(label: 'Prospects', value: '${group.prospectCount}'),
              const SizedBox(width: 8),
              _StatPill(label: 'Studying', value: '${group.studyCount}'),
              const SizedBox(width: 8),
              _StatPill(label: 'Baptised', value: '$baptised'),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatPill extends StatelessWidget {
  const _StatPill({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.07),
          borderRadius: BorderRadius.circular(18),
        ),
        child: Column(
          children: <Widget>[
            Text(value, style: const TextStyle(fontWeight: FontWeight.w800)),
            const SizedBox(height: 4),
            Text(label, style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );
  }
}

class _BaptismCandidateCard extends StatelessWidget {
  const _BaptismCandidateCard({required this.prospect});

  final CBSProspect prospect;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.accent.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.accent),
      ),
      child: Row(
        children: <Widget>[
          const Text('🙏', style: TextStyle(fontSize: 24)),
          const SizedBox(width: 12),
          Expanded(
            child: Text('${prospect.fullName} is a baptism candidate!'),
          ),
          TextButton(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Elder notification queued for ${prospect.fullName}.')),
              );
            },
            child: const Text('Notify Elder'),
          ),
        ],
      ),
    );
  }
}

class _ProspectListTile extends StatelessWidget {
  const _ProspectListTile({required this.prospect});

  final CBSProspect prospect;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.inputBorder),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        title: Text(prospect.fullName),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            const SizedBox(height: 6),
            Text('${prospect.studiesAttended} studies attended'),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: prospect.stageColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                prospect.stageLabel,
                style: TextStyle(
                  color: prospect.stageColor,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
        trailing: const Icon(Icons.chevron_right_rounded),
        onTap: () => context.push('/cbs/prospects/${prospect.prospectId}'),
      ),
    );
  }
}
