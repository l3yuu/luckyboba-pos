// FILE: lib/pages/card_purchase_page.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';
import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;
import 'package:shared_preferences/shared_preferences.dart';
import 'qr_perk_page.dart';
import '../config/app_config.dart';

class CardPurchasePage extends StatefulWidget {
  final int    cardId;
  final String cardTitle;
  final String cardImageUrl;   // full network URL from API
  final String cardPrice;
  final bool   isOwned;

  const CardPurchasePage({
    super.key,
    required this.cardId,
    required this.cardTitle,
    required this.cardImageUrl,
    required this.cardPrice,
    this.isOwned = false,
  });

  @override
  State<CardPurchasePage> createState() => _CardPurchasePageState();
}

class _CardPurchasePageState extends State<CardPurchasePage>
    with SingleTickerProviderStateMixin {
  static const Color _purple    = Color(0xFF7C14D4);
  static const Color _bg        = Color(0xFFFAFAFA);
  static const Color _surface   = Color(0xFFF2EEF8);
  static const Color _textDark  = Color(0xFF1A1A2E);
  static const Color _textMid   = Color(0xFF6B6B8A);
  static const Color _yellow    = Color(0xFFFFD54F);
  static const Color _gcashBlue = Color(0xFF0070BA);
  static const Color _mayaGreen = Color(0xFF00B576);

  late bool _isCurrentlyOwned;
  late AnimationController _flipController;
  late Animation<double>   _flipAnimation;
  bool _isFlipped     = false;
  bool _loadingExpiry = false;
  bool _loadingPaymentSettings = false;

  String? _expiresAtFormatted;
  int?    _daysRemaining;

  // ── Payment settings from API ─────────────────────────────────────────────
  String? _gcashQrUrl;
  String? _mayaQrUrl;
  String  _gcashNumber  = '';
  String  _mayaNumber   = '';
  String  _accountName  = 'Lucky Boba Store';

  @override
  void initState() {
    super.initState();
    _isCurrentlyOwned = widget.isOwned;
    _flipController = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 600));
    _flipAnimation = Tween<double>(begin: 0, end: 1).animate(
        CurvedAnimation(parent: _flipController, curve: Curves.easeInOut));

    _syncOwnedStatusFromPrefs();
    _fetchPaymentSettings();
  }

  // ── FIX: Read userId from int OR string pref (handles Google/Facebook logins)
  Future<int?> _getUserId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt('user_id')
        ?? int.tryParse(prefs.getString('user_id_str') ?? '');
  }

  Future<void> _syncOwnedStatusFromPrefs() async {
    final prefs          = await SharedPreferences.getInstance();
    final bool fromPrefs = prefs.getBool('has_active_card') ?? false;
    if (fromPrefs && !_isCurrentlyOwned) {
      if (mounted) setState(() => _isCurrentlyOwned = true);
    }
    if (_isCurrentlyOwned) _loadExpiryInfo();
  }

  // ── Fetch QR image URLs + account numbers from API ────────────────────────
  Future<void> _fetchPaymentSettings() async {
    if (mounted) setState(() => _loadingPaymentSettings = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final int? selectedBranchId = prefs.getInt('selected_branch_id');
      
      String url = '${AppConfig.apiUrl}/payment-settings';
      if (selectedBranchId != null) {
        url += '?branch_id=$selectedBranchId';
      }

      final response = await http.get(
        Uri.parse(url),
      ).timeout(const Duration(seconds: 8));
      
      if (!mounted) return;
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          // Prioritize global admin settings specifically for card purchases
          _gcashQrUrl   = (data['admin_card_gcash_qr_url'] ?? data['gcash_qr_url']) as String?;
          _mayaQrUrl    = data['maya_qr_url']     as String?;
          _gcashNumber  = (data['admin_card_phone']?.toString().isNotEmpty == true 
                            ? data['admin_card_phone'] 
                            : data['gcash_number']) as String? ?? '';
          _mayaNumber   = data['maya_number']     as String? ?? '';
          _accountName  = (data['admin_card_phone']?.toString().isNotEmpty == true 
                            ? 'Admin Account' 
                            : data['account_name']) as String? ?? 'Lucky Boba Store';
        });
      }
    } catch (e) {
      debugPrint('Payment settings error: $e');
    } finally {
      if (mounted) setState(() => _loadingPaymentSettings = false);
    }
  }

  @override
  void dispose() {
    _flipController.dispose();
    super.dispose();
  }

  Future<void> _loadExpiryInfo() async {
    setState(() => _loadingExpiry = true);
    try {
      // FIX: Use _getUserId() to handle both int and string stored IDs
      final int? userId = await _getUserId();
      if (userId == null) return;

      final response = await http.get(
        Uri.parse('${AppConfig.apiUrl}/check-card-status/$userId'),
      ).timeout(const Duration(seconds: 8));
      if (!mounted) return;
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['has_active_card'] == true) {
          setState(() {
            _expiresAtFormatted = data['expires_at_formatted'];
            _daysRemaining      = data['days_remaining'] is int
                ? data['days_remaining']
                : int.tryParse(data['days_remaining'].toString());
          });
        }
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loadingExpiry = false);
    }
  }

  void _toggleFlip() {
    if (!mounted) return;
    setState(() => _isFlipped = !_isFlipped);
    _isFlipped ? _flipController.forward() : _flipController.reverse();
  }

  Future<void> _openGCash() async {
    final Uri deepLink  = Uri.parse('gcash://');
    final Uri playStore = Uri.parse('https://play.google.com/store/apps/details?id=com.globe.gcash.android');
    await launchUrl(await canLaunchUrl(deepLink) ? deepLink : playStore,
        mode: LaunchMode.externalApplication);
  }

  Future<void> _openMaya() async {
    final Uri deepLink  = Uri.parse('maya://');
    final Uri playStore = Uri.parse('https://play.google.com/store/apps/details?id=ph.maya.app');
    await launchUrl(await canLaunchUrl(deepLink) ? deepLink : playStore,
        mode: LaunchMode.externalApplication);
  }

  // ── Submit payment with reference number — creates a PENDING request ──────
  Future<void> _submitPaymentRequest(String paymentMethod, String referenceNumber) async {
    Navigator.pop(context); // close QR sheet

    // FIX: Use _getUserId() to handle both int and string stored IDs
    final int? userId = await _getUserId();
    if (userId == null) {
      _showSnack('Session expired. Please log in again.', Colors.redAccent);
      return;
    }

    if (!mounted) return;
    showDialog(
      context: context, barrierDismissible: false,
      builder: (_) => const Center(
          child: CircularProgressIndicator(color: Color(0xFF7C14D4))),
    );

    try {
      final response = await http.post(
        Uri.parse('${AppConfig.apiUrl}/purchase-card'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'user_id':          userId,
          'card_id':          widget.cardId,
          'payment_method':   paymentMethod,
          'reference_number': referenceNumber,
          'status':           'pending',   // admin must approve
        }),
      ).timeout(const Duration(seconds: 10));

      if (!mounted) return;
      Navigator.pop(context); // close loading

      if (response.statusCode == 200 || response.statusCode == 201) {
        _showPendingConfirmationDialog(referenceNumber);
      } else if (response.statusCode == 400) {
        final data = jsonDecode(response.body);
        throw Exception(data['message']);
      } else {
        throw Exception('Server error. Status: ${response.statusCode}');
      }
    } catch (e) {
      if (!mounted) return;
      Navigator.pop(context);
      _showSnack('Error: $e', Colors.redAccent);
    }
  }

  void _showPendingConfirmationDialog(String refNumber) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => Dialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(
              width: 72, height: 72,
              decoration: BoxDecoration(
                  color: Colors.orange.withValues(alpha: 0.10), shape: BoxShape.circle),
              child: const Icon(Icons.hourglass_top_rounded,
                  color: Colors.orange, size: 36),
            ),
            const SizedBox(height: 16),
            Text('Payment Submitted!',
                style: GoogleFonts.poppins(
                    fontSize: 18, fontWeight: FontWeight.w700, color: _textDark)),
            const SizedBox(height: 8),
            Text(
              'Your payment request has been sent for admin review. Your card will be activated once confirmed.',
              textAlign: TextAlign.center,
              style: GoogleFonts.poppins(fontSize: 13, color: _textMid, height: 1.5),
            ),
            const SizedBox(height: 16),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                  color: _surface, borderRadius: BorderRadius.circular(12)),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Reference #',
                      style: GoogleFonts.poppins(fontSize: 12, color: _textMid)),
                  Text(refNumber,
                      style: GoogleFonts.poppins(
                          fontSize: 13, fontWeight: FontWeight.w700, color: _purple)),
                ],
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                    backgroundColor: _purple,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                    elevation: 0),
                child: Text('Got it',
                    style: GoogleFonts.poppins(
                        fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white)),
              ),
            ),
          ]),
        ),
      ),
    );
  }

  void _showSnack(String msg, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content:         Text(msg, style: GoogleFonts.poppins()),
      backgroundColor: color,
      behavior:        SnackBarBehavior.floating,
      shape:           RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ));
  }

  // ── Payment method selector ───────────────────────────────────────────────
  void _showPaymentSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      builder: (_) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(child: Container(width: 40, height: 4,
                  decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(10)))),
              const SizedBox(height: 20),
              Text('Choose Payment Method',
                  style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w700, color: _textDark)),
              const SizedBox(height: 4),
              Text('Select how you want to pay for ${widget.cardTitle}',
                  style: GoogleFonts.poppins(fontSize: 12, color: _textMid)),
              const SizedBox(height: 20),

              _PaymentOptionTile(
                label: 'GCash', subtitle: 'Pay via GCash e-wallet',
                color: _gcashBlue, accentColor: const Color(0xFFE8F3FC),
                icon: Icons.account_balance_wallet_rounded,
                logoPath: 'assets/images/gcash_logo.png',
                onTap: () {
                  Navigator.pop(context);
                  _showQrPaymentScreen(
                    method: 'gcash', label: 'GCash',
                    color: _gcashBlue, accentColor: const Color(0xFFE8F3FC),
                    qrUrl: _gcashQrUrl, qrAssetFallback: 'assets/images/gcash_qr.png',
                    accountNumber: _gcashNumber, onOpenApp: _openGCash,
                  );
                },
              ),
              const SizedBox(height: 12),

              _PaymentOptionTile(
                label: 'Maya', subtitle: 'Pay via Maya e-wallet',
                color: _mayaGreen, accentColor: const Color(0xFFE6F7F1),
                icon: Icons.payment_rounded,
                logoPath: 'assets/images/maya_logo.png',
                onTap: () {
                  Navigator.pop(context);
                  _showQrPaymentScreen(
                    method: 'maya', label: 'Maya',
                    color: _mayaGreen, accentColor: const Color(0xFFE6F7F1),
                    qrUrl: _mayaQrUrl, qrAssetFallback: 'assets/images/maya_qr.png',
                    accountNumber: _mayaNumber, onOpenApp: _openMaya,
                  );
                },
              ),
              const SizedBox(height: 12),

              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: _surface, borderRadius: BorderRadius.circular(14)),
                child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  Text('Amount to pay', style: GoogleFonts.poppins(fontSize: 13, color: _textMid)),
                  Text(widget.cardPrice,
                      style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w800, color: _purple)),
                ]),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── QR screen with reference number input + countdown timer ──────────────
  void _showQrPaymentScreen({
    required String        method,
    required String        label,
    required Color         color,
    required Color         accentColor,
    required String?       qrUrl,
    required String        qrAssetFallback,
    required String        accountNumber,
    required Future<void> Function() onOpenApp,
  }) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      builder: (_) => _QrPaymentSheet(
        method:           method,
        label:            label,
        color:            color,
        accentColor:      accentColor,
        qrUrl:            qrUrl,
        qrAssetFallback:  qrAssetFallback,
        accountNumber:    accountNumber,
        accountName:      _accountName,
        cardPrice:        widget.cardPrice,
        onOpenApp:        onOpenApp,
        onSubmit:         _submitPaymentRequest,
      ),
    );
  }

  void _showExpiryDialog() {
    final int days    = _daysRemaining ?? 0;
    final bool urgent = days <= 7;
    final Color color = urgent ? Colors.orange : Colors.green;
    showDialog(
      context: context,
      builder: (_) => Dialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(width: 72, height: 72,
                decoration: BoxDecoration(color: color.withValues(alpha: 0.10), shape: BoxShape.circle),
                child: Icon(urgent ? Icons.warning_amber_rounded : Icons.calendar_month_rounded, color: color, size: 36)),
            const SizedBox(height: 16),
            Text('Card Expiry', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w700, color: _textDark)),
            const SizedBox(height: 20),
            Container(
              width: double.infinity, padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: _surface, borderRadius: BorderRadius.circular(14)),
              child: Column(children: [
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  Text('Expires on', style: GoogleFonts.poppins(fontSize: 13, color: _textMid)),
                  Text(_expiresAtFormatted ?? '—', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: _textDark)),
                ]),
                const SizedBox(height: 10),
                const Divider(color: Color(0xFFEAEAF0)),
                const SizedBox(height: 10),
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  Text('Days remaining', style: GoogleFonts.poppins(fontSize: 13, color: _textMid)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(20)),
                    child: Text('$days day${days != 1 ? 's' : ''}',
                        style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: color)),
                  ),
                ]),
              ]),
            ),
            if (urgent) ...[
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                    color: Colors.orange.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.orange.withValues(alpha: 0.3))),
                child: Row(children: [
                  const Icon(Icons.info_outline_rounded, color: Colors.orange, size: 16),
                  const SizedBox(width: 8),
                  Expanded(child: Text('Your card expires soon! Visit any Lucky Boba store to renew.',
                      style: GoogleFonts.poppins(fontSize: 11, color: Colors.orange[800]))),
                ]),
              ),
            ],
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                    backgroundColor: _purple, padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)), elevation: 0),
                child: Text('Got it', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white)),
              ),
            ),
          ]),
        ),
      ),
    );
  }

  void _showLockedMessage() =>
      _showSnack('Purchase this card to unlock the QR code!', Colors.redAccent);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: Colors.white, elevation: 0,
        centerTitle: true, surfaceTintColor: Colors.transparent,
        title: Text(_isCurrentlyOwned ? 'My Card' : 'Purchase Card',
            style: GoogleFonts.poppins(color: _textDark, fontWeight: FontWeight.w700, fontSize: 16)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFF1A1A2E), size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        bottom: PreferredSize(
            preferredSize: const Size.fromHeight(1),
            child: Container(height: 1, color: const Color(0xFFEAEAF0))),
      ),

      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

          // ── Flippable card ────────────────────────────────────────────
          GestureDetector(
            onTap: _toggleFlip,
            child: Container(
              height: 210, width: double.infinity,
              decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(22),
                  boxShadow: [BoxShadow(color: _purple.withValues(alpha: 0.18), blurRadius: 24, offset: const Offset(0, 10))]),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(22),
                child: Stack(children: [
                  Positioned.fill(child: AnimatedBuilder(
                    animation: _flipAnimation,
                    builder: (context, child) {
                      final angle  = _flipAnimation.value * math.pi;
                      final isBack = angle > math.pi / 2;
                      return Transform(
                        transform: Matrix4.identity()..setEntry(3, 2, 0.001)..rotateY(angle),
                        alignment: Alignment.center,
                        child: isBack
                            ? Transform(alignment: Alignment.center, transform: Matrix4.rotationY(math.pi),
                            child: Image.asset('assets/cards/back_card.png', fit: BoxFit.cover))
                            : (widget.cardImageUrl.startsWith('http')
                            ? CachedNetworkImage(
                                imageUrl: widget.cardImageUrl,
                                fit: BoxFit.cover,
                                placeholder: (context, url) => Container(
                                    color: const Color(0xFFF2EEF8),
                                    child: const Center(child: CircularProgressIndicator(strokeWidth: 2))),
                                errorWidget: (context, url, error) => Container(
                                    color: const Color(0xFFF2EEF8),
                                    child: const Icon(Icons.credit_card_rounded,
                                        color: Color(0xFF7C14D4), size: 48)),
                              )
                            : Image.asset(widget.cardImageUrl, fit: BoxFit.cover)),
                      );
                    },
                  )),
                  Positioned(top: 12, right: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.45), borderRadius: BorderRadius.circular(20)),
                        child: Row(mainAxisSize: MainAxisSize.min, children: [
                          const Icon(Icons.flip_rounded, color: Colors.white, size: 12),
                          const SizedBox(width: 4),
                          Text('Tap to flip', style: GoogleFonts.poppins(fontSize: 10, color: Colors.white)),
                        ]),
                      )),
                ]),
              ),
            ),
          ),

          const SizedBox(height: 24),

          Row(children: [
            Expanded(child: Text(widget.cardTitle,
                style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.w700, color: _textDark))),
            if (_isCurrentlyOwned)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: Colors.green.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(20)),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.check_circle_rounded, color: Colors.green, size: 14),
                  const SizedBox(width: 4),
                  Text('Active', style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.green)),
                ]),
              ),
          ]),
          const SizedBox(height: 6),
          Text('Your perks', style: GoogleFonts.poppins(fontSize: 13, color: _textMid)),

          // ── Expiry button (owned only) ────────────────────────────────
          if (_isCurrentlyOwned) ...[
            const SizedBox(height: 14),
            GestureDetector(
              onTap: _loadingExpiry ? null : _showExpiryDialog,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: _daysRemaining != null && _daysRemaining! <= 7
                      ? Colors.orange.withValues(alpha: 0.08) : _surface,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                      color: _daysRemaining != null && _daysRemaining! <= 7
                          ? Colors.orange.withValues(alpha: 0.4) : _purple.withValues(alpha: 0.2),
                      width: 1.2),
                ),
                child: _loadingExpiry
                    ? const Center(child: SizedBox(width: 18, height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF7C14D4))))
                    : Row(children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                        color: _daysRemaining != null && _daysRemaining! <= 7
                            ? Colors.orange.withValues(alpha: 0.15) : _purple.withValues(alpha: 0.10),
                        shape: BoxShape.circle),
                    child: Icon(
                        _daysRemaining != null && _daysRemaining! <= 7
                            ? Icons.warning_amber_rounded : Icons.calendar_month_rounded,
                        color: _daysRemaining != null && _daysRemaining! <= 7
                            ? Colors.orange : _purple,
                        size: 18),
                  ),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Card Validity', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: _textDark)),
                    Text(
                        _expiresAtFormatted != null ? 'Expires $_expiresAtFormatted' : 'Tap to check expiry',
                        style: GoogleFonts.poppins(fontSize: 11,
                            color: _daysRemaining != null && _daysRemaining! <= 7
                                ? Colors.orange[700] : _textMid)),
                  ])),
                  if (_daysRemaining != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                          color: _daysRemaining! <= 7
                              ? Colors.orange.withValues(alpha: 0.15) : Colors.green.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(20)),
                      child: Text('${_daysRemaining}d left',
                          style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w700,
                              color: _daysRemaining! <= 7 ? Colors.orange : Colors.green)),
                    ),
                  const SizedBox(width: 6),
                  Icon(Icons.arrow_forward_ios_rounded, color: _textMid, size: 13),
                ]),
              ),
            ),
          ],

          const SizedBox(height: 20),

          _PerkTile(
            label:       'Buy 1, Take 1',
            subtitle:    _isCurrentlyOwned ? 'Tap to view daily QR code' : 'Locked — purchase to unlock',
            icon:        PhosphorIconsRegular.coffee,
            isOwned:     _isCurrentlyOwned,
            accentColor: _yellow,
            iconColor:   _purple,
            onTap: _isCurrentlyOwned
                ? () => Navigator.push(context, MaterialPageRoute(
                builder: (_) => const QrPerkPage(perkName: 'Buy 1, Get 1 Free')))
                : _showLockedMessage,
          ),
          const SizedBox(height: 12),

          _PerkTile(
            label:       '10% off on all items',
            subtitle:    _isCurrentlyOwned ? 'Tap to view unlimited QR code' : 'Locked — purchase to unlock',
            icon:        PhosphorIconsRegular.percent,
            isOwned:     _isCurrentlyOwned,
            accentColor: const Color(0xFFF2EEF8),
            iconColor:   _purple,
            onTap: _isCurrentlyOwned
                ? () => Navigator.push(context, MaterialPageRoute(
                builder: (_) => const QrPerkPage(perkName: '10% Off All Items')))
                : _showLockedMessage,
          ),

          const SizedBox(height: 100),
        ]),
      ),

      bottomNavigationBar: _isCurrentlyOwned
          ? const SizedBox.shrink()
          : Container(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
        decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(top: BorderSide(color: Color(0xFFEAEAF0), width: 1))),
        child: ElevatedButton(
          onPressed: _loadingPaymentSettings ? null : _showPaymentSheet,
          style: ElevatedButton.styleFrom(
              backgroundColor: _purple, foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              elevation: 0),
          child: _loadingPaymentSettings
              ? const SizedBox(width: 20, height: 20,
              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
              : Text('Pay Now — ${widget.cardPrice}',
              style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 15)),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// QR PAYMENT SHEET — stateful for countdown timer + ref number validation
// ─────────────────────────────────────────────────────────────────────────────
class _QrPaymentSheet extends StatefulWidget {
  final String        method;
  final String        label;
  final Color         color;
  final Color         accentColor;
  final String?       qrUrl;
  final String        qrAssetFallback;
  final String        accountNumber;
  final String        accountName;
  final String        cardPrice;
  final Future<void> Function() onOpenApp;
  final Future<void> Function(String method, String refNumber) onSubmit;

  const _QrPaymentSheet({
    required this.method,
    required this.label,
    required this.color,
    required this.accentColor,
    required this.qrUrl,
    required this.qrAssetFallback,
    required this.accountNumber,
    required this.accountName,
    required this.cardPrice,
    required this.onOpenApp,
    required this.onSubmit,
  });

  @override
  State<_QrPaymentSheet> createState() => _QrPaymentSheetState();
}

class _QrPaymentSheetState extends State<_QrPaymentSheet> {
  static const Color _textDark = Color(0xFF1A1A2E);
  static const Color _textMid  = Color(0xFF6B6B8A);
  static const int   _cooldown = 30; // seconds before "I've Paid" unlocks

  final _refController = TextEditingController();
  Timer?  _timer;
  int     _secondsLeft  = _cooldown;
  bool    _timerDone    = false;
  final bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) { t.cancel(); return; }
      setState(() {
        if (_secondsLeft > 0) {
          _secondsLeft--;
        } else {
          _timerDone = true;
          t.cancel();
        }
      });
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _refController.dispose();
    super.dispose();
  }

  void _handleSubmit() {
    final ref = _refController.text.trim();
    if (ref.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Please enter your GCash/Maya reference number.',
            style: GoogleFonts.poppins()),
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ));
      return;
    }
    if (ref.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Reference number looks too short. Please double-check.',
            style: GoogleFonts.poppins()),
        backgroundColor: Colors.orange,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ));
      return;
    }
    widget.onSubmit(widget.method, ref);
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: SingleChildScrollView(
        padding: EdgeInsets.only(
          left: 24, right: 24, top: 16,
          bottom: MediaQuery.of(context).viewInsets.bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Center(child: Container(width: 40, height: 4,
                decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(10)))),
            const SizedBox(height: 20),

            Row(children: [
              Container(padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: widget.accentColor, shape: BoxShape.circle),
                  child: Icon(Icons.qr_code_rounded, color: widget.color, size: 24)),
              const SizedBox(width: 12),
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Pay with ${widget.label}',
                    style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700, color: _textDark)),
                Text('Scan QR · enter reference · submit',
                    style: GoogleFonts.poppins(fontSize: 12, color: _textMid)),
              ]),
            ]),
            const SizedBox(height: 20),

            // ── QR Box ──────────────────────────────────────────────────
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: widget.accentColor,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: widget.color.withValues(alpha: 0.2)),
              ),
              child: Column(children: [
                Container(
                  width: 200, height: 200,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [BoxShadow(color: widget.color.withValues(alpha: 0.15), blurRadius: 20, offset: const Offset(0, 6))],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: widget.qrUrl != null
                        ? CachedNetworkImage(
                      imageUrl: widget.qrUrl!,
                      fit: BoxFit.contain,
                      placeholder: (context, url) => Center(child: CircularProgressIndicator(
                          color: widget.color, strokeWidth: 2)),
                      errorWidget: (context, url, error) => _qrFallback(),
                    )
                        : Image.asset(widget.qrAssetFallback, fit: BoxFit.contain,
                        errorBuilder: (_, _, _) => _qrFallback()),
                  ),
                ),
                const SizedBox(height: 16),
                Text(widget.accountName,
                    style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700, color: _textDark)),
                const SizedBox(height: 4),
                if (widget.accountNumber.isNotEmpty)
                  GestureDetector(
                    onTap: () {
                      Clipboard.setData(ClipboardData(text: widget.accountNumber));
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                        content: Text('Number copied!', style: GoogleFonts.poppins()),
                        backgroundColor: Colors.green,
                        behavior: SnackBarBehavior.floating,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ));
                    },
                    child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                      Text(widget.accountNumber,
                          style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700,
                              color: widget.color, letterSpacing: 1.5)),
                      const SizedBox(width: 6),
                      Icon(Icons.copy_rounded, color: widget.color, size: 16),
                    ]),
                  ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                      color: widget.color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(20)),
                  child: Text('Amount: ${widget.cardPrice}',
                      style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: widget.color)),
                ),
              ]),
            ),
            const SizedBox(height: 14),

            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: widget.onOpenApp,
                icon: Icon(Icons.open_in_new_rounded, color: widget.color, size: 18),
                label: Text('Open ${widget.label} App',
                    style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 14, color: widget.color)),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  side: BorderSide(color: widget.color, width: 1.5),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ),
            const SizedBox(height: 14),

            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFFAFAFA),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFEAEAF0)),
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Reference / Transaction Number',
                    style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w700, color: _textDark)),
                const SizedBox(height: 4),
                Text('Required — found in your ${widget.label} transaction history',
                    style: GoogleFonts.poppins(fontSize: 11, color: _textMid)),
                const SizedBox(height: 10),
                TextField(
                  controller: _refController,
                  keyboardType: TextInputType.text,
                  textCapitalization: TextCapitalization.characters,
                  style: GoogleFonts.poppins(fontSize: 14, color: _textDark, letterSpacing: 1.2),
                  decoration: InputDecoration(
                    hintText: 'e.g. 1234 5678 9012',
                    hintStyle: GoogleFonts.poppins(color: _textMid, fontSize: 13),
                    filled: true,
                    fillColor: Colors.white,
                    prefixIcon: Icon(Icons.tag_rounded, color: widget.color, size: 18),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                    border:        OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: widget.color.withValues(alpha: 0.3), width: 1.2)),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: widget.color, width: 1.5)),
                  ),
                ),
              ]),
            ),
            const SizedBox(height: 12),

            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF8F0),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.orange.withValues(alpha: 0.3)),
              ),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Icon(Icons.info_outline_rounded, color: Colors.orange, size: 18),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                      'Send ${widget.accountName} exactly ${widget.cardPrice}. '
                          'Enter the reference number from your ${widget.label} receipt, '
                          'then tap submit. Admin will review and activate your card.',
                      style: GoogleFonts.poppins(fontSize: 12, color: Colors.orange[800], height: 1.5)),
                ),
              ]),
            ),
            const SizedBox(height: 16),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: (_timerDone && !_submitting) ? _handleSubmit : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _timerDone ? widget.color : Colors.grey[300],
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: Colors.grey[300],
                  disabledForegroundColor: Colors.grey[500],
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
                child: _submitting
                    ? const SizedBox(width: 20, height: 20,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : _timerDone
                    ? Text('Submit Payment for Admin Review',
                    style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 14))
                    : Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  const Icon(Icons.timer_outlined, size: 18),
                  const SizedBox(width: 8),
                  Text('Please wait $_secondsLeft s before submitting',
                      style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13)),
                ]),
              ),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  Widget _qrFallback() => Padding(
    padding: const EdgeInsets.all(20),
    child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      Icon(Icons.qr_code_2_rounded, color: widget.color, size: 100),
      const SizedBox(height: 8),
      Text('QR not set yet\nContact admin',
          textAlign: TextAlign.center,
          style: GoogleFonts.poppins(fontSize: 12, color: widget.color, fontWeight: FontWeight.w600)),
    ]),
  );
}

