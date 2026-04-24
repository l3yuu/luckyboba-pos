// FILE: lib/account/order_history_page.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../config/app_config.dart';
import '../cart/order_tracking_page.dart';

class OrderHistoryPage extends StatefulWidget {
  const OrderHistoryPage({super.key});

  @override
  State<OrderHistoryPage> createState() => _OrderHistoryPageState();
}

class _OrderHistoryPageState extends State<OrderHistoryPage> {
  static const Color _purple     = Color(0xFF7C14D4);
  static const Color _deepPurple = Color(0xFF5A0FA0);
  static const Color _bg         = Color(0xFFFAFAFA);
  static const Color _surface    = Color(0xFFF2EEF8);
  static const Color _textDark   = Color(0xFF1A1A2E);
  static const Color _textMid    = Color(0xFF6B6B8A);

  bool          _isLoading = true;
  bool          _hasActiveCard = false;
  List<dynamic> _orders = [];
  String?       _error;

  @override
  void initState() {
    super.initState();
    _checkLoyaltyAndFetch();
  }

  Future<void> _checkLoyaltyAndFetch() async {
    await _loadLoyaltyStatus();
    await _fetchOrders();
  }

  Future<void> _loadLoyaltyStatus() async {
    final prefs = await SharedPreferences.getInstance();
    // Try local first
    bool? localStatus = prefs.getBool('has_active_card');
    if (localStatus != null) {
      if (mounted) setState(() => _hasActiveCard = localStatus);
    }
    
    // Refresh from API
    final int? userId = prefs.getInt('user_id');
    if (userId == null) return;
    try {
      final response = await http
          .get(Uri.parse('${AppConfig.apiUrl}/check-card-status/$userId'))
          .timeout(const Duration(seconds: 8));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final hasCard = data['has_active_card'] == true;
        await prefs.setBool('has_active_card', hasCard);
        if (mounted) setState(() => _hasActiveCard = hasCard);
      }
    } catch (_) {}
  }

  Future<void> _fetchOrders() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('session_token') ?? prefs.getString('token') ?? '';

      final response = await http.get(
        Uri.parse('${AppConfig.apiUrl}/my-orders'),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept':        'application/json',
        },
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          _orders    = (data is List) ? data : (data['data'] ?? data['orders'] ?? []);
          _isLoading = false;
        });
      } else {
        setState(() { _error = 'Could not load orders.'; _isLoading = false; });
      }
    } catch (e) {
      setState(() { _error = 'Connection error. Please try again.'; _isLoading = false; });
    }
  }

  Future<void> _handleReorder(int orderId) async {
    if (!_hasActiveCard) {
      _showLoyaltyRequired();
      return;
    }

    // Show loading dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator(color: _purple)),
    );

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('session_token') ?? prefs.getString('token') ?? '';

      final response = await http.get(
        Uri.parse('${AppConfig.apiUrl}/orders/$orderId/reorder'),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      ).timeout(const Duration(seconds: 15));

      // Close loading dialog
      if (mounted) Navigator.pop(context);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          _showReorderSuccess(data['items'] ?? []);
        } else {
          _showErrorSnackBar(data['message'] ?? 'Re-order failed.');
        }
      } else {
        final data = json.decode(response.body);
        _showErrorSnackBar(data['message'] ?? 'Re-order failed.');
      }
    } catch (e) {
      if (mounted) Navigator.pop(context);
      _showErrorSnackBar('Connection error.');
    }
  }

  void _showLoyaltyRequired() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Loyalty Required', style: GoogleFonts.poppins(fontWeight: FontWeight.w700)),
        content: Text(
          'Re-ordering is a premium feature. Please activate your Lucky Boba Loyalty Card to access this.',
          style: GoogleFonts.poppins(fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Close', style: GoogleFonts.poppins(color: _textMid)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // Navigate to cards or home to see card options
              Navigator.pop(context); 
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: _purple,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: Text('Get Card', style: GoogleFonts.poppins(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showReorderSuccess(List<dynamic> items) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Items added to cart! Go to menu to checkout.'),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
        action: SnackBarAction(
          label: 'GO TO MENU',
          textColor: Colors.white,
          onPressed: () {
             Navigator.of(context).popUntil((route) => route.isFirst);
          },
        ),
      ),
    );
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'completed':  return const Color(0xFF16A34A);
      case 'pending':    return _purple;
      case 'cancelled':  return const Color(0xFFDC2626);
      case 'processing': return _purple;
      case 'preparing':  return _purple;
      case 'ready':      return const Color(0xFF16A34A);
      case 'fulfilled':  return _purple;
      default:           return _textMid;
    }
  }

  Color _statusBg(String status) {
    switch (status.toLowerCase()) {
      case 'completed':  return const Color(0xFF22C55E).withValues(alpha: 0.10);
      case 'pending':    return _purple.withValues(alpha: 0.10);
      case 'cancelled':  return Colors.red.withValues(alpha: 0.10);
      case 'processing': return _purple.withValues(alpha: 0.10);
      case 'preparing':  return _purple.withValues(alpha: 0.10);
      case 'ready':      return const Color(0xFF22C55E).withValues(alpha: 0.10);
      case 'fulfilled':  return _purple.withValues(alpha: 0.10);
      default:           return _surface;
    }
  }

  IconData _statusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'completed':  return Icons.check_circle_rounded;
      case 'pending':    return Icons.hourglass_top_rounded;
      case 'cancelled':  return Icons.cancel_rounded;
      case 'processing': return Icons.local_cafe_rounded;
      case 'preparing':  return Icons.local_cafe_rounded;
      case 'ready':      return Icons.check_circle_rounded;
      case 'fulfilled':  return Icons.local_cafe_rounded;
      default:           return Icons.receipt_rounded;
    }
  }

  bool _isTrackable(String status) =>
      ['pending', 'preparing', 'ready', 'processing'].contains(status.toLowerCase());

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(
        child: Column(
          children: [
            // ── App Bar ──────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      width: 40, height: 40,
                      decoration: const BoxDecoration(
                          color: _surface, shape: BoxShape.circle),
                      child: const Icon(Icons.arrow_back_ios_new_rounded,
                          size: 18, color: _purple),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Order History',
                            style: GoogleFonts.poppins(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: _textDark)),
                        Text(
                          '${_orders.length} order${_orders.length == 1 ? '' : 's'}',
                          style: GoogleFonts.poppins(
                              fontSize: 11, color: _textMid),
                        ),
                      ],
                    ),
                  ),
                  GestureDetector(
                    onTap: _fetchOrders,
                    child: Container(
                      width: 40, height: 40,
                      decoration: const BoxDecoration(
                          color: _surface, shape: BoxShape.circle),
                      child: const Icon(Icons.refresh_rounded,
                          size: 20, color: _purple),
                    ),
                  ),
                ],
              ),
            ),

            // ── Body ─────────────────────────────────────────────────────
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: _purple))
                  : _error != null
                  ? _buildError()
                  : _orders.isEmpty
                  ? _buildEmpty()
                  : RefreshIndicator(
                onRefresh: _fetchOrders,
                color: _purple,
                child: ListView.builder(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 30),
                  itemCount: _orders.length,
                  itemBuilder: (_, i) => _buildOrderCard(_orders[i]),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderCard(dynamic order) {
    final String orderId = order['invoice_number']?.toString() ??
        '#${order['id'] ?? order['order_number'] ?? '—'}';
    final String status  = order['status']?.toString() ?? 'pending';
    final String date    = order['created_at']?.toString().split('T').first ?? '';
    final String branch  = (order['branch_name']?.toString().trim().isNotEmpty == true
        ? order['branch_name']
        : order['store_name']?.toString().trim().isNotEmpty == true
        ? order['store_name']
        : null)
        ?.toString() ?? '';
    final dynamic total  = order['total'] ?? order['total_amount'] ?? 0;
    final List    items  = order['items'] ?? order['order_items'] ?? [];
    final bool trackable = _isTrackable(status);

    return GestureDetector(
      onTap: trackable
          ? () => Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => OrderTrackingPage(
            siNumber:      orderId,
            paymentMethod: order['payment_method']?.toString()
                ?? order['payment_type']?.toString()
                ?? '',
            amount:        double.tryParse(total.toString()) ?? 0.0,
            items:         items,
          ),
        ),
      ).then((_) => _fetchOrders())
          : null,
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: trackable
                ? _purple.withValues(alpha: 0.25)
                : const Color(0xFFEAEAF0),
          ),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 10,
                offset: const Offset(0, 4)),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Header ─────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 42, height: 42,
                    decoration: BoxDecoration(
                        color: _statusBg(status), shape: BoxShape.circle),
                    child: Icon(_statusIcon(status),
                        size: 20, color: _statusColor(status)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(orderId,
                            style: GoogleFonts.poppins(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: _textDark),
                            overflow: TextOverflow.ellipsis),
                        const SizedBox(height: 2),
                        if (branch.isNotEmpty)
                          Row(
                            children: [
                              const Icon(Icons.storefront_rounded,
                                  size: 12, color: _purple),
                              const SizedBox(width: 4),
                              Flexible(
                                child: Text(branch,
                                    style: GoogleFonts.poppins(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                        color: _purple),
                                    overflow: TextOverflow.ellipsis),
                              ),
                            ],
                          ),
                        if (date.isNotEmpty) ...[
                          const SizedBox(height: 2),
                          Text(date,
                              style: GoogleFonts.poppins(
                                  fontSize: 11, color: _textMid)),
                        ],
                      ],
                    ),
                  ),
                  // Right: badge + track hint
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: _statusBg(status),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          status[0].toUpperCase() + status.substring(1),
                          style: GoogleFonts.poppins(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: _statusColor(status)),
                        ),
                      ),
                      if (trackable) ...[
                        const SizedBox(height: 6),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text('Track',
                                style: GoogleFonts.poppins(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w600,
                                    color: _purple)),
                            const Icon(Icons.chevron_right_rounded,
                                size: 14, color: _purple),
                          ],
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),

            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: Divider(height: 1, color: Color(0xFFEAEAF0)),
            ),

            // ── Items (up to 3) ─────────────────────────────────────────
            if (items.isNotEmpty)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
                child: Column(
                  children: items.take(3).map<Widget>((item) {
                    final name  = item['name']?.toString() ??
                        item['product_name']?.toString() ?? 'Item';
                    final qty   = item['qty']?.toString() ??
                        item['quantity']?.toString() ?? '1';
                    final price = item['price'] ?? item['unit_price'] ?? 0;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Container(
                              width: 6, height: 6,
                              decoration: const BoxDecoration(
                                  color: _purple, shape: BoxShape.circle),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text('$qty× $name',
                                style: GoogleFonts.poppins(
                                    fontSize: 12, color: _textDark)),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            '₱${double.tryParse(price.toString())?.toStringAsFixed(0) ?? '0'}',
                            style: GoogleFonts.poppins(
                                fontSize: 12, color: _textMid),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ),

            if (items.length > 3)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 2, 16, 0),
                child: Text('+${items.length - 3} more items',
                    style: GoogleFonts.poppins(
                        fontSize: 11, color: _textMid)),
              ),

            // ── Footer ──────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Total',
                          style: GoogleFonts.poppins(
                              fontSize: 11, color: _textMid)),
                      Text(
                        '₱${double.tryParse(total.toString())?.toStringAsFixed(2) ?? '0.00'}',
                        style: GoogleFonts.poppins(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: _deepPurple),
                      ),
                    ],
                  ),
                  if (status.toLowerCase() == 'completed' || status.toLowerCase() == 'fulfilled')
                    ElevatedButton.icon(
                      onPressed: () => _handleReorder(order['id']),
                      icon: const Icon(Icons.replay_rounded, size: 16, color: Colors.white),
                      label: Text('RE-ORDER', 
                        style: GoogleFonts.poppins(
                          fontSize: 11, 
                          fontWeight: FontWeight.w700,
                          color: Colors.white
                        )),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _hasActiveCard ? _purple : Colors.grey,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 100, height: 100,
            decoration: const BoxDecoration(
                color: _surface, shape: BoxShape.circle),
            child: const Icon(Icons.receipt_long_rounded,
                size: 48, color: _purple),
          ),
          const SizedBox(height: 20),
          Text('No orders yet',
              style: GoogleFonts.poppins(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: _textDark)),
          const SizedBox(height: 8),
          Text('Your order history will appear here',
              style: GoogleFonts.poppins(fontSize: 13, color: _textMid)),
        ],
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.wifi_off_rounded,
              size: 56, color: Color(0xFFCCCCDD)),
          const SizedBox(height: 16),
          Text(_error!,
              style: GoogleFonts.poppins(fontSize: 14, color: _textMid),
              textAlign: TextAlign.center),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _fetchOrders,
            style: ElevatedButton.styleFrom(
              backgroundColor: _purple,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              elevation: 0,
            ),
            child: Text('Try Again',
                style: GoogleFonts.poppins(
                    color: Colors.white, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}