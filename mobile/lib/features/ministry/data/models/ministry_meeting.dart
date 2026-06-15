class ActionPoint {
  const ActionPoint({
    required this.task,
    this.assignedTo,
    this.dueDate,
    this.isCompleted = false,
  });

  final String task;
  final String? assignedTo;
  final DateTime? dueDate;
  final bool isCompleted;

  factory ActionPoint.fromJson(Map<String, dynamic> json) {
    return ActionPoint(
      task: (json['task'] ?? '').toString(),
      assignedTo: json['assignedTo']?.toString(),
      dueDate: json['dueDate'] != null ? DateTime.tryParse(json['dueDate'].toString()) : null,
      isCompleted: json['isCompleted'] == true,
    );
  }
}

class MinistryMeeting {
  const MinistryMeeting({
    required this.meetingId,
    required this.ministryId,
    required this.title,
    required this.date,
    this.agenda,
    this.minutes,
    this.attendanceCount = 0,
    this.status = 'scheduled',
    this.actionPoints = const <ActionPoint>[],
    this.startTime,
    this.venue,
  });

  final String meetingId;
  final String ministryId;
  final String title;
  final DateTime date;
  final String? agenda;
  final String? minutes;
  final int attendanceCount;
  final String status;
  final List<ActionPoint> actionPoints;
  final String? startTime;
  final String? venue;

  factory MinistryMeeting.fromJson(Map<String, dynamic> json) {
    return MinistryMeeting(
      meetingId: (json['meetingId'] ?? '').toString(),
      ministryId: (json['ministryId'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      date: DateTime.tryParse((json['date'] ?? '').toString()) ?? DateTime.now(),
      agenda: json['agenda']?.toString(),
      minutes: json['minutes']?.toString(),
      attendanceCount: json['attendanceCount'] is num ? (json['attendanceCount'] as num).toInt() : int.tryParse(json['attendanceCount']?.toString() ?? '') ?? 0,
      status: (json['status'] ?? 'scheduled').toString(),
      actionPoints: (json['actionPoints'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<Map<String, dynamic>>()
          .map(ActionPoint.fromJson)
          .toList(),
      startTime: json['startTime']?.toString(),
      venue: json['venue']?.toString(),
    );
  }
}
