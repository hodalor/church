import 'package:flutter/material.dart';
import '../../../../core/utils/app_colors.dart';
import 'service_stats.dart';

class Service {
  const Service({
    required this.serviceId,
    required this.title,
    required this.type,
    required this.date,
    required this.startTime,
    required this.endTime,
    required this.branch,
    required this.location,
    required this.checkInOpen,
    required this.stats,
    this.createdAt,
  });

  final String serviceId;
  final String title;
  final String type;
  final DateTime date;
  final String? startTime;
  final String? endTime;
  final String? branch;
  final String? location;
  final bool checkInOpen;
  final ServiceStats stats;
  final DateTime? createdAt;

  bool get isToday {
    final now = DateTime.now();
    return date.year == now.year &&
        date.month == now.month &&
        date.day == now.day;
  }

  bool get isUpcoming => date.isAfter(DateTime.now());

  Color get statusColor {
    if (checkInOpen) {
      return AppColors.success;
    }
    return isUpcoming ? AppColors.primary : AppColors.mutedText;
  }

  factory Service.fromJson(Map<String, dynamic> json) {
    final parsedDate = DateTime.tryParse(
          (json['date'] ?? json['serviceDate'] ?? json['scheduledFor'] ?? '')
              .toString(),
        ) ??
        DateTime.now();

    return Service(
      serviceId: (json['serviceId'] ?? json['_id'] ?? '').toString(),
      title: (json['title'] ?? 'Church Service').toString(),
      type: (json['type'] ?? 'Service').toString(),
      date: parsedDate,
      startTime: json['startTime']?.toString(),
      endTime: json['endTime']?.toString(),
      branch: json['branch']?.toString(),
      location: json['location']?.toString(),
      checkInOpen: json['checkInOpen'] == true || json['status'] == 'open',
      stats: json['stats'] is Map<String, dynamic>
          ? ServiceStats.fromJson(json['stats'] as Map<String, dynamic>)
          : const ServiceStats.empty(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'serviceId': serviceId,
      'title': title,
      'type': type,
      'date': date.toIso8601String(),
      'startTime': startTime,
      'endTime': endTime,
      'branch': branch,
      'location': location,
      'checkInOpen': checkInOpen,
      'stats': stats.toJson(),
      'createdAt': createdAt?.toIso8601String(),
    };
  }
}
