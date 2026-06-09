import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lottie/lottie.dart';
import 'package:share_plus/share_plus.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/role_helper.dart';
import '../../../shared/widgets/empty_state_widget.dart';
import '../../../shared/widgets/snack_helper.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/ai_provider.dart';
import '../widgets/ai_result_card.dart';
import '../widgets/ai_tool_chip.dart';

class AIAssistantScreen extends ConsumerStatefulWidget {
  const AIAssistantScreen({super.key});

  @override
  ConsumerState<AIAssistantScreen> createState() => _AIAssistantScreenState();
}

class _AIAssistantScreenState extends ConsumerState<AIAssistantScreen> {
  String _tool = 'devotional';

  final _topicController = TextEditingController();
  final _scriptureController = TextEditingController();
  final _dayController = ValueNotifier<String>('Monday');

  final _prayerThemeController = TextEditingController();
  final _prayerNeedsController = TextEditingController();

  final _sermonTopicController = TextEditingController();
  final _sermonScriptureController = TextEditingController();
  String _sermonType = 'Topical';
  String _audience = 'General';
  String _duration = '30';

  final _announcementTitleController = TextEditingController();
  final _announcementDateController = TextEditingController();
  final _announcementVenueController = TextEditingController();
  final _announcementDetailsController = TextEditingController();
  String _tone = 'Formal';

