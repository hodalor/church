import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/ai_repository.dart';

class AiState {
  const AiState({
    required this.isLoading,
    required this.result,
    required this.error,
    required this.feature,
    required this.lastPayload,
  });

  const AiState.initial()
      : isLoading = false,
        result = null,
        error = null,
        feature = 'devotional',
        lastPayload = const <String, dynamic>{};

  final bool isLoading;
  final String? result;
  final String? error;
  final String feature;
  final Map<String, dynamic> lastPayload;

  AiState copyWith({
    bool? isLoading,
    String? result,
    String? error,
    String? feature,
    Map<String, dynamic>? lastPayload,
    bool clearResult = false,
    bool clearError = false,
  }) {
    return AiState(
      isLoading: isLoading ?? this.isLoading,
      result: clearResult ? null : result ?? this.result,
      error: clearError ? null : error ?? this.error,
      feature: feature ?? this.feature,
      lastPayload: lastPayload ?? this.lastPayload,
    );
  }
}

final aiRepositoryProvider = Provider<AiRepository>((ref) {
  return AiRepository(dio: ref.watch(dioProvider));
});

final aiProvider = StateNotifierProvider<AiNotifier, AiState>((ref) {
  return AiNotifier(repository: ref.watch(aiRepositoryProvider));
});

class AiNotifier extends StateNotifier<AiState> {
  AiNotifier({required AiRepository repository})
      : _repository = repository,
        super(const AiState.initial());

  final AiRepository _repository;

  Future<void> generateDevotional(Map<String, dynamic> data) async =>
      _run('devotional', data, () => _repository.generateDevotional(data));

  Future<void> generatePrayerPoints(Map<String, dynamic> data) async =>
      _run('prayer_points', data, () => _repository.generatePrayerPoints(data));

  Future<void> generateSermonDraft(Map<String, dynamic> data) async =>
      _run('sermon_draft', data, () => _repository.generateSermonDraft(data));

  Future<void> generateAnnouncement(Map<String, dynamic> data) async =>
      _run('announcement', data, () => _repository.generateAnnouncement(data));

  void clearResult() {
    state = state.copyWith(clearResult: true, clearError: true);
  }

  Future<void> _run(
    String feature,
    Map<String, dynamic> data,
    Future<String> Function() action,
  ) async {
    state = state.copyWith(
      isLoading: true,
      feature: feature,
      lastPayload: Map<String, dynamic>.from(data),
      clearError: true,
      clearResult: true,
    );

    try {
      final result = await action();
      state = state.copyWith(
        isLoading: false,
        result: result,
        feature: feature,
      );
    } catch (error) {
      var message = error.toString();
      if (error is DioException) {
        final payload = error.response?.data;
        if (payload is Map<String, dynamic> && payload['message'] != null) {
          message = payload['message'].toString();
        } else if (error.message != null && error.message!.isNotEmpty) {
          message = error.message!;
        }
      }
      state = state.copyWith(
        isLoading: false,
        error: message,
        feature: feature,
      );
    }
  }
}
