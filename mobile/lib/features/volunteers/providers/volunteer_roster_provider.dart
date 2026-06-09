import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/models/assignment.dart';
import '../data/models/roster.dart';
import '../data/models/volunteer.dart';
import '../data/volunteer_repository.dart';

class RosterState {
  const RosterState({
    required this.upcomingRosters,
    required this.myAssignments,
    required this.isLoading,
    required this.error,
  });

  const RosterState.initial()
      : upcomingRosters = const <Roster>[],
        myAssignments = const <Assignment>[],
        isLoading = false,
        error = null;

  final List<Roster> upcomingRosters;
  final List<Assignment> myAssignments;
  final bool isLoading;
  final String? error;

  RosterState copyWith({
    List<Roster>? upcomingRosters,
    List<Assignment>? myAssignments,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return RosterState(
      upcomingRosters: upcomingRosters ?? this.upcomingRosters,
      myAssignments: myAssignments ?? this.myAssignments,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : error ?? this.error,
    );
  }
}

final volunteerRepositoryProvider = Provider<VolunteerRepository>((ref) {
  return VolunteerRepository(
    dio: ref.watch(dioProvider),
    storage: ref.watch(secureStorageProvider),
  );
});

final myVolunteerProfileProvider = FutureProvider<Volunteer?>((ref) async {
  final user = ref.watch(authProvider).user;
  Assignment.currentMemberId = user?.memberId;
  return ref.watch(volunteerRepositoryProvider).getMyVolunteerProfile();
});

final volunteerRosterProvider =
    StateNotifierProvider<VolunteerRosterNotifier, RosterState>((ref) {
  final user = ref.watch(authProvider).user;
  Assignment.currentMemberId = user?.memberId;
  return VolunteerRosterNotifier(
    repository: ref.watch(volunteerRepositoryProvider),
  );
});

class VolunteerRosterNotifier extends StateNotifier<RosterState> {
  VolunteerRosterNotifier({required VolunteerRepository repository})
      : _repository = repository,
        super(const RosterState.initial()) {
    loadRosters();
  }

  final VolunteerRepository _repository;

  Future<void> loadRosters() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final rosters = await _repository.getUpcomingRosters();
      final myAssignments = rosters
          .map((roster) => roster.myAssignment)
          .whereType<Assignment>()
          .toList();
      state = state.copyWith(
        upcomingRosters: rosters,
        myAssignments: myAssignments,
        isLoading: false,
        clearError: true,
      );
    } catch (error) {
      state = state.copyWith(
        isLoading: false,
        error: _mapError(error),
      );
    }
  }

  Future<void> confirmAssignment(String assignmentId) async {
    final roster = _findRosterByAssignment(assignmentId);
    if (roster == null) {
      return;
    }

    await _repository.updateAssignmentStatus(
      roster.rosterId,
      assignmentId,
      'confirmed',
    );
    await loadRosters();
  }

  Future<void> declineAssignment(String assignmentId, {String? reason}) async {
    final roster = _findRosterByAssignment(assignmentId);
    if (roster == null) {
      return;
    }

    await _repository.updateAssignmentStatus(
      roster.rosterId,
      assignmentId,
      'declined',
      declinedReason: reason,
    );
    await loadRosters();
  }

  Future<void> refresh() => loadRosters();

  Roster? _findRosterByAssignment(String assignmentId) {
    for (final roster in state.upcomingRosters) {
      final matched = roster.assignments.any((item) => item.assignmentId == assignmentId);
      if (matched) {
        return roster;
      }
    }
    return null;
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
