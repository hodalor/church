class VisitorStats {
  const VisitorStats({
    required this.totalVisitors,
    required this.thisMonth,
    required this.conversionRate,
    required this.pendingFollowUps,
  });

  final int totalVisitors;
  final int thisMonth;
  final double conversionRate;
  final int pendingFollowUps;

  factory VisitorStats.fromJson(Map<String, dynamic> json) {
    return VisitorStats(
      totalVisitors: int.tryParse((json['totalVisitors'] ?? 0).toString()) ?? 0,
      thisMonth: int.tryParse((json['thisMonth'] ?? 0).toString()) ?? 0,
      conversionRate: double.tryParse((json['conversionRate'] ?? 0).toString()) ?? 0,
      pendingFollowUps: int.tryParse((json['pendingFollowUps'] ?? 0).toString()) ?? 0,
    );
  }
}
