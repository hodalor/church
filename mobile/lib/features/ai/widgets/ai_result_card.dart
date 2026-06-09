import 'package:flutter/material.dart';
import '../../../../core/utils/app_colors.dart';

class AiResultCard extends StatelessWidget {
  const AiResultCard({
    super.key,
    required this.featureLabel,
    required this.result,
    required this.onCopy,
    required this.onShare,
    required this.onRegenerate,
  });

  final String featureLabel;
  final String result;
  final VoidCallback onCopy;
  final VoidCallback onShare;
  final VoidCallback onRegenerate;

  @override
  Widget build(BuildContext context) {
    return AnimatedOpacity(
      opacity: result.isEmpty ? 0 : 1,
      duration: const Duration(milliseconds: 250),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.primary, width: 1.2),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.accent.withValues(alpha: 0.18),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                featureLabel,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w700,
                    ),
              ),
            ),
            const SizedBox(height: 14),
            SelectableText(
              result,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: <Widget>[
                OutlinedButton.icon(
                  onPressed: onCopy,
                  icon: const Icon(Icons.copy_rounded),
                  label: const Text('Copy'),
                ),
                OutlinedButton.icon(
                  onPressed: onShare,
                  icon: const Icon(Icons.share_rounded),
                  label: const Text('Share'),
                ),
                ElevatedButton.icon(
                  onPressed: onRegenerate,
                  icon: const Icon(Icons.refresh_rounded),
                  label: const Text('Regenerate'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
