import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/models/visitor.dart';
import '../data/models/visitor_stats.dart';
import '../data/visitor_repository.dart';

class VisitorsState {
  const VisitorsState({
    required this.visitors,
    required this.isLoading,
    required this.error,
    required this.stats,
  });

  const VisitorsState.initial()
      : visitors = const <Visitor>[],
        isLoading = false,
        error = null,
        stats = const VisitorStats(
          totalVisitors: 0,
          thisMonth: 0,
          conversionRate: 0,
          pendingFollowUps: 0,
        );

  final List<Visitor> visitors;
  final bool isLoading;
  final String? error;
  final VisitorStats stats;

  VisitorsState copyWith({
    List<Visitor>? visitors,
    bool? isLoading,
    String? error,
    bool clearError = false,
    VisitorStats? stats,
  }) {
    return VisitorsState(
      visitors: visitors ?? this.visitors,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : error ?? this.error,
      stats: stats ?? this.stats,
    );
  }
}

final visitorRepositoryProvider = Provider<VisitorRepository>((ref) {
  return VisitorRepository(dio: ref.watch(dioProvider));
});

final visitorsProvider = StateNotifierProvider<VisitorsNotifier, VisitorsState>((ref) {
  return VisitorsNotifier(repository: ref.watch(visitorRepositoryProvider));
});

class VisitorsNotifier extends StateNotifier<VisitorsState> {
  VisitorsNotifier({required VisitorRepository repository})
      : _repository = repository,
        super(const VisitorsState.initial()) {
    loadVisitors();
  }

  final VisitorRepository _repository;

  Future<void> loadVisitors([Map<String, dynamic> params = const <String, dynamic>{'limit': 50}]) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final responses = await Future.wait<dynamic>(<Future<dynamic>>[
        _repository.getAllVisitors(params),
        _repository.getVisitorStats(),
      ]);
      state = state.copyWith(
        visitors: responses[0] as List<Visitor>,
        stats: responses[1] as VisitorStats,
        isLoading: false,
        clearError: true,
      );
    } catch (error) {
      state = state.copyWith(isLoading: false, error: _mapError(error));
    }
  }

  Future<Visitor?> registerVisitor(Map<String, dynamic> data) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final visitor = await _repository.registerVisitor(data);
      final stats = await _repository.getVisitorStats();
      state = state.copyWith(
        visitors: <Visitor>[visitor, ...state.visitors],
        stats: stats,
        isLoading: false,
      );
      return visitor;
    } catch (error) {
      state = state.copyWith(isLoading: false, error: _mapError(error));
      return null;
    }
  }

  Future<void> refresh() async {
    await loadVisitors();
  }

  Future<void> replaceVisitor(Visitor visitor) async {
    final nextVisitors = state.visitors.where((item) => item.id != visitor.id).toList()
      ..insert(0, visitor);
    state = state.copyWith(visitors: nextVisitors);
    try {
      final stats = await _repository.getVisitorStats();
      state = state.copyWith(stats: stats);
    } catch (_) {
      // Keep the local visitor update even if the stats refresh fails.
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
