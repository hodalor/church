import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/utils/app_colors.dart';
import '../../../../core/utils/app_text_styles.dart';
import '../../members/widgets/member_bottom_navigation.dart';
import '../data/models/inbox_message.dart';
import '../providers/inbox_provider.dart';
import '../widgets/inbox_message_tile.dart';

class InboxScreen extends ConsumerStatefulWidget {
  const InboxScreen({super.key});

  @override
  ConsumerState<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends ConsumerState<InboxScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  final ScrollController _scrollController = ScrollController();
  final List<String> _tabs = <String>[
    'all',
    'unread',
    'announcements',
    'reminders',
    'devotionals',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this)
      ..addListener(() => setState(() {}));
    _scrollController.addListener(_handleScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(inboxProvider.notifier).loadMessages();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _scrollController
      ..removeListener(_handleScroll)
      ..dispose();
    super.dispose();
  }

  void _handleScroll() {
    if (!_scrollController.hasClients) {
      return;
    }

    final threshold = _scrollController.position.maxScrollExtent * 0.88;
    if (_scrollController.position.pixels >= threshold) {
      ref.read(inboxProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(inboxProvider);
    final selectedTab = _tabs[_tabController.index];
    final filteredMessages = _filterMessages(state.messages, selectedTab);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Text('Inbox', style: AppTextStyles.titleMedium),
            const SizedBox(width: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.accent,
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                '${state.unreadCount}',
                style: AppTextStyles.bodyMedium.copyWith(color: Colors.white),
              ),
            ),
          ],
        ),
        actions: <Widget>[
          IconButton(
            onPressed: () => ref.read(inboxProvider.notifier).markAllRead(),
            icon: const Icon(Icons.done_all_rounded),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.mutedText,
          indicatorColor: AppColors.accent,
          tabs: const <Tab>[
            Tab(text: 'All'),
            Tab(text: 'Unread'),
            Tab(text: 'Announcements'),
            Tab(text: 'Reminders'),
            Tab(text: 'Devotionals'),
          ],
        ),
      ),
      bottomNavigationBar: const MemberBottomNavigation(currentIndex: 4),
      body: RefreshIndicator(
        onRefresh: () => ref.read(inboxProvider.notifier).refresh(),
        child: Builder(
          builder: (context) {
            if (state.isLoading && state.messages.isEmpty) {
              return const Center(child: CircularProgressIndicator());
            }

            if (filteredMessages.isEmpty) {
              return ListView(
                padding: const EdgeInsets.all(24),
                children: <Widget>[
                  const SizedBox(height: 120),
                  Icon(
                    Icons.inbox_outlined,
                    size: 72,
                    color: AppColors.primary.withValues(alpha: 0.24),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    'No messages yet',
                    textAlign: TextAlign.center,
                    style: AppTextStyles.headlineMedium,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Your $selectedTab messages will appear here.',
                    textAlign: TextAlign.center,
                    style: AppTextStyles.bodyMedium,
                  ),
                ],
              );
            }

            return ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
              itemCount: filteredMessages.length + (state.isLoadingMore ? 1 : 0),
              itemBuilder: (context, index) {
                if (index >= filteredMessages.length) {
                  return const Padding(
                    padding: EdgeInsets.symmetric(vertical: 18),
                    child: Center(child: CircularProgressIndicator()),
                  );
                }

                final message = filteredMessages[index];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: InboxMessageTile(
                    message: message,
                    onTap: () {
                      context.push('/inbox/${message.id}');
                    },
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }

  List<InboxMessage> _filterMessages(List<InboxMessage> messages, String tab) {
    switch (tab) {
      case 'unread':
        return messages.where((item) => !item.isRead).toList();
      case 'announcements':
        return messages
            .where((item) =>
                item.type.toLowerCase() == 'announcement' ||
                item.type.toLowerCase() == 'broadcast')
            .toList();
      case 'reminders':
        return messages.where((item) => item.type.toLowerCase() == 'reminder').toList();
      case 'devotionals':
        return messages.where((item) => item.type.toLowerCase() == 'devotional').toList();
      default:
        return messages;
    }
  }
}
