import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../../members/widgets/member_bottom_navigation.dart';
import '../data/models/roster.dart';
import '../providers/volunteer_roster_provider.dart';
import '../volunteers_utils.dart';

final pastRostersProvider = FutureProvider<List<Roster>>((ref) async {
  return ref.watch(volunteerRepositoryProvider).getAllRosters(
    <String, dynamic>{'to': DateTime.now().toIso8601String(), 'limit': 50},
  );
});

class RosterListScreen extends ConsumerStatefulWidget {
  const RosterListScreen({super.key});

  @override
  ConsumerState<RosterListScreen> createState() => _RosterListScreenState();
}

class _RosterListScreenState extends ConsumerState<RosterListScreen> {
  String _tab = 'upcoming';

  @override
  Widget build(BuildContext context) {
    final upcomingState = ref.watch(volunteerRosterProvider);
    final pastAsync = ref.watch(pastRostersProvider);
    final rosters = _tab == 'upcoming' ? upcomingState.upcomingRosters : (pastAsync.valueOrNull ?? const <Roster>[]);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: Text('My Rosters', style: AppTextStyles.titleMedium),
      ),
      bottomNavigationBar: const MemberBottomNavigation(currentIndex: 6),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 28),
        children: <Widget>[
          Wrap(
            spacing: 10,
            children: <String>['upcoming', 'past']
                .map(
                  (value) => ChoiceChip(
                    label: Text(value[0].toUpperCase() + value.substring(1)),
                    selected: _tab == value,
                    selectedColor: AppColors.accent.withValues(alpha: 0.18),
                    onSelected: (_) => setState(() => _tab = value),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 18),
          if (_tab == 'past' && pastAsync.isLoading)
            const Center(child: Padding(
              padding: EdgeInsets.all(24),
              child: CircularProgressIndicator(),
            ))
          else if (rosters.isEmpty)
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppColors.inputBorder),
              ),
              child: Text('No rosters found yet.', style: AppTextStyles.bodyLarge),
            )
          else
            ...rosters.map((roster) {
              final assignment = roster.myAssignment;
              final statusColor = assignmentStatusColor(assignment?.status ?? 'assigned');
              return Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: InkWell(
                  onTap: () => context.push('/volunteer/rosters/${roster.rosterId}'),
                  borderRadius: BorderRadius.circular(24),
                  child: Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: AppColors.inputBorder),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            Container(
                              width: 62,
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withValues(alpha: 0.06),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Column(
                                children: <Widget>[
                                  Text('${roster.date?.day ?? '--'}', style: AppTextStyles.titleMedium.copyWith(fontSize: 24)),
                                  Text('${roster.date?.month ?? '--'}', style: AppTextStyles.bodyMedium),
                                ],
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: <Widget>[
                                  Text(roster.title, style: AppTextStyles.titleMedium),
                                  const SizedBox(height: 6),
                                  Text(
                                    '${assignment?.role ?? 'Volunteer'} • ${assignment?.department ?? 'Team'}',
                                    style: AppTextStyles.bodyLarge,
                                  ),
                                  const SizedBox(height: 10),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: statusColor.withValues(alpha: 0.12),
                                      borderRadius: BorderRadius.circular(999),
                                    ),
                                    child: Text(
                                      (assignment?.status ?? 'assigned').replaceAll('_', ' '),
                                      style: AppTextStyles.bodyMedium.copyWith(
                                        color: statusColor,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        if (assignment != null && assignment.status == 'assigned') ...<Widget>[
                          const SizedBox(height: 14),
                          Row(
                            children: <Widget>[
                              Expanded(
                                child: OutlinedButton(
                                  onPressed: () => ref.read(volunteerRosterProvider.notifier).confirmAssignment(
                                        assignment.assignmentId,
                                      ),
                                  child: const Text('Confirm'),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: ElevatedButton(
                                  onPressed: () => context.push('/volunteer/rosters/${roster.rosterId}'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primary,
                                    foregroundColor: Colors.white,
                                  ),
                                  child: const Text('Decline'),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }
}
