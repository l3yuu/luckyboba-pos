// FILE: lib/cart/order_tracking_page.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:async';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';
import '../cart/payment_instructions_page.dart';
import '../account/order_history_page.dart';

// ── Colors ────────────────────────────────────────────────────────────────────
const Color _purple     = Color(0xFF7C14D4);
const Color _bg         = Color(0xFFFAFAFA);
const Color _surface    = Color(0xFFF2EEF8);
const Color _textDark   = Color(0xFF1A1A2E);
const Color _textMid    = Color(0xFF6B6B8A);
const Color _green      = Color(0xFF16A34A);
const Color _red        = Color(0xFFDC2626);
const Color _deepPurple = Color(0xFF5A0FA0);
const Color _gcashColor = Color(0xFF007DFE);
const Color _mayaColor  = Color(0xFF42B549);

// ── Status config ─────────────────────────────────────────────────────────────
const _statuses = ['pending', 'preparing', 'ready'];

Map<String, dynamic> _statusMeta(String status) {
  switch (status) {
    case 'pending':
      return {
        'label':    'Pending',
        'sublabel': 'Order received',
        'icon':     Icons.hourglass_top_rounded,
        'color':    _purple,
        'bg':       const Color(0xFFF2EEF8),
      };
    case 'preparing':
      return {
        'label':    'Preparing',
        'sublabel': 'Being made',
        'icon':     Icons.local_cafe_rounded,
        'color':    _purple,
        'bg':       _surface,
      };
    case 'ready':
      return {
        'label':    'Ready',
        'sublabel': 'Pick it up!',
        'icon':     Icons.check_circle_rounded,
        'color':    _green,
        'bg':       const Color(0xFFDCFCE7),
      };
    case 'completed':
      return {
        'label':    'Completed',
        'sublabel': 'Done',
        'icon':     Icons.done_all_rounded,
        'color':    _green,
        'bg':       const Color(0xFFDCFCE7),
      };
    case 'cancelled':
      return {
        'label':    'Cancelled',
        'sublabel': 'Order cancelled',
        'icon':     Icons.cancel_rounded,
        'color':    _red,
        'bg':       const Color(0xFFFEE2E2),
      };
    default:
      return {
        'label':    status,
        'sublabel': '',
        'icon':     Icons.help_outline_rounded,
        'color':    _textMid,
        'bg':       Colors.grey.shade100,
      };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
class OrderTrackingPage extends StatefulWidget {
  final String siNumber;
  final String paymentMethod;
  final double amount;
  final List   items;

  const OrderTrackingPage({
    super.key,
    required this.siNumber,
    required this.paymentMethod,
    required this.amount,
    required this.items,
  });

  @override
  State<OrderTrackingPage> createState() => _OrderTrackingPageState();
}

class _OrderTrackingPageState extends State<OrderTrackingPage>
    with TickerProviderStateMixin {
  String  _status      = 'pending';
  bool    _isPaid      = false;
  bool    _isLoading   = true;
  bool    _isCancelling = false;
  String? _error;
  Timer?  _pollTimer;

  late AnimationController _pulseCtrl;
  late Animation<double>   _pulseAnim;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(
      vsync:    this,
      duration: const Duration(seconds: 1),
    )..repeat(reverse: true);
    _pulseAnim = Tween<double>(begin: 0.6, end: 1.0).animate(_pulseCtrl);

    _fetchStatus();
    _pollTimer = Timer.periodic(
      const Duration(seconds: 8),
          (_) => _fetchStatus(),
    );
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _pulseCtrl.dispose();
    super.dispose();
  }

  // ── API: fetch status ─────────────────────────────────────────────────────
  Future<void> _fetchStatus() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('session_token') ?? '';

      final res = await http
          .get(
        Uri.parse('${AppConfig.apiUrl}/my-orders'),
        headers: {
          'Accept':        'application/json',
          'Authorization': 'Bearer $token',
        },
      )
          .timeout(const Duration(seconds: 10));

      if (res.statusCode == 200) {
        final List orders = json.decode(res.body);
        final order = orders.firstWhere(
              (o) =>
          o['invoice_number'] == widget.siNumber ||
              o['si_number']      == widget.siNumber,
          orElse: () => null,
        );

        if (order != null && mounted) {
          setState(() {
            _status    = order['status']        ?? 'pending';
            _isPaid    = order['is_paid']        == true ||
                order['payment_status'] == 'paid';
            _isLoading = false;
            _error     = null;
          });
        } else {
          if (mounted) setState(() => _isLoading = false);
        }
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error     = 'Could not reach server';
        });
      }
    }
  }

  // ── API: cancel order ─────────────────────────────────────────────────────
  Future<void> _cancelOrder() async {
    // Confirm dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Cancel Order?',
            style: GoogleFonts.poppins(
                fontWeight: FontWeight.w700, color: _textDark)),
        content: Text(
          'Are you sure you want to cancel this order? This cannot be undone.',
          style: GoogleFonts.poppins(fontSize: 13, color: _textMid),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text('Keep Order',
                style: GoogleFonts.poppins(
                    color: _purple, fontWeight: FontWeight.w600)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: _red,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
              elevation: 0,
            ),
            child: Text('Yes, Cancel',
                style: GoogleFonts.poppins(
                    color: Colors.white, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isCancelling = true);

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('session_token') ?? '';

      final res = await http
          .patch(
        Uri.parse('${AppConfig.apiUrl}/orders/${widget.siNumber}/cancel'),
        headers: {
          'Accept':        'application/json',
          'Authorization': 'Bearer $token',
          'Content-Type':  'application/json',
        },
        body: jsonEncode({'reason': 'Customer cancelled'}),
      )
          .timeout(const Duration(seconds: 10));

      if (res.statusCode == 200) {
        if (mounted) {
          setState(() {
            _status      = 'cancelled';
            _isCancelling = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Order cancelled.',
                  style: GoogleFonts.poppins(color: Colors.white)),
              backgroundColor: _red,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
          );
        }
      } else {
        final data = json.decode(res.body);
        if (mounted) {
          setState(() => _isCancelling = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                  data['message'] ?? 'Could not cancel order.',
                  style: GoogleFonts.poppins(color: Colors.white)),
              backgroundColor: Colors.orange,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isCancelling = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Network error. Please try again.',
                style: GoogleFonts.poppins(color: Colors.white)),
            backgroundColor: Colors.orange,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    }
  }

  // ── Navigate to payment instructions ─────────────────────────────────────
  void _navigateToPayment(String method) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => PaymentInstructionsPage(
          paymentMethod: method,
          amount:        widget.amount,
          siNumber:      widget.siNumber,
          items:         widget.items,
        ),
      ),
    ).then((_) => _fetchStatus());
  }

  // ── Payment picker bottom sheet ───────────────────────────────────────────
  void _showPaymentPicker() {
    showModalBottomSheet(
      context:            context,
      backgroundColor:    Colors.transparent,
      isScrollControlled: true,
      builder: (_) => Container(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 36),
        decoration: const BoxDecoration(
          color:        Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          mainAxisSize:       MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width:  40,
                height: 4,
                decoration: BoxDecoration(
                  color:        const Color(0xFFE0E0E0),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text('Choose Payment Method',
                style: GoogleFonts.poppins(
                  fontSize:   17,
                  fontWeight: FontWeight.w700,
                  color:      _textDark,
                )),
            const SizedBox(height: 4),
            Text(
              'Select how you want to pay ₱${widget.amount.toStringAsFixed(2)}',
              style: GoogleFonts.poppins(fontSize: 12, color: _textMid),
            ),
            const SizedBox(height: 20),
            _paymentMethodTile(
              label:    'GCash',
              subtitle: '09923247869 · Test',
              color:    _gcashColor,
              icon:     Icons.account_balance_wallet_rounded,
            ),
            const SizedBox(height: 12),
            _paymentMethodTile(
              label:    'Maya',
              subtitle: '093234928171 · Test',
              color:    _mayaColor,
              icon:     Icons.credit_card_rounded,
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  // ── Payment method tile ───────────────────────────────────────────────────
  Widget _paymentMethodTile({
    required String   label,
    required String   subtitle,
    required Color    color,
    required IconData icon,
  }) {
    return GestureDetector(
      onTap: () {
        Navigator.pop(context);
        _navigateToPayment(label);
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color:        color.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(16),
          border:       Border.all(color: color.withValues(alpha: 0.30)),
        ),
        child: Row(
          children: [
            Container(
              width:  48,
              height: 48,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 24, color: color),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: GoogleFonts.poppins(
                        fontSize:   15,
                        fontWeight: FontWeight.w700,
                        color:      _textDark,
                      )),
                  const SizedBox(height: 2),
                  Text(subtitle,
                      style: GoogleFonts.poppins(
                          fontSize: 11, color: _textMid)),
                ],
              ),
            ),
            Container(
              width:  32,
              height: 32,
              decoration: BoxDecoration(
                color:  color.withValues(alpha: 0.10),
                shape:  BoxShape.circle,
              ),
              child: Icon(Icons.chevron_right_rounded,
                  size: 20, color: color),
            ),
          ],
        ),
      ),
    );
  }

  // ── Step index ────────────────────────────────────────────────────────────
  int get _stepIndex {
    final idx = _statuses.indexOf(_status);
    return idx == -1 ? 0 : idx;
  }

  // ── Can cancel: only pending + not paid ───────────────────────────────────
  bool get _canCancel => _status == 'pending' && !_isPaid;

  // ── Build ─────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final meta = _statusMeta(_status);

    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(
        child: Column(
          children: [
            _buildAppBar(),
            Expanded(
              child: _isLoading
                  ? const Center(
                  child: CircularProgressIndicator(color: _purple))
                  : RefreshIndicator(
                onRefresh: _fetchStatus,
                color:     _purple,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (_error != null) _buildErrorBanner(),
                      const SizedBox(height: 8),
                      _buildStatusHero(meta),
                      const SizedBox(height: 24),
                      _buildKanbanStepper(),
                      const SizedBox(height: 24),
                      if (_status == 'pending' && !_isPaid)
                        _buildPayNowCard(),
                      if (_status == 'ready')
                        _buildReadyCard(),
                      if (_canCancel)
                        _buildCancelCard(),
                      const SizedBox(height: 20),
                      _buildOrderSummaryCard(),
                      const SizedBox(height: 20),
                      _buildInfoCard(),
                      const SizedBox(height: 16),
                      _buildViewHistoryButton(),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── App bar ───────────────────────────────────────────────────────────────
  Widget _buildAppBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.popUntil(context, (r) => r.isFirst),
            child: Container(
              width:  40,
              height: 40,
              decoration: const BoxDecoration(
                  color: _surface, shape: BoxShape.circle),
              child: const Icon(Icons.home_rounded,
                  size: 20, color: _purple),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Order Tracker',
                    style: GoogleFonts.poppins(
                      fontSize:   18,
                      fontWeight: FontWeight.w700,
                      color:      _textDark,
                    )),
                FittedBox(
                  fit:       BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Text(widget.siNumber,
                      style: GoogleFonts.poppins(
                          fontSize: 11, color: _textMid)),
                ),
              ],
            ),
          ),
          AnimatedBuilder(
            animation: _pulseAnim,
            builder: (_, _) => Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Opacity(
                  opacity: _pulseAnim.value,
                  child: Container(
                    width:  8,
                    height: 8,
                    decoration: const BoxDecoration(
                        color: _green, shape: BoxShape.circle),
                  ),
                ),
                const SizedBox(width: 5),
                Text('LIVE',
                    style: GoogleFonts.poppins(
                      fontSize:   10,
                      fontWeight: FontWeight.w700,
                      color:      _green,
                    )),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Status hero ───────────────────────────────────────────────────────────
  Widget _buildStatusHero(Map<String, dynamic> meta) {
    return Container(
      width:   double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 20),
      decoration: BoxDecoration(
        color:        meta['bg'] as Color,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: (meta['color'] as Color).withValues(alpha: 0.25),
          width: 1.5,
        ),
      ),
      child: Column(
        children: [
          Container(
            width:  64,
            height: 64,
            decoration: BoxDecoration(
              color: (meta['color'] as Color).withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(meta['icon'] as IconData,
                size: 32, color: meta['color'] as Color),
          ),
          const SizedBox(height: 12),
          Text(meta['label'] as String,
              style: GoogleFonts.poppins(
                fontSize:   22,
                fontWeight: FontWeight.w800,
                color:      meta['color'] as Color,
              )),
          const SizedBox(height: 4),
          Text(meta['sublabel'] as String,
              style: GoogleFonts.poppins(fontSize: 13, color: _textMid)),
          if (_status == 'pending' && !_isPaid) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: 14, vertical: 6),
              decoration: BoxDecoration(
                color:        _purple.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(20),
                border:       Border.all(color: _purple.withValues(alpha: 0.3)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.schedule_rounded,
                      size: 13, color: _purple),
                  const SizedBox(width: 5),
                  Text('Payment pending',
                      style: GoogleFonts.poppins(
                        fontSize:   12,
                        fontWeight: FontWeight.w600,
                        color:      _purple,
                      )),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  // ── Kanban stepper ────────────────────────────────────────────────────────
  Widget _buildKanbanStepper() {
    return Row(
      children: List.generate(_statuses.length * 2 - 1, (i) {
        if (i.isOdd) {
          final passedStep = i ~/ 2;
          final isPassed   = _stepIndex > passedStep;
          return Expanded(
            child: Container(
              height: 3,
              decoration: BoxDecoration(
                color: isPassed ? _purple : const Color(0xFFEAEAF0),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          );
        }

        final stepIdx  = i ~/ 2;
        final status   = _statuses[stepIdx];
        final meta     = _statusMeta(status);
        final isActive = _stepIndex == stepIdx;
        final isDone   = _stepIndex > stepIdx;

        return Expanded(
          flex: 2,
          child: Column(
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 400),
                width:  isActive ? 48 : 40,
                height: isActive ? 48 : 40,
                decoration: BoxDecoration(
                  color: isDone
                      ? _purple
                      : isActive
                      ? (meta['color'] as Color).withValues(alpha: 0.12)
                      : const Color(0xFFEAEAF0),
                  shape: BoxShape.circle,
                  border: isActive
                      ? Border.all(
                      color: meta['color'] as Color, width: 2)
                      : null,
                ),
                child: Icon(
                  isDone ? Icons.check_rounded : meta['icon'] as IconData,
                  size:  isDone ? 20 : isActive ? 22 : 18,
                  color: isDone
                      ? Colors.white
                      : isActive
                      ? meta['color'] as Color
                      : _textMid,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                meta['label'] as String,
                textAlign: TextAlign.center,
                style: GoogleFonts.poppins(
                  fontSize:   10,
                  fontWeight: isActive || isDone
                      ? FontWeight.w700
                      : FontWeight.w400,
                  color: isDone
                      ? _purple
                      : isActive
                      ? meta['color'] as Color
                      : _textMid,
                ),
              ),
            ],
          ),
        );
      }),
    );
  }

  // ── Pay now card ──────────────────────────────────────────────────────────
  Widget _buildPayNowCard() {
    return Container(
      width:   double.infinity,
      padding: const EdgeInsets.all(18),
      margin:  const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            _purple.withValues(alpha: 0.08),
            _purple.withValues(alpha: 0.03),
          ],
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _purple.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width:  38,
                height: 38,
                decoration: BoxDecoration(
                    color: _purple.withValues(alpha: 0.12),
                    shape: BoxShape.circle),
                child: const Icon(Icons.payment_rounded,
                    size: 20, color: _purple),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Complete your payment',
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.w700,
                          fontSize:   14,
                          color:      _textDark,
                        )),
                    Text('Choose GCash or Maya',
                        style: GoogleFonts.poppins(
                            fontSize: 12, color: _textMid)),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Text('₱${widget.amount.toStringAsFixed(2)}',
                  style: GoogleFonts.poppins(
                    fontSize:   16,
                    fontWeight: FontWeight.w800,
                    color:      _purple,
                  )),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => _navigateToPayment('GCash'),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        vertical: 12, horizontal: 10),
                    decoration: BoxDecoration(
                      color:        _gcashColor.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                          color: _gcashColor.withValues(alpha: 0.35)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.account_balance_wallet_rounded,
                            size: 18, color: _gcashColor),
                        const SizedBox(width: 6),
                        Text('GCash',
                            style: GoogleFonts.poppins(
                              fontSize:   13,
                              fontWeight: FontWeight.w700,
                              color:      _gcashColor,
                            )),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: GestureDetector(
                  onTap: () => _navigateToPayment('Maya'),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        vertical: 12, horizontal: 10),
                    decoration: BoxDecoration(
                      color:        _mayaColor.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                          color: _mayaColor.withValues(alpha: 0.35)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.credit_card_rounded,
                            size: 18, color: _mayaColor),
                        const SizedBox(width: 6),
                        Text('Maya',
                            style: GoogleFonts.poppins(
                              fontSize:   13,
                              fontWeight: FontWeight.w700,
                              color:      _mayaColor,
                            )),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _showPaymentPicker,
              icon: const Icon(Icons.payment_rounded,
                  size: 18, color: Colors.white),
              label: Text('Pay Now',
                  style: GoogleFonts.poppins(
                    fontSize:   14,
                    fontWeight: FontWeight.w700,
                    color:      Colors.white,
                  )),
              style: ElevatedButton.styleFrom(
                backgroundColor: _purple,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Cancel card (only when pending + unpaid) ──────────────────────────────
  Widget _buildCancelCard() {
    return Container(
      width:   double.infinity,
      padding: const EdgeInsets.all(16),
      margin:  const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color:        _red.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _red.withValues(alpha: 0.25)),
      ),
      child: Row(
        children: [
          Container(
            width:  40,
            height: 40,
            decoration: BoxDecoration(
              color:  _red.withValues(alpha: 0.10),
              shape:  BoxShape.circle,
            ),
            child: const Icon(Icons.cancel_outlined,
                size: 20, color: _red),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Changed your mind?',
                    style: GoogleFonts.poppins(
                      fontSize:   13,
                      fontWeight: FontWeight.w700,
                      color:      _textDark,
                    )),
                Text('You can cancel while payment is pending.',
                    style: GoogleFonts.poppins(
                        fontSize: 11, color: _textMid)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          _isCancelling
              ? const SizedBox(
            width:  22,
            height: 22,
            child:  CircularProgressIndicator(
                color: _red, strokeWidth: 2),
          )
              : TextButton(
            onPressed: _cancelOrder,
            style: TextButton.styleFrom(
              foregroundColor:  _red,
              backgroundColor:  _red.withValues(alpha: 0.10),
              padding: const EdgeInsets.symmetric(
                  horizontal: 16, vertical: 10),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
            child: Text('Cancel',
                style: GoogleFonts.poppins(
                  fontSize:   13,
                  fontWeight: FontWeight.w700,
                  color:      _red,
                )),
          ),
        ],
      ),
    );
  }

  // ── Ready card ────────────────────────────────────────────────────────────
  Widget _buildReadyCard() {
    return Container(
      width:   double.infinity,
      padding: const EdgeInsets.all(18),
      margin:  const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color:        const Color(0xFFDCFCE7),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _green.withValues(alpha: 0.35)),
      ),
      child: Row(
        children: [
          const Icon(Icons.storefront_rounded, size: 32, color: _green),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Your order is ready!',
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w700,
                      fontSize:   15,
                      color:      _green,
                    )),
                Text('Please pick it up at the counter.',
                    style: GoogleFonts.poppins(
                        fontSize: 12, color: Colors.green.shade700)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Error banner ──────────────────────────────────────────────────────────
  Widget _buildErrorBanner() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color:        const Color(0xFFFEE2E2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const Icon(Icons.wifi_off_rounded, size: 16, color: _red),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              _error ?? 'Connection issue — pull to refresh',
              style: GoogleFonts.poppins(fontSize: 12, color: _red),
            ),
          ),
        ],
      ),
    );
  }

  // ── Order summary card ────────────────────────────────────────────────────
  Widget _buildOrderSummaryCard() {
    return Container(
      decoration: BoxDecoration(
        color:        Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFEAEAF0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
            child: Text('Order Summary',
                style: GoogleFonts.poppins(
                  fontSize:   14,
                  fontWeight: FontWeight.w700,
                  color:      _textDark,
                )),
          ),
          const Divider(height: 1, color: Color(0xFFEAEAF0)),
          ...widget.items.map((item) => Padding(
            padding: const EdgeInsets.symmetric(
                horizontal: 16, vertical: 10),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${item['qty'] ?? item['quantity'] ?? 1}×',
                  style: GoogleFonts.poppins(
                      fontSize: 13, color: _textMid),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    item['name']?.toString() ?? '',
                    style: GoogleFonts.poppins(
                      fontSize:   13,
                      fontWeight: FontWeight.w600,
                      color:      _textDark,
                    ),
                    softWrap: true,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '₱${((item['price'] ?? 0) * (item['qty'] ?? item['quantity'] ?? 1)).toStringAsFixed(2)}',
                  style: GoogleFonts.poppins(
                    fontSize:   13,
                    fontWeight: FontWeight.w700,
                    color:      _deepPurple,
                  ),
                ),
              ],
            ),
          )),
          const Divider(height: 1, color: Color(0xFFEAEAF0)),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Total',
                    style: GoogleFonts.poppins(
                        fontSize: 14, fontWeight: FontWeight.w700)),
                Text(
                  '₱${widget.amount.toStringAsFixed(2)}',
                  style: GoogleFonts.poppins(
                    fontSize:   18,
                    fontWeight: FontWeight.w800,
                    color:      _purple,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Info card ─────────────────────────────────────────────────────────────
  Widget _buildInfoCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color:        _surface,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          const Icon(Icons.info_outline_rounded, size: 18, color: _purple),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'Status updates every 8 seconds. Pull down to refresh manually.',
              style: GoogleFonts.poppins(
                  fontSize: 11, color: _textMid, height: 1.5),
            ),
          ),
        ],
      ),
    );
  }

  // ── View history button ───────────────────────────────────────────────────
  Widget _buildViewHistoryButton() {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const OrderHistoryPage()),
        ),
        icon: const Icon(Icons.history_rounded, size: 18, color: _purple),
        label: Text(
          'View Order History',
          style: GoogleFonts.poppins(
              fontSize: 14, fontWeight: FontWeight.w600, color: _purple),
        ),
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 14),
          side: BorderSide(color: _purple.withValues(alpha: 0.4), width: 1.5),
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14)),
        ),
      ),
    );
  }
}