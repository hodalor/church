import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/visitor_repository.dart';
import 'visitors_provider.dart';

class FollowUpsState {
  const FollowUpsState({
    required this.myFollowUps,
    required this.overdueFollowUps,
    required this.isLoading,
    this.error,
  });

  const FollowUpsState.initial()
      : myFollowUps = const <Map<String, dynamic>>[],
        overdueFollowUps = const <Map<String, dynamic>>[],
        isLoading = false,
        error = null;

  final List<Map<String, dynamic>> myFollowUps;
  final List<Map<String, dynamic>> overdueFollowUps;
  final bool isLoading;
  final String? error;

  FollowUpsState copyWith({
    List<Map<String, dynamic>>? myFollowUps,
    List<Map<String, dynamic>>? overdueFollowUps,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return FollowUpsState(
      myFollowUps: myFollowUps ?? this.myFollowUps,
      overdueFollowUps: overdueFollowUps ?? this.overdueFollowUps,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : error ?? this.error,
    );
  }
}

final followUpsProvider = StateNotifierProvider<FollowUpsNotifier, FollowUpsState>((ref) {
  return FollowUpsNotifier(
    repository: ref.watch(visitorRepositoryProvider),
    ref: ref,
  );
});

class FollowUpsNotifier extends StateNotifier<FollowUpsState> {
  FollowUpsNotifier({
    required VisitorRepository repository,
    required Ref ref,
  })  : _repository = repository,
        _ref = ref,
        super(const FollowUpsState.initial()) {
    load();
  }

  final VisitorRepository _repository;
  final Ref _ref;

  Future<void> load() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final results = await Future.wait<dynamic>(<Future<dynamic>>[
        _repository.getMyFollowUps(),
        _repository.getOverdueFollowUps(),
      ]);
      state = state.copyWith(
        myFollowUps: results[0] as List<Map<String, dynamic>>,
        overdueFollowUps: results[1] as List<Map<String, dynamic>>,
        isLoading: false,
      );
    } catch (error) {
      state = state.copyWith(isLoading: false, error: _mapError(error));
    }
  }

  Future<void> complete(String visitorId, String followUpId, Map<String, dynamic> data) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final visitor = await _repository.completeFollowUp(visitorId, followUpId, data);
      await _ref.read(visitorsProvider.notifier).replaceVisitor(visitor);
      await load();
    } catch (error) {
      state = state.copyWith(isLoading: false, error: _mapError(error));
    }
  }

  Future<void> refresh() async {
    await load();
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
