class ServiceStats {
  const ServiceStats({
    required this.totalCheckedIn,
    required this.members,
    required this.visitors,
    required this.children,
    required this.online,
    required this.firstTimers,
  });

  const ServiceStats.empty()
      : totalCheckedIn = 0,
        members = 0,
        visitors = 0,
        children = 0,
        online = 0,
        firstTimers = 0;

  final int totalCheckedIn;
  final int members;
  final int visitors;
  final int children;
  final int online;
  final int firstTimers;

  factory ServiceStats.fromJson(Map<String, dynamic> json) {
    int parseInt(dynamic value) => int.tryParse((value ?? 0).toString()) ?? 0;

    return ServiceStats(
      totalCheckedIn: parseInt(
        json['totalCheckedIn'] ?? json['total'] ?? json['count'],
      ),
      members: parseInt(json['members']),
      visitors: parseInt(json['visitors']),
      children: parseInt(json['children']),
      online: parseInt(json['online']),
      firstTimers: parseInt(json['firstTimers']),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'totalCheckedIn': totalCheckedIn,
      'members': members,
      'visitors': visitors,
      'children': children,
      'online': online,
      'firstTimers': firstTimers,
    };
  }
}
