class PollOption {
  const PollOption({
    required this.id,
    required this.text,
    required this.votes,
    required this.percentage,
  });

  final String id;
  final String text;
  final int votes;
  final double percentage;

  factory PollOption.fromJson(Map<String, dynamic> json, {int totalVotes = 0}) {
    final votes = int.tryParse((json['votes'] ?? 0).toString()) ?? 0;
    final explicitPercentage = json['percentage'];
    final percentage = explicitPercentage != null
        ? double.tryParse(explicitPercentage.toString()) ?? 0
        : totalVotes > 0
            ? ((votes / totalVotes) * 100).toDouble()
            : 0.0;

    return PollOption(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      text: (json['text'] ?? '').toString(),
      votes: votes,
      percentage: percentage,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'text': text,
      'votes': votes,
      'percentage': percentage,
    };
  }

  PollOption copyWith({
    int? votes,
    double? percentage,
  }) {
    return PollOption(
      id: id,
      text: text,
      votes: votes ?? this.votes,
      percentage: percentage ?? this.percentage,
    );
  }
}
