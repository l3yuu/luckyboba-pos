import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/app_theme.dart';
import 'landing_promo_page.dart';
import 'main.dart';

class TermsPage extends StatelessWidget {
  const TermsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: Stack(
        children: [
          // Background Image
          Positioned.fill(
            child: Image.asset(
              'assets/images/prompt_image.png',
              fit: BoxFit.cover,
              color: Colors.black.withValues(alpha: 0.5),
              colorBlendMode: BlendMode.darken,
            ),
          ),
          // Gradient Overlay
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    AppTheme.primary.withValues(alpha: 0.3),
                    Colors.black.withValues(alpha: 0.8),
                  ],
                ),
              ),
            ),
          ),
          // Blur Filter
          Positioned.fill(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
              child: Container(color: Colors.transparent),
            ),
          ),
          SafeArea(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
                child: Column(
                  children: [
                    // Header Logo/Icon
                    Hero(
                      tag: 'app_logo',
                      child: Container(
                        width: 80, height: 80,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.primary.withValues(alpha: 0.4),
                              blurRadius: 30,
                              spreadRadius: 5,
                            ),
                          ],
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                        child: ClipOval(
                          child: Image.asset('assets/images/lucky_logo.jpg', fit: BoxFit.cover),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'Terms of Use',
                      style: GoogleFonts.outfit(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Please read carefully before proceeding',
                      style: AppTheme.body.copyWith(color: Colors.white70, fontSize: 13),
                    ),
                    const SizedBox(height: 32),
                    // Terms Card
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(24),
                        decoration: AppTheme.glassDecoration(borderRadius: 32),
                        child: Column(
                          children: [
                            Expanded(
                              child: Scrollbar(
                                thumbVisibility: true,
                                radius: const Radius.circular(10),
                                child: SingleChildScrollView(
                                  physics: const BouncingScrollPhysics(),
                                  padding: const EdgeInsets.only(right: 12),
                                  child: Text(
                                    _mockTermsData,
                                    style: AppTheme.body.copyWith(
                                      color: Colors.white.withValues(alpha: 0.85),
                                      fontSize: 14,
                                      height: 1.7,
                                    ),
                                    textAlign: TextAlign.justify,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 32),
                    // Action Buttons
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () {
                              Navigator.pushReplacement(
                                context,
                                MaterialPageRoute(builder: (context) => const LoginPage()),
                              );
                            },
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: Colors.white38),
                              padding: const EdgeInsets.symmetric(vertical: 18),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                            ),
                            child: Text(
                              "Decline",
                              style: AppTheme.buttonText.copyWith(color: Colors.white70),
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () async {
                              final prefs = await SharedPreferences.getInstance();
                              final int? userId = prefs.getInt('user_id');
                              final String? userIdStr = prefs.getString('user_id_str');
                              final String userKey = userId?.toString() ?? userIdStr ?? '';

                              if (userKey.isNotEmpty) {
                                await prefs.setBool('has_accepted_terms_$userKey', true);
                              }

                              if (!context.mounted) return;
                              Navigator.pushReplacement(
                                context,
                                MaterialPageRoute(builder: (context) => const LandingPromoPage()),
                              );
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.secondary,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 18),
                              elevation: 0,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                            ),
                            child: Text(
                              "I Accept",
                              style: AppTheme.buttonText.copyWith(fontWeight: FontWeight.w800),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

const String _mockTermsData = """
1. INTRODUCTION
Welcome to Lucky Boba. By accessing or using our mobile application, you agree to be bound by these Terms and Conditions.

2. USE OF SERVICE
You agree to use this application only for lawful purposes and in accordance with the company's operational guidelines. Unauthorized access to the backend system is strictly prohibited.

3. PRIVACY POLICY
We value your privacy. Your login credentials and sales data are stored securely. We do not share your personal information with third parties without consent.

4. USER RESPONSIBILITIES
- You are responsible for maintaining the confidentiality of your account password.
- You must report any unauthorized use of your account immediately.
- The POS system is for authorized staff only.

5. INTELLECTUAL PROPERTY
All content, logos, and graphics within this app are the property of Lucky Boba and are protected by copyright laws.

6. TERMINATION
We reserve the right to terminate or suspend access to our service immediately, without prior notice, for any breach of these Terms.

7. CHANGES TO TERMS
We may update our Terms and Conditions from time to time. You are advised to review this page periodically for any changes.

Last Updated: February 2026
""";