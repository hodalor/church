import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/member_repository.dart';
import '../data/models/member.dart';

class MembersState {
  const MembersState({
    required this.members,
    required this.isLoading,
    required this.page,
    required this.totalPages,
    required this.searchQuery,
    this.error,
    this.isLoadingMore = false,
  });

  const MembersState.initial()
      : members = const <Member>[],
        isLoading = false,
        page = 1,
        totalPages = 1,
        searchQuery = '',
        error = null,
        isLoadingMore = false;

  final List<Member> members;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final int page;
  final int totalPages;
  final String searchQuery;

  bool get hasMore => page < totalPages;

  MembersState copyWith({
    List<Member>? members,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    bool clearError = false,
    int? page,
    int? totalPages,
    String? searchQuery,
  }) {
    return MembersState(
      members: members ?? this.members,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: clearError ? null : error ?? this.error,
      page: page ?? this.page,
      totalPages: totalPages ?? this.totalPages,
      searchQuery: searchQuery ?? this.searchQuery,
    );
  }
}

final memberRepositoryProvider = Provider<MemberRepository>((ref) {
  return MemberRepository(
    dio: ref.watch(dioProvider),
    storage: ref.watch(secureStorageProvider),
  );
});

final membersProvider = StateNotifierProvider<MembersNotifier, MembersState>((ref) {
  return MembersNotifier(
    repository: ref.watch(memberRepositoryProvider),
  );
});

class MembersNotifier extends StateNotifier<MembersState> {
  MembersNotifier({
    required MemberRepository repository,
  })  : _repository = repository,
        super(const MembersState.initial());

  final MemberRepository _repository;

  Future<void> loadMembers({String? query}) async {
    final nextQuery = query ?? state.searchQuery;

    state = state.copyWith(
      isLoading: true,
      isLoadingMore: false,
      page: 1,
      totalPages: 1,
      searchQuery: nextQuery,
      clearError: true,
    );

    try {
      final response = await _repository.getMembers(page: 1, limit: 20, search: nextQuery);
      state = state.copyWith(
        members: response.members,
        isLoading: false,
        page: response.page,
        totalPages: response.totalPages,
        searchQuery: nextQuery,
        clearError: true,
      );
    } catch (error) {
      state = state.copyWith(
        isLoading: false,
        error: _mapError(error),
        searchQuery: nextQuery,
      );
    }
  }

  Future<void> loadMore() async {
    if (state.isLoading || state.isLoadingMore || !state.hasMore) {
      return;
    }

    state = state.copyWith(isLoadingMore: true, clearError: true);

    try {
      final response = await _repository.getMembers(
        page: state.page + 1,
        limit: 20,
        search: state.searchQuery,
      );

      state = state.copyWith(
        members: <Member>[...state.members, ...response.members],
        isLoadingMore: false,
        page: response.page,
        totalPages: response.totalPages,
      );
    } catch (error) {
      state = state.copyWith(
        isLoadingMore: false,
        error: _mapError(error),
      );
    }
  }

  Future<void> search(String query) async {
    await loadMembers(query: query);
  }

  Future<void> refresh() async {
    await loadMembers(query: state.searchQuery);
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
