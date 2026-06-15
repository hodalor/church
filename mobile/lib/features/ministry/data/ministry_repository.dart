import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/endpoints.dart';
import '../../auth/providers/auth_provider.dart';
import 'models/ministry.dart';
import 'models/ministry_meeting.dart';
import 'models/ministry_member.dart';

final ministryRepositoryProvider = Provider<MinistryRepository>((ref) {
  return MinistryRepository(dio: ref.watch(dioProvider));
});

class MinistryRepository {
  MinistryRepository({required Dio dio}) : _dio = dio;

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

  Future<List<Ministry>> getAllMinistries() async {
    final response = await _dio.get<Map<String, dynamic>>(Endpoints.ministry);
    final payload = _payload(response);
    final items = _asList(payload['items']).isNotEmpty ? _asList(payload['items']) : _asList(payload['ministries']);
    return items.map(Ministry.fromJson).toList();
  }

  Future<Ministry> getMinistryById(String id) async {
    final response = await _dio.get<Map<String, dynamic>>(Endpoints.ministryById(id));
    return Ministry.fromJson(_payload(response));
  }

  Future<List<MinistryMember>> getMinistryMembers(String id) async {
    final response = await _dio.get<Map<String, dynamic>>(Endpoints.ministryMembers(id));
    final payload = _payload(response);
    final items = _asList(payload['items']).isNotEmpty ? _asList(payload['items']) : _asList(payload['members']);
    return items.map(MinistryMember.fromJson).toList();
  }

  Future<List<MinistryMeeting>> getMinistryMeetings(String id) async {
    final response = await _dio.get<Map<String, dynamic>>(Endpoints.ministryMeetings(id));
    final payload = _payload(response);
    final items = _asList(payload['items']).isNotEmpty ? _asList(payload['items']) : _asList(payload['meetings']);
    return items.map(MinistryMeeting.fromJson).toList()
      ..sort((left, right) => left.date.compareTo(right.date));
  }

  Future<MinistryMeeting> createMeeting(String ministryId, Map<String, dynamic> data) async {
    final response = await _dio.post<Map<String, dynamic>>(
      Endpoints.ministryMeetings(ministryId),
      data: data,
    );
    return MinistryMeeting.fromJson(_payload(response));
  }

  Future<List<Ministry>> getMemberMinistries(String memberId) async {
    final response = await _dio.get<Map<String, dynamic>>(Endpoints.memberMinistries(memberId));
    final payload = _payload(response);
    final memberships = _asList(payload['items']).isNotEmpty ? _asList(payload['items']) : _asList(payload['memberships']);

    final ministries = await Future.wait<Ministry>(
      memberships.map((membership) async {
        final ministryId = (membership['ministryId'] ?? '').toString();
        final ministry = await getMinistryById(ministryId);
        final meetings = await getMinistryMeetings(ministryId);
        final nextMeeting = meetings.where((item) => item.date.isAfter(DateTime.now())).cast<MinistryMeeting?>().firstWhere((item) => item != null, orElse: () => null);
        return Ministry(
          ministryId: ministry.ministryId,
          name: ministry.name,
          type: ministry.type,
          code: ministry.code,
          leaderId: ministry.leaderId,
          leaderName: ministry.leaderName,
          memberCount: ministry.memberCount,
          meetingSchedule: ministry.meetingSchedule,
          isActive: ministry.isActive,
          logoUrl: ministry.logoUrl,
          description: ministry.description,
          vision: ministry.vision,
          branch: ministry.branch,
          currentFocus: ministry.currentFocus,
          annualGoals: ministry.annualGoals,
          memberRole: membership['role']?.toString(),
          joinedAt: membership['joinedAt'] != null ? DateTime.tryParse(membership['joinedAt'].toString()) : null,
          nextMeetingAt: nextMeeting?.date,
        );
      }),
    );

    return ministries;
  }
}
