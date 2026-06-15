import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

part 'local_database.g.dart';

@DataClassName('LocalMember')
class LocalMembers extends Table {
  TextColumn get memberId => text()();
  TextColumn get tenantId => text()();
  TextColumn get firstName => text()();
  TextColumn get lastName => text()();
  TextColumn get photoUrl => text().nullable()();
  TextColumn get phone => text().nullable()();
  TextColumn get membershipStatus => text()();
  TextColumn get branch => text().nullable()();
  DateTimeColumn get lastSynced => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => <Column<Object>>{memberId};
}

@DataClassName('LocalAttendance')
class LocalAttendanceQueue extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get serviceId => text()();
  TextColumn get memberId => text().nullable()();
  TextColumn get visitorName => text().nullable()();
  TextColumn get visitorPhone => text().nullable()();
  BoolColumn get isFirstTimer => boolean().withDefault(const Constant(false))();
  TextColumn get checkInMethod => text()();
  TextColumn get attendeeType => text()();
  DateTimeColumn get checkInTime => dateTime()();
  TextColumn get queueStatus => text().withDefault(const Constant('pending'))();
  IntColumn get retryCount => integer().withDefault(const Constant(0))();
  DateTimeColumn get createdAt => dateTime()();
}

@DataClassName('LocalVisitorRegistration')
class LocalVisitorQueue extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get firstName => text()();
  TextColumn get lastName => text()();
  TextColumn get phone => text().nullable()();
  TextColumn get email => text().nullable()();
  TextColumn get gender => text().nullable()();
  TextColumn get howHeardAboutUs => text().nullable()();
  BoolColumn get isFirstTimer => boolean().withDefault(const Constant(true))();
  TextColumn get serviceId => text().nullable()();
  TextColumn get queueStatus => text().withDefault(const Constant('pending'))();
  DateTimeColumn get createdAt => dateTime()();
}

@DataClassName('LocalCBSSessionRecord')
class LocalCBSSessionQueue extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get groupId => text()();
  TextColumn get sessionData => text()();
  TextColumn get queueStatus => text().withDefault(const Constant('pending'))();
  DateTimeColumn get createdAt => dateTime()();
}

final appDatabaseProvider = Provider<AppDatabase>((ref) {
  final database = AppDatabase();
  ref.onDispose(database.close);
  return database;
});

