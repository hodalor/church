class BranchMetric {
  const BranchMetric({
    required this.branchId,
    required this.branchName,
    required this.members,
    required this.attendance,
    required this.finance,
    required this.healthScore,
    required this.grade,
    required this.trend,
    this.branchCode,
    this.city,
    this.activeMembers = 0,
    this.newMembers = 0,
    this.lastServiceAttendance = 0,
    this.expenses = 0,
    this.net = 0,
    this.visitors = 0,
    this.converted = 0,
  });

  final String branchId;
  final String branchName;
  final String? branchCode;
  final String? city;
  final int members;
  final int activeMembers;
  final int newMembers;
  final double attendance;
  final int lastServiceAttendance;
  final double finance;
  final double expenses;
  final double net;
  final double healthScore;
  final String grade;
  final String trend;
  final int visitors;
  final int converted;

  factory BranchMetric.fromJson(Map<String, dynamic> json) {
    num asNum(dynamic value) {
      if (value is num) {
        return value;
      }
      return num.tryParse(value?.toString() ?? '') ?? 0;
    }

    final health = json['health'] is Map<String, dynamic>
        ? json['health'] as Map<String, dynamic>
        : <String, dynamic>{};
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

    return BranchMetric(
      branchId: (json['branchId'] ?? '').toString(),
      branchName: (json['branchName'] ?? '').toString(),
      branchCode: json['branchCode']?.toString(),
      city: json['city']?.toString(),
      members: asNum(members['total']).toInt(),
      activeMembers: asNum(members['active']).toInt(),
      newMembers: asNum(members['new']).toInt(),
      attendance: asNum(attendance['avg']).toDouble(),
      lastServiceAttendance: asNum(attendance['lastService']).toInt(),
      finance: asNum(finance['income']).toDouble(),
      expenses: asNum(finance['expenses']).toDouble(),
      net: asNum(finance['net']).toDouble(),
      healthScore: asNum(health['score']).toDouble(),
      grade: (health['grade'] ?? 'C').toString(),
      trend:
          (health['trend'] ?? attendance['trend'] ?? finance['trend'] ?? 'stable')
              .toString(),
      visitors: asNum(visitors['total']).toInt(),
      converted: asNum(visitors['converted']).toInt(),
    );
  }
}
