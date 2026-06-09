class TicketTier {
  const TicketTier({
    required this.tierId,
    required this.name,
    required this.price,
    required this.currency,
    required this.quantity,
    required this.sold,
    this.description,
  });

  final String tierId;
  final String name;
  final double price;
  final String currency;
  final int quantity;
  final int sold;
  final String? description;

  int get remaining => (quantity - sold).clamp(0, quantity);

  factory TicketTier.fromJson(Map<String, dynamic> json) {
    return TicketTier(
      tierId: (json['tierId'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      price: (json['price'] is num)
          ? (json['price'] as num).toDouble()
          : double.tryParse(json['price']?.toString() ?? '') ?? 0,
      currency: (json['currency'] ?? 'USD').toString(),
      quantity: (json['quantity'] is num)
          ? (json['quantity'] as num).toInt()
          : int.tryParse(json['quantity']?.toString() ?? '') ?? 0,
      sold: (json['sold'] is num)
          ? (json['sold'] as num).toInt()
          : int.tryParse(json['sold']?.toString() ?? '') ?? 0,
      description: json['description']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'tierId': tierId,
      'name': name,
      'price': price,
      'currency': currency,
      'quantity': quantity,
      'sold': sold,
      'description': description,
    };
  }
}
