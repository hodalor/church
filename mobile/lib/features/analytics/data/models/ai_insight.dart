import 'package:flutter/material.dart';
import '../../../../core/utils/app_colors.dart';

class AiInsight {
  const AiInsight({
    required this.id,
    required this.type,
    required this.severity,
    required this.title,
    required this.message,
    required this.recommendations,
    required this.isRead,
    required this.isActioned,
    this.branchId,
    this.data = const <String, dynamic>{},
    this.createdAt,
  });

  final String id;
  final String type;
  final String severity;
  final String title;
  final String message;
  final List<String> recommendations;
  final bool isRead;
  final bool isActioned;
  final String? branchId;
  final Map<String, dynamic> data;
  final DateTime? createdAt;

  factory AiInsight.fromJson(Map<String, dynamic> json) {
    return AiInsight(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      type: (json['type'] ?? 'general').toString(),
      severity: (json['severity'] ?? 'info').toString(),
      title: (json['title'] ?? '').toString(),
      message: (json['message'] ?? '').toString(),
      recommendations:
          (json['recommendations'] as List<dynamic>? ?? const <dynamic>[])
              .map((item) => item.toString())
              .toList(),
      isRead: json['isRead'] == true,
      isActioned: json['isActioned'] == true,
      branchId: json['branchId']?.toString(),
      data: json['data'] is Map<String, dynamic>
          ? Map<String, dynamic>.from(json['data'] as Map<String, dynamic>)
          : const <String, dynamic>{},
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }

  Color get severityColor {
    switch (severity) {
      case 'critical':
        return AppColors.danger;
      case 'warning':
        return Colors.orange.shade700;
      default:
        return Colors.blue.shade700;
    }
  }

  IconData get severityIcon {
    switch (severity) {
      case 'critical':
        return Icons.error_rounded;
      case 'warning':
        return Icons.warning_amber_rounded;
      default:
        return Icons.info_outline_rounded;
    }
  }

  AiInsight copyWith({
    bool? isRead,
    bool? isActioned,
  }) {
    return AiInsight(
      id: id,
      type: type,
      severity: severity,
      title: title,
      message: message,
      recommendations: recommendations,
      isRead: isRead ?? this.isRead,
      isActioned: isActioned ?? this.isActioned,
      branchId: branchId,
      data: data,
      createdAt: createdAt,
    );
  }
}
