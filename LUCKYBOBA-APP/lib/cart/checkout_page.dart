import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'cart_page.dart';
import '../config/app_config.dart';
import 'order_tracking_page.dart';

class CheckoutPage extends StatefulWidget {
  final String selectedStore;
  const CheckoutPage({super.key, required this.selectedStore});

  @override
  State<CheckoutPage> createState() => _CheckoutPageState();
}

class _CheckoutPageState extends State<CheckoutPage> {
  static const Color _purple   = Color(0xFF7C14D4);
  static const Color _orange   = Color(0xFFFF8C00);
  static const Color _bg       = Color(0xFFFAFAFA);
  static const Color _surface  = Color(0xFFF2EEF8);
  static const Color _textDark = Color(0xFF1A1A2E);
  static const Color _textMid  = Color(0xFF6B6B8A);
  static const Color _green    = Color(0xFF16A34A);

  // ── Perk ID ↔ display name maps (single source of truth) ──────────────────
  static const Map<String, String> _perkIdToName = {
    'buy_1_take_1':   'Buy 1, Get 1 Free',
    '10_percent_off': '10% Off All Items',
  };
  static const Map<String, String> _perkNameToId = {
    'Buy 1, Get 1 Free': 'buy_1_take_1',
    '10% Off All Items': '10_percent_off',
  };

  String  _selectedPayment = 'GCash';
  String  _orderType       = 'Take Out';
  bool    _isProcessing    = false;

  Map<String, dynamic>? _activeCard;
  String?               _selectedPerk; // internal ID: 'buy_1_take_1' or '10_percent_off'
  bool                  _cardLoading = true;

  final List<Map<String, dynamic>> _paymentOptions = [
    {'label': 'GCash', 'icon': Icons.account_balance_wallet_rounded},
    {'label': 'Maya',  'icon': Icons.credit_card_rounded},
  ];

  @override
  void initState() {
    super.initState();
    _fetchActiveCard();
  }

  Future<void> _fetchActiveCard() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('session_token') ?? '';

      int userId = prefs.getInt('user_id') ?? 0;
      if (userId == 0) {
        final strId = prefs.getString('user_id_str') ?? prefs.getString('user_id') ?? '';
        userId = int.tryParse(strId) ?? 0;
      }

      if (userId == 0) {
        if (mounted) setState(() => _cardLoading = false);
        return;
      }

      final res = await http.get(
        Uri.parse('${AppConfig.apiUrl}/check-card-status/$userId'),
        headers: {
          'Accept':        'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 8));

      if (!mounted) return;

      if (res.statusCode == 200) {
        final data = json.decode(res.body);
        if (data['has_active_card'] == true && data['card'] != null) {
          setState(() {
            _activeCard  = Map<String, dynamic>.from(data['card']);
            _cardLoading = false;
          });
          return;
        }
      }
    } catch (e) {
      debugPrint('🃏 Card fetch ERROR: $e');
    }
    if (mounted) setState(() { _activeCard = null; _cardLoading = false; });
  }

  bool get _cartHasClassicMilktea {
    return myCart.any((item) {
      final category = (item['category'] ?? '').toString().toUpperCase().trim();
      return category.contains('CLASSIC MILKTEA') ||
          category.contains('CLASSIC MILK TEA') ||
          category == 'CLASSIC';
    });
  }

  double get _cheapestClassicMilkteaPrice {
    final classicItems = myCart.where((item) {
      final category = (item['category'] ?? '').toString().toUpperCase().trim();
      return category.contains('CLASSIC MILKTEA') ||
          category.contains('CLASSIC MILK TEA') ||
          category == 'CLASSIC';
    }).toList();

    if (classicItems.isEmpty) return 0.0;
    double cheapest = double.maxFinite;
    for (final item in classicItems) {
      final p     = item['unitPrice'];
      final price = p is double ? p : p is int ? p.toDouble() : double.tryParse(p?.toString() ?? '0') ?? 0.0;
      if (price < cheapest) cheapest = price;
    }
    return cheapest == double.maxFinite ? 0.0 : cheapest;
  }

  double get _rawTotal => myCart.fold(0.0, (sum, item) {
    final p = item['totalPrice'];
    if (p is double) return sum + p;
    if (p is int)    return sum + p.toDouble();
    return sum + (double.tryParse(p?.toString() ?? '0') ?? 0.0);
  });

