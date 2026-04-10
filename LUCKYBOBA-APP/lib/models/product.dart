class BobaProduct {
  final int id;
  final String name;
  final String category;
  final double price;
  final int quantity;
  final String? barcode;

  BobaProduct({
    required this.id,
    required this.name,
    required this.category,
    required this.price,
    required this.quantity,
    this.barcode,
  });

  factory BobaProduct.fromJson(Map<String, dynamic> json) {
    return BobaProduct(
      id: json['id'],
      name: json['name'] ?? 'Unknown Item',
      category: json['category'] ?? 'General',
      // Convert string "30.00" to double
      price: double.tryParse(json['sellingPrice'].toString()) ?? 0.0,
      quantity: int.tryParse(json['quantity'].toString()) ?? 0,
      barcode: json['barcode'],
    );
  }
}