import 'dart:async';
import 'dart:convert';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/attendance/data/attendance_repository.dart';
import '../../features/attendance/providers/attendance_provider.dart';
import '../../features/cbs/data/cbs_repository.dart';
import '../../features/cbs/providers/cbs_provider.dart';
import '../../features/members/data/member_repository.dart';
import '../../features/members/providers/members_provider.dart';
import '../../features/visitors/data/visitor_repository.dart';
import '../../features/visitors/providers/visitors_provider.dart';
import '../database/local_database.dart';

@immutable
class SyncResult {
  const SyncResult({
    this.skipped = false,
    this.pendingAttendanceSynced = 0,
    this.pendingVisitorsSynced = 0,
    this.pendingCBSSessionsSynced = 0,
    this.failedCount = 0,
    this.permanentFailures = 0,
    this.pendingBefore = 0,
    this.pendingAfter = 0,
    this.message = '',
  });

  final bool skipped;
  final int pendingAttendanceSynced;
  final int pendingVisitorsSynced;
  final int pendingCBSSessionsSynced;
  final int failedCount;
  final int permanentFailures;
  final int pendingBefore;
  final int pendingAfter;
  final String message;
}

@immutable
class SyncStatus {
  const SyncStatus({
    this.isSyncing = false,
    this.isOnline = true,
    this.pendingAttendance = 0,
    this.pendingVisitors = 0,
    this.pendingCBSSessions = 0,
    this.failedItems = 0,
    this.lastSyncAt,
    this.lastMessage,
  });

  final bool isSyncing;
  final bool isOnline;
  final int pendingAttendance;
  final int pendingVisitors;
  final int pendingCBSSessions;
  final int failedItems;
  final DateTime? lastSyncAt;
  final String? lastMessage;

  int get pendingTotal => pendingAttendance + pendingVisitors + pendingCBSSessions;

  SyncStatus copyWith({
    bool? isSyncing,
    bool? isOnline,
    int? pendingAttendance,
    int? pendingVisitors,
    int? pendingCBSSessions,
    int? failedItems,
    DateTime? lastSyncAt,
    bool clearLastSyncAt = false,
    String? lastMessage,
    bool clearLastMessage = false,
  }) {
    return SyncStatus(
      isSyncing: isSyncing ?? this.isSyncing,
      isOnline: isOnline ?? this.isOnline,
      pendingAttendance: pendingAttendance ?? this.pendingAttendance,
      pendingVisitors: pendingVisitors ?? this.pendingVisitors,
      pendingCBSSessions: pendingCBSSessions ?? this.pendingCBSSessions,
      failedItems: failedItems ?? this.failedItems,
      lastSyncAt: clearLastSyncAt ? null : lastSyncAt ?? this.lastSyncAt,
      lastMessage: clearLastMessage ? null : lastMessage ?? this.lastMessage,
    );
  }
}

final syncServiceProvider = Provider<SyncService>((ref) {
  return SyncService(
    db: ref.watch(appDatabaseProvider),
    attendanceRepo: ref.watch(attendanceRepositoryProvider),
    visitorRepo: ref.watch(visitorRepositoryProvider),
    cbsRepo: ref.watch(cbsRepositoryProvider),
    memberRepo: ref.watch(memberRepositoryProvider),
  );
});

final syncStatusProvider = StreamProvider<SyncStatus>((ref) {
  final service = ref.watch(syncServiceProvider);
  return service.syncStatusStream;
});

class SyncService {
  SyncService({
    required AppDatabase db,
    required AttendanceRepository attendanceRepo,
    required VisitorRepository visitorRepo,
    required CBSRepository cbsRepo,
    required MemberRepository memberRepo,
  })  : _db = db,
        _attendanceRepo = attendanceRepo,
        _visitorRepo = visitorRepo,
        _cbsRepo = cbsRepo,
        _memberRepo = memberRepo {
    unawaited(refreshStatus());
  }

  final AppDatabase _db;
  final AttendanceRepository _attendanceRepo;
  final VisitorRepository _visitorRepo;
  final CBSRepository _cbsRepo;
  final MemberRepository _memberRepo;
  final StreamController<SyncStatus> _statusController = StreamController<SyncStatus>.broadcast();

  SyncStatus _latestStatus = const SyncStatus();

