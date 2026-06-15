class MinistryMember {
  const MinistryMember({
    required this.ministryId,
    required this.memberId,
    required this.memberName,
    required this.role,
    this.joinedAt,
    this.status = 'active',
    this.memberPhoto,
  });

  final String ministryId;
  final String memberId;
  final String memberName;
  final String role;
  final DateTime? joinedAt;
  final String status;
  final String? memberPhoto;

  factory MinistryMember.fromJson(Map<String, dynamic> json) {
    return MinistryMember(
      ministryId: (json['ministryId'] ?? '').toString(),
      memberId: (json['memberId'] ?? '').toString(),
      memberName: (json['memberName'] ?? '').toString(),
      role: (json['role'] ?? 'member').toString(),
      joinedAt: json['joinedAt'] != null ? DateTime.tryParse(json['joinedAt'].toString()) : null,
      status: (json['status'] ?? 'active').toString(),
      memberPhoto: json['memberPhoto']?.toString(),
    );
  }
}
