import 'package:flutter/material.dart';

import '../../../../core/utils/app_colors.dart';

class LeadershipProfile {
  const LeadershipProfile({
    required this.memberId,
    required this.memberName,
    this.currentRole,
    this.tier,
    this.developmentStatus,
    this.readinessScore = 0,
    this.targetRole,
    this.mentoredByName,
  });

  final String memberId;
  final String memberName;
  final String? currentRole;
  final String? tier;
  final String? developmentStatus;
  final double readinessScore;
  final String? targetRole;
  final String? mentoredByName;

  factory LeadershipProfile.fromJson(Map<String, dynamic> json) {
    return LeadershipProfile(
      memberId: (json['memberId'] ?? '').toString(),
      memberName: (json['memberName'] ?? '').toString(),
      currentRole: json['currentRole']?.toString(),
      tier: json['tier']?.toString() ?? _inferTier(json['currentRole']?.toString()),
      developmentStatus: (json['successionStatus'] ?? json['developmentStatus'] ?? 'identified').toString(),
      readinessScore: json['readinessScore'] is num ? (json['readinessScore'] as num).toDouble() : double.tryParse(json['readinessScore']?.toString() ?? '') ?? 0,
      targetRole: json['targetRole']?.toString(),
      mentoredByName: (json['mentorName'] ?? json['mentoredByName'])?.toString(),
    );
  }

  static String _inferTier(String? role) {
    final normalized = (role ?? '').toLowerCase();
    if (normalized.contains('head') || normalized.contains('executive')) {
      return 'Tier 1';
    }
    if (normalized.contains('associate') || normalized.contains('branch')) {
      return 'Tier 2';
    }
    if (normalized.contains('leader') || normalized.contains('deacon')) {
      return 'Tier 3';
    }
    return 'Tier 4';
  }

  Color get readinessColor {
    if (readinessScore >= 80) {
      return AppColors.success;
    }
    if (readinessScore >= 50) {
      return AppColors.accent;
    }
    return AppColors.danger;
  }
}

class LeadershipStats {
  const LeadershipStats({
    required this.totalLeaders,
    required this.ready,
    required this.inDevelopment,
    required this.gaps,
  });

  final int totalLeaders;
  final int ready;
  final int inDevelopment;
  final int gaps;
}
