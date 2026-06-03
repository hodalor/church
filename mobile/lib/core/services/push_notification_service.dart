import 'dart:convert';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../app.dart';
import '../../features/auth/data/auth_repository.dart';
import '../../features/auth/providers/auth_provider.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
  } catch (_) {
    // Ignore Firebase init failures in background when config is missing.
  }
}

final pushNotificationServiceProvider = Provider<PushNotificationService>((ref) {
  return PushNotificationService(
    authRepository: ref.read(authRepositoryProvider),
  );
});

class PushNotificationService {
  PushNotificationService({
    required AuthRepository authRepository,
  }) : _authRepository = authRepository;

  final AuthRepository _authRepository;
  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  bool _initialized = false;

  Future<void> initialize() async {
    if (_initialized) {
      return;
    }

    try {
      await Firebase.initializeApp().timeout(const Duration(seconds: 5));
    } catch (error) {
      debugPrint('Firebase initialize skipped: $error');
      return;
    }

    try {
      FirebaseMessaging.onBackgroundMessage(
        firebaseMessagingBackgroundHandler,
      );

      await _requestPermissions().timeout(const Duration(seconds: 5));
      await _configureLocalNotifications().timeout(const Duration(seconds: 5));
      await _syncCurrentToken().timeout(const Duration(seconds: 5));

      _firebaseMessaging.onTokenRefresh.listen((token) async {
        await _updateBackendToken(token);
      });

      FirebaseMessaging.onMessage.listen((message) async {
        await _showForegroundNotification(message);
      });

      FirebaseMessaging.onMessageOpenedApp.listen(
        _handleNotificationNavigation,
      );

      final initialMessage = await _firebaseMessaging.getInitialMessage();
      if (initialMessage != null) {
        _handleNotificationNavigation(initialMessage);
      }

      _initialized = true;
    } catch (error) {
      debugPrint('Push notification setup failed: $error');
    }
  }

  Future<void> _requestPermissions() async {
    await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );
  }

  Future<void> _configureLocalNotifications() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings();
    const settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      settings,
      onDidReceiveNotificationResponse: (response) {
        final payload = response.payload;
        if (payload == null || payload.isEmpty) {
          return;
        }

        final data = jsonDecode(payload) as Map<String, dynamic>;
        _navigateFromData(data);
      },
    );
  }

  Future<void> _syncCurrentToken() async {
    final token = await _firebaseMessaging.getToken().timeout(const Duration(seconds: 5));
    if (token == null || token.isEmpty) {
      return;
    }

    await _updateBackendToken(token);
  }

  Future<void> _updateBackendToken(String? token) async {
    try {
      await _authRepository.updateFcmToken(token);
    } catch (error) {
      debugPrint('Unable to sync FCM token: $error');
    }
  }

  Future<void> _showForegroundNotification(RemoteMessage message) async {
    final title = message.notification?.title ??
        message.data['title']?.toString() ??
        'Prynova';
    final body = message.notification?.body ??
        message.data['message']?.toString() ??
        '';

    const androidDetails = AndroidNotificationDetails(
      'prynova_messages',
      'Prynova Messages',
      channelDescription: 'Church communication notifications',
      importance: Importance.max,
      priority: Priority.high,
    );
    const notificationDetails = NotificationDetails(
      android: androidDetails,
      iOS: DarwinNotificationDetails(),
    );

    await _localNotifications.show(
      message.hashCode,
      title,
      body,
      notificationDetails,
      payload: jsonEncode(message.data),
    );
  }

  void _handleNotificationNavigation(RemoteMessage message) {
    _navigateFromData(message.data);
  }

  void _navigateFromData(Map<String, dynamic> data) {
    final type = (data['type'] ?? data['notificationType'] ?? '')
        .toString()
        .trim()
        .toLowerCase();

    String destination = '/inbox';
    if (type == 'broadcast') {
      final messageId =
          (data['messageId'] ?? data['id'] ?? data['broadcastId'] ?? '')
              .toString();
      destination = messageId.isNotEmpty ? '/inbox/$messageId' : '/inbox';
    } else if (type == 'prayer_request') {
      final requestId = (data['requestId'] ?? data['id'] ?? '').toString();
      destination =
          requestId.isNotEmpty ? '/prayer-requests/$requestId' : '/prayer-requests';
    } else if (type == 'birthday') {
      destination = '/profile';
    } else if (type == 'health_alert') {
      destination = '/profile';
    }

    final router = AppRouterRegistry.instance.router;
    if (router == null) {
      return;
    }

    router.go(destination);
  }
}
