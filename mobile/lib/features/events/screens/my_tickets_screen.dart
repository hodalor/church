import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../../members/widgets/member_bottom_navigation.dart';
import '../providers/events_provider.dart';
import '../providers/my_registrations_provider.dart';
import '../widgets/registration_ticket_card.dart';

class MyTicketsScreen extends ConsumerStatefulWidget {
  const MyTicketsScreen({super.key});

  @override
  ConsumerState<MyTicketsScreen> createState() => _MyTicketsScreenState();
}

class _MyTicketsScreenState extends ConsumerState<MyTicketsScreen> {
  String _tab = 'upcoming';

  @override
  Widget build(BuildContext context) {
    final registrationsAsync = ref.watch(myRegistrationsProvider);
    final events = ref.watch(eventsProvider).events;
    final eventMap = {for (final event in events) event.eventId: event};

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: Text('My Tickets', style: AppTextStyles.titleMedium),
      ),
      bottomNavigationBar: const MemberBottomNavigation(currentIndex: 3),
      body: registrationsAsync.when(
        data: (registrations) {
          final filtered = registrations.where((registration) {
            final event = eventMap[registration.eventId];
            final date = event?.startDate;
            if (_tab == 'all' || date == null) {
              return true;
            }
            final isUpcoming = date.isAfter(DateTime.now());
            return _tab == 'upcoming' ? isUpcoming : !isUpcoming;
          }).toList();

          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 14, 20, 28),
            children: <Widget>[
              Wrap(
                spacing: 10,
                children: <String>['upcoming', 'past', 'all']
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
              if (filtered.isEmpty)
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: AppColors.inputBorder),
                  ),
                  child: Text('No ticket registrations yet', style: AppTextStyles.bodyLarge),
                )
              else
                ...filtered.map((registration) {
                  final event = eventMap[registration.eventId];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: RegistrationTicketCard(
                      registration: registration,
                      bannerUrl: event?.bannerUrl,
                      onTapQr: () => context.push('/events/${registration.eventId}/qr'),
                    ),
                  );
                }),
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
}
