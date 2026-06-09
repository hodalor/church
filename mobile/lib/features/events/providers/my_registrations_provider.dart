import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/registration.dart';
import 'events_provider.dart';

final myRegistrationsProvider = FutureProvider<List<Registration>>((ref) async {
  return ref.watch(eventRepositoryProvider).getMyRegistrations();
});
