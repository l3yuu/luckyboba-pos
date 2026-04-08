import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:qr_flutter/qr_flutter.dart';

class OrderDetailPage extends StatelessWidget {
  final String siNumber;
  final double total;
  final List items;
  final String status;

  static const Color _purple   = Color(0xFF7C14D4);
  static const Color _bg       = Color(0xFFFAFAFA);
  static const Color _surface  = Color(0xFFF2EEF8);
  static const Color _textDark = Color(0xFF1A1A2E);
  static const Color _textMid  = Color(0xFF6B6B8A);
  static const Color _totalColor = Color(0xFF5A0FA0); // deep purple instead of orange/yellow

  const OrderDetailPage({
    super.key,
    required this.siNumber,
    required this.total,
    required this.items,
    required this.status,
  });

  Color _statusColor(String s) {
    switch (s.toLowerCase()) {
      case 'pending':   return const Color(0xFFD97706); // amber-700, readable
      case 'fulfilled': return _purple;
      case 'completed': return const Color(0xFF22C55E);
      case 'cancelled': return Colors.red;
      default:          return _textMid;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(
        child: Column(
          children: [
            // ── AppBar ──────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.all(16),
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
                  Text(
                    'Order Details',
                    style: GoogleFonts.poppins(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: _textDark),
                  ),
                ],
              ),
            ),

            // ── Scrollable body ─────────────────────────────────────────
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  children: [
                    // Status badge
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 6),
                      decoration: BoxDecoration(
                        color: _statusColor(status).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        status[0].toUpperCase() + status.substring(1),
                        style: GoogleFonts.poppins(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: _statusColor(status)),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // QR Code card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFEAEAF0)),
                      ),
                      child: Column(
                        children: [
                          Text(
                            'Show this to the cashier',
                            style: GoogleFonts.poppins(
                                fontSize: 13, color: _textMid),
                          ),
                          const SizedBox(height: 16),
                          QrImageView(
                              data: siNumber,
                              version: QrVersions.auto,
                              size: 180),
                          const SizedBox(height: 16),
                          Container(
                            width: double.infinity, // stretch to card width
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 10),
                            decoration: BoxDecoration(
                              color: _surface,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            // FittedBox shrinks text if it's too long
                            child: FittedBox(
                              fit: BoxFit.scaleDown,
                              child: Text(
                                siNumber,
                                textAlign: TextAlign.center,
                                style: GoogleFonts.poppins(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w800,
                                    color: _purple,
                                    letterSpacing: 2),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Items card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFEAEAF0)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Order Items',
                            style: GoogleFonts.poppins(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: _textDark),
                          ),
                          const SizedBox(height: 12),
                          ...items.map((item) {
                            final name  = item['name']?.toString() ??
                                item['product_name']?.toString() ??
                                'Item';
                            final qty   = item['quantity']?.toString() ??
                                item['qty']?.toString() ?? '1';
                            final price = item['price'] ?? item['unit_price'] ?? 0;
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Padding(
                                    padding: const EdgeInsets.only(top: 5),
                                    child: Container(
                                      width: 6, height: 6,
                                      decoration: const BoxDecoration(
                                          color: _purple,
                                          shape: BoxShape.circle),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  // Expanded prevents overflow on long names
                                  Expanded(
                                    child: Text(
                                      '$qty× $name',
                                      style: GoogleFonts.poppins(
                                          fontSize: 13, color: _textDark),
                                      softWrap: true,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  // Price stays fixed-width on the right
                                  Text(
                                    '₱${double.tryParse(price.toString())?.toStringAsFixed(2) ?? '0.00'}',
                                    style: GoogleFonts.poppins(
                                        fontSize: 13, color: _textMid),
                                  ),
                                ],
                              ),
                            );
                          }),
                          const Divider(color: Color(0xFFEAEAF0)),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Total',
                                style: GoogleFonts.poppins(
                                    fontWeight: FontWeight.w700,
                                    color: _textDark),
                              ),
                              Text(
                                '₱${total.toStringAsFixed(2)}',
                                style: GoogleFonts.poppins(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w800,
                                    color: _totalColor), // deep purple, not orange
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    // ── Back to Menu button ─────────────────────────────
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () =>
                            Navigator.of(context).popUntil((r) => r.isFirst),
                        icon: const Icon(Icons.home_rounded,
                            color: Colors.white, size: 18),
                        label: Text(
                          'Back to Menu',
                          style: GoogleFonts.poppins(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: Colors.white),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _purple,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14)),
                          elevation: 0,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}