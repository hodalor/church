import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/utils/app_colors.dart';
import '../../../../core/utils/app_text_styles.dart';
import '../../members/widgets/member_bottom_navigation.dart';
import '../providers/polls_provider.dart';
import '../widgets/poll_card.dart';

class PollsScreen extends ConsumerStatefulWidget {
  const PollsScreen({super.key});

  @override
  ConsumerState<PollsScreen> createState() => _PollsScreenState();
}

class _PollsScreenState extends ConsumerState<PollsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(pollsProvider.notifier).loadPolls();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(pollsProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: Text('Church Polls', style: AppTextStyles.titleMedium),
      ),
      bottomNavigationBar: const MemberBottomNavigation(currentIndex: 4),
      body: RefreshIndicator(
        onRefresh: () => ref.read(pollsProvider.notifier).loadPolls(),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          children: <Widget>[
            if (state.isLoading && state.polls.isEmpty)
              const Padding(
                padding: EdgeInsets.only(top: 120),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (state.polls.isEmpty)
              Column(
                children: <Widget>[
                  const SizedBox(height: 120),
                  Icon(
                    Icons.how_to_vote_outlined,
                    size: 72,
                    color: AppColors.primary.withValues(alpha: 0.22),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    'No active polls right now',
                    style: AppTextStyles.headlineMedium,
                    textAlign: TextAlign.center,
                  ),
                ],
              )
            else
              ...state.polls.map(
                (poll) => Padding(
                  padding: const EdgeInsets.only(bottom: 14),
                  child: PollCard(
                    poll: poll,
                    onVote: (optionId) =>
                        ref.read(pollsProvider.notifier).vote(poll.pollId, optionId),
                  ),
                ),
              ),
            const SizedBox(height: 12),
            Theme(
              data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
              child: ExpansionTile(
                tilePadding: EdgeInsets.zero,
                title: Text('Past Polls', style: AppTextStyles.titleMedium),
                children: state.closedPolls
                    .map(
                      (poll) => Padding(
                        padding: const EdgeInsets.only(bottom: 14),
                        child: PollCard(
                          poll: poll,
                          onVote: (_) async {},
                        ),
                      ),
                    )
                    .toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
