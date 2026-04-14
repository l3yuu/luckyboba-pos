// FILE: lib/account/vouchers_wallet_page.dart
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../config/app_config.dart';

class VouchersWalletPage extends StatefulWidget {
  const VouchersWalletPage({super.key});

  @override
  State<VouchersWalletPage> createState() => _VouchersWalletPageState();
}

class _VouchersWalletPageState extends State<VouchersWalletPage> {
  static const Color _kPurple = Color(0xFF7C3AED);
  static const Color _kBg = Color(0xFFF4F4F8);
  static const Color _kTextDark = Color(0xFF1A1A2E);
  static const Color _kTextMid = Color(0xFF6B6B8A);

  List<dynamic> _vouchers = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchVouchers();
  }

  Future<void> _fetchVouchers() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token') ?? prefs.getString('session_token');

      final response = await http.get(
        Uri.parse('${AppConfig.apiUrl}/vouchers/available'),
        headers: {
          'Accept': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (mounted) {
          setState(() {
            _vouchers = data['data'] ?? [];
            _isLoading = false;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _error = 'Failed to load vouchers.';
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Connection error. Please try again.';
          _isLoading = false;
        });
      }
    }
  }

  void _copyToClipboard(String code) {
    Clipboard.setData(ClipboardData(text: code));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text('Voucher code "$code" copied!', style: GoogleFonts.outfit(fontSize: 13)),
      backgroundColor: _kPurple,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _kBg,
      body: SafeArea(
        child: Column(
          children: [
            // ── Header ──────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                                color: Colors.black.withValues(alpha: 0.05),
                                blurRadius: 10,
                                offset: const Offset(0, 4))
                          ]),
                      child: const Icon(Icons.arrow_back_ios_new_rounded,
                          size: 18, color: _kPurple),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('My Vouchers',
                            style: GoogleFonts.poppins(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: _kTextDark)),
                        Text(
                          'Available discounts and promos',
                          style: GoogleFonts.poppins(
                              fontSize: 11, color: _kTextMid),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // ── Contents ─────────────────────────────────────────────────
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: _kPurple))
                  : _error != null
                      ? _buildError()
                      : _vouchers.isEmpty
                          ? _buildEmpty()
                          : RefreshIndicator(
                              onRefresh: _fetchVouchers,
                              color: _kPurple,
                              child: ListView.builder(
                                physics: const AlwaysScrollableScrollPhysics(),
                                padding: const EdgeInsets.fromLTRB(16, 10, 16, 30),
                                itemCount: _vouchers.length,
                                itemBuilder: (context, index) => _buildVoucherCard(_vouchers[index]),
                              ),
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
            decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 15,
                      offset: const Offset(0, 5))
                ]),
            child: const Icon(PhosphorIconsRegular.ticket, size: 48, color: _kTextMid),
          ),
          const SizedBox(height: 20),
          Text('No available vouchers',
              style: GoogleFonts.poppins(
                  fontSize: 18, fontWeight: FontWeight.w700, color: _kTextDark)),
          const SizedBox(height: 8),
          Text("There are no active promos right now.",
              style: GoogleFonts.poppins(fontSize: 13, color: _kTextMid)),
        ],
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(PhosphorIconsRegular.wifiSlash,
              size: 56, color: Color(0xFFCCCCDD)),
          const SizedBox(height: 16),
          Text(_error!,
              style: GoogleFonts.poppins(fontSize: 14, color: _kTextMid),
              textAlign: TextAlign.center),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _fetchVouchers,
            style: ElevatedButton.styleFrom(
              backgroundColor: _kPurple,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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

  Widget _buildVoucherCard(dynamic voucher) {
    String type = voucher['type'] ?? 'Percentage';
    String value = voucher['value'].toString();
    String desc = voucher['description'] ?? 'Lucky Boba Voucher';
    String code = voucher['code'] ?? '';
    String minSpend = voucher['min_spend']?.toString() ?? '0';
    String expiry = voucher['expiry_date']?.split('T').first ?? '';

    String formatAmt() {
      if (type == 'Percentage') return '$value%';
      return '₱$value';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 10,
              offset: const Offset(0, 4))
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Column(
          children: [
            Container(
              height: 4,
              color: _kPurple,
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: _kPurple.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(PhosphorIconsRegular.tag, color: _kPurple, size: 24),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          desc,
                          style: GoogleFonts.poppins(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: _kTextDark),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Text(
                              formatAmt(),
                              style: GoogleFonts.poppins(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFF16A34A)),
                            ),
                            const SizedBox(width: 6),
                            if (double.tryParse(minSpend) != null && double.parse(minSpend) > 0)
                              Text(
                                'Min spend ₱$minSpend',
                                style: GoogleFonts.poppins(
                                    fontSize: 11, color: _kTextMid),
                              )
                            else
                              Text(
                                'No minimum spend',
                                style: GoogleFonts.poppins(
                                    fontSize: 11, color: _kTextMid),
                              ),
                          ],
                        ),
                        if (expiry.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            'Valid until $expiry',
                            style: GoogleFonts.poppins(
                                fontSize: 10, color: Colors.orange.shade700),
                          ),
                        ]
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Container(
              color: _kBg,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Text(
                        'CODE: ',
                        style: GoogleFonts.poppins(
                            fontSize: 11, color: _kTextMid, fontWeight: FontWeight.w600),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          border: Border.all(color: _kPurple.withValues(alpha: 0.3)),
                          borderRadius: BorderRadius.circular(6),
                          color: _kPurple.withValues(alpha: 0.05),
                        ),
                        child: Text(
                          code,
                          style: GoogleFonts.poppins(
                              fontSize: 12, fontWeight: FontWeight.w700, color: _kPurple),
                        ),
                      ),
                    ],
                  ),
                  GestureDetector(
                    onTap: () => _copyToClipboard(code),
                    child: Icon(PhosphorIconsRegular.copy, size: 20, color: _kPurple),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
