import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/attendance_repository.dart';
import '../data/models/attendance_record.dart';
import '../data/models/service.dart';
import 'attendance_provider.dart';

class LeaderAttendanceState {
  const LeaderAttendanceState({
    required this.selectedService,
    required this.attendanceList,
    required this.isLoading,
    required this.liveCount,
    required this.error,
  });

  const LeaderAttendanceState.initial()
      : selectedService = null,
        attendanceList = const <AttendanceRecord>[],
        isLoading = false,
        liveCount = 0,
        error = null;

  final Service? selectedService;
  final List<AttendanceRecord> attendanceList;
  final bool isLoading;
  final int liveCount;
  final String? error;

  LeaderAttendanceState copyWith({
    Service? selectedService,
    bool clearSelectedService = false,
    List<AttendanceRecord>? attendanceList,
    bool? isLoading,
    int? liveCount,
    String? error,
    bool clearError = false,
  }) {
    return LeaderAttendanceState(
      selectedService: clearSelectedService
          ? null
          : selectedService ?? this.selectedService,
      attendanceList: attendanceList ?? this.attendanceList,
      isLoading: isLoading ?? this.isLoading,
      liveCount: liveCount ?? this.liveCount,
      error: clearError ? null : error ?? this.error,
    );
  }
}

final leaderAttendanceProvider =
    StateNotifierProvider<LeaderAttendanceNotifier, LeaderAttendanceState>((ref) {
  return LeaderAttendanceNotifier(
    repository: ref.watch(attendanceRepositoryProvider),
  );
});

class LeaderAttendanceNotifier extends StateNotifier<LeaderAttendanceState> {
  LeaderAttendanceNotifier({
    required AttendanceRepository repository,
  })  : _repository = repository,
        super(const LeaderAttendanceState.initial());

  final AttendanceRepository _repository;

  Future<void> selectService(String serviceId) async {
    if (serviceId.trim().isEmpty) {
      state = state.copyWith(
        clearSelectedService: true,
        attendanceList: const <AttendanceRecord>[],
        liveCount: 0,
        clearError: true,
      );
      return;
    }

    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final service = await _repository.getServiceById(serviceId);
      final attendance = await _repository.getServiceAttendance(serviceId);
      state = state.copyWith(
        selectedService: service,
        attendanceList: attendance,
        liveCount: service.stats.totalCheckedIn > 0
            ? service.stats.totalCheckedIn
            : attendance.length,
        isLoading: false,
      );
    } catch (error) {
      state = state.copyWith(
        isLoading: false,
        error: _mapError(error),
      );
    }
  }

  Future<void> loadAttendance() async {
    final selectedService = state.selectedService;
    if (selectedService == null) {
      return;
    }

    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final attendance = await _repository.getServiceAttendance(
        selectedService.serviceId,
      );
      state = state.copyWith(
        attendanceList: attendance,
        liveCount: selectedService.stats.totalCheckedIn > 0
            ? selectedService.stats.totalCheckedIn
            : attendance.length,
        isLoading: false,
      );
    } catch (error) {
      state = state.copyWith(
        isLoading: false,
        error: _mapError(error),
      );
    }
  }

  Future<void> refreshLive() async {
    final selectedService = state.selectedService;
    if (selectedService == null) {
      return;
    }

    try {
      final service = await _repository.getServiceById(selectedService.serviceId);
      final attendance = await _repository.getServiceAttendance(service.serviceId);
      state = state.copyWith(
        selectedService: service,
        attendanceList: attendance,
        liveCount: service.stats.totalCheckedIn > 0
            ? service.stats.totalCheckedIn
            : attendance.length,
        clearError: true,
      );
    } catch (error) {
      state = state.copyWith(error: _mapError(error));
    }
  }

  String _mapError(Object error) {
    if (error is DioException) {
      final data = error.response?.data;
      if (data is Map<String, dynamic> && data['message'] != null) {
        return data['message'].toString();
      }
      if (error.message != null && error.message!.isNotEmpty) {
        return error.message!;
      }
    }
    return error.toString();
  }
}
