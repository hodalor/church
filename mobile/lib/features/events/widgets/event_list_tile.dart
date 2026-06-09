import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../data/models/event.dart';
import '../events_utils.dart';

class EventListTile extends StatelessWidget {
  const EventListTile({
    super.key,
    required this.event,
    this.onTap,
  });

  final Event event;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: AppColors.inputBorder),
      ),
      tileColor: Colors.white,
      leading: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: SizedBox(
          width: 60,
          height: 60,
          child: event.bannerUrl != null && event.bannerUrl!.isNotEmpty
              ? CachedNetworkImage(imageUrl: event.bannerUrl!, fit: BoxFit.cover)
              : Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: <Color>[AppColors.primary, Color(0xFF31446F)],
                    ),
                  ),
                ),
        ),
      ),
      title: Text(event.title, style: AppTextStyles.titleMedium),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          const SizedBox(height: 4),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: <Widget>[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  event.type.replaceAll('_', ' '),
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              Text(
                '${event.formattedDate} • ${event.venue ?? 'Venue TBD'}',
                style: AppTextStyles.bodyMedium,
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            registrationStatusLabel(
              requiresRegistration: event.requiresRegistration,
              isFree: event.isFree,
              status: event.status,
            ),
            style: AppTextStyles.bodyMedium.copyWith(
              color: event.statusColor,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
      trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.primary),
    );
  }
}
