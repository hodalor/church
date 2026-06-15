import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'sync_service.dart';

class ConnectivityState {
  const ConnectivityState({
    required this.isOnline,
    this.justReconnected = false,
  });

  final bool isOnline;
  final bool justReconnected;

  ConnectivityState copyWith({
    bool? isOnline,
    bool? justReconnected,
  }) {
    return ConnectivityState(
      isOnline: isOnline ?? this.isOnline,
      justReconnected: justReconnected ?? this.justReconnected,
    );
  }
}

final connectivityRefreshTickProvider = StateProvider<int>((ref) => 0);

final connectivityProvider =
    StateNotifierProvider<ConnectivityNotifier, ConnectivityState>((ref) {
  return ConnectivityNotifier(ref);
});

class ConnectivityNotifier extends StateNotifier<ConnectivityState> {
  ConnectivityNotifier(this._ref)
      : _connectivity = Connectivity(),
        super(const ConnectivityState(isOnline: true)) {
    _bootstrap();
  }

  final Ref _ref;
  final Connectivity _connectivity;
  StreamSubscription<List<ConnectivityResult>>? _subscription;

  Future<void> _bootstrap() async {
    final current = await _connectivity.checkConnectivity();
    await _apply(current);
    _subscription = _connectivity.onConnectivityChanged.listen((results) {
      unawaited(_apply(results));
    });
  }

  Future<void> _apply(List<ConnectivityResult> results) async {
    final isOnline = !results.contains(ConnectivityResult.none);
    final reconnected = !state.isOnline && isOnline;
    state = ConnectivityState(
      isOnline: isOnline,
      justReconnected: reconnected,
    );

    await _ref.read(syncServiceProvider).refreshStatus(isOnline: isOnline);

    if (reconnected) {
      _ref.read(connectivityRefreshTickProvider.notifier).state++;
      unawaited(_ref.read(syncServiceProvider).syncAll());
    }
  }

  void clearReconnectFlag() {
    if (state.justReconnected) {
      state = state.copyWith(justReconnected: false);
    }
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}
