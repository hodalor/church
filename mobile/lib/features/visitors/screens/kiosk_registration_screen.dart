import 'dart:async';
import 'package:auto_size_text/auto_size_text.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lottie/lottie.dart';
import 'package:wakelock_plus/wakelock_plus.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../providers/visitors_provider.dart';
import '../visitors_utils.dart';

class KioskRegistrationScreen extends ConsumerStatefulWidget {
  const KioskRegistrationScreen({super.key});

  @override
  ConsumerState<KioskRegistrationScreen> createState() => _KioskRegistrationScreenState();
}

class _KioskRegistrationScreenState extends ConsumerState<KioskRegistrationScreen> {
  int _step = 0;
  bool _unlocked = false;
  bool _submitting = false;
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  String _gender = 'male';
  String _ageGroup = 'adult';
  String _heardAboutUs = kVisitorHearAboutOptions.first['value']!;
  Timer? _resetTimer;
  String? _sessionPasscode;

  String get _churchName => dotenv.env['KIOSK_CHURCH_NAME']?.trim().isNotEmpty == true
      ? dotenv.env['KIOSK_CHURCH_NAME']!.trim()
      : 'Church Family';
  String get _kioskTenantId => dotenv.env['KIOSK_TENANT_ID']?.trim() ?? '';

  @override
  void initState() {
    super.initState();
    WakelockPlus.enable();
    WidgetsBinding.instance.addPostFrameCallback((_) => _promptForPasscode());
  }

  @override
  void dispose() {
    _resetTimer?.cancel();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    WakelockPlus.disable();
    super.dispose();
  }

  Future<void> _promptForPasscode() async {
    final expected = dotenv.env['KIOSK_PASSCODE']?.trim().isNotEmpty == true
        ? dotenv.env['KIOSK_PASSCODE']!.trim()
        : '1234';
    final controller = TextEditingController();

    final unlocked = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Kiosk Access'),
        content: TextField(
          controller: controller,
          obscureText: true,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'Enter kiosk passcode'),
        ),
        actions: <Widget>[
          FilledButton(
            onPressed: () => Navigator.of(context).pop(controller.text.trim() == expected),
            style: FilledButton.styleFrom(backgroundColor: AppColors.accent),
            child: const Text('Unlock'),
          ),
        ],
      ),
    );

    if (!mounted) {
      return;
    }
    setState(() {
      _unlocked = unlocked == true;
      _sessionPasscode = unlocked == true ? controller.text.trim() : null;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_unlocked) {
      return Scaffold(
        backgroundColor: AppColors.surface,
        body: Center(
          child: TextButton(
            onPressed: _promptForPasscode,
            child: const Text('Unlock kiosk'),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: <Color>[Color(0xFFF8EBC6), Colors.white],
          ),
        ),
        child: SafeArea(
          child: Stack(
            children: <Widget>[
              Positioned.fill(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: _buildStep(),
                ),
              ),
              Positioned(
                left: 24,
                top: 16,
                child: TextButton.icon(
                  onPressed: _step == 0 ? null : () => setState(() => _step--),
                  icon: const Icon(Icons.arrow_back_rounded),
                  label: const Text('Back'),
                ),
              ),
              Positioned(
                left: 0,
                right: 0,
                bottom: 28,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(4, (index) {
                    final active = index == _step;
                    return Container(
                      width: active ? 22 : 10,
                      height: 10,
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      decoration: BoxDecoration(
                        color: active ? AppColors.accent : AppColors.inputBorder,
                        borderRadius: BorderRadius.circular(999),
                      ),
                    );
                  }),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStep() {
    switch (_step) {
      case 0:
        return _WelcomeStep(
          churchName: _churchName,
          onStart: () => setState(() => _step = 1),
        );
      case 1:
        return _KioskStepShell(
          title: 'What is your name?',
          child: Column(
            children: <Widget>[
              _KioskTextField(controller: _firstNameController, hintText: 'First Name'),
              const SizedBox(height: 16),
              _KioskTextField(controller: _lastNameController, hintText: 'Last Name'),
            ],
          ),
          onNext: () {
            if (_firstNameController.text.trim().isNotEmpty && _lastNameController.text.trim().isNotEmpty) {
              setState(() => _step = 2);
            }
          },
        );
      case 2:
        return _KioskStepShell(
          title: 'How can we reach you?',
          child: Column(
            children: <Widget>[
              _KioskTextField(
                controller: _phoneController,
                hintText: 'Phone Number',
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 16),
              _KioskTextField(
                controller: _emailController,
                hintText: 'Email Address (optional)',
                keyboardType: TextInputType.emailAddress,
              ),
            ],
          ),
          onNext: () {
            if (_phoneController.text.trim().isNotEmpty) {
              setState(() => _step = 3);
            }
          },
        );
      case 3:
        return _KioskStepShell(
          title: 'Tell us about you',
          onNext: _submit,
          nextLabel: _submitting ? 'Submitting...' : 'Next',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text('Gender', style: AppTextStyles.titleMedium),
              const SizedBox(height: 10),
              Wrap(
                spacing: 12,
                children: <String>['male', 'female'].map((value) {
                  return _LargeChoiceTile(
                    label: value == 'male' ? 'Male' : 'Female',
                    selected: _gender == value,
                    onTap: () => setState(() => _gender = value),
                  );
                }).toList(),
              ),
              const SizedBox(height: 18),
              Text('Age Group', style: AppTextStyles.titleMedium),
              const SizedBox(height: 10),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: kVisitorAgeGroups.map((value) {
                  return _LargeChoiceTile(
                    label: stageLabel(value).replaceAll('New ', ''),
                    selected: _ageGroup == value,
                    onTap: () => setState(() => _ageGroup = value),
                  );
                }).toList(),
              ),
              const SizedBox(height: 18),
              Text('How did you hear about us?', style: AppTextStyles.titleMedium),
              const SizedBox(height: 10),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: kVisitorHearAboutOptions.map((option) {
                  final value = option['value']!;
                  return _LargeChoiceTile(
                    label: option['label']!,
                    selected: _heardAboutUs == value,
                    onTap: () => setState(() => _heardAboutUs = value),
                  );
                }).toList(),
              ),
            ],
          ),
        );
      case 4:
        return Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              SizedBox(
                width: 180,
                height: 180,
                child: Lottie.network(
                  'https://assets10.lottiefiles.com/packages/lf20_jbrw3hcz.json',
                  repeat: false,
                ),
              ),
              const SizedBox(height: 12),
              AutoSizeText(
                'Welcome to $_churchName!',
                maxLines: 1,
                style: AppTextStyles.headlineMedium,
              ),
              const SizedBox(height: 10),
              Text(
                'You will receive a welcome message shortly.',
                textAlign: TextAlign.center,
                style: AppTextStyles.bodyLarge,
              ),
            ],
          ),
        );
      default:
        return const SizedBox.shrink();
    }
  }

  Future<void> _submit() async {
    if (_submitting) {
      return;
    }
    setState(() => _submitting = true);
    try {
      await ref.read(visitorRepositoryProvider).registerVisitorFromKiosk(<String, dynamic>{
        'tenantId': _kioskTenantId,
        'kioskPasscode': _sessionPasscode,
        'firstName': _firstNameController.text.trim(),
        'lastName': _lastNameController.text.trim(),
        'phone': _phoneController.text.trim(),
        'email': _emailController.text.trim(),
        'gender': _gender,
        'ageGroup': _ageGroup,
        'heardAboutUs': _heardAboutUs,
        'firstVisitDate': DateTime.now().toIso8601String(),
      });
    } catch (_) {
      // Kiosk mode completes the visual flow even if the background request fails.
    }
    if (!mounted) {
      return;
    }
    setState(() {
      _submitting = false;
      _step = 4;
    });
    _resetTimer?.cancel();
    _resetTimer = Timer(const Duration(seconds: 5), _resetFlow);
  }

  void _resetFlow() {
    if (!mounted) {
      return;
    }
    setState(() {
      _step = 0;
      _firstNameController.clear();
      _lastNameController.clear();
      _phoneController.clear();
      _emailController.clear();
      _gender = 'male';
      _ageGroup = 'adult';
      _heardAboutUs = kVisitorHearAboutOptions.first['value']!;
    });
  }
}

