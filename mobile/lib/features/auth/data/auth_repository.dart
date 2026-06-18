import 'package:dio/dio.dart';
import '../../../core/api/endpoints.dart';
import 'models/auth_response.dart';
import 'models/token_pair.dart';
import 'models/user_profile.dart';

class AuthRepository {
  AuthRepository({
    required Dio dio,
  }) : _dio = dio;

  final Dio _dio;

  Future<AuthResponse> login({
    required String tenantId,
    required String username,
    required String pin,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      Endpoints.login,
      data: <String, dynamic>{
        'tenantId': tenantId,
        'username': username,
        'pin': pin,
      },
    );

    final payload = response.data?['data'] is Map<String, dynamic>
        ? response.data!['data'] as Map<String, dynamic>
        : (response.data ?? <String, dynamic>{});

    return AuthResponse.fromJson(payload);
  }

  Future<TokenPair> refreshToken(String refreshToken) async {
    final response = await _dio.post<Map<String, dynamic>>(
      Endpoints.refresh,
      data: <String, dynamic>{'refreshToken': refreshToken},
    );

    final payload = response.data?['data'] is Map<String, dynamic>
        ? response.data!['data'] as Map<String, dynamic>
        : (response.data ?? <String, dynamic>{});

    return TokenPair.fromJson(payload);
  }

  Future<void> logout({String? refreshToken}) async {
    await _dio.post<void>(
      Endpoints.logout,
      data: <String, dynamic>{
        if (refreshToken != null && refreshToken.isNotEmpty)
          'refreshToken': refreshToken,
      },
    );
  }

  Future<UserProfile> getMe() async {
    final response = await _dio.get<Map<String, dynamic>>(Endpoints.me);
    final payload = response.data?['data'] is Map<String, dynamic>
        ? response.data!['data'] as Map<String, dynamic>
        : (response.data ?? <String, dynamic>{});

    return UserProfile.fromJson(payload);
  }

  Future<void> updateFcmToken(String? fcmToken) async {
    await _dio.patch<void>(
      Endpoints.updateFcmToken,
      data: <String, dynamic>{
        'fcmToken': fcmToken,
      },
    );
  }
}
