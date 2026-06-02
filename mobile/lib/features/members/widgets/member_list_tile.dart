import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../data/models/member.dart';
import 'member_avatar.dart';

class MemberListTile extends StatelessWidget {
  const MemberListTile({
    super.key,
    required this.member,
  });

  final Member member;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(22),
      onTap: () => context.push('/members/${member.memberId}'),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: AppColors.inputBorder),
        ),
        child: Row(
          children: <Widget>[
            MemberAvatar(
              photoUrl: member.photoUrl,
              firstName: member.firstName,
              lastName: member.lastName,
              radius: 24,
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(member.fullName, style: AppTextStyles.titleMedium),
                  const SizedBox(height: 4),
                  Text(
                    member.memberId,
                    style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    member.phone ?? 'No phone number',
                    style: AppTextStyles.bodyMedium,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Column(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: member.healthScore.statusColor,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  member.healthScore.statusLabel,
                  style: AppTextStyles.bodyMedium.copyWith(fontSize: 12),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
