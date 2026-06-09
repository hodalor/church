import 'branch_metric.dart';

class BranchComparison {
  const BranchComparison({
    required this.items,
    required this.metric,
  });

  final List<BranchMetric> items;
  final String metric;

  factory BranchComparison.fromJson(Map<String, dynamic> json) {
    return BranchComparison(
      metric: (json['metric'] ?? 'health').toString(),
      items: (json['items'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<Map<String, dynamic>>()
          .map(BranchMetric.fromJson)
          .toList(),
    );
  }
}
