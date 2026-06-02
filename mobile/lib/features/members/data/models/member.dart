import 'health_score.dart';

class GpsCoordinates {
  const GpsCoordinates({
    this.lat,
    this.lng,
  });

  final double? lat;
  final double? lng;

  factory GpsCoordinates.fromJson(Map<String, dynamic> json) {
    double? parseValue(dynamic value) {
      if (value is num) {
        return value.toDouble();
      }
      return double.tryParse(value?.toString() ?? '');
    }

    return GpsCoordinates(
      lat: parseValue(json['lat']),
      lng: parseValue(json['lng']),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'lat': lat,
      'lng': lng,
    };
  }

  GpsCoordinates copyWith({
    double? lat,
    double? lng,
  }) {
    return GpsCoordinates(
      lat: lat ?? this.lat,
      lng: lng ?? this.lng,
    );
  }
}

class MemberChild {
  const MemberChild({
    required this.name,
    this.dateOfBirth,
  });

  final String name;
  final DateTime? dateOfBirth;

  factory MemberChild.fromJson(Map<String, dynamic> json) {
    return MemberChild(
      name: (json['name'] ?? '').toString(),
      dateOfBirth: json['dateOfBirth'] != null
          ? DateTime.tryParse(json['dateOfBirth'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'name': name,
      'dateOfBirth': dateOfBirth?.toIso8601String(),
    };
  }

  MemberChild copyWith({
    String? name,
    DateTime? dateOfBirth,
  }) {
    return MemberChild(
      name: name ?? this.name,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
    );
  }
}

class EmergencyContact {
  const EmergencyContact({
    this.name,
    this.phone,
    this.relationship,
  });

  final String? name;
  final String? phone;
  final String? relationship;

  factory EmergencyContact.fromJson(Map<String, dynamic> json) {
    return EmergencyContact(
      name: json['name']?.toString(),
      phone: json['phone']?.toString(),
      relationship: json['relationship']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'name': name,
      'phone': phone,
      'relationship': relationship,
    };
  }

  EmergencyContact copyWith({
    String? name,
    String? phone,
    String? relationship,
  }) {
    return EmergencyContact(
      name: name ?? this.name,
      phone: phone ?? this.phone,
      relationship: relationship ?? this.relationship,
    );
  }
}

class Member {
  const Member({
    required this.tenantId,
    required this.memberId,
    required this.firstName,
    required this.lastName,
    required this.healthScore,
    this.otherName,
    this.gender,
    this.dateOfBirth,
    this.photoUrl,
    this.phone,
    this.altPhone,
    this.email,
    this.address,
    this.city,
    this.country,
    this.gpsCoordinates,
    this.membershipStatus,
    this.membershipDate,
    this.baptismStatus,
    this.baptismDate,
    this.branch,
    this.department = const <String>[],
    this.cellGroup,
    this.salvationDate,
    this.bibleSchool = false,
    this.maritalStatus,
    this.spouseMemberId,
    this.children = const <MemberChild>[],
    this.familyGroupId,
    this.occupation,
    this.employer,
    this.isActive = true,
    this.isDeleted = false,
    this.emergencyContact,
    this.qrCode,
    this.digitalCardUrl,
    this.notes,
    this.tags = const <String>[],
    this.createdBy,
    this.updatedBy,
    this.createdAt,
    this.updatedAt,
  });

  final String tenantId;
  final String memberId;
  final String firstName;
  final String lastName;
  final String? otherName;
  final String? gender;
  final DateTime? dateOfBirth;
  final String? photoUrl;
  final String? phone;
  final String? altPhone;
  final String? email;
  final String? address;
  final String? city;
  final String? country;
  final GpsCoordinates? gpsCoordinates;
  final String? membershipStatus;
  final DateTime? membershipDate;
  final String? baptismStatus;
  final DateTime? baptismDate;
  final String? branch;
  final List<String> department;
  final String? cellGroup;
  final DateTime? salvationDate;
  final bool bibleSchool;
  final String? maritalStatus;
  final String? spouseMemberId;
  final List<MemberChild> children;
  final String? familyGroupId;
  final String? occupation;
  final String? employer;
  final bool isActive;
  final bool isDeleted;
  final EmergencyContact? emergencyContact;
  final String? qrCode;
  final String? digitalCardUrl;
  final HealthScore healthScore;
  final String? notes;
  final List<String> tags;
  final String? createdBy;
  final String? updatedBy;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  String get fullName => '$firstName $lastName';

  String get initials {
    final first = firstName.isNotEmpty ? firstName[0] : '';
    final last = lastName.isNotEmpty ? lastName[0] : '';
    return '$first$last'.toUpperCase();
  }

  factory Member.fromJson(Map<String, dynamic> json) {
    return Member(
      tenantId: (json['tenantId'] ?? '').toString(),
      memberId: (json['memberId'] ?? '').toString(),
      firstName: (json['firstName'] ?? '').toString(),
      lastName: (json['lastName'] ?? '').toString(),
      otherName: json['otherName']?.toString(),
      gender: json['gender']?.toString(),
      dateOfBirth: json['dateOfBirth'] != null
          ? DateTime.tryParse(json['dateOfBirth'].toString())
          : null,
      photoUrl: json['photoUrl']?.toString(),
      phone: json['phone']?.toString(),
      altPhone: json['altPhone']?.toString(),
      email: json['email']?.toString(),
      address: json['address']?.toString(),
      city: json['city']?.toString(),
      country: json['country']?.toString(),
      gpsCoordinates: json['gpsCoordinates'] is Map<String, dynamic>
          ? GpsCoordinates.fromJson(json['gpsCoordinates'] as Map<String, dynamic>)
          : null,
      membershipStatus: json['membershipStatus']?.toString(),
      membershipDate: json['membershipDate'] != null
          ? DateTime.tryParse(json['membershipDate'].toString())
          : null,
      baptismStatus: json['baptismStatus']?.toString(),
      baptismDate: json['baptismDate'] != null
          ? DateTime.tryParse(json['baptismDate'].toString())
          : null,
      branch: json['branch']?.toString(),
      department: (json['department'] as List<dynamic>? ?? const <dynamic>[])
          .map((item) => item.toString())
          .toList(),
      cellGroup: json['cell_group']?.toString(),
      salvationDate: json['salvationDate'] != null
          ? DateTime.tryParse(json['salvationDate'].toString())
          : null,
      bibleSchool: json['bibleSchool'] == true,
      maritalStatus: json['maritalStatus']?.toString(),
      spouseMemberId: json['spouseMemberId']?.toString(),
      children: (json['children'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<Map<String, dynamic>>()
          .map(MemberChild.fromJson)
          .toList(),
      familyGroupId: json['familyGroupId']?.toString(),
      occupation: json['occupation']?.toString(),
      employer: json['employer']?.toString(),
      isActive: json['isActive'] != false,
      isDeleted: json['isDeleted'] == true,
      emergencyContact: json['emergencyContact'] is Map<String, dynamic>
          ? EmergencyContact.fromJson(json['emergencyContact'] as Map<String, dynamic>)
          : null,
      qrCode: json['qrCode']?.toString(),
      digitalCardUrl: json['digitalCardUrl']?.toString(),
      healthScore: json['healthScore'] is Map<String, dynamic>
          ? HealthScore.fromJson(json['healthScore'] as Map<String, dynamic>)
          : const HealthScore(
              overall: 0,
              attendance: 0,
              giving: 0,
              participation: 0,
              involvement: 0,
              status: HealthScoreStatus.newMember,
            ),
      notes: json['notes']?.toString(),
      tags: (json['tags'] as List<dynamic>? ?? const <dynamic>[])
          .map((item) => item.toString())
          .toList(),
      createdBy: json['createdBy']?.toString(),
      updatedBy: json['updatedBy']?.toString(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'tenantId': tenantId,
      'memberId': memberId,
      'firstName': firstName,
      'lastName': lastName,
      'otherName': otherName,
      'gender': gender,
      'dateOfBirth': dateOfBirth?.toIso8601String(),
      'photoUrl': photoUrl,
      'phone': phone,
      'altPhone': altPhone,
      'email': email,
      'address': address,
      'city': city,
      'country': country,
      'gpsCoordinates': gpsCoordinates?.toJson(),
      'membershipStatus': membershipStatus,
      'membershipDate': membershipDate?.toIso8601String(),
      'baptismStatus': baptismStatus,
      'baptismDate': baptismDate?.toIso8601String(),
      'branch': branch,
      'department': department,
      'cell_group': cellGroup,
      'salvationDate': salvationDate?.toIso8601String(),
      'bibleSchool': bibleSchool,
      'maritalStatus': maritalStatus,
      'spouseMemberId': spouseMemberId,
      'children': children.map((child) => child.toJson()).toList(),
      'familyGroupId': familyGroupId,
      'occupation': occupation,
      'employer': employer,
      'isActive': isActive,
      'isDeleted': isDeleted,
      'emergencyContact': emergencyContact?.toJson(),
      'qrCode': qrCode,
      'digitalCardUrl': digitalCardUrl,
      'healthScore': healthScore.toJson(),
      'notes': notes,
      'tags': tags,
      'createdBy': createdBy,
      'updatedBy': updatedBy,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  Member copyWith({
    String? tenantId,
    String? memberId,
    String? firstName,
    String? lastName,
    String? otherName,
    String? gender,
    DateTime? dateOfBirth,
    String? photoUrl,
    String? phone,
    String? altPhone,
    String? email,
    String? address,
    String? city,
    String? country,
    GpsCoordinates? gpsCoordinates,
    String? membershipStatus,
    DateTime? membershipDate,
    String? baptismStatus,
    DateTime? baptismDate,
    String? branch,
    List<String>? department,
    String? cellGroup,
    DateTime? salvationDate,
    bool? bibleSchool,
    String? maritalStatus,
    String? spouseMemberId,
    List<MemberChild>? children,
    String? familyGroupId,
    String? occupation,
    String? employer,
    bool? isActive,
    bool? isDeleted,
    EmergencyContact? emergencyContact,
    String? qrCode,
    String? digitalCardUrl,
    HealthScore? healthScore,
    String? notes,
    List<String>? tags,
    String? createdBy,
    String? updatedBy,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Member(
      tenantId: tenantId ?? this.tenantId,
      memberId: memberId ?? this.memberId,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      otherName: otherName ?? this.otherName,
      gender: gender ?? this.gender,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      photoUrl: photoUrl ?? this.photoUrl,
      phone: phone ?? this.phone,
      altPhone: altPhone ?? this.altPhone,
      email: email ?? this.email,
      address: address ?? this.address,
      city: city ?? this.city,
      country: country ?? this.country,
      gpsCoordinates: gpsCoordinates ?? this.gpsCoordinates,
      membershipStatus: membershipStatus ?? this.membershipStatus,
      membershipDate: membershipDate ?? this.membershipDate,
      baptismStatus: baptismStatus ?? this.baptismStatus,
      baptismDate: baptismDate ?? this.baptismDate,
      branch: branch ?? this.branch,
      department: department ?? this.department,
      cellGroup: cellGroup ?? this.cellGroup,
      salvationDate: salvationDate ?? this.salvationDate,
      bibleSchool: bibleSchool ?? this.bibleSchool,
      maritalStatus: maritalStatus ?? this.maritalStatus,
      spouseMemberId: spouseMemberId ?? this.spouseMemberId,
      children: children ?? this.children,
      familyGroupId: familyGroupId ?? this.familyGroupId,
      occupation: occupation ?? this.occupation,
      employer: employer ?? this.employer,
      isActive: isActive ?? this.isActive,
      isDeleted: isDeleted ?? this.isDeleted,
      emergencyContact: emergencyContact ?? this.emergencyContact,
      qrCode: qrCode ?? this.qrCode,
      digitalCardUrl: digitalCardUrl ?? this.digitalCardUrl,
      healthScore: healthScore ?? this.healthScore,
      notes: notes ?? this.notes,
      tags: tags ?? this.tags,
      createdBy: createdBy ?? this.createdBy,
      updatedBy: updatedBy ?? this.updatedBy,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
