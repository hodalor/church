import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'auth_session_notifier.dart';
import 'endpoints.dart';
import '../storage/secure_storage.dart';

class ApiClient {
  ApiClient(this._storage);

  final SecureStorageService _storage;
  bool _isRefreshing = false;

  String _resolveBaseUrl() {
    final configuredBaseUrl = dotenv.env['API_BASE_URL']?.trim();

    if (configuredBaseUrl != null && configuredBaseUrl.isNotEmpty) {
      return configuredBaseUrl.replaceFirst(RegExp(r'/$'), '');
    }

    if (kIsWeb) {
      return 'http://localhost:5000';
    }

    if (Platform.isAndroid) {
      return 'http://10.0.2.2:5000';
    }

    return 'http://localhost:5000';
  }

  Dio create() {
    final baseUrl = _resolveBaseUrl();

    final dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 20),
        receiveTimeout: const Duration(seconds: 20),
        sendTimeout: const Duration(seconds: 20),
        headers: <String, dynamic>{
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.getAccessToken();
          final tenantId = await _storage.getTenantId();
          final skipAuth = options.extra['skipAuth'] == true;
          final skipTenant = options.extra['skipTenant'] == true;

          if (!skipAuth && token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }

          if (!skipTenant && tenantId != null && tenantId.isNotEmpty) {
            options.headers['X-Tenant-ID'] = tenantId;
          }

          return handler.next(options);
        },
        onError: (error, handler) async {
          final request = error.requestOptions;
          final statusCode = error.response?.statusCode;
          final isUnauthorized = statusCode == 401;
          final isRefreshRequest = request.path.contains(Endpoints.refresh);
          final isLogoutRequest = request.path.contains(Endpoints.logout);

          if (!isUnauthorized || isRefreshRequest || isLogoutRequest || request.extra['retried'] == true) {
            return handler.next(error);
          }

          if (_isRefreshing) {
            return handler.next(error);
          }

          _isRefreshing = true;

          try {
            final refreshToken = await _storage.getRefreshToken();
            final tenantId = await _storage.getTenantId();

            if (refreshToken == null || refreshToken.isEmpty) {
              throw Exception('Missing refresh token');
            }

            final refreshDio = Dio(
              BaseOptions(
                baseUrl: baseUrl,
                headers: <String, dynamic>{
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  if (tenantId != null && tenantId.isNotEmpty) 'X-Tenant-ID': tenantId,
                },
              ),
            );

            final refreshResponse = await refreshDio.post<Map<String, dynamic>>(
              Endpoints.refresh,
              data: <String, dynamic>{'refreshToken': refreshToken},
            );

            final payload = refreshResponse.data?['data'] is Map<String, dynamic>
                ? refreshResponse.data!['data'] as Map<String, dynamic>
                : (refreshResponse.data ?? <String, dynamic>{});

            final nextAccessToken = (payload['accessToken'] ?? '').toString();
            final nextRefreshToken =
                (payload['refreshToken'] ?? refreshToken).toString();

            if (nextAccessToken.isEmpty) {
              throw Exception('Refresh response missing access token');
            }

            await _storage.saveAccessToken(nextAccessToken);
            await _storage.saveRefreshToken(nextRefreshToken);

            request.headers['Authorization'] = 'Bearer $nextAccessToken';
            request.extra['retried'] = true;

            final response = await dio.fetch(request);
            return handler.resolve(response);
          } catch (_) {
            await _storage.clearAll();
            AuthSessionNotifier.instance.notifySignedOut();
            return handler.next(error);
          } finally {
            _isRefreshing = false;
          }
        },
      ),
    );

    return dio;
  }
}
