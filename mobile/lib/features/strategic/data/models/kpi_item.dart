import 'package:flutter/material.dart';

import '../../../../core/utils/app_colors.dart';

class KPIItem {
  const KPIItem({
    required this.name,
    required this.currentValue,
    required this.annualTarget,
    required this.status,
    this.unit,
    required this.progress,
  });

  final String name;
  final double currentValue;
  final double annualTarget;
  final String status;
  final String? unit;
  final double progress;

  factory KPIItem.fromJson(Map<String, dynamic> json) {
    double parseDouble(dynamic value) {
      if (value is num) {
        return value.toDouble();
      }
      return double.tryParse(value?.toString() ?? '') ?? 0;
    }

    return KPIItem(
      name: (json['name'] ?? json['title'] ?? '').toString(),
      currentValue: parseDouble(json['currentValue']),
      annualTarget: parseDouble(json['annualTarget'] ?? json['targetValue']),
      status: (json['status'] ?? 'on_track').toString(),
      unit: json['unit']?.toString(),
      progress: parseDouble(json['progress']),
    );
  }

  Color get statusColor {
    switch (status) {
      case 'off_track':
        return AppColors.danger;
      case 'at_risk':
        return AppColors.accent;
      case 'exceeded':
        return const Color(0xFFD4AF37);
      default:
        return AppColors.success;
    }
  }

  String get statusLabel {
    switch (status) {
      case 'off_track':
        return 'Off Track';
      case 'at_risk':
        return 'At Risk';
      case 'exceeded':
        return 'Exceeded';
      default:
        return 'On Track';
    }
  }
}
