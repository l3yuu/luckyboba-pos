import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'order_detail_page.dart';

class PaymentInstructionsPage extends StatefulWidget {
  final String   paymentMethod; // 'GCash' or 'Maya'
  final double   amount;
  final String   siNumber;
  final List     items;

  const PaymentInstructionsPage({
    super.key,
    required this.paymentMethod,
    required this.amount,
    required this.siNumber,
    required this.items,
  });

  @override
  State<PaymentInstructionsPage> createState() =>
      _PaymentInstructionsPageState();
}

class _PaymentInstructionsPageState extends State<PaymentInstructionsPage> {
  // ── Brand tokens ──────────────────────────────────────────────────────────
  static const Color _purple   = Color(0xFF7C14D4);
  static const Color _orange   = Color(0xFFFF8C00);
  static const Color _bg       = Color(0xFFFAFAFA);
  static const Color _surface  = Color(0xFFF2EEF8);
  static const Color _textDark = Color(0xFF1A1A2E);
  static const Color _textMid  = Color(0xFF6B6B8A);
  static const Color _green    = Color(0xFF22C55E);

  // ── GCash account ─────────────────────────────────────────────────────────
  static const _gcashName   = 'Test';
  static const _gcashNumber = '09923247869';

  // ── Maya account ──────────────────────────────────────────────────────────
  static const _mayaName   = 'Test';
  static const _mayaNumber = '093234928171';

  bool _isConfirming = false;

  // ── Derived helpers ───────────────────────────────────────────────────────
  bool   get _isGcash     => widget.paymentMethod == 'GCash';
  String get _accountName => _isGcash ? _gcashName   : _mayaName;
  String get _accountNo   => _isGcash ? _gcashNumber : _mayaNumber;
  Color  get _brandColor  => _isGcash
      ? const Color(0xFF007DFE)   // GCash blue
      : const Color(0xFF42B549);  // Maya green

  // ── Steps ─────────────────────────────────────────────────────────────────
  List<String> get _steps => _isGcash
      ? [
    'Open the GCash app on your phone.',
    'Tap "Send Money" then choose "Express Send".',
    'Enter the number: $_accountNo',
    'Enter the exact amount: ₱${widget.amount.toStringAsFixed(2)}',
    'In the message/note, type your Order ID:\n${widget.siNumber}',
    'Review the details and tap "Send".',
    'Come back here and tap "I\'ve Sent My Payment".',
  ]
      : [
    'Open the Maya app on your phone.',
    'Tap "Send Money".',
    'Enter the number: $_accountNo',
    'Enter the exact amount: ₱${widget.amount.toStringAsFixed(2)}',
    'In the note/message, type your Order ID:\n${widget.siNumber}',
    'Review the details and confirm the transfer.',
    'Come back here and tap "I\'ve Sent My Payment".',
  ];

