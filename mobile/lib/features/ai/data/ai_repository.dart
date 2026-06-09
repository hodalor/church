import 'package:dio/dio.dart';
import '../../../core/api/endpoints.dart';

class AiRepository {
  AiRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  Future<String> generateDevotional(Map<String, dynamic> data) =>
      _postText(Endpoints.aiDevotional, data);

  Future<String> generatePrayerPoints(Map<String, dynamic> data) =>
      _postText(Endpoints.aiPrayerPoints, data);

  Future<String> generateSermonDraft(Map<String, dynamic> data) =>
      _postText(Endpoints.aiSermonDraft, data);

  Future<String> generateAnnouncement(Map<String, dynamic> data) =>
      _postText(Endpoints.aiAnnouncement, data);

  Future<String> _postText(String endpoint, Map<String, dynamic> data) async {
    final response = await _dio.post<Map<String, dynamic>>(endpoint, data: data);
    final payload = response.data?['data'] is Map<String, dynamic>
        ? response.data!['data'] as Map<String, dynamic>
        : (response.data ?? <String, dynamic>{});

    return (payload['text'] ?? payload['response'] ?? '').toString();
  }
}
