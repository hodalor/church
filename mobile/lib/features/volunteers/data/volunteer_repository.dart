import 'package:dio/dio.dart';
import '../../../core/api/endpoints.dart';
import '../../../core/storage/secure_storage.dart';
import 'models/roster.dart';
import 'models/volunteer.dart';

class VolunteerRepository {
  VolunteerRepository({
    required Dio dio,
    required SecureStorageService storage,
  })  : _dio = dio,
        _storage = storage;

  final Dio _dio;
  final SecureStorageService _storage;

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

  Future<String?> _resolveMemberId() async {
    final user = await _storage.getUserProfile();
    return user?.memberId;
  }

  Future<Volunteer?> getMyVolunteerProfile() async {
    final memberId = await _resolveMemberId();
    if (memberId == null || memberId.isEmpty) {
      return null;
    }

    try {
      final response = await _dio.get<Map<String, dynamic>>(Endpoints.volunteerByMember(memberId));
      return Volunteer.fromJson(_payload(response));
    } on DioException catch (error) {
      if (error.response?.statusCode == 404) {
        return null;
      }
      rethrow;
    }
  }

  Future<List<Roster>> getUpcomingRosters() async {
    final response = await _dio.get<Map<String, dynamic>>(
      '${Endpoints.rosters}/upcoming',
      queryParameters: const <String, dynamic>{'limit': 30},
    );
    final payload = _payload(response);
    final items = _asList(payload['items']);
    return items.map(Roster.fromJson).toList();
  }

  Future<Roster> getRosterById(String rosterId) async {
    final response = await _dio.get<Map<String, dynamic>>(Endpoints.roster(rosterId));
    return Roster.fromJson(_payload(response));
  }

  Future<void> updateAssignmentStatus(
    String rosterId,
    String assignmentId,
    String status, {
    String? declinedReason,
  }) async {
    await _dio.patch<Map<String, dynamic>>(
      Endpoints.rosterAssignment(rosterId, assignmentId),
      data: <String, dynamic>{
        'status': status,
        if (declinedReason != null && declinedReason.isNotEmpty)
          'declinedReason': declinedReason,
      },
    );
  }

  Future<List<Roster>> getAllRosters(Map<String, dynamic> params) async {
    final response = await _dio.get<Map<String, dynamic>>(
      Endpoints.rosters,
      queryParameters: params,
    );
    final payload = _payload(response);
    final items = _asList(payload['items']);
    return items.map(Roster.fromJson).toList();
  }

  Future<Map<String, dynamic>> markAttendance(
    String rosterId,
    String assignmentId,
    String status,
  ) async {
    final response = await _dio.patch<Map<String, dynamic>>(
      Endpoints.rosterAttendance(rosterId, assignmentId),
      data: <String, dynamic>{'status': status},
    );
    return _payload(response);
  }
}
