import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/models/event.dart';
import '../data/models/registration.dart';
import '../data/models/ticket_tier.dart';
import '../providers/events_provider.dart';
import '../providers/my_registrations_provider.dart';
import '../widgets/ticket_tier_card.dart';

class RegistrationSheet extends ConsumerStatefulWidget {
  const RegistrationSheet({
    super.key,
    required this.event,
    this.initialTier,
  });

  final Event event;
  final TicketTier? initialTier;

  @override
  ConsumerState<RegistrationSheet> createState() => _RegistrationSheetState();
}

class _RegistrationSheetState extends ConsumerState<RegistrationSheet> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  bool _isLoading = false;
  Registration? _registration;
  int _quantity = 1;
  TicketTier? _selectedTier;

  @override
  void initState() {
    super.initState();
    _selectedTier = widget.initialTier ?? (widget.event.ticketTiers.isNotEmpty ? widget.event.ticketTiers.first : null);
    final user = ref.read(authProvider).user;
    _nameController.text = user?.fullName ?? '';
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  double get _totalAmount => (_selectedTier?.price ?? 0) * _quantity;

  Future<void> _submit() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final user = ref.read(authProvider).user;
      final registration = await ref.read(eventRepositoryProvider).registerForEvent(
            widget.event.eventId,
            <String, dynamic>{
              if (user?.memberId != null && user!.memberId!.isNotEmpty) 'memberId': user.memberId,
              if (_nameController.text.trim().isNotEmpty) 'memberName': _nameController.text.trim(),
              if (_phoneController.text.trim().isNotEmpty) 'phone': _phoneController.text.trim(),
              if (_emailController.text.trim().isNotEmpty) 'email': _emailController.text.trim(),
              'quantity': _quantity,
              if (_selectedTier != null) 'tierId': _selectedTier!.tierId,
            },
          );

      ref.invalidate(myRegistrationsProvider);
      ref.read(eventsProvider.notifier).refresh();
      if (!mounted) {
        return;
      }
      setState(() {
        _registration = registration;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.toString())),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final isMember = authState.user?.memberId != null && authState.user!.memberId!.isNotEmpty;

    return DraggableScrollableSheet(
      initialChildSize: 0.86,
      minChildSize: 0.6,
      maxChildSize: 0.96,
      expand: false,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
          ),
          child: Stack(
            children: <Widget>[
              ListView(
                controller: scrollController,
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
                children: <Widget>[
                  Center(
                    child: Container(
                      width: 44,
                      height: 5,
                      decoration: BoxDecoration(
                        color: AppColors.inputBorder,
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),
                  Text('Register for Event', style: AppTextStyles.titleMedium.copyWith(fontSize: 22)),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: AppColors.inputBorder),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text(widget.event.title, style: AppTextStyles.titleMedium),
                        const SizedBox(height: 6),
                        Text(
                          '${widget.event.formattedDate} • ${widget.event.venue ?? 'Venue TBD'}',
                          style: AppTextStyles.bodyMedium,
                        ),
                      ],
                    ),
                  ),
                  if (!widget.event.isFree && widget.event.ticketTiers.isNotEmpty) ...<Widget>[
                    const SizedBox(height: 22),
                    Text('Select Tier', style: AppTextStyles.titleMedium),
                    const SizedBox(height: 12),
                    ...widget.event.ticketTiers.map(
                      (tier) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: TicketTierCard(
                          tier: tier,
                          selected: _selectedTier?.tierId == tier.tierId,
                          onTap: () => setState(() => _selectedTier = tier),
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: <Widget>[
                        Text('Quantity', style: AppTextStyles.titleMedium),
                        const Spacer(),
                        IconButton(
                          onPressed: _quantity > 1 ? () => setState(() => _quantity--) : null,
                          icon: const Icon(Icons.remove_circle_outline_rounded),
                        ),
                        Text('$_quantity', style: AppTextStyles.titleMedium),
                        IconButton(
                          onPressed: _quantity < 10 ? () => setState(() => _quantity++) : null,
                          icon: const Icon(Icons.add_circle_outline_rounded),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.05),
                        borderRadius: BorderRadius.circular(18),
                      ),
                      child: Row(
                        children: <Widget>[
                          Text('Total', style: AppTextStyles.bodyLarge),
                          const Spacer(),
                          Text(
                            '${_selectedTier?.currency ?? widget.event.currency ?? 'USD'} ${_totalAmount.toStringAsFixed(2)}',
                            style: AppTextStyles.titleMedium,
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 22),
                  if (!isMember) ...<Widget>[
                    AppTextField(
                      controller: _nameController,
                      label: 'Name',
                      hintText: 'Your full name',
                      prefixIcon: Icons.person_outline_rounded,
                    ),
                    const SizedBox(height: 14),
                    AppTextField(
                      controller: _phoneController,
                      label: 'Phone',
                      hintText: 'Phone number',
                      keyboardType: TextInputType.phone,
                      prefixIcon: Icons.phone_outlined,
                    ),
                    const SizedBox(height: 14),
                    AppTextField(
                      controller: _emailController,
                      label: 'Email',
                      hintText: 'Email address',
                      keyboardType: TextInputType.emailAddress,
                      prefixIcon: Icons.email_outlined,
                    ),
                  ] else ...<Widget>[
                    AppTextField(
                      controller: _phoneController,
                      label: 'Phone',
                      hintText: 'Confirm your phone number',
                      keyboardType: TextInputType.phone,
                      prefixIcon: Icons.phone_outlined,
                    ),
                    const SizedBox(height: 14),
                    AppTextField(
                      controller: _emailController,
                      label: 'Email',
                      hintText: 'Confirm your email address',
                      keyboardType: TextInputType.emailAddress,
                      prefixIcon: Icons.email_outlined,
                    ),
                  ],
                  const SizedBox(height: 20),
                  AppButton(
                    label: 'Confirm Registration',
                    onPressed: _submit,
                    isLoading: _isLoading,
                    icon: Icons.confirmation_num_outlined,
                  ),
                ],
              ),
              if (_registration != null)
                Positioned.fill(
                  child: ColoredBox(
                    color: AppColors.overlay,
                    child: Center(
                      child: Container(
                        margin: const EdgeInsets.all(24),
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(28),
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: <Widget>[
                            Container(
                              width: 84,
                              height: 84,
                              decoration: BoxDecoration(
                                color: AppColors.success.withValues(alpha: 0.12),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.confirmation_num_rounded, color: AppColors.success, size: 46),
                            ),
                            const SizedBox(height: 18),
                            Text("You're Registered!", style: AppTextStyles.titleMedium.copyWith(fontSize: 24)),
                            const SizedBox(height: 10),
                            Text(
                              '${widget.event.title}\n${widget.event.formattedDate}',
                              textAlign: TextAlign.center,
                              style: AppTextStyles.bodyLarge,
                            ),
                            const SizedBox(height: 18),
                            AppButton(
                              label: 'View My Ticket',
                              onPressed: () => Navigator.of(context).pop(_registration),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}
