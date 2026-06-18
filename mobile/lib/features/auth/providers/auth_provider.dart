import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/auth_session_notifier.dart';
import '../../../core/storage/secure_storage.dart';
import '../data/auth_repository.dart';
import '../data/models/user_profile.dart';

class AuthState {
  const AuthState({
    required this.isLoading,
    required this.isAuthenticated,
    this.user,
    this.error,
  });

  const AuthState.initial()
      : isLoading = true,
        isAuthenticated = false,
        user = null,
        error = null;

  final bool isLoading;
  final bool isAuthenticated;
  final UserProfile? user;
  final String? error;

  AuthState copyWith({
    bool? isLoading,
    bool? isAuthenticated,
    UserProfile? user,
    String? error,
    bool clearError = false,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      user: user ?? this.user,
      error: clearError ? null : error ?? this.error,
    );
  }
}

final secureStorageProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService();
});

final dioProvider = Provider<Dio>((ref) {
  final storage = ref.watch(secureStorageProvider);
  return ApiClient(storage).create();
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    dio: ref.watch(dioProvider),
  );
});

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(
    repository: ref.watch(authRepositoryProvider),
    storage: ref.watch(secureStorageProvider),
  );
});

final authRouterRefreshProvider = Provider<AuthRouterNotifier>((ref) {
  final notifier = AuthRouterNotifier();

  ref.listen<AuthState>(authProvider, (_, __) {
    notifier.refresh();
  });

  return notifier;
});

class AuthRouterNotifier extends ChangeNotifier {
  void refresh() {
    notifyListeners();
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier({
    required AuthRepository repository,
    required SecureStorageService storage,
  })  : _repository = repository,
        _storage = storage,
        super(const AuthState.initial()) {
    AuthSessionNotifier.instance.addListener(_handleSessionFailure);
    hydrate();
  }

  final AuthRepository _repository;
  final SecureStorageService _storage;

  Future<void> hydrate() async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final accessToken = await _storage
          .getAccessToken()
          .timeout(const Duration(seconds: 3), onTimeout: () => null);
      final user = await _storage
          .getUserProfile()
          .timeout(const Duration(seconds: 3), onTimeout: () => null);
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: accessToken != null && accessToken.isNotEmpty,
        user: user,
        clearError: true,
      );
    } catch (error) {
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: false,
        error: error.toString(),
      );
    }
  }

  Future<String?> login({
    required String tenantId,
    required String username,
    required String pin,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final response = await _repository.login(
        tenantId: tenantId,
        username: username,
        pin: pin,
      );

      await _storage.saveAccessToken(response.accessToken);
      await _storage.saveRefreshToken(response.refreshToken);
      await _storage.saveTenantId(response.user.tenantId);
      await _storage.saveUserProfile(response.user);

      state = state.copyWith(
        isLoading: false,
        isAuthenticated: true,
        user: response.user,
        clearError: true,
      );

      return response.user.role;
    } catch (error) {
      String message = 'Unable to sign in right now.';

      if (error is DioException) {
        final responseData = error.response?.data;
        if (responseData is Map<String, dynamic> && responseData['message'] != null) {
          message = responseData['message'].toString();
        } else if (error.message != null && error.message!.isNotEmpty) {
          message = error.message!;
        }
      } else {
        message = error.toString();
      }

      state = state.copyWith(
        isLoading: false,
        isAuthenticated: false,
        error: message,
      );

      return null;
    }
  }

  Future<void> logout() async {
    try {
      final refreshToken = await _storage.getRefreshToken();
      await _repository.logout(refreshToken: refreshToken);
    } catch (_) {
      // The local session should still be cleared even if the API call fails.
    } finally {
      await _storage.clearAll();
      state = const AuthState.initial().copyWith(
        isLoading: false,
        isAuthenticated: false,
        user: null,
        clearError: true,
      );
    }
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }

  void _handleSessionFailure() {
    state = const AuthState.initial().copyWith(
      isLoading: false,
      isAuthenticated: false,
      user: null,
      clearError: true,
    );
  }

  @override
  void dispose() {
    AuthSessionNotifier.instance.removeListener(_handleSessionFailure);
    super.dispose();
  }
}
