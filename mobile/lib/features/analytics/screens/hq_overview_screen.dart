import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/utils/role_helper.dart';
import '../../../shared/widgets/empty_state_widget.dart';
import '../../../shared/widgets/error_state_widget.dart';
import '../../../shared/widgets/shimmer_loading.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/hq_provider.dart';
import '../widgets/branch_performance_card.dart';
import '../widgets/kpi_stat_card.dart';

class HQOverviewScreen extends ConsumerStatefulWidget {
  const HQOverviewScreen({super.key});

  @override
  ConsumerState<HQOverviewScreen> createState() => _HQOverviewScreenState();
}

class _HQOverviewScreenState extends ConsumerState<HQOverviewScreen> {
  bool _alertsExpanded = true;

  @override
  Widget build(BuildContext context) {
    final role = ref.watch(authProvider).user?.role ?? '';
    final overviewAsync = ref.watch(hqOverviewProvider);
    final branchAsync = ref.watch(branchComparisonProvider);
    final insightsState = ref.watch(insightsProvider);

    if (!RoleHelper.canAccessHQ(role)) {
      return const Scaffold(
        body: EmptyStateWidget(
          icon: Icons.lock_outline_rounded,
          title: 'HQ unavailable',
          message: 'Your role does not have access to the HQ overview.',
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('HQ Overview'),
        actions: <Widget>[
          IconButton(
            onPressed: () => context.push('/insights'),
            icon: Badge(
              isLabelVisible: insightsState.unreadCount > 0,
              label: Text('${insightsState.unreadCount}'),
              child: const Icon(Icons.notifications_none_rounded),
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(hqOverviewProvider);
          ref.invalidate(branchComparisonProvider);
          await ref.read(insightsProvider.notifier).refresh();
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: <Widget>[
            overviewAsync.when(
              data: (overview) => Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  if (overview.alerts.isNotEmpty)
                    Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.red.shade50,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: Colors.red.shade200),
                      ),
                      child: Column(
                        children: <Widget>[
                          InkWell(
                            onTap: () => setState(() {
                              _alertsExpanded = !_alertsExpanded;
                            }),
                            child: Row(
                              children: <Widget>[
                                Expanded(
                                  child: Text(
                                    '${overview.alerts.length} critical alerts',
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleMedium
                                        ?.copyWith(color: Colors.red.shade800),
                                  ),
                                ),
                                Icon(
                                  _alertsExpanded
                                      ? Icons.expand_less_rounded
                                      : Icons.expand_more_rounded,
                                ),
                              ],
                            ),
                          ),
                          if (_alertsExpanded) ...<Widget>[
                            const SizedBox(height: 12),
                            ...overview.alerts.map(
                              (alert) => Padding(
                                padding: const EdgeInsets.only(bottom: 10),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: <Widget>[
                                    const Icon(Icons.warning_amber_rounded,
                                        color: Colors.red),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: <Widget>[
                                          Text(
                                            alert.title,
                                            style: Theme.of(context)
                                                .textTheme
                                                .bodyLarge
                                                ?.copyWith(
                                                  fontWeight: FontWeight.w700,
                                                ),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            alert.message,
                                            style:
                                                Theme.of(context).textTheme.bodyMedium,
                                          ),
                                        ],
                                      ),
                                    ),
                                    TextButton(
                                      onPressed: () => context.push('/insights'),
                                      child: const Text('Action'),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  SizedBox(
                    height: 154,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      children: <Widget>[
                        KpiStatCard(
                          label: 'Members',
                          value: '${overview.summary.totalMembers}',
                          percentChange:
                              overview.vsLastMonth['membersGrowth']?.percent,
                          trend: overview.vsLastMonth['membersGrowth']?.trend ??
                              'stable',
                        ),
                        const SizedBox(width: 12),
                        KpiStatCard(
                          label: 'Attendance',
                          value: '${overview.thisMonth.attendance}',
                          percentChange:
                              overview.vsLastMonth['attendanceGrowth']?.percent,
                          trend: overview.vsLastMonth['attendanceGrowth']?.trend ??
                              'stable',
                        ),
                        const SizedBox(width: 12),
                        KpiStatCard(
                          label: 'Income',
                          value: overview.thisMonth.income.toStringAsFixed(0),
                          percentChange:
                              overview.vsLastMonth['incomeGrowth']?.percent,
                          trend:
                              overview.vsLastMonth['incomeGrowth']?.trend ?? 'stable',
                        ),
                        const SizedBox(width: 12),
                        KpiStatCard(
                          label: 'Visitors',
                          value: '${overview.thisMonth.newVisitors}',
                          percentChange:
                              overview.vsLastMonth['visitorGrowth']?.percent,
                          trend:
                              overview.vsLastMonth['visitorGrowth']?.trend ?? 'stable',
                        ),
                        const SizedBox(width: 12),
                        KpiStatCard(
                          label: 'Open Cases',
                          value: '${overview.summary.openCasesCount}',
                        ),
                        const SizedBox(width: 12),
                        KpiStatCard(
                          label: 'Upcoming Events',
                          value: '${overview.summary.upcomingEvents}',
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: <Widget>[
                      Text(
                        'Branch Performance',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const Spacer(),
                      TextButton(
                        onPressed: () => context.push('/intelligence'),
                        child: const Text('Full Intelligence'),
                      ),
                    ],
                  ),
                ],
              ),
              loading: () => const ShimmerCard(height: 220),
              error: (error, _) => ErrorStateWidget(
                message: error.toString(),
                onRetry: () => ref.invalidate(hqOverviewProvider),
              ),
            ),
            const SizedBox(height: 12),
            branchAsync.when(
              data: (comparison) => Column(
                children: comparison.items
                    .map(
                      (branch) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: BranchPerformanceCard(branch: branch),
                      ),
                    )
                    .toList(),
              ),
              loading: () => Column(
                children: const <Widget>[
                  ShimmerCard(height: 110),
                  SizedBox(height: 12),
                  ShimmerCard(height: 110),
                ],
              ),
              error: (error, _) => ErrorStateWidget(
                message: error.toString(),
                onRetry: () => ref.invalidate(branchComparisonProvider),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: const SizedBox.shrink(),
    );
  }
}