  Stream<SyncStatus> get syncStatusStream async* {
    yield _latestStatus;
    yield* _statusController.stream;
  }

  SyncStatus get latestStatus => _latestStatus;

  Future<void> refreshStatus({bool? isOnline, String? message}) async {
    final counts = await _pendingCounts();
    _emit(
      _latestStatus.copyWith(
        isOnline: isOnline ?? _latestStatus.isOnline,
        pendingAttendance: counts.pendingAttendance,
        pendingVisitors: counts.pendingVisitors,
        pendingCBSSessions: counts.pendingCBSSessions,
        failedItems: counts.failedItems,
        lastMessage: message,
      ),
    );
  }

  Future<SyncResult> syncAll() async {
    final online = await _isOnlineNow();
    await refreshStatus(isOnline: online);

    if (!online) {
      return const SyncResult(
        skipped: true,
        message: 'Offline mode active. Sync skipped.',
      );
    }

    final pendingBefore = _latestStatus.pendingTotal;
    _emit(
      _latestStatus.copyWith(
        isSyncing: true,
        isOnline: true,
        lastMessage: pendingBefore > 0 ? 'Syncing pending records...' : 'Refreshing local cache...',
      ),
    );

    final results = await Future.wait<_SyncSegmentResult>(<Future<_SyncSegmentResult>>[
      syncPendingAttendance(),
      syncPendingVisitors(),
      syncPendingCBSSessions(),
      prefetchMembers(),
    ]);

    final combined = results.fold<_SyncSegmentResult>(
      const _SyncSegmentResult(),
      (previous, current) => previous.merge(current),
    );

    await refreshStatus(
      isOnline: true,
      message: combined.failedCount == 0 ? 'All synced' : 'Sync completed with some failures.',
    );
    _emit(
      _latestStatus.copyWith(
        isSyncing: false,
        isOnline: true,
        lastSyncAt: DateTime.now(),
      ),
    );

    return SyncResult(
      skipped: false,
      pendingAttendanceSynced: results[0].syncedCount,
      pendingVisitorsSynced: results[1].syncedCount,
      pendingCBSSessionsSynced: results[2].syncedCount,
      failedCount: combined.failedCount,
      permanentFailures: combined.permanentFailures,
      pendingBefore: pendingBefore,
      pendingAfter: _latestStatus.pendingTotal,
      message: _latestStatus.lastMessage ?? 'Sync complete.',
    );
  }

  Future<_SyncSegmentResult> syncPendingAttendance() async {
    final pending = await _db.getPendingAttendance();
    var syncedCount = 0;
    var failedCount = 0;
    var permanentFailures = 0;

    for (final item in pending) {
      try {
        switch (item.attendeeType) {
          case 'visitor':
            await _attendanceRepo.visitorCheckIn(
              <String, dynamic>{
                'serviceId': item.serviceId,
                'name': item.visitorName ?? '',
                'phone': item.visitorPhone,
                'firstTimer': item.isFirstTimer,
              },
              skipOfflineFallback: true,
            );
            break;
          case 'child':
            await _attendanceRepo.childCheckIn(
              <String, dynamic>{
                'serviceId': item.serviceId,
                'name': item.visitorName ?? '',
                'guardianPhone': item.visitorPhone,
              },
            );
            break;
          case 'member':
          default:
            if (item.checkInMethod == 'qr') {
              await _attendanceRepo.qrCheckIn(
                item.memberId ?? '',
                item.serviceId,
                skipOfflineFallback: true,
              );
            } else {
              await _attendanceRepo.manualCheckIn(
                item.memberId ?? '',
                item.serviceId,
                skipOfflineFallback: true,
              );
            }
            break;
        }
        await _db.markAttendanceSynced(item.id);
        syncedCount++;
      } catch (error) {
        await _db.markAttendanceFailed(item.id);
        failedCount++;
        final failedRecord = (await _db.getFailedAttendance()).firstWhere(
          (record) => record.id == item.id,
          orElse: () => item,
        );
        if (failedRecord.retryCount > 5) {
          permanentFailures++;
          debugPrint('Attendance sync permanently failed for queue item ${item.id}: $error');
        }
      }
    }

    return _SyncSegmentResult(
      syncedCount: syncedCount,
      failedCount: failedCount,
      permanentFailures: permanentFailures,
    );
  }

