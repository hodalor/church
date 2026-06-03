import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/visitors_provider.dart';
import '../visitors_utils.dart';
import '../widgets/visitor_list_tile.dart';
import 'visitor_detail_screen.dart';

class VisitorsListScreen extends ConsumerWidget {
  const VisitorsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(visitorsProvider);
    final role = ref.watch(authProvider).user?.role;

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: Text('All Visitors', style: AppTextStyles.titleMedium),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(visitorsProvider.notifier).refresh(),
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: <Widget>[
            if (state.error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(
                  state.error!,
                  style: AppTextStyles.bodyMedium.copyWith(color: AppColors.danger),
                ),
              ),
            if (state.isLoading && state.visitors.isEmpty)
              const Padding(
                padding: EdgeInsets.only(top: 100),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (state.visitors.isEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 100),
                child: Center(
                  child: Text('No visitors yet.', style: AppTextStyles.bodyLarge),
                ),
              )
            else
              ...state.visitors.map((visitor) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: VisitorListTile(
                      visitor: visitor,
                      onTap: isVisitorLeaderRole(role)
                          ? () {
                              Navigator.of(context).push(
                                MaterialPageRoute<void>(
                                  builder: (_) => VisitorDetailScreen(visitorId: visitor.id),
                                ),
                              );
                            }
                          : null,
                    ),
                  )),
          ],
        ),
      ),
    );
  }
}
