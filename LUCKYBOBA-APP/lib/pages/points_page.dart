import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../config/app_config.dart';
import '../utils/app_theme.dart';

class PointsPage extends StatefulWidget {
  final int points;
  const PointsPage({super.key, required this.points});

  @override
  State<PointsPage> createState() => _PointsPageState();
}

class _PointsPageState extends State<PointsPage> {
  bool    _loading = true;
  int     _points  = 0;
  List    _history = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _points = widget.points;
    _fetchPoints();
  }

  Future<void> _fetchPoints() async {
    if (!mounted) return;
    setState(() { _loading = true; _error = null; });
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('session_token') ?? '';

      final res = await http.get(
        Uri.parse('${AppConfig.apiUrl}/points'),
        headers: {
          'Accept':        'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 8));

      if (!mounted) return;

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        setState(() {
          _points  = data['points'] ?? 0;
          _history = data['history'] ?? [];
        });
      } else {
        setState(() => _error = 'Failed to load points.');
      }
    } catch (e) {
      if (mounted) setState(() => _error = 'Network error');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  double get _pesoValue => (_points / 100) * 10;

  String _formatDate(String? raw) {
    if (raw == null) return '';
    try {
      final dt = DateTime.parse(raw).toLocal();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return '${months[dt.month - 1]} ${dt.day}, ${dt.year}';
    } catch (_) { return raw; }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // ── PREMIUM BACKGROUND ──────────────────────────────────────────
          Positioned.fill(
            child: Image.asset(
              'assets/images/prompt_image.png',
              fit: BoxFit.cover,
            ),
          ),
          Positioned.fill(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      AppTheme.primary.withValues(alpha: 0.15),
                      Colors.black.withValues(alpha: 0.8),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // ── CONTENT ─────────────────────────────────────────────────────
          SafeArea(
            child: Column(
              children: [
                _buildCleanAppBar(context),
                Expanded(
                  child: _loading
                      ? const Center(child: CircularProgressIndicator(color: Colors.white24))
                      : _error != null
                      ? Center(child: Text(_error!, style: GoogleFonts.outfit(color: Colors.white54)))
                      : RefreshIndicator(
                    color: AppTheme.secondary,
                    onRefresh: _fetchPoints,
                    child: SingleChildScrollView(
                      physics: const BouncingScrollPhysics(),
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildBalanceCard(),
                          const SizedBox(height: 24),
                          _buildHowItWorks(),
                          const SizedBox(height: 32),
                          Text(
                            'HISTORY',
                            style: GoogleFonts.outfit(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: Colors.white54,
                              letterSpacing: 2,
                            ),
                          ),
                          const SizedBox(height: 16),
                          _buildHistoryList(),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCleanAppBar(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 20),
            onPressed: () => Navigator.pop(context),
          ),
          Expanded(
            child: Text(
              'Lucky Points',
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w800, color: Colors.white),
            ),
          ),
          const SizedBox(width: 48), // Spacer for centering
        ],
      ),
    );
  }

  Widget _buildBalanceCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: AppTheme.glassDecoration(borderRadius: 32, opacity: 0.12).copyWith(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppTheme.primary.withValues(alpha: 0.2),
            AppTheme.secondary.withValues(alpha: 0.1),
          ],
        ),
      ),
      child: Column(
        children: [
          Text(
            '$_points',
            style: GoogleFonts.outfit(fontSize: 64, fontWeight: FontWeight.w900, color: Colors.white, height: 1),
          ),
          Text(
            'TOTAL POINTS',
            style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.white54, letterSpacing: 2),
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(16)),
            child: Text(
              '≈ ₱${_pesoValue.toStringAsFixed(2)} Value',
              style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.secondary),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHowItWorks() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: AppTheme.glassDecoration(borderRadius: 24, opacity: 0.08),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('HOW TO EARN', style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.white54, letterSpacing: 2)),
          const SizedBox(height: 16),
          _stepRow(Icons.shopping_bag_rounded, '₱1 Spent = 1 Lucky Point', AppTheme.secondary),
          const SizedBox(height: 12),
          _stepRow(Icons.credit_card_rounded, 'Card Holders earn 2× Points', AppTheme.primaryLight),
          const SizedBox(height: 12),
          _stepRow(Icons.redeem_rounded, '100 Points = ₱10 Discount', const Color(0xFF00C853)),
        ],
      ),
    );
  }

  Widget _stepRow(IconData icon, String text, Color color) {
    return Row(
      children: [
        Icon(icon, color: color, size: 18),
        const SizedBox(width: 12),
        Text(text, style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white70)),
      ],
    );
  }

  Widget _buildHistoryList() {
    if (_history.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.only(top: 40),
          child: Text('No history transactions yet', style: GoogleFonts.outfit(color: Colors.white24, fontSize: 13)),
        ),
      );
    }
    return Column(
      children: _history.map((tx) {
        final isEarn = tx['type'] == 'earn';
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: AppTheme.glassDecoration(borderRadius: 16, opacity: 0.05),
          child: Row(
            children: [
              Container(
                width: 40, height: 40,
                decoration: BoxDecoration(color: (isEarn ? const Color(0xFF00C853) : Colors.orange).withValues(alpha: 0.1), shape: BoxShape.circle),
                child: Icon(isEarn ? Icons.add_rounded : Icons.remove_rounded, color: isEarn ? const Color(0xFF00C853) : Colors.orange, size: 20),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(tx['note'] ?? 'Transaction', style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white)),
                    Text(_formatDate(tx['created_at']?.toString()), style: GoogleFonts.outfit(fontSize: 10, color: Colors.white38)),
                  ],
                ),
              ),
              Text(
                '${isEarn ? '+' : '-'}${tx['points']}',
                style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w800, color: isEarn ? const Color(0xFF00C853) : Colors.orange),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}