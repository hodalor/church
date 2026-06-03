import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/utils/app_colors.dart';
import '../../../../core/utils/app_text_styles.dart';
import '../../auth/providers/auth_provider.dart';
import '../../members/widgets/member_bottom_navigation.dart';
import '../providers/prayer_requests_provider.dart';
import '../widgets/prayer_request_card.dart';

class PrayerRequestsScreen extends ConsumerStatefulWidget {
  const PrayerRequestsScreen({
    super.key,
    this.focusRequestId,
  });

  final String? focusRequestId;

  @override
  ConsumerState<PrayerRequestsScreen> createState() =>
      _PrayerRequestsScreenState();
}

class _PrayerRequestsScreenState extends ConsumerState<PrayerRequestsScreen> {
  final List<String> _filters = <String>[
    'all',
    'open',
    'in_prayer',
    'answered',
    'urgent',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(prayerRequestsProvider.notifier).loadRequests();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(prayerRequestsProvider);
    final currentUser = ref.watch(authProvider).user;
    final requests = state.requests;
    final openCount = requests.where((item) => item.status == 'open').length;
    final inPrayerCount =
        requests.where((item) => item.status == 'in_prayer').length;
    final answeredCount =
        requests.where((item) => item.status == 'answered').length;

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: Text('Prayer Requests', style: AppTextStyles.titleMedium),
        actions: <Widget>[
          IconButton(
            onPressed: () => context.push('/prayer-requests/submit'),
            icon: const Icon(Icons.add_rounded),
          ),
        ],
      ),
      bottomNavigationBar: const MemberBottomNavigation(currentIndex: 4),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/prayer-requests/submit'),
        backgroundColor: AppColors.accent,
        foregroundColor: Colors.white,
        icon: const Text('🙏'),
        label: const Text('Submit Prayer Request'),
      ),
      body: RefreshIndicator(
        onRefresh: () =>
            ref.read(prayerRequestsProvider.notifier).loadRequests(filter: state.filter),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
          children: <Widget>[
            Row(
              children: <Widget>[
                _StatCard(label: 'Open', value: openCount),
                const SizedBox(width: 12),
                _StatCard(label: 'In Prayer', value: inPrayerCount),
                const SizedBox(width: 12),
                _StatCard(label: 'Answered', value: answeredCount),
              ],
            ),
            const SizedBox(height: 18),
            SizedBox(
              height: 40,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemBuilder: (context, index) {
                  final filter = _filters[index];
                  final active = state.filter == filter;
                  return ChoiceChip(
                    selected: active,
                    label: Text(filter.replaceAll('_', ' ')),
                    selectedColor: AppColors.accent.withValues(alpha: 0.18),
                    onSelected: (_) {
                      ref.read(prayerRequestsProvider.notifier).loadRequests(
                            filter: filter,
                          );
                    },
                  );
                },
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemCount: _filters.length,
              ),
            ),
            const SizedBox(height: 18),
            if (state.isLoading && requests.isEmpty)
              const Padding(
                padding: EdgeInsets.only(top: 120),
                child: Center(child: CircularProgressIndicator()),
              )
            else
              ...requests.map(
                (request) => Padding(
                  padding: const EdgeInsets.only(bottom: 14),
                  child: PrayerRequestCard(
                    request: request,
                    onPray: () =>
                        ref.read(prayerRequestsProvider.notifier).pray(request.requestId),
                    onStatusChanged: (status) async {
                      String? testimonial;
                      if (status == 'answered') {
                        testimonial = await _promptForTestimony(context);
                      }
                      await ref.read(prayerRequestsProvider.notifier).updateStatus(
                            request.requestId,
                            status,
                            testimonial: testimonial,
                          );
                    },
                    onAssignToMe: currentUser == null
                        ? null
                        : () => ref
                            .read(prayerRequestsProvider.notifier)
                            .assignToMe(
                              request.requestId,
                              userId: currentUser.userId,
                              assigneeName:
                                  currentUser.fullName ?? currentUser.username,
                            ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Future<String?> _promptForTestimony(BuildContext context) async {
    final controller = TextEditingController();
    final result = await showDialog<String>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Add testimony'),
          content: TextField(
            controller: controller,
            maxLines: 4,
            decoration: const InputDecoration(
              hintText: 'Share the testimony...',
            ),
          ),
          actions: <Widget>[
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Skip'),
            ),
            TextButton(
              onPressed: () => Navigator.of(context).pop(controller.text.trim()),
              child: const Text('Save'),
            ),
          ],
        );
      },
    );
    controller.dispose();
    return result;
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
  });

  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(label, style: AppTextStyles.bodyMedium),
            const SizedBox(height: 8),
            Text('$value', style: AppTextStyles.headlineMedium),
          ],
        ),
      ),
    );
  }
}
