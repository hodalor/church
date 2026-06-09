import 'assignment.dart';

class Roster {
  const Roster({
    required this.rosterId,
    required this.title,
    required this.date,
    required this.assignments,
    required this.isPublished,
    this.serviceId,
    this.eventId,
    this.branch,
  });

  final String rosterId;
  final String title;
  final DateTime? date;
  final List<Assignment> assignments;
  final bool isPublished;
  final String? serviceId;
  final String? eventId;
  final String? branch;

  Assignment? get myAssignment {
    try {
      return assignments.firstWhere((item) => item.isMyAssignment);
    } catch (_) {
      return null;
    }
  }

  factory Roster.fromJson(Map<String, dynamic> json) {
    return Roster(
      rosterId: (json['rosterId'] ?? json['_id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      date: json['date'] != null
          ? DateTime.tryParse(json['date'].toString())
          : null,
      assignments: (json['assignments'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<Map<String, dynamic>>()
          .map(Assignment.fromJson)
          .toList(),
      isPublished: json['isPublished'] == true,
      serviceId: json['serviceId']?.toString(),
      eventId: json['eventId']?.toString(),
      branch: json['branch']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'rosterId': rosterId,
      'title': title,
      'date': date?.toIso8601String(),
      'assignments': assignments.map((item) => item.toJson()).toList(),
      'isPublished': isPublished,
      'serviceId': serviceId,
      'eventId': eventId,
      'branch': branch,
    };
  }
}
