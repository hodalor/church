import 'member.dart';

class MemberListResponse {
  const MemberListResponse({
    required this.members,
    required this.total,
    required this.page,
    required this.totalPages,
  });

  final List<Member> members;
  final int total;
  final int page;
  final int totalPages;

  factory MemberListResponse.fromJson(Map<String, dynamic> json) {
    int parseInt(dynamic value) => value is num ? value.toInt() : int.tryParse(value?.toString() ?? '') ?? 0;

    return MemberListResponse(
      members: (json['members'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<Map<String, dynamic>>()
          .map(Member.fromJson)
          .toList(),
      total: parseInt(json['total']),
      page: parseInt(json['page']),
      totalPages: parseInt(json['totalPages']),
    );
  }
}
