import 'package:dio/dio.dart';
import '../../../core/api/endpoints.dart';
import 'models/visitor.dart';
import 'models/visitor_stats.dart';

class VisitorRepository {
  VisitorRepository({required Dio dio}) : _dio = dio;

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

  Future<Visitor> registerVisitor(Map<String, dynamic> data) async {
    final response = await _dio.post<Map<String, dynamic>>(Endpoints.visitors, data: data);
    final payload = _payload(response);
    final visitorMap = payload['visitor'] is Map<String, dynamic>
        ? payload['visitor'] as Map<String, dynamic>
        : payload;
    return Visitor.fromJson(visitorMap);
  }

  Future<Map<String, dynamic>> registerVisitorFromKiosk(Map<String, dynamic> data) async {
    final response = await _dio.post<Map<String, dynamic>>(
      Endpoints.visitorsKioskRegister,
      data: data,
      options: Options(
        extra: <String, dynamic>{
          'skipAuth': true,
          'skipTenant': true,
        },
      ),
    );
    return _payload(response);
  }

  Future<List<Visitor>> getAllVisitors(Map<String, dynamic> params) async {
    final response = await _dio.get<Map<String, dynamic>>(
      Endpoints.visitors,
      queryParameters: params,
    );
    final payload = _payload(response);
    final items = _asList(payload['items']);
    return items.map(Visitor.fromJson).toList();
  }

  Future<Visitor> getVisitorById(String visitorId) async {
    final response = await _dio.get<Map<String, dynamic>>(Endpoints.visitor(visitorId));
    return Visitor.fromJson(_payload(response));
  }

  Future<Visitor> updatePipelineStage(String visitorId, String stage) async {
    final response = await _dio.patch<Map<String, dynamic>>(
      Endpoints.visitorStage(visitorId),
      data: <String, dynamic>{'stage': stage},
    );
    return Visitor.fromJson(_payload(response));
  }

  Future<Visitor> recordReturnVisit(String visitorId, Map<String, dynamic> data) async {
    final response = await _dio.post<Map<String, dynamic>>(
      Endpoints.visitorReturnVisit(visitorId),
      data: data,
    );
    return Visitor.fromJson(_payload(response));
  }

  Future<Map<String, dynamic>> convertToMember(String visitorId, Map<String, dynamic> data) async {
    final response = await _dio.post<Map<String, dynamic>>(
      Endpoints.visitorConvert(visitorId),
      data: data,
    );
    return _payload(response);
  }

  Future<List<Map<String, dynamic>>> getMyFollowUps() async {
    final response = await _dio.get<Map<String, dynamic>>(Endpoints.visitorsFollowUps);
    final payload = _payload(response);
    final dueToday = _asList(payload['today']);
    final upcoming = _asList(payload['upcoming']);
    return <Map<String, dynamic>>[...dueToday, ...upcoming]
      ..sort((a, b) => (a['scheduledDate'] ?? '').toString().compareTo((b['scheduledDate'] ?? '').toString()));
  }

  Future<List<Map<String, dynamic>>> getOverdueFollowUps() async {
    final response = await _dio.get<Map<String, dynamic>>(Endpoints.visitorsFollowUps);
    final payload = _payload(response);
    return _asList(payload['overdue']);
  }

  Future<Visitor> completeFollowUp(
    String visitorId,
    String followUpId,
    Map<String, dynamic> data,
  ) async {
    final response = await _dio.post<Map<String, dynamic>>(
      Endpoints.visitorCompleteFollowUp(visitorId, followUpId),
      data: data,
    );
    return Visitor.fromJson(_payload(response));
  }

  Future<Visitor> createFollowUp(String visitorId, Map<String, dynamic> data) async {
    final response = await _dio.post<Map<String, dynamic>>(
      Endpoints.visitorFollowUps(visitorId),
      data: data,
    );
    return Visitor.fromJson(_payload(response));
  }

  Future<VisitorStats> getVisitorStats() async {
    final now = DateTime.now();
    final monthStart = DateTime(now.year, now.month, 1).toIso8601String();

    final responses = await Future.wait(<Future<Response<Map<String, dynamic>>>>[
      _dio.get<Map<String, dynamic>>(Endpoints.visitorsReports),
      _dio.get<Map<String, dynamic>>(
        Endpoints.visitors,
        queryParameters: <String, dynamic>{
          'limit': 200,
          'fromDate': monthStart,
        },
      ),
      _dio.get<Map<String, dynamic>>(Endpoints.visitorsFollowUps),
    ]);

    final reportsPayload = _payload(responses[0]);
    final monthPayload = _payload(responses[1]);
    final followUpsPayload = _payload(responses[2]);

    return VisitorStats.fromJson(<String, dynamic>{
      'totalVisitors': reportsPayload['totalVisitors'] ?? 0,
      'thisMonth': _asList(monthPayload['items']).length,
      'conversionRate': reportsPayload['conversionRate'] ?? 0,
      'pendingFollowUps': _asList(followUpsPayload['items']).where((item) {
        return (item['status'] ?? '').toString() != 'completed';
      }).length,
    });
  }
}
