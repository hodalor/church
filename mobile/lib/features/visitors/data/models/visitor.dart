import 'package:flutter/material.dart';
import '../../visitors_utils.dart';
import 'follow_up.dart';

class Visitor {
  const Visitor({
    required this.id,
    required this.visitorId,
    required this.firstName,
    required this.lastName,
    this.tenantId,
    this.phone,
    this.email,
    this.gender,
    this.ageGroup,
    this.heardAboutUs,
    this.referredByMemberId,
    this.referredByMemberName,
    this.branch,
    this.firstVisitDate,
    this.interests = const <String>[],
    this.prayerRequest,
    this.notes,
    this.photoUrl,
    this.pipelineStage = 'new_visitor',
    this.assignedToName,
    this.assignedToUserId,
    this.totalVisits = 0,
    this.converted = false,
    this.convertedAt,
    this.visits = const <Map<String, dynamic>>[],
    this.followUps = const <FollowUp>[],
    this.stageHistory = const <Map<String, dynamic>>[],
    this.workflowProgress = const <Map<String, dynamic>>[],
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String visitorId;
  final String? tenantId;
  final String firstName;
  final String lastName;
  final String? phone;
  final String? email;
  final String? gender;
  final String? ageGroup;
  final String? heardAboutUs;
  final String? referredByMemberId;
  final String? referredByMemberName;
  final String? branch;
  final DateTime? firstVisitDate;
  final List<String> interests;
  final String? prayerRequest;
  final String? notes;
  final String? photoUrl;
  final String pipelineStage;
  final String? assignedToName;
  final String? assignedToUserId;
  final int totalVisits;
  final bool converted;
  final DateTime? convertedAt;
  final List<Map<String, dynamic>> visits;
  final List<FollowUp> followUps;
  final List<Map<String, dynamic>> stageHistory;
  final List<Map<String, dynamic>> workflowProgress;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  String get fullName => '$firstName $lastName';

  String get initials {
    final first = firstName.isNotEmpty ? firstName[0] : '';
    final last = lastName.isNotEmpty ? lastName[0] : '';
    return '$first$last'.toUpperCase();
  }

  Color get stageColor => stageColorFor(pipelineStage);

  factory Visitor.fromJson(Map<String, dynamic> json) {
    final assignedTo = json['assignedTo'] is Map<String, dynamic>
        ? json['assignedTo'] as Map<String, dynamic>
        : const <String, dynamic>{};
    final referredBy = json['referredByMember'] is Map<String, dynamic>
        ? json['referredByMember'] as Map<String, dynamic>
        : const <String, dynamic>{};

    return Visitor(
      id: (json['id'] ?? json['_id'] ?? json['visitorId'] ?? '').toString(),
      visitorId: (json['visitorId'] ?? '').toString(),
      tenantId: json['tenantId']?.toString(),
      firstName: (json['firstName'] ?? '').toString(),
      lastName: (json['lastName'] ?? '').toString(),
      phone: json['phone']?.toString(),
      email: json['email']?.toString(),
      gender: json['gender']?.toString(),
      ageGroup: json['ageGroup']?.toString(),
      heardAboutUs: json['heardAboutUs']?.toString(),
      referredByMemberId: (json['referredByMemberId'] ?? referredBy['memberId'])?.toString(),
      referredByMemberName: (json['referredByMemberName'] ?? referredBy['memberName'])?.toString(),
      branch: json['branch']?.toString(),
      firstVisitDate: json['firstVisitDate'] != null
          ? DateTime.tryParse(json['firstVisitDate'].toString())
          : null,
      interests: (json['interests'] as List<dynamic>? ?? const <dynamic>[])
          .map((item) => item.toString())
          .toList(),
      prayerRequest: json['prayerRequest']?.toString(),
      notes: json['notes']?.toString(),
      photoUrl: json['photoUrl']?.toString(),
      pipelineStage: (json['pipelineStage'] ?? json['stage'] ?? 'new_visitor').toString(),
      assignedToName: (json['assignedToName'] ?? assignedTo['name'])?.toString(),
      assignedToUserId: (json['assignedToUserId'] ?? assignedTo['userId'] ?? assignedTo['id'])?.toString(),
      totalVisits: int.tryParse((json['totalVisits'] ?? 0).toString()) ??
          ((json['visits'] as List<dynamic>?)?.length ?? 0),
      converted: json['converted'] == true,
      convertedAt: json['convertedAt'] != null
          ? DateTime.tryParse(json['convertedAt'].toString())
          : null,
      visits: (json['visits'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<Map<String, dynamic>>()
          .toList(),
      followUps: (json['followUps'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<Map<String, dynamic>>()
          .map(FollowUp.fromJson)
          .toList(),
      stageHistory: (json['stageHistory'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<Map<String, dynamic>>()
          .toList(),
      workflowProgress: (json['workflowProgress'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<Map<String, dynamic>>()
          .toList(),
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
      'id': id,
      'visitorId': visitorId,
      'tenantId': tenantId,
      'firstName': firstName,
      'lastName': lastName,
      'phone': phone,
      'email': email,
      'gender': gender,
      'ageGroup': ageGroup,
      'heardAboutUs': heardAboutUs,
      'referredByMemberId': referredByMemberId,
      'referredByMemberName': referredByMemberName,
      'branch': branch,
      'firstVisitDate': firstVisitDate?.toIso8601String(),
      'interests': interests,
      'prayerRequest': prayerRequest,
      'notes': notes,
      'photoUrl': photoUrl,
      'stage': pipelineStage,
      'assignedToName': assignedToName,
      'assignedToUserId': assignedToUserId,
      'totalVisits': totalVisits,
      'converted': converted,
      'convertedAt': convertedAt?.toIso8601String(),
      'visits': visits,
      'followUps': followUps.map((item) => item.toJson()).toList(),
      'stageHistory': stageHistory,
      'workflowProgress': workflowProgress,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }
}
