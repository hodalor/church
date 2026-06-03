class Endpoints {
  static const String apiV1 = '/api/v1';
  static const String login = '$apiV1/auth/login';
  static const String refresh = '$apiV1/auth/refresh';
  static const String logout = '$apiV1/auth/logout';
  static const String me = '$apiV1/auth/me';
  static const String updateFcmToken = '$apiV1/auth/fcm-token';
  static const String members = '$apiV1/members';
  static const String memberStats = '$apiV1/members/stats';
  static const String memberHealthScores = '$apiV1/members/health-scores';
  static const String notifications = '$apiV1/notifications';
  static const String communication = '$apiV1/communication';
  static const String communicationInbox = '$communication/inbox';
  static const String communicationPrayerRequests = '$communication/prayer-requests';
  static const String communicationPolls = '$communication/polls';
  static const String attendance = '$apiV1/attendance';
  static const String attendanceServices = '$attendance/services';
  static const String attendanceReports = '$attendance/reports';
  static const String attendanceAbsentees = '$attendance/absentees';
  static const String visitors = '$apiV1/visitors';
  static const String visitorsFollowUps = '$visitors/follow-ups';
  static const String visitorsPipeline = '$visitors/pipeline';
  static const String visitorsWorkflow = '$visitors/workflow';
  static const String visitorsReports = '$visitors/reports';
  static const String visitorsSearch = '$visitors/search';
  static const String visitorsDuplicateCheck = '$visitors/duplicate-check';
  static const String visitorsAssignableLeaders = '$visitors/assignable-leaders';
  static const String visitorsKioskRegister = '$visitors/kiosk/register';
  static const String adminVisitorsOverview = '$apiV1/admin/visitors/overview';

  static String inboxMessage(String messageId) => '$communicationInbox/$messageId';

  static String prayerRequest(String requestId) =>
      '$communicationPrayerRequests/$requestId';

  static String prayForRequest(String requestId) =>
      '$communicationPrayerRequests/$requestId/pray';

  static String pollVote(String pollId) => '$communicationPolls/$pollId/vote';

  static String attendanceService(String serviceId) =>
      '$attendanceServices/$serviceId';

  static String attendanceServiceOnlineCheckIn(String serviceId) =>
      '$attendanceServices/$serviceId/check-in/online';

  static String attendanceServiceQrCheckIn(String serviceId) =>
      '$attendanceServices/$serviceId/check-in/qr';

  static String attendanceServiceManualCheckIn(String serviceId) =>
      '$attendanceServices/$serviceId/check-in/member';

  static String attendanceServiceVisitorCheckIn(String serviceId) =>
      '$attendanceServices/$serviceId/check-in/visitor';

  static String attendanceServiceChildCheckIn(String serviceId) =>
      '$attendanceServices/$serviceId/check-in/child';

  static String attendanceServiceRecords(String serviceId) =>
      '$attendanceServices/$serviceId/check-ins';

  static String visitor(String visitorId) => '$visitors/$visitorId';

  static String visitorStage(String visitorId) => '$visitors/$visitorId/stage';

  static String visitorReturnVisit(String visitorId) =>
      '$visitors/$visitorId/return-visit';

  static String visitorConvert(String visitorId) => '$visitors/$visitorId/convert';

  static String visitorFollowUps(String visitorId) =>
      '$visitors/$visitorId/follow-ups';

  static String visitorCompleteFollowUp(String visitorId, String followUpId) =>
      '$visitors/$visitorId/follow-ups/$followUpId/complete';

  static String visitorRescheduleFollowUp(String visitorId, String followUpId) =>
      '$visitors/$visitorId/follow-ups/$followUpId/reschedule';
}
