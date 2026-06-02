import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/utils/app_colors.dart';
import '../../../../core/utils/app_text_styles.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/models/prayer_request.dart';

class PrayerRequestCard extends ConsumerStatefulWidget {
  const PrayerRequestCard({
    super.key,
    required this.request,
    required this.onPray,
    this.onAssignToMe,
    this.onStatusChanged,
  });

  final PrayerRequest request;
  final Future<void> Function() onPray;
  final Future<void> Function()? onAssignToMe;
  final Future<void> Function(String status)? onStatusChanged;

  @override
  ConsumerState<PrayerRequestCard> createState() => _PrayerRequestCardState();
}

class _PrayerRequestCardState extends ConsumerState<PrayerRequestCard> {
  bool _expanded = false;
  bool _prayed = false;
  bool _showEmoji = false;

  Future<void> _handlePray() async {
    await widget.onPray();
    if (!mounted) {
      return;
    }
    setState(() {
      _prayed = true;
      _showEmoji = true;
    });
    await Future<void>.delayed(const Duration(milliseconds: 700));
    if (mounted) {
      setState(() {
        _showEmoji = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final role = ref.watch(authProvider).user?.role ?? '';
    final isLeader = role == 'head_pastor' || role == 'care_leader';

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
            Row(
              children: <Widget>[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: widget.request.urgencyColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    widget.request.urgency.toUpperCase(),
                    style: AppTextStyles.labelSmall.copyWith(
                      color: widget.request.urgencyColor,
                      letterSpacing: 1.2,
                    ),
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    widget.request.category,
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: AppColors.primary,
                    ),
                  ),
                ),
              ],
            ),
            if ((widget.request.title ?? '').trim().isNotEmpty) ...<Widget>[
              const SizedBox(height: 14),
              Text(
                widget.request.title!,
                style: AppTextStyles.titleMedium,
              ),
            ],
            const SizedBox(height: 12),
            GestureDetector(
              onTap: () => setState(() => _expanded = !_expanded),
              child: Text(
                widget.request.description,
                maxLines: _expanded ? null : 3,
                overflow: _expanded ? TextOverflow.visible : TextOverflow.ellipsis,
                style: AppTextStyles.bodyMedium.copyWith(color: AppColors.primary),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: <Widget>[
                const Icon(Icons.person_outline_rounded, size: 18, color: AppColors.mutedText),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    widget.request.isAnonymous
                        ? 'Anonymous'
                        : (widget.request.memberName ?? 'Member'),
                    style: AppTextStyles.bodyMedium,
                  ),
                ),
                Text(
                  '🙏 ${widget.request.prayerCount}',
                  style: AppTextStyles.bodyMedium.copyWith(color: AppColors.primary),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.accent.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    widget.request.status.replaceAll('_', ' '),
                    style: AppTextStyles.bodyMedium.copyWith(color: AppColors.accent),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              children: <Widget>[
                Expanded(
                  child: OutlinedButton(
                    onPressed: _handlePray,
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppColors.accent),
                      foregroundColor: AppColors.accent,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: Text(_prayed ? 'Praying 🙏' : 'Pray for this'),
                  ),
                ),
                if (_showEmoji) ...<Widget>[
                  const SizedBox(width: 10),
                  TweenAnimationBuilder<double>(
                    tween: Tween<double>(begin: 0, end: 1),
                    duration: const Duration(milliseconds: 550),
                    builder: (context, value, child) {
                      return Transform.translate(
                        offset: Offset(0, -14 * value),
                        child: Opacity(opacity: 1 - value, child: child),
                      );
                    },
                    child: const Text('🙏', style: TextStyle(fontSize: 22)),
                  ),
                ],
              ],
            ),
            if (isLeader) ...<Widget>[
              const SizedBox(height: 14),
              Row(
                children: <Widget>[
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: widget.request.status,
                      items: const <DropdownMenuItem<String>>[
                        DropdownMenuItem(value: 'open', child: Text('Open')),
                        DropdownMenuItem(value: 'in_prayer', child: Text('In Prayer')),
                        DropdownMenuItem(value: 'answered', child: Text('Answered')),
                      ],
                      onChanged: (value) {
                        if (value != null) {
                          widget.onStatusChanged?.call(value);
                        }
                      },
                      decoration: const InputDecoration(
                        isDense: true,
                        filled: true,
                        fillColor: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  OutlinedButton(
                    onPressed: widget.onAssignToMe,
                    child: const Text('Assign to me'),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
