import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dart:convert';
import '../../features/auth/data/models/user_profile.dart';

class SecureStorageService {
  SecureStorageService({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
            );

  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _tenantIdKey = 'tenant_id';
  static const _userProfileKey = 'user_profile';

  final FlutterSecureStorage _storage;

  Future<void> saveAccessToken(String token) =>
      _storage.write(key: _accessTokenKey, value: token);

  Future<void> saveRefreshToken(String token) =>
      _storage.write(key: _refreshTokenKey, value: token);

  Future<void> saveTenantId(String tenantId) =>
      _storage.write(key: _tenantIdKey, value: tenantId);

  Future<void> saveUserProfile(UserProfile user) =>
      _storage.write(key: _userProfileKey, value: jsonEncode(user.toJson()));

  Future<String?> getAccessToken() => _storage.read(key: _accessTokenKey);

  Future<String?> getRefreshToken() => _storage.read(key: _refreshTokenKey);

  Future<String?> getTenantId() => _storage.read(key: _tenantIdKey);

  Future<UserProfile?> getUserProfile() async {
    final raw = await _storage.read(key: _userProfileKey);
    if (raw == null || raw.isEmpty) {
      return null;
    }

    return UserProfile.fromJson(jsonDecode(raw) as Map<String, dynamic>);
  }

  Future<void> clearAll() => _storage.deleteAll();
}