class _WelcomeStep extends StatelessWidget {
  const _WelcomeStep({
    required this.churchName,
    required this.onStart,
  });

  final String churchName;
  final VoidCallback onStart;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: <Widget>[
          CircleAvatar(
            radius: 42,
            backgroundColor: AppColors.primary,
            child: Text(
              churchName.isNotEmpty ? churchName[0].toUpperCase() : 'C',
              style: AppTextStyles.headlineMedium.copyWith(color: AppColors.accent),
            ),
          ),
          const SizedBox(height: 18),
          AutoSizeText(
            churchName,
            maxLines: 1,
            style: AppTextStyles.displayLarge,
          ),
          const SizedBox(height: 12),
          Text(
            'Welcome! Please register as a first-time visitor',
            textAlign: TextAlign.center,
            style: AppTextStyles.bodyLarge,
          ),
          const SizedBox(height: 26),
          FilledButton(
            onPressed: onStart,
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.accent,
              foregroundColor: AppColors.primary,
              padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 22),
            ),
            child: const Text('GET STARTED'),
          ),
          const SizedBox(height: 20),
          OutlinedButton(onPressed: () {}, child: const Text('English')),
        ],
      ),
    );
  }
}

class _KioskStepShell extends StatelessWidget {
  const _KioskStepShell({
    required this.title,
    required this.child,
    required this.onNext,
    this.nextLabel = 'Next',
  });

  final String title;
  final Widget child;
  final VoidCallback onNext;
  final String nextLabel;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 560),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            AutoSizeText(
              title,
              maxLines: 1,
              style: AppTextStyles.displayLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 26),
            child,
            const SizedBox(height: 28),
            FilledButton(
              onPressed: onNext,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.accent,
                foregroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(vertical: 22),
              ),
              child: Text(nextLabel),
            ),
          ],
        ),
      ),
    );
  }
}

class _KioskTextField extends StatelessWidget {
  const _KioskTextField({
    required this.controller,
    required this.hintText,
    this.keyboardType,
  });

  final TextEditingController controller;
  final String hintText;
  final TextInputType? keyboardType;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      style: AppTextStyles.headlineMedium,
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: AppTextStyles.bodyLarge,
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 26),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
        ),
      ),
    );
  }
}

class _LargeChoiceTile extends StatelessWidget {
  const _LargeChoiceTile({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 18),
        decoration: BoxDecoration(
          color: selected ? AppColors.accent.withValues(alpha: 0.18) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? AppColors.accent : AppColors.inputBorder,
          ),
        ),
        child: Text(
          label,
          style: AppTextStyles.bodyLarge.copyWith(fontWeight: FontWeight.w700),
        ),
      ),
    );
  }
}
