import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'app.dart';
import 'core/services/push_notification_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await _safeBootstrap();

  final container = ProviderContainer();

  runApp(
    UncontrolledProviderScope(
      container: container,
      child: const PrynovaApp(),
    ),
  );

  unawaited(
    container.read(pushNotificationServiceProvider).initialize(),
  );
}

Future<void> _safeBootstrap() async {
  try {
    await dotenv.load(fileName: '.env').timeout(const Duration(seconds: 3));
  } catch (error) {
    debugPrint('dotenv bootstrap skipped: $error');
  }

  final supabaseUrl = dotenv.env['SUPABASE_URL']?.trim();
  final supabaseAnonKey = dotenv.env['SUPABASE_ANON_KEY']?.trim();

  if (supabaseUrl == null ||
      supabaseUrl.isEmpty ||
      supabaseAnonKey == null ||
      supabaseAnonKey.isEmpty) {
    debugPrint('Supabase bootstrap skipped: missing env config');
    return;
  }

  try {
    await Supabase.initialize(
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
    ).timeout(const Duration(seconds: 5));
  } catch (error) {
    debugPrint('Supabase bootstrap skipped: $error');
  }
}
