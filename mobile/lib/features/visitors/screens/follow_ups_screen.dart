import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/follow_ups_provider.dart';
import '../visitors_utils.dart';
import '../widgets/complete_follow_up_sheet.dart';
import '../widgets/follow_up_card.dart';
import '../widgets/overdue_follow_up_card.dart';

class FollowUpsScreen extends ConsumerWidget {
  const FollowUpsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final role = ref.watch(authProvider).user?.role;
    if (!isVisitorLeaderRole(role)) {
      return Scaffold(
        appBar: AppBar(title: Text('Follow-ups', style: AppTextStyles.titleMedium)),
        body: Center(child: Text('Care leader access only.', style: AppTextStyles.bodyLarge)),
      );
    }

    final state = ref.watch(followUpsProvider);
    final todayKey = DateTime.now().toIso8601String().split('T').first;
    final today = state.myFollowUps.where((item) {
      return (item['scheduledDate'] ?? '').toString().startsWith(todayKey);
    }).toList();

    Future<void> completeItem(Map<String, dynamic> item) async {
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

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        backgroundColor: AppColors.surface,
        appBar: AppBar(
          title: Text('Follow-ups', style: AppTextStyles.titleMedium),
          bottom: const TabBar(
            tabs: <Tab>[
              Tab(text: 'Today'),
              Tab(text: 'Overdue'),
              Tab(text: 'All Mine'),
            ],
          ),
        ),
        body: state.isLoading && state.myFollowUps.isEmpty && state.overdueFollowUps.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : TabBarView(
                children: <Widget>[
                  _FollowUpListView(
                    items: today,
                    emptyMessage: 'No follow-ups due today.',
                    onComplete: completeItem,
                  ),
                  Container(
                    color: const Color(0xFFFFFBFA),
                    child: _FollowUpListView(
                      items: state.overdueFollowUps,
                      emptyMessage: 'No overdue follow-ups right now.',
                      onComplete: completeItem,
                      overdue: true,
                    ),
                  ),
                  _FollowUpListView(
                    items: state.myFollowUps,
                    emptyMessage: 'No assigned follow-ups yet.',
                    onComplete: completeItem,
                  ),
                ],
              ),
      ),
    );
  }
}

class _FollowUpListView extends StatelessWidget {
  const _FollowUpListView({
    required this.items,
    required this.emptyMessage,
    required this.onComplete,
    this.overdue = false,
  });

  final List<Map<String, dynamic>> items;
  final String emptyMessage;
  final bool overdue;
  final Future<void> Function(Map<String, dynamic>) onComplete;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(emptyMessage, style: AppTextStyles.bodyLarge),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: overdue
              ? OverdueFollowUpCard(
                  followUp: item,
                  onTap: () => onComplete(item),
                  onComplete: () => onComplete(item),
                )
              : FollowUpCard(
                  followUp: item,
                  onTap: () => onComplete(item),
                  onComplete: () => onComplete(item),
                ),
        );
      },
    );
  }
}
