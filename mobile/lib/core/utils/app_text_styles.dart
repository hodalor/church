import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

class AppTextStyles {
  static TextStyle displayLarge = GoogleFonts.cormorantGaramond(
    fontSize: 38,
    fontWeight: FontWeight.w700,
    color: AppColors.primary,
    height: 1.05,
  );

  static TextStyle headlineMedium = GoogleFonts.cormorantGaramond(
    fontSize: 28,
    fontWeight: FontWeight.w700,
    color: AppColors.primary,
  );

  static TextStyle titleMedium = GoogleFonts.inter(
    fontSize: 18,
    fontWeight: FontWeight.w700,
    color: AppColors.primary,
  );

  static TextStyle bodyLarge = GoogleFonts.inter(
    fontSize: 16,
    fontWeight: FontWeight.w500,
    color: AppColors.primary,
    height: 1.5,
  );

  static TextStyle bodyMedium = GoogleFonts.inter(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    color: AppColors.mutedText,
    height: 1.5,
  );

  static TextStyle labelSmall = GoogleFonts.inter(
    fontSize: 12,
    fontWeight: FontWeight.w700,
    color: AppColors.accent,
    letterSpacing: 2.2,
  );
}
