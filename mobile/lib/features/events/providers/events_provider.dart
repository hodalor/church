import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/event_repository.dart';
import '../data/models/event.dart';

class EventsState {
  const EventsState({
    required this.events,
    required this.isLoading,
    required this.error,
  });

  const EventsState.initial()
      : events = const <Event>[],
        isLoading = false,
        error = null;

  final List<Event> events;
  final bool isLoading;
  final String? error;

  EventsState copyWith({
    List<Event>? events,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return EventsState(
      events: events ?? this.events,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : error ?? this.error,
    );
  }
}

final eventRepositoryProvider = Provider<EventRepository>((ref) {
  return EventRepository(dio: ref.watch(dioProvider));
});

final eventsProvider = StateNotifierProvider<EventsNotifier, EventsState>((ref) {
  return EventsNotifier(repository: ref.watch(eventRepositoryProvider));
});

class EventsNotifier extends StateNotifier<EventsState> {
  EventsNotifier({required EventRepository repository})
      : _repository = repository,
        super(const EventsState.initial()) {
    loadEvents();
  }

  final EventRepository _repository;

  Future<void> loadEvents() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final events = await _repository.getAllEvents();
      state = state.copyWith(
        events: events..sort((a, b) {
          final left = a.startDate ?? DateTime(2100);
          final right = b.startDate ?? DateTime(2100);
          return left.compareTo(right);
        }),
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

  Future<void> refresh() => loadEvents();

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
