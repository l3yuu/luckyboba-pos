import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'landing_promo_page.dart';
import 'main.dart';

class TermsPage extends StatefulWidget {
  const TermsPage({super.key});

  @override
  State<TermsPage> createState() => _TermsPageState();
}

class _TermsPageState extends State<TermsPage> {
  final ScrollController _scrollCtrl = ScrollController();

  @override
  void dispose() {
    _scrollCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F4F9),
      body: Stack(
        children: [
          // Background gradient bubble (matching login/signup)
          Positioned(
            top: -150,
            left: -150,
            child: Container(
              width: 400,
              height: 400,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFFD4B4FF).withValues(alpha: 0.35),
              ),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 80, sigmaY: 80),
                child: Container(color: Colors.transparent),
              ),
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: Column(
                children: [
                  // Top row: back button + title
                  Row(
                    children: [
                      GestureDetector(
                        onTap: () => Navigator.pushReplacement(
                          context,
                          MaterialPageRoute(builder: (_) => const LoginPage()),
                        ),
                        child: Container(
                          width: 40, height: 40,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.05),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFF8B3AFA), size: 16),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Text(
                        'Terms of Use',
                        style: GoogleFonts.outfit(
                          color: const Color(0xFF8B3AFA),
                          fontSize: 24,
                          fontWeight: FontWeight.w800,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Last updated
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Padding(
                      padding: const EdgeInsets.only(left: 56),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'LAST UPDATED',
                            style: GoogleFonts.poppins(
                              color: Colors.black38,
                              fontSize: 9,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 1.5,
                            ),
                          ),
                          Text(
                            'February 2026',
                            style: GoogleFonts.poppins(
                              color: const Color(0xFF8B3AFA),
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Terms content card
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.04),
                            blurRadius: 20,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Scrollbar(
                        controller: _scrollCtrl,
                        thumbVisibility: true,
                        radius: const Radius.circular(10),
                        child: SingleChildScrollView(
                          controller: _scrollCtrl,
                          physics: const BouncingScrollPhysics(),
                          padding: const EdgeInsets.only(right: 8),
                          child: _buildRichTerms(),
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Action buttons
                  Column(
                    children: [
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: OutlinedButton(
                          onPressed: () {
                            Navigator.pushReplacement(
                              context,
                              MaterialPageRoute(builder: (_) => const LoginPage()),
                            );
                          },
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Color(0xFFCCC4D6)),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: Text(
                            'Decline',
                            style: GoogleFonts.poppins(
                              color: Colors.black54,
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        height: 50,
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
                              MaterialPageRoute(builder: (_) => const LandingPromoPage()),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFA64DFF),
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: Text(
                            'I Accept',
                            style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRichTerms() {
    final sections = [
      _TermsSection(
        number: '1',
        title: 'Introduction',
        body: 'Welcome to Lucky Boba. By accessing or using our mobile application, you agree to be bound by these Terms and Conditions.',
      ),
      _TermsSection(
        number: '2',
        title: 'Use of Service',
        body: 'You agree to use this application only for lawful purposes and in accordance with the company\'s operational guidelines. Unauthorized access to the backend system is strictly prohibited.',
      ),
      _TermsSection(
        number: '3',
        title: 'Privacy Policy',
        body: 'We value your privacy. Your login credentials and sales data are stored securely. We do not share your personal information with third parties without consent.',
      ),
      _TermsSection(
        number: '4',
        title: 'User Responsibilities',
        body: null,
        bullets: [
          'You are responsible for maintaining the confidentiality of your account password.',
          'You must report any unauthorized use of your account immediately.',
          'The POS system is for authorized staff only.',
        ],
      ),
      _TermsSection(
        number: '5',
        title: 'Intellectual Property',
        body: 'All content, logos, and graphics within this app are the property of Lucky Boba and are protected by copyright laws.',
      ),
      _TermsSection(
        number: '6',
        title: 'Termination',
        body: 'We reserve the right to terminate or suspend access to our service immediately, without prior notice, for any breach of these Terms.',
      ),
      _TermsSection(
        number: '7',
        title: 'Changes to Terms',
        body: 'We may update our Terms and Conditions from time to time. You are advised to review this page periodically for any changes.',
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: sections.map((s) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${s.number}. ${s.title}',
                style: GoogleFonts.poppins(
                  color: const Color(0xFF8B3AFA),
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 8),
              if (s.body != null)
                Text(
                  s.body!,
                  style: GoogleFonts.poppins(
                    color: Colors.black87,
                    fontSize: 13,
                    height: 1.7,
                  ),
                ),
              if (s.bullets != null)
                Container(
                  margin: const EdgeInsets.only(top: 4),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    border: Border.all(color: const Color(0xFFE0D6ED)),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: s.bullets!.map((b) => Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('•  ', style: TextStyle(color: Color(0xFF8B3AFA), fontSize: 13)),
                          Expanded(
                            child: Text(
                              b,
                              style: GoogleFonts.poppins(
                                color: Colors.black87,
                                fontSize: 12.5,
                                height: 1.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                    )).toList(),
                  ),
                ),
            ],
          ),
        );
      }).toList(),
    );
  }
}

class _TermsSection {
  final String number;
  final String title;
  final String? body;
  final List<String>? bullets;
  _TermsSection({required this.number, required this.title, this.body, this.bullets});
}