import 'package:flutter/material.dart';
import '../../../../core/utils/app_colors.dart';

enum HealthScoreStatus { active, drifting, atRisk, inactive, newMember }

HealthScoreStatus healthScoreStatusFromJson(String? value) {
  switch (value) {
    case 'active':
      return HealthScoreStatus.active;
    case 'drifting':
      return HealthScoreStatus.drifting;
    case 'at_risk':
      return HealthScoreStatus.atRisk;
    case 'inactive':
      return HealthScoreStatus.inactive;
    case 'new':
    default:
      return HealthScoreStatus.newMember;
  }
}

String healthScoreStatusToJson(HealthScoreStatus status) {
  switch (status) {
    case HealthScoreStatus.active:
      return 'active';
    case HealthScoreStatus.drifting:
      return 'drifting';
    case HealthScoreStatus.atRisk:
      return 'at_risk';
    case HealthScoreStatus.inactive:
      return 'inactive';
    case HealthScoreStatus.newMember:
      return 'new';
  }
}

class HealthScore {
  const HealthScore({
    required this.overall,
    required this.attendance,
    required this.giving,
    required this.participation,
    required this.involvement,
    required this.status,
    this.lastCalculated,
  });

  final double overall;
  final double attendance;
  final double giving;
  final double participation;
  final double involvement;
  final HealthScoreStatus status;
  final DateTime? lastCalculated;

  factory HealthScore.fromJson(Map<String, dynamic> json) {
    double parseDouble(dynamic value) {
      if (value is num) {
        return value.toDouble();
      }
      return double.tryParse(value?.toString() ?? '') ?? 0;
    }

    return HealthScore(
      overall: parseDouble(json['overall']),
      attendance: parseDouble(json['attendance']),
      giving: parseDouble(json['giving']),
      participation: parseDouble(json['participation']),
      involvement: parseDouble(json['involvement']),
      status: healthScoreStatusFromJson(json['status']?.toString()),
      lastCalculated: json['lastCalculated'] != null
          ? DateTime.tryParse(json['lastCalculated'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'overall': overall,
      'attendance': attendance,
      'giving': giving,
      'participation': participation,
      'involvement': involvement,
      'status': healthScoreStatusToJson(status),
      'lastCalculated': lastCalculated?.toIso8601String(),
    };
  }

  Color get statusColor {
    switch (status) {
      case HealthScoreStatus.active:
        return AppColors.success;
      case HealthScoreStatus.drifting:
        return AppColors.accent;
      case HealthScoreStatus.atRisk:
        return const Color(0xFFE76F51);
      case HealthScoreStatus.inactive:
        return AppColors.danger;
      case HealthScoreStatus.newMember:
        return const Color(0xFF4F7CAC);
    }
  }

  String get statusLabel {
    switch (status) {
      case HealthScoreStatus.active:
        return 'Active';
      case HealthScoreStatus.drifting:
        return 'Drifting';
      case HealthScoreStatus.atRisk:
        return 'At Risk';
      case HealthScoreStatus.inactive:
        return 'Inactive';
      case HealthScoreStatus.newMember:
        return 'New';
    }
  }
}
