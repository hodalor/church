import 'scorecard_pillar.dart';

class BalancedScorecard {
  const BalancedScorecard({
    required this.overallScore,
    required this.overallStatus,
    this.pillars = const <ScorecardPillar>[],
    this.summary = const <String, int>{},
  });

  final double overallScore;
  final String overallStatus;
  final List<ScorecardPillar> pillars;
  final Map<String, int> summary;

  factory BalancedScorecard.fromJson(Map<String, dynamic> json) {
    return BalancedScorecard(
      overallScore: json['overallScore'] is num ? (json['overallScore'] as num).toDouble() : double.tryParse(json['overallScore']?.toString() ?? '') ?? 0,
      overallStatus: (json['overallStatus'] ?? 'on_track').toString(),
      pillars: (json['pillars'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<Map<String, dynamic>>()
          .map(ScorecardPillar.fromJson)
          .toList(),
      summary: (json['summary'] as Map<String, dynamic>? ?? const <String, dynamic>{}).map(
        (key, value) => MapEntry(key, value is num ? value.toInt() : int.tryParse(value.toString()) ?? 0),
      ),
    );
  }
}
