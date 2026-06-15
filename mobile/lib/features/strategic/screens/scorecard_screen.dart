import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/utils/app_colors.dart';
import '../../../../shared/widgets/empty_state_widget.dart';
import '../../../members/widgets/member_bottom_navigation.dart';
import '../data/models/balanced_scorecard.dart';
import '../data/models/kpi_item.dart';
import '../data/strategic_repository.dart';
import '../widgets/kpi_progress_bar.dart';
import '../widgets/score_gauge_painter.dart';

class ScorecardScreen extends ConsumerStatefulWidget {
  const ScorecardScreen({super.key});

  @override
  ConsumerState<ScorecardScreen> createState() => _ScorecardScreenState();
}

class _ScorecardScreenState extends ConsumerState<ScorecardScreen>
    with SingleTickerProviderStateMixin {
  late Future<BalancedScorecard> _future;
  late AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    _future = ref.read(strategicRepositoryProvider).getBalancedScorecard();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Strategic Scorecard'),
        actions: <Widget>[
          IconButton(
            onPressed: () async {
              await ref.read(strategicRepositoryProvider).refreshKPIs();
              setState(() {
                _future = ref.read(strategicRepositoryProvider).getBalancedScorecard();
              });
            },
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      bottomNavigationBar: const MemberBottomNavigation(currentIndex: 0),
      body: FutureBuilder<BalancedScorecard>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError || !snapshot.hasData) {
            return Center(child: Text(snapshot.error.toString()));
          }

          final scorecard = snapshot.data!;
          return RefreshIndicator(
            onRefresh: () async {
              await ref.read(strategicRepositoryProvider).refreshKPIs();
              setState(() {
                _future = ref.read(strategicRepositoryProvider).getBalancedScorecard();
              });
            },
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: <Widget>[
                _ScoreHeader(
                  scorecard: scorecard,
                  animation: _animationController,
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: <Widget>[
                    _SummaryChip(label: 'On Track', value: scorecard.summary['onTrack'] ?? 0, color: AppColors.success),
                    _SummaryChip(label: 'At Risk', value: scorecard.summary['atRisk'] ?? 0, color: AppColors.accent),
                    _SummaryChip(label: 'Off Track', value: scorecard.summary['offTrack'] ?? 0, color: AppColors.danger),
                    _SummaryChip(label: 'Exceeded', value: scorecard.summary['exceeded'] ?? 0, color: const Color(0xFFD4AF37)),
                  ],
                ),
                const SizedBox(height: 16),
                if (scorecard.pillars.isEmpty)
                  const EmptyStateWidget(
                    icon: Icons.track_changes_rounded,
                    title: 'No scorecard pillars yet',
                    message: 'Strategic pillars and KPIs will appear here once configured.',
                  )
                else
                  ...scorecard.pillars.map(
                    (pillar) => Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(22),
                        border: Border(
                          left: BorderSide(color: pillar.color, width: 5),
                          top: const BorderSide(color: AppColors.inputBorder),
                          right: const BorderSide(color: AppColors.inputBorder),
                          bottom: const BorderSide(color: AppColors.inputBorder),
                        ),
                      ),
                      child: ExpansionTile(
                        title: Text(pillar.pillarName),
                        subtitle: Text('${pillar.score.toStringAsFixed(0)}% • ${_statusLabel(pillar.status)}'),
                        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                        children: pillar.kpis
                            .map((kpi) => _KpiTile(kpi: kpi))
                            .toList(),
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'off_track':
        return 'Needs Attention';
      case 'at_risk':
        return 'At Risk';
      default:
        return 'On Track';
    }
  }
}

class _ScoreHeader extends StatelessWidget {
  const _ScoreHeader({
    required this.scorecard,
    required this.animation,
  });

  final BalancedScorecard scorecard;
  final Animation<double> animation;

  @override
  Widget build(BuildContext context) {
    final color = scorecard.overallScore >= 75
        ? AppColors.success
        : scorecard.overallScore >= 50
            ? AppColors.accent
            : AppColors.danger;
    final label = scorecard.overallScore >= 75
        ? 'On Track'
        : scorecard.overallScore >= 50
            ? 'At Risk'
            : 'Needs Attention';

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.inputBorder),
      ),
      child: Column(
        children: <Widget>[
          SizedBox(
            width: 220,
            height: 220,
            child: AnimatedBuilder(
              animation: animation,
              builder: (context, _) {
                return CustomPaint(
                  painter: ScoreGaugePainter(
                    score: scorecard.overallScore * animation.value,
                    color: color,
                  ),
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: <Widget>[
                        Text(
                          '${(scorecard.overallScore * animation.value).toStringAsFixed(0)}%',
                          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                fontWeight: FontWeight.w800,
                              ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          label,
                          style: TextStyle(color: color, fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryChip extends StatelessWidget {
  const _SummaryChip({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final int value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        '$label: $value',
        style: TextStyle(color: color, fontWeight: FontWeight.w700),
      ),
    );
  }
}

class _KpiTile extends StatelessWidget {
  const _KpiTile({required this.kpi});

  final KPIItem kpi;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Expanded(
                child: Text(
                  kpi.name,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: kpi.statusColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  kpi.statusLabel,
                  style: TextStyle(
                    color: kpi.statusColor,
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          KPIProgressBar(kpi: kpi),
          const SizedBox(height: 6),
          Text('${kpi.currentValue.toStringAsFixed(0)} / ${kpi.annualTarget.toStringAsFixed(0)} target • ${kpi.progress.toStringAsFixed(0)}%'),
        ],
      ),
    );
  }
}
