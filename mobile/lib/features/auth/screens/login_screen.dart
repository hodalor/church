import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../../../core/utils/validators.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../../shared/widgets/loading_overlay.dart';
import '../../../shared/widgets/pin_input_widget.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _tenantIdController = TextEditingController();
  final _usernameController = TextEditingController();
  final _pinController = TextEditingController();

  @override
  void dispose() {
    _tenantIdController.dispose();
    _usernameController.dispose();
    _pinController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    await ref.read(authProvider.notifier).login(
          tenantId: _tenantIdController.text.trim(),
          username: _usernameController.text.trim(),
          pin: _pinController.text.trim(),
        );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return LoadingOverlay(
      isLoading: authState.isLoading,
      child: Scaffold(
        body: SafeArea(
          child: Container(
            color: AppColors.primary,
            child: SingleChildScrollView(
              child: Column(
                children: <Widget>[
                  Container(
                    height: MediaQuery.of(context).size.height * 0.3,
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: <Color>[AppColors.primary, Color(0xFF131B31)],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: <Widget>[
                        const Icon(Icons.church_rounded, color: AppColors.accent, size: 40),
                        const SizedBox(height: 14),
                        Text(
                          'PRYNOVA',
                          style: AppTextStyles.labelSmall.copyWith(color: AppColors.accent),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Member Sign In',
                          style: AppTextStyles.displayLarge.copyWith(color: Colors.white),
                        ),
                      ],
                    ),
                  ),
                  Transform.translate(
                    offset: const Offset(0, -28),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.fromLTRB(24, 28, 24, 32),
                      decoration: const BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
                      ),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            Text('Welcome back', style: AppTextStyles.headlineMedium),
                            const SizedBox(height: 6),
                            Text(
                              'Sign in with your church ID, username, and secure PIN.',
                              style: AppTextStyles.bodyMedium,
                            ),
                            const SizedBox(height: 24),
                            AppTextField(
                              controller: _tenantIdController,
                              label: 'Tenant ID',
                              hintText: 'Church ID (e.g. calvary)',
                              prefixIcon: Icons.apartment_rounded,
                              textInputAction: TextInputAction.next,
                              inputFormatters: <TextInputFormatter>[
                                FilteringTextInputFormatter.allow(RegExp(r'[a-z0-9-]')),
                                LowerCaseTextFormatter(),
                              ],
                              validator: (value) =>
                                  Validators.requiredField(value, fieldName: 'Tenant ID'),
                            ),
                            const SizedBox(height: 18),
                            AppTextField(
                              controller: _usernameController,
                              label: 'Username',
                              hintText: 'Enter your username',
                              prefixIcon: Icons.person_outline_rounded,
                              textInputAction: TextInputAction.next,
                              validator: (value) =>
                                  Validators.requiredField(value, fieldName: 'Username'),
                            ),
                            const SizedBox(height: 18),
                            PinInputWidget(
                              controller: _pinController,
                              length: 6,
                              validator: Validators.pin,
                            ),
                            if (authState.error != null) ...<Widget>[
                              const SizedBox(height: 18),
                              Text(
                                authState.error!,
                                style: AppTextStyles.bodyMedium.copyWith(
                                  color: AppColors.danger,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                            const SizedBox(height: 24),
                            AppButton(
                              label: 'Sign In',
                              onPressed: _submit,
                              isLoading: authState.isLoading,
                              icon: Icons.arrow_forward_rounded,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class LowerCaseTextFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    return TextEditingValue(
      text: newValue.text.toLowerCase(),
      selection: newValue.selection,
    );
  }
}
