class Assignment {
  const Assignment({
    required this.assignmentId,
    required this.volunteerId,
    required this.memberId,
    required this.memberName,
    required this.department,
    required this.role,
    required this.status,
    this.memberPhoto,
    this.confirmedAt,
    this.declinedReason,
    this.notes,
    this.availability,
  });

  static String? currentMemberId;

  final String assignmentId;
  final String volunteerId;
  final String memberId;
  final String memberName;
  final String? memberPhoto;
  final String department;
  final String role;
  final String status;
  final DateTime? confirmedAt;
  final String? declinedReason;
  final String? notes;
  final Map<String, dynamic>? availability;

  bool get isMyAssignment =>
      currentMemberId != null &&
      currentMemberId!.isNotEmpty &&
      currentMemberId == memberId;

  factory Assignment.fromJson(Map<String, dynamic> json) {
    return Assignment(
      assignmentId: (json['assignmentId'] ?? json['_id'] ?? '').toString(),
      volunteerId: (json['volunteerId'] ?? '').toString(),
      memberId: (json['memberId'] ?? '').toString(),
      memberName: (json['memberName'] ?? '').toString(),
      memberPhoto: json['memberPhoto']?.toString(),
      department: (json['department'] ?? '').toString(),
      role: (json['role'] ?? '').toString(),
      status: (json['status'] ?? 'assigned').toString(),
      confirmedAt: json['confirmedAt'] != null
          ? DateTime.tryParse(json['confirmedAt'].toString())
          : null,
      declinedReason: json['declinedReason']?.toString(),
      notes: json['notes']?.toString(),
      availability: json['availability'] is Map<String, dynamic>
          ? Map<String, dynamic>.from(json['availability'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'assignmentId': assignmentId,
      'volunteerId': volunteerId,
      'memberId': memberId,
      'memberName': memberName,
      'memberPhoto': memberPhoto,
      'department': department,
      'role': role,
      'status': status,
      'confirmedAt': confirmedAt?.toIso8601String(),
      'declinedReason': declinedReason,
      'notes': notes,
      'availability': availability,
    };
  }
}
