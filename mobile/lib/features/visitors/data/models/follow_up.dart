class FollowUp {
  const FollowUp({
    required this.followUpId,
    this.scheduledAt,
    this.completedAt,
    this.method,
    this.outcome,
    this.notes,
    this.completedBy,
    this.isCompleted = false,
  });

  final String followUpId;
  final DateTime? scheduledAt;
  final DateTime? completedAt;
  final String? method;
  final String? outcome;
  final String? notes;
  final String? completedBy;
  final bool isCompleted;

  bool get isOverdue {
    if (isCompleted || scheduledAt == null) {
      return false;
    }
    return scheduledAt!.isBefore(DateTime.now());
  }

  factory FollowUp.fromJson(Map<String, dynamic> json) {
    return FollowUp(
      followUpId: (json['followUpId'] ?? json['id'] ?? json['_id'] ?? '').toString(),
      scheduledAt: json['scheduledAt'] != null
          ? DateTime.tryParse(json['scheduledAt'].toString())
          : json['scheduledDate'] != null
              ? DateTime.tryParse(json['scheduledDate'].toString())
              : null,
      completedAt: json['completedAt'] != null
          ? DateTime.tryParse(json['completedAt'].toString())
          : null,
      method: json['method']?.toString(),
      outcome: json['outcome']?.toString(),
      notes: json['notes']?.toString(),
      completedBy: json['completedBy'] is Map<String, dynamic>
          ? (json['completedBy']['name'] ?? json['completedBy']['userId'])?.toString()
          : json['completedBy']?.toString(),
      isCompleted: json['isCompleted'] == true || json['status'] == 'completed',
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'followUpId': followUpId,
      'scheduledAt': scheduledAt?.toIso8601String(),
      'completedAt': completedAt?.toIso8601String(),
      'method': method,
      'outcome': outcome,
      'notes': notes,
      'completedBy': completedBy,
      'isCompleted': isCompleted,
    };
  }
}
