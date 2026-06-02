import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/communication_repository.dart';
import '../data/models/inbox_message.dart';

class InboxState {
  const InboxState({
    required this.messages,
    required this.isLoading,
    required this.error,
    required this.unreadCount,
    required this.page,
    required this.hasMore,
    required this.filter,
    this.isLoadingMore = false,
  });

  const InboxState.initial()
      : messages = const <InboxMessage>[],
        isLoading = false,
        error = null,
        unreadCount = 0,
        page = 1,
        hasMore = true,
        filter = 'all',
        isLoadingMore = false;

  final List<InboxMessage> messages;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final int unreadCount;
  final int page;
  final bool hasMore;
  final String filter;

  InboxState copyWith({
    List<InboxMessage>? messages,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    bool clearError = false,
    int? unreadCount,
    int? page,
    bool? hasMore,
    String? filter,
  }) {
    return InboxState(
      messages: messages ?? this.messages,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: clearError ? null : error ?? this.error,
      unreadCount: unreadCount ?? this.unreadCount,
      page: page ?? this.page,
      hasMore: hasMore ?? this.hasMore,
      filter: filter ?? this.filter,
    );
  }
}

final communicationRepositoryProvider = Provider<CommunicationRepository>((ref) {
  return CommunicationRepository(dio: ref.watch(dioProvider));
});

final inboxRefreshTickProvider = StateProvider<int>((ref) => 0);

final unreadCountProvider = FutureProvider<int>((ref) async {
  ref.watch(inboxRefreshTickProvider);
  return ref.watch(communicationRepositoryProvider).getUnreadCount();
});

final inboxProvider = StateNotifierProvider<InboxNotifier, InboxState>((ref) {
  return InboxNotifier(
    repository: ref.watch(communicationRepositoryProvider),
    ref: ref,
  );
});

class InboxNotifier extends StateNotifier<InboxState> {
  InboxNotifier({
    required CommunicationRepository repository,
    required Ref ref,
  })  : _repository = repository,
        _ref = ref,
        super(const InboxState.initial()) {
    _timer = Timer.periodic(const Duration(seconds: 60), (_) async {
      _ref.read(inboxRefreshTickProvider.notifier).state++;
      await refresh();
    });
  }

  final CommunicationRepository _repository;
  final Ref _ref;
  Timer? _timer;

  Future<void> loadMessages({String filter = 'all'}) async {
    state = state.copyWith(
      isLoading: true,
      isLoadingMore: false,
      page: 1,
      hasMore: true,
      filter: filter,
      clearError: true,
    );

    try {
      final messages = await _repository.getInbox(page: 1, limit: 20);
      final unreadCount = await _repository.getUnreadCount();
      state = state.copyWith(
        messages: messages,
        isLoading: false,
        unreadCount: unreadCount,
        page: 1,
        hasMore: messages.length >= 20,
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

  Future<void> loadMore() async {
    if (state.isLoading || state.isLoadingMore || !state.hasMore) {
      return;
    }

    state = state.copyWith(isLoadingMore: true, clearError: true);

    try {
      final nextPage = state.page + 1;
      final nextBatch = await _repository.getInbox(page: nextPage, limit: 20);
      state = state.copyWith(
        messages: <InboxMessage>[...state.messages, ...nextBatch],
        isLoadingMore: false,
        page: nextPage,
        hasMore: nextBatch.length >= 20,
      );
    } catch (error) {
      state = state.copyWith(
        isLoadingMore: false,
        error: _mapError(error),
      );
    }
  }

  Future<void> markRead(String id) async {
    final previous = state.messages;
    final hadUnread = previous.any((item) => item.id == id && !item.isRead);
    state = state.copyWith(
      messages: previous
          .map((item) => item.id == id ? item.copyWith(isRead: true) : item)
          .toList(),
      unreadCount: hadUnread && state.unreadCount > 0
          ? state.unreadCount - 1
          : state.unreadCount,
    );

    try {
      await _repository.markAsRead(id);
      _ref.read(inboxRefreshTickProvider.notifier).state++;
    } catch (error) {
      state = state.copyWith(
        messages: previous,
        unreadCount: state.unreadCount + (hadUnread ? 1 : 0),
        error: _mapError(error),
      );
    }
  }

  Future<void> markAllRead() async {
    final previous = state.messages;
    state = state.copyWith(
      messages: previous.map((item) => item.copyWith(isRead: true)).toList(),
      unreadCount: 0,
    );

    try {
      await _repository.markAllAsRead();
      _ref.read(inboxRefreshTickProvider.notifier).state++;
    } catch (error) {
      state = state.copyWith(
        messages: previous,
        unreadCount: previous.where((item) => !item.isRead).length,
        error: _mapError(error),
      );
    }
  }

  Future<void> refresh() async {
    await loadMessages(filter: state.filter);
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

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}