  double get cartTotal {
    if (_selectedPerk == '10_percent_off') return _rawTotal * 0.90;
    if (_selectedPerk == 'buy_1_take_1') {
      return (_rawTotal - _cheapestClassicMilkteaPrice).clamp(0, double.maxFinite);
    }
    return _rawTotal;
  }

  double get _discountAmount => _rawTotal - cartTotal;

  /// Raw list from API — contains display names like 'Buy 1, Get 1 Free'
  List<String> get _claimedPerks {
    if (_activeCard == null) return [];
    final raw = _activeCard!['claimed_promos'];
    if (raw is List) return raw.map((e) => e.toString()).toList();
    return [];
  }

  /// Converts display names → internal IDs for UI comparison
  List<String> get _claimedPerkIds {
    return _claimedPerks
        .map((name) => _perkNameToId[name] ?? name)
        .toList();
  }

  Future<void> _handleCheckout() async {
    if (_isProcessing) return;
    setState(() => _isProcessing = true);

    try {
      final prefs        = await SharedPreferences.getInstance();
      final token        = prefs.getString('session_token') ?? '';
      final customerName = prefs.getString('user_name') ?? 'Guest';
      final customerCode = prefs.getString('user_code') ?? '';
      final userId       = prefs.getInt('user_id') ?? 0;

      final siNumber  = 'APP-${DateTime.now().millisecondsSinceEpoch}';
      final qrPayload = 'luckyboba|order|$siNumber|user_$userId|${DateTime.now().millisecondsSinceEpoch}';

      // Convert internal perk ID → display name for backend
      final String? promoApplied = _selectedPerk != null
          ? _perkIdToName[_selectedPerk!]
          : null;

      final body = jsonEncode({
        'si_number':      siNumber,
        'subtotal':       _rawTotal,
        'total':          cartTotal,
        'discount':       _discountAmount,
        'promo_applied':  promoApplied,   // 'Buy 1, Get 1 Free' or '10% Off All Items'
        'vatable_sales':  cartTotal / 1.12,
        'vat_amount':     cartTotal - (cartTotal / 1.12),
        'payment_method': _selectedPayment.toLowerCase(),
        'order_type':     _orderType.toLowerCase().replaceAll(' ', '_'),
        'branch_name':    widget.selectedStore,
        'cashier_name':   'Mobile Checkout',
        'pax_senior':     0,
        'pax_pwd':        0,
        'cash_tendered':  cartTotal,
        'customer_name':  customerName,
        'customer_code':  customerCode,
        'qr_code':        qrPayload,
        'card_id':        _activeCard?['card_id'] ?? _activeCard?['id'],
        'items': myCart.map((item) => {
          'menu_item_id': item['id'],
          'name':         item['name'],
          'quantity':     item['quantity'],
          'unit_price':   item['unitPrice'],
          'total_price':  item['totalPrice'],
          'category':     item['category'],
          if (item['cupSize']  != null) 'cup_size': item['cupSize'],
          if (item['add_ons'] != null)  'add_ons':  item['add_ons'],
        }).toList(),
      });

      final response = await http.post(
        Uri.parse('${AppConfig.apiUrl}/online-orders'),
        headers: {
          'Content-Type':  'application/json',
          'Accept':        'application/json',
          'Authorization': 'Bearer $token',
        },
        body: body,
      );

      debugPrint('Checkout status: ${response.statusCode}');
      debugPrint('Checkout body:   ${response.body}');

      if (response.statusCode == 201) {
        final data        = json.decode(response.body);
        final confirmedSi = data['si_number'] ?? siNumber;

        // Write display name to SharedPreferences so QrPerkPage sees it
        if (promoApplied != null) {
          final prefs2 = await SharedPreferences.getInstance();
          final today  = DateTime.now().toIso8601String().substring(0, 10);
          await prefs2.setString('qr_used_$promoApplied', today);
        }

        final savedItems = myCart.map((item) => {
          'name':     item['name'],
          'quantity': item['quantity'],
          'price':    item['unitPrice'],
        }).toList();
        final savedTotal  = cartTotal;
        final savedMethod = _selectedPayment;

        myCart.clear();

        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (_) => OrderTrackingPage(
                siNumber:      confirmedSi,
                paymentMethod: savedMethod,
                amount:        savedTotal,
                items:         savedItems,
              ),
            ),
          );
        }

      } else if (response.statusCode == 409) {
        if (mounted) {
          setState(() { _isProcessing = false; _selectedPerk = null; });
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content:         Text('This perk was already used today.',
                style: GoogleFonts.poppins(color: Colors.white)),
            backgroundColor: Colors.orange,
            behavior:        SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ));
        }
        return;

      } else if (response.statusCode == 422) {
        final data = json.decode(response.body);
        if (mounted) {
          setState(() { _isProcessing = false; _selectedPerk = null; });
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text(
              data['message'] ?? 'Buy 1 Take 1 is only valid for Classic Milktea items.',
              style: GoogleFonts.poppins(color: Colors.white),
            ),
            backgroundColor: Colors.red,
            behavior:        SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ));
        }
        return;

      } else {
        final data = json.decode(response.body);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content:         Text(data['message'] ?? 'Checkout failed.'),
            backgroundColor: Colors.red,
          ));
        }
      }
    } catch (e) {
      debugPrint('Checkout error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(
        child: Stack(
          children: [
            Column(
              children: [
                _buildAppBar(context),
                Expanded(
                  child: SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _sectionLabel('Order Summary', subtitle: '${myCart.length} items'),
                        const SizedBox(height: 10),
                        _buildOrderItemsList(),
                        const SizedBox(height: 24),

                        if (_cardLoading) ...[
                          _sectionLabel('Loyalty Card Perk'),
                          const SizedBox(height: 10),
                          _buildPerkLoadingShimmer(),
                          const SizedBox(height: 24),
                        ] else if (_activeCard != null) ...[
                          _sectionLabel('Loyalty Card Perk',
                              subtitle: _activeCard!['card_title']?.toString() ?? ''),
                          const SizedBox(height: 10),
                          _buildPerkSelector(),
                          const SizedBox(height: 24),
                        ],

                        _sectionLabel('Order Type'),
                        const SizedBox(height: 10),
                        _buildOrderTypeToggle(),
                        const SizedBox(height: 24),

                        _sectionLabel('Payment Method'),
                        const SizedBox(height: 10),
                        ..._paymentOptions.map((opt) => _paymentCard(opt['label'], opt['icon'])),
                        const SizedBox(height: 8),
                      ],
                    ),
                  ),
                ),
                _buildBottomPlaceOrderBar(),
              ],
            ),
            if (_isProcessing)
              Container(
                color: Colors.black26,
                child: const Center(child: CircularProgressIndicator(color: _purple)),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildPerkLoadingShimmer() {
    return Container(
      height: 56,
      decoration: BoxDecoration(
        color:        Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFEAEAF0)),
      ),
      child: const Center(
        child: SizedBox(
          width: 22, height: 22,
          child: CircularProgressIndicator(color: _purple, strokeWidth: 2),
        ),
      ),
    );
  }

  Widget _buildPerkSelector() {
    // Use _claimedPerkIds (converted from display names) for UI checks
    final b1t1Claimed   = _claimedPerkIds.contains('buy_1_take_1');
    final b1t1Qualifies = _cartHasClassicMilktea;
    final b1t1Disabled  = b1t1Claimed || !b1t1Qualifies;
    final pct10Claimed  = _claimedPerkIds.contains('10_percent_off');

    if (_selectedPerk == 'buy_1_take_1' && !b1t1Qualifies) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) setState(() => _selectedPerk = null);
      });
    }

    return Container(
      decoration: BoxDecoration(
        color:        Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFEAEAF0)),
      ),
      child: Column(
        children: [
          _perkTile(
            id:       null,
            label:    'No perk',
            sublabel: 'Pay full price',
            icon:     Icons.do_not_disturb_alt_rounded,
          ),
          const Divider(height: 1, color: Color(0xFFEAEAF0)),

          _perkTile(
            id:      'buy_1_take_1',
            label:   'Buy 1 Take 1',
            sublabel: b1t1Claimed
                ? 'Already used today'
                : !b1t1Qualifies
                ? 'Requires a Classic Milktea in your cart'
                : '1 Classic Milktea is free',
            icon:          Icons.coffee_rounded,
            disabled:      b1t1Disabled,
            showTag:       !b1t1Claimed && !b1t1Qualifies,
            tagText:       'Classic Milktea only',
            previewAmount: (!b1t1Disabled && b1t1Qualifies)
                ? '-₱${_cheapestClassicMilkteaPrice.toStringAsFixed(2)}'
                : null,
          ),
          const Divider(height: 1, color: Color(0xFFEAEAF0)),

          _perkTile(
            id:       '10_percent_off',
            label:    '10% Off',
            sublabel: pct10Claimed
                ? 'Already used today'
                : 'Applies to all items in cart',
            icon:          Icons.percent_rounded,
            disabled:      pct10Claimed,
            showTag:       false,
            tagText:       '',
            previewAmount: !pct10Claimed
                ? '-₱${(_rawTotal * 0.10).toStringAsFixed(2)}'
                : null,
          ),
          const Divider(height: 1, color: Color(0xFFEAEAF0)),

          if (_selectedPerk != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color:        const Color(0xFF16A34A).withValues(alpha: 0.05),
                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(16)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.local_offer_rounded, size: 14, color: _green),
                      const SizedBox(width: 6),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Discount applied',
                              style: GoogleFonts.poppins(
                                  fontSize: 13, fontWeight: FontWeight.w600, color: _green)),
                          Text(
                            _selectedPerk == 'buy_1_take_1'
                                ? 'Cheapest Classic Milktea is free'
                                : '10% off on all items',
                            style: GoogleFonts.poppins(
                                fontSize: 10,
                                color: const Color(0xFF16A34A).withValues(alpha: 0.7)),
                          ),
                        ],
                      ),
                    ],
                  ),
                  Text('-₱${_discountAmount.toStringAsFixed(2)}',
                      style: GoogleFonts.poppins(
                          fontSize: 15, fontWeight: FontWeight.w800, color: _green)),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _perkTile({
    required String?  id,
    required String   label,
    required String   sublabel,
    required IconData icon,
    bool    disabled      = false,
    bool    showTag       = false,
    String  tagText       = '',
    String? previewAmount,
  }) {
    final selected = _selectedPerk == id;
    return InkWell(
      onTap:         disabled ? null : () => setState(() => _selectedPerk = id),
      borderRadius:  BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              width: 38, height: 38,
              decoration: BoxDecoration(
                color: disabled
                    ? Colors.grey.shade100
                    : selected ? _purple.withValues(alpha: 0.10) : _surface,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 18,
                  color: disabled ? Colors.grey : selected ? _purple : _textMid),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(label,
                            style: GoogleFonts.poppins(
                              fontSize:   13,
                              fontWeight: FontWeight.w600,
                              color:      disabled ? Colors.grey : _textDark,
                              // Use _claimedPerkIds for strikethrough check
                              decoration: disabled && _claimedPerkIds.contains(id)
                                  ? TextDecoration.lineThrough
                                  : null,
                            )),
                      ),
                      if (showTag && tagText.isNotEmpty) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color:        _orange.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(tagText,
                              style: GoogleFonts.poppins(
                                  fontSize: 9, fontWeight: FontWeight.w700, color: _orange)),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(sublabel,
                      style: GoogleFonts.poppins(
                          fontSize: 11, color: disabled ? Colors.grey : _textMid)),
                ],
              ),
            ),
            if (previewAmount != null && !disabled && !selected) ...[
              const SizedBox(width: 6),
              Text(previewAmount,
                  style: GoogleFonts.poppins(
                      fontSize:   12,
                      fontWeight: FontWeight.w700,
                      color:      const Color(0xFF16A34A).withValues(alpha: 0.8))),
            ],
            const SizedBox(width: 8),
            Icon(
              selected ? Icons.radio_button_checked : Icons.radio_button_off,
              color: disabled ? Colors.grey : selected ? _purple : _textMid,
              size:  20,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAppBar(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              width: 40, height: 40,
              decoration: const BoxDecoration(color: _surface, shape: BoxShape.circle),
              child: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: _purple),
            ),
          ),
          const SizedBox(width: 12),
          Text('Review & Payment',
              style: GoogleFonts.poppins(
                  fontSize: 18, fontWeight: FontWeight.w700, color: _textDark)),
        ],
      ),
    );
  }

  Widget _buildOrderItemsList() {
    return Container(
      decoration: BoxDecoration(
        color:        Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFEAEAF0)),
      ),
      child: ListView.separated(
        shrinkWrap:       true,
        physics:          const NeverScrollableScrollPhysics(),
        itemCount:        myCart.length,
        separatorBuilder: (_, _) => const Divider(height: 1, color: Color(0xFFEAEAF0)),
        itemBuilder:      (_, index) => _itemTile(myCart[index]),
      ),
    );
  }

  Widget _itemTile(dynamic item) {
    return Padding(
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          Expanded(
            child: Text('${item['quantity']}× ${item['name']}',
                style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold)),
          ),
          Text('₱${item['totalPrice']}',
              style: GoogleFonts.poppins(
                  fontSize: 14, fontWeight: FontWeight.w700, color: _orange)),
        ],
      ),
    );
  }

  Widget _buildOrderTypeToggle() {
    return Row(
      children: [
        Expanded(child: _orderTypeCard('Dine In',  Icons.storefront_rounded)),
        const SizedBox(width: 12),
        Expanded(child: _orderTypeCard('Take Out', Icons.shopping_bag_rounded)),
      ],
    );
  }

  Widget _orderTypeCard(String title, IconData icon) {
    final bool selected = _orderType == title;
    return GestureDetector(
      onTap: () => setState(() => _orderType = title),
      child: AnimatedContainer(
        duration:  const Duration(milliseconds: 200),
        padding:   const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color:        selected ? _purple : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: selected ? _purple : const Color(0xFFEAEAF0)),
        ),
        child: Column(
          children: [
            Icon(icon, color: selected ? Colors.white : _textMid),
            const SizedBox(height: 8),
            Text(title,
                style: TextStyle(
                    color:      selected ? Colors.white : _textMid,
                    fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }

  Widget _paymentCard(String label, IconData icon) {
    final bool selected = _selectedPayment == label;
    return GestureDetector(
      onTap: () => setState(() => _selectedPayment = label),
      child: Container(
        margin:  const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color:        selected ? _purple.withValues(alpha: 0.05) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: selected ? _purple : const Color(0xFFEAEAF0)),
        ),
        child: Row(
          children: [
            Icon(icon, color: selected ? _purple : _textMid),
            const SizedBox(width: 14),
            Expanded(
              child: Text(label,
                  style: TextStyle(
                      fontWeight: selected ? FontWeight.bold : FontWeight.normal)),
            ),
            Icon(
              selected ? Icons.radio_button_checked : Icons.radio_button_off,
              color: selected ? _purple : Colors.grey,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomPlaceOrderBar() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color:        Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10)
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (_selectedPerk != null) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Original',
                    style: GoogleFonts.poppins(fontSize: 12, color: _textMid)),
                Text('₱${_rawTotal.toStringAsFixed(2)}',
                    style: GoogleFonts.poppins(
                        fontSize:   12,
                        color:      _textMid,
                        decoration: TextDecoration.lineThrough)),
              ],
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  _selectedPerk == 'buy_1_take_1' ? 'B1T1 discount' : '10% discount',
                  style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF16A34A)),
                ),
                Text('-₱${_discountAmount.toStringAsFixed(2)}',
                    style: GoogleFonts.poppins(
                        fontSize:   12,
                        fontWeight: FontWeight.w700,
                        color:      const Color(0xFF16A34A))),
              ],
            ),
            const SizedBox(height: 6),
          ],
          Row(
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize:       MainAxisSize.min,
                children: [
                  const Text('Total', style: TextStyle(fontSize: 12, color: _textMid)),
                  Text('₱${cartTotal.toStringAsFixed(2)}',
                      style: GoogleFonts.poppins(
                          fontSize:   22,
                          fontWeight: FontWeight.w800,
                          color:      _purple)),
                ],
              ),
              const SizedBox(width: 16),
              Expanded(
                child: ElevatedButton(
                  onPressed: (myCart.isEmpty || _isProcessing) ? null : _handleCheckout,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _purple,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text('Place Order',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _sectionLabel(String label, {String? subtitle}) {
    return Row(
      children: [
        Text(label,
            style: GoogleFonts.poppins(
                fontSize: 16, fontWeight: FontWeight.w700, color: _textDark)),
        if (subtitle != null && subtitle.isNotEmpty) ...[
          const SizedBox(width: 8),
          Text(subtitle, style: GoogleFonts.poppins(fontSize: 12, color: _textMid)),
        ],
      ],
    );
  }
}