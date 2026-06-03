import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../../auth/providers/auth_provider.dart';
import '../../members/widgets/member_bottom_navigation.dart';
import '../providers/follow_ups_provider.dart';
import '../providers/visitors_provider.dart';
import '../visitors_utils.dart';
import '../widgets/complete_follow_up_sheet.dart';
import '../widgets/follow_up_card.dart';
import '../widgets/visitor_list_tile.dart';
import 'visitor_detail_screen.dart';
import 'visitors_list_screen.dart';

class VisitorsScreen extends ConsumerWidget {
  const VisitorsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final role = authState.user?.role;

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: Text('Visitors', style: AppTextStyles.titleMedium),
      ),
      bottomNavigationBar: const MemberBottomNavigation(currentIndex: 1),
      body: isVisitorLeaderRole(role)
          ? const _CareLeaderVisitorView()
          : const _ReferVisitorView(),
    );
  }
}

class _ReferVisitorView extends ConsumerWidget {
  const _ReferVisitorView();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final state = ref.watch(visitorsProvider);
    final referrals = state.visitors.where((visitor) {
      final memberId = user?.memberId ?? '';
      final fullName = user?.fullName ?? '';
      return (memberId.isNotEmpty && visitor.referredByMemberId == memberId) ||
          (fullName.isNotEmpty && visitor.referredByMemberName == fullName);
    }).toList();

    return RefreshIndicator(
      onRefresh: () => ref.read(visitorsProvider.notifier).refresh(),
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: <Widget>[
          Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(26),
              gradient: const LinearGradient(
                colors: <Color>[AppColors.primary, Color(0xFF2A3A63)],
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  'Did you bring a friend today?',
                  style: AppTextStyles.headlineMedium.copyWith(color: Colors.white),
                ),
                const SizedBox(height: 12),
                Text(
                  'Register your guest quickly so the care team can welcome them well.',
                  style: AppTextStyles.bodyLarge.copyWith(
                    color: Colors.white.withValues(alpha: 0.82),
                  ),
                ),
                const SizedBox(height: 18),
                FilledButton(
                  onPressed: () => context.push('/visitors/register'),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.accent,
                    foregroundColor: AppColors.primary,
                  ),
                  child: const Text('Register My Guest'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),
          Row(
            children: <Widget>[
              Text('My Referrals', style: AppTextStyles.titleMedium),
              const Spacer(),
              TextButton(
                onPressed: () => SharePlus.instance.share(
                  ShareParams(
                    text: 'Join me this Sunday at church. You can register quickly when you arrive at the welcome desk.',
                  ),
                ),
                child: const Text('Invite a Friend'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (state.isLoading && referrals.isEmpty)
            const Padding(
              padding: EdgeInsets.only(top: 80),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (referrals.isEmpty)
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.inputBorder),
              ),
              child: Text(
                'Your referred visitors will appear here after registration.',
                style: AppTextStyles.bodyMedium,
              ),
            )
          else
            ...referrals.map((visitor) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: VisitorListTile(visitor: visitor),
                )),
        ],
      ),
    );
  }
}

class _CareLeaderVisitorView extends ConsumerWidget {
  const _CareLeaderVisitorView();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final visitorsState = ref.watch(visitorsProvider);
    final followUpsState = ref.watch(followUpsProvider);
    final assignedVisitors = visitorsState.visitors.where((visitor) {
      if ((visitor.assignedToUserId ?? '').isEmpty || (user?.userId ?? '').isEmpty) {
        return true;
      }
      return visitor.assignedToUserId == user!.userId;
    }).toList();
    final todayLabel = DateTime.now().toIso8601String().split('T').first;
    final todayFollowUps = followUpsState.myFollowUps.where((item) {
      return (item['scheduledDate'] ?? '').toString().startsWith(todayLabel);
    }).toList();

    Future<void> openCompleteSheet(Map<String, dynamic> item) async {
      final result = await showModalBottomSheet<Map<String, dynamic>>(
        context: context,
        isScrollControlled: true,
        backgroundColor: AppColors.surface,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        builder: (_) => CompleteFollowUpSheet(
          visitorName: (item['visitorName'] ?? 'Visitor').toString(),
        ),
      );

      if (result != null) {
        await ref.read(followUpsProvider.notifier).complete(
              (item['visitorId'] ?? '').toString(),
              (item['id'] ?? '').toString(),
              result,
            );
      }
    }

    return RefreshIndicator(
      onRefresh: () async {
        await ref.read(visitorsProvider.notifier).refresh();
        await ref.read(followUpsProvider.notifier).refresh();
      },
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: <Widget>[
          Row(
            children: <Widget>[
              Expanded(
                child: _StatCard(
                  label: 'Assigned Visitors',
                  value: '${assignedVisitors.length}',
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _StatCard(
                  label: 'Pending Follow-ups',
                  value: '${followUpsState.myFollowUps.length}',
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _StatCard(
                  label: 'Overdue',
                  value: '${followUpsState.overdueFollowUps.length}',
                  accentColor: AppColors.danger,
                ),
              ),
            ],
          ),
          const SizedBox(height: 22),
          Row(
            children: <Widget>[
              Text('Follow-ups Due Today', style: AppTextStyles.titleMedium),
              const Spacer(),
              TextButton(
                onPressed: () => context.push('/visitors/follow-ups'),
                child: const Text('See all'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (todayFollowUps.isEmpty)
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.inputBorder),
              ),
              child: Text('No follow-ups due today.', style: AppTextStyles.bodyMedium),
            )
          else
            ...todayFollowUps.map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: FollowUpCard(
                    followUp: item,
                    onTap: () => openCompleteSheet(item),
                    onComplete: () => openCompleteSheet(item),
                  ),
                )),
          const SizedBox(height: 22),
          Row(
            children: <Widget>[
              Text('My Assigned Visitors', style: AppTextStyles.titleMedium),
              const Spacer(),
              TextButton(
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => const VisitorsListScreen(),
                    ),
                  );
                },
                child: const Text('All Visitors'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ...assignedVisitors.take(6).map((visitor) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: VisitorListTile(
                  visitor: visitor,
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => VisitorDetailScreen(visitorId: visitor.id),
                      ),
                    );
                  },
                ),
              )),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: () => _showPipelineSheet(context, assignedVisitors),
            icon: const Icon(Icons.view_kanban_outlined),
            label: const Text('View Pipeline'),
          ),
        ],
      ),
    );
  }

  void _showPipelineSheet(BuildContext context, List visitors) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(20),
        child: ListView(
          shrinkWrap: true,
          children: kVisitorStages.map((stage) {
            final items = visitors.where((visitor) => visitor.pipelineStage == stage).toList();
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: stageBackgroundFor(stage),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      '${stageLabel(stage)} (${items.length})',
                      style: AppTextStyles.bodyLarge.copyWith(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 10),
                    if (items.isEmpty)
                      Text('No visitors in this stage.', style: AppTextStyles.bodyMedium)
                    else
                      ...items.map<Widget>((visitor) => Padding(
                            padding: const EdgeInsets.only(bottom: 6),
                            child: Text(visitor.fullName, style: AppTextStyles.bodyMedium),
                          )),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    this.accentColor = AppColors.primary,
  });

  final String label;
  final String value;
  final Color accentColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.inputBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(label, style: AppTextStyles.bodyMedium),
          const SizedBox(height: 10),
          Text(
            value,
            style: AppTextStyles.headlineMedium.copyWith(color: accentColor),
          ),
        ],
      ),
    );
  }
}
