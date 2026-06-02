# Prynova Supabase Storage Notes

## Naming Convention

Use tenant-scoped file paths in every bucket:

`{tenantId}/{module}/{uuid}.{ext}`

Example:

`calvary/members/uuid-123.jpg`

## Supabase JS Upload

```js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function uploadMemberPhoto(file, tenantId, uuid) {
  const extension = file.name.split('.').pop();
  const filePath = `${tenantId}/members/${uuid}.${extension}`;

  const { error } = await supabase.storage
    .from('member-photos')
    .upload(filePath, file, { upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from('member-photos').getPublicUrl(filePath);
  return data.publicUrl;
}
```

## Supabase Flutter Upload

```dart
import 'dart:io';
import 'package:supabase_flutter/supabase_flutter.dart';

Future<String> uploadMemberPhoto({
  required File file,
  required String tenantId,
  required String uuid,
}) async {
  final extension = file.path.split('.').last;
  final filePath = '$tenantId/members/$uuid.$extension';
  final client = Supabase.instance.client;

  await client.storage.from('member-photos').upload(filePath, file);

  return client.storage.from('member-photos').getPublicUrl(filePath);
}
```

## RLS Note

The SQL policies in `supabase_storage_setup.sql` assume your Supabase Auth JWT
contains `tenantId` and `role` claims. If your mobile app authenticates only
against the Node.js backend, you need either:

- Supabase Auth sessions mirrored from your backend identity
- A trusted backend upload proxy using a service role key
