// FILE: lib/auth/onboarding_page.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'main.dart';

// ─────────────────────────────────────────────────────────────────────────────
// PREMIUM ONBOARDING — immersive product-image slides w/ glassmorphism
// ─────────────────────────────────────────────────────────────────────────────
class OnboardingPage extends StatefulWidget {
  const OnboardingPage({super.key});

  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends State<OnboardingPage>
    with TickerProviderStateMixin {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  // ── Brand tokens ──────────────────────────────────────────────────────────
  static const Color _purple     = Color(0xFF7C14D4);

  // ── Slide data ────────────────────────────────────────────────────────────
  static const List<_OnboardSlide> _slides = [
    _OnboardSlide(
      bgImage:       'assets/images/lucky_classic.png',
      gradientColors: [Color(0xFF2D0A4E), Color(0xFF7C14D4)],
      overlayOpacity: 0.55,
      emoji:         '🧋',
      badge:         'WELCOME',
      title:         'Your Boba,\nYour Way',
      subtitle:      'Browse our full menu, customize your drinks,\nand order ahead — right from your phone.',
      accentColor:   Color(0xFFFF8C00),
    ),
    _OnboardSlide(
      bgImage:       'assets/images/cheese_series.png',
      gradientColors: [Color(0xFF1A0A30), Color(0xFF5A0EA0)],
      overlayOpacity: 0.58,
      emoji:         '🎁',
      badge:         'EXCLUSIVE DEALS',
      title:         'Unlock Card\nPerks',
      subtitle:      'Get a Lucky Card for Buy 1 Get 1 Free,\n10% off all drinks, and more — redeemable via QR.',
      accentColor:   Color(0xFFFF6B9D),
    ),
    _OnboardSlide(
      bgImage:       'assets/images/frappe.png',
      gradientColors: [Color(0xFF0D0D1A), Color(0xFF3D2066)],
      overlayOpacity: 0.60,
      emoji:         '⭐',
      badge:         'EARN REWARDS',
      title:         'Collect Lucky\nPoints',
      subtitle:      'Every sip earns points you can redeem\nfor free drinks, upgrades, and special rewards.',
      accentColor:   Color(0xFFFFD580),
    ),
  ];

  // ── Animation controllers ─────────────────────────────────────────────────
  late final AnimationController _entryCtrl;
  late final Animation<double>  _entryFade;
  late final Animation<Offset>  _entrySlide;

  late final AnimationController _floatCtrl;
  late final Animation<double>  _floatAnim;

  late final AnimationController _shimmerCtrl;

  // Per-slide staggered content animations
  late final List<AnimationController> _contentCtrl;
  late final List<Animation<double>>   _contentFade;
  late final List<Animation<Offset>>   _contentSlide;

  @override
  void initState() {
    super.initState();

    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor:          Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ));

    // Entry animation (first load)
    _entryCtrl = AnimationController(
      vsync: this, duration: const Duration(milliseconds: 900),
    );
    _entryFade = CurvedAnimation(parent: _entryCtrl, curve: Curves.easeOut);
    _entrySlide = Tween<Offset>(
      begin: const Offset(0, 0.08), end: Offset.zero,
    ).animate(CurvedAnimation(parent: _entryCtrl, curve: Curves.easeOut));

    // Continuous floating animation for decorative elements
    _floatCtrl = AnimationController(
      vsync: this, duration: const Duration(milliseconds: 3000),
    )..repeat(reverse: true);
    _floatAnim = Tween<double>(begin: -8, end: 8).animate(
      CurvedAnimation(parent: _floatCtrl, curve: Curves.easeInOut),
    );

    // Shimmer for CTA button
    _shimmerCtrl = AnimationController(
      vsync: this, duration: const Duration(milliseconds: 2200),
    )..repeat();

    // Per-slide content animations
    _contentCtrl = List.generate(
      _slides.length,
      (_) => AnimationController(
        vsync: this, duration: const Duration(milliseconds: 650),
      ),
    );
    _contentFade = _contentCtrl
        .map((c) => CurvedAnimation(parent: c, curve: Curves.easeOut))
        .toList();
    _contentSlide = _contentCtrl
        .map((c) => Tween<Offset>(
              begin: const Offset(0, 0.12),
              end: Offset.zero,
            ).animate(CurvedAnimation(parent: c, curve: Curves.easeOut)))
        .toList();

