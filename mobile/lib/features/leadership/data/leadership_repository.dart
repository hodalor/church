import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/endpoints.dart';
import '../../auth/providers/auth_provider.dart';
import 'models/leadership_profile.dart';

final leadershipRepositoryProvider = Provider<LeadershipRepository>((ref) {
  return LeadershipRepository(dio: ref.watch(dioProvider));
});

class LeadershipRepository {
  LeadershipRepository({required Dio dio}) : _dio = dio;

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

  Future<Map<String, List<LeadershipProfile>>> getDevelopmentPipeline() async {
    final response = await _dio.get<Map<String, dynamic>>('${
      Endpoints.leadership
    }/candidates');
    final payload = _payload(response);
    final items = _asList(payload['candidates']).isNotEmpty ? _asList(payload['candidates']) : _asList(payload['items']);
    final profiles = items.map(LeadershipProfile.fromJson).toList();

    final pipeline = <String, List<LeadershipProfile>>{
      'identified': <LeadershipProfile>[],
      'in_development': <LeadershipProfile>[],
      'ready': <LeadershipProfile>[],
      'appointed': <LeadershipProfile>[],
      'paused': <LeadershipProfile>[],
    };

    for (final profile in profiles) {
      final status = switch (profile.developmentStatus) {
        'in_training' => 'in_development',
        'ready_now' => 'ready',
        'ready_soon' => 'appointed',
        'not_ready' => 'paused',
        _ => 'identified',
      };
      pipeline.putIfAbsent(status, () => <LeadershipProfile>[]).add(profile);
    }

    return pipeline;
  }

  Future<LeadershipStats> getLeadershipStats() async {
    final response = await _dio.get<Map<String, dynamic>>('${
      Endpoints.leadership
    }/stats');
    final payload = _payload(response);
    final candidateStats = payload['candidates'] as Map<String, dynamic>? ?? const <String, dynamic>{};
    final successionPlans = payload['successionPlans'] as Map<String, dynamic>? ?? const <String, dynamic>{};
    return LeadershipStats(
      totalLeaders: (candidateStats['total'] ?? 0) as int? ?? 0,
      ready: (candidateStats['readyNow'] ?? 0) as int? ?? 0,
      inDevelopment: (candidateStats['inTraining'] ?? 0) as int? ?? 0,
      gaps: (successionPlans['highRisk'] ?? 0) as int? ?? 0,
    );
  }
}
