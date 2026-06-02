import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/member.dart';
import 'members_provider.dart';

final memberDetailProvider = FutureProvider.family<Member, String>((ref, memberId) async {
  final repository = ref.watch(memberRepositoryProvider);
  return repository.getMemberById(memberId);
});

final myProfileProvider = FutureProvider<Member>((ref) async {
  final repository = ref.watch(memberRepositoryProvider);
  return repository.getMyProfile();
});
