import 'package:flutter/material.dart';
import '../../../../core/utils/app_colors.dart';
import '../../../../core/utils/app_text_styles.dart';
import '../../../../shared/widgets/app_button.dart';

class VoteConfirmationSheet extends StatelessWidget {
  const VoteConfirmationSheet({
    super.key,
    required this.optionText,
    required this.isAnonymous,
    required this.onConfirm,
  });

  final String optionText;
  final bool isAnonymous;
  final VoidCallback onConfirm;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text('Confirm your vote?', style: AppTextStyles.headlineMedium),
            const SizedBox(height: 16),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppColors.accent.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                optionText,
                style: AppTextStyles.titleMedium.copyWith(color: AppColors.accent),
              ),
            ),
            if (isAnonymous) ...<Widget>[
              const SizedBox(height: 16),
              Text(
                "This poll is anonymous - your identity won't be recorded.",
                style: AppTextStyles.bodyMedium,
              ),
            ],
            const SizedBox(height: 20),
            AppButton(
              label: 'Confirm Vote',
              onPressed: onConfirm,
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Cancel'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
