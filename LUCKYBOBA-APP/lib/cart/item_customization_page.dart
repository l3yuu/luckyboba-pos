import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:cached_network_image/cached_network_image.dart';
import 'cart_page.dart';
import '../config/app_config.dart'; // Make sure this path is correct for your app!

class ItemCustomizationPage extends StatefulWidget {
  final Map<String, dynamic> item;
  final String selectedStore;
  const ItemCustomizationPage({
    super.key,
    required this.item,
    required this.selectedStore,
  });

  @override
  State<ItemCustomizationPage> createState() => _ItemCustomizationPageState();
}

class _ItemCustomizationPageState extends State<ItemCustomizationPage> {
  // ── Brand tokens ─────────────────────────────────────────────────────────
  static const Color _purple   = Color(0xFF7C14D4);
  static const Color _orange   = Color(0xFFFF8C00);
  static const Color _bg       = Color(0xFFFAFAFA);
  static const Color _surface  = Color(0xFFF2EEF8);
  static const Color _textDark = Color(0xFF1A1A2E);
  static const Color _textMid  = Color(0xFF6B6B8A);

  // ── Food categories ───────────────────────────────────────────────────────
  static const Set<String> _foodCategories = {
    'CHICKEN WINGS',
    'ALA CARTE SNACKS',
    'ALL DAY MEALS',
    'COMBO MEALS',
    'AFFORDA-BOWLS',
    'WAFFLE',
    'LUCKY CLASSIC JR',
    'CARD',
  };

  // ── Wing sauce options (Kept static since they are free flavors) ────────
  static const Map<String, double> _wingSauces = {
    'Buffalo':         0.00,
    'Garlic Parmesan': 0.00,
    'Sweet Chili':     0.00,
    'Teriyaki':        0.00,
    'Soy Garlic':      0.00,
    'Salted Egg':      0.00,
  };

  // ── Dynamic API Data State ──────────────────────────────────────────────
  Map<String, double> _dynamicDrinkAddOns = {};
  Map<String, double> _dynamicFoodAddOns = {};
  bool _isLoadingAddOns = true;

  late List<Map<String, dynamic>> _variants;
  late int _selectedVariantIndex;
  int _quantity = 1;
  final List<String> _selectedAddOns = [];

  @override
  void initState() {
    super.initState();
    final raw = widget.item['variants'];
    if (raw != null && raw is List && raw.isNotEmpty) {
      _variants = raw
          .map<Map<String, dynamic>>((v) => Map<String, dynamic>.from(v as Map))
          .toList();
    } else {
      _variants = [Map<String, dynamic>.from(widget.item)];
    }
    _selectedVariantIndex = 0;

    // Fetch add-ons from database on load
    _fetchAddOns();
  }

  // ── Fetch Add-Ons from API ──────────────────────────────────────────────
  Future<void> _fetchAddOns() async {
    try {
      final url = '${AppConfig.apiUrl}/add-ons';
      debugPrint('🌐 Fetching add-ons from: $url'); // <-- Look for this in your console

      final response = await http.get(Uri.parse(url));

      debugPrint('🌐 Response Status: ${response.statusCode}');
      debugPrint('🌐 Response Body: ${response.body}');

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        final Map<String, double> drinks = {};
        final Map<String, double> foods = {};

        for (var item in data) {
          final name = item['name'].toString();
          final price = double.tryParse(item['price'].toString()) ?? 0.0;
          final category = item['category'].toString().toLowerCase();

          if (category == 'drink') {
            drinks[name] = price;
          } else if (category == 'food' || category == 'waffle') { // Added waffle support!
            foods[name] = price;
          }
        }

        if (mounted) {
          setState(() {
            _dynamicDrinkAddOns = drinks;
            _dynamicFoodAddOns = foods;
            _isLoadingAddOns = false;
          });
        }
      } else {
        debugPrint('❌ Failed to load add-ons. Server returned: ${response.statusCode}');
        if (mounted) setState(() => _isLoadingAddOns = false);
      }
    } catch (e) {
      debugPrint('❌ Error fetching add-ons: $e');
      if (mounted) setState(() => _isLoadingAddOns = false);
    }
  }

  // ── Computed props ────────────────────────────────────────────────────────
  Map<String, dynamic> get _selectedVariant => _variants[_selectedVariantIndex];

  String get _category => (widget.item['category'] ?? '').toString().toUpperCase().trim();

  bool get _isFood  => _foodCategories.contains(_category);
  bool get _isWings => _category == 'CHICKEN WINGS';

  // Determine which dynamic map to pull from based on the item category
  Map<String, double> get _activeAddOns => _isFood ? _dynamicFoodAddOns : _dynamicDrinkAddOns;

  double get _basePrice {
    final raw = _selectedVariant['price'];
    double price = 0.0;
    if (raw is double) { price = raw; }
    else if (raw is int) { price = raw.toDouble(); }
    else if (raw != null) { price = double.tryParse(raw.toString()) ?? 0.0; }

    if (price == 0.0) {
      final fallback = widget.item['price'];
      if (fallback is double) return fallback;
      if (fallback is int)    return fallback.toDouble();
      if (fallback != null) {
        return double.tryParse(fallback.toString()) ?? 0.0;
      }
    }
    return price;
  }

  double _parsePrice(dynamic raw) {
    if (raw == null)     return 0.0;
    if (raw is double)   return raw;
    if (raw is int)      return raw.toDouble();
    return double.tryParse(raw.toString()) ?? 0.0;
  }

  double get _addOnsTotal => _selectedAddOns.fold(0.0, (sum, name) {
    return sum + (_dynamicDrinkAddOns[name] ?? _dynamicFoodAddOns[name] ?? _wingSauces[name] ?? 0.0);
  });

  double get _unitPrice  => _basePrice + _addOnsTotal;
  double get _totalPrice => _unitPrice * _quantity;

  String _sizeLabel(Map<String, dynamic> v) {
    final sizeName = v['size_name']?.toString().trim() ?? '';
    if (sizeName.isNotEmpty && sizeName != 'null') return _expandSizeCode(sizeName);

    final size = v['size']?.toString().trim() ?? '';
    if (size.isNotEmpty && size != 'null' && size != 'none') return _expandSizeCode(size);

    final cupSize = v['cup_size']?.toString().trim() ?? '';
    if (cupSize.isNotEmpty && cupSize != 'null') return _expandSizeCode(cupSize);

    final barcode = v['barcode']?.toString().trim() ?? '';
    if (barcode.isNotEmpty) {
      final sizeFromSku = _parseSizeFromSku(barcode);
      if (sizeFromSku != null) return sizeFromSku;
    }

    return 'Regular';
  }

  String _expandSizeCode(String raw) {
    switch (raw.toUpperCase()) {
      case 'S':   return 'Small';
      case 'M':   return 'Medium';
      case 'L':   return 'Large';
      case 'XL':  return 'Extra Large';
      case 'XXL': return 'Double Extra Large';
      default:    return raw[0].toUpperCase() + raw.substring(1);
    }
  }

  String? _parseSizeFromSku(String sku) {
    final prefix = sku.replaceAll(RegExp(r'\d+$'), '').toUpperCase();
    if (prefix.isEmpty) return null;

    final lastChar = prefix[prefix.length - 1];
    switch (lastChar) {
      case 'S': return 'Small';
      case 'M': return 'Medium';
      case 'L': return 'Large';
      default:  return null;
    }
  }

  // ── Add to cart ───────────────────────────────────────────────────────────
  void _addToCart() {
    final cartItem = {
      'name':       widget.item['name'],
      'image':      widget.item['image'],
      'category':   widget.item['category'],
      'barcode':    _selectedVariant['barcode'],
      'size':       _sizeLabel(_selectedVariant),
      'size_raw':   _selectedVariant['size'],
      'add_ons':    List<String>.from(_selectedAddOns),
      'quantity':   _quantity,
      'unitPrice':  _unitPrice,
      'totalPrice': _totalPrice,
    };

    myCart.add(cartItem);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          '$_quantity× ${widget.item['name']} (${_sizeLabel(_selectedVariant)}) added!',
          style: const TextStyle(color: Colors.white),
        ),
        backgroundColor:  _purple,
        behavior:         SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        duration: const Duration(seconds: 2),
      ),
    );

    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final String  itemName  = widget.item['name'] ?? 'Item';
    final String? imageUrl  = widget.item['image']?.toString();
    final bool    hasSizes  = _variants.length > 1;

    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(
        child: Column(
          children: [
            // ── HEADER ───────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 12, 16, 4),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20, color: _textDark),
                    onPressed: () => Navigator.pop(context),
                  ),
                  Expanded(
                    child: Text(
                      itemName,
                      style: GoogleFonts.poppins(
                        fontSize:   16,
                        fontWeight: FontWeight.w700,
                        color:      _textDark,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  GestureDetector(
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => CartPage(selectedStore: widget.selectedStore))),
                    child: Stack(
                      children: [
                        Container(
                          width:  40,
                          height: 40,
                          decoration: const BoxDecoration(color: _surface, shape: BoxShape.circle),
                          child: const Icon(Icons.shopping_basket_outlined, size: 20, color: _purple),
                        ),
                        if (myCart.isNotEmpty)
                          Positioned(
                            top:   0,
                            right: 0,
                            child: Container(
                              width:  16,
                              height: 16,
                              decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                              child: Center(
                                child: Text(
                                  '${myCart.length}',
                                  style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w700),
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // ── SCROLLABLE BODY ──────────────────────────────────────────
            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ── HERO IMAGE ──────────────────────────────────────
                    Container(
                      width:  double.infinity,
                      height: 240,
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        border: Border(bottom: BorderSide(color: Color(0xFFEAEAF0), width: 1)),
                      ),
                      child: imageUrl != null && imageUrl.isNotEmpty
                          ? CachedNetworkImage(
                              imageUrl: imageUrl,
                              fit: BoxFit.contain,
                              placeholder: (context, url) => _placeholder(),
                              errorWidget: (context, url, error) => _placeholder(),
                            )
                          : _placeholder(),
                    ),

                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // ── NAME & PRICE ──────────────────────────────
                          Text(
                            itemName,
                            style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.w800, color: _textDark, height: 1.2),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Text(
                                '₱${_basePrice.toStringAsFixed(0)}',
                                style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.w800, color: _orange),
                              ),
                              if (_selectedVariant['barcode'] != null) ...[
                                const SizedBox(width: 10),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(color: _surface, borderRadius: BorderRadius.circular(6)),
                                  child: Text(
                                    'SKU: ${_selectedVariant['barcode']}',
                                    style: GoogleFonts.poppins(fontSize: 10, color: _textMid),
                                  ),
                                ),
                              ],
                            ],
                          ),

                          // ── CATEGORY BADGE ────────────────────────────
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: _isFood ? Colors.orange.withValues(alpha: 0.12) : _purple.withValues(alpha: 0.10),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  _isFood ? Icons.restaurant_rounded : Icons.local_cafe_rounded,
                                  size:  13,
                                  color: _isFood ? Colors.orange[700] : _purple,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  _isFood ? 'Food Item' : 'Drink',
                                  style: GoogleFonts.poppins(
                                    fontSize:   11,
                                    fontWeight: FontWeight.w600,
                                    color: _isFood ? Colors.orange[700] : _purple,
                                  ),
                                ),
                              ],
                            ),
                          ),

                          const Divider(height: 32, thickness: 1, color: Color(0xFFEAEAF0)),

                          // ── SIZE SELECTOR ─────────────────────────────
                          if (hasSizes) ...[
                            _sectionLabel(_isWings ? 'Piece Count' : 'Size', required: true),
                            const SizedBox(height: 10),
                            ..._variants.asMap().entries.map((e) {
                              final idx     = e.key;
                              final variant = e.value;
                              final label   = _sizeLabel(variant);
                              final price   = _parsePrice(variant['price']);
                              final baseP   = _parsePrice(_variants[0]['price']);
                              final diff  = price - baseP;
                              final bool sel = idx == _selectedVariantIndex;

                              return GestureDetector(
                                onTap: () => setState(() => _selectedVariantIndex = idx),
                                child: Container(
                                  margin: const EdgeInsets.only(bottom: 8),
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                  decoration: BoxDecoration(
                                    color: sel ? _purple.withValues(alpha: 0.08) : Colors.white,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: sel ? _purple : const Color(0xFFEAEAF0), width: sel ? 1.5 : 1),
                                  ),
                                  child: Row(
                                    children: [
                                      Icon(
                                        sel ? Icons.radio_button_checked : Icons.radio_button_off,
                                        color: sel ? _purple : Colors.grey,
                                        size:  20,
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(label, style: GoogleFonts.poppins(fontSize: 14, fontWeight: sel ? FontWeight.w700 : FontWeight.normal, color: sel ? _purple : _textDark)),
                                            if (variant['barcode'] != null) Text('SKU: ${variant['barcode']}', style: GoogleFonts.poppins(fontSize: 10, color: _textMid)),
                                          ],
                                        ),
                                      ),
                                      Text(
                                        idx == 0 ? '₱${price.toStringAsFixed(0)}' : '+₱${diff.toStringAsFixed(0)}',
                                        style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w700, color: sel ? _orange : _textMid),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            }),
                            const Divider(height: 32, thickness: 1, color: Color(0xFFEAEAF0)),
                          ],

                          // ── QUANTITY ──────────────────────────────────
                          _sectionLabel('Quantity'),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              _qtyBtn(Icons.remove, () { if (_quantity > 1) setState(() => _quantity--); }),
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 22),
                                child: Text('$_quantity', style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.w800, color: _textDark)),
                              ),
                              _qtyBtn(Icons.add, () => setState(() => _quantity++)),
                            ],
                          ),

                          const Divider(height: 32, thickness: 1, color: Color(0xFFEAEAF0)),

                          // ── ADD-ONS ───────────────────────────────────
                          _sectionLabel(_isFood ? 'Add-ons' : 'Toppings', subtitle: 'Optional'),
                          const SizedBox(height: 10),

                          if (_isWings) ...[
                            Container(
                              padding: const EdgeInsets.all(10),
                              margin:  const EdgeInsets.only(bottom: 12),
                              decoration: BoxDecoration(
                                color: Colors.orange.withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: Colors.orange.withValues(alpha: 0.3)),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.info_outline_rounded, size: 16, color: Colors.orange),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'Sauce flavor is based on the item selected from the menu.',
                                      style: GoogleFonts.poppins(fontSize: 11, color: Colors.orange[800]),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],

                          // Show loading indicator or the actual add-ons
                          if (_isLoadingAddOns)
                            const Center(
                              child: Padding(
                                padding: EdgeInsets.all(20.0),
                                child: CircularProgressIndicator(color: _purple),
                              ),
                            )
                          else if (_activeAddOns.isEmpty && !_isWings)
                            const Padding(
                              padding: EdgeInsets.symmetric(vertical: 10),
                              child: Text('No add-ons available for this item.', style: TextStyle(color: Colors.grey, fontStyle: FontStyle.italic)),
                            )
                          else
                            ..._activeAddOns.entries.map((e) => _buildAddOnTile(e.key, e.value)),

                          const SizedBox(height: 30),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // ── BOTTOM BAR ───────────────────────────────────────────────
            Container(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.07), blurRadius: 16, offset: const Offset(0, -4))],
              ),
              child: Row(
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('Total', style: GoogleFonts.poppins(fontSize: 12, color: _textMid)),
                      Text('₱${_totalPrice.toStringAsFixed(2)}', style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.w800, color: _purple)),
                    ],
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _addToCart,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _purple,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        elevation: 0,
                      ),
                      child: Text('Add to Cart', style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Helper widgets ────────────────────────────────────────────────────────

  Widget _sectionLabel(String label, {bool required = false, String? subtitle}) {
    return Row(
      children: [
        Text(label, style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700, color: _textDark)),
        if (required) ...[
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
            decoration: BoxDecoration(color: _purple.withValues(alpha: 0.10), borderRadius: BorderRadius.circular(4)),
            child: Text('Required', style: GoogleFonts.poppins(fontSize: 10, color: _purple, fontWeight: FontWeight.w600)),
          ),
        ],
        if (subtitle != null) ...[
          const SizedBox(width: 8),
          Text(subtitle, style: GoogleFonts.poppins(fontSize: 12, color: _textMid)),
        ],
      ],
    );
  }

  Widget _buildAddOnTile(String name, double price) {
    final bool selected = _selectedAddOns.contains(name);
    return GestureDetector(
      onTap: () => setState(() {
        selected ? _selectedAddOns.remove(name) : _selectedAddOns.add(name);
      }),
      child: Container(
        margin:  const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: selected ? _purple.withValues(alpha: 0.08) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: selected ? _purple : const Color(0xFFEAEAF0), width: selected ? 1.5 : 1),
        ),
        child: Row(
          children: [
            Icon(
              selected ? Icons.check_box_rounded : Icons.check_box_outline_blank_rounded,
              color: selected ? _purple : Colors.grey,
              size:  22,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                name,
                style: GoogleFonts.poppins(fontSize: 14, fontWeight: selected ? FontWeight.w600 : FontWeight.normal, color: selected ? _purple : _textDark),
              ),
            ),
            Text(
              price == 0 ? 'Free' : '+₱${price.toStringAsFixed(0)}',
              style: GoogleFonts.poppins(fontSize: 13, color: selected ? _orange : _textMid, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }

  Widget _qtyBtn(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width:  38,
        height: 38,
        decoration: BoxDecoration(border: Border.all(color: const Color(0xFFDDD8F0)), borderRadius: BorderRadius.circular(10), color: _surface),
        child: Icon(icon, size: 18, color: _purple),
      ),
    );
  }

  Widget _placeholder() {
    return Center(child: Icon(_isFood ? Icons.restaurant_rounded : Icons.local_cafe_rounded, color: _purple, size: 56));
  }
}