import 'package:flutter/material.dart';
import '../../events_utils.dart';
import 'ticket_tier.dart';

class Event {
  const Event({
    required this.eventId,
    required this.title,
    required this.type,
    required this.status,
    required this.startDate,
    required this.requiresRegistration,
    required this.isFree,
    required this.isPublic,
    required this.registeredCount,
    this.description,
    this.endDate,
    this.startTime,
    this.endTime,
    this.isMultiDay = false,
    this.venue,
    this.address,
    this.isOnline = false,
    this.streamUrl,
    this.branch,
    this.bannerUrl,
    this.mediaUrls = const <String>[],
    this.registrationDeadline,
    this.maxAttendees,
    this.requiresApproval = false,
    this.estimatedBudget,
    this.actualCost,
    this.currency,
    this.organizerUserId,
    this.coOrganizers = const <String>[],
    this.volunteers = const <String>[],
    this.tags = const <String>[],
    this.ticketTiers = const <TicketTier>[],
    this.gpsCoordinates,
  });

  final String eventId;
  final String title;
  final String? description;
  final String type;
  final String status;
  final DateTime? startDate;
  final DateTime? endDate;
  final String? startTime;
  final String? endTime;
  final bool isMultiDay;
  final String? venue;
  final String? address;
  final bool isOnline;
  final String? streamUrl;
  final String? branch;
  final String? bannerUrl;
  final List<String> mediaUrls;
  final bool requiresRegistration;
  final DateTime? registrationDeadline;
  final int? maxAttendees;
  final int registeredCount;
  final bool isFree;
  final bool isPublic;
  final bool requiresApproval;
  final double? estimatedBudget;
  final double? actualCost;
  final String? currency;
  final String? organizerUserId;
  final List<String> coOrganizers;
  final List<String> volunteers;
  final List<String> tags;
  final List<TicketTier> ticketTiers;
  final Map<String, dynamic>? gpsCoordinates;

  bool get isUpcoming => startDate != null && startDate!.isAfter(DateTime.now());
  bool get isOngoing {
    if (startDate == null) {
      return false;
    }
    final now = DateTime.now();
    if (endDate != null) {
      return startDate!.isBefore(now) && endDate!.isAfter(now);
    }
    return startDate!.year == now.year &&
        startDate!.month == now.month &&
        startDate!.day == now.day;
  }

  bool get isFull => maxAttendees != null && registeredCount >= maxAttendees!;
  String get formattedDate => formatEventDateRange(startDate, endDate);
  String get formattedTime => formatEventTimeRange(startTime, endTime);
  Color get statusColor => eventStatusColor(status);

  factory Event.fromJson(Map<String, dynamic> json) {
    return Event(
      eventId: (json['eventId'] ?? json['_id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      description: json['description']?.toString(),
      type: (json['type'] ?? 'other').toString(),
      status: (json['status'] ?? 'draft').toString(),
      startDate: json['startDate'] != null
          ? DateTime.tryParse(json['startDate'].toString())
          : null,
      endDate: json['endDate'] != null
          ? DateTime.tryParse(json['endDate'].toString())
          : null,
      startTime: json['startTime']?.toString(),
      endTime: json['endTime']?.toString(),
      isMultiDay: json['isMultiDay'] == true,
      venue: json['venue']?.toString(),
      address: json['address']?.toString(),
      isOnline: json['isOnline'] == true,
      streamUrl: json['streamUrl']?.toString(),
      branch: json['branch']?.toString(),
      bannerUrl: json['bannerUrl']?.toString(),
      mediaUrls: (json['mediaUrls'] as List<dynamic>? ?? const <dynamic>[])
          .map((item) => item.toString())
          .toList(),
      requiresRegistration: json['requiresRegistration'] == true,
      registrationDeadline: json['registrationDeadline'] != null
          ? DateTime.tryParse(json['registrationDeadline'].toString())
          : null,
      maxAttendees: json['maxAttendees'] == null
          ? null
          : (json['maxAttendees'] is num)
              ? (json['maxAttendees'] as num).toInt()
              : int.tryParse(json['maxAttendees'].toString()),
      registeredCount: (json['registeredCount'] is num)
          ? (json['registeredCount'] as num).toInt()
          : int.tryParse(json['registeredCount']?.toString() ?? '') ?? 0,
      isFree: json['isFree'] != false,
      isPublic: json['isPublic'] != false,
      requiresApproval: json['requiresApproval'] == true,
      estimatedBudget: (json['estimatedBudget'] is num)
          ? (json['estimatedBudget'] as num).toDouble()
          : double.tryParse(json['estimatedBudget']?.toString() ?? ''),
      actualCost: (json['actualCost'] is num)
          ? (json['actualCost'] as num).toDouble()
          : double.tryParse(json['actualCost']?.toString() ?? ''),
      currency: json['currency']?.toString(),
      organizerUserId: json['organizerUserId']?.toString(),
      coOrganizers: (json['coOrganizers'] as List<dynamic>? ?? const <dynamic>[])
          .map((item) => item.toString())
          .toList(),
      volunteers: (json['volunteers'] as List<dynamic>? ?? const <dynamic>[])
          .map((item) => item.toString())
          .toList(),
      tags: (json['tags'] as List<dynamic>? ?? const <dynamic>[])
          .map((item) => item.toString())
          .toList(),
      ticketTiers: (json['ticketTiers'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<Map<String, dynamic>>()
          .map(TicketTier.fromJson)
          .toList(),
      gpsCoordinates: json['gpsCoordinates'] is Map<String, dynamic>
          ? Map<String, dynamic>.from(json['gpsCoordinates'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'eventId': eventId,
      'title': title,
      'description': description,
      'type': type,
      'status': status,
      'startDate': startDate?.toIso8601String(),
      'endDate': endDate?.toIso8601String(),
      'startTime': startTime,
      'endTime': endTime,
      'isMultiDay': isMultiDay,
      'venue': venue,
      'address': address,
      'isOnline': isOnline,
      'streamUrl': streamUrl,
      'branch': branch,
      'bannerUrl': bannerUrl,
      'mediaUrls': mediaUrls,
      'requiresRegistration': requiresRegistration,
      'registrationDeadline': registrationDeadline?.toIso8601String(),
      'maxAttendees': maxAttendees,
      'registeredCount': registeredCount,
      'isFree': isFree,
      'isPublic': isPublic,
      'requiresApproval': requiresApproval,
      'estimatedBudget': estimatedBudget,
      'actualCost': actualCost,
      'currency': currency,
      'organizerUserId': organizerUserId,
      'coOrganizers': coOrganizers,
      'volunteers': volunteers,
      'tags': tags,
      'ticketTiers': ticketTiers.map((item) => item.toJson()).toList(),
      'gpsCoordinates': gpsCoordinates,
    };
  }
}
