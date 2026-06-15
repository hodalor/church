import 'package:flutter/material.dart';

import '../../../../core/utils/app_colors.dart';

class MinistrySchedule {
  const MinistrySchedule({
    this.frequency,
    this.dayOfWeek,
    this.time,
    this.venue,
    this.notes,
  });

  final String? frequency;
  final int? dayOfWeek;
  final String? time;
  final String? venue;
  final String? notes;

  factory MinistrySchedule.fromJson(Map<String, dynamic> json) {
    return MinistrySchedule(
      frequency: json['frequency']?.toString(),
      dayOfWeek: json['dayOfWeek'] is num ? (json['dayOfWeek'] as num).toInt() : int.tryParse(json['dayOfWeek']?.toString() ?? ''),
      time: json['time']?.toString(),
      venue: json['venue']?.toString(),
      notes: json['notes']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'frequency': frequency,
      'dayOfWeek': dayOfWeek,
      'time': time,
      'venue': venue,
      'notes': notes,
    };
  }
}

class Ministry {
  const Ministry({
    required this.ministryId,
    required this.name,
    required this.type,
    this.code,
    this.leaderId,
    this.leaderName,
    this.memberCount = 0,
    this.meetingSchedule = const MinistrySchedule(),
    this.isActive = true,
    this.logoUrl,
    this.description,
    this.vision,
    this.branch,
    this.currentFocus,
    this.annualGoals = const <String>[],
    this.memberRole,
    this.joinedAt,
    this.nextMeetingAt,
  });

  final String ministryId;
  final String name;
  final String type;
  final String? code;
  final String? leaderId;
  final String? leaderName;
  final int memberCount;
  final MinistrySchedule meetingSchedule;
  final bool isActive;
  final String? logoUrl;
  final String? description;
  final String? vision;
  final String? branch;
  final String? currentFocus;
  final List<String> annualGoals;
  final String? memberRole;
  final DateTime? joinedAt;
  final DateTime? nextMeetingAt;

  factory Ministry.fromJson(Map<String, dynamic> json) {
    return Ministry(
      ministryId: (json['ministryId'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      type: (json['type'] ?? 'other').toString(),
      code: json['code']?.toString(),
      leaderId: json['leaderId']?.toString(),
      leaderName: json['leaderName']?.toString(),
      memberCount: json['memberCount'] is num ? (json['memberCount'] as num).toInt() : int.tryParse(json['memberCount']?.toString() ?? '') ?? 0,
      meetingSchedule: json['meetingSchedule'] is Map<String, dynamic>
          ? MinistrySchedule.fromJson(json['meetingSchedule'] as Map<String, dynamic>)
          : const MinistrySchedule(),
      isActive: json['isActive'] != false,
      logoUrl: json['logoUrl']?.toString(),
      description: json['description']?.toString(),
      vision: json['vision']?.toString(),
      branch: json['branch']?.toString(),
      currentFocus: json['currentFocus']?.toString(),
      annualGoals: (json['annualGoals'] as List<dynamic>? ?? const <dynamic>[])
          .map((item) => item.toString())
          .toList(),
      memberRole: json['memberRole']?.toString(),
      joinedAt: json['joinedAt'] != null ? DateTime.tryParse(json['joinedAt'].toString()) : null,
      nextMeetingAt: json['nextMeetingAt'] != null ? DateTime.tryParse(json['nextMeetingAt'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'ministryId': ministryId,
      'name': name,
      'type': type,
      'code': code,
      'leaderId': leaderId,
      'leaderName': leaderName,
      'memberCount': memberCount,
      'meetingSchedule': meetingSchedule.toJson(),
      'isActive': isActive,
      'logoUrl': logoUrl,
      'description': description,
      'vision': vision,
      'branch': branch,
      'currentFocus': currentFocus,
      'annualGoals': annualGoals,
      'memberRole': memberRole,
      'joinedAt': joinedAt?.toIso8601String(),
      'nextMeetingAt': nextMeetingAt?.toIso8601String(),
    };
  }

  IconData get typeIcon {
    switch (type) {
      case 'worship':
        return Icons.music_note_rounded;
      case 'youth':
        return Icons.groups_3_rounded;
      case 'children':
        return Icons.child_care_rounded;
      case 'women':
        return Icons.favorite_rounded;
      case 'men':
        return Icons.shield_rounded;
      case 'media':
        return Icons.camera_alt_rounded;
      case 'prayer':
        return Icons.volunteer_activism_rounded;
      case 'family':
        return Icons.family_restroom_rounded;
      case 'missions':
        return Icons.public_rounded;
      default:
        return Icons.handshake_rounded;
    }
  }

  Color get typeColor {
    switch (type) {
      case 'worship':
        return const Color(0xFF7C3AED);
      case 'youth':
        return const Color(0xFF2563EB);
      case 'children':
        return const Color(0xFFF59E0B);
      case 'women':
        return const Color(0xFFDB2777);
      case 'men':
        return AppColors.primary;
      case 'media':
        return const Color(0xFF0F766E);
      case 'prayer':
        return AppColors.accent;
      case 'family':
        return const Color(0xFF16A34A);
      default:
        return const Color(0xFF4F46E5);
    }
  }
}
