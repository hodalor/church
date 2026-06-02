import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../../auth/providers/auth_provider.dart';
import '../../members/widgets/member_bottom_navigation.dart';
import '../attendance_utils.dart';
import 'leader_attendance_view.dart';
import 'member_attendance_view.dart';

class AttendanceScreen extends ConsumerWidget {
  const AttendanceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final role = authState.user?.role;
    final isLeader = isLeaderAttendanceRole(role);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: Text('Attendance', style: AppTextStyles.titleMedium),
      ),
      bottomNavigationBar: const MemberBottomNavigation(currentIndex: 0),
      body: isLeader
          ? const LeaderAttendanceView()
          : const MemberAttendanceView(),
    );
  }
}
