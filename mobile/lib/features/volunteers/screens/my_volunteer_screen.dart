import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../../members/widgets/member_bottom_navigation.dart';
import '../providers/volunteer_roster_provider.dart';
import '../volunteers_utils.dart';
import '../widgets/badge_row_widget.dart';
import '../widgets/reliability_score_widget.dart';
import '../widgets/upcoming_assignment_card.dart';

class MyVolunteerScreen extends ConsumerWidget {
  const MyVolunteerScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final volunteerAsync = ref.watch(myVolunteerProfileProvider);
    final rosterState = ref.watch(volunteerRosterProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: Text('My Volunteer Profile', style: AppTextStyles.titleMedium),
      ),
      bottomNavigationBar: const MemberBottomNavigation(currentIndex: 6),
      body: volunteerAsync.when(
        data: (volunteer) {
          if (volunteer == null) {
            return ListView(
              padding: const EdgeInsets.all(24),
              children: <Widget>[
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(28),
                    border: Border.all(color: AppColors.inputBorder),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text('Become a Volunteer', style: AppTextStyles.titleMedium.copyWith(fontSize: 24)),
                      const SizedBox(height: 12),
                      Text(
                        'You do not have a volunteer profile yet. Speak with your church leader to get registered and begin serving.',
                        style: AppTextStyles.bodyLarge,
                      ),
                      const SizedBox(height: 18),
                      ElevatedButton(
                        onPressed: () => context.go('/events'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                        ),
                        child: const Text('Explore Events'),
                      ),
                    ],
                  ),
                ),
              ],
            );
          }

          final upcomingCards = rosterState.upcomingRosters
              .where((roster) => roster.myAssignment != null)
              .take(3)
              .toList();

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(myVolunteerProfileProvider);
              await ref.read(volunteerRosterProvider.notifier).refresh();
            },
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
              children: <Widget>[
                Container(
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: <Color>[AppColors.accent, Color(0xFFE1C36F)],
                    ),
                    borderRadius: BorderRadius.circular(28),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text(
                        'I am a Volunteer',
                        style: AppTextStyles.titleMedium.copyWith(
                          color: AppColors.primary,
                          fontSize: 24,
                        ),
                      ),
                      const SizedBox(height: 14),
                      Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        children: volunteer.departments
                            .map(
                              (department) => Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.65),
                                  borderRadius: BorderRadius.circular(999),
                                ),
                                child: Text(
                                  department,
                                  style: AppTextStyles.bodyMedium.copyWith(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            )
                            .toList(),
                      ),
                      const SizedBox(height: 18),
                      Row(
                        children: <Widget>[
                          ReliabilityScoreWidget(score: volunteer.performance.reliabilityScore),
                          const SizedBox(width: 18),
                          Expanded(
                            child: BadgeRowWidget(badges: volunteer.performance.badges),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  children: <Widget>[
                    Text('Upcoming Assignments', style: AppTextStyles.titleMedium.copyWith(fontSize: 22)),
                    const Spacer(),
                    TextButton(
                      onPressed: () => context.push('/volunteer/rosters'),
                      child: const Text('View All'),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                if (upcomingCards.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: AppColors.inputBorder),
                    ),
                    child: Text('No upcoming duties yet.', style: AppTextStyles.bodyLarge),
                  )
                else
                  ...upcomingCards.map(
                    (roster) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: UpcomingAssignmentCard(
                        roster: roster,
                        assignment: roster.myAssignment!,
                        onTap: () => context.push('/volunteer/rosters/${roster.rosterId}'),
                        onConfirm: () => ref.read(volunteerRosterProvider.notifier).confirmAssignment(
                              roster.myAssignment!.assignmentId,
                            ),
                      ),
                    ),
                  ),
                const SizedBox(height: 20),
                Text('Performance', style: AppTextStyles.titleMedium.copyWith(fontSize: 22)),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: <Widget>[
                    _StatChip(label: 'Attended', value: '${volunteer.performance.attended}'),
                    _StatChip(label: 'Absent', value: '${volunteer.performance.absent}'),
                    _StatChip(label: 'Total', value: '${volunteer.performance.totalAssignments}'),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  'Last served: ${formatRelativeDays(volunteer.performance.lastServedDate)}',
                  style: AppTextStyles.bodyLarge,
                ),
              ],
            ),
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
}

class _StatChip extends StatelessWidget {
  const _StatChip({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.inputBorder),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Text(value, style: AppTextStyles.titleMedium.copyWith(fontSize: 24)),
          const SizedBox(height: 6),
          Text(label, style: AppTextStyles.bodyMedium),
        ],
      ),
    );
  }
}
