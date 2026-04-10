// FILE: lib/account/language_page.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';

// ── Global language notifier (same pattern as profileImageNotifier) ───────────
// Import and listen to this anywhere in your app to react to language changes.
final ValueNotifier<String> appLanguageNotifier = ValueNotifier<String>('en');

// ── Translation helper ────────────────────────────────────────────────────────
// Usage: t('hello') returns 'Hello' or 'Kamusta' depending on selected language.
String t(String key) {
  final lang = appLanguageNotifier.value;
  return _strings[lang]?[key] ?? _strings['en']![key] ?? key;
}

const Map<String, Map<String, String>> _strings = {
  'en': {
    // Common UI
    'language':          'Language',
    'select_language':   'Select your preferred language',
    'language_updated':  'Language updated!',
    'info_note':         'App language has been changed. Some screens may require a restart to fully update.',

    // Profile page
    'my_profile':        'My Profile',
    'edit_display_name': 'Edit Display Name',
    'account_settings':  'Account Settings',
    'order_history':     'Order History',
    'notifications':     'Notifications',
    'contact_us':        'Contact Us',
    'privacy_policy':    'Privacy Policy',
    'terms':             'Terms & Conditions',
    'log_out':           'Log Out',
    'log_out_confirm':   'Are you sure you want to log out?',
    'cancel':            'Cancel',
    'save':              'Save',

    // Account settings
    'email':             'Email',
    'password':          'Password',
    'phone':             'Phone',

    // Orders
    'no_orders':         'No orders yet',
    'order_placed':      'Order placed',

    // Notifications
    'no_notifications':  'No notifications',
  },
  'fil': {
    // Common UI
    'language':          'Wika',
    'select_language':   'Piliin ang iyong gustong wika',
    'language_updated':  'Na-update ang wika!',
    'info_note':         'Nabago na ang wika ng app. Maaaring kailanganin ng ilang screen na i-restart para mag-update nang buo.',

    // Profile page
    'my_profile':        'Aking Profile',
    'edit_display_name': 'Baguhin ang Display Name',
    'account_settings':  'Mga Setting ng Account',
    'order_history':     'Kasaysayan ng Order',
    'notifications':     'Mga Abiso',
    'contact_us':        'Makipag-ugnayan',
    'privacy_policy':    'Patakaran sa Privacy',
    'terms':             'Mga Tuntunin at Kundisyon',
    'log_out':           'Mag-logout',
    'log_out_confirm':   'Sigurado ka bang gusto mong mag-logout?',
    'cancel':            'Kanselahin',
    'save':              'I-save',

    // Account settings
    'email':             'Email',
    'password':          'Password',
    'phone':             'Telepono',

    // Orders
    'no_orders':         'Wala pang mga order',
    'order_placed':      'Na-place ang order',

    // Notifications
    'no_notifications':  'Walang mga abiso',
  },
};

// ── Page ──────────────────────────────────────────────────────────────────────
class LanguagePage extends StatefulWidget {
  const LanguagePage({super.key});

  @override
  State<LanguagePage> createState() => _LanguagePageState();
}

class _LanguagePageState extends State<LanguagePage> {
  static const Color _purple   = Color(0xFF7C14D4);
  static const Color _bg       = Color(0xFFFAFAFA);
  static const Color _surface  = Color(0xFFF2EEF8);
  static const Color _textDark = Color(0xFF1A1A2E);
  static const Color _textMid  = Color(0xFF6B6B8A);

  String _selected = 'en';

  final _languages = const [
    {'code': 'en',  'name': 'English',  'native': 'English',  'flag': '🇺🇸'},
    {'code': 'fil', 'name': 'Filipino', 'native': 'Filipino', 'flag': '🇵🇭'},
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString('app_language') ?? 'en';
    setState(() => _selected = saved);
    appLanguageNotifier.value = saved;
  }

  Future<void> _select(String code) async {
    if (_selected == code) return; // already selected — do nothing
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('app_language', code);
    appLanguageNotifier.value = code; // notify the whole app
    setState(() => _selected = code);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          t('language_updated'),
          style: GoogleFonts.poppins(fontSize: 13),
        ),
        backgroundColor: _purple,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(
        child: Column(
          children: [
            // ── App bar ───────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      width:  40,
                      height: 40,
                      decoration: const BoxDecoration(
                          color: _surface, shape: BoxShape.circle),
                      child: const Icon(Icons.arrow_back_ios_new_rounded,
                          size: 18, color: _purple),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    t('language'),
                    style: GoogleFonts.poppins(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: _textDark),
                  ),
                ],
              ),
            ),

            // ── Body ──────────────────────────────────────────────────
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 30),
                children: [

                  // Subtitle
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Text(
                      t('select_language'),
                      style: GoogleFonts.poppins(
                          fontSize: 13, color: _textMid),
                    ),
                  ),

                  // ── Language list card ────────────────────────────
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFFEAEAF0)),
                      boxShadow: [
                        BoxShadow(
                          color:      Colors.black.withValues(alpha: 0.04),
                          blurRadius: 10,
                          offset:     const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      children: _languages.asMap().entries.map((entry) {
                        final lang   = entry.value;
                        final isSel  = lang['code'] == _selected;
                        final isLast = entry.key == _languages.length - 1;

                        return Column(
                          children: [
                            InkWell(
                              onTap: () => _select(lang['code']!),
                              borderRadius: BorderRadius.circular(18),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 16, vertical: 16),
                                child: Row(
                                  children: [
                                    // Flag
                                    Text(lang['flag']!,
                                        style:
                                        const TextStyle(fontSize: 30)),
                                    const SizedBox(width: 14),

                                    // Language name
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            lang['name']!,
                                            style: GoogleFonts.poppins(
                                              fontSize:   14,
                                              fontWeight: FontWeight.w600,
                                              color: isSel
                                                  ? _purple
                                                  : _textDark,
                                            ),
                                          ),
                                          Text(
                                            lang['native']!,
                                            style: GoogleFonts.poppins(
                                                fontSize: 11,
                                                color: _textMid),
                                          ),
                                        ],
                                      ),
                                    ),

                                    // Check indicator
                                    AnimatedSwitcher(
                                      duration: const Duration(
                                          milliseconds: 200),
                                      child: isSel
                                          ? Container(
                                        key: const ValueKey('checked'),
                                        width:  26,
                                        height: 26,
                                        decoration: const BoxDecoration(
                                          color:  _purple,
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Icon(
                                            Icons.check_rounded,
                                            color: Colors.white,
                                            size: 15),
                                      )
                                          : Container(
                                        key: const ValueKey('unchecked'),
                                        width:  26,
                                        height: 26,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          border: Border.all(
                                            color: const Color(
                                                0xFFDDD8F0),
                                            width: 1.5,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            if (!isLast)
                              Padding(
                                padding: const EdgeInsets.only(
                                    left: 60, right: 16),
                                child: Divider(
                                    height: 1,
                                    color: Colors.grey[100]),
                              ),
                          ],
                        );
                      }).toList(),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // ── Info note ─────────────────────────────────────
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: _purple.withValues(alpha: 0.07),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                          color: _purple.withValues(alpha: 0.15)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.info_outline_rounded,
                            color: _purple, size: 18),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            t('info_note'),
                            style: GoogleFonts.poppins(
                                fontSize: 12, color: _purple),
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
    );
  }
}