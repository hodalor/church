import 'package:flutter/material.dart';
import '../../core/utils/app_colors.dart';

class LoadingOverlay extends StatelessWidget {
  const LoadingOverlay({
    super.key,
    required this.isLoading,
    required this.child,
  });

  final bool isLoading;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: <Widget>[
        child,
        if (isLoading) ...<Widget>[
          const ModalBarrier(
            dismissible: false,
            color: AppColors.overlay,
          ),
          const Center(
            child: CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(AppColors.accent),
            ),
          ),
        ],
      ],
    );
  }
}
