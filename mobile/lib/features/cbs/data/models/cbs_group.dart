class CBSSchedule {
  const CBSSchedule({
    this.frequency,
    this.dayOfWeek,
    this.time,
    this.notes,
  });

  final String? frequency;
  final int? dayOfWeek;
  final String? time;
  final String? notes;

  factory CBSSchedule.fromJson(Map<String, dynamic> json) {
    return CBSSchedule(
      frequency: json['frequency']?.toString(),
      dayOfWeek: json['dayOfWeek'] is num ? (json['dayOfWeek'] as num).toInt() : int.tryParse(json['dayOfWeek']?.toString() ?? ''),
      time: json['time']?.toString(),
      notes: json['notes']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'frequency': frequency,
      'dayOfWeek': dayOfWeek,
      'time': time,
      'notes': notes,
    };
  }
}

class CBSGroup {
  const CBSGroup({
    required this.groupId,
    required this.name,
    this.code,
    this.type,
    this.leaderId,
    this.leaderName,
    this.coLeaderId,
    this.coLeaderName,
    this.supervisorId,
    this.location,
    this.zone,
    this.branch,
    this.meetingSchedule = const CBSSchedule(),
    this.prospectCount = 0,
    this.studyCount = 0,
    this.convertedCount = 0,
    this.studyMaterial,
    this.isActive = true,
  });

  final String groupId;
  final String name;
  final String? code;
  final String? type;
  final String? leaderId;
  final String? leaderName;
  final String? coLeaderId;
  final String? coLeaderName;
  final String? supervisorId;
  final String? location;
  final String? zone;
  final String? branch;
  final CBSSchedule meetingSchedule;
  final int prospectCount;
  final int studyCount;
  final int convertedCount;
  final String? studyMaterial;
  final bool isActive;

  factory CBSGroup.fromJson(Map<String, dynamic> json) {
    return CBSGroup(
      groupId: (json['groupId'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      code: json['code']?.toString(),
      type: json['type']?.toString(),
      leaderId: json['leaderId']?.toString(),
      leaderName: json['leaderName']?.toString(),
      coLeaderId: json['coLeaderId']?.toString(),
      coLeaderName: json['coLeaderName']?.toString(),
      supervisorId: json['supervisorId']?.toString(),
      location: json['location']?.toString(),
      zone: json['zone']?.toString(),
      branch: json['branch']?.toString(),
      meetingSchedule: json['meetingSchedule'] is Map<String, dynamic>
          ? CBSSchedule.fromJson(json['meetingSchedule'] as Map<String, dynamic>)
          : const CBSSchedule(),
      prospectCount: json['prospectCount'] is num ? (json['prospectCount'] as num).toInt() : int.tryParse(json['prospectCount']?.toString() ?? '') ?? 0,
      studyCount: json['studyCount'] is num ? (json['studyCount'] as num).toInt() : int.tryParse(json['studyCount']?.toString() ?? '') ?? 0,
      convertedCount: json['convertedCount'] is num ? (json['convertedCount'] as num).toInt() : int.tryParse(json['convertedCount']?.toString() ?? '') ?? 0,
      studyMaterial: json['studyMaterial']?.toString(),
      isActive: json['isActive'] != false,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'groupId': groupId,
      'name': name,
      'code': code,
      'type': type,
      'leaderId': leaderId,
      'leaderName': leaderName,
      'coLeaderId': coLeaderId,
      'coLeaderName': coLeaderName,
      'supervisorId': supervisorId,
      'location': location,
      'zone': zone,
      'branch': branch,
      'meetingSchedule': meetingSchedule.toJson(),
      'prospectCount': prospectCount,
      'studyCount': studyCount,
      'convertedCount': convertedCount,
      'studyMaterial': studyMaterial,
      'isActive': isActive,
    };
  }
}
