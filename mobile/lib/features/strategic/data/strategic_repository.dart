import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/endpoints.dart';
import '../../auth/providers/auth_provider.dart';
import 'models/balanced_scorecard.dart';
import 'models/kpi_item.dart';
import 'models/scorecard_pillar.dart';

final strategicRepositoryProvider = Provider<StrategicRepository>((ref) {
  return StrategicRepository(dio: ref.watch(dioProvider));
});

class StrategicRepository {
  StrategicRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  Map<String, dynamic> _payload(Response<Map<String, dynamic>> response) {
    final data = response.data;
    if (data == null) {
      return <String, dynamic>{};
    }
    final nested = data['data'];
    if (nested is Map<String, dynamic>) {
      return nested;
    }
    return data;
  }

  List<Map<String, dynamic>> _asList(dynamic value) {
    if (value is List<dynamic>) {
      return value.whereType<Map<String, dynamic>>().toList();
    }
    return const <Map<String, dynamic>>[];
  }

  Future<BalancedScorecard> getBalancedScorecard() async {
    final responses = await Future.wait<Response<Map<String, dynamic>>>(<Future<Response<Map<String, dynamic>>>>[
      _dio.get<Map<String, dynamic>>('${
        Endpoints.strategic
      }/scorecard'),
      _dio.get<Map<String, dynamic>>('${
        Endpoints.strategic
      }/kpis'),
    ]);

    final scorecardPayload = _payload(responses[0]);
    final kpiPayload = _payload(responses[1]);
    final kpis = _asList(kpiPayload['items']).isNotEmpty ? _asList(kpiPayload['items']) : _asList(kpiPayload['kpis']);

    final grouped = <String, List<Map<String, dynamic>>>{};
    for (final kpi in kpis) {
      final key = (kpi['category'] ?? 'General').toString();
      grouped.putIfAbsent(key, () => <Map<String, dynamic>>[]).add(kpi);
    }

    final pillarPalette = <Color>[
      const Color(0xFFC9A84C),
      const Color(0xFF1E2A4A),
      const Color(0xFF0F766E),
      const Color(0xFF7C3AED),
      const Color(0xFFBE123C),
    ];

    final pillars = grouped.entries.toList().asMap().entries.map((entry) {
      final index = entry.key;
      final item = entry.value;
      final mappedKpis = item.value.map((kpi) {
        final current = (kpi['currentValue'] as num?)?.toDouble() ?? double.tryParse(kpi['currentValue']?.toString() ?? '') ?? 0;
        final target = (kpi['targetValue'] as num?)?.toDouble() ?? double.tryParse(kpi['targetValue']?.toString() ?? '') ?? 0;
        final progress = target == 0 ? 0 : (current / target) * 100;
        final status = progress > 100 ? 'exceeded' : (kpi['status'] ?? 'on_track').toString();
        return KPIItem(
          name: (kpi['title'] ?? '').toString(),
          currentValue: current,
          annualTarget: target,
          status: status,
          unit: kpi['unit']?.toString(),
          progress: progress.clamp(0, 120).toDouble(),
        );
      }).toList();

      final score = mappedKpis.isEmpty
          ? 0
          : mappedKpis.map((kpi) => kpi.progress.clamp(0, 100)).reduce((left, right) => left + right) / mappedKpis.length;
      final status = score >= 75 ? 'on_track' : score >= 50 ? 'at_risk' : 'off_track';

      return ScorecardPillar(
        pillarName: item.key,
        color: pillarPalette[index % pillarPalette.length],
        score: score.toDouble(),
        status: status,
        kpis: mappedKpis,
      );
    }).toList();

    final overallScore = pillars.isEmpty
        ? 0
        : pillars.map((pillar) => pillar.score).reduce((left, right) => left + right) / pillars.length;

    return BalancedScorecard(
      overallScore: overallScore,
      overallStatus: overallScore >= 75 ? 'on_track' : overallScore >= 50 ? 'at_risk' : 'needs_attention',
      pillars: pillars,
      summary: <String, int>{
        'onTrack': (scorecardPayload['kpiStatusBreakdown']?['onTrack'] ?? 0) as int? ?? 0,
        'atRisk': (scorecardPayload['kpiStatusBreakdown']?['atRisk'] ?? 0) as int? ?? 0,
        'offTrack': (scorecardPayload['kpiStatusBreakdown']?['offTrack'] ?? 0) as int? ?? 0,
        'exceeded': pillars.expand((pillar) => pillar.kpis).where((item) => item.status == 'exceeded').length,
      },
    );
  }

  Future<void> refreshKPIs() async {
    await _dio.get<Map<String, dynamic>>('${
      Endpoints.strategic
    }/reports/overview');
  }
}
