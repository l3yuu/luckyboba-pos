// FILE: lib/pages/landing_promo_page.dart
import 'package:flutter/material.dart';
import 'dart:async';
import '../pages/dashboard.dart';

class LandingPromoPage extends StatefulWidget {
  const LandingPromoPage({super.key});

  @override
  State<LandingPromoPage> createState() => _LandingPromoPageState();
}

class _LandingPromoPageState extends State<LandingPromoPage>
    with SingleTickerProviderStateMixin {

  late AnimationController _animationController;
  late Animation<double>   _scaleAnimation;
  late Animation<double>   _fadeAnimation;
  Timer? _timer;
  bool   _isNavigating = false;

  @override
  void initState() {
    super.initState();

    _animationController = AnimationController(
      vsync:    this,
      duration: const Duration(seconds: 5),
    );

    // Subtle zoom out: 1.08 → 1.0
    _scaleAnimation = Tween<double>(begin: 1.08, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve:  Curves.easeInOutSine,
      ),
    );

    // Gentle fade in over first 20% of animation
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve:  const Interval(0.0, 0.2, curve: Curves.easeIn),
      ),
    );

    _animationController.forward();

    // Auto-navigate after 5 seconds
    _timer = Timer(const Duration(seconds: 5), _navigateToNextScreen);
  }

  void _navigateToNextScreen() {
    if (_isNavigating || !mounted) return;
    setState(() => _isNavigating = true);

    Navigator.pushReplacement(
      context,
      PageRouteBuilder(
        pageBuilder:        (_, _, _) => const DashboardPage(),
        transitionsBuilder: (_, anim, _, child) =>
            FadeTransition(opacity: anim, child: child),
        transitionDuration: const Duration(milliseconds: 400),
      ),
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [

          // ── FULL SCREEN ZOOM-OUT IMAGE ──────────────────────────────
          SizedBox.expand(
            child: AnimatedBuilder(
              animation: _animationController,
              builder: (context, child) {
                return Opacity(
                  opacity: _fadeAnimation.value,
                  child: Transform.scale(
                    scale: _scaleAnimation.value,
                    child: child,
                  ),
                );
              },
              child: Image.asset(
                'assets/images/prompt_image.png',
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) => Container(
                  color: const Color(0xFF7C14D4),
                  child: const Center(
                    child: Icon(
                      Icons.local_cafe_rounded,
                      color: Colors.white,
                      size:  80,
                    ),
                  ),
                ),
              ),
            ),
          ),

          // ── GRADIENT OVERLAY (bottom) ───────────────────────────────
          Positioned(
            bottom: 0,
            left:   0,
            right:  0,
            height: 200,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin:  Alignment.topCenter,
                  end:    Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withValues(alpha: 0.6),
                  ],
                ),
              ),
            ),
          ),

          // ── SKIP BUTTON ─────────────────────────────────────────────
          SafeArea(
            child: Align(
              alignment: Alignment.topRight,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: TextButton(
                  onPressed: _navigateToNextScreen,
                  style: TextButton.styleFrom(
                    backgroundColor: Colors.black.withValues(alpha: 0.4),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 8),
                    shape: const StadiumBorder(),
                  ),
                  child: const Text(
                    'Skip',
                    style: TextStyle(
                      fontSize:   13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ),
          ),

          // ── PROGRESS BAR (bottom) ───────────────────────────────────
          Positioned(
            bottom: 0,
            left:   0,
            right:  0,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 0, 24, 20),
                child: AnimatedBuilder(
                  animation: _animationController,
                  builder: (_, _) => LinearProgressIndicator(
                    value:            _animationController.value,
                    backgroundColor:  Colors.white.withValues(alpha: 0.3),
                    valueColor: const AlwaysStoppedAnimation<Color>(
                        Colors.white),
                    borderRadius: BorderRadius.circular(4),
                    minHeight:    3,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}