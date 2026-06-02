class AttendanceRecord {
  const AttendanceRecord({
    required this.attendanceId,
    required this.serviceId,
    required this.serviceDate,
    this.memberId,
    this.memberName,
    required this.attendeeType,
    required this.checkInMethod,
    this.checkInTime,
    this.branch,
    required this.isChild,
    this.visitorName,
    this.pickupCode,
    this.serviceTitle,
    this.photoUrl,
  });

  final String attendanceId;
  final String serviceId;
  final DateTime? serviceDate;
  final String? memberId;
  final String? memberName;
  final String attendeeType;
  final String checkInMethod;
  final DateTime? checkInTime;
  final String? branch;
  final bool isChild;
  final String? visitorName;
  final String? pickupCode;
  final String? serviceTitle;
  final String? photoUrl;

  String get displayName =>
      memberName ?? visitorName ?? memberId ?? 'Attendee';

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) {
    return AttendanceRecord(
      attendanceId: (json['attendanceId'] ?? json['id'] ?? json['_id'] ?? '')
          .toString(),
      serviceId: (json['serviceId'] ?? '').toString(),
      serviceDate: json['serviceDate'] != null
          ? DateTime.tryParse(json['serviceDate'].toString())
          : json['date'] != null
              ? DateTime.tryParse(json['date'].toString())
              : null,
      memberId: json['memberId']?.toString(),
      memberName: json['memberName']?.toString(),
      attendeeType: (json['attendeeType'] ??
              json['type'] ??
              (json['isChild'] == true ? 'child' : 'member'))
          .toString(),
      checkInMethod:
          (json['checkInMethod'] ?? json['method'] ?? 'manual').toString(),
      checkInTime: json['checkInTime'] != null
          ? DateTime.tryParse(json['checkInTime'].toString())
          : json['checkedInAt'] != null
              ? DateTime.tryParse(json['checkedInAt'].toString())
              : null,
      branch: json['branch']?.toString(),
      isChild: json['isChild'] == true || json['attendeeType'] == 'child',
      visitorName: json['visitorName']?.toString(),
      pickupCode: json['pickupCode']?.toString(),
      serviceTitle: json['serviceTitle']?.toString(),
      photoUrl: json['photoUrl']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'attendanceId': attendanceId,
      'serviceId': serviceId,
      'serviceDate': serviceDate?.toIso8601String(),
      'memberId': memberId,
      'memberName': memberName,
      'attendeeType': attendeeType,
      'checkInMethod': checkInMethod,
      'checkInTime': checkInTime?.toIso8601String(),
      'branch': branch,
      'isChild': isChild,
      'visitorName': visitorName,
      'pickupCode': pickupCode,
      'serviceTitle': serviceTitle,
      'photoUrl': photoUrl,
    };
  }
}
