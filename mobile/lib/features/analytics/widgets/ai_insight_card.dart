import 'package:flutter/material.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../../../core/utils/app_colors.dart';
import '../data/models/ai_insight.dart';

class AiInsightCard extends StatefulWidget {
  const AiInsightCard({
    super.key,
    required this.insight,
    this.onRead,
    this.onActioned,
  });

  final AiInsight insight;
  final VoidCallback? onRead;
  final VoidCallback? onActioned;

  @override
  State<AiInsightCard> createState() => _AiInsightCardState();
}

class _AiInsightCardState extends State<AiInsightCard> {
  bool _expanded = false;
  bool _showRecommendations = false;

  @override
  Widget build(BuildContext context) {
    final insight = widget.insight;
    return AnimatedOpacity(
      duration: const Duration(milliseconds: 200),
      opacity: insight.isRead ? 0.72 : 1,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border(
            left: BorderSide(color: insight.severityColor, width: 5),
            top: const BorderSide(color: AppColors.inputBorder),
            right: const BorderSide(color: AppColors.inputBorder),
            bottom: const BorderSide(color: AppColors.inputBorder),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              children: <Widget>[
                Icon(insight.severityIcon, color: insight.severityColor, size: 18),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: insight.severityColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    insight.type.replaceAll('_', ' ').toUpperCase(),
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: insight.severityColor,
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(insight.title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: () => setState(() => _expanded = !_expanded),
              child: Text(
                insight.message,
                maxLines: _expanded ? null : 2,
                overflow: _expanded ? null : TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.primary,
                    ),
              ),
            ),
            if (insight.recommendations.isNotEmpty) ...<Widget>[
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => setState(
                  () => _showRecommendations = !_showRecommendations,
                ),
                child: Text(
                  _showRecommendations
                      ? 'Hide Recommendations'
                      : 'Show Recommendations',
                ),
              ),
              if (_showRecommendations)
                ...insight.recommendations.map(
                  (item) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        const Text('• ', style: TextStyle(color: AppColors.accent)),
                        Expanded(
                          child: Text(
                            item,
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
            const SizedBox(height: 12),
            Row(
              children: <Widget>[
                Expanded(
                  child: Text(
                    insight.createdAt == null
                        ? 'Just now'
                        : timeago.format(insight.createdAt!),
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ),
                TextButton(
                  onPressed: widget.onRead,
                  child: const Text('Read'),
                ),
                TextButton(
                  onPressed: widget.onActioned,
                  child: const Text('Actioned'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
