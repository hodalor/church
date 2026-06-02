import 'package:dio/dio.dart';
import '../../../core/api/endpoints.dart';
import 'models/attendance_record.dart';
import 'models/member_attendance_history.dart';
import 'models/service.dart';

class AttendanceRepository {
  AttendanceRepository({
    required Dio dio,
  }) : _dio = dio;

  final Dio _dio;

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

  Future<Map<String, dynamic>> qrCheckIn(String qrData, String serviceId) async {
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
    String serviceId,
  ) async {
    final response = await _dio.post<Map<String, dynamic>>(
      Endpoints.attendanceServiceManualCheckIn(serviceId),
      data: <String, dynamic>{
        'memberId': memberId,
      },
    );
    return _payload(response);
  }

  Future<Map<String, dynamic>> visitorCheckIn(Map<String, dynamic> data) async {
    final serviceId = (data['serviceId'] ?? '').toString();
    final payload = Map<String, dynamic>.from(data)..remove('serviceId');
    final response = await _dio.post<Map<String, dynamic>>(
      Endpoints.attendanceServiceVisitorCheckIn(serviceId),
      data: payload,
    );
    return _payload(response);
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
}
