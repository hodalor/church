import 'package:dio/dio.dart';
import '../../../core/api/endpoints.dart';
import '../../../core/storage/secure_storage.dart';
import 'models/member.dart';
import 'models/member_list_response.dart';

class MemberRepository {
  MemberRepository({
    required Dio dio,
    required SecureStorageService storage,
  })  : _dio = dio,
        _storage = storage;

  final Dio _dio;
  final SecureStorageService _storage;

  Future<MemberListResponse> getMembers({
    int page = 1,
    int limit = 20,
    String? search,
    bool? activeOnly,
  }) async {
    final response = await _dio.get<Map<String, dynamic>>(
      Endpoints.members,
      queryParameters: <String, dynamic>{
        'page': page,
        'limit': limit,
        if (search != null && search.trim().isNotEmpty) 'search': search.trim(),
        if (activeOnly != null) 'isActive': activeOnly,
      },
    );

    final payload = response.data?['data'] is Map<String, dynamic>
        ? response.data!['data'] as Map<String, dynamic>
        : (response.data ?? <String, dynamic>{});

    return MemberListResponse.fromJson(payload);
  }

  Future<Member> getMemberById(String memberId) async {
    final response = await _dio.get<Map<String, dynamic>>('${Endpoints.members}/$memberId');
    final payload = response.data?['data'] is Map<String, dynamic>
        ? response.data!['data'] as Map<String, dynamic>
        : (response.data ?? <String, dynamic>{});
    return Member.fromJson(payload);
  }

  Future<Member> getMyProfile() async {
    final userProfile = await _storage.getUserProfile();
    final memberId = userProfile?.memberId;

    if (memberId == null || memberId.isEmpty) {
      throw Exception('This account is not linked to a member profile yet.');
    }

    return getMemberById(memberId);
  }

  Future<String> getMemberQrCode(String memberId) async {
    final response = await _dio.get<Map<String, dynamic>>('${Endpoints.members}/$memberId/qr-code');
    final payload = response.data?['data'] is Map<String, dynamic>
        ? response.data!['data'] as Map<String, dynamic>
        : (response.data ?? <String, dynamic>{});

    return (payload['qrCode'] ?? '').toString();
  }
}
