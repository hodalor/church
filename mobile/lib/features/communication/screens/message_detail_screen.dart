import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';
import '../../../../core/utils/app_colors.dart';
import '../../../../core/utils/app_text_styles.dart';
import '../data/models/inbox_message.dart';
import '../providers/inbox_provider.dart';

class MessageDetailScreen extends ConsumerStatefulWidget {
  const MessageDetailScreen({
    super.key,
    required this.messageId,
  });

  final String messageId;

  @override
  ConsumerState<MessageDetailScreen> createState() => _MessageDetailScreenState();
}

class _MessageDetailScreenState extends ConsumerState<MessageDetailScreen> {
  late Future<InboxMessage> _messageFuture;

  @override
  void initState() {
    super.initState();
    _messageFuture = ref
        .read(communicationRepositoryProvider)
        .getMessageById(widget.messageId);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(inboxProvider.notifier).markRead(widget.messageId);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Message'),
      ),
      body: FutureBuilder<InboxMessage>(
        future: _messageFuture,
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }

          final message = snapshot.data!;
          return Column(
            children: <Widget>[
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: message.typeColor.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: <Widget>[
                            Icon(message.typeIcon, color: message.typeColor, size: 18),
                            const SizedBox(width: 8),
                            Text(
                              message.type.replaceAll('_', ' '),
                              style: AppTextStyles.bodyMedium.copyWith(color: message.typeColor),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 18),
                      Text(message.title, style: AppTextStyles.headlineMedium),
                      const SizedBox(height: 8),
                      Text(
                        message.createdAt?.toLocal().toString() ?? '',
                        style: AppTextStyles.bodyMedium,
                      ),
                      const SizedBox(height: 20),
                      const Divider(),
                      const SizedBox(height: 20),
                      SelectableText(
                        message.message,
                        style: AppTextStyles.bodyLarge,
                      ),
                      if (message.mediaUrls.isNotEmpty) ...<Widget>[
                        const SizedBox(height: 28),
                        Text('Media', style: AppTextStyles.titleMedium),
                        const SizedBox(height: 12),
                        SizedBox(
                          height: 120,
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            itemBuilder: (context, index) {
                              final imageUrl = message.mediaUrls[index];
                              return GestureDetector(
                                onTap: () => _openImagePreview(context, imageUrl),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(18),
                                  child: CachedNetworkImage(
                                    imageUrl: imageUrl,
                                    width: 140,
                                    fit: BoxFit.cover,
                                  ),
                                ),
                              );
                            },
                            separatorBuilder: (_, __) => const SizedBox(width: 12),
                            itemCount: message.mediaUrls.length,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
                  child: SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () => SharePlus.instance.share(
                        ShareParams(text: '${message.title}\n\n${message.message}'),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.accent,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      icon: const Icon(Icons.share_rounded),
                      label: const Text('Share'),
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  void _openImagePreview(BuildContext context, String imageUrl) {
    showDialog<void>(
      context: context,
      builder: (context) {
        return Dialog(
          insetPadding: const EdgeInsets.all(16),
          backgroundColor: Colors.black,
          child: InteractiveViewer(
            child: CachedNetworkImage(
              imageUrl: imageUrl,
              fit: BoxFit.contain,
            ),
          ),
        );
      },
    );
  }
}
