import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/connectivity_service.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/analytics_repository.dart';
import '../data/models/ai_insight.dart';
import '../data/models/branch_comparison.dart';
import '../data/models/hq_overview.dart';

final analyticsRepositoryProvider = Provider<AnalyticsRepository>((ref) {
  return AnalyticsRepository(dio: ref.watch(dioProvider));
});

final hqOverviewProvider = FutureProvider<HQOverview>((ref) async {
  ref.watch(connectivityRefreshTickProvider);
  return ref.watch(analyticsRepositoryProvider).getHQOverview();
});

final branchComparisonProvider = FutureProvider<BranchComparison>((ref) async {
  ref.watch(connectivityRefreshTickProvider);
  return ref.watch(analyticsRepositoryProvider).getBranchComparison();
});

final memberIntelligenceProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  ref.watch(connectivityRefreshTickProvider);
  return ref.watch(analyticsRepositoryProvider).getMemberIntelligence();
});

final financialIntelligenceProvider =
    FutureProvider<Map<String, dynamic>>((ref) async {
  ref.watch(connectivityRefreshTickProvider);
  return ref.watch(analyticsRepositoryProvider).getFinancialIntelligence();
});

final growthIntelligenceProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  ref.watch(connectivityRefreshTickProvider);
  return ref.watch(analyticsRepositoryProvider).getGrowthTrends();
});

final operationalHealthProvider =
    FutureProvider<Map<String, dynamic>>((ref) async {
  ref.watch(connectivityRefreshTickProvider);
  return ref.watch(analyticsRepositoryProvider).getOperationalHealth();
});

class InsightsState {
  const InsightsState({
    required this.items,
    required this.isLoading,
    required this.error,
    required this.filter,
  });

  const InsightsState.initial()
      : items = const <AiInsight>[],
        isLoading = false,
        error = null,
        filter = 'all';

  final List<AiInsight> items;
  final bool isLoading;
  final String? error;
  final String filter;

  int get unreadCount => items.where((item) => !item.isRead).length;

  InsightsState copyWith({
    List<AiInsight>? items,
    bool? isLoading,
    String? error,
    String? filter,
    bool clearError = false,
  }) {
    return InsightsState(
      items: items ?? this.items,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : error ?? this.error,
      filter: filter ?? this.filter,
    );
  }
}

final insightsProvider =
    StateNotifierProvider<InsightsNotifier, InsightsState>((ref) {
  return InsightsNotifier(repository: ref.watch(analyticsRepositoryProvider));
});

class InsightsNotifier extends StateNotifier<InsightsState> {
  InsightsNotifier({required AnalyticsRepository repository})
      : _repository = repository,
        super(const InsightsState.initial()) {
    load();
  }

  final AnalyticsRepository _repository;

  Future<void> load({String filter = 'all'}) async {
    state = state.copyWith(
      isLoading: true,
      filter: filter,
      clearError: true,
    );

    try {
      final params = <String, dynamic>{
        if (filter != 'all') 'severity': filter,
      };
      final items = await _repository.getAllInsights(params: params);
      state = state.copyWith(
        items: items,
        isLoading: false,
        filter: filter,
      );
    } catch (error) {
      var message = error.toString();
      if (error is DioException) {
        final payload = error.response?.data;
        if (payload is Map<String, dynamic> && payload['message'] != null) {
          message = payload['message'].toString();
        }
      }
      state = state.copyWith(isLoading: false, error: message);
    }
  }

  Future<void> refresh() => load(filter: state.filter);

  Future<void> markRead(String id) async {
    final previous = state.items;
    state = state.copyWith(
      items: previous
          .map((item) => item.id == id ? item.copyWith(isRead: true) : item)
          .toList(),
    );

    try {
      await _repository.markInsightRead(id);
    } catch (_) {
      state = state.copyWith(items: previous);
    }
  }

  Future<void> markActioned(String id) async {
    final previous = state.items;
    state = state.copyWith(
      items: previous
          .map(
            (item) => item.id == id ? item.copyWith(isActioned: true) : item,
          )
          .toList(),
    );

    try {
      await _repository.markInsightActioned(id);
    } catch (_) {
      state = state.copyWith(items: previous);
    }
  }

  Future<void> markAllRead() async {
    final unreadIds =
        state.items.where((item) => !item.isRead).map((item) => item.id).toList();
    for (final id in unreadIds) {
      await markRead(id);
    }
  }
}
