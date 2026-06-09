class VolunteerBadge {
  const VolunteerBadge({
    required this.name,
    this.earnedDate,
  });

  final String name;
  final DateTime? earnedDate;

  factory VolunteerBadge.fromJson(dynamic value) {
    if (value is Map<String, dynamic>) {
      return VolunteerBadge(
        name: (value['name'] ?? value['badge'] ?? '').toString(),
        earnedDate: value['earnedDate'] != null
            ? DateTime.tryParse(value['earnedDate'].toString())
            : null,
      );
    }

    return VolunteerBadge(name: value?.toString() ?? '');
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'name': name,
      'earnedDate': earnedDate?.toIso8601String(),
    };
  }
}

class VolunteerPerformance {
  const VolunteerPerformance({
    required this.reliabilityScore,
    required this.attended,
    required this.absent,
    required this.totalAssignments,
    required this.badges,
    this.lastServedDate,
  });

  final double reliabilityScore;
  final int attended;
  final int absent;
  final int totalAssignments;
  final List<VolunteerBadge> badges;
  final DateTime? lastServedDate;

  factory VolunteerPerformance.fromJson(Map<String, dynamic> json) {
    return VolunteerPerformance(
      reliabilityScore: (json['reliabilityScore'] is num)
          ? (json['reliabilityScore'] as num).toDouble()
          : double.tryParse(json['reliabilityScore']?.toString() ?? '') ?? 0,
      attended: (json['attended'] is num)
          ? (json['attended'] as num).toInt()
          : int.tryParse(json['attended']?.toString() ?? '') ?? 0,
      absent: (json['absent'] is num)
          ? (json['absent'] as num).toInt()
          : int.tryParse(json['absent']?.toString() ?? '') ?? 0,
      totalAssignments: (json['totalAssignments'] is num)
          ? (json['totalAssignments'] as num).toInt()
          : int.tryParse(json['totalAssignments']?.toString() ?? '') ?? 0,
      badges: (json['badges'] as List<dynamic>? ?? const <dynamic>[])
          .map(VolunteerBadge.fromJson)
          .toList(),
      lastServedDate: json['lastServedDate'] != null
          ? DateTime.tryParse(json['lastServedDate'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'reliabilityScore': reliabilityScore,
      'attended': attended,
      'absent': absent,
      'totalAssignments': totalAssignments,
      'badges': badges.map((item) => item.toJson()).toList(),
      'lastServedDate': lastServedDate?.toIso8601String(),
    };
  }
}

class Volunteer {
  const Volunteer({
    required this.id,
    required this.memberId,
    required this.memberName,
    required this.departments,
    required this.primaryDepartment,
    required this.skills,
    required this.status,
    required this.performance,
    this.memberPhoto,
    this.memberPhone,
    this.supervisorId,
    this.availability,
    this.notes,
    this.createdAt,
  });

  final String id;
  final String memberId;
  final String memberName;
  final String? memberPhoto;
  final String? memberPhone;
  final List<String> departments;
  final String primaryDepartment;
  final List<String> skills;
  final String status;
  final String? supervisorId;
  final Map<String, dynamic>? availability;
  final String? notes;
  final VolunteerPerformance performance;
  final DateTime? createdAt;

  factory Volunteer.fromJson(Map<String, dynamic> json) {
    return Volunteer(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      memberId: (json['memberId'] ?? '').toString(),
      memberName: (json['memberName'] ?? '').toString(),
      memberPhoto: json['memberPhoto']?.toString(),
      memberPhone: json['memberPhone']?.toString(),
      departments: (json['departments'] as List<dynamic>? ?? const <dynamic>[])
          .map((item) => item.toString())
          .toList(),
      primaryDepartment: (json['primaryDepartment'] ?? '').toString(),
      skills: (json['skills'] as List<dynamic>? ?? const <dynamic>[])
          .map((item) => item.toString())
          .toList(),
      status: (json['status'] ?? 'active').toString(),
      supervisorId: json['supervisorId']?.toString(),
      availability: json['availability'] is Map<String, dynamic>
          ? Map<String, dynamic>.from(json['availability'] as Map<String, dynamic>)
          : null,
      notes: json['notes']?.toString(),
      performance: json['performance'] is Map<String, dynamic>
          ? VolunteerPerformance.fromJson(json['performance'] as Map<String, dynamic>)
          : const VolunteerPerformance(
              reliabilityScore: 0,
              attended: 0,
              absent: 0,
              totalAssignments: 0,
              badges: <VolunteerBadge>[],
            ),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      '_id': id,
      'memberId': memberId,
      'memberName': memberName,
      'memberPhoto': memberPhoto,
      'memberPhone': memberPhone,
      'departments': departments,
      'primaryDepartment': primaryDepartment,
      'skills': skills,
      'status': status,
      'supervisorId': supervisorId,
      'availability': availability,
      'notes': notes,
      'performance': performance.toJson(),
      'createdAt': createdAt?.toIso8601String(),
    };
  }
}
