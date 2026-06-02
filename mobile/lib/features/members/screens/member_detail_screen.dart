import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/member_detail_provider.dart';
import '../widgets/health_score_card.dart';
import '../widgets/member_avatar.dart';

class MemberDetailScreen extends ConsumerWidget {
  const MemberDetailScreen({
    super.key,
    required this.memberId,
  });

  final String memberId;

  bool _canViewLeaderSections(String? role) {
    return <String>{'head_pastor', 'care_leader', 'super_admin'}.contains(role);
  }

  Future<void> _launchUri(Uri uri) async {
    if (!await launchUrl(uri)) {
      throw Exception('Could not open ${uri.toString()}');
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final memberAsync = ref.watch(memberDetailProvider(memberId));
    final role = ref.watch(authProvider).user?.role;
    final showLeaderSections = _canViewLeaderSections(role);

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: memberAsync.when(
        data: (member) => CustomScrollView(
          slivers: <Widget>[
            SliverAppBar(
              expandedHeight: 300,
              pinned: true,
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              flexibleSpace: FlexibleSpaceBar(
                background: Stack(
                  fit: StackFit.expand,
                  children: <Widget>[
                    if (member.photoUrl != null && member.photoUrl!.isNotEmpty)
                      CachedNetworkImage(
                        imageUrl: member.photoUrl!,
                        fit: BoxFit.cover,
                      )
                    else
                      Container(
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            colors: <Color>[AppColors.primary, Color(0xFF32446F)],
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                          ),
                        ),
                        child: Center(
                          child: MemberAvatar(
                            photoUrl: member.photoUrl,
                            firstName: member.firstName,
                            lastName: member.lastName,
                            radius: 48,
                          ),
                        ),
                      ),
                    Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: <Color>[
                            Colors.black.withValues(alpha: 0.1),
                            Colors.black.withValues(alpha: 0.65),
                          ],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                      ),
                    ),
                    Positioned(
                      left: 20,
                      right: 20,
                      bottom: 22,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text(
                            member.fullName,
                            style: AppTextStyles.displayLarge.copyWith(
                              color: Colors.white,
                              fontSize: 42,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppColors.accent.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              member.memberId,
                              style: AppTextStyles.bodyMedium.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.all(20),
              sliver: SliverList.list(
                children: <Widget>[
                  _SectionCard(
                    title: 'Contact',
                    child: Column(
                      children: <Widget>[
                        _InfoRow(
                          label: 'Phone',
                          value: member.phone ?? 'Not provided',
                          onTap: member.phone != null
                              ? () => _launchUri(Uri.parse('tel:${member.phone}'))
                              : null,
                        ),
                        _InfoRow(
                          label: 'Email',
                          value: member.email ?? 'Not provided',
                          onTap: member.email != null
                              ? () => _launchUri(Uri.parse('mailto:${member.email}'))
                              : null,
                        ),
                        _InfoRow(
                          label: 'Address',
                          value: [
                            member.address,
                            member.city,
                            member.country,
                          ].whereType<String>().where((part) => part.isNotEmpty).join(', ').ifEmpty('Not provided'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  _SectionCard(
                    title: 'Church Info',
                    child: Column(
                      children: <Widget>[
                        _InfoRow(label: 'Membership', value: member.membershipStatus ?? 'Member'),
                        _InfoRow(label: 'Branch', value: member.branch ?? 'Not assigned'),
                        _InfoRow(
                          label: 'Department',
                          value: member.department.isEmpty ? 'Not assigned' : member.department.join(', '),
                        ),
                        _InfoRow(label: 'Cell Group', value: member.cellGroup ?? 'Not assigned'),
                        _InfoRow(
                          label: 'Member Since',
                          value: member.membershipDate != null
                              ? _formatDate(member.membershipDate!)
                              : 'Not recorded',
                        ),
                      ],
                    ),
                  ),
                  if (showLeaderSections) ...<Widget>[
                    const SizedBox(height: 16),
                    HealthScoreCard(healthScore: member.healthScore),
                    const SizedBox(height: 16),
                    _SectionCard(
                      title: 'Actions',
                      child: Column(
                        children: <Widget>[
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              onPressed: () {},
                              icon: const Icon(Icons.message_outlined),
                              label: const Text('Send Message'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton.icon(
                              onPressed: () {},
                              icon: const Icon(Icons.home_work_outlined),
                              label: const Text('Log Visit'),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: AppColors.primary,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
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

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
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
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.label,
    required this.value,
    this.onTap,
  });

  final String label;
  final String value;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final content = Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          SizedBox(
            width: 110,
            child: Text(
              label,
              style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w700),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: AppTextStyles.bodyLarge.copyWith(
                color: onTap != null ? AppColors.primary : AppColors.primary,
                decoration: onTap != null ? TextDecoration.underline : TextDecoration.none,
              ),
            ),
          ),
        ],
      ),
    );

    if (onTap == null) {
      return content;
    }

    return InkWell(onTap: onTap, child: content);
  }
}

extension on String {
  String ifEmpty(String fallback) => isEmpty ? fallback : this;
}
