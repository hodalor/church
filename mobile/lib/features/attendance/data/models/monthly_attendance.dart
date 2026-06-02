class MonthlyAttendance {
  const MonthlyAttendance({
    required this.month,
    required this.year,
    required this.attended,
    required this.total,
    required this.rate,
  });

  final int month;
  final int year;
  final int attended;
  final int total;
  final double rate;

  factory MonthlyAttendance.fromJson(Map<String, dynamic> json) {
    return MonthlyAttendance(
      month: int.tryParse((json['month'] ?? 1).toString()) ?? 1,
      year: int.tryParse((json['year'] ?? DateTime.now().year).toString()) ??
          DateTime.now().year,
      attended: int.tryParse((json['attended'] ?? 0).toString()) ?? 0,
      total: int.tryParse((json['total'] ?? 0).toString()) ?? 0,
      rate: (json['rate'] is num)
          ? (json['rate'] as num).toDouble()
          : double.tryParse((json['rate'] ?? 0).toString()) ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'month': month,
      'year': year,
      'attended': attended,
      'total': total,
      'rate': rate,
    };
  }
}