    // Start
    _entryCtrl.forward();
    _contentCtrl[0].forward();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _entryCtrl.dispose();
    _floatCtrl.dispose();
    _shimmerCtrl.dispose();
    for (final c in _contentCtrl) {
      c.dispose();
    }
    super.dispose();
  }

  void _onPageChanged(int index) {
    setState(() => _currentPage = index);
    _contentCtrl[index].forward(from: 0);
  }

  Future<void> _finish() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboarding_done', true);
    if (!mounted) return;
    Navigator.pushReplacement(
      context,
      PageRouteBuilder(
        pageBuilder: (_, _, _) => const LoginPage(),
        transitionsBuilder: (_, anim, _, child) =>
            FadeTransition(opacity: anim, child: child),
        transitionDuration: const Duration(milliseconds: 500),
      ),
    );
  }

  void _next() {
    if (_currentPage < _slides.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOut,
      );
    } else {
      _finish();
    }
  }

  // ── BUILD ─────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final isLast = _currentPage == _slides.length - 1;
    final mq = MediaQuery.of(context);

    return Scaffold(
      body: FadeTransition(
        opacity: _entryFade,
        child: SlideTransition(
          position: _entrySlide,
          child: Stack(
            children: [
              // ── BACKGROUND PAGE VIEW ──────────────────────────────────
              PageView.builder(
                controller: _pageController,
                onPageChanged: _onPageChanged,
                itemCount: _slides.length,
                itemBuilder: (_, index) => _buildSlide(index, mq),
              ),

              // TOP BAR REMOVED

              // ── BOTTOM CONTROLS ───────────────────────────────────────
              Positioned(
                bottom: 0, left: 0, right: 0,
                child: SafeArea(
                  top: false,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 0, 24, 28),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // CTA Button
                        _buildCTAButton(isLast),
                        const SizedBox(height: 22),
                        // Progress dots
                        _buildProgressDots(),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── INDIVIDUAL SLIDE ────────────────────────────────────────────────────
  Widget _buildSlide(int index, MediaQueryData mq) {
    final slide = _slides[index];

    return Stack(
      fit: StackFit.expand,
      children: [
        // Background image
        Image.asset(
          slide.bgImage,
          fit: BoxFit.cover,
          errorBuilder: (_, _, _) => Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: slide.gradientColors,
              ),
            ),
          ),
        ),

        // Dark gradient overlay
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              stops: const [0.0, 0.3, 0.6, 1.0],
              colors: [
                Colors.black.withValues(alpha: slide.overlayOpacity * 0.6),
                Colors.black.withValues(alpha: slide.overlayOpacity * 0.4),
                Colors.black.withValues(alpha: slide.overlayOpacity * 0.85),
                Colors.black.withValues(alpha: 0.92),
              ],
            ),
          ),
        ),

        // Decorative floating orbs
        AnimatedBuilder(
          animation: _floatAnim,
          builder: (_, _) => Stack(
            children: [
              Positioned(
                top: mq.size.height * 0.12 + _floatAnim.value,
                right: -30,
                child: _glowOrb(120, slide.accentColor.withValues(alpha: 0.08)),
              ),
              Positioned(
                top: mq.size.height * 0.35 - _floatAnim.value * 0.5,
                left: -40,
                child: _glowOrb(90, _purple.withValues(alpha: 0.10)),
              ),
              Positioned(
                bottom: mq.size.height * 0.25 + _floatAnim.value * 0.7,
                right: 20,
                child: _glowOrb(60, slide.accentColor.withValues(alpha: 0.06)),
              ),
            ],
          ),
        ),

        // Content
        FadeTransition(
          opacity: _contentFade[index],
          child: SlideTransition(
            position: _contentSlide[index],
            child: Padding(
              padding: EdgeInsets.fromLTRB(
                28, mq.padding.top + 80, 28, 200,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    slide.title,
                    style: GoogleFonts.poppins(
                      fontSize: 38,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                      height: 1.1,
                      letterSpacing: -0.5,
                      shadows: [
                        Shadow(color: Colors.black.withValues(alpha: 0.8), blurRadius: 8, offset: const Offset(0, 2)),
                        Shadow(color: Colors.black.withValues(alpha: 0.8), blurRadius: 16, offset: const Offset(0, 4)),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  Text(
                    slide.subtitle,
                    style: GoogleFonts.poppins(
                      fontSize: 14.5,
                      color: Colors.white,
                      height: 1.6,
                      fontWeight: FontWeight.w500,
                      shadows: [
                        Shadow(color: Colors.black.withValues(alpha: 0.8), blurRadius: 6, offset: const Offset(0, 2)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildProgressDots() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.start,
      children: List.generate(_slides.length, (i) {
        final active = i == _currentPage;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 350),
          curve: Curves.easeInOut,
          margin: const EdgeInsets.only(right: 8),
          width: active ? 28 : 8,
          height: 8,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(4),
            color: active ? const Color(0xFFA64DFF) : Colors.white.withValues(alpha: 0.3),
            boxShadow: active
                ? [
                    BoxShadow(
                      color: const Color(0xFFA64DFF).withValues(alpha: 0.4),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
        );
      }),
    );
  }

  // ── CTA BUTTON ────────────────────────────────────────────────────────────
  Widget _buildCTAButton(bool isLast) {
    return GestureDetector(
      onTap: _next,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 18),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          gradient: const LinearGradient(
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
            colors: [Color(0xFFA64DFF), Color(0xFFC47AFF)],
          ),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFFA64DFF).withValues(alpha: 0.45),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              isLast ? 'Get Started' : 'Continue',
              style: GoogleFonts.poppins(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: Colors.white,
                letterSpacing: 0.3,
              ),
            ),
            const SizedBox(width: 8),
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 300),
              child: Icon(
                isLast ? Icons.local_cafe_rounded : Icons.arrow_forward_rounded,
                key: ValueKey(isLast),
                color: Colors.white,
                size: 20,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── HELPERS ───────────────────────────────────────────────────────────────
  Widget _glowOrb(double size, Color color) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color,
        boxShadow: [
          BoxShadow(color: color, blurRadius: size * 0.8),
        ],
      ),
    );
  }
}

// ── DATA CLASS ──────────────────────────────────────────────────────────────
class _OnboardSlide {
  final String       bgImage;
  final List<Color>  gradientColors;
  final double       overlayOpacity;
  final String       emoji;
  final String       badge;
  final String       title;
  final String       subtitle;
  final Color        accentColor;

  const _OnboardSlide({
    required this.bgImage,
    required this.gradientColors,
    required this.overlayOpacity,
    required this.emoji,
    required this.badge,
    required this.title,
    required this.subtitle,
    required this.accentColor,
  });
}