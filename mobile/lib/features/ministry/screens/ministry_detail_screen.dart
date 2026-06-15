import 'package:flutter/material.dart';

import '../../../../core/utils/app_colors.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/empty_state_widget.dart';
import '../data/ministry_repository.dart';
import '../data/models/ministry.dart';
import '../data/models/ministry_meeting.dart';
import '../data/models/ministry_member.dart';

class MinistryDetailScreen extends StatefulWidget {
  const MinistryDetailScreen({
    super.key,
    required this.repository,
    required this.ministryId,
    this.readOnly = false,
  });

  final MinistryRepository repository;
  final String ministryId;
  final bool readOnly;

  @override
  State<MinistryDetailScreen> createState() => _MinistryDetailScreenState();
}

class _MinistryDetailScreenState extends State<MinistryDetailScreen> {
  late Future<_MinistryBundle> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<_MinistryBundle> _load() async {
    final ministry = await widget.repository.getMinistryById(widget.ministryId);
    final members = await widget.repository.getMinistryMembers(widget.ministryId);
    final meetings = await widget.repository.getMinistryMeetings(widget.ministryId);
    return _MinistryBundle(
      ministry: ministry,
      members: members,
      meetings: meetings,
    );
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<_MinistryBundle>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        if (snapshot.hasError || !snapshot.hasData) {
          return Scaffold(
            appBar: AppBar(title: const Text('Ministry Detail')),
            body: Center(child: Text(snapshot.error.toString())),
          );
        }

        final data = snapshot.data!;
        final nextMeeting = data.meetings.where((item) => item.date.isAfter(DateTime.now())).cast<MinistryMeeting?>().firstWhere((item) => item != null, orElse: () => null);

        return DefaultTabController(
          length: widget.readOnly ? 2 : 3,
          child: Scaffold(
            backgroundColor: AppColors.surface,
            appBar: AppBar(
              title: Text(data.ministry.name),
              bottom: TabBar(
                tabs: <Widget>[
                  const Tab(text: 'Overview'),
                  const Tab(text: 'Meetings'),
                  if (!widget.readOnly) const Tab(text: 'Members'),
                ],
              ),
            ),
            floatingActionButton: widget.readOnly
                ? null
                : FloatingActionButton.extended(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    onPressed: () => _showRecordMeetingSheet(context, data.ministry),
                    icon: const Icon(Icons.add_task_rounded),
                    label: const Text('Record Meeting'),
                  ),
            body: TabBarView(
              children: <Widget>[
                ListView(
                  padding: const EdgeInsets.all(20),
                  children: <Widget>[
                    _HeaderCard(ministry: data.ministry),
                    const SizedBox(height: 16),
                    _SectionCard(
                      title: 'Upcoming Meeting',
                      child: nextMeeting == null
                          ? const Text('No meeting scheduled yet.')
                          : Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: <Widget>[
                                Text(nextMeeting.title, style: Theme.of(context).textTheme.titleMedium),
                                const SizedBox(height: 8),
                                Text('${nextMeeting.date} • ${nextMeeting.startTime ?? 'Time TBD'}'),
                                Text(nextMeeting.venue ?? data.ministry.meetingSchedule.venue ?? 'Venue TBD'),
                              ],
                            ),
                    ),
                    const SizedBox(height: 16),
                    _SectionCard(
                      title: 'Description',
                      child: Text(data.ministry.description ?? 'No ministry description available yet.'),
                    ),
                    const SizedBox(height: 16),
                    _SectionCard(
                      title: 'Vision',
                      child: Text(data.ministry.vision ?? 'No vision statement available yet.'),
                    ),
                    const SizedBox(height: 16),
                    _SectionCard(
                      title: 'Leader Contact',
                      child: ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: CircleAvatar(
                          backgroundColor: data.ministry.typeColor.withValues(alpha: 0.15),
                          child: Icon(data.ministry.typeIcon, color: data.ministry.typeColor),
                        ),
                        title: Text(data.ministry.leaderName ?? 'No leader assigned'),
                        subtitle: Text(data.ministry.memberRole ?? 'Leadership contact'),
                      ),
                    ),
                  ],
                ),
                ListView(
                  padding: const EdgeInsets.all(20),
                  children: data.meetings.isEmpty
                      ? const <Widget>[
                          EmptyStateWidget(
                            title: 'No meetings yet',
                            message: 'Recorded ministry meetings will appear here.',
                            icon: Icons.event_note_rounded,
                          ),
                        ]
                      : data.meetings
                          .map(
                            (meeting) => _MeetingTile(meeting: meeting),
                          )
                          .toList(),
                ),
                if (!widget.readOnly)
                  ListView(
                    padding: const EdgeInsets.all(20),
                    children: data.members
                        .map((member) => _MemberTile(member: member))
                        .toList(),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _showRecordMeetingSheet(BuildContext context, Ministry ministry) async {
    final titleController = TextEditingController();
    final agendaController = TextEditingController();
    final venueController = TextEditingController(text: ministry.meetingSchedule.venue ?? '');
    DateTime selectedDate = DateTime.now();

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      backgroundColor: AppColors.surface,
      builder: (sheetContext) {
        return Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 12,
            bottom: MediaQuery.viewInsetsOf(sheetContext).bottom + 20,
          ),
          child: StatefulBuilder(
            builder: (context, setModalState) {
              return Column(
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  TextField(
                    controller: titleController,
                    decoration: const InputDecoration(labelText: 'Meeting title'),
                  ),
                  const SizedBox(height: 12),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Meeting date'),
                    subtitle: Text(MaterialLocalizations.of(context).formatFullDate(selectedDate)),
                    trailing: const Icon(Icons.calendar_month_rounded),
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        firstDate: DateTime.now().subtract(const Duration(days: 30)),
                        lastDate: DateTime.now().add(const Duration(days: 365)),
                        initialDate: selectedDate,
                      );
                      if (picked != null) {
                        setModalState(() {
                          selectedDate = picked;
                        });
                      }
                    },
                  ),
                  TextField(
                    controller: venueController,
                    decoration: const InputDecoration(labelText: 'Venue'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: agendaController,
                    maxLines: 4,
                    decoration: const InputDecoration(labelText: 'Agenda'),
                  ),
                  const SizedBox(height: 18),
                  AppButton(
                    label: 'Save Meeting',
                    onPressed: () async {
                      await widget.repository.createMeeting(
                        widget.ministryId,
                        <String, dynamic>{
                          'title': titleController.text.trim(),
                          'date': selectedDate.toIso8601String(),
                          'agenda': agendaController.text.trim(),
                          'venue': venueController.text.trim(),
                        },
                      );
                      if (!mounted) {
                        return;
                      }
                      Navigator.of(sheetContext).pop();
                      setState(() {
                        _future = _load();
                      });
                    },
                  ),
                ],
              );
            },
          ),
        );
      },
    );
  }
}

