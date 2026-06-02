class UserProfile {
  const UserProfile({
    required this.userId,
    required this.tenantId,
    required this.username,
    required this.role,
    this.memberId,
    this.fullName,
    this.photoUrl,
  });

  final String userId;
  final String tenantId;
  final String username;
  final String role;
  final String? memberId;
  final String? fullName;
  final String? photoUrl;

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      userId: (json['userId'] ?? json['_id'] ?? '').toString(),
      tenantId: (json['tenantId'] ?? '').toString(),
      username: (json['username'] ?? '').toString(),
      role: (json['role'] ?? '').toString(),
      memberId: json['memberId']?.toString(),
      fullName: json['fullName']?.toString(),
      photoUrl: json['photoUrl']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'userId': userId,
      'tenantId': tenantId,
      'username': username,
      'role': role,
      'memberId': memberId,
      'fullName': fullName,
      'photoUrl': photoUrl,
    };
  }
}
