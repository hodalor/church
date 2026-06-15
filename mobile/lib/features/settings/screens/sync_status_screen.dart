import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/database/local_database.dart';
import '../../../../core/services/connectivity_service.dart';
import '../../../../core/services/sync_service.dart';
import '../../../../core/utils/app_colors.dart';
import '../../../../features/members/widgets/member_bottom_navigation.dart';
import '../../../../shared/widgets/app_button.dart';

class SyncStatusScreen extends ConsumerWidget {
  const SyncStatusScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final connectivity = ref.watch(connectivityProvider);
    final syncAsync = ref.watch(syncStatusProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Sync Status'),
      ),
      bottomNavigationBar: const MemberBottomNavigation(currentIndex: 5),
      body: syncAsync.when(
        data: (sync) => RefreshIndicator(
          onRefresh: () async {
            await ref.read(syncServiceProvider).refreshStatus(
                  isOnline: connectivity.isOnline,
                );
          },
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: <Widget>[
              _InfoCard(
                title: 'Last sync time',
                value: sync.lastSyncAt == null
                    ? 'Not synced yet'
                    : MaterialLocalizations.of(context).formatFullDate(sync.lastSyncAt!) +
                        ' • ' +
                        TimeOfDay.fromDateTime(sync.lastSyncAt!).format(context),
                icon: Icons.schedule_rounded,
              ),
              const SizedBox(height: 16),
              _InfoCard(
                title: 'Connection',
                value: connectivity.isOnline ? 'Online' : 'Offline',
                icon: connectivity.isOnline ? Icons.wifi_rounded : Icons.wifi_off_rounded,
                valueColor: connectivity.isOnline ? AppColors.success : AppColors.accent,
              ),
              const SizedBox(height: 16),
              _BreakdownCard(sync: sync),
              const SizedBox(height: 16),
              AppButton(
                label: sync.isSyncing ? 'Syncing...' : 'Sync Now',
                onPressed: connectivity.isOnline && !sync.isSyncing
                    ? () async {
                        final result = await ref.read(syncServiceProvider).syncAll();
                        if (!context.mounted) {
                          return;
                        }
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(result.message)),
                        );
                      }
                    : null,
                isLoading: sync.isSyncing,
                icon: Icons.sync_rounded,
              ),
              const SizedBox(height: 16),
              FutureBuilder<_FailedBundle>(
                future: _loadFailedBundle(ref),
                builder: (context, snapshot) {
                  final bundle = snapshot.data ?? const _FailedBundle();
                  return _FailedCard(
                    failedCount: sync.failedItems,
                    bundle: bundle,
                    onView: sync.failedItems > 0
                        ? () => _showFailedItems(context, bundle)
                        : null,
                    onClear: sync.failedItems > 0
                        ? () async {
                            await ref.read(syncServiceProvider).clearFailedItems();
                            if (!context.mounted) {
                              return;
                            }
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Failed items cleared.')),
                            );
                          }
                        : null,
                  );
                },
              ),
            ],
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              error.toString(),
              textAlign: TextAlign.center,
            ),
          ),
        ),
      ),
    );
  }

  Future<_FailedBundle> _loadFailedBundle(WidgetRef ref) async {
    final db = ref.read(appDatabaseProvider);
    final failedAttendance = await db.getFailedAttendance();
    final failedVisitors = await db.getFailedVisitors();
    final failedSessions = await db.getFailedCBSSessions();
    return _FailedBundle(
      failedAttendance: failedAttendance,
      failedVisitors: failedVisitors,
      failedSessions: failedSessions,
    );
  }

  Future<void> _showFailedItems(BuildContext context, _FailedBundle bundle) {
    return showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      backgroundColor: AppColors.surface,
      builder: (_) {
        final items = <Widget>[
          ...bundle.failedAttendance.map(
            (item) => ListTile(
              leading: const Icon(Icons.event_busy_rounded, color: AppColors.danger),
              title: Text('Attendance • ${item.attendeeType}'),
              subtitle: Text('Service ${item.serviceId} • Retries ${item.retryCount}'),
            ),
          ),
          ...bundle.failedVisitors.map(
            (item) => ListTile(
              leading: const Icon(Icons.person_off_rounded, color: AppColors.danger),
              title: Text('Visitor • ${item.firstName} ${item.lastName}'),
              subtitle: Text(item.phone ?? item.email ?? 'No contact saved'),
            ),
          ),
          ...bundle.failedSessions.map(
            (item) => ListTile(
              leading: const Icon(Icons.menu_book_rounded, color: AppColors.danger),
              title: Text('CBS Session • Group ${item.groupId}'),
              subtitle: Text('Queued ${item.createdAt}'),
            ),
          ),
        ];

        return SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
            children: <Widget>[
              Text(
                'Failed Records',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 12),
              if (items.isEmpty)
                const ListTile(
                  title: Text('No failed items'),
                )
              else
                ...items,
            ],
          ),
        );
      },
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({
    required this.title,
    required this.value,
    required this.icon,
    this.valueColor,
  });

  final String title;
  final String value;
  final IconData icon;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.inputBorder),
      ),
      child: Row(
        children: <Widget>[
          CircleAvatar(
            backgroundColor: AppColors.primary.withValues(alpha: 0.1),
            child: Icon(icon, color: AppColors.primary),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(title, style: Theme.of(context).textTheme.bodyMedium),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: valueColor,
                        fontWeight: FontWeight.w700,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BreakdownCard extends StatelessWidget {
  const _BreakdownCard({required this.sync});

  final SyncStatus sync;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.inputBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text('Pending items', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 14),
          _BreakdownRow(label: 'Attendance', value: sync.pendingAttendance),
          _BreakdownRow(label: 'Visitors', value: sync.pendingVisitors),
          _BreakdownRow(label: 'CBS Sessions', value: sync.pendingCBSSessions),
        ],
      ),
    );
  }
}

class _BreakdownRow extends StatelessWidget {
  const _BreakdownRow({
    required this.label,
    required this.value,
  });

  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: <Widget>[
          Text(label),
          const Spacer(),
          Text(
            '$value pending',
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }
}

class _FailedCard extends StatelessWidget {
  const _FailedCard({
    required this.failedCount,
    required this.bundle,
    this.onView,
    this.onClear,
  });

  final int failedCount;
  final _FailedBundle bundle;
  final VoidCallback? onView;
  final VoidCallback? onClear;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.inputBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text('Failed items', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Text(
            failedCount == 0
                ? 'No failed records'
                : '$failedCount records need attention',
          ),
          if (failedCount > 0) ...<Widget>[
            const SizedBox(height: 12),
            Text(
              'Attendance ${bundle.failedAttendance.length} • Visitors ${bundle.failedVisitors.length} • CBS ${bundle.failedSessions.length}',
            ),
            const SizedBox(height: 14),
            Row(
              children: <Widget>[
                TextButton.icon(
                  onPressed: onView,
                  icon: const Icon(Icons.visibility_rounded),
                  label: const Text('View'),
                ),
                const SizedBox(width: 8),
                TextButton.icon(
                  onPressed: onClear,
                  icon: const Icon(Icons.delete_sweep_rounded),
                  label: const Text('Clear Failed Items'),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _FailedBundle {
  const _FailedBundle({
    this.failedAttendance = const <LocalAttendance>[],
    this.failedVisitors = const <LocalVisitorRegistration>[],
    this.failedSessions = const <LocalCBSSessionRecord>[],
  });

  final List<LocalAttendance> failedAttendance;
  final List<LocalVisitorRegistration> failedVisitors;
  final List<LocalCBSSessionRecord> failedSessions;
}
