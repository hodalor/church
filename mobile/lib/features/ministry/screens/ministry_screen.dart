import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/utils/role_helper.dart';
import '../../auth/providers/auth_provider.dart';
import 'ministry_management_screen.dart';
import 'my_ministries_screen.dart';

class MinistryScreen extends ConsumerWidget {
  const MinistryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final role = ref.watch(authProvider).user?.role ?? '';
    if (RoleHelper.canAccessMinistry(role)) {
      return const MinistryManagementScreen();
    }
    return const MyMinistriesScreen();
  }
}