  Future<_SyncSegmentResult> syncPendingVisitors() async {
    final pending = await _db.getPendingVisitors();
    var syncedCount = 0;
    var failedCount = 0;

    for (final item in pending) {
      try {
        await _visitorRepo.registerVisitor(
          <String, dynamic>{
            'firstName': item.firstName,
            'lastName': item.lastName,
            'phone': item.phone,
            'email': item.email,
            'gender': item.gender,
            'howHeardAboutUs': item.howHeardAboutUs,
            'isFirstTimer': item.isFirstTimer,
            if ((item.serviceId ?? '').isNotEmpty) 'serviceId': item.serviceId,
          },
        );
        await _db.markVisitorSynced(item.id);
        syncedCount++;
      } catch (error) {
        await _db.markVisitorFailed(item.id);
        failedCount++;
        debugPrint('Visitor sync failed for queue item ${item.id}: $error');
      }
    }

    return _SyncSegmentResult(
      syncedCount: syncedCount,
      failedCount: failedCount,
    );
  }

  Future<_SyncSegmentResult> syncPendingCBSSessions() async {
    final pending = await _db.getPendingCBSSessions();
    var syncedCount = 0;
    var failedCount = 0;

    for (final item in pending) {
      try {
        final payload = jsonDecode(item.sessionData) as Map<String, dynamic>;
        await _cbsRepo.recordSession(
          item.groupId,
          payload,
          skipOfflineFallback: true,
        );
        await _db.markCBSSessionSynced(item.id);
        syncedCount++;
      } catch (error) {
        await _db.markCBSSessionFailed(item.id);
        failedCount++;
        debugPrint('CBS session sync failed for queue item ${item.id}: $error');
      }
    }

    return _SyncSegmentResult(
      syncedCount: syncedCount,
      failedCount: failedCount,
    );
  }

  Future<_SyncSegmentResult> prefetchMembers() async {
    try {
      final response = await _memberRepo.getMembers(
        page: 1,
        limit: 500,
        activeOnly: true,
      );
      final now = DateTime.now();
      await _db.upsertMembers(
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
                lastSynced: now,
              ),
            )
            .toList(),
      );
      await _db.clearOldMembers();
      return const _SyncSegmentResult();
    } catch (error) {
      debugPrint('Member prefetch failed: $error');
      return const _SyncSegmentResult(failedCount: 1);
    }
  }

  Future<void> clearFailedItems() async {
    await _db.clearFailedItems();
    await refreshStatus(message: 'Failed sync items cleared.');
  }

  Future<_PendingCounts> _pendingCounts() async {
    final pendingAttendance = await _db.getPendingAttendanceCount();
    final pendingVisitors = await _db.getPendingVisitorCount();
    final pendingCBSSessions = await _db.getPendingCBSSessionCount();
    final failedItems = await _db.getFailedItemCount();
    return _PendingCounts(
      pendingAttendance: pendingAttendance,
      pendingVisitors: pendingVisitors,
      pendingCBSSessions: pendingCBSSessions,
      failedItems: failedItems,
    );
  }

  Future<bool> _isOnlineNow() async {
    final results = await Connectivity().checkConnectivity();
    return !results.contains(ConnectivityResult.none);
  }

  void _emit(SyncStatus next) {
    _latestStatus = next;
    if (!_statusController.isClosed) {
      _statusController.add(next);
    }
  }
}

@immutable
class _SyncSegmentResult {
  const _SyncSegmentResult({
    this.syncedCount = 0,
    this.failedCount = 0,
    this.permanentFailures = 0,
  });

  final int syncedCount;
  final int failedCount;
  final int permanentFailures;

  _SyncSegmentResult merge(_SyncSegmentResult other) {
    return _SyncSegmentResult(
      syncedCount: syncedCount + other.syncedCount,
      failedCount: failedCount + other.failedCount,
      permanentFailures: permanentFailures + other.permanentFailures,
    );
  }
}

@immutable
class _PendingCounts {
  const _PendingCounts({
    required this.pendingAttendance,
    required this.pendingVisitors,
    required this.pendingCBSSessions,
    required this.failedItems,
  });

  final int pendingAttendance;
  final int pendingVisitors;
  final int pendingCBSSessions;
  final int failedItems;
}
