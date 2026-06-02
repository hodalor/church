class TokenPair {
  const TokenPair({
    required this.accessToken,
    required this.refreshToken,
  });

  final String accessToken;
  final String refreshToken;

  factory TokenPair.fromJson(Map<String, dynamic> json) {
    return TokenPair(
      accessToken: (json['accessToken'] ?? '').toString(),
      refreshToken: (json['refreshToken'] ?? '').toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'accessToken': accessToken,
      'refreshToken': refreshToken,
    };
  }
}
