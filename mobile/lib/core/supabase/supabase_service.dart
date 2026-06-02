import 'dart:io';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../storage/secure_storage.dart';

class SupabaseService {
  SupabaseService(this._storage);

  final SecureStorageService _storage;
  final SupabaseClient _client = Supabase.instance.client;

  Future<String> uploadFile(File file, String bucket) async {
    final tenantId = await _storage.getTenantId() ?? 'public';
    final parts = file.path.split('.');
    final extension = parts.length > 1 ? '.${parts.last}' : '';
    final fileName = '${DateTime.now().millisecondsSinceEpoch}$extension';
    final storagePath = '$tenantId/members/$fileName';

    await _client.storage.from(bucket).upload(storagePath, file);

    final publicUrl = _client.storage.from(bucket).getPublicUrl(storagePath);
    return publicUrl;
  }
}
