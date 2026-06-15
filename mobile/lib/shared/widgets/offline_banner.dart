import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/services/connectivity_service.dart';
import '../../core/services/sync_service.dart';
import '../../core/utils/app_colors.dart';

class OfflineBanner extends ConsumerStatefulWidget {
  const OfflineBanner({
    super.key,
    required this.child,
  });

  final Widget child;

  @override
  ConsumerState<OfflineBanner> createState() => _OfflineBannerState();
}

class _OfflineBannerState extends ConsumerState<OfflineBanner> {
  Timer? _dismissTimer;
  bool _showCompletedBanner = false;

  @override
  void initState() {
    super.initState();

    ref.listenManual<ConnectivityState>(connectivityProvider, (previous, next) {
      if (next.justReconnected) {
        final pending = ref.read(syncServiceProvider).latestStatus.pendingTotal;
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(
            SnackBar(
              content: Text('Back online — syncing $pending pending records'),
              backgroundColor: AppColors.primary,
            ),
          );
        ref.read(connectivityProvider.notifier).clearReconnectFlag();
      }
    });

    ref.listenManual<AsyncValue<SyncStatus>>(syncStatusProvider, (previous, next) {
      final prevStatus = previous?.valueOrNull;
      final nextStatus = next.valueOrNull;
      if (prevStatus == null || nextStatus == null) {
        return;
      }

      final completed = prevStatus.isSyncing && !nextStatus.isSyncing && nextStatus.pendingTotal == 0;
      if (completed) {
        _dismissTimer?.cancel();
        setState(() {
          _showCompletedBanner = true;
        });
        _dismissTimer = Timer(const Duration(seconds: 3), () {
          if (!mounted) {
            return;
          }
          setState(() {
            _showCompletedBanner = false;
          });
        });
      }
    });
  }

  @override
  void dispose() {
    _dismissTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final connectivity = ref.watch(connectivityProvider);
    final sync = ref.watch(syncStatusProvider).valueOrNull ?? const SyncStatus();

    final banner = _resolveBanner(connectivity: connectivity, sync: sync);

    return Stack(
      children: <Widget>[
        widget.child,
        if (banner != null)
          SafeArea(
            child: Align(
              alignment: Alignment.topCenter,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 220),
                  child: banner,
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget? _resolveBanner({
    required ConnectivityState connectivity,
    required SyncStatus sync,
  }) {
    if (!connectivity.isOnline) {
      return _BannerCard(
        key: const ValueKey<String>('offline-banner'),
        backgroundColor: const Color(0xFFFFF3CD),
        borderColor: const Color(0xFFE0B14A),
        foregroundColor: const Color(0xFF8A6D1A),
        icon: Icons.wifi_off_rounded,
        title: 'Offline — ${sync.pendingTotal} items pending sync',
        subtitle: 'Offline mode active. Data will sync when online.',
      );
    }

    if (sync.isSyncing) {
      return const _BannerCard(
        key: ValueKey<String>('syncing-banner'),
        backgroundColor: Color(0xFFE7F6EC),
        borderColor: Color(0xFF6ABF7B),
        foregroundColor: Color(0xFF1F8B4C),
        icon: Icons.sync_rounded,
        title: 'Syncing...',
        subtitle: 'Pending offline records are being uploaded now.',
      );
    }

    if (sync.pendingTotal > 0) {
      return _BannerCard(
        key: const ValueKey<String>('pending-banner'),
        backgroundColor: Colors.white,
        borderColor: AppColors.inputBorder,
        foregroundColor: AppColors.primary,
        icon: Icons.cloud_upload_outlined,
        title: '${sync.pendingTotal} items pending sync',
        subtitle: sync.failedItems > 0
            ? '${sync.failedItems} failed items still need attention.'
            : 'Tap Sync Now to upload pending offline records.',
        actionLabel: 'Sync Now',
        onAction: () => ref.read(syncServiceProvider).syncAll(),
      );
    }

    if (_showCompletedBanner) {
      return const _BannerCard(
        key: ValueKey<String>('synced-banner'),
        backgroundColor: Color(0xFFE7F6EC),
        borderColor: Color(0xFF6ABF7B),
        foregroundColor: Color(0xFF1F8B4C),
        icon: Icons.check_circle_rounded,
        title: 'All synced',
        subtitle: 'Offline changes are now saved to the server.',
      );
    }

    return null;
  }
}

class _BannerCard extends StatelessWidget {
  const _BannerCard({
    super.key,
    required this.backgroundColor,
    required this.borderColor,
    required this.foregroundColor,
    required this.icon,
    required this.title,
    required this.subtitle,
    this.actionLabel,
    this.onAction,
  });

  final Color backgroundColor;
  final Color borderColor;
  final Color foregroundColor;
  final IconData icon;
  final String title;
  final String subtitle;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: Container(
        constraints: const BoxConstraints(maxWidth: 520),
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: borderColor),
          boxShadow: <BoxShadow>[
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: <Widget>[
            Icon(icon, color: foregroundColor),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  Text(
                    title,
                    style: TextStyle(
                      color: foregroundColor,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      color: foregroundColor.withValues(alpha: 0.82),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            if (actionLabel != null && onAction != null) ...<Widget>[
              const SizedBox(width: 12),
              TextButton(
                onPressed: onAction,
                style: TextButton.styleFrom(
                  foregroundColor: foregroundColor,
                ),
                child: Text(actionLabel!),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
