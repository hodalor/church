import 'package:flutter/material.dart';
import 'package:pinput/pinput.dart';
import '../../core/utils/app_colors.dart';
import '../../core/utils/app_text_styles.dart';

class PinInputWidget extends StatelessWidget {
  const PinInputWidget({
    super.key,
    required this.controller,
    this.validator,
    this.length = 4,
  });

  final TextEditingController controller;
  final String? Function(String?)? validator;
  final int length;

  @override
  Widget build(BuildContext context) {
    final defaultTheme = PinTheme(
      width: 52,
      height: 58,
      textStyle: AppTextStyles.titleMedium,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.inputBorder),
      ),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(
          'PIN',
          style: AppTextStyles.labelSmall,
        ),
        const SizedBox(height: 10),
        Pinput(
          controller: controller,
          length: length,
          keyboardType: TextInputType.number,
          validator: validator,
          obscureText: true,
          defaultPinTheme: defaultTheme,
          focusedPinTheme: defaultTheme.copyDecorationWith(
            border: Border.all(color: AppColors.accent, width: 1.5),
          ),
          submittedPinTheme: defaultTheme.copyWith(
            decoration: defaultTheme.decoration?.copyWith(
              color: AppColors.surface,
              border: Border.all(color: AppColors.primary.withValues(alpha: 0.15)),
            ),
          ),
          separatorBuilder: (index) => const SizedBox(width: 8),
        ),
        const SizedBox(height: 8),
        Text(
          'Use your 4 to 6 digit member PIN.',
          style: AppTextStyles.bodyMedium.copyWith(fontSize: 12),
        ),
      ],
    );
  }
}
