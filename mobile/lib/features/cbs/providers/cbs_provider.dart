import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/cbs_repository.dart';
import '../data/models/cbs_group.dart';
import '../data/models/cbs_prospect.dart';

class CBSState {
  const CBSState({
    this.group,
    this.prospects = const <CBSProspect>[],
    this.isLoading = false,
    this.error,
    this.stats = const <String, dynamic>{},
  });

  final CBSGroup? group;
  final List<CBSProspect> prospects;
  final bool isLoading;
  final String? error;
  final Map<String, dynamic> stats;

  CBSState copyWith({
    CBSGroup? group,
    bool clearGroup = false,
    List<CBSProspect>? prospects,
    bool? isLoading,
    String? error,
    bool clearError = false,
    Map<String, dynamic>? stats,
  }) {
    return CBSState(
      group: clearGroup ? null : group ?? this.group,
      prospects: prospects ?? this.prospects,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : error ?? this.error,
      stats: stats ?? this.stats,
    );
  }
}

final cbsProvider = StateNotifierProvider<CBSNotifier, CBSState>((ref) {
  return CBSNotifier(repository: ref.watch(cbsRepositoryProvider));
});

class CBSNotifier extends StateNotifier<CBSState> {
  CBSNotifier({required CBSRepository repository})
      : _repository = repository,
        super(const CBSState()) {
    loadMyGroup();
  }

  final CBSRepository _repository;

  Future<void> loadMyGroup() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final results = await Future.wait<dynamic>(<Future<dynamic>>[
        _repository.getMyGroup(),
        _repository.getCBSStats(),
      ]);
      final group = results[0] as CBSGroup?;
      state = state.copyWith(
        group: group,
        clearGroup: group == null,
        stats: results[1] as Map<String, dynamic>,
        isLoading: false,
      );
      if (group != null) {
        await loadProspects(group.groupId);
      }
    } catch (error) {
      state = state.copyWith(
        isLoading: false,
        error: _mapError(error),
      );
    }
  }

  Future<void> loadProspects([String? groupId]) async {
    final resolvedGroupId = groupId ?? state.group?.groupId;
    if (resolvedGroupId == null || resolvedGroupId.isEmpty) {
      return;
    }

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final prospects = await _repository.getGroupProspects(resolvedGroupId);
      state = state.copyWith(
        prospects: prospects,
        isLoading: false,
      );
    } catch (error) {
      state = state.copyWith(
        isLoading: false,
        error: _mapError(error),
      );
    }
  }

  Future<CBSProspect?> addProspect(Map<String, dynamic> data) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final prospect = await _repository.addProspect(data);
      state = state.copyWith(
        isLoading: false,
        prospects: <CBSProspect>[prospect, ...state.prospects],
      );
      return prospect;
    } catch (error) {
      state = state.copyWith(isLoading: false, error: _mapError(error));
      return null;
    }
  }

  Future<CBSProspect?> updateStage(String id, String stage) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final prospect = await _repository.updateStudyStage(id, stage);
      final next = state.prospects.where((item) => item.prospectId != id).toList()
        ..insert(0, prospect);
      state = state.copyWith(isLoading: false, prospects: next);
      return prospect;
    } catch (error) {
      state = state.copyWith(isLoading: false, error: _mapError(error));
      return null;
    }
  }

  Future<void> recordSession(String groupId, Map<String, dynamic> data) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _repository.recordSession(groupId, data);
      state = state.copyWith(isLoading: false);
    } catch (error) {
      state = state.copyWith(isLoading: false, error: _mapError(error));
    }
  }

  String _mapError(Object error) {
    if (error is DioException) {
      final payload = error.response?.data;
      if (payload is Map<String, dynamic> && payload['message'] != null) {
        return payload['message'].toString();
      }
      if ((error.message ?? '').isNotEmpty) {
        return error.message!;
      }
    }
    return error.toString();
  }
}
