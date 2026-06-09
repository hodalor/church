import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/utils/role_helper.dart';
import '../../../shared/widgets/empty_state_widget.dart';
import '../../../shared/widgets/error_state_widget.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/hq_provider.dart';
import '../widgets/ai_insight_card.dart';

class InsightsScreen extends ConsumerWidget {
  const InsightsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final role = ref.watch(authProvider).user?.role ?? '';
    final state = ref.watch(insightsProvider);

    if (!RoleHelper.canAccessHQ(role)) {
      return const Scaffold(
        body: EmptyStateWidget(
          icon: Icons.lock_outline_rounded,
          title: 'Insights unavailable',
          message: 'Your role does not have access to AI insights.',
        ),
      );
    }

    final filters = <String>['all', 'critical', 'warning', 'info'];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Insights'),
        actions: <Widget>[
          TextButton(
            onPressed: state.items.isEmpty
                ? null
                : () => ref.read(insightsProvider.notifier).markAllRead(),
            child: const Text('Mark All Read'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(insightsProvider.notifier).refresh(),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: <Widget>[
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: filters
                  .map(
                    (filter) => ChoiceChip(
                      label: Text(
                        filter == 'all'
                            ? 'All'
                            : filter == 'warning'
                                ? 'Warnings'
                                : '${filter[0].toUpperCase()}${filter.substring(1)}',
                      ),
                      selected: state.filter == filter,
                      onSelected: (_) =>
                          ref.read(insightsProvider.notifier).load(filter: filter),
                    ),
                  )
                  .toList(),
            ),
            const SizedBox(height: 16),
            if (state.isLoading && state.items.isEmpty)
              const Padding(
                padding: EdgeInsets.only(top: 40),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (state.error != null)
              ErrorStateWidget(
                message: state.error!,
                onRetry: () => ref.read(insightsProvider.notifier).refresh(),
              )
            else if (state.items.isEmpty)
              const Padding(
                padding: EdgeInsets.only(top: 48),
                child: EmptyStateWidget(
                  icon: Icons.verified_rounded,
                  title: 'No new insights',
                  message: 'All systems healthy.',
                ),
              )
            else
              ...state.items.map(
                (insight) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: AiInsightCard(
                    insight: insight,
                    onRead: () =>
                        ref.read(insightsProvider.notifier).markRead(insight.id),
                    onActioned: () => ref
                        .read(insightsProvider.notifier)
                        .markActioned(insight.id),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
