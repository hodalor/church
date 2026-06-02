import 'token_pair.dart';
import 'user_profile.dart';

class AuthResponse extends TokenPair {
  const AuthResponse({
    required super.accessToken,
    required super.refreshToken,
    required this.user,
  });

  final UserProfile user;

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      accessToken: (json['accessToken'] ?? '').toString(),
      refreshToken: (json['refreshToken'] ?? '').toString(),
      user: UserProfile.fromJson(
        (json['user'] as Map<String, dynamic>?) ?? <String, dynamic>{},
      ),
    );
  }

  @override
  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'accessToken': accessToken,
      'refreshToken': refreshToken,
      'user': user.toJson(),
    };
  }
}
