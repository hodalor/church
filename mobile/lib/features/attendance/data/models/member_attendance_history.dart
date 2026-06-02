import 'attendance_record.dart';
import 'monthly_attendance.dart';

class MemberAttendanceHistory {
  const MemberAttendanceHistory({
    required this.totalServices,
    required this.attended,
    required this.attendanceRate,
    required this.streak,
    required this.longestStreak,
    required this.attendedServices,
    required this.monthlyBreakdown,
  });

  const MemberAttendanceHistory.empty()
      : totalServices = 0,
        attended = 0,
        attendanceRate = 0,
        streak = 0,
        longestStreak = 0,
        attendedServices = const <AttendanceRecord>[],
        monthlyBreakdown = const <MonthlyAttendance>[];

  final int totalServices;
  final int attended;
  final double attendanceRate;
  final int streak;
  final int longestStreak;
  final List<AttendanceRecord> attendedServices;
  final List<MonthlyAttendance> monthlyBreakdown;

  factory MemberAttendanceHistory.fromJson(Map<String, dynamic> json) {
    return MemberAttendanceHistory(
      totalServices: int.tryParse((json['totalServices'] ?? 0).toString()) ?? 0,
      attended: int.tryParse((json['attended'] ?? 0).toString()) ?? 0,
      attendanceRate: (json['attendanceRate'] is num)
          ? (json['attendanceRate'] as num).toDouble()
          : double.tryParse((json['attendanceRate'] ?? 0).toString()) ?? 0,
      streak: int.tryParse((json['streak'] ?? 0).toString()) ?? 0,
      longestStreak:
          int.tryParse((json['longestStreak'] ?? 0).toString()) ?? 0,
      attendedServices:
          (json['attendedServices'] as List<dynamic>? ?? const <dynamic>[])
              .whereType<Map<String, dynamic>>()
              .map(AttendanceRecord.fromJson)
              .toList(),
      monthlyBreakdown:
          (json['monthlyBreakdown'] as List<dynamic>? ?? const <dynamic>[])
              .whereType<Map<String, dynamic>>()
              .map(MonthlyAttendance.fromJson)
              .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'totalServices': totalServices,
      'attended': attended,
      'attendanceRate': attendanceRate,
      'streak': streak,
      'longestStreak': longestStreak,
      'attendedServices':
          attendedServices.map((record) => record.toJson()).toList(),
      'monthlyBreakdown':
          monthlyBreakdown.map((month) => month.toJson()).toList(),
    };
  }
}
