import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/utils/app_colors.dart';
import '../../core/utils/app_text_styles.dart';

class AppTextField extends StatelessWidget {
  const AppTextField({
    super.key,
    required this.controller,
    required this.label,
    required this.hintText,
    this.keyboardType,
    this.validator,
    this.textInputAction,
    this.prefixIcon,
    this.inputFormatters,
  });

  final TextEditingController controller;
  final String label;
  final String hintText;
  final TextInputType? keyboardType;
  final String? Function(String?)? validator;
  final TextInputAction? textInputAction;
  final IconData? prefixIcon;
  final List<TextInputFormatter>? inputFormatters;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(
          label.toUpperCase(),
          style: AppTextStyles.labelSmall,
        ),
        const SizedBox(height: 10),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          validator: validator,
          textInputAction: textInputAction,
          inputFormatters: inputFormatters,
          style: AppTextStyles.bodyLarge,
          decoration: InputDecoration(
            hintText: hintText,
            hintStyle: AppTextStyles.bodyMedium,
            filled: true,
            fillColor: Colors.white,
            prefixIcon:
                prefixIcon != null ? Icon(prefixIcon, color: AppColors.primary.withValues(alpha: 0.7)) : null,
            contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(18),
              borderSide: const BorderSide(color: AppColors.inputBorder),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(18),
              borderSide: const BorderSide(color: AppColors.inputBorder),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(18),
              borderSide: const BorderSide(color: AppColors.accent, width: 1.5),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(18),
              borderSide: const BorderSide(color: AppColors.danger),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(18),
              borderSide: const BorderSide(color: AppColors.danger, width: 1.5),
            ),
          ),
        ),
      ],
    );
  }
}