  @override
  void dispose() {
    _topicController.dispose();
    _scriptureController.dispose();
    _dayController.dispose();
    _prayerThemeController.dispose();
    _prayerNeedsController.dispose();
    _sermonTopicController.dispose();
    _sermonScriptureController.dispose();
    _announcementTitleController.dispose();
    _announcementDateController.dispose();
    _announcementVenueController.dispose();
    _announcementDetailsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final role = ref.watch(authProvider).user?.role ?? '';
    final aiState = ref.watch(aiProvider);
    final canUseSermon = RoleHelper.isPastor(role);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        title: const Text('AI Assistant'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: <Widget>[
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: <Widget>[
                AiToolChip(
                  label: 'Devotional',
                  emoji: '📿',
                  selected: _tool == 'devotional',
                  onTap: () => setState(() => _tool = 'devotional'),
                ),
                const SizedBox(width: 8),
                AiToolChip(
                  label: 'Prayer Points',
                  emoji: '🙏',
                  selected: _tool == 'prayer',
                  onTap: () => setState(() => _tool = 'prayer'),
                ),
                const SizedBox(width: 8),
                if (canUseSermon)
                  AiToolChip(
                    label: 'Sermon',
                    emoji: '✍️',
                    selected: _tool == 'sermon',
                    onTap: () => setState(() => _tool = 'sermon'),
                  ),
                if (canUseSermon) const SizedBox(width: 8),
                AiToolChip(
                  label: 'Announcement',
                  emoji: '📢',
                  selected: _tool == 'announcement',
                  onTap: () => setState(() => _tool = 'announcement'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 220),
            child: _buildToolForm(context, canUseSermon),
          ),
          const SizedBox(height: 20),
          if (aiState.isLoading)
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppColors.inputBorder),
              ),
              child: Column(
                children: <Widget>[
                  SizedBox(
                    height: 160,
                    child: Lottie.network(
                      'https://assets2.lottiefiles.com/packages/lf20_hzgq1iov.json',
                      fit: BoxFit.contain,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text('Generating your $_tool...'),
                ],
              ),
            )
          else if (aiState.result != null && aiState.result!.trim().isNotEmpty)
            AiResultCard(
              featureLabel: _toolLabel(_tool),
              result: aiState.result!,
              onCopy: () async {
                await Clipboard.setData(ClipboardData(text: aiState.result!));
                if (mounted) {
                  SnackHelper.showSuccess(context, 'Copied to clipboard.');
                }
              },
              onShare: () => Share.share(aiState.result!),
              onRegenerate: _regenerate,
            )
          else if (aiState.error != null)
            EmptyStateWidget(
              icon: Icons.error_outline_rounded,
              title: 'AI service unavailable',
              message: aiState.error!,
              actionLabel: 'Try Again',
              onAction: _regenerate,
            ),
        ],
      ),
    );
  }

  Widget _buildToolForm(BuildContext context, bool canUseSermon) {
    switch (_tool) {
      case 'prayer':
        return _toolCard(
          key: const ValueKey('prayer'),
          title: 'Prayer Points',
          children: <Widget>[
            TextField(
              controller: _prayerThemeController,
              decoration: const InputDecoration(labelText: 'Theme'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _prayerNeedsController,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Specific needs'),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => ref.read(aiProvider.notifier).generatePrayerPoints({
                'theme': _prayerThemeController.text.trim(),
                'context': _prayerNeedsController.text.trim(),
                'audience': 'Congregation',
              }),
              child: const Text('Generate Prayer Points'),
            ),
          ],
        );
      case 'sermon':
        if (!canUseSermon) {
          return const EmptyStateWidget(
            key: ValueKey('sermon-locked'),
            icon: Icons.lock_outline_rounded,
            title: 'Sermon tool locked',
            message: 'Only pastor roles can generate sermon drafts on mobile.',
          );
        }
        return _toolCard(
          key: const ValueKey('sermon'),
          title: 'Sermon Draft',
          children: <Widget>[
            TextField(
              controller: _sermonTopicController,
              decoration: const InputDecoration(labelText: 'Topic'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _sermonScriptureController,
              decoration: const InputDecoration(labelText: 'Scripture'),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _sermonType,
              items: const <String>['Expository', 'Topical', 'Narrative', 'Evangelistic']
                  .map((item) => DropdownMenuItem(value: item, child: Text(item)))
                  .toList(),
              onChanged: (value) => setState(() => _sermonType = value ?? _sermonType),
              decoration: const InputDecoration(labelText: 'Sermon Type'),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _audience,
              items: const <String>['General', 'Youth', 'Men', 'Women', 'Children']
                  .map((item) => DropdownMenuItem(value: item, child: Text(item)))
                  .toList(),
              onChanged: (value) => setState(() => _audience = value ?? _audience),
              decoration: const InputDecoration(labelText: 'Target Audience'),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _duration,
              items: const <String>['20', '30', '45', '60']
                  .map((item) => DropdownMenuItem(value: item, child: Text('$item min')))
                  .toList(),
              onChanged: (value) => setState(() => _duration = value ?? _duration),
              decoration: const InputDecoration(labelText: 'Duration'),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => ref.read(aiProvider.notifier).generateSermonDraft({
                'topic': _sermonTopicController.text.trim(),
                'scripture': _sermonScriptureController.text.trim(),
                'sermonType': _sermonType,
                'targetAudience': _audience,
                'duration': int.tryParse(_duration) ?? 30,
                'churchContext': 'Prepared from the mobile assistant.',
              }),
              child: const Text('Generate Sermon Draft'),
            ),
          ],
        );
      case 'announcement':
        return _toolCard(
          key: const ValueKey('announcement'),
          title: 'Announcement',
          children: <Widget>[
            TextField(
              controller: _announcementTitleController,
              decoration: const InputDecoration(labelText: 'Event title'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _announcementDateController,
              decoration: const InputDecoration(labelText: 'Date'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _announcementVenueController,
              decoration: const InputDecoration(labelText: 'Venue'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _announcementDetailsController,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Key details'),
            ),
            const SizedBox(height: 12),
            SegmentedButton<String>(
              segments: const <ButtonSegment<String>>[
                ButtonSegment(value: 'Formal', label: Text('Formal')),
                ButtonSegment(value: 'Casual', label: Text('Casual')),
                ButtonSegment(value: 'Exciting', label: Text('Exciting')),
              ],
              selected: <String>{_tone},
              onSelectionChanged: (selection) {
                setState(() => _tone = selection.first);
              },
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () =>
                  ref.read(aiProvider.notifier).generateAnnouncement({
                'eventTitle': _announcementTitleController.text.trim(),
                'date': _announcementDateController.text.trim(),
                'venue': _announcementVenueController.text.trim(),
                'keyDetails': _announcementDetailsController.text.trim(),
                'tone': _tone,
                'channels': 'SMS, Email, WhatsApp',
              }),
              child: const Text('Generate Announcement'),
            ),
          ],
        );
      default:
        return _toolCard(
          key: const ValueKey('devotional'),
          title: 'Devotional',
          children: <Widget>[
            TextField(
              controller: _topicController,
              decoration: const InputDecoration(labelText: 'Topic'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _scriptureController,
              decoration: const InputDecoration(labelText: 'Scripture'),
            ),
            const SizedBox(height: 12),
            ValueListenableBuilder<String>(
              valueListenable: _dayController,
              builder: (context, value, _) {
                return DropdownButtonFormField<String>(
                  value: value,
                  items: const <String>[
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday',
                    'Sunday',
                  ]
                      .map((item) => DropdownMenuItem(value: item, child: Text(item)))
                      .toList(),
                  onChanged: (next) => _dayController.value = next ?? value,
                  decoration: const InputDecoration(labelText: 'Day of week'),
                );
              },
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => ref.read(aiProvider.notifier).generateDevotional({
                'theme': _topicController.text.trim(),
                'scripture': _scriptureController.text.trim(),
                'audience': _dayController.value,
              }),
              child: const Text('Generate Devotional'),
            ),
          ],
        );
    }
  }

  Widget _toolCard({
    required Key key,
    required String title,
    required List<Widget> children,
  }) {
    return Container(
      key: key,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.inputBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(title, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 16),
          ...children,
        ],
      ),
    );
  }

  String _toolLabel(String tool) {
    switch (tool) {
      case 'prayer':
        return 'Prayer Points';
      case 'sermon':
        return 'Sermon Draft';
      case 'announcement':
        return 'Announcement';
      default:
        return 'Devotional';
    }
  }

  void _regenerate() {
    switch (_tool) {
      case 'prayer':
        ref.read(aiProvider.notifier).generatePrayerPoints({
          'theme': _prayerThemeController.text.trim(),
          'context': _prayerNeedsController.text.trim(),
          'audience': 'Congregation',
        });
        break;
      case 'sermon':
        ref.read(aiProvider.notifier).generateSermonDraft({
          'topic': _sermonTopicController.text.trim(),
          'scripture': _sermonScriptureController.text.trim(),
          'sermonType': _sermonType,
          'targetAudience': _audience,
          'duration': int.tryParse(_duration) ?? 30,
          'churchContext': 'Prepared from the mobile assistant.',
        });
        break;
      case 'announcement':
        ref.read(aiProvider.notifier).generateAnnouncement({
          'eventTitle': _announcementTitleController.text.trim(),
          'date': _announcementDateController.text.trim(),
          'venue': _announcementVenueController.text.trim(),
          'keyDetails': _announcementDetailsController.text.trim(),
          'tone': _tone,
          'channels': 'SMS, Email, WhatsApp',
        });
        break;
      default:
        ref.read(aiProvider.notifier).generateDevotional({
          'theme': _topicController.text.trim(),
          'scripture': _scriptureController.text.trim(),
          'audience': _dayController.value,
        });
    }
  }
}
