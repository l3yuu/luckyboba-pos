// FILE: lib/pages/delivery_page.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

class DeliveryPage extends StatelessWidget {
  const DeliveryPage({super.key});

  // ── Brand tokens (matches menu_page & item_customization_page) ───────────
  static const Color _purple   = Color(0xFF7C14D4);
  static const Color _bg       = Color(0xFFFAFAFA);
  static const Color _surface  = Color(0xFFF2EEF8);
  static const Color _textDark = Color(0xFF1A1A2E);
  static const Color _textMid  = Color(0xFF6B6B8A);

  final String grabFoodUrl =
      'https://food.grab.com/ph/en/restaurants?lng=en&search=lucky%20boba&support-deeplink=true&searchParameter=lucky%20boba';

  final String foodPandaUrl =
      'https://www.foodpanda.ph/?utm_source=google&utm_medium=cpc&utm_campaign=22206545164&gad_source=1&gad_campaignid=22206545164&gbraid=0AAAAADiVv6NQw-RdoMzRA6MbRjHT6jVjZ&gclid=CjwKCAiA2PrMBhA4EiwAwpHyC5HSYAeCB1zyJGenbJUnNWrdRgy5E-7gEeNVq8I15mX6KYOTGYGdhhoCeyQQAvD_BwE&query=luckyboba';

  Future<void> _launchUrl(String urlString) async {
    final Uri url = Uri.parse(urlString);
    if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
      debugPrint('Could not launch $url');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── APP BAR (matches menu_page style) ───────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: const BoxDecoration(
                        color: _surface,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.arrow_back_ios_new_rounded,
                          size: 18, color: _purple),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Order Delivery',
                        style: GoogleFonts.poppins(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: _textDark,
                        ),
                      ),
                      Text(
                        'Choose your delivery platform',
                        style: GoogleFonts.poppins(
                          fontSize: 12,
                          color: _textMid,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // ── SCROLLABLE BODY ──────────────────────────────────────────
            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 30),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ── HERO BANNER ──────────────────────────────────────
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            _purple,
                            _purple.withValues(alpha: 0.75),
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Craving Lucky Boba?',
                                  style: GoogleFonts.poppins(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w800,
                                    color: Colors.white,
                                    height: 1.2,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Order now via your\nfavorite delivery app',
                                  style: GoogleFonts.poppins(
                                    fontSize: 13,
                                    color: Colors.white.withValues(alpha: 0.85),
                                    height: 1.4,
                                  ),
                                ),
                                const SizedBox(height: 14),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(
                                        color: Colors.white.withValues(alpha: 0.3)),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.delivery_dining_rounded,
                                          color: Colors.white, size: 16),
                                      const SizedBox(width: 6),
                                      Text(
                                        'Fast & reliable delivery',
                                        style: GoogleFonts.poppins(
                                          fontSize: 11,
                                          color: Colors.white,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          // Logo
                          Container(
                            width: 80,
                            height: 80,
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.15),
                              shape: BoxShape.circle,
                            ),
                            child: ClipOval(
                              child: Image.asset(
                                'assets/images/maps_logo.png',
                                fit: BoxFit.cover,
                                errorBuilder: (_, _, _) => const Icon(
                                    Icons.local_cafe_rounded,
                                    color: Colors.white,
                                    size: 40),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 28),

                    // ── SECTION LABEL ────────────────────────────────────
                    Text(
                      'Delivery Partners',
                      style: GoogleFonts.poppins(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: _textDark,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Tap to open the app and search for Lucky Boba',
                      style: GoogleFonts.poppins(
                          fontSize: 12, color: _textMid),
                    ),

                    const SizedBox(height: 16),

                    // ── GRABFOOD CARD ────────────────────────────────────
                    _PartnerCard(
                      imagePath: 'assets/images/grabfood_logo.png',
                      brandColor: const Color(0xFF00B14F),
                      brandAccent: const Color(0xFFE8F8EF),
                      title: 'GrabFood',
                      subtitle: 'Fast delivery to your doorstep',
                      badge: 'Most Popular',
                      onTap: () => _launchUrl(grabFoodUrl),
                    ),

                    const SizedBox(height: 14),

                    // ── FOODPANDA CARD ───────────────────────────────────
                    _PartnerCard(
                      imagePath: 'assets/images/foodpanda_logo.png',
                      brandColor: const Color(0xFFD70F64),
                      brandAccent: const Color(0xFFFCE8F1),
                      title: 'foodpanda',
                      subtitle: 'Craving Boba? We\'ve got you covered',
                      badge: null,
                      onTap: () => _launchUrl(foodPandaUrl),
                    ),

                    const SizedBox(height: 28),

                    // ── INFO BOX ─────────────────────────────────────────
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: _surface,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                            color: _purple.withValues(alpha: 0.15), width: 1),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: _purple.withValues(alpha: 0.10),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.info_outline_rounded,
                                size: 18, color: _purple),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Ordering via delivery app',
                                  style: GoogleFonts.poppins(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: _textDark,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Prices and availability may vary on third-party delivery platforms. For the best experience, order directly at the store.',
                                  style: GoogleFonts.poppins(
                                    fontSize: 11,
                                    color: _textMid,
                                    height: 1.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
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

// ── Partner Card Widget ───────────────────────────────────────────────────────
class _PartnerCard extends StatelessWidget {
  final String imagePath;
  final Color brandColor;
  final Color brandAccent;
  final String title;
  final String subtitle;
  final String? badge;
  final VoidCallback onTap;

  const _PartnerCard({
    required this.imagePath,
    required this.brandColor,
    required this.brandAccent,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.badge,
  });

  static const Color _purple   = Color(0xFF7C14D4);
  static const Color _surface  = Color(0xFFF2EEF8);
  static const Color _textDark = Color(0xFF1A1A2E);
  static const Color _textMid  = Color(0xFF6B6B8A);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFEAEAF0), width: 1),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            // ── LOGO BOX ──────────────────────────────────────────────
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: brandAccent,
                borderRadius: BorderRadius.circular(16),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Padding(
                  padding: const EdgeInsets.all(10),
                  child: Image.asset(
                    imagePath,
                    fit: BoxFit.contain,
                    errorBuilder: (_, _, _) => Icon(
                        Icons.delivery_dining_rounded,
                        color: brandColor,
                        size: 28),
                  ),
                ),
              ),
            ),

            const SizedBox(width: 16),

            // ── TEXT ──────────────────────────────────────────────────
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        title,
                        style: GoogleFonts.poppins(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: _textDark,
                        ),
                      ),
                      if (badge != null) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: _purple.withValues(alpha: 0.10),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            badge!,
                            style: GoogleFonts.poppins(
                              fontSize: 9,
                              fontWeight: FontWeight.w700,
                              color: _purple,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text(
                    subtitle,
                    style: GoogleFonts.poppins(
                      fontSize: 12,
                      color: _textMid,
                      height: 1.3,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(width: 8),

            // ── ARROW ─────────────────────────────────────────────────
            Container(
              width: 34,
              height: 34,
              decoration: const BoxDecoration(
                color: _surface,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.arrow_forward_ios_rounded,
                  color: _purple, size: 14),
            ),
          ],
        ),
      ),
    );
  }
}