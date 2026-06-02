import 'package:flutter/foundation.dart';

class AuthSessionNotifier extends ChangeNotifier {
  AuthSessionNotifier._();

  static final AuthSessionNotifier instance = AuthSessionNotifier._();

  void notifySignedOut() {
    notifyListeners();
  }
}
