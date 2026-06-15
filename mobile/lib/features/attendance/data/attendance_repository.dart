import 'package:dio/dio.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../../../core/database/local_database.dart';
import '../../../core/api/endpoints.dart';
import '../../members/data/member_repository.dart';
import '../../members/data/models/health_score.dart';
import '../../members/data/models/member.dart';
import 'models/attendance_record.dart';
import 'models/member_attendance_history.dart';
import 'models/service.dart';

class AttendanceMemberSearchResult {
  const AttendanceMemberSearchResult({
    required this.members,
    required this.fromOfflineCache,
  });

  final List<Member> members;
  final bool fromOfflineCache;
}

class AttendanceRepository {
  AttendanceRepository({
    required Dio dio,
    required AppDatabase database,
    required MemberRepository memberRepository,
  })  : _dio = dio,
        _database = database,
        _memberRepository = memberRepository;

  final Dio _dio;
  final AppDatabase _database;
  final MemberRepository _memberRepository;

  Map<String, dynamic> _asMap(dynamic data) {
    if (data is Map<String, dynamic>) {
      return data;
    }
    return <String, dynamic>{};
  }

  List<Map<String, dynamic>> _asList(dynamic data) {
    if (data is List<dynamic>) {
      return data.whereType<Map<String, dynamic>>().toList();
    }
    return const <Map<String, dynamic>>[];
  }

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

  Future<Service?> getCurrentOpenService() async {
    final response = await _dio.get<Map<String, dynamic>>(
      Endpoints.attendanceServices,
      queryParameters: const <String, dynamic>{
        'status': 'open',
        'limit': 1,
      },
    );

    final payload = _payload(response);
    final serviceMap = _asMap(payload['currentService']);
    if (serviceMap.isNotEmpty) {
      return Service.fromJson(serviceMap);
    }

    final items = _asList(payload['items']);
    if (items.isEmpty) {
      return null;
    }

    return Service.fromJson(items.first);
  }

  Future<List<Service>> getUpcomingServices() async {
    final response = await _dio.get<Map<String, dynamic>>(
      Endpoints.attendanceServices,
      queryParameters: const <String, dynamic>{
        'status': 'upcoming',
        'limit': 10,
      },
    );

    final payload = _payload(response);
    final itemsSource = _asList(payload['items']).isNotEmpty
        ? payload['items']
        : payload['services'];
    final items = _asList(itemsSource);
    return items.map(Service.fromJson).toList();
  }

  Future<Service> getServiceById(String serviceId) async {
    final response = await _dio.get<Map<String, dynamic>>(
      Endpoints.attendanceService(serviceId),
    );
    return Service.fromJson(_payload(response));
  }

  Future<Map<String, dynamic>> onlineCheckIn(String serviceId) async {
    final response = await _dio.post<Map<String, dynamic>>(
      Endpoints.attendanceServiceOnlineCheckIn(serviceId),
    );
    return _payload(response);
  }

  Future<Map<String, dynamic>> qrCheckIn(
    String qrData,
    String serviceId, {
    bool skipOfflineFallback = false,
  }) async {
    if (!skipOfflineFallback && !await _hasConnection() && qrData.trim().isNotEmpty) {
      await _database.queueAttendance(
        LocalAttendanceQueueCompanion.insert(
          serviceId: serviceId,
          memberId: Value<String>(qrData.trim()),
          checkInMethod: 'qr',
          attendeeType: 'member',
          checkInTime: DateTime.now(),
          createdAt: DateTime.now(),
        ),
      );
      return <String, dynamic>{
        'success': true,
        'offline': true,
        'message': 'Checked in (offline) — will sync when online',
      };
    }

    final response = await _dio.post<Map<String, dynamic>>(
      Endpoints.attendanceServiceQrCheckIn(serviceId),
      data: <String, dynamic>{
        'qrData': qrData,
      },
    );
    return _payload(response);
  }

  Future<Map<String, dynamic>> manualCheckIn(
    String memberId,
    String serviceId, {
    bool skipOfflineFallback = false,
  }) async {
    if (!skipOfflineFallback && !await _hasConnection()) {
      await _database.queueAttendance(
        LocalAttendanceQueueCompanion.insert(
          serviceId: serviceId,
          memberId: Value<String>(memberId),
          checkInMethod: 'manual',
          attendeeType: 'member',
          checkInTime: DateTime.now(),
          createdAt: DateTime.now(),
        ),
      );
      return <String, dynamic>{
        'success': true,
        'offline': true,
        'message': 'Checked in (offline) — will sync when online',
      };
    }

    final response = await _dio.post<Map<String, dynamic>>(
      Endpoints.attendanceServiceManualCheckIn(serviceId),
      data: <String, dynamic>{
        'memberId': memberId,
      },
    );
    return _payload(response);
  }

