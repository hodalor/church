import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../providers/member_detail_provider.dart';
import '../widgets/health_score_card.dart';
import '../widgets/member_avatar.dart';
import '../widgets/member_bottom_navigation.dart';
import '../widgets/qr_code_sheet.dart';
import '../../volunteers/providers/volunteer_roster_provider.dart';
import 'package:go_router/go_router.dart';

class MyProfileScreen extends ConsumerWidget {
  const MyProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(myProfileProvider);
    final volunteerAsync = ref.watch(myVolunteerProfileProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: Text('My Profile', style: AppTextStyles.titleMedium),
      ),
      bottomNavigationBar: const MemberBottomNavigation(currentIndex: 5),
      body: profileAsync.when(
        data: (member) => RefreshIndicator(
          onRefresh: () => ref.refresh(myProfileProvider.future),
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: <Widget>[
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.card,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppColors.inputBorder),
                ),
                child: Column(
                  children: <Widget>[
                    MemberAvatar(
                      photoUrl: member.photoUrl,
                      firstName: member.firstName,
                      lastName: member.lastName,
                      radius: 42,
                    ),
                    const SizedBox(height: 14),
                    Text(member.fullName, style: AppTextStyles.headlineMedium),
                    const SizedBox(height: 6),
                    Text(member.memberId, style: AppTextStyles.bodyMedium),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: () {
                        showModalBottomSheet<void>(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: AppColors.surface,
                          shape: const RoundedRectangleBorder(
                            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                          ),
                          builder: (_) => QrCodeSheet(member: member),
                        );
                      },
                      icon: const Icon(Icons.qr_code_rounded),
                      label: const Text('Show QR Code'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 12),
                    OutlinedButton.icon(
                      onPressed: () => context.push('/volunteer'),
                      icon: Icon(
                        volunteerAsync.valueOrNull == null
                            ? Icons.volunteer_activism_outlined
                            : Icons.calendar_month_rounded,
                      ),
                      label: Text(
                        volunteerAsync.valueOrNull == null
                            ? 'Volunteer Info'
                            : 'My Volunteer Dashboard',
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              _ProfileSection(
                title: 'Personal',
                entries: <MapEntry<String, String>>[
                  MapEntry('First Name', member.firstName),
                  MapEntry('Last Name', member.lastName),
                  MapEntry('Other Name', member.otherName ?? 'Not provided'),
                  MapEntry('Gender', member.gender ?? 'Not provided'),
                ],
              ),
              const SizedBox(height: 16),
              _ProfileSection(
                title: 'Contact',
                entries: <MapEntry<String, String>>[
                  MapEntry('Phone', member.phone ?? 'Not provided'),
                  MapEntry('Alt Phone', member.altPhone ?? 'Not provided'),
                  MapEntry('Email', member.email ?? 'Not provided'),
                  MapEntry('Address', member.address ?? 'Not provided'),
                ],
              ),
              const SizedBox(height: 16),
              _ProfileSection(
                title: 'Church Info',
                entries: <MapEntry<String, String>>[
                  MapEntry('Membership', member.membershipStatus ?? 'Member'),
                  MapEntry('Branch', member.branch ?? 'Not assigned'),
                  MapEntry(
                    'Department',
                    member.department.isEmpty ? 'Not assigned' : member.department.join(', '),
                  ),
                  MapEntry('Cell Group', member.cellGroup ?? 'Not assigned'),
                ],
              ),
              const SizedBox(height: 16),
              HealthScoreCard(healthScore: member.healthScore),
            ],
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              error.toString(),
              textAlign: TextAlign.center,
              style: AppTextStyles.bodyLarge,
            ),
          ),
        ),
      ),
    );
  }
}

class _ProfileSection extends StatelessWidget {
  const _ProfileSection({
    required this.title,
    required this.entries,
  });

  final String title;
  final List<MapEntry<String, String>> entries;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.inputBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(title, style: AppTextStyles.titleMedium),
          const SizedBox(height: 14),
          ...entries.map(
            (entry) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  SizedBox(
                    width: 110,
                    child: Text(
                      entry.key,
                      style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w700),
                    ),
                  ),
                  Expanded(
                    child: Text(entry.value, style: AppTextStyles.bodyLarge),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
