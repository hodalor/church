import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../../../shared/widgets/app_button.dart';
import '../data/models/event.dart';
import '../data/models/registration.dart';
import '../providers/events_provider.dart';
import '../providers/my_registrations_provider.dart';
import '../widgets/countdown_chip.dart';
import '../widgets/registration_ticket_card.dart';
import '../widgets/ticket_tier_card.dart';
import 'registration_sheet.dart';

final eventDetailProvider = FutureProvider.family<Event, String>((ref, eventId) async {
  return ref.watch(eventRepositoryProvider).getEventById(eventId);
});

class EventDetailScreen extends ConsumerStatefulWidget {
  const EventDetailScreen({
    super.key,
    required this.eventId,
  });

  final String eventId;

  @override
  ConsumerState<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends ConsumerState<EventDetailScreen> {
  bool _expandedDescription = false;
  int _selectedTierIndex = 0;

  @override
  Widget build(BuildContext context) {
    final eventAsync = ref.watch(eventDetailProvider(widget.eventId));
    final registrationsAsync = ref.watch(myRegistrationsProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: eventAsync.when(
        data: (event) {
          final myRegistration = registrationsAsync.valueOrNull
              ?.where((item) => item.eventId == widget.eventId)
              .cast<Registration?>()
              .firstWhere(
                (item) => item != null,
                orElse: () => null,
              );

          return CustomScrollView(
            slivers: <Widget>[
              SliverAppBar(
                expandedHeight: 280,
                pinned: true,
                stretch: true,
                backgroundColor: AppColors.primary,
                flexibleSpace: FlexibleSpaceBar(
                  collapseMode: CollapseMode.parallax,
                  background: Stack(
                    fit: StackFit.expand,
                    children: <Widget>[
                      if ((event.bannerUrl ?? '').isNotEmpty)
                        Image.network(event.bannerUrl!, fit: BoxFit.cover)
                      else
                        const DecoratedBox(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: <Color>[AppColors.primary, Color(0xFF31446F)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                          ),
                        ),
                      DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: <Color>[
                              Colors.transparent,
                              Colors.black.withValues(alpha: 0.7),
                            ],
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 18, 20, 32),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        children: <Widget>[
                          Text(event.title, style: AppTextStyles.displayLarge.copyWith(fontSize: 34)),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.06),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              event.type.replaceAll('_', ' '),
                              style: AppTextStyles.bodyMedium.copyWith(
                                color: AppColors.primary,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: event.statusColor.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              event.status.replaceAll('_', ' '),
                              style: AppTextStyles.bodyMedium.copyWith(
                                color: event.statusColor,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      _InfoCard(
                        icon: Icons.calendar_month_rounded,
                        title: 'Date & Time',
                        content: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            Text(event.formattedDate, style: AppTextStyles.bodyLarge.copyWith(fontWeight: FontWeight.w700)),
                            const SizedBox(height: 6),
                            Text(event.formattedTime, style: AppTextStyles.bodyMedium),
                            if (event.isUpcoming) ...<Widget>[
                              const SizedBox(height: 10),
                              CountdownChip(targetDate: event.startDate),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      _InfoCard(
                        icon: Icons.location_on_outlined,
                        title: 'Location',
                        content: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            Text(event.venue ?? 'Venue TBD', style: AppTextStyles.bodyLarge.copyWith(fontWeight: FontWeight.w700)),
                            if ((event.address ?? '').isNotEmpty) ...<Widget>[
                              const SizedBox(height: 6),
                              Text(event.address!, style: AppTextStyles.bodyMedium),
                            ],
                            const SizedBox(height: 12),
                            Wrap(
                              spacing: 12,
                              runSpacing: 12,
                              children: <Widget>[
                                OutlinedButton.icon(
                                  onPressed: () => _openDirections(event),
                                  icon: const Icon(Icons.map_outlined),
                                  label: const Text('Get Directions'),
                                ),
                                if (event.isOnline && (event.streamUrl ?? '').isNotEmpty)
                                  ElevatedButton.icon(
                                    onPressed: () => _openUrl(event.streamUrl!),
                                    icon: const Icon(Icons.play_circle_outline_rounded),
                                    label: const Text('Join Stream'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppColors.primary,
                                      foregroundColor: Colors.white,
                                    ),
                                  ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      if ((event.description ?? '').isNotEmpty) ...<Widget>[
                        const SizedBox(height: 20),
                        Text('Description', style: AppTextStyles.titleMedium),
                        const SizedBox(height: 10),
                        AnimatedCrossFade(
                          duration: const Duration(milliseconds: 200),
                          firstChild: Text(
                            event.description!,
                            maxLines: 5,
                            overflow: TextOverflow.ellipsis,
                            style: AppTextStyles.bodyLarge,
                          ),
                          secondChild: Text(event.description!, style: AppTextStyles.bodyLarge),
                          crossFadeState: _expandedDescription ? CrossFadeState.showSecond : CrossFadeState.showFirst,
                        ),
                        TextButton(
                          onPressed: () => setState(() => _expandedDescription = !_expandedDescription),
                          child: Text(_expandedDescription ? 'Show less' : 'Read more'),
                        ),
                      ],
                      if (!event.isFree && event.ticketTiers.isNotEmpty) ...<Widget>[
                        const SizedBox(height: 20),
                        Text('Ticket Tiers', style: AppTextStyles.titleMedium),
                        const SizedBox(height: 10),
                        ...event.ticketTiers.asMap().entries.map(
                              (entry) => Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: TicketTierCard(
                                  tier: entry.value,
                                  selected: _selectedTierIndex == entry.key,
                                  onTap: () => setState(() => _selectedTierIndex = entry.key),
                                ),
                              ),
                            ),
                      ],
                      const SizedBox(height: 20),
                      Text('Registration', style: AppTextStyles.titleMedium),
                      const SizedBox(height: 10),
                      if (myRegistration != null) ...<Widget>[
                        RegistrationTicketCard(
                          registration: myRegistration,
                          bannerUrl: event.bannerUrl,
                          onTapQr: () => context.push('/events/${event.eventId}/qr'),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: <Widget>[
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () => context.push('/events/${event.eventId}/qr'),
                                child: const Text('View My Ticket'),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: ElevatedButton(
                                onPressed: () => context.push('/events/${event.eventId}/qr'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.primary,
                                  foregroundColor: Colors.white,
                                ),
                                child: const Text('Check In with QR'),
                              ),
                            ),
                          ],
                        ),
                      ] else
                        AppButton(
                          label: event.isFull ? 'Event Full' : 'Register Now',
                          onPressed: event.isFull
                              ? null
                              : () => _openRegistrationSheet(
                                    context,
                                    event,
                                    initialTier: event.ticketTiers.isNotEmpty
                                        ? event.ticketTiers[_selectedTierIndex]
                                        : null,
                                  ),
                        ),
                      const SizedBox(height: 20),
                      _InfoCard(
                        icon: Icons.badge_outlined,
                        title: 'Organizer',
                        content: Row(
                          children: <Widget>[
                            CircleAvatar(
                              radius: 26,
                              backgroundColor: AppColors.accent.withValues(alpha: 0.22),
                              child: const Icon(Icons.person_rounded, color: AppColors.primary),
                            ),
                            const SizedBox(width: 12),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: <Widget>[
                                Text(
                                  (event.organizerUserId ?? 'Church Events Team').isNotEmpty
                                      ? event.organizerUserId ?? 'Church Events Team'
                                      : 'Church Events Team',
                                  style: AppTextStyles.bodyLarge.copyWith(fontWeight: FontWeight.w700),
                                ),
                                const SizedBox(height: 4),
                                Text('Organizer', style: AppTextStyles.bodyMedium),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
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

  Future<void> _openDirections(Event event) async {
    final target = event.gpsCoordinates != null &&
            event.gpsCoordinates!['lat'] != null &&
            event.gpsCoordinates!['lng'] != null
        ? 'https://www.google.com/maps/search/?api=1&query=${event.gpsCoordinates!['lat']},${event.gpsCoordinates!['lng']}'
        : 'https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent(event.address ?? event.venue ?? event.title)}';
    await _openUrl(target);
  }

  Future<void> _openUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _openRegistrationSheet(
    BuildContext context,
    Event event, {
    required dynamic initialTier,
  }) async {
    await showModalBottomSheet<Registration>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => RegistrationSheet(
        event: event,
        initialTier: initialTier,
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({
    required this.icon,
    required this.title,
    required this.content,
  });

  final IconData icon;
  final String title;
  final Widget content;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.inputBorder),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: AppColors.primary),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(title, style: AppTextStyles.titleMedium),
                const SizedBox(height: 10),
                content,
              ],
            ),
          ),
        ],
      ),
    );
  }
}
