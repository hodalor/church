import 'poll_option.dart';

class Poll {
  const Poll({
    required this.pollId,
    required this.question,
    required this.options,
    required this.isAnonymous,
    required this.expiresAt,
    required this.status,
    required this.totalVotes,
    required this.hasVoted,
    this.userVoteOptionId,
  });

  final String pollId;
  final String question;
  final List<PollOption> options;
  final bool isAnonymous;
  final DateTime? expiresAt;
  final String status;
  final int totalVotes;
  final bool hasVoted;
  final String? userVoteOptionId;

  bool get isClosed => status == 'closed';

  factory Poll.fromJson(Map<String, dynamic> json) {
    final totalVotes = int.tryParse((json['totalVotes'] ?? 0).toString()) ?? 0;
    final optionsJson = (json['options'] as List<dynamic>? ?? <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .toList();

    return Poll(
      pollId: (json['pollId'] ?? json['_id'] ?? '').toString(),
      question: (json['question'] ?? '').toString(),
      options: optionsJson
          .map((item) => PollOption.fromJson(item, totalVotes: totalVotes))
          .toList(),
      isAnonymous: json['isAnonymous'] == true,
      expiresAt: json['expiresAt'] != null
          ? DateTime.tryParse(json['expiresAt'].toString())
          : null,
      status: (json['status'] ?? (json['isClosed'] == true ? 'closed' : 'active'))
          .toString(),
      totalVotes: totalVotes,
      hasVoted: json['hasVoted'] == true,
      userVoteOptionId: json['userVoteOptionId']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'pollId': pollId,
      'question': question,
      'options': options.map((item) => item.toJson()).toList(),
      'isAnonymous': isAnonymous,
      'expiresAt': expiresAt?.toIso8601String(),
      'status': status,
      'totalVotes': totalVotes,
      'hasVoted': hasVoted,
      'userVoteOptionId': userVoteOptionId,
    };
  }

  Poll copyWith({
    List<PollOption>? options,
    int? totalVotes,
    bool? hasVoted,
    String? userVoteOptionId,
    String? status,
  }) {
    return Poll(
      pollId: pollId,
      question: question,
      options: options ?? this.options,
      isAnonymous: isAnonymous,
      expiresAt: expiresAt,
      status: status ?? this.status,
      totalVotes: totalVotes ?? this.totalVotes,
      hasVoted: hasVoted ?? this.hasVoted,
      userVoteOptionId: userVoteOptionId ?? this.userVoteOptionId,
    );
  }
}
