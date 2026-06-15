import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/database/local_database.dart';
import '../../auth/providers/auth_provider.dart';
import '../../members/providers/members_provider.dart';
import '../data/attendance_repository.dart';
import '../data/models/service.dart';

class AttendanceState {
  const AttendanceState({
    required this.currentService,
    required this.upcomingServices,
    required this.isLoading,
    required this.checkInResult,
    required this.error,
    required this.isCheckingIn,
  });

  const AttendanceState.initial()
      : currentService = null,
        upcomingServices = const <Service>[],
        isLoading = false,
        checkInResult = null,
        error = null,
        isCheckingIn = false;

  final Service? currentService;
  final List<Service> upcomingServices;
  final bool isLoading;
  final Map<String, dynamic>? checkInResult;
  final String? error;
  final bool isCheckingIn;

  AttendanceState copyWith({
    Service? currentService,
    bool clearCurrentService = false,
    List<Service>? upcomingServices,
    bool? isLoading,
    Map<String, dynamic>? checkInResult,
    bool clearCheckInResult = false,
    String? error,
    bool clearError = false,
    bool? isCheckingIn,
  }) {
    return AttendanceState(
      currentService:
          clearCurrentService ? null : currentService ?? this.currentService,
      upcomingServices: upcomingServices ?? this.upcomingServices,
      isLoading: isLoading ?? this.isLoading,
      checkInResult: clearCheckInResult
          ? null
          : checkInResult ?? this.checkInResult,
      error: clearError ? null : error ?? this.error,
      isCheckingIn: isCheckingIn ?? this.isCheckingIn,
    );
  }
}

final attendanceRepositoryProvider = Provider<AttendanceRepository>((ref) {
  return AttendanceRepository(
    dio: ref.watch(dioProvider),
    database: ref.watch(appDatabaseProvider),
    memberRepository: ref.watch(memberRepositoryProvider),
  );
});

final attendanceProvider =
    StateNotifierProvider<AttendanceNotifier, AttendanceState>((ref) {
  return AttendanceNotifier(
    repository: ref.watch(attendanceRepositoryProvider),
  );
});

class AttendanceNotifier extends StateNotifier<AttendanceState> {
  AttendanceNotifier({
    required AttendanceRepository repository,
  })  : _repository = repository,
        super(const AttendanceState.initial()) {
    loadCurrentService();
    loadUpcomingServices();
  }

  final AttendanceRepository _repository;

  Future<void> loadCurrentService() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final service = await _repository.getCurrentOpenService();
      state = state.copyWith(
        currentService: service,
        clearCurrentService: service == null,
        isLoading: false,
      );
    } catch (error) {
      state = state.copyWith(
        isLoading: false,
        error: _mapError(error),
      );
    }
  }

  Future<void> loadUpcomingServices() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final services = await _repository.getUpcomingServices();
      state = state.copyWith(
        upcomingServices: services,
        isLoading: false,
      );
    } catch (error) {
      state = state.copyWith(
        isLoading: false,
        error: _mapError(error),
      );
    }
  }

  Future<void> checkInOnline(String serviceId) async {
    state = state.copyWith(
      isCheckingIn: true,
      clearError: true,
      clearCheckInResult: true,
    );
    try {
      final result = await _repository.onlineCheckIn(serviceId);
      state = state.copyWith(
        isCheckingIn: false,
        checkInResult: result,
      );
      await loadCurrentService();
    } catch (error) {
      state = state.copyWith(
        isCheckingIn: false,
        error: _mapError(error),
      );
    }
  }

  Future<void> checkInViaQr(String qrData, String serviceId) async {
    state = state.copyWith(
      isCheckingIn: true,
      clearError: true,
      clearCheckInResult: true,
    );
    try {
      final result = await _repository.qrCheckIn(qrData, serviceId);
      state = state.copyWith(
        isCheckingIn: false,
        checkInResult: result,
      );
      await loadCurrentService();
    } catch (error) {
      state = state.copyWith(
        isCheckingIn: false,
        error: _mapError(error),
      );
    }
  }

  void clearResult() {
    state = state.copyWith(clearCheckInResult: true, clearError: true);
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
