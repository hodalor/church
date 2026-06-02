import 'package:flutter/material.dart';
import '../../../../core/utils/app_colors.dart';

class InboxMessage {
  const InboxMessage({
    required this.id,
    required this.broadcastId,
    required this.title,
    required this.message,
    required this.type,
    required this.mediaUrls,
    required this.isRead,
    required this.createdAt,
    required this.tenantId,
  });

  final String id;
  final String? broadcastId;
  final String title;
  final String message;
  final String type;
  final List<String> mediaUrls;
  final bool isRead;
  final DateTime? createdAt;
  final String tenantId;

  Color get typeColor {
    switch (type.toLowerCase()) {
      case 'announcement':
      case 'broadcast':
        return AppColors.primary;
      case 'reminder':
        return AppColors.accent;
      case 'devotional':
        return AppColors.success;
      case 'health_alert':
        return AppColors.danger;
      default:
        return AppColors.primary;
    }
  }

  IconData get typeIcon {
    switch (type.toLowerCase()) {
      case 'announcement':
      case 'broadcast':
        return Icons.campaign_rounded;
      case 'reminder':
        return Icons.notifications_active_rounded;
      case 'devotional':
        return Icons.menu_book_rounded;
      case 'health_alert':
        return Icons.monitor_heart_rounded;
      default:
        return Icons.mark_email_unread_rounded;
    }
  }

  factory InboxMessage.fromJson(Map<String, dynamic> json) {
    final media = json['mediaUrls'] ?? json['attachments'] ?? <dynamic>[];

    return InboxMessage(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      broadcastId: json['broadcastId']?.toString(),
      title: (json['title'] ?? json['memberName'] ?? 'Broadcast').toString(),
      message: (json['message'] ?? '').toString(),
      type: (json['type'] ?? 'broadcast').toString(),
      mediaUrls: (media as List<dynamic>)
          .map((item) {
            if (item is Map<String, dynamic>) {
              return (item['url'] ?? '').toString();
            }
            return item.toString();
          })
          .where((item) => item.isNotEmpty)
          .toList(),
      isRead: json['isRead'] == true,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
      tenantId: (json['tenantId'] ?? '').toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'broadcastId': broadcastId,
      'title': title,
      'message': message,
      'type': type,
      'mediaUrls': mediaUrls,
      'isRead': isRead,
      'createdAt': createdAt?.toIso8601String(),
      'tenantId': tenantId,
    };
  }

  InboxMessage copyWith({
    bool? isRead,
  }) {
    return InboxMessage(
      id: id,
      broadcastId: broadcastId,
      title: title,
      message: message,
      type: type,
      mediaUrls: mediaUrls,
      isRead: isRead ?? this.isRead,
      createdAt: createdAt,
      tenantId: tenantId,
    );
  }
}
