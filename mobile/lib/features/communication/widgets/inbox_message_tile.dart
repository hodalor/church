import 'package:flutter/material.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../../../core/utils/app_colors.dart';
import '../../../../core/utils/app_text_styles.dart';
import '../data/models/inbox_message.dart';

class InboxMessageTile extends StatelessWidget {
  const InboxMessageTile({
    super.key,
    required this.message,
    required this.onTap,
  });

  final InboxMessage message;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final createdLabel = message.createdAt != null
        ? timeago.format(message.createdAt!)
        : 'now';

    return Card(
      elevation: 0,
      color: message.isRead ? Colors.white : const Color(0xFFF5EFD9),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(
          color: message.isRead ? AppColors.inputBorder : AppColors.accent,
        ),
      ),
      child: ListTile(
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        leading: CircleAvatar(
          backgroundColor: message.typeColor.withValues(alpha: 0.14),
          child: Icon(message.typeIcon, color: message.typeColor),
        ),
        title: Text(
          message.title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: AppTextStyles.bodyLarge.copyWith(
            fontWeight: message.isRead ? FontWeight.w600 : FontWeight.w800,
          ),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Text(
            message.message,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppTextStyles.bodyMedium,
          ),
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: <Widget>[
            Text(
              createdLabel,
              style: AppTextStyles.bodyMedium.copyWith(fontSize: 12),
            ),
            const SizedBox(height: 8),
            if (!message.isRead)
              Container(
                width: 10,
                height: 10,
                decoration: const BoxDecoration(
                  color: AppColors.accent,
                  shape: BoxShape.circle,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
