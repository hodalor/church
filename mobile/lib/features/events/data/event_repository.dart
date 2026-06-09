import 'package:dio/dio.dart';
import '../../../core/api/endpoints.dart';
import 'models/event.dart';
import 'models/registration.dart';

class EventRepository {
  EventRepository({required Dio dio}) : _dio = dio;

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

  Future<List<Event>> getUpcomingEvents() async {
    final response = await _dio.get<Map<String, dynamic>>(
      '${Endpoints.events}/upcoming',
      queryParameters: const <String, dynamic>{'limit': 20},
    );
    final payload = _payload(response);
    final items = _asList(payload['items']);
    return items.map(Event.fromJson).toList();
  }

  Future<List<Event>> getAllEvents([Map<String, dynamic> params = const <String, dynamic>{'limit': 50}]) async {
    final response = await _dio.get<Map<String, dynamic>>(
      Endpoints.events,
      queryParameters: params,
    );
    final payload = _payload(response);
    final items = _asList(payload['items']);
    return items.map(Event.fromJson).toList();
  }

  Future<Event> getEventById(String eventId) async {
    final response = await _dio.get<Map<String, dynamic>>(Endpoints.event(eventId));
    return Event.fromJson(_payload(response));
  }

  Future<Registration> registerForEvent(String eventId, Map<String, dynamic> data) async {
    final response = await _dio.post<Map<String, dynamic>>(
      Endpoints.eventRegister(eventId),
      data: data,
    );
    return Registration.fromJson(_payload(response));
  }

  Future<List<Registration>> getMyRegistrations() async {
    final response = await _dio.get<Map<String, dynamic>>(Endpoints.myEventRegistrations());
    final payload = _payload(response);
    final items = _asList(payload['items']);
    return items.map(Registration.fromJson).toList();
  }

  Future<Map<String, dynamic>> checkInToEvent(String eventId, String registrationId) async {
    final response = await _dio.patch<Map<String, dynamic>>(
      Endpoints.eventRegistrationCheckIn(eventId, registrationId),
      data: const <String, dynamic>{'method': 'manual'},
    );
    return _payload(response);
  }
}
