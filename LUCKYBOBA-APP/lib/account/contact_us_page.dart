// FILE: lib/account/contact_us_page.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

class ContactUsPage extends StatelessWidget {
  const ContactUsPage({super.key});

  static const Color _purple   = Color(0xFF7C14D4);
  static const Color _orange   = Color(0xFFFF8C00);
  static const Color _bg       = Color(0xFFFAFAFA);
  static const Color _surface  = Color(0xFFF2EEF8);
  static const Color _textDark = Color(0xFF1A1A2E);
  static const Color _textMid  = Color(0xFF6B6B8A);

  // Safely launch URL with try-catch to prevent ACTIVITY_NOT_FOUND crashes
  Future<void> _launch(BuildContext context, String urlString) async {
    // Automatically add 'mailto:' if it's a raw email address
    if (urlString.contains('@') && !urlString.startsWith('mailto:') && !urlString.startsWith('http')) {
      urlString = 'mailto:$urlString';
    }

    final Uri url = Uri.parse(urlString);

    try {
      if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Could not open the app for this link.', style: GoogleFonts.poppins(fontSize: 13)),
              backgroundColor: Colors.redAccent,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('❌ UrlLauncher Error: $e');
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('No compatible app found to open this link.', style: GoogleFonts.poppins(fontSize: 13)),
            backgroundColor: Colors.orange,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
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
                  Text('Contact Us',
                      style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w700, color: _textDark)),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 30),
                child: Column(
                  children: [
                    // Hero banner
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [_purple, _purple.withValues(alpha: 0.80)],
                          begin: Alignment.topLeft, end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Column(
                        children: [
                          Container(
                            width: 64, height: 64,
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.15),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.support_agent_rounded, color: Colors.white, size: 32),
                          ),
                          const SizedBox(height: 12),
                          Text('We\'re here to help!',
                              style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white)),
                          const SizedBox(height: 4),
                          Text('Reach us through any of the channels below',
                              style: GoogleFonts.poppins(fontSize: 12, color: Colors.white.withValues(alpha: 0.80)),
                              textAlign: TextAlign.center),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    _sectionLabel('Call or Message'),
                    const SizedBox(height: 10),
                    _contactCard(context, [
                      _ContactItem(
                        icon: Icons.phone_rounded,
                        label: 'Phone',
                        value: '+63 912 345 6789',
                        color: const Color(0xFF22C55E),
                        onTap: () => _launch(context, 'tel:+639123456789'),
                        onLongPress: () {
                          Clipboard.setData(const ClipboardData(text: '+63 912 345 6789'));
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Phone number copied!', style: GoogleFonts.poppins(fontSize: 13)),
                              backgroundColor: _purple, behavior: SnackBarBehavior.floating,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          );
                        },
                      ),
                      _ContactItem(
                        icon: Icons.email_rounded,
                        label: 'Email',
                        value: 'luckyboba.tech@gmail.com',
                        color: _orange,
                        onTap: () => _launch(context, 'mailto:luckyboba.tech@gmail.com'),
                        onLongPress: () {
                          Clipboard.setData(const ClipboardData(text: 'luckyboba.tech@gmail.com'));
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Email copied!', style: GoogleFonts.poppins(fontSize: 13)),
                              backgroundColor: _purple, behavior: SnackBarBehavior.floating,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          );
                        },
                      ),
                    ]),

                    const SizedBox(height: 16),

                    _sectionLabel('Social Media'),
                    const SizedBox(height: 10),
                    _contactCard(context, [
                      _ContactItem(
                        icon: Icons.facebook_rounded,
                        label: 'Facebook',
                        value: 'Lucky Boba',
                        color: const Color(0xFF1877F2),
                        onTap: () => _launch(context, 'https://www.facebook.com/share/1DSMD1uSEG/'),
                      ),
                      _ContactItem(
                        icon: Icons.language_rounded,
                        label: 'Website',
                        value: 'luckybobamilktea.com',
                        color: _purple,
                        onTap: () => _launch(context, 'https://www.luckybobamilktea.com/'),
                      ),
                    ]),

                    const SizedBox(height: 16),

                    _sectionLabel('Business Hours'),
                    const SizedBox(height: 10),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: const Color(0xFFEAEAF0)),
                        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 10, offset: const Offset(0, 4))],
                      ),
                      child: Column(
                        children: [
                          _hoursRow('Monday – Friday',  '9:00 AM – 9:00 PM'),
                          const SizedBox(height: 8),
                          _hoursRow('Saturday',          '10:00 AM – 10:00 PM'),
                          const SizedBox(height: 8),
                          _hoursRow('Sunday',            '10:00 AM – 8:00 PM'),
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

  Widget _sectionLabel(String label) => Align(
    alignment: Alignment.centerLeft,
    child: Text(label,
        style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: _textMid, letterSpacing: 0.5)),
  );

  Widget _contactCard(BuildContext context, List<_ContactItem> items) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFEAEAF0)),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        children: items.asMap().entries.map((e) {
          final item   = e.value;
          final isLast = e.key == items.length - 1;
          return Column(
            children: [
              InkWell(
                onTap:      item.onTap,
                onLongPress: item.onLongPress,
                borderRadius: BorderRadius.circular(18),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  child: Row(
                    children: [
                      Container(
                        width: 42, height: 42,
                        decoration: BoxDecoration(
                          color: item.color.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(item.icon, color: item.color, size: 22),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(item.label,
                                style: GoogleFonts.poppins(fontSize: 11, color: _textMid)),
                            Text(item.value,
                                style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600, color: _textDark)),
                          ],
                        ),
                      ),
                      Icon(Icons.arrow_forward_ios_rounded, color: item.color.withValues(alpha: 0.5), size: 14),
                    ],
                  ),
                ),
              ),
              if (!isLast)
                Padding(
                  padding: const EdgeInsets.only(left: 70, right: 16),
                  child: Divider(height: 1, color: Colors.grey[100]),
                ),
            ],
          );
        }).toList(),
      ),
    );
  }

  Widget _hoursRow(String day, String hours) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(day, style: GoogleFonts.poppins(fontSize: 13, color: _textMid)),
        Text(hours, style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: _textDark)),
      ],
    );
  }
}

class _ContactItem {
  final IconData     icon;
  final String       label;
  final String       value;
  final Color        color;
  final VoidCallback onTap;
  final VoidCallback? onLongPress;
  const _ContactItem({required this.icon, required this.label, required this.value,
    required this.color, required this.onTap, this.onLongPress});
}