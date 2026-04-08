import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../cart/delivery_page.dart';
import 'stores_page.dart';

// ── Same palette as HomePage ──────────────────────────────────────────────────
const Color _kPurple      = Color(0xFF7C3AED);
const Color _kPurpleLight = Color(0xFF9D4EDD);
const Color _kOrange      = Color(0xFFFF8C00);
const Color _kWhite       = Colors.white;
const Color _kBg          = Color(0xFFF4F4F8);

class OrderPage extends StatelessWidget {
  const OrderPage({super.key});

  @override
  Widget build(BuildContext context) {
    final topPad = MediaQuery.of(context).padding.top;

    return Container(
      color: _kBg,
      child: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Purple header ──────────────────────────────────────────
            _buildPurpleHeader(topPad),

            // ── White content area ─────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 28),

                  // Section label
                  Row(
                    children: [
                      const Icon(PhosphorIconsFill.shoppingBag,
                          color: _kPurple, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'Choose Your Order',
                        style: GoogleFonts.outfit(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF1A1A2E),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 6),
                  Text(
                    'How would you like your drinks today?',
                    style: GoogleFonts.outfit(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: Colors.grey[500],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // ── Delivery card ──────────────────────────────────────
                  _OrderCard(
                    title: 'Delivery',
                    subtitle: 'Order via GrabFood or foodpanda',
                    icon: PhosphorIconsFill.moped,
                    accentColor: const Color(0xFF00C853),
                    badge: 'FASTEST',
                    description:
                        'Get your favorite boba delivered straight to your door.',
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (_) => const DeliveryPage()),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // ── Store Pickup card ──────────────────────────────────
                  _OrderCard(
                    title: 'Store Pickup',
                    subtitle: 'Skip the line and pick up nearby',
                    icon: PhosphorIconsFill.storefront,
                    accentColor: _kPurple,
                    badge: 'POPULAR',
                    description:
                        'Order ahead and pick up fresh at your nearest branch.',
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const StoresPage()),
                    ),
                  ),

                  const SizedBox(height: 28),

                  // ── Info banner ────────────────────────────────────────
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          _kPurple.withValues(alpha: 0.08),
                          _kPurpleLight.withValues(alpha: 0.05),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                          color: _kPurple.withValues(alpha: 0.15)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: _kOrange.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Icon(PhosphorIconsFill.sparkle,
                              color: _kOrange, size: 22),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Earn points on every order!',
                                style: GoogleFonts.outfit(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w800,
                                  color: const Color(0xFF1A1A2E),
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Loyalty points are added automatically.',
                                style: GoogleFonts.outfit(
                                  fontSize: 11,
                                  color: Colors.grey[500],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 120),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPurpleHeader(double topPad) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        // Purple gradient background
        Container(
          width: double.infinity,
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF6D28D9), _kPurpleLight],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          padding: EdgeInsets.only(
              top: topPad + 16, left: 20, right: 20, bottom: 40),
          child: Column(
            children: [
              // Logo row
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Image.asset(
                    'assets/images/logo.png',
                    height: 40,
                    errorBuilder: (_, _, _) => const Icon(
                      PhosphorIconsFill.star,
                      color: _kOrange,
                      size: 36,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              Text(
                'Order Now',
                style: GoogleFonts.outfit(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  color: _kWhite,
                ),
              ),

              const SizedBox(height: 4),

              Text(
                'Fresh boba made just for you',
                style: GoogleFonts.outfit(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: Colors.white60,
                ),
              ),
            ],
          ),
        ),

        // Wave curve — same as HomePage
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: CustomPaint(
            size: const Size(double.infinity, 32),
            painter: _WavePainter(color: _kBg),
          ),
        ),
      ],
    );
  }
}

// ── Wave painter (identical to HomePage) ─────────────────────────────────────

class _WavePainter extends CustomPainter {
  final Color color;
  const _WavePainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = color;
    final path = Path()
      ..moveTo(0, size.height)
      ..quadraticBezierTo(
          size.width * 0.25, 0, size.width * 0.5, size.height * 0.5)
      ..quadraticBezierTo(size.width * 0.75, size.height, size.width, 0)
      ..lineTo(size.width, size.height)
      ..close();
    canvas.drawPath(path, paint);
    canvas.drawRect(
      Rect.fromLTWH(0, size.height - 2, size.width, 2),
      paint,
    );
  }

  @override
  bool shouldRepaint(_WavePainter old) => old.color != color;
}

// ── Order card ────────────────────────────────────────────────────────────────

class _OrderCard extends StatefulWidget {
  final String title, subtitle, badge, description;
  final IconData icon;
  final Color accentColor;
  final VoidCallback onTap;

  const _OrderCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.accentColor,
    required this.badge,
    required this.description,
    required this.onTap,
  });

  @override
  State<_OrderCard> createState() => _OrderCardState();
}

class _OrderCardState extends State<_OrderCard>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 100));
    _scale = Tween(begin: 1.0, end: 0.97)
        .animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOut));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      onTapDown: (_) => _ctrl.forward(),
      onTapUp: (_) => _ctrl.reverse(),
      onTapCancel: () => _ctrl.reverse(),
      child: ScaleTransition(
        scale: _scale,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(22),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.07),
                blurRadius: 14,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              // Icon
              Container(
                width: 62,
                height: 62,
                decoration: BoxDecoration(
                  color: widget.accentColor.withValues(alpha: 0.10),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Icon(widget.icon,
                    color: widget.accentColor, size: 28),
              ),
              const SizedBox(width: 16),
              // Text
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          widget.title,
                          style: GoogleFonts.outfit(
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF1A1A2E),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: widget.accentColor
                                .withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            widget.badge,
                            style: GoogleFonts.outfit(
                              fontSize: 8,
                              fontWeight: FontWeight.w900,
                              color: widget.accentColor,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      widget.subtitle,
                      style: GoogleFonts.outfit(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey[500],
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      widget.description,
                      style: GoogleFonts.outfit(
                        fontSize: 11,
                        color: Colors.grey[400],
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Icon(Icons.arrow_forward_ios_rounded,
                  color: Colors.grey[300], size: 14),
            ],
          ),
        ),
      ),
    );
  }
}