class WeeklyDigest {
  const WeeklyDigest({
    required this.period,
    required this.members,
    required this.attendance,
    required this.finance,
    required this.visitors,
  });

  final String period;
  final double members;
  final double attendance;
  final double finance;
  final double visitors;

  factory WeeklyDigest.fromJson(Map<String, dynamic> json) {
    num asNum(dynamic value) {
      if (value is num) {
        return value;
      }
      return num.tryParse(value?.toString() ?? '') ?? 0;
    }

    final members = json['members'] is Map<String, dynamic>
        ? json['members'] as Map<String, dynamic>
        : <String, dynamic>{};
    final attendance = json['attendance'] is Map<String, dynamic>
        ? json['attendance'] as Map<String, dynamic>
        : <String, dynamic>{};
    final finance = json['finance'] is Map<String, dynamic>
        ? json['finance'] as Map<String, dynamic>
        : <String, dynamic>{};
    final visitors = json['visitors'] is Map<String, dynamic>
        ? json['visitors'] as Map<String, dynamic>
        : <String, dynamic>{};

    return WeeklyDigest(
      period: (json['period'] ?? json['month'] ?? 'This Week').toString(),
      members: asNum(
        json['members'] is Map<String, dynamic> ? members['total'] : json['members'],
      ).toDouble(),
      attendance: asNum(
        json['attendance'] is Map<String, dynamic>
            ? attendance['total']
            : json['attendance'],
      ).toDouble(),
      finance: asNum(
        json['finance'] is Map<String, dynamic> ? finance['income'] : json['finance'],
      ).toDouble(),
      visitors: asNum(
        json['visitors'] is Map<String, dynamic>
            ? visitors['registered']
            : json['visitors'],
      ).toDouble(),
    );
  }
}
