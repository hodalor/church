import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/communication_repository.dart';
import '../data/models/poll.dart';
import '../data/models/poll_option.dart';
import 'inbox_provider.dart';

class PollsState {
  const PollsState({
    required this.polls,
    required this.closedPolls,
    required this.isLoading,
    required this.error,
  });

  const PollsState.initial()
      : polls = const <Poll>[],
        closedPolls = const <Poll>[],
        isLoading = false,
        error = null;

  final List<Poll> polls;
  final List<Poll> closedPolls;
  final bool isLoading;
  final String? error;

  PollsState copyWith({
    List<Poll>? polls,
    List<Poll>? closedPolls,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return PollsState(
      polls: polls ?? this.polls,
      closedPolls: closedPolls ?? this.closedPolls,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : error ?? this.error,
    );
  }
}

final pollsProvider = StateNotifierProvider<PollsNotifier, PollsState>((ref) {
  return PollsNotifier(
    repository: ref.watch(communicationRepositoryProvider),
  );
});

class PollsNotifier extends StateNotifier<PollsState> {
  PollsNotifier({
    required CommunicationRepository repository,
  })  : _repository = repository,
        super(const PollsState.initial());

  final CommunicationRepository _repository;

  Future<void> loadPolls() async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final active = await _repository.getActivePolls();
      final closed = await _repository.getClosedPolls();
      state = state.copyWith(
        polls: active,
        closedPolls: closed,
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

  Future<void> vote(String pollId, String optionId) async {
    final previous = state.polls;
    state = state.copyWith(
      polls: previous
          .map((poll) => poll.pollId == pollId ? _applyOptimisticVote(poll, optionId) : poll)
          .toList(),
    );

    try {
      await _repository.castVote(pollId, optionId);
    } catch (error) {
      state = state.copyWith(
        polls: previous,
        error: _mapError(error),
      );
    }
  }

  Poll _applyOptimisticVote(Poll poll, String optionId) {
    final nextTotal = poll.totalVotes + 1;
    final updatedOptions = poll.options.map((option) {
      final nextVotes = option.id == optionId ? option.votes + 1 : option.votes;
      final nextPercentage = nextTotal > 0
          ? ((nextVotes / nextTotal) * 100).toDouble()
          : 0.0;
      return PollOption(
        id: option.id,
        text: option.text,
        votes: nextVotes,
        percentage: nextPercentage,
      );
    }).toList();

    return poll.copyWith(
      options: updatedOptions,
      totalVotes: nextTotal,
      hasVoted: true,
      userVoteOptionId: optionId,
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
