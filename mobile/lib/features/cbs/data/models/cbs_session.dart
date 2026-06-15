class CBSSessionAttendee {
  const CBSSessionAttendee({
    this.prospectId,
    this.prospectName,
    this.isFirstTime = false,
  });

  final String? prospectId;
  final String? prospectName;
  final bool isFirstTime;

  factory CBSSessionAttendee.fromJson(Map<String, dynamic> json) {
    return CBSSessionAttendee(
      prospectId: json['prospectId']?.toString(),
      prospectName: json['prospectName']?.toString(),
      isFirstTime: json['isFirstTime'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'prospectId': prospectId,
      'prospectName': prospectName,
      'isFirstTime': isFirstTime,
    };
  }
}

class CBSSession {
  const CBSSession({
    required this.sessionId,
    required this.groupId,
    this.groupName,
    required this.date,
    this.startTime,
    this.duration,
    this.venue,
    this.conductedBy,
    this.studyTopic,
    this.studyReference,
    this.curriculum,
    this.attendees = const <CBSSessionAttendee>[],
    this.attendanceCount = 0,
    this.guestsCount = 0,
    this.outcomes = const <String>[],
    this.leaderNotes,
    this.nextSessionDate,
    this.isPendingSync = false,
  });

  final String sessionId;
  final String groupId;
  final String? groupName;
  final DateTime date;
  final String? startTime;
  final int? duration;
  final String? venue;
  final String? conductedBy;
  final String? studyTopic;
  final String? studyReference;
  final String? curriculum;
  final List<CBSSessionAttendee> attendees;
  final int attendanceCount;
  final int guestsCount;
  final List<String> outcomes;
  final String? leaderNotes;
  final DateTime? nextSessionDate;
  final bool isPendingSync;

  factory CBSSession.fromJson(Map<String, dynamic> json) {
    return CBSSession(
      sessionId: (json['sessionId'] ?? json['id'] ?? '').toString(),
      groupId: (json['groupId'] ?? '').toString(),
      groupName: json['groupName']?.toString(),
      date: DateTime.tryParse((json['date'] ?? '').toString()) ?? DateTime.now(),
      startTime: json['startTime']?.toString(),
      duration: json['duration'] is num ? (json['duration'] as num).toInt() : int.tryParse(json['duration']?.toString() ?? ''),
      venue: json['venue']?.toString(),
      conductedBy: json['conductedBy']?.toString(),
      studyTopic: (json['studyTopic'] ?? json['topic'])?.toString(),
      studyReference: json['studyReference']?.toString(),
      curriculum: json['curriculum']?.toString(),
      attendees: (json['attendees'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<Map<String, dynamic>>()
          .map(CBSSessionAttendee.fromJson)
          .toList(),
      attendanceCount: json['attendanceCount'] is num ? (json['attendanceCount'] as num).toInt() : int.tryParse(json['attendanceCount']?.toString() ?? '') ?? 0,
      guestsCount: json['guestsCount'] is num ? (json['guestsCount'] as num).toInt() : int.tryParse(json['guestsCount']?.toString() ?? '') ?? 0,
      outcomes: (json['outcomes'] as List<dynamic>? ?? const <dynamic>[])
          .map((item) => item.toString())
          .toList(),
      leaderNotes: json['leaderNotes']?.toString(),
      nextSessionDate: json['nextSessionDate'] != null ? DateTime.tryParse(json['nextSessionDate'].toString()) : null,
      isPendingSync: json['isPendingSync'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'sessionId': sessionId,
      'groupId': groupId,
      'groupName': groupName,
      'date': date.toIso8601String(),
      'startTime': startTime,
      'duration': duration,
      'venue': venue,
      'conductedBy': conductedBy,
      'studyTopic': studyTopic,
      'studyReference': studyReference,
      'curriculum': curriculum,
      'attendees': attendees.map((item) => item.toJson()).toList(),
      'attendanceCount': attendanceCount,
      'guestsCount': guestsCount,
      'outcomes': outcomes,
      'leaderNotes': leaderNotes,
      'nextSessionDate': nextSessionDate?.toIso8601String(),
      'isPendingSync': isPendingSync,
    };
  }
}
