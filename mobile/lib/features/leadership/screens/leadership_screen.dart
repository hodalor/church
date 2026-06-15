import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/utils/app_colors.dart';
import '../../../members/widgets/member_bottom_navigation.dart';
import '../data/leadership_repository.dart';
import '../data/models/leadership_profile.dart';

class LeadershipScreen extends ConsumerWidget {
  const LeadershipScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(title: const Text('Leadership Pipeline')),
      bottomNavigationBar: const MemberBottomNavigation(currentIndex: 0),
      body: FutureBuilder<_LeadershipBundle>(
        future: _load(ref),
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError || !snapshot.hasData) {
            return Center(child: Text(snapshot.error.toString()));
          }

          final bundle = snapshot.data!;
          final hasGaps = bundle.stats.gaps > 0;

          return RefreshIndicator(
            onRefresh: () => _load(ref),
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: <Widget>[
                Row(
                  children: <Widget>[
                    Expanded(child: _StatCard(label: 'Total Leaders', value: '${bundle.stats.totalLeaders}')),
                    const SizedBox(width: 8),
                    Expanded(child: _StatCard(label: 'Ready', value: '${bundle.stats.ready}')),
                    const SizedBox(width: 8),
                    Expanded(child: _StatCard(label: 'In Development', value: '${bundle.stats.inDevelopment}')),
                    const SizedBox(width: 8),
                    Expanded(child: _StatCard(label: 'Gaps', value: '${bundle.stats.gaps}')),
                  ],
                ),
                const SizedBox(height: 16),
                if (hasGaps)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.danger.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.danger),
                    ),
                    child: Text(
                      '${bundle.stats.gaps} key roles have no successor identified',
                      style: const TextStyle(
                        color: AppColors.danger,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                const SizedBox(height: 16),
                Text('Pipeline', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 12),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: bundle.pipeline.entries.map((entry) {
                      return _StageColumn(
                        label: _label(entry.key),
                        profiles: entry.value,
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<_LeadershipBundle> _load(WidgetRef ref) async {
    final results = await Future.wait<dynamic>(<Future<dynamic>>[
      ref.read(leadershipRepositoryProvider).getDevelopmentPipeline(),
      ref.read(leadershipRepositoryProvider).getLeadershipStats(),
    ]);
    return _LeadershipBundle(
      pipeline: results[0] as Map<String, List<LeadershipProfile>>,
      stats: results[1] as LeadershipStats,
    );
  }

  String _label(String value) {
    return switch (value) {
      'in_development' => 'In Development',
      _ => value
          .replaceAll('_', ' ')
          .split(' ')
          .map((word) => word.isEmpty ? word : '${word[0].toUpperCase()}${word.substring(1)}')
          .join(' '),
    };
  }
}

class _LeadershipBundle {
  const _LeadershipBundle({
    required this.pipeline,
    required this.stats,
  });

  final Map<String, List<LeadershipProfile>> pipeline;
  final LeadershipStats stats;
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

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
        children: <Widget>[
          Text(value, style: const TextStyle(fontWeight: FontWeight.w800)),
          const SizedBox(height: 6),
          Text(label, textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}

class _StageColumn extends StatelessWidget {
  const _StageColumn({
    required this.label,
    required this.profiles,
  });

  final String label;
  final List<LeadershipProfile> profiles;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 240,
      margin: const EdgeInsets.only(right: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.inputBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Expanded(child: Text(label, style: Theme.of(context).textTheme.titleMedium)),
              CircleAvatar(
                radius: 12,
                backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                child: Text('${profiles.length}', style: const TextStyle(fontSize: 12, color: AppColors.primary)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...profiles.map((profile) => _LeaderCard(profile: profile)),
        ],
      ),
    );
  }
}

class _LeaderCard extends StatelessWidget {
  const _LeaderCard({required this.profile});

  final LeadershipProfile profile;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        children: <Widget>[
          CircleAvatar(
            backgroundColor: profile.readinessColor.withValues(alpha: 0.12),
            child: Text(
              profile.memberName.isNotEmpty ? profile.memberName.characters.first.toUpperCase() : '?',
              style: TextStyle(color: profile.readinessColor, fontWeight: FontWeight.w800),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(profile.memberName, style: const TextStyle(fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text(profile.targetRole ?? profile.currentRole ?? 'Role pending', style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: 4),
                Text(profile.tier ?? 'Tier 4', style: const TextStyle(color: AppColors.mutedText)),
              ],
            ),
          ),
          SizedBox(
            width: 36,
            height: 36,
            child: Stack(
              fit: StackFit.expand,
              children: <Widget>[
                CircularProgressIndicator(
                  value: (profile.readinessScore.clamp(0, 100)) / 100,
                  backgroundColor: Colors.grey.shade200,
                  color: profile.readinessColor,
                  strokeWidth: 4,
                ),
                Center(
                  child: Text(
                    profile.readinessScore.toStringAsFixed(0),
                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