@DriftDatabase(
  tables: <Type>[
    LocalMembers,
    LocalAttendanceQueue,
    LocalVisitorQueue,
    LocalCBSSessionQueue,
  ],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 1;

  Future<List<LocalMember>> searchMembers(String query) async {
    final trimmed = query.trim();
    if (trimmed.isEmpty) {
      return const <LocalMember>[];
    }

    final pattern = '%$trimmed%';
    return (select(localMembers)
          ..where(
            (tbl) =>
                tbl.firstName.like(pattern) |
                tbl.lastName.like(pattern) |
                tbl.memberId.like(pattern) |
                tbl.phone.likeNullable(pattern),
          )
          ..limit(20))
        .get();
  }

  Future<void> upsertMembers(List<LocalMember> members) async {
    if (members.isEmpty) {
      return;
    }

    await batch((batch) {
      batch.insertAllOnConflictUpdate(localMembers, members);
    });
  }

  Future<void> clearOldMembers() async {
    final cutoff = DateTime.now().subtract(const Duration(days: 7));
    await (delete(localMembers)..where((tbl) => tbl.lastSynced.isSmallerThanValue(cutoff))).go();
  }

  Future<int> queueAttendance(LocalAttendanceQueueCompanion data) {
    return into(localAttendanceQueue).insert(data);
  }

  Future<List<LocalAttendance>> getPendingAttendance() {
    return (select(localAttendanceQueue)
          ..where((tbl) => tbl.queueStatus.equals('pending'))
          ..orderBy(<OrderingTerm>[
            OrderingTerm.asc(localAttendanceQueue.createdAt),
          ]))
        .get();
  }

  Future<List<LocalAttendance>> getFailedAttendance() {
    return (select(localAttendanceQueue)
          ..where((tbl) => tbl.queueStatus.equals('failed'))
          ..orderBy(<OrderingTerm>[
            OrderingTerm.desc(localAttendanceQueue.createdAt),
          ]))
        .get();
  }

  Future<void> markAttendanceSynced(int id) {
    return (update(localAttendanceQueue)..where((tbl) => tbl.id.equals(id))).write(
      const LocalAttendanceQueueCompanion(
        queueStatus: Value<String>('synced'),
      ),
    );
  }

  Future<void> markAttendanceFailed(int id) async {
    final record = await (select(localAttendanceQueue)..where((tbl) => tbl.id.equals(id))).getSingleOrNull();
    if (record == null) {
      return;
    }

    await (update(localAttendanceQueue)..where((tbl) => tbl.id.equals(id))).write(
      LocalAttendanceQueueCompanion(
        queueStatus: const Value<String>('failed'),
        retryCount: Value<int>(record.retryCount + 1),
      ),
    );
  }

  Future<int> queueVisitor(LocalVisitorQueueCompanion data) {
    return into(localVisitorQueue).insert(data);
  }

  Future<List<LocalVisitorRegistration>> getPendingVisitors() {
    return (select(localVisitorQueue)
          ..where((tbl) => tbl.queueStatus.equals('pending'))
          ..orderBy(<OrderingTerm>[
            OrderingTerm.asc(localVisitorQueue.createdAt),
          ]))
        .get();
  }

  Future<List<LocalVisitorRegistration>> getFailedVisitors() {
    return (select(localVisitorQueue)
          ..where((tbl) => tbl.queueStatus.equals('failed'))
          ..orderBy(<OrderingTerm>[
            OrderingTerm.desc(localVisitorQueue.createdAt),
          ]))
        .get();
  }

  Future<void> markVisitorSynced(int id) {
    return (update(localVisitorQueue)..where((tbl) => tbl.id.equals(id))).write(
      const LocalVisitorQueueCompanion(
        queueStatus: Value<String>('synced'),
      ),
    );
  }

  Future<void> markVisitorFailed(int id) async {
    await (update(localVisitorQueue)..where((tbl) => tbl.id.equals(id))).write(
      const LocalVisitorQueueCompanion(
        queueStatus: Value<String>('failed'),
      ),
    );
  }

  Future<int> queueCBSSession(LocalCBSSessionQueueCompanion data) {
    return into(localCBSSessionQueue).insert(data);
  }

  Future<List<LocalCBSSessionRecord>> getPendingCBSSessions() {
    return (select(localCBSSessionQueue)
          ..where((tbl) => tbl.queueStatus.equals('pending'))
          ..orderBy(<OrderingTerm>[
            OrderingTerm.asc(localCBSSessionQueue.createdAt),
          ]))
        .get();
  }

  Future<List<LocalCBSSessionRecord>> getFailedCBSSessions() {
    return (select(localCBSSessionQueue)
          ..where((tbl) => tbl.queueStatus.equals('failed'))
          ..orderBy(<OrderingTerm>[
            OrderingTerm.desc(localCBSSessionQueue.createdAt),
          ]))
        .get();
  }

  Future<void> markCBSSessionSynced(int id) {
    return (update(localCBSSessionQueue)..where((tbl) => tbl.id.equals(id))).write(
      const LocalCBSSessionQueueCompanion(
        queueStatus: Value<String>('synced'),
      ),
    );
  }

  Future<void> markCBSSessionFailed(int id) async {
    await (update(localCBSSessionQueue)..where((tbl) => tbl.id.equals(id))).write(
      const LocalCBSSessionQueueCompanion(
        queueStatus: Value<String>('failed'),
      ),
    );
  }

  Future<int> getPendingAttendanceCount() async {
    final result = await customSelect(
      'SELECT COUNT(*) AS count FROM local_attendance_queue WHERE queue_status = ?',
      variables: <Variable<Object>>[const Variable<String>('pending')],
      readsFrom: <TableInfo<Table, Object?>>{localAttendanceQueue},
    ).getSingle();
    return result.read<int>('count');
  }

  Future<int> getPendingVisitorCount() async {
    final result = await customSelect(
      'SELECT COUNT(*) AS count FROM local_visitor_queue WHERE queue_status = ?',
      variables: <Variable<Object>>[const Variable<String>('pending')],
      readsFrom: <TableInfo<Table, Object?>>{localVisitorQueue},
    ).getSingle();
    return result.read<int>('count');
  }

  Future<int> getPendingCBSSessionCount() async {
    final result = await customSelect(
      'SELECT COUNT(*) AS count FROM local_c_b_s_session_queue WHERE queue_status = ?',
      variables: <Variable<Object>>[const Variable<String>('pending')],
      readsFrom: <TableInfo<Table, Object?>>{localCBSSessionQueue},
    ).getSingle();
    return result.read<int>('count');
  }

  Future<int> getFailedItemCount() async {
    final attendanceFailed = await getFailedAttendance();
    final visitorFailed = await getFailedVisitors();
    final cbsFailed = await getFailedCBSSessions();
    return attendanceFailed.length + visitorFailed.length + cbsFailed.length;
  }

  Future<void> clearFailedItems() async {
    await transaction(() async {
      await (delete(localAttendanceQueue)..where((tbl) => tbl.queueStatus.equals('failed'))).go();
      await (delete(localVisitorQueue)..where((tbl) => tbl.queueStatus.equals('failed'))).go();
      await (delete(localCBSSessionQueue)..where((tbl) => tbl.queueStatus.equals('failed'))).go();
    });
  }
}

QueryExecutor _openConnection() {
  return driftDatabase(name: 'prynova_local_db');
}