// ── PAYMENT OPTION TILE ───────────────────────────────────────────────────────
class _PaymentOptionTile extends StatelessWidget {
  final String label, subtitle, logoPath;
  final Color color, accentColor;
  final IconData icon;
  final VoidCallback onTap;
  const _PaymentOptionTile({required this.label, required this.subtitle, required this.color,
    required this.accentColor, required this.icon, required this.logoPath, required this.onTap});
  static const Color _textDark = Color(0xFF1A1A2E);
  static const Color _textMid  = Color(0xFF6B6B8A);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white, borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFEAEAF0), width: 1),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 3))],
        ),
        child: Row(children: [
          Container(
            width: 52, height: 52,
            decoration: BoxDecoration(color: accentColor, borderRadius: BorderRadius.circular(14)),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Image.asset(logoPath, fit: BoxFit.contain,
                    errorBuilder: (_, _, _) => Icon(icon, color: color, size: 28)),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(label, style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700, color: _textDark)),
            Text(subtitle, style: GoogleFonts.poppins(fontSize: 12, color: _textMid)),
          ])),
          Icon(Icons.arrow_forward_ios_rounded, color: color, size: 16),
        ]),
      ),
    );
  }
}

// ── PERK TILE ─────────────────────────────────────────────────────────────────
class _PerkTile extends StatelessWidget {
  final String label, subtitle;
  final IconData icon;
  final bool isOwned;
  final Color accentColor, iconColor;
  final VoidCallback onTap;
  const _PerkTile({required this.label, required this.subtitle, required this.icon,
    required this.isOwned, required this.accentColor, required this.iconColor, required this.onTap});
  static const Color _textDark = Color(0xFF1A1A2E);
  static const Color _textMid  = Color(0xFF6B6B8A);

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap, borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: isOwned ? accentColor.withValues(alpha: 0.15) : Colors.grey[100],
          border: Border.all(color: isOwned ? accentColor.withValues(alpha: 0.5) : Colors.grey[300]!, width: 1.5),
          borderRadius: BorderRadius.circular(16),
          boxShadow: isOwned ? [BoxShadow(color: accentColor.withValues(alpha: 0.08), blurRadius: 8, offset: const Offset(0, 3))] : [],
        ),
        child: Row(children: [
          Container(padding: const EdgeInsets.all(9),
              decoration: BoxDecoration(color: isOwned ? accentColor : Colors.grey[300], shape: BoxShape.circle),
              child: Icon(isOwned ? icon : PhosphorIconsRegular.lock,
                  color: isOwned ? iconColor : Colors.white, size: 18)),
          const SizedBox(width: 14),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(label, style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w700,
                color: isOwned ? _textDark : Colors.grey[500])),
            const SizedBox(height: 2),
            Text(subtitle, style: GoogleFonts.poppins(fontSize: 11,
                color: isOwned ? _textMid : Colors.grey[400])),
          ])),
          Icon(isOwned ? Icons.arrow_forward_ios_rounded : Icons.lock_outline,
              color: isOwned ? _textMid : Colors.grey[400], size: 14),
        ]),
      ),
    );
  }
}