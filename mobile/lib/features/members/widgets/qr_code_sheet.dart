import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_gallery_saver/image_gallery_saver.dart';
import 'package:share_plus/share_plus.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../data/models/member.dart';
import '../providers/members_provider.dart';
import 'member_avatar.dart';

class QrCodeSheet extends ConsumerStatefulWidget {
  const QrCodeSheet({
    super.key,
    required this.member,
  });

  final Member member;

  @override
  ConsumerState<QrCodeSheet> createState() => _QrCodeSheetState();
}

class _QrCodeSheetState extends ConsumerState<QrCodeSheet> {
  bool _isBusy = false;
  String? _error;

  Uint8List? _decodeQrBytes(String rawValue) {
    if (rawValue.isEmpty) {
      return null;
    }

    final encoded = rawValue.contains(',') ? rawValue.split(',').last : rawValue;
    try {
      return base64Decode(encoded);
    } catch (_) {
      return null;
    }
  }

  Future<Uint8List?> _resolveBytes() async {
    if (widget.member.qrCode != null && widget.member.qrCode!.isNotEmpty) {
      return _decodeQrBytes(widget.member.qrCode!);
    }

    final repository = ref.read(memberRepositoryProvider);
    final dataUrl = await repository.getMemberQrCode(widget.member.memberId);
    return _decodeQrBytes(dataUrl);
  }

  Future<void> _saveToGallery() async {
    setState(() {
      _isBusy = true;
      _error = null;
    });

    try {
      final bytes = await _resolveBytes();
      if (bytes == null) {
        throw Exception('Unable to load this QR code.');
      }

      await ImageGallerySaver.saveImage(bytes, name: widget.member.memberId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('QR code saved to gallery.')),
        );
      }
    } catch (error) {
      setState(() {
        _error = error.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _isBusy = false;
        });
      }
    }
  }

  Future<void> _shareQrCode() async {
    setState(() {
      _isBusy = true;
      _error = null;
    });

    try {
      final bytes = await _resolveBytes();
      if (bytes == null) {
        throw Exception('Unable to load this QR code.');
      }

      final file = XFile.fromData(
        bytes,
        mimeType: 'image/png',
        name: '${widget.member.memberId}.png',
      );
      await SharePlus.instance.share(
        ShareParams(
          files: <XFile>[file],
          text: 'Prynova member QR code',
        ),
      );
    } catch (error) {
      setState(() {
        _error = error.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _isBusy = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Container(
              width: 42,
              height: 5,
              decoration: BoxDecoration(
                color: AppColors.inputBorder,
                borderRadius: BorderRadius.circular(999),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: <Widget>[
                MemberAvatar(
                  photoUrl: widget.member.photoUrl,
                  firstName: widget.member.firstName,
                  lastName: widget.member.lastName,
                  radius: 28,
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text(widget.member.fullName, style: AppTextStyles.titleMedium),
                      const SizedBox(height: 4),
                      Text(widget.member.memberId, style: AppTextStyles.bodyMedium),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            FutureBuilder<Uint8List?>(
              future: _resolveBytes(),
              builder: (context, snapshot) {
                final qrBytes = snapshot.data;

                return Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: AppColors.inputBorder),
                  ),
                  child: qrBytes != null
                      ? Image.memory(qrBytes, width: 220, height: 220, fit: BoxFit.contain)
                      : const SizedBox(
                          width: 220,
                          height: 220,
                          child: Center(child: CircularProgressIndicator()),
                        ),
                );
              },
            ),
            if (_error != null) ...<Widget>[
              const SizedBox(height: 14),
              Text(
                _error!,
                style: AppTextStyles.bodyMedium.copyWith(color: AppColors.danger),
              ),
            ],
            const SizedBox(height: 20),
            Row(
              children: <Widget>[
                Expanded(
                  child: OutlinedButton(
                    onPressed: _isBusy ? null : _saveToGallery,
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      side: const BorderSide(color: AppColors.inputBorder),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(18),
                      ),
                    ),
                    child: const Text('Save to Gallery'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isBusy ? null : _shareQrCode,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(18),
                      ),
                    ),
                    child: const Text('Share'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
