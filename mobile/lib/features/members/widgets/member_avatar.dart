import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';

class MemberAvatar extends StatelessWidget {
  const MemberAvatar({
    super.key,
    this.photoUrl,
    required this.firstName,
    required this.lastName,
    this.radius = 24,
  });

  final String? photoUrl;
  final String firstName;
  final String lastName;
  final double radius;

  String get _initials {
    final first = firstName.isNotEmpty ? firstName[0] : '';
    final last = lastName.isNotEmpty ? lastName[0] : '';
    return '$first$last'.toUpperCase();
  }

  Color _backgroundColor() {
    final seed = '$firstName$lastName'.codeUnits.fold<int>(0, (sum, code) => sum + code);
    final palette = <Color>[
      AppColors.primary,
      const Color(0xFF4F7CAC),
      const Color(0xFF7A5C61),
      const Color(0xFF2E6F40),
      const Color(0xFF7D5A26),
    ];
    return palette[seed % palette.length];
  }

  @override
  Widget build(BuildContext context) {
    if (photoUrl != null && photoUrl!.isNotEmpty) {
      return CircleAvatar(
        radius: radius,
        backgroundColor: AppColors.inputBorder,
        backgroundImage: CachedNetworkImageProvider(photoUrl!),
      );
    }

    return CircleAvatar(
      radius: radius,
      backgroundColor: _backgroundColor(),
      child: Text(
        _initials,
        style: AppTextStyles.titleMedium.copyWith(
          color: Colors.white,
          fontSize: radius * 0.7,
        ),
      ),
    );
  }
}
