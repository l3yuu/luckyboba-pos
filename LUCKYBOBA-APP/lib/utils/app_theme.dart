import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  AppTheme._();

  // ── COLORS ─────────────────────────────────────────────────────────────────
  static const Color primary      = Color(0xFF7C14D4); // Lucky Purple
  static const Color primaryLight = Color(0xFF9F58FF);
  static const Color primaryDark  = Color(0xFF4A0D80);
  static const Color secondary    = Color(0xFFFF8C00); // Lucky Orange
  static const Color accent       = Color(0xFFFFD700); // Gold
  static const Color background   = Color(0xFFF9F9FB);
  static const Color surface      = Colors.white;
  static const Color textDark     = Color(0xFF1E1E2C);
  static const Color textMid      = Color(0xFF6E6E85);
  static const Color cardBg       = Color(0xFFF2F2F7);

  // ── GRADIENTS ──────────────────────────────────────────────────────────────
  static const LinearGradient primaryGradient = LinearGradient(
    begin:  Alignment.topLeft,
    end:    Alignment.bottomRight,
    colors: [primary, primaryLight],
  );

  static const LinearGradient glassGradient = LinearGradient(
    begin:  Alignment.topLeft,
    end:    Alignment.bottomRight,
    colors: [
      Colors.white60,
      Colors.white24,
    ],
  );

  static const Duration kAnimationDuration = Duration(milliseconds: 250);

  // ── DECORATIONS ────────────────────────────────────────────────────────────
  static BoxDecoration glassDecoration({
    double borderRadius = 24,
    double borderAlpha = 0.15,
    double blur = 15,
    double opacity = 0.08,
    Color? shadowColor,
    double shadowBlur = 18,
  }) {
    return BoxDecoration(
      color: Colors.white.withValues(alpha: opacity),
      borderRadius: BorderRadius.circular(borderRadius),
      border: Border.all(
        color: Colors.white.withValues(alpha: borderAlpha),
        width: 1.0,
      ),
      boxShadow: shadowColor != null
          ? [
              BoxShadow(
                color: shadowColor.withValues(alpha: 0.15),
                blurRadius: shadowBlur,
                offset: const Offset(0, 8),
              ),
            ]
          : null,
    );
  }

  static BoxDecoration cleanShadow = BoxDecoration(
    color: Colors.white,
    borderRadius: BorderRadius.circular(24),
    boxShadow: [
      BoxShadow(
        color: Colors.black.withValues(alpha: 0.04),
        blurRadius: 16,
        offset: const Offset(0, 4),
      ),
    ],
  );

  static BoxDecoration premiumCard = BoxDecoration(
    color:        Colors.white,
    borderRadius: BorderRadius.circular(28),
    boxShadow: [
      BoxShadow(
        color:      primary.withValues(alpha: 0.05),
        blurRadius: 20,
        offset:     const Offset(0, 8),
      ),
    ],
  );

  // ── TEXT STYLES ────────────────────────────────────────────────────────────
  static TextStyle get heading => GoogleFonts.outfit(
    fontSize:   28,
    fontWeight: FontWeight.w800,
    color:      textDark,
    letterSpacing: -0.5,
  );

  static TextStyle get subHeading => GoogleFonts.outfit(
    fontSize:      18,
    fontWeight:    FontWeight.w700,
    color:         textDark,
    letterSpacing: -0.2,
  );

  static TextStyle get body => GoogleFonts.poppins(
    fontSize: 14,
    color:    textMid,
  );

  static TextStyle get buttonText => GoogleFonts.outfit(
    fontSize:      15,
    fontWeight:    FontWeight.w700,
    color:         Colors.white,
    letterSpacing: 0.5,
  );

  // ── INPUT DECORATION ───────────────────────────────────────────────────────
  static InputDecoration inputStyle({
    required String    hint,
    required IconData  icon,
    Widget?            suffixIcon,
  }) {
    return InputDecoration(
      hintText:  hint,
      hintStyle: GoogleFonts.poppins(color: textMid.withValues(alpha: 0.5), fontSize: 14),
      filled:    true,
      fillColor: Colors.white.withValues(alpha: 0.8),
      prefixIcon: Icon(icon, color: primary, size: 22),
      suffixIcon: suffixIcon,
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide:   BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide:   BorderSide(color: primary.withValues(alpha: 0.1), width: 1.5),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide:   const BorderSide(color: primary, width: 2),
      ),
    );
  }
}
