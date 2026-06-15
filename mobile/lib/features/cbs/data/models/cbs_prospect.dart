import 'package:flutter/material.dart';

import '../../../../core/utils/app_colors.dart';

class CBSProspect {
  const CBSProspect({
    required this.prospectId,
    required this.groupId,
    required this.firstName,
    required this.lastName,
    this.groupName,
    this.phone,
    this.email,
    this.gender,
    this.ageGroup,
    this.contactMethod,
    this.referredByMemberId,
    this.referredByName,
    this.firstContactDate,
    this.studyStage = 'initial_contact',
    this.studiesAttended = 0,
    this.studiesTotal = 0,
    this.lastStudyDate,
    this.nextStudyDate,
    this.baptismDate,
    this.convertedToMemberId,
    this.convertedAt,
    this.spiritualInterests = const <String>[],
    this.leaderNotes,
    this.lastContactDate,
    this.nextFollowUpDate,
    this.isActive = true,
  });

  final String prospectId;
  final String groupId;
  final String? groupName;
  final String firstName;
  final String lastName;
  final String? phone;
  final String? email;
  final String? gender;
  final String? ageGroup;
  final String? contactMethod;
  final String? referredByMemberId;
  final String? referredByName;
  final DateTime? firstContactDate;
  final String studyStage;
  final int studiesAttended;
  final int studiesTotal;
  final DateTime? lastStudyDate;
  final DateTime? nextStudyDate;
  final DateTime? baptismDate;
  final String? convertedToMemberId;
  final DateTime? convertedAt;
  final List<String> spiritualInterests;
  final String? leaderNotes;
  final DateTime? lastContactDate;
  final DateTime? nextFollowUpDate;
  final bool isActive;

  String get fullName => '$firstName $lastName';

  factory CBSProspect.fromJson(Map<String, dynamic> json) {
    return CBSProspect(
      prospectId: (json['prospectId'] ?? '').toString(),
      groupId: (json['groupId'] ?? '').toString(),
      groupName: json['groupName']?.toString(),
      firstName: (json['firstName'] ?? '').toString(),
      lastName: (json['lastName'] ?? '').toString(),
      phone: json['phone']?.toString(),
      email: json['email']?.toString(),
      gender: json['gender']?.toString(),
      ageGroup: json['ageGroup']?.toString(),
      contactMethod: json['contactMethod']?.toString(),
      referredByMemberId: json['referredByMemberId']?.toString(),
      referredByName: json['referredByName']?.toString(),
      firstContactDate: json['firstContactDate'] != null ? DateTime.tryParse(json['firstContactDate'].toString()) : null,
      studyStage: (json['studyStage'] ?? 'initial_contact').toString(),
      studiesAttended: json['studiesAttended'] is num ? (json['studiesAttended'] as num).toInt() : int.tryParse(json['studiesAttended']?.toString() ?? '') ?? 0,
      studiesTotal: json['studiesTotal'] is num ? (json['studiesTotal'] as num).toInt() : int.tryParse(json['studiesTotal']?.toString() ?? '') ?? 0,
      lastStudyDate: json['lastStudyDate'] != null ? DateTime.tryParse(json['lastStudyDate'].toString()) : null,
      nextStudyDate: json['nextStudyDate'] != null ? DateTime.tryParse(json['nextStudyDate'].toString()) : null,
      baptismDate: json['baptismDate'] != null ? DateTime.tryParse(json['baptismDate'].toString()) : null,
      convertedToMemberId: json['convertedToMemberId']?.toString(),
      convertedAt: json['convertedAt'] != null ? DateTime.tryParse(json['convertedAt'].toString()) : null,
      spiritualInterests: (json['spiritualInterests'] as List<dynamic>? ?? const <dynamic>[])
          .map((item) => item.toString())
          .toList(),
      leaderNotes: json['leaderNotes']?.toString(),
      lastContactDate: json['lastContactDate'] != null ? DateTime.tryParse(json['lastContactDate'].toString()) : null,
      nextFollowUpDate: json['nextFollowUpDate'] != null ? DateTime.tryParse(json['nextFollowUpDate'].toString()) : null,
      isActive: json['isActive'] != false,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'prospectId': prospectId,
      'groupId': groupId,
      'groupName': groupName,
      'firstName': firstName,
      'lastName': lastName,
      'phone': phone,
      'email': email,
      'gender': gender,
      'ageGroup': ageGroup,
      'contactMethod': contactMethod,
      'referredByMemberId': referredByMemberId,
      'referredByName': referredByName,
      'firstContactDate': firstContactDate?.toIso8601String(),
      'studyStage': studyStage,
      'studiesAttended': studiesAttended,
      'studiesTotal': studiesTotal,
      'lastStudyDate': lastStudyDate?.toIso8601String(),
      'nextStudyDate': nextStudyDate?.toIso8601String(),
      'baptismDate': baptismDate?.toIso8601String(),
      'convertedToMemberId': convertedToMemberId,
      'convertedAt': convertedAt?.toIso8601String(),
      'spiritualInterests': spiritualInterests,
      'leaderNotes': leaderNotes,
      'lastContactDate': lastContactDate?.toIso8601String(),
      'nextFollowUpDate': nextFollowUpDate?.toIso8601String(),
      'isActive': isActive,
    };
  }

  Color get stageColor {
    switch (studyStage) {
      case 'interested':
        return const Color(0xFF2563EB);
      case 'studying':
        return const Color(0xFF0F766E);
      case 'advanced_study':
        return const Color(0xFF7C3AED);
      case 'baptism_candidate':
        return AppColors.accent;
      case 'baptised':
        return AppColors.success;
      case 'member':
        return AppColors.primary;
      default:
        return Colors.grey.shade500;
    }
  }

  String get stageLabel {
    return studyStage
        .replaceAll('_', ' ')
        .split(' ')
        .map((word) => word.isEmpty ? word : '${word[0].toUpperCase()}${word.substring(1)}')
        .join(' ');
  }
}