class _MinistryBundle {
  const _MinistryBundle({
    required this.ministry,
    required this.members,
    required this.meetings,
  });

  final Ministry ministry;
  final List<MinistryMember> members;
  final List<MinistryMeeting> meetings;
}

class _HeaderCard extends StatelessWidget {
  const _HeaderCard({required this.ministry});

  final Ministry ministry;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.inputBorder),
      ),
      child: Row(
        children: <Widget>[
          CircleAvatar(
            radius: 28,
            backgroundColor: ministry.typeColor.withValues(alpha: 0.15),
            child: Icon(ministry.typeIcon, color: ministry.typeColor, size: 28),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(ministry.name, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 4),
                Text('${ministry.memberCount} members • ${ministry.memberRole ?? ministry.type}'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({
    required this.title,
    required this.child,
  });

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.inputBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(title, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _MeetingTile extends StatelessWidget {
  const _MeetingTile({required this.meeting});

  final MinistryMeeting meeting;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.inputBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(meeting.title, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 6),
          Text('${meeting.date} • ${meeting.startTime ?? 'Time TBD'}'),
          Text('${meeting.attendanceCount} attended • ${meeting.status}'),
          if ((meeting.agenda ?? '').isNotEmpty) ...<Widget>[
            const SizedBox(height: 8),
            Text(meeting.agenda!),
          ],
        ],
      ),
    );
  }
}

class _MemberTile extends StatelessWidget {
  const _MemberTile({required this.member});

  final MinistryMember member;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.inputBorder),
      ),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: AppColors.primary.withValues(alpha: 0.12),
          child: Text(
            member.memberName.isNotEmpty ? member.memberName.characters.first.toUpperCase() : '?',
            style: const TextStyle(color: AppColors.primary),
          ),
        ),
        title: Text(member.memberName),
        subtitle: Text('${member.role} • ${member.status}'),
        trailing: Text(
          member.joinedAt == null ? '' : '${member.joinedAt!.day}/${member.joinedAt!.month}/${member.joinedAt!.year}',
        ),
      ),
    );
  }
}
