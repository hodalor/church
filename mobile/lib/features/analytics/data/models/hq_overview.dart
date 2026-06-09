class HqSummary {
  const HqSummary({
    required this.totalMembers,
    required this.activeMembers,
    required this.totalBranches,
    required this.totalVolunteers,
    required this.openCasesCount,
    required this.upcomingEvents,
  });

  final int totalMembers;
  final int activeMembers;
  final int totalBranches;
  final int totalVolunteers;
  final int openCasesCount;
  final int upcomingEvents;

  factory HqSummary.fromJson(Map<String, dynamic> json) {
    int toInt(dynamic value) {
      if (value is num) {
        return value.toInt();
      }
      return int.tryParse(value?.toString() ?? '') ?? 0;
    }

    return HqSummary(
      totalMembers: toInt(json['totalMembers']),
      activeMembers: toInt(json['activeMembers']),
      totalBranches: toInt(json['totalBranches']),
      totalVolunteers: toInt(json['totalVolunteers']),
      openCasesCount: toInt(json['openCasesCount']),
      upcomingEvents: toInt(json['upcomingEvents']),
    );
  }
}

class HqThisMonth {
  const HqThisMonth({
    required this.newMembers,
    required this.attendance,
    required this.income,
    required this.expenses,
    required this.newVisitors,
    required this.converted,
    required this.broadcastsSent,
  });

  final int newMembers;
  final int attendance;
  final double income;
  final double expenses;
  final int newVisitors;
  final int converted;
  final int broadcastsSent;

  factory HqThisMonth.fromJson(Map<String, dynamic> json) {
    int toInt(dynamic value) {
      if (value is num) {
        return value.toInt();
      }
      return int.tryParse(value?.toString() ?? '') ?? 0;
    }

    double toDouble(dynamic value) {
      if (value is num) {
        return value.toDouble();
      }
      return double.tryParse(value?.toString() ?? '') ?? 0;
    }

    return HqThisMonth(
      newMembers: toInt(json['newMembers']),
      attendance: toInt(json['attendance']),
      income: toDouble(json['income']),
      expenses: toDouble(json['expenses']),
      newVisitors: toInt(json['newVisitors']),
      converted: toInt(json['converted']),
      broadcastsSent: toInt(json['broadcastsSent']),
    );
  }
}

class HqGrowthChange {
  const HqGrowthChange({
    required this.percent,
    required this.trend,
    required this.value,
  });

  final double percent;
  final String trend;
  final double value;

  factory HqGrowthChange.fromJson(Map<String, dynamic> json) {
    double toDouble(dynamic value) {
      if (value is num) {
        return value.toDouble();
      }
      return double.tryParse(value?.toString() ?? '') ?? 0;
    }

    return HqGrowthChange(
      percent: toDouble(json['percent']),
      trend: (json['trend'] ?? 'stable').toString(),
      value: toDouble(json['value']),
    );
  }
}

class HqAlert {
  const HqAlert({
    required this.type,
    required this.severity,
    required this.title,
    required this.message,
  });

  final String type;
  final String severity;
  final String title;
  final String message;

  factory HqAlert.fromJson(Map<String, dynamic> json) {
    return HqAlert(
      type: (json['type'] ?? 'general').toString(),
      severity: (json['severity'] ?? 'info').toString(),
      title: (json['title'] ?? '').toString(),
      message: (json['message'] ?? '').toString(),
    );
  }
}

class HqTopBranch {
  const HqTopBranch({
    required this.branchName,
    required this.metric,
    required this.value,
  });

  final String branchName;
  final String metric;
  final double value;

  factory HqTopBranch.fromJson(Map<String, dynamic> json) {
    return HqTopBranch(
      branchName: (json['branchName'] ?? '').toString(),
      metric: (json['metric'] ?? '').toString(),
      value: json['value'] is num
          ? (json['value'] as num).toDouble()
          : double.tryParse(json['value']?.toString() ?? '') ?? 0,
    );
  }
}

class HqNeedsAttention {
  const HqNeedsAttention({
    required this.branchName,
    required this.issue,
    required this.severity,
  });

  final String branchName;
  final String issue;
  final String severity;

  factory HqNeedsAttention.fromJson(Map<String, dynamic> json) {
    return HqNeedsAttention(
      branchName: (json['branchName'] ?? '').toString(),
      issue: (json['issue'] ?? '').toString(),
      severity: (json['severity'] ?? 'warning').toString(),
    );
  }
}

class HQOverview {
  const HQOverview({
    required this.summary,
    required this.thisMonth,
    required this.vsLastMonth,
    required this.alerts,
    required this.needsAttention,
    this.topBranch,
  });

  final HqSummary summary;
  final HqThisMonth thisMonth;
  final Map<String, HqGrowthChange> vsLastMonth;
  final List<HqAlert> alerts;
  final List<HqNeedsAttention> needsAttention;
  final HqTopBranch? topBranch;

  factory HQOverview.fromJson(Map<String, dynamic> json) {
    final vs = json['vsLastMonth'] is Map<String, dynamic>
        ? json['vsLastMonth'] as Map<String, dynamic>
        : <String, dynamic>{};

    return HQOverview(
      summary: HqSummary.fromJson(
        json['summary'] is Map<String, dynamic>
            ? json['summary'] as Map<String, dynamic>
            : <String, dynamic>{},
      ),
      thisMonth: HqThisMonth.fromJson(
        json['thisMonth'] is Map<String, dynamic>
            ? json['thisMonth'] as Map<String, dynamic>
            : <String, dynamic>{},
      ),
      vsLastMonth: vs.map(
        (key, value) => MapEntry(
          key,
          HqGrowthChange.fromJson(
            value is Map<String, dynamic> ? value : <String, dynamic>{},
          ),
        ),
      ),
      alerts: (json['alerts'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<Map<String, dynamic>>()
          .map(HqAlert.fromJson)
          .toList(),
      needsAttention:
          (json['needsAttention'] as List<dynamic>? ?? const <dynamic>[])
              .whereType<Map<String, dynamic>>()
              .map(HqNeedsAttention.fromJson)
              .toList(),
      topBranch: json['topBranch'] is Map<String, dynamic>
          ? HqTopBranch.fromJson(json['topBranch'] as Map<String, dynamic>)
          : null,
    );
  }
}
