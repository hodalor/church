import 'package:dio/dio.dart';
import '../../../core/api/endpoints.dart';
import 'models/inbox_message.dart';
import 'models/poll.dart';
import 'models/prayer_request.dart';

class CommunicationRepository {
  CommunicationRepository({
    required Dio dio,
  }) : _dio = dio;

  final Dio _dio;

  Future<List<InboxMessage>> getInbox({
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _dio.get<Map<String, dynamic>>(
      Endpoints.communicationInbox,
      queryParameters: <String, dynamic>{
        'page': page,
        'limit': limit,
      },
    );

    final payload = response.data?['data'] is Map<String, dynamic>
        ? response.data!['data'] as Map<String, dynamic>
        : (response.data ?? <String, dynamic>{});
    final items = (payload['items'] as List<dynamic>? ?? <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .map(InboxMessage.fromJson)
        .toList();

    return items;
  }

  Future<InboxMessage> getMessageById(String messageId) async {
    final response = await _dio.get<Map<String, dynamic>>(
      Endpoints.inboxMessage(messageId),
    );
    final payload = response.data?['data'] is Map<String, dynamic>
        ? response.data!['data'] as Map<String, dynamic>
        : (response.data ?? <String, dynamic>{});
    return InboxMessage.fromJson(payload);
  }

  Future<void> markAsRead(String messageId) async {
    await _dio.patch<void>(
      '${Endpoints.notifications}/$messageId/read',
    );
  }

  Future<void> markAllAsRead() async {
    await _dio.patch<void>('${Endpoints.notifications}/read-all');
  }

  Future<int> getUnreadCount() async {
    final response = await _dio.get<Map<String, dynamic>>(
      Endpoints.communicationInbox,
      queryParameters: const <String, dynamic>{
        'page': 1,
        'limit': 1,
      },
    );

    final payload = response.data?['data'] is Map<String, dynamic>
        ? response.data!['data'] as Map<String, dynamic>
        : (response.data ?? <String, dynamic>{});

    return int.tryParse((payload['unreadCount'] ?? 0).toString()) ?? 0;
  }

  Future<void> submitPrayerRequest(Map<String, dynamic> data) async {
    await _dio.post<void>(
      Endpoints.communicationPrayerRequests,
      data: data,
    );
  }

  Future<List<PrayerRequest>> getPrayerRequests(
    Map<String, dynamic> params,
  ) async {
    final response = await _dio.get<Map<String, dynamic>>(
      Endpoints.communicationPrayerRequests,
      queryParameters: params,
    );

    final payload = response.data?['data'] is Map<String, dynamic>
        ? response.data!['data'] as Map<String, dynamic>
        : (response.data ?? <String, dynamic>{});
    final items = (payload['items'] as List<dynamic>? ?? <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .map(PrayerRequest.fromJson)
        .toList();

    return items;
  }

  Future<void> incrementPrayerCount(String requestId) async {
    await _dio.post<void>(Endpoints.prayForRequest(requestId));
  }

  Future<void> updatePrayerRequestStatus(
    String requestId,
    String status, {
    String? testimonial,
    String? assignedToUserId,
  }) async {
    await _dio.patch<void>(
      Endpoints.prayerRequest(requestId),
      data: <String, dynamic>{
        'status': status,
        if (assignedToUserId != null && assignedToUserId.trim().isNotEmpty)
          'assignedToUserId': assignedToUserId.trim(),
        if (testimonial != null && testimonial.trim().isNotEmpty)
          'testimonial': testimonial.trim(),
      },
    );
  }

  Future<List<Poll>> getActivePolls() async {
    final response = await _dio.get<Map<String, dynamic>>(
      Endpoints.communicationPolls,
    );
    final payload = response.data?['data'] is Map<String, dynamic>
        ? response.data!['data'] as Map<String, dynamic>
        : (response.data ?? <String, dynamic>{});
    final active = (payload['active'] as List<dynamic>? ?? <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .map(Poll.fromJson)
        .toList();
    return active;
  }

  Future<List<Poll>> getClosedPolls() async {
    final response = await _dio.get<Map<String, dynamic>>(
      Endpoints.communicationPolls,
    );
    final payload = response.data?['data'] is Map<String, dynamic>
        ? response.data!['data'] as Map<String, dynamic>
        : (response.data ?? <String, dynamic>{});
    final closed = (payload['closed'] as List<dynamic>? ?? <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .map(Poll.fromJson)
        .toList();
    return closed;
  }

  Future<void> castVote(String pollId, String optionId) async {
    await _dio.post<void>(
      Endpoints.pollVote(pollId),
      data: <String, dynamic>{
        'optionId': optionId,
      },
    );
  }
}
