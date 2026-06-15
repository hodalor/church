import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/utils/app_colors.dart';
import '../../../../shared/widgets/empty_state_widget.dart';
import '../../members/widgets/member_bottom_navigation.dart';
import '../data/cbs_repository.dart';
import '../data/models/cbs_prospect.dart';
import '../data/models/cbs_session.dart';
import '../providers/cbs_provider.dart';

class ProspectDetailScreen extends ConsumerStatefulWidget {
  const ProspectDetailScreen({
    super.key,
    required this.prospectId,
  });

  final String prospectId;

  @override
  ConsumerState<ProspectDetailScreen> createState() => _ProspectDetailScreenState();
}

class _ProspectDetailScreenState extends ConsumerState<ProspectDetailScreen> {
  late Future<_ProspectBundle> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<_ProspectBundle> _load() async {
    final group = await ref.read(cbsRepositoryProvider).getMyGroup();
    if (group == null) {
      throw Exception('No CBS group found for this user.');
    }
    final prospects = await ref.read(cbsRepositoryProvider).getGroupProspects(group.groupId);
    final prospect = prospects.firstWhere((item) => item.prospectId == widget.prospectId);
    final sessions = await ref.read(cbsRepositoryProvider).getGroupSessions(group.groupId);
    final history = sessions.where((item) => item.attendees.any((attendee) => attendee.prospectId == widget.prospectId)).toList();
    return _ProspectBundle(prospect: prospect, sessions: history, groupId: group.groupId);
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<_ProspectBundle>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        if (snapshot.hasError || !snapshot.hasData) {
          return Scaffold(
            appBar: AppBar(title: const Text('Prospect Detail')),
            body: Center(child: Text(snapshot.error.toString())),
          );
        }

        final data = snapshot.data!;
        final prospect = data.prospect;
        final progressDenominator = prospect.studiesTotal == 0 ? 12 : prospect.studiesTotal;
        final progress = (prospect.studiesAttended / progressDenominator).clamp(0, 1).toDouble();

        return Scaffold(
          backgroundColor: AppColors.surface,
          appBar: AppBar(title: const Text('Prospect Detail')),
          bottomNavigationBar: const MemberBottomNavigation(currentIndex: 0),
          body: ListView(
            padding: const EdgeInsets.all(20),
            children: <Widget>[
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppColors.inputBorder),
                ),
                child: Column(
                  children: <Widget>[
                    CircleAvatar(
                      radius: 34,
                      backgroundColor: prospect.stageColor.withValues(alpha: 0.16),
                      child: Text(
                        prospect.fullName.characters.take(2).toString().toUpperCase(),
                        style: TextStyle(
                          color: prospect.stageColor,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(prospect.fullName, style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: prospect.stageColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        prospect.stageLabel,
                        style: TextStyle(color: prospect.stageColor, fontWeight: FontWeight.w700),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text('${prospect.studiesAttended} studies attended'),
                    ),
                    const SizedBox(height: 8),
                    LinearProgressIndicator(
                      value: progress,
                      backgroundColor: AppColors.inputBorder,
                      color: prospect.stageColor,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: <Widget>[
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: prospect.phone == null ? null : () => _launchUri('tel:${prospect.phone}'),
                            icon: const Icon(Icons.call_rounded),
                            label: const Text('Call'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: prospect.phone == null ? null : () => _launchUri('sms:${prospect.phone}'),
                            icon: const Icon(Icons.sms_rounded),
                            label: const Text('SMS'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: prospect.phone == null ? null : () => _launchUri('https://wa.me/${prospect.phone}'),
                            icon: const Icon(Icons.chat_rounded),
                            label: const Text('WhatsApp'),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      initialValue: prospect.studyStage,
                      items: const <DropdownMenuItem<String>>[
                        DropdownMenuItem(value: 'initial_contact', child: Text('Initial Contact')),
                        DropdownMenuItem(value: 'interested', child: Text('Interested')),
                        DropdownMenuItem(value: 'studying', child: Text('Studying')),
                        DropdownMenuItem(value: 'advanced_study', child: Text('Advanced Study')),
                        DropdownMenuItem(value: 'baptism_candidate', child: Text('Baptism Candidate')),
                        DropdownMenuItem(value: 'baptised', child: Text('Baptised')),
                        DropdownMenuItem(value: 'member', child: Text('Member')),
                      ],
                      onChanged: (value) async {
                        if (value == null || value == prospect.studyStage) {
                          return;
                        }
                        final confirmed = await showDialog<bool>(
                          context: context,
                          builder: (_) => AlertDialog(
                            title: const Text('Update stage'),
                            content: Text('Move ${prospect.fullName} to ${value.replaceAll('_', ' ')}?'),
                            actions: <Widget>[
                              TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Cancel')),
                              ElevatedButton(onPressed: () => Navigator.of(context).pop(true), child: const Text('Update')),
                            ],
                          ),
                        );
                        if (confirmed != true) {
                          return;
                        }
                        await ref.read(cbsProvider.notifier).updateStage(prospect.prospectId, value);
                        if (!mounted) {
                          return;
                        }
                        if (value == 'baptism_candidate') {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Celebration! Prospect is now a baptism candidate.')),
                          );
                        }
                        setState(() {
                          _future = _load();
                        });
                      },
                      decoration: const InputDecoration(
                        labelText: 'Update study stage',
                      ),
                    ),
                    if (prospect.studyStage == 'baptised') ...<Widget>[
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: () async {
                          final confirmed = await showDialog<bool>(
                            context: context,
                            builder: (_) => AlertDialog(
                              title: const Text('Convert to member'),
                              content: Text('Create member profile for ${prospect.fullName}?'),
                              actions: <Widget>[
                                TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Cancel')),
                                ElevatedButton(onPressed: () => Navigator.of(context).pop(true), child: const Text('Convert')),
                              ],
                            ),
                          );
                          if (confirmed != true) {
                            return;
                          }
                          await ref.read(cbsRepositoryProvider).convertToMember(
                                prospect.prospectId,
                                <String, dynamic>{'groupId': data.groupId},
                              );
                          if (!mounted) {
                            return;
                          }
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('${prospect.fullName} converted to member.')),
                          );
                          setState(() {
                            _future = _load();
                          });
                        },
                        icon: const Icon(Icons.person_add_rounded),
                        label: const Text('Convert to Member'),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: AppColors.inputBorder),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text('Study History', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 12),
                    if (data.sessions.isEmpty)
                      const EmptyStateWidget(
                        icon: Icons.history_toggle_off_rounded,
                        title: 'No study history yet',
                        message: 'Study sessions attended by this prospect will appear here.',
                      )
                    else
                      ...data.sessions.map(
                        (session) => ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: const Icon(Icons.menu_book_rounded),
                          title: Text(session.studyTopic ?? 'CBS Session'),
                          subtitle: Text('${session.date} • ${session.studyReference ?? 'Reference pending'}'),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              ExpansionTile(
                collapsedBackgroundColor: Colors.white,
                backgroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(22),
                  side: const BorderSide(color: AppColors.inputBorder),
                ),
                collapsedShape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(22),
                  side: const BorderSide(color: AppColors.inputBorder),
                ),
                title: const Text('Notes'),
                childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                children: <Widget>[
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(prospect.leaderNotes ?? 'No notes recorded yet.'),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _launchUri(String value) async {
    final uri = Uri.parse(value);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }
}

class _ProspectBundle {
  const _ProspectBundle({
    required this.prospect,
    required this.sessions,
    required this.groupId,
  });

  final CBSProspect prospect;
  final List<CBSSession> sessions;
  final String groupId;
}