  Future<Map<String, dynamic>> visitorCheckIn(
    Map<String, dynamic> data, {
    bool skipOfflineFallback = false,
  }) async {
    final serviceId = (data['serviceId'] ?? '').toString();
    if (!skipOfflineFallback && !await _hasConnection()) {
      await _database.queueAttendance(
        LocalAttendanceQueueCompanion.insert(
          serviceId: serviceId,
          visitorName: Value<String?>((data['name'] ?? '').toString()),
          visitorPhone: Value<String?>((data['phone'] ?? '').toString()),
          isFirstTimer: Value<bool>(data['firstTimer'] == true),
          checkInMethod: 'manual',
          attendeeType: 'visitor',
          checkInTime: DateTime.now(),
          createdAt: DateTime.now(),
        ),
      );
      return <String, dynamic>{
        'success': true,
        'offline': true,
        'message': 'Checked in (offline) — will sync when online',
      };
    }

    final payload = Map<String, dynamic>.from(data)..remove('serviceId');
    final response = await _dio.post<Map<String, dynamic>>(
      Endpoints.attendanceServiceVisitorCheckIn(serviceId),
      data: payload,
    );
    return _payload(response);
  }

  Future<AttendanceMemberSearchResult> getMemberSearch(String query) async {
    if (await _hasConnection()) {
      final response = await _memberRepository.getMembers(
        page: 1,
        limit: 10,
        search: query,
        activeOnly: true,
      );
      await _database.upsertMembers(
        response.members
            .map(
              (member) => LocalMember(
                memberId: member.memberId,
                tenantId: member.tenantId,
                firstName: member.firstName,
                lastName: member.lastName,
                photoUrl: member.photoUrl,
                phone: member.phone,
                membershipStatus: member.membershipStatus ?? 'member',
                branch: member.branch,
                lastSynced: DateTime.now(),
              ),
            )
            .toList(),
      );
      return AttendanceMemberSearchResult(
        members: response.members,
        fromOfflineCache: false,
      );
    }

    final cached = await _database.searchMembers(query);
    return AttendanceMemberSearchResult(
      members: cached.map(_memberFromLocalCache).toList(),
      fromOfflineCache: true,
    );
  }

  Future<Map<String, dynamic>> childCheckIn(Map<String, dynamic> data) async {
    final serviceId = (data['serviceId'] ?? '').toString();
    final payload = Map<String, dynamic>.from(data)..remove('serviceId');
    final response = await _dio.post<Map<String, dynamic>>(
      Endpoints.attendanceServiceChildCheckIn(serviceId),
      data: payload,
    );
    return _payload(response);
  }

  Future<MemberAttendanceHistory> getMyAttendanceHistory() async {
    final response = await _dio.get<Map<String, dynamic>>(
      '${Endpoints.attendanceReports}/my-history',
    );
    return MemberAttendanceHistory.fromJson(_payload(response));
  }

  Future<List<AttendanceRecord>> getServiceAttendance(String serviceId) async {
    final response = await _dio.get<Map<String, dynamic>>(
      Endpoints.attendanceServiceRecords(serviceId),
      queryParameters: const <String, dynamic>{
        'limit': 50,
      },
    );
    final payload = _payload(response);
    final itemsSource = _asList(payload['items']).isNotEmpty
        ? payload['items']
        : payload['checkIns'];
    final items = _asList(itemsSource);
    return items.map(AttendanceRecord.fromJson).toList();
  }

  Member _memberFromLocalCache(LocalMember member) {
    return Member(
      tenantId: member.tenantId,
      memberId: member.memberId,
      firstName: member.firstName,
      lastName: member.lastName,
      healthScore: const HealthScore(
        overall: 0,
        attendance: 0,
        giving: 0,
        participation: 0,
        involvement: 0,
        status: HealthScoreStatus.newMember,
      ),
      photoUrl: member.photoUrl,
      phone: member.phone,
      membershipStatus: member.membershipStatus,
      branch: member.branch,
    );
  }

  Future<bool> _hasConnection() async {
    final results = await Connectivity().checkConnectivity();
    return !results.contains(ConnectivityResult.none);
  }
}