  // ── Confirm payment ───────────────────────────────────────────────────────
  void _confirmPayment() {
    setState(() => _isConfirming = true);
    Future.delayed(const Duration(milliseconds: 600), () {
      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => OrderDetailPage(
            siNumber: widget.siNumber,
            total:    widget.amount,
            items:    widget.items,
            status:   'pending',
          ),
        ),
      );
    });
  }

  // ── Copy to clipboard helper ──────────────────────────────────────────────
  void _copy(String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$label copied!',
            style: const TextStyle(color: Colors.white)),
        backgroundColor:  _purple,
        behavior:         SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(
        child: Column(
          children: [
            // ── App bar ───────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
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
                    child: Text(
                      '${widget.paymentMethod} Payment',
                      style: GoogleFonts.poppins(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: _textDark),
                    ),
                  ),
                  // Brand badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: _brandColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      widget.paymentMethod,
                      style: GoogleFonts.poppins(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: _brandColor),
                    ),
                  ),
                ],
              ),
            ),

            // ── Scrollable content ────────────────────────────────────────
            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ── Amount card ───────────────────────────────────────
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                          vertical: 24, horizontal: 20),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            _brandColor,
                            _brandColor.withValues(alpha: 0.80),
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: _brandColor.withValues(alpha: 0.30),
                            blurRadius: 16,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          Text(
                            'Amount to Pay',
                            style: GoogleFonts.poppins(
                                fontSize: 12,
                                color: Colors.white70,
                                fontWeight: FontWeight.w500),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            '₱${widget.amount.toStringAsFixed(2)}',
                            style: GoogleFonts.poppins(
                                fontSize: 36,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                                height: 1.1),
                          ),
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 14, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.20),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              'Ref: ${widget.siNumber}',
                              style: GoogleFonts.poppins(
                                  fontSize: 11,
                                  color: Colors.white,
                                  fontWeight: FontWeight.w600,
                                  letterSpacing: 1),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // ── Account details card ──────────────────────────────
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: const Color(0xFFEAEAF0)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 32, height: 32,
                                decoration: BoxDecoration(
                                  color: _brandColor.withValues(alpha: 0.12),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  _isGcash
                                      ? Icons.account_balance_wallet_rounded
                                      : Icons.credit_card_rounded,
                                  size: 16,
                                  color: _brandColor,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Text(
                                'Send to this ${widget.paymentMethod} Account',
                                style: GoogleFonts.poppins(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: _textDark),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),

                          // Account name row
                          _accountDetailRow(
                            label: 'Account Name',
                            value: _accountName,
                            onCopy: () => _copy(_accountName, 'Account name'),
                          ),
                          const SizedBox(height: 12),

                          // Account number row
                          _accountDetailRow(
                            label: 'Account Number',
                            value: _accountNo,
                            onCopy: () => _copy(_accountNo, 'Account number'),
                            isHighlighted: true,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // ── QR placeholder card ───────────────────────────────
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: const Color(0xFFEAEAF0)),
                      ),
                      child: Column(
                        children: [
                          Text(
                            'Scan QR Code',
                            style: GoogleFonts.poppins(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: _textDark),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Open ${widget.paymentMethod} and scan this code',
                            style: GoogleFonts.poppins(
                                fontSize: 11, color: _textMid),
                          ),
                          const SizedBox(height: 16),

                          // QR placeholder box
                          Container(
                            width: 180, height: 180,
                            decoration: BoxDecoration(
                              color: _surface,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                  color: _brandColor.withValues(alpha: 0.25),
                                  width: 2),
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.qr_code_2_rounded,
                                    size: 80,
                                    color: _brandColor.withValues(alpha: 0.40)),
                                const SizedBox(height: 8),
                                Text(
                                  'QR Code\nPlaceholder',
                                  textAlign: TextAlign.center,
                                  style: GoogleFonts.poppins(
                                      fontSize: 11,
                                      color: _textMid,
                                      fontWeight: FontWeight.w500),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'Replace this with your actual ${widget.paymentMethod} QR image',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.poppins(
                                fontSize: 10,
                                color: _textMid.withValues(alpha: 0.70),
                                fontStyle: FontStyle.italic),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // ── Step-by-step instructions ─────────────────────────
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: const Color(0xFFEAEAF0)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'How to Pay',
                            style: GoogleFonts.poppins(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: _textDark),
                          ),
                          const SizedBox(height: 14),
                          ..._steps.asMap().entries.map((e) =>
                              _stepTile(e.key + 1, e.value)),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // ── Important note ────────────────────────────────────
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: _orange.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(12),
                        border:
                        Border.all(color: _orange.withValues(alpha: 0.30)),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(Icons.info_outline_rounded,
                              size: 16, color: _orange),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Please send the exact amount and include your Order ID in the notes. '
                                  'Your order will be confirmed once the cashier verifies your payment.',
                              style: GoogleFonts.poppins(
                                  fontSize: 11,
                                  color: Colors.orange[800],
                                  height: 1.5),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),

            // ── Bottom confirm bar ────────────────────────────────────────
            Container(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius:
                const BorderRadius.vertical(top: Radius.circular(24)),
                boxShadow: [
                  BoxShadow(
                      color: Colors.black.withValues(alpha: 0.07),
                      blurRadius: 16,
                      offset: const Offset(0, -4)),
                ],
              ),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _isConfirming ? null : _confirmPayment,
                  icon: _isConfirming
                      ? const SizedBox(
                    width: 18, height: 18,
                    child: CircularProgressIndicator(
                        color: Colors.white, strokeWidth: 2),
                  )
                      : const Icon(Icons.check_circle_rounded,
                      color: Colors.white, size: 20),
                  label: Text(
                    _isConfirming ? 'Confirming...' : "I've Sent My Payment",
                    style: GoogleFonts.poppins(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: Colors.white),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _green,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Helper widgets ────────────────────────────────────────────────────────

  Widget _accountDetailRow({
    required String label,
    required String value,
    required VoidCallback onCopy,
    bool isHighlighted = false,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: isHighlighted ? _surface : const Color(0xFFF9F9FB),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isHighlighted
              ? _purple.withValues(alpha: 0.20)
              : const Color(0xFFEAEAF0),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: GoogleFonts.poppins(
                        fontSize: 10,
                        color: _textMid,
                        fontWeight: FontWeight.w500)),
                const SizedBox(height: 2),
                Text(value,
                    style: GoogleFonts.poppins(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: isHighlighted ? _purple : _textDark,
                        letterSpacing: isHighlighted ? 1.5 : 0)),
              ],
            ),
          ),
          GestureDetector(
            onTap: onCopy,
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: _purple.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child:
              const Icon(Icons.copy_rounded, size: 16, color: _purple),
            ),
          ),
        ],
      ),
    );
  }

  Widget _stepTile(int number, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 26, height: 26,
            decoration: BoxDecoration(
              color: _purple,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Text(
                '$number',
                style: GoogleFonts.poppins(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: Colors.white),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(top: 3),
              child: Text(
                text,
                style: GoogleFonts.poppins(
                    fontSize: 13, color: _textDark, height: 1.5),
              ),
            ),
          ),
        ],
      ),
    );
  }
}