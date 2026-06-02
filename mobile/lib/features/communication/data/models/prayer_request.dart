import 'package:flutter/material.dart';
import '../../../../core/utils/app_colors.dart';

class PrayerRequest {
  const PrayerRequest({
    required this.requestId,
    required this.memberId,
    required this.memberName,
    required this.isAnonymous,
    required this.title,
    required this.description,
    required this.category,
    required this.urgency,
    required this.isPublic,
    required this.status,
    this.assignedTo,
    required this.prayerCount,
    this.testimonial,
    required this.createdAt,
  });

  final String requestId;
  final String? memberId;
  final String? memberName;
  final bool isAnonymous;
  final String? title;
  final String description;
  final String category;
  final String urgency;
  final bool isPublic;
  final String status;
  final String? assignedTo;
  final int prayerCount;
  final String? testimonial;
  final DateTime? createdAt;

  Color get urgencyColor {
    switch (urgency.toLowerCase()) {
      case 'critical':
        return AppColors.danger;
      case 'urgent':
        return AppColors.accent;
      default:
        return AppColors.mutedText;
    }
  }

  factory PrayerRequest.fromJson(Map<String, dynamic> json) {
    final assigned = json['assignedTo'];

    return PrayerRequest(
      requestId: (json['requestId'] ?? json['_id'] ?? '').toString(),
      memberId: json['memberId']?.toString(),
      memberName: json['memberName']?.toString(),
      isAnonymous: json['isAnonymous'] == true,
      title: json['title']?.toString(),
      description: (json['description'] ?? '').toString(),
      category: (json['category'] ?? 'Other').toString(),
      urgency: (json['urgency'] ?? 'normal').toString(),
      isPublic: json['isPublic'] == true,
      status: (json['status'] ?? 'open').toString(),
      assignedTo: assigned is Map<String, dynamic>
          ? (assigned['name'] ?? assigned['userId'])?.toString()
          : assigned?.toString(),
      prayerCount: int.tryParse((json['prayerCount'] ?? 0).toString()) ?? 0,
      testimonial: json['testimonial']?.toString(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'requestId': requestId,
      'memberId': memberId,
      'memberName': memberName,
      'isAnonymous': isAnonymous,
      'title': title,
      'description': description,
      'category': category,
      'urgency': urgency,
      'isPublic': isPublic,
      'status': status,
      'assignedTo': assignedTo,
      'prayerCount': prayerCount,
      'testimonial': testimonial,
      'createdAt': createdAt?.toIso8601String(),
    };
  }

  PrayerRequest copyWith({
    int? prayerCount,
    String? status,
    String? assignedTo,
    String? testimonial,
  }) {
    return PrayerRequest(
      requestId: requestId,
      memberId: memberId,
      memberName: memberName,
      isAnonymous: isAnonymous,
      title: title,
      description: description,
      category: category,
      urgency: urgency,
      isPublic: isPublic,
      status: status ?? this.status,
      assignedTo: assignedTo ?? this.assignedTo,
      prayerCount: prayerCount ?? this.prayerCount,
      testimonial: testimonial ?? this.testimonial,
      createdAt: createdAt,
    );
  }
}
