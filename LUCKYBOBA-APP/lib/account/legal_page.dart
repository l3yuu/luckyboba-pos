// FILE: lib/pages/legal_page.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

enum LegalType { privacy, terms }

class LegalPage extends StatelessWidget {
  final LegalType type;
  const LegalPage({super.key, required this.type});

  static const Color _purple   = Color(0xFF7C14D4);
  static const Color _bg       = Color(0xFFFAFAFA);
  static const Color _surface  = Color(0xFFF2EEF8);
  static const Color _textDark = Color(0xFF1A1A2E);
  static const Color _textMid  = Color(0xFF6B6B8A);

  @override
  Widget build(BuildContext context) {
    final isPrivacy = type == LegalType.privacy;
    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      width: 40, height: 40,
                      decoration: const BoxDecoration(color: _surface, shape: BoxShape.circle),
                      child: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: _purple),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(isPrivacy ? 'Privacy Policy' : 'Terms & Conditions',
                        style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w700, color: _textDark)),
                  ),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 30),
                physics: const BouncingScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: isPrivacy ? _privacySections() : _termsSections(),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _privacySections() => [
    _lastUpdated('January 1, 2025'),
    _intro('Lucky Boba  ("we," "us," or "our") is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our mobile application.'),
    _section('1. Information We Collect', [
      'Personal identification information (name, email address, phone number)',
      'Order history and transaction data',
      'Device information and usage analytics',
      'Location data (only when you allow it, for branch finding)',
    ]),
    _section('2. How We Use Your Information', [
      'To process and fulfill your orders',
      'To send order status updates and notifications',
      'To improve our products and services',
      'To personalize your app experience',
      'To comply with legal obligations',
    ]),
    _section('3. Data Sharing', [
      'We do not sell your personal information to third parties.',
      'We may share data with service providers who assist us in operating the app.',
      'We may disclose information when required by law.',
    ]),
    _section('4. Data Security', [
      'We implement industry-standard security measures to protect your data.',
      'All payment transactions are encrypted using SSL technology.',
      'We regularly review and update our security practices.',
    ]),
    _section('5. Your Rights', [
      'Access and receive a copy of your personal data',
      'Request correction of inaccurate data',
      'Request deletion of your account and data',
      'Opt out of marketing communications at any time',
    ]),
    _section('6. Contact Us', [
      'For privacy-related concerns, contact us at luckyboba.tech@gmail.com or through the Contact Us page in the app.',
    ]),
  ];

  List<Widget> _termsSections() => [
    _lastUpdated('January 1, 2025'),
    _intro('By using the Lucky Boba mobile application, you agree to be bound by these Terms and Conditions. Please read them carefully before using our services.'),
    _section('1. Acceptance of Terms', [
      'By accessing or using the Lucky Boba app, you agree to these terms.',
      'If you do not agree, you may not use our services.',
      'We reserve the right to update these terms at any time.',
    ]),
    _section('2. Use of the App', [
      'You must be at least 13 years old to use this app.',
      'You are responsible for maintaining the security of your account.',
      'You agree not to use the app for any unlawful purpose.',
      'You may not attempt to interfere with the proper working of the app.',
    ]),
    _section('3. Orders and Payments', [
      'All prices are in Philippine Peso (₱) and inclusive of applicable taxes.',
      'Orders are subject to availability and confirmation.',
      'We reserve the right to cancel orders due to pricing errors or stock issues.',
      'Refunds are processed in accordance with our refund policy.',
    ]),
    _section('4. Intellectual Property', [
      'All content in the app is owned by Lucky Boba.',
      'You may not reproduce, distribute, or create derivative works without permission.',
      'The Lucky Boba name and logo are registered trademarks.',
    ]),
    _section('5. Limitation of Liability', [
      'Lucky Boba is not liable for indirect or consequential damages.',
      'Our liability is limited to the amount paid for the disputed order.',
      'We do not warrant uninterrupted or error-free service.',
    ]),
    _section('6. Governing Law', [
      'These terms are governed by the laws of the Republic of the Philippines.',
      'Any disputes shall be resolved in the courts of the Philippines.',
    ]),
  ];

  Widget _lastUpdated(String date) => Padding(
    padding: const EdgeInsets.only(bottom: 16),
    child: Text('Last updated: $date',
        style: GoogleFonts.poppins(fontSize: 12, color: _textMid, fontStyle: FontStyle.italic)),
  );

  Widget _intro(String text) => Container(
    margin: const EdgeInsets.only(bottom: 20),
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: _purple.withValues(alpha: 0.07),
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: _purple.withValues(alpha: 0.15)),
    ),
    child: Text(text, style: GoogleFonts.poppins(fontSize: 13, color: _textDark, height: 1.6)),
  );

  Widget _section(String title, List<String> points) => Padding(
    padding: const EdgeInsets.only(bottom: 20),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title,
            style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700, color: _textDark)),
        const SizedBox(height: 8),
        ...points.map((p) => Padding(
          padding: const EdgeInsets.only(bottom: 6),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Padding(
                padding: EdgeInsets.only(top: 6),
                child: CircleAvatar(radius: 3, backgroundColor: _purple),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(p,
                    style: GoogleFonts.poppins(fontSize: 13, color: _textMid, height: 1.5)),
              ),
            ],
          ),
        )),
      ],
    ),
  );
}