import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/widgets/empty_state_widget.dart';
import '../../../shared/widgets/error_state_widget.dart';
import '../../../shared/widgets/shimmer_loading.dart';
import '../../../shared/widgets/snack_helper.dart';
import '../../members/widgets/member_avatar.dart';
import '../data/models/weekly_digest.dart';
import '../providers/hq_provider.dart';
import '../widgets/ai_insight_card.dart';
import '../widgets/weekly_digest_card.dart';

class IntelligenceScreen extends ConsumerWidget {
  const IntelligenceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final memberAsync = ref.watch(memberIntelligenceProvider);
    final financeAsync = ref.watch(financialIntelligenceProvider);
    final growthAsync = ref.watch(growthIntelligenceProvider);
    final operationsAsync = ref.watch(operationalHealthProvider);
    final insightsState = ref.watch(insightsProvider);

    return DefaultTabController(
      length: 4,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Intelligence'),
          bottom: const TabBar(
            isScrollable: true,
            tabs: <Widget>[
              Tab(text: 'Overview'),
              Tab(text: 'Members'),
              Tab(text: 'Finance'),
              Tab(text: 'Growth'),
            ],
          ),
        ),
        body: TabBarView(
          children: <Widget>[
            RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(growthIntelligenceProvider);
                ref.invalidate(operationalHealthProvider);
                await ref.read(insightsProvider.notifier).refresh();
              },
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: <Widget>[
                  growthAsync.when(
                    data: (growth) {
                      final items = (growth['items'] as List<dynamic>? ?? const <dynamic>[])
                          .whereType<Map<String, dynamic>>()
                          .toList();
                      final latest = items.isEmpty ? null : items.last;
                      if (latest == null) {
                        return const EmptyStateWidget(
                          icon: Icons.analytics_outlined,
                          title: 'No digest yet',
                          message: 'Latest digest data will appear here.',
                        );
                      }
                      return WeeklyDigestCard(
                        digest: WeeklyDigest.fromJson(latest),
                        onFullReport: () => context.push('/hq'),
                      );
                    },
                    loading: () => const ShimmerCard(height: 140),
                    error: (error, _) => ErrorStateWidget(
                      message: error.toString(),
                      onRetry: () => ref.invalidate(growthIntelligenceProvider),
                    ),
                  ),
                  const SizedBox(height: 16),
                  operationsAsync.when(
                    data: (operations) => Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: <Widget>[
                        _miniHealthCard(
                          context,
                          'Volunteers',
                          '${operations['volunteers']?['coverageRate'] ?? 0}% coverage',
                        ),
                        _miniHealthCard(
                          context,
                          'Pastoral',
                          '${operations['pastoral']?['criticalUnattended'] ?? 0} critical',
                        ),
                        _miniHealthCard(
                          context,
                          'Communication',
                          '${operations['communication']?['unreadPrayerRequests'] ?? 0} unread prayers',
                        ),
                        _miniHealthCard(
                          context,
                          'Events',
                          '${operations['events']?['upcomingCount'] ?? 0} upcoming',
                        ),
                      ],
                    ),
                    loading: () => const ShimmerCard(height: 110),
                    error: (error, _) => ErrorStateWidget(
                      message: error.toString(),
                      onRetry: () => ref.invalidate(operationalHealthProvider),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text('Recent Insights', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 12),
                  if (insightsState.items.isEmpty)
                    const EmptyStateWidget(
                      icon: Icons.lightbulb_outline_rounded,
                      title: 'No recent insights',
                      message: 'The latest branch and HQ insights will appear here.',
                    )
                  else
                    ...insightsState.items.take(3).map(
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
            memberAsync.when(
              data: (members) => _MembersTab(data: members),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, _) => ErrorStateWidget(
                message: error.toString(),
                onRetry: () => ref.invalidate(memberIntelligenceProvider),
              ),
            ),
            financeAsync.when(
              data: (finance) => _FinanceTab(data: finance),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, _) => ErrorStateWidget(
                message: error.toString(),
                onRetry: () => ref.invalidate(financialIntelligenceProvider),
              ),
            ),
            growthAsync.when(
              data: (growth) => _GrowthTab(data: growth),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, _) => ErrorStateWidget(
                message: error.toString(),
                onRetry: () => ref.invalidate(growthIntelligenceProvider),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _miniHealthCard(BuildContext context, String label, String value) {
    return Container(
      width: 160,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE3E7EF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(label, style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 8),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          ),
        ],
      ),
    );
  }
}

class _MembersTab extends StatelessWidget {
  const _MembersTab({required this.data});

  final Map<String, dynamic> data;

  @override
  Widget build(BuildContext context) {
    final engagement = data['engagementDistribution'] is Map<String, dynamic>
        ? data['engagementDistribution'] as Map<String, dynamic>
        : <String, dynamic>{};
    final riskMembers = (data['atRiskMembers'] as List<dynamic>? ?? const <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .take(5)
        .toList();
    final sections = <PieChartSectionData>[
      PieChartSectionData(value: (engagement['highly_active'] ?? 0).toDouble(), color: Colors.green),
      PieChartSectionData(value: (engagement['engaged'] ?? 0).toDouble(), color: Colors.blue),
      PieChartSectionData(value: (engagement['disengaged'] ?? 0).toDouble(), color: Colors.orange),
      PieChartSectionData(value: (engagement['inactive'] ?? 0).toDouble(), color: Colors.red),
    ];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: <Widget>[
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.red.shade50,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: Colors.red.shade200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text('At-Risk Members', style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 6),
              Text(
                '${data['atRiskCount'] ?? 0}',
                style: Theme.of(context).textTheme.displayLarge?.copyWith(
                      color: Colors.red.shade800,
                    ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        SizedBox(
          height: 220,
          child: PieChart(PieChartData(sections: sections, sectionsSpace: 2)),
        ),
        const SizedBox(height: 16),
        ...riskMembers.map(
          (member) => Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE3E7EF)),
            ),
            child: Row(
              children: <Widget>[
                MemberAvatar(
                  photoUrl: null,
                  firstName: (member['name'] ?? 'M').toString(),
                  lastName: '',
                  radius: 22,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text(
                        (member['name'] ?? '').toString(),
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Health: ${member['healthScore'] ?? 0}',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children:
                            (member['riskFactors'] as List<dynamic>? ?? const <dynamic>[])
                                .map(
                                  (risk) => Chip(
                                    label: Text(risk.toString().replaceAll('_', ' ')),
                                  ),
                                )
                                .toList(),
                      ),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: () => SnackHelper.showInfo(
                    context,
                    'Open a pastoral case for ${member['name'] ?? 'this member'}.',
                  ),
                  child: const Text('Assign to Care'),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _FinanceTab extends StatelessWidget {
  const _FinanceTab({required this.data});

  final Map<String, dynamic> data;

  @override
  Widget build(BuildContext context) {
    final monthly = (data['givingTrends']?['monthly12months'] as List<dynamic>? ??
            const <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .toList();
    final anomalies =
        (data['anomalies'] as List<dynamic>? ?? const <dynamic>[])
            .whereType<Map<String, dynamic>>()
            .toList();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: <Widget>[
        SizedBox(
          height: 240,
          child: BarChart(
            BarChartData(
              alignment: BarChartAlignment.spaceAround,
              barGroups: List.generate(
                monthly.length,
                (index) => BarChartGroupData(
                  x: index,
                  barRods: <BarChartRodData>[
                    BarChartRodData(
                      toY: ((monthly[index]['income'] ?? 0) as num).toDouble(),
                      color: const Color(0xFFC9A84C),
                    ),
                    BarChartRodData(
                      toY: ((monthly[index]['expenses'] ?? 0) as num).toDouble(),
                      color: const Color(0xFF1E2A4A),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFE3E7EF)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text('Forecast', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              Text(
                'Projected: ${(data['forecast']?['nextMonthIncome'] ?? 0).toString()} next month',
                style: Theme.of(context).textTheme.bodyLarge,
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Text('Anomalies', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        if (anomalies.isEmpty)
          const EmptyStateWidget(
            icon: Icons.query_stats_rounded,
            title: 'No anomalies',
            message: 'No major financial spikes or drops detected.',
          )
        else
          ...anomalies.map(
            (item) => ListTile(
              tileColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: const BorderSide(color: Color(0xFFE3E7EF)),
              ),
              title: Text((item['branchName'] ?? '').toString()),
              subtitle: Text((item['message'] ?? '').toString()),
            ),
          ),
      ],
    );
  }
}

class _GrowthTab extends StatelessWidget {
  const _GrowthTab({required this.data});

  final Map<String, dynamic> data;

  @override
  Widget build(BuildContext context) {
    final items =
        (data['items'] as List<dynamic>? ?? const <dynamic>[])
            .whereType<Map<String, dynamic>>()
            .toList();
    final projections = (data['projections'] as List<dynamic>? ?? const <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .toList();

    final spots = <FlSpot>[
      for (var i = 0; i < items.length; i++)
        FlSpot(i.toDouble(), ((items[i]['members']?['total'] ?? 0) as num).toDouble()),
      for (var i = 0; i < projections.length; i++)
        FlSpot(
          (items.length + i).toDouble(),
          ((projections[i]['members'] ?? 0) as num).toDouble(),
        ),
    ];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: <Widget>[
        SizedBox(
          height: 240,
          child: LineChart(
            LineChartData(
              lineBarsData: <LineChartBarData>[
                LineChartBarData(
                  spots: spots,
                  color: const Color(0xFF1E2A4A),
                  isCurved: true,
                  barWidth: 3,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: <Widget>[
            _rateCard(context, 'Members', data['memberGrowthRate']),
            _rateCard(context, 'Attendance', data['attendanceGrowthRate']),
            _rateCard(context, 'Income', data['incomeGrowthRate']),
          ],
        ),
      ],
    );
  }

  Widget _rateCard(BuildContext context, String label, dynamic value) {
    final display = value is num ? value.toStringAsFixed(1) : '${value ?? 0}';
    return Container(
      width: 160,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE3E7EF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(label, style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 8),
          Text(
            '$display%',
            style: Theme.of(context).textTheme.titleLarge,
          ),
        ],
      ),
    );
  }
}
