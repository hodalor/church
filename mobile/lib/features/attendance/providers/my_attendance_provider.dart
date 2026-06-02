import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/models/member_attendance_history.dart';
import '../data/models/service.dart';
import 'attendance_provider.dart';

final myAttendanceHistoryProvider = FutureProvider<MemberAttendanceHistory>((ref) async {
  final repository = ref.watch(attendanceRepositoryProvider);
  return repository.getMyAttendanceHistory();
});

final attendanceServiceProvider = FutureProvider.family<Service, String>((ref, serviceId) async {
  final repository = ref.watch(attendanceRepositoryProvider);
  return repository.getServiceById(serviceId);
});
