import 'package:flutter/material.dart';
import '../../../../core/utils/app_colors.dart';
import '../../../../core/utils/app_text_styles.dart';
import '../data/models/poll.dart';
import '../widgets/vote_confirmation_sheet.dart';

class PollCard extends StatefulWidget {
  const PollCard({
    super.key,
    required this.poll,
    required this.onVote,
    this.onClose,
  });

  final Poll poll;
  final Future<void> Function(String optionId) onVote;
  final Future<void> Function()? onClose;

  @override
  State<PollCard> createState() => _PollCardState();
}

class _PollCardState extends State<PollCard> {
  @override
  Widget build(BuildContext context) {
    final showResults = widget.poll.hasVoted || widget.poll.isClosed;

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
        side: const BorderSide(color: AppColors.inputBorder),
      ),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(widget.poll.question, style: AppTextStyles.titleMedium),
            const SizedBox(height: 8),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: <Widget>[
                Text(
                  '${widget.poll.totalVotes} votes',
                  style: AppTextStyles.bodyMedium,
                ),
                if (widget.poll.expiresAt != null)
                  Text(
                    'Expires ${_formatDate(widget.poll.expiresAt!)}',
                    style: AppTextStyles.bodyMedium,
                  ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: widget.poll.isClosed
                    ? AppColors.mutedText.withValues(alpha: 0.12)
                    : AppColors.success.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                widget.poll.isClosed ? 'Closed' : 'Active',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: widget.poll.isClosed ? AppColors.mutedText : AppColors.success,
                ),
              ),
            ),
            const SizedBox(height: 16),
            if (!showResults)
              ...widget.poll.options.map(
                (option) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(18),
                    onTap: () => _showConfirmationSheet(option.id, option.text),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: AppColors.inputBorder),
                      ),
                      child: Row(
                        children: <Widget>[
                          const Icon(Icons.radio_button_unchecked_rounded),
                          const SizedBox(width: 12),
                          Expanded(child: Text(option.text, style: AppTextStyles.bodyLarge)),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            if (showResults)
              ...widget.poll.options.map((option) {
                final isMyVote = !widget.poll.isAnonymous &&
                    widget.poll.userVoteOptionId != null &&
                    widget.poll.userVoteOptionId == option.id;

                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Row(
                        children: <Widget>[
                          Expanded(
                            child: Text(option.text, style: AppTextStyles.bodyLarge),
                          ),
                          Text(
                            '${option.percentage.toStringAsFixed(0)}%',
                            style: AppTextStyles.bodyMedium.copyWith(
                              color: AppColors.primary,
                            ),
                          ),
                          if (isMyVote) ...<Widget>[
                            const SizedBox(width: 8),
                            const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 18),
                          ],
                        ],
                      ),
                      const SizedBox(height: 8),
                      TweenAnimationBuilder<double>(
                        tween: Tween<double>(begin: 0, end: option.percentage / 100),
                        duration: const Duration(milliseconds: 550),
                        builder: (context, value, child) {
                          return LinearProgressIndicator(
                            value: value,
                            minHeight: 10,
                            borderRadius: BorderRadius.circular(999),
                            backgroundColor: AppColors.inputBorder,
                            color: isMyVote ? AppColors.accent : AppColors.primary,
                          );
                        },
                      ),
                    ],
                  ),
                );
              }),
            if (!widget.poll.isClosed && widget.onClose != null) ...<Widget>[
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: widget.onClose,
                  child: const Text('Close Poll'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _showConfirmationSheet(String optionId, String optionText) async {
    await showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) {
        return VoteConfirmationSheet(
          optionText: optionText,
          isAnonymous: widget.poll.isAnonymous,
          onConfirm: () async {
            Navigator.of(context).pop();
            await widget.onVote(optionId);
          },
        );
      },
    );
  }

  String _formatDate(DateTime value) {
    final month = <String>[
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ][value.month - 1];
    return '$month ${value.day}, ${value.year}';
  }
}
