import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../providers/members_provider.dart';
import '../widgets/member_bottom_navigation.dart';
import '../widgets/member_list_tile.dart';

class MembersScreen extends ConsumerStatefulWidget {
  const MembersScreen({super.key});

  @override
  ConsumerState<MembersScreen> createState() => _MembersScreenState();
}

class _MembersScreenState extends ConsumerState<MembersScreen> {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchController = TextEditingController();
  Timer? _debounce;
  bool _showSearch = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_handleScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(membersProvider.notifier).loadMembers();
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _scrollController
      ..removeListener(_handleScroll)
      ..dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _handleScroll() {
    if (!_scrollController.hasClients) {
      return;
    }

    final threshold = _scrollController.position.maxScrollExtent * 0.9;
    if (_scrollController.position.pixels >= threshold) {
      ref.read(membersProvider.notifier).loadMore();
    }
  }

  void _onSearchChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () {
      ref.read(membersProvider.notifier).search(value);
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(membersProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: Text('Members', style: AppTextStyles.titleMedium),
        actions: <Widget>[
          IconButton(
            onPressed: () {
              setState(() {
                _showSearch = !_showSearch;
              });

              if (!_showSearch) {
                _searchController.clear();
                ref.read(membersProvider.notifier).search('');
              }
            },
            icon: Icon(_showSearch ? Icons.close_rounded : Icons.search_rounded),
          ),
        ],
      ),
      bottomNavigationBar: const MemberBottomNavigation(currentIndex: 1),
      body: Column(
        children: <Widget>[
          AnimatedCrossFade(
            firstChild: const SizedBox.shrink(),
            secondChild: Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
              child: TextField(
                controller: _searchController,
                onChanged: _onSearchChanged,
                decoration: InputDecoration(
                  hintText: 'Search members',
                  prefixIcon: const Icon(Icons.search_rounded),
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(18),
                    borderSide: const BorderSide(color: AppColors.inputBorder),
                  ),
                ),
              ),
            ),
            crossFadeState: _showSearch ? CrossFadeState.showSecond : CrossFadeState.showFirst,
            duration: const Duration(milliseconds: 220),
          ),
          Expanded(
            child: Builder(
              builder: (context) {
                if (state.isLoading && state.members.isEmpty) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (state.error != null && state.members.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: <Widget>[
                          const Icon(Icons.error_outline_rounded, size: 54, color: AppColors.danger),
                          const SizedBox(height: 12),
                          Text(state.error!, textAlign: TextAlign.center, style: AppTextStyles.bodyLarge),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: () => ref.read(membersProvider.notifier).loadMembers(),
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                if (state.members.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: <Widget>[
                          Icon(
                            Icons.groups_rounded,
                            size: 68,
                            color: AppColors.primary.withValues(alpha: 0.35),
                          ),
                          const SizedBox(height: 14),
                          Text('No members found', style: AppTextStyles.headlineMedium),
                          const SizedBox(height: 8),
                          Text(
                            'Try another search or pull down to refresh the directory.',
                            textAlign: TextAlign.center,
                            style: AppTextStyles.bodyMedium,
                          ),
                        ],
                      ),
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () => ref.read(membersProvider.notifier).refresh(),
                  child: ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
                    itemCount: state.members.length + (state.isLoadingMore ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index >= state.members.length) {
                        return const Padding(
                          padding: EdgeInsets.symmetric(vertical: 18),
                          child: Center(child: CircularProgressIndicator()),
                        );
                      }

                      final member = state.members[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: MemberListTile(member: member),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
