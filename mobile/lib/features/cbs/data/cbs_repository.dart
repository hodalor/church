import 'dart:convert';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/endpoints.dart';
import '../../../core/database/local_database.dart';
import '../../../core/storage/secure_storage.dart';
import '../../auth/providers/auth_provider.dart';
import 'models/cbs_group.dart';
import 'models/cbs_prospect.dart';
import 'models/cbs_session.dart';

final cbsRepositoryProvider = Provider<CBSRepository>((ref) {
  return CBSRepository(
    dio: ref.watch(dioProvider),
    storage: ref.watch(secureStorageProvider),
    database: ref.watch(appDatabaseProvider),
  );
});

class CBSRepository {
  CBSRepository({
    required Dio dio,
    required SecureStorageService storage,
    required AppDatabase database,
  })  : _dio = dio,
        _storage = storage,
        _database = database;

  final Dio _dio;
  final SecureStorageService _storage;
  final AppDatabase _database;

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

  Future<CBSGroup?> getMyGroup() async {
    final profile = await _storage.getUserProfile();
    final userId = profile?.userId;
    if (userId == null || userId.isEmpty) {
      return null;
    }

    final response = await _dio.get<Map<String, dynamic>>(Endpoints.cbsGroups);
    final payload = _payload(response);
    final items = _asList(payload['items']).isNotEmpty ? _asList(payload['items']) : _asList(payload['groups']);
    final groups = items.map(CBSGroup.fromJson).toList();

    for (final group in groups) {
      if (group.leaderId == userId || group.coLeaderId == userId) {
        return group;
      }
    }

    return groups.isEmpty ? null : groups.first;
  }

  Future<List<CBSProspect>> getGroupProspects(String groupId) async {
    final response = await _dio.get<Map<String, dynamic>>(Endpoints.cbsGroupProspects(groupId));
    final payload = _payload(response);
    final items = _asList(payload['items']).isNotEmpty ? _asList(payload['items']) : _asList(payload['prospects']);
    return items.map(CBSProspect.fromJson).toList();
  }

  Future<CBSProspect> updateStudyStage(String id, String stage) async {
    final group = await getMyGroup();
    if (group == null) {
      throw Exception('No CBS group assigned to this user.');
    }

    final response = await _dio.patch<Map<String, dynamic>>(
      Endpoints.cbsGroupProspect(group.groupId, id),
      data: <String, dynamic>{'studyStage': stage},
    );
    return CBSProspect.fromJson(_payload(response));
  }

  Future<CBSProspect> addProspect(Map<String, dynamic> data) async {
    final groupId = (data['groupId'] ?? '').toString();
    final payload = Map<String, dynamic>.from(data)..remove('groupId');
    final response = await _dio.post<Map<String, dynamic>>(
      Endpoints.cbsGroupProspects(groupId),
      data: payload,
    );
    return CBSProspect.fromJson(_payload(response));
  }

  Future<CBSSession> recordSession(
    String groupId,
    Map<String, dynamic> data, {
    bool skipOfflineFallback = false,
  }) async {
    if (!skipOfflineFallback && !await _hasConnection()) {
      await _database.queueCBSSession(
        LocalCBSSessionQueueCompanion.insert(
          groupId: groupId,
          sessionData: jsonEncode(data),
          createdAt: DateTime.now(),
        ),
      );
      return CBSSession(
        sessionId: 'offline-${DateTime.now().millisecondsSinceEpoch}',
        groupId: groupId,
        date: DateTime.tryParse((data['date'] ?? '').toString()) ?? DateTime.now(),
        studyTopic: (data['studyTopic'] ?? data['topic'] ?? '').toString(),
        studyReference: data['studyReference']?.toString(),
        duration: data['duration'] is num ? (data['duration'] as num).toInt() : int.tryParse(data['duration']?.toString() ?? ''),
        venue: data['venue']?.toString(),
        leaderNotes: data['leaderNotes']?.toString(),
        isPendingSync: true,
      );
    }

    final response = await _dio.post<Map<String, dynamic>>(
      Endpoints.cbsGroupSessions(groupId),
      data: data,
    );
    return CBSSession.fromJson(_payload(response));
  }

  Future<Map<String, dynamic>> getCBSStats() async {
    final response = await _dio.get<Map<String, dynamic>>(Endpoints.cbsStats);
    return _payload(response);
  }

  Future<CBSProspect> convertToMember(String id, Map<String, dynamic> data) async {
    final groupId = (data['groupId'] ?? '').toString();
    final response = await _dio.post<Map<String, dynamic>>(
      Endpoints.cbsGroupConvertProspect(groupId, id),
      data: data,
    );
    final payload = _payload(response);
    final prospectMap = payload['prospect'] is Map<String, dynamic>
        ? payload['prospect'] as Map<String, dynamic>
        : <String, dynamic>{'prospectId': id, ...data, 'studyStage': 'member'};
    return CBSProspect.fromJson(prospectMap);
  }

  Future<List<CBSSession>> getGroupSessions(String groupId) async {
    final response = await _dio.get<Map<String, dynamic>>(Endpoints.cbsGroupSessions(groupId));
    final payload = _payload(response);
    final items = _asList(payload['items']).isNotEmpty ? _asList(payload['items']) : _asList(payload['sessions']);
    return items.map(CBSSession.fromJson).toList();
  }

  Future<bool> _hasConnection() async {
    final results = await Connectivity().checkConnectivity();
    return !results.contains(ConnectivityResult.none);
  }
}
