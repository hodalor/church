import 'package:dio/dio.dart';
import '../../../core/api/endpoints.dart';
import 'models/ai_insight.dart';
import 'models/branch_comparison.dart';
import 'models/hq_overview.dart';

class AnalyticsRepository {
  AnalyticsRepository({required Dio dio}) : _dio = dio;

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

  Future<HQOverview> getHQOverview() async {
    final response = await _dio.get<Map<String, dynamic>>(Endpoints.hqOverview);
    return HQOverview.fromJson(_payload(response));
  }

  Future<BranchComparison> getBranchComparison() async {
    final response =
        await _dio.get<Map<String, dynamic>>(Endpoints.hqBranchComparison);
    return BranchComparison.fromJson(_payload(response));
  }

  Future<List<AiInsight>> getAllInsights({Map<String, dynamic>? params}) async {
    final response = await _dio.get<Map<String, dynamic>>(
      Endpoints.analyticsInsights,
      queryParameters: params,
    );
    final payload = _payload(response);
    return (payload['items'] as List<dynamic>? ?? const <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .map(AiInsight.fromJson)
        .toList();
  }

  Future<List<AiInsight>> getCriticalInsights() async {
    final response = await _dio.get<Map<String, dynamic>>(
      Endpoints.analyticsCriticalInsights,
    );
    final payload = _payload(response);
    return (payload['items'] as List<dynamic>? ?? const <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .map(AiInsight.fromJson)
        .toList();
  }

  Future<void> markInsightRead(String id) async {
    await _dio.patch<void>(Endpoints.analyticsInsightRead(id));
  }

  Future<void> markInsightActioned(String id) async {
    await _dio.patch<void>(Endpoints.analyticsInsightActioned(id));
  }

  Future<Map<String, dynamic>> getMemberIntelligence() async {
    final response = await _dio.get<Map<String, dynamic>>(
      Endpoints.hqMemberIntelligence,
    );
    return _payload(response);
  }

  Future<Map<String, dynamic>> getFinancialIntelligence() async {
    final response = await _dio.get<Map<String, dynamic>>(
      Endpoints.hqFinancialIntelligence,
    );
    return _payload(response);
  }

  Future<Map<String, dynamic>> getGrowthTrends() async {
    final response =
        await _dio.get<Map<String, dynamic>>(Endpoints.hqGrowthTrends);
    return _payload(response);
  }

  Future<Map<String, dynamic>> getOperationalHealth() async {
    final response = await _dio.get<Map<String, dynamic>>(
      Endpoints.hqOperationalHealth,
    );
    return _payload(response);
  }
}
