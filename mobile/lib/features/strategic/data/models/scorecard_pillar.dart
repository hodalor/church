import 'dart:ui';

import 'kpi_item.dart';

class ScorecardPillar {
  const ScorecardPillar({
    required this.pillarName,
    required this.color,
    required this.score,
    required this.status,
    this.kpis = const <KPIItem>[],
  });

  final String pillarName;
  final Color color;
  final double score;
  final String status;
  final List<KPIItem> kpis;

  factory ScorecardPillar.fromJson(Map<String, dynamic> json) {
    return ScorecardPillar(
      pillarName: (json['pillarName'] ?? '').toString(),
      color: Color(int.tryParse((json['color'] ?? '0xFF1E2A4A').toString().replaceFirst('#', '0xFF')) ?? 0xFF1E2A4A),
      score: json['score'] is num ? (json['score'] as num).toDouble() : double.tryParse(json['score']?.toString() ?? '') ?? 0,
      status: (json['status'] ?? 'on_track').toString(),
      kpis: (json['kpis'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<Map<String, dynamic>>()
          .map(KPIItem.fromJson)
          .toList(),
    );
  }
}
