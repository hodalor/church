import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../../shared/widgets/loading_overlay.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/visitors_provider.dart';
import '../visitors_utils.dart';

class VisitorRegistrationScreen extends ConsumerStatefulWidget {
  const VisitorRegistrationScreen({super.key});

  @override
  ConsumerState<VisitorRegistrationScreen> createState() => _VisitorRegistrationScreenState();
}

class _VisitorRegistrationScreenState extends ConsumerState<VisitorRegistrationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _prayerRequestController = TextEditingController();

  String _gender = 'male';
  String _ageGroup = 'adult';
  String _heardAboutUs = kVisitorHearAboutOptions.first['value']!;
  bool _referredByMe = true;
  DateTime _firstVisitDate = DateTime.now();
  final Set<String> _interests = <String>{};

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _prayerRequestController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final visitorsState = ref.watch(visitorsProvider);
    final user = ref.watch(authProvider).user;

    return LoadingOverlay(
      isLoading: visitorsState.isLoading,
      child: Scaffold(
        backgroundColor: AppColors.surface,
        appBar: AppBar(
          title: Text('Register Visitor', style: AppTextStyles.titleMedium),
        ),
        body: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: <Widget>[
              AppTextField(
                controller: _firstNameController,
                label: 'First Name',
                hintText: 'Enter first name',
                validator: (value) => (value == null || value.trim().isEmpty) ? 'First name is required' : null,
              ),
              const SizedBox(height: 14),
              AppTextField(
                controller: _lastNameController,
                label: 'Last Name',
                hintText: 'Enter last name',
                validator: (value) => (value == null || value.trim().isEmpty) ? 'Last name is required' : null,
              ),
              const SizedBox(height: 14),
              AppTextField(
                controller: _phoneController,
                label: 'Phone',
                hintText: 'Enter phone number',
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 14),
              AppTextField(
                controller: _emailController,
                label: 'Email',
                hintText: 'Optional email address',
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 16),
              Text('Gender', style: AppTextStyles.titleMedium),
              const SizedBox(height: 10),
              SegmentedButton<String>(
                segments: const <ButtonSegment<String>>[
                  ButtonSegment<String>(value: 'male', label: Text('Male')),
                  ButtonSegment<String>(value: 'female', label: Text('Female')),
                ],
                selected: <String>{_gender},
                onSelectionChanged: (value) => setState(() => _gender = value.first),
              ),
              const SizedBox(height: 16),
              Text('Age Group', style: AppTextStyles.titleMedium),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: kVisitorAgeGroups.map((ageGroup) {
                  return ChoiceChip(
                    label: Text(stageLabel(ageGroup).replaceAll('New ', '')),
                    selected: _ageGroup == ageGroup,
                    onSelected: (_) => setState(() => _ageGroup = ageGroup),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                initialValue: _heardAboutUs,
                decoration: const InputDecoration(
                  labelText: 'How they heard about us',
                  filled: true,
                  fillColor: Colors.white,
                ),
                items: kVisitorHearAboutOptions
                    .map((option) => DropdownMenuItem<String>(
                          value: option['value'],
                          child: Text(option['label']!),
                        ))
                    .toList(),
                onChanged: (value) {
                  if (value != null) {
                    setState(() => _heardAboutUs = value);
                  }
                },
              ),
              const SizedBox(height: 16),
              SwitchListTile.adaptive(
                value: _referredByMe,
                activeThumbColor: AppColors.accent,
                title: Text('I referred this person', style: AppTextStyles.bodyLarge),
                subtitle: Text(
                  user?.fullName ?? user?.username ?? 'Current member',
                  style: AppTextStyles.bodyMedium,
                ),
                contentPadding: EdgeInsets.zero,
                onChanged: (value) => setState(() => _referredByMe = value),
              ),
              const SizedBox(height: 6),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(
                  'First Visit: ${formatVisitorDate(_firstVisitDate)}',
                  style: AppTextStyles.bodyLarge,
                ),
                trailing: const Icon(Icons.calendar_month_rounded),
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: _firstVisitDate,
                    firstDate: DateTime.now().subtract(const Duration(days: 365)),
                    lastDate: DateTime.now().add(const Duration(days: 365)),
                  );
                  if (picked != null) {
                    setState(() => _firstVisitDate = picked);
                  }
                },
              ),
              const SizedBox(height: 16),
              Text('Interests', style: AppTextStyles.titleMedium),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: kVisitorInterests.map((interest) {
                  final selected = _interests.contains(interest);
                  return FilterChip(
                    label: Text(interest),
                    selected: selected,
                    onSelected: (_) {
                      setState(() {
                        if (selected) {
                          _interests.remove(interest);
                        } else {
                          _interests.add(interest);
                        }
                      });
                    },
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _prayerRequestController,
                minLines: 3,
                maxLines: 5,
                decoration: const InputDecoration(
                  labelText: 'Prayer Request',
                  filled: true,
                  fillColor: Colors.white,
                ),
              ),
              if (visitorsState.error != null) ...<Widget>[
                const SizedBox(height: 12),
                Text(
                  visitorsState.error!,
                  style: AppTextStyles.bodyMedium.copyWith(color: AppColors.danger),
                ),
              ],
              const SizedBox(height: 24),
              AppButton(
                label: 'Register Visitor',
                onPressed: () async {
                  if (!_formKey.currentState!.validate()) {
                    return;
                  }

                  final visitor = await ref.read(visitorsProvider.notifier).registerVisitor(<String, dynamic>{
                        'firstName': _firstNameController.text.trim(),
                        'lastName': _lastNameController.text.trim(),
                        'phone': _phoneController.text.trim(),
                        'email': _emailController.text.trim(),
                        'gender': _gender,
                        'ageGroup': _ageGroup,
                        'heardAboutUs': _heardAboutUs,
                        'firstVisitDate': _firstVisitDate.toIso8601String(),
                        'interests': _interests.toList(),
                        'prayerRequest': _prayerRequestController.text.trim(),
                        if (_referredByMe) 'referredByMember': <String, dynamic>{
                          'memberId': user?.memberId,
                          'memberName': user?.fullName ?? user?.username,
                        },
                      });

                  if (!mounted || visitor == null) {
                    return;
                  }

                  if (!context.mounted) {
                    return;
                  }

                  await showModalBottomSheet<void>(
                    context: context,
                    backgroundColor: AppColors.surface,
                    shape: const RoundedRectangleBorder(
                      borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                    ),
                    builder: (_) => Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text(visitor.fullName, style: AppTextStyles.headlineMedium),
                          const SizedBox(height: 8),
                          Text(
                            'Pipeline started - care leader will follow up.',
                            style: AppTextStyles.bodyLarge,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Assigned care leader: ${visitor.assignedToName ?? 'Assigned automatically'}',
                            style: AppTextStyles.bodyMedium,
                          ),
                          const SizedBox(height: 20),
                          Row(
                            children: <Widget>[
                              Expanded(
                                child: OutlinedButton(
                                  onPressed: () {
                                    Navigator.of(context).pop();
                                    _formKey.currentState?.reset();
                                    _firstNameController.clear();
                                    _lastNameController.clear();
                                    _phoneController.clear();
                                    _emailController.clear();
                                    _prayerRequestController.clear();
                                    setState(() {
                                      _interests.clear();
                                      _firstVisitDate = DateTime.now();
                                    });
                                  },
                                  child: const Text('Register Another'),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: FilledButton(
                                  onPressed: () => Navigator.of(context).pop(),
                                  style: FilledButton.styleFrom(backgroundColor: AppColors.accent),
                                  child: const Text('Done'),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
