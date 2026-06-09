class Registration {
  const Registration({
    required this.registrationId,
    required this.eventId,
    required this.eventTitle,
    required this.quantity,
    required this.totalAmount,
    required this.currency,
    required this.isPaid,
    required this.status,
    required this.approvalStatus,
    this.memberId,
    this.memberName,
    this.externalName,
    this.phone,
    this.email,
    this.tierId,
    this.tierName,
    this.paymentRef,
    this.qrCode,
    this.checkedInAt,
    this.checkedInBy,
    this.notes,
    this.createdAt,
  });

  final String registrationId;
  final String eventId;
  final String eventTitle;
  final String? memberId;
  final String? memberName;
  final String? externalName;
  final String? phone;
  final String? email;
  final String? tierId;
  final String? tierName;
  final int quantity;
  final double totalAmount;
  final String currency;
  final bool isPaid;
  final String? paymentRef;
  final String status;
  final String approvalStatus;
  final String? qrCode;
  final DateTime? checkedInAt;
  final String? checkedInBy;
  final String? notes;
  final DateTime? createdAt;

  bool get isAttended => status == 'attended' || checkedInAt != null;
  bool get isPending => status == 'pending' || approvalStatus == 'pending';

  String get attendeeName => memberName?.isNotEmpty == true
      ? memberName!
      : externalName?.isNotEmpty == true
          ? externalName!
          : 'Registrant';

  factory Registration.fromJson(Map<String, dynamic> json) {
    return Registration(
      registrationId: (json['registrationId'] ?? json['_id'] ?? '').toString(),
      eventId: (json['eventId'] ?? '').toString(),
      eventTitle: (json['eventTitle'] ?? '').toString(),
      memberId: json['memberId']?.toString(),
      memberName: json['memberName']?.toString(),
      externalName: json['externalName']?.toString(),
      phone: json['phone']?.toString(),
      email: json['email']?.toString(),
      tierId: json['tierId']?.toString(),
      tierName: json['tierName']?.toString(),
      quantity: (json['quantity'] is num)
          ? (json['quantity'] as num).toInt()
          : int.tryParse(json['quantity']?.toString() ?? '') ?? 1,
      totalAmount: (json['totalAmount'] is num)
          ? (json['totalAmount'] as num).toDouble()
          : double.tryParse(json['totalAmount']?.toString() ?? '') ?? 0,
      currency: (json['currency'] ?? 'USD').toString(),
      isPaid: json['isPaid'] == true,
      paymentRef: json['paymentRef']?.toString(),
      status: (json['status'] ?? 'pending').toString(),
      approvalStatus: (json['approvalStatus'] ?? 'pending').toString(),
      qrCode: json['qrCode']?.toString(),
      checkedInAt: json['checkedInAt'] != null
          ? DateTime.tryParse(json['checkedInAt'].toString())
          : null,
      checkedInBy: json['checkedInBy']?.toString(),
      notes: json['notes']?.toString(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'registrationId': registrationId,
      'eventId': eventId,
      'eventTitle': eventTitle,
      'memberId': memberId,
      'memberName': memberName,
      'externalName': externalName,
      'phone': phone,
      'email': email,
      'tierId': tierId,
      'tierName': tierName,
      'quantity': quantity,
      'totalAmount': totalAmount,
      'currency': currency,
      'isPaid': isPaid,
      'paymentRef': paymentRef,
      'status': status,
      'approvalStatus': approvalStatus,
      'qrCode': qrCode,
      'checkedInAt': checkedInAt?.toIso8601String(),
      'checkedInBy': checkedInBy,
      'notes': notes,
      'createdAt': createdAt?.toIso8601String(),
    };
  }
}
