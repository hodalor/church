import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/models/roster.dart';
import '../providers/volunteer_roster_provider.dart';
import '../volunteers_utils.dart';
import '../widgets/volunteer_assignment_tile.dart';
import 'decline_reason_sheet.dart';

final rosterDetailProvider = FutureProvider.family<Roster, String>((ref, rosterId) async {
  ref.watch(volunteerRepositoryProvider);
  return ref.watch(volunteerRepositoryProvider).getRosterById(rosterId);
});

class RosterDetailScreen extends ConsumerStatefulWidget {
  const RosterDetailScreen({
    super.key,
    required this.rosterId,
  });

  final String rosterId;

  @override
  ConsumerState<RosterDetailScreen> createState() => _RosterDetailScreenState();
}

class _RosterDetailScreenState extends ConsumerState<RosterDetailScreen> {
  bool _leaderMode = false;
  bool _isSavingAttendance = false;

  @override
  Widget build(BuildContext context) {
    final rosterAsync = ref.watch(rosterDetailProvider(widget.rosterId));
    final authState = ref.watch(authProvider);
    final isLeader = isVolunteerLeaderRole(authState.user?.role ?? '');

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: Text('Roster Detail', style: AppTextStyles.titleMedium),
      ),
      body: rosterAsync.when(
        data: (roster) {
          final myAssignment = roster.myAssignment;
          final canMarkAttendance = isLeader &&
              roster.date != null &&
              roster.date!.isBefore(DateTime.now());
          final grouped = <String, List<dynamic>>{};
          for (final assignment in roster.assignments) {
            grouped.putIfAbsent(assignment.department, () => <dynamic>[]).add(assignment);
          }

          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
            children: <Widget>[
              Text(roster.title, style: AppTextStyles.titleMedium.copyWith(fontSize: 24)),
              const SizedBox(height: 6),
              Text(
                roster.date != null
                    ? '${roster.date!.day}/${roster.date!.month}/${roster.date!.year}'
                    : 'Date TBD',
                style: AppTextStyles.bodyLarge,
              ),
              if (myAssignment != null) ...<Widget>[
                const SizedBox(height: 18),
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: AppColors.accent, width: 1.6),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text('My Assignment', style: AppTextStyles.titleMedium),
                      const SizedBox(height: 10),
                      Text(
                        '${myAssignment.role} • ${myAssignment.department}',
                        style: AppTextStyles.bodyLarge.copyWith(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 12),
                      if (myAssignment.status == 'assigned') ...<Widget>[
                        Row(
                          children: <Widget>[
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () async {
                                  await ref.read(volunteerRosterProvider.notifier).confirmAssignment(
                                        myAssignment.assignmentId,
                                      );
                                  ref.invalidate(rosterDetailProvider(widget.rosterId));
                                },
                                child: const Text('Confirm Attendance'),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: ElevatedButton(
                                onPressed: () => _decline(context, myAssignment.assignmentId),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.primary,
                                  foregroundColor: Colors.white,
                                ),
                                child: const Text('Decline'),
                              ),
                            ),
                          ],
                        ),
                      ] else
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          decoration: BoxDecoration(
                            color: assignmentStatusColor(myAssignment.status).withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            myAssignment.status.replaceAll('_', ' '),
                            style: AppTextStyles.bodyMedium.copyWith(
                              color: assignmentStatusColor(myAssignment.status),
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 20),
              Row(
                children: <Widget>[
                  Text('All Assignments', style: AppTextStyles.titleMedium),
                  const Spacer(),
                  if (canMarkAttendance)
                    Switch(
                      value: _leaderMode,
                      onChanged: (value) => setState(() => _leaderMode = value),
                    ),
                ],
              ),
              if (canMarkAttendance && _leaderMode)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Text(
                    'Mark attendance mode is on',
                    style: AppTextStyles.bodyMedium.copyWith(color: AppColors.accent),
                  ),
                ),
              ...grouped.entries.map(
                (entry) => Padding(
                  padding: const EdgeInsets.only(bottom: 18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(entry.key, style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w700)),
                      ),
                      const SizedBox(height: 10),
                      ...entry.value.map<Widget>(
                        (assignment) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: VolunteerAssignmentTile(
                            assignment: assignment,
                            leaderMode: _leaderMode,
                            onAttended: () => _markAttendance(assignment.assignmentId, 'attended'),
                            onAbsent: () => _markAttendance(assignment.assignmentId, 'absent'),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              if (canMarkAttendance && _leaderMode)
                ElevatedButton(
                  onPressed: _isSavingAttendance ? null : () => ref.invalidate(rosterDetailProvider(widget.rosterId)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: Text(_isSavingAttendance ? 'Saving...' : 'Save Attendance'),
                ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(error.toString(), style: AppTextStyles.bodyLarge, textAlign: TextAlign.center),
          ),
        ),
      ),
    );
  }

  Future<void> _decline(BuildContext context, String assignmentId) async {
    final reason = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      builder: (_) => const DeclineReasonSheet(),
    );
    if (reason == null || reason.isEmpty) {
      return;
    }
    await ref.read(volunteerRosterProvider.notifier).declineAssignment(
          assignmentId,
          reason: reason,
        );
    ref.invalidate(rosterDetailProvider(widget.rosterId));
  }

  Future<void> _markAttendance(String assignmentId, String status) async {
    setState(() => _isSavingAttendance = true);
    try {
      await ref.read(volunteerRepositoryProvider).markAttendance(
            widget.rosterId,
            assignmentId,
            status,
          );
      ref.invalidate(rosterDetailProvider(widget.rosterId));
    } finally {
      if (mounted) {
        setState(() => _isSavingAttendance = false);
      }
    }
  }
}
