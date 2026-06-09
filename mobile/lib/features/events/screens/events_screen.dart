import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../../members/widgets/member_bottom_navigation.dart';
import '../providers/events_provider.dart';
import '../widgets/event_banner_card.dart';
import '../widgets/event_list_tile.dart';

class EventsScreen extends ConsumerStatefulWidget {
  const EventsScreen({super.key});

  @override
  ConsumerState<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends ConsumerState<EventsScreen> {
  String _filter = 'all';

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(eventsProvider);
    final events = state.events;
    final upcomingEvents = events.where((event) => event.isUpcoming || event.isOngoing).toList();
    final filteredEvents = _filter == 'all'
        ? events
        : events.where((event) => event.type == _filter).toList();

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: Text('Events', style: AppTextStyles.titleMedium),
        actions: <Widget>[
          IconButton(
            onPressed: () => _showFilterInfo(context),
            icon: const Icon(Icons.filter_list_rounded),
          ),
        ],
      ),
      bottomNavigationBar: const MemberBottomNavigation(currentIndex: 3),
      body: RefreshIndicator(
        onRefresh: () => ref.read(eventsProvider.notifier).refresh(),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
          children: <Widget>[
            Text('Upcoming Events', style: AppTextStyles.titleMedium.copyWith(fontSize: 22)),
            const SizedBox(height: 14),
            if (upcomingEvents.isEmpty)
              Container(
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppColors.inputBorder),
                ),
                child: Text(
                  'No upcoming events — check back soon',
                  style: AppTextStyles.bodyLarge,
                ),
              )
            else
              SizedBox(
                height: 210,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: upcomingEvents.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 14),
                  itemBuilder: (context, index) {
                    final event = upcomingEvents[index];
                    return EventBannerCard(
                      event: event,
                      onTap: () => context.push('/events/${event.eventId}'),
                    );
                  },
                ),
              ),
            const SizedBox(height: 24),
            Text('All Events', style: AppTextStyles.titleMedium.copyWith(fontSize: 22)),
            const SizedBox(height: 14),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: <String>['all', 'conference', 'concert', 'outreach', 'workshop', 'other']
                  .map(
                    (value) => ChoiceChip(
                      label: Text(value == 'all' ? 'All' : value[0].toUpperCase() + value.substring(1)),
                      selected: _filter == value,
                      selectedColor: AppColors.accent.withValues(alpha: 0.18),
                      onSelected: (_) => setState(() => _filter = value),
                      labelStyle: AppTextStyles.bodyMedium.copyWith(
                        color: _filter == value ? AppColors.primary : AppColors.mutedText,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  )
                  .toList(),
            ),
            const SizedBox(height: 16),
            if (state.isLoading && events.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 32),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (filteredEvents.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 24),
                child: Text('No events match this filter yet.', style: AppTextStyles.bodyLarge),
              )
            else
              ...filteredEvents.map(
                (event) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: EventListTile(
                    event: event,
                    onTap: () => context.push('/events/${event.eventId}'),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _showFilterInfo(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text('Event Filters', style: AppTextStyles.titleMedium),
            const SizedBox(height: 12),
            Text(
              'Use the chips to focus on conferences, concerts, outreach programs, workshops, or other events.',
              style: AppTextStyles.bodyLarge,
            ),
          ],
        ),
      ),
    );
  }
}
