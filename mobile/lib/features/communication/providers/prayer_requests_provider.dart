import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/communication_repository.dart';
import '../data/models/prayer_request.dart';
import 'inbox_provider.dart';

class PrayerRequestsState {
  const PrayerRequestsState({
    required this.requests,
    required this.isLoading,
    required this.error,
    required this.filter,
  });

  const PrayerRequestsState.initial()
      : requests = const <PrayerRequest>[],
        isLoading = false,
        error = null,
        filter = 'all';

  final List<PrayerRequest> requests;
  final bool isLoading;
  final String? error;
  final String filter;

  PrayerRequestsState copyWith({
    List<PrayerRequest>? requests,
    bool? isLoading,
    String? error,
    bool clearError = false,
    String? filter,
  }) {
    return PrayerRequestsState(
      requests: requests ?? this.requests,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : error ?? this.error,
      filter: filter ?? this.filter,
    );
  }
}

final prayerRequestsProvider =
    StateNotifierProvider<PrayerRequestsNotifier, PrayerRequestsState>((ref) {
  return PrayerRequestsNotifier(
    repository: ref.watch(communicationRepositoryProvider),
  );
});

class PrayerRequestsNotifier extends StateNotifier<PrayerRequestsState> {
  PrayerRequestsNotifier({
    required CommunicationRepository repository,
  })  : _repository = repository,
        super(const PrayerRequestsState.initial());

  final CommunicationRepository _repository;

  Future<void> loadRequests({String filter = 'all'}) async {
    state = state.copyWith(isLoading: true, filter: filter, clearError: true);

    try {
      final params = <String, dynamic>{};
      if (filter == 'urgent') {
        params['urgency'] = 'urgent';
      } else if (filter != 'all') {
        params['status'] = filter;
      }

      final requests = await _repository.getPrayerRequests(params);
      state = state.copyWith(
        requests: requests,
        isLoading: false,
        filter: filter,
        clearError: true,
      );
    } catch (error) {
      state = state.copyWith(
        isLoading: false,
        error: _mapError(error),
      );
    }
  }

  Future<void> submitRequest(Map<String, dynamic> data) async {
    await _repository.submitPrayerRequest(data);
    await loadRequests(filter: state.filter);
  }

  Future<void> pray(String requestId) async {
    final previous = state.requests;
    state = state.copyWith(
      requests: previous
          .map((item) => item.requestId == requestId
              ? item.copyWith(prayerCount: item.prayerCount + 1)
              : item)
          .toList(),
    );

    try {
      await _repository.incrementPrayerCount(requestId);
    } catch (error) {
      state = state.copyWith(
        requests: previous,
        error: _mapError(error),
      );
    }
  }

  Future<void> updateStatus(
    String requestId,
    String status, {
    String? testimonial,
  }) async {
    await _repository.updatePrayerRequestStatus(
      requestId,
      status,
      testimonial: testimonial,
    );

    state = state.copyWith(
      requests: state.requests
          .map((item) => item.requestId == requestId
              ? item.copyWith(status: status, testimonial: testimonial)
              : item)
          .toList(),
    );
  }

  Future<void> assignToMe(
    String requestId, {
    required String userId,
    required String assigneeName,
  }) async {
    await _repository.updatePrayerRequestStatus(
      requestId,
      state.requests
          .firstWhere((item) => item.requestId == requestId)
          .status,
      assignedToUserId: userId,
    );

    state = state.copyWith(
      requests: state.requests
          .map((item) => item.requestId == requestId
              ? item.copyWith(assignedTo: assigneeName)
              : item)
          .toList(),
    );
  }

  String _mapError(Object error) {
    if (error is DioException) {
      final responseData = error.response?.data;
      if (responseData is Map<String, dynamic> && responseData['message'] != null) {
        return responseData['message'].toString();
      }
      if (error.message != null && error.message!.isNotEmpty) {
        return error.message!;
      }
    }
    return error.toString();
  }
}
