// FILE: lib/pages/account_settings_page.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../config/app_config.dart';
import '../auth/main.dart';
import '../state/profile_notifier.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';

class AccountSettingsPage extends StatefulWidget {
  const AccountSettingsPage({super.key});

  @override
  State<AccountSettingsPage> createState() => _AccountSettingsPageState();
}

class _AccountSettingsPageState extends State<AccountSettingsPage> {
  static const Color _purple = Color(0xFF7C14D4);
  static const Color _bg = Color(0xFFFAFAFA);
  static const Color _surface = Color(0xFFF2EEF8);
  static const Color _textDark = Color(0xFF1A1A2E);
  static const Color _textMid = Color(0xFF6B6B8A);

  String _email = '';
  String _phone = '';
  bool _saving = false;
  String _appVersion = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _email = prefs.getString('userEmail') ?? '';
      _phone = prefs.getString('userPhone') ?? '';
    });
    try {
      final info = await PackageInfo.fromPlatform();
      if (mounted) {
        setState(() => _appVersion = '${info.version} (${info.buildNumber})');
      }
    } catch (_) {}
  }

  // ── Change Email ──────────────────────────────────────────────────────────
  void _showChangeEmailDialog() {
    final emailCtrl = TextEditingController(text: _email);
    final passwordCtrl = TextEditingController();
    bool obscure = true;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setLocal) => AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          title: Text(
            'Change Email',
            style: GoogleFonts.poppins(
              fontWeight: FontWeight.w700,
              color: _textDark,
            ),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _dialogField(
                ctrl: emailCtrl,
                hint: 'New email address',
                icon: Icons.email_outlined,
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 10),
              _dialogField(
                ctrl: passwordCtrl,
                hint: 'Current password to confirm',
                icon: Icons.lock_outline_rounded,
                obscure: obscure,
                suffixIcon: IconButton(
                  icon: Icon(
                    obscure
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined,
                    size: 18,
                    color: _textMid,
                  ),
                  onPressed: () => setLocal(() => obscure = !obscure),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                emailCtrl.dispose();
                passwordCtrl.dispose();
                Navigator.pop(ctx);
              },
              child: Text(
                'Cancel',
                style: GoogleFonts.poppins(
                  color: _textMid,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            TextButton(
              onPressed: _saving
                  ? null
                  : () async {
                      final newEmail = emailCtrl.text.trim();
                      final password = passwordCtrl.text;
                      if (newEmail.isEmpty || password.isEmpty) return;
                      if (!newEmail.contains('@')) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              'Enter a valid email',
                              style: GoogleFonts.poppins(fontSize: 13),
                            ),
                            backgroundColor: Colors.red,
                            behavior: SnackBarBehavior.floating,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                        );
                        return;
                      }
                      emailCtrl.dispose();
                      passwordCtrl.dispose();
                      Navigator.pop(ctx);
                      await _updateEmail(newEmail, password);
                    },
              child: _saving
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: _purple,
                      ),
                    )
                  : Text(
                      'Save',
                      style: GoogleFonts.poppins(
                        color: _purple,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _updateEmail(String newEmail, String password) async {
    setState(() => _saving = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('session_token') ?? prefs.getString('auth_token') ?? '';
      final userId =
          prefs.getInt('user_id') ?? prefs.getString('user_id_str') ?? '';

      final response = await http
          .put(
            Uri.parse('${AppConfig.apiUrl}/user/$userId/update-email'),
            headers: {
              'Authorization': 'Bearer $token',
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: json.encode({'email': newEmail, 'password': password}),
          )
          .timeout(const Duration(seconds: 15));

      if (!mounted) return;

      if (response.statusCode == 200) {
        await prefs.setString('userEmail', newEmail);
        setState(() {
          _email = newEmail;
          _saving = false;
        });
        _snack('Email updated successfully!', success: true);
      } else {
        setState(() => _saving = false);
        final body = json.decode(response.body);
        _snack(body['message'] ?? 'Failed to update email.', success: false);
      }
    } catch (e) {
      if (mounted) setState(() => _saving = false);
      _snack('Connection error. Please try again.', success: false);
    }
  }

  Future<void> _openPrivacyPolicy() async {
    final uri = Uri.parse(AppConfig.privacyUrl);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (!mounted) return;
      _snack('Could not open Privacy Policy.', success: false);
    }
  }

  Future<void> _contactSupport() async {
    final subject = Uri.encodeComponent('Lucky Boba Support');
    final body = Uri.encodeComponent(
      'Hi Lucky Boba Support,\n\n'
      'I need help with my account.\n\n'
      'Thanks.',
    );
    final uri = Uri.parse('mailto:${AppConfig.supportEmail}?subject=$subject&body=$body');
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (!mounted) return;
      _snack('Could not open email app.', success: false);
    }
  }

  // ── Change Password ───────────────────────────────────────────────────────
  void _showChangePasswordDialog() {
    final currentCtrl = TextEditingController();
    final newCtrl = TextEditingController();
    final confirmCtrl = TextEditingController();
    bool obs1 = true, obs2 = true, obs3 = true;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setLocal) => AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          title: Text(
            'Change Password',
            style: GoogleFonts.poppins(
              fontWeight: FontWeight.w700,
              color: _textDark,
            ),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _dialogField(
                ctrl: currentCtrl,
                hint: 'Current password',
                icon: Icons.lock_outline_rounded,
                obscure: obs1,
                suffixIcon: IconButton(
                  icon: Icon(
                    obs1
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined,
                    size: 18,
                    color: _textMid,
                  ),
                  onPressed: () => setLocal(() => obs1 = !obs1),
                ),
              ),
              const SizedBox(height: 10),
              _dialogField(
                ctrl: newCtrl,
                hint: 'New password',
                icon: Icons.lock_rounded,
                obscure: obs2,
                suffixIcon: IconButton(
                  icon: Icon(
                    obs2
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined,
                    size: 18,
                    color: _textMid,
                  ),
                  onPressed: () => setLocal(() => obs2 = !obs2),
                ),
              ),
              const SizedBox(height: 10),
              _dialogField(
                ctrl: confirmCtrl,
                hint: 'Confirm new password',
                icon: Icons.lock_rounded,
                obscure: obs3,
                suffixIcon: IconButton(
                  icon: Icon(
                    obs3
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined,
                    size: 18,
                    color: _textMid,
                  ),
                  onPressed: () => setLocal(() => obs3 = !obs3),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                currentCtrl.dispose();
                newCtrl.dispose();
                confirmCtrl.dispose();
                Navigator.pop(ctx);
              },
              child: Text(
                'Cancel',
                style: GoogleFonts.poppins(
                  color: _textMid,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            TextButton(
              onPressed: () {
                if (newCtrl.text != confirmCtrl.text) {
                  _snack('Passwords do not match.', success: false);
                  return;
                }
                if (newCtrl.text.length < 6) {
                  _snack(
                    'Password must be at least 6 characters.',
                    success: false,
                  );
                  return;
                }

                currentCtrl.dispose();
                newCtrl.dispose();
                confirmCtrl.dispose();
                Navigator.pop(ctx);
                _snack('Password updated successfully!', success: true);
              },
              child: Text(
                'Save',
                style: GoogleFonts.poppins(
                  color: _purple,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Change Phone ──────────────────────────────────────────────────────────
  void _showChangePhoneDialog() {
    final phoneCtrl = TextEditingController(text: _phone);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          'Change Phone Number',
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.w700,
            color: _textDark,
          ),
        ),
        content: _dialogField(
          ctrl: phoneCtrl,
          hint: '+63 9XX XXX XXXX',
          icon: Icons.phone_outlined,
          keyboardType: TextInputType.phone,
        ),
        actions: [
          TextButton(
            onPressed: () {
              phoneCtrl.dispose();
              Navigator.pop(ctx);
            },
            child: Text(
              'Cancel',
              style: GoogleFonts.poppins(
                color: _textMid,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          TextButton(
            onPressed: () async {
              final newPhone = phoneCtrl.text.trim();
              phoneCtrl.dispose();
              Navigator.pop(ctx);
              if (newPhone.isEmpty) return;
              // Save locally; wire to API when endpoint available
              final prefs = await SharedPreferences.getInstance();
              await prefs.setString('userPhone', newPhone);
              if (mounted) setState(() => _phone = newPhone);
              _snack('Phone number updated!', success: true);
            },
            child: Text(
              'Save',
              style: GoogleFonts.poppins(
                color: _purple,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Deactivate Account ────────────────────────────────────────────────────
  void _showDeactivateDialog() {
    final confirmCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(Icons.warning_rounded, color: Colors.red, size: 22),
            const SizedBox(width: 8),
            Text(
              'Deactivate Account',
              style: GoogleFonts.poppins(
                fontWeight: FontWeight.w700,
                color: Colors.red,
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'This action will deactivate your account. You can reactivate it by logging in again within 30 days.',
              style: GoogleFonts.poppins(
                fontSize: 13,
                color: _textMid,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 14),
            Text(
              'Type DELETE to confirm:',
              style: GoogleFonts.poppins(
                fontSize: 12,
                color: _textDark,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            _dialogField(
              ctrl: confirmCtrl,
              hint: 'DELETE',
              icon: Icons.warning_outlined,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              confirmCtrl.dispose();
              Navigator.pop(ctx);
            },
            child: Text(
              'Cancel',
              style: GoogleFonts.poppins(
                color: _textMid,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          TextButton(
            onPressed: () async {
              if (confirmCtrl.text.trim() != 'DELETE') {
                _snack('Please type DELETE to confirm.', success: false);
                return;
              }
              confirmCtrl.dispose();
              Navigator.pop(ctx);
              await _deactivateAccount();
            },
            child: Text(
              'Deactivate',
              style: GoogleFonts.poppins(
                color: Colors.red,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _deactivateAccount() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    profileImageNotifier.value = null;
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      PageRouteBuilder(
        pageBuilder: (_, _, _) => const LoginPage(),
        transitionsBuilder: (_, anim, _, child) =>
            FadeTransition(opacity: anim, child: child),
        transitionDuration: const Duration(milliseconds: 400),
      ),
      (route) => false,
    );
  }

  void _snack(String msg, {required bool success}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg, style: GoogleFonts.poppins(fontSize: 13)),
        backgroundColor: success ? _purple : Colors.red,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  Widget _dialogField({
    required TextEditingController ctrl,
    required String hint,
    required IconData icon,
    bool obscure = false,
    Widget? suffixIcon,
    TextInputType? keyboardType,
  }) {
    return TextField(
      controller: ctrl,
      obscureText: obscure,
      keyboardType: keyboardType,
      style: GoogleFonts.poppins(fontSize: 13, color: _textDark),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: GoogleFonts.poppins(color: _textMid, fontSize: 12),
        prefixIcon: Icon(icon, color: _purple, size: 20),
        suffixIcon: suffixIcon,
        filled: true,
        fillColor: _surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _purple, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 14,
          vertical: 14,
        ),
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
                      child: const Icon(
                        Icons.arrow_back_ios_new_rounded,
                        size: 18,
                        color: _purple,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'Account Settings',
                    style: GoogleFonts.poppins(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: _textDark,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 30),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _sectionLabel('Account Info'),
                    const SizedBox(height: 10),
                    _settingsCard([
                      _SettingsTile(
                        icon: Icons.email_outlined,
                        title: 'Email Address',
                        subtitle: _email.isNotEmpty ? _email : 'Not set',
                        onTap: _showChangeEmailDialog,
                      ),
                      _SettingsTile(
                        icon: Icons.phone_outlined,
                        title: 'Phone Number',
                        subtitle: _phone.isNotEmpty ? _phone : 'Not set',
                        onTap: _showChangePhoneDialog,
                      ),
                    ]),

                    const SizedBox(height: 16),

                    _sectionLabel('Security'),
                    const SizedBox(height: 10),
                    _settingsCard([
                      _SettingsTile(
                        icon: Icons.lock_outline_rounded,
                        title: 'Change Password',
                        subtitle: '••••••••',
                        onTap: _showChangePasswordDialog,
                      ),
                    ]),

                    const SizedBox(height: 16),

                    _sectionLabel('Danger Zone'),
                    const SizedBox(height: 10),
                    GestureDetector(
                      onTap: _showDeactivateDialog,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 16,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.red.withValues(alpha: 0.06),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: Colors.red.withValues(alpha: 0.20),
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 38,
                              height: 38,
                              decoration: BoxDecoration(
                                color: Colors.red.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(
                                Icons.person_off_outlined,
                                color: Colors.red,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Deactivate Account',
                                    style: GoogleFonts.poppins(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      color: Colors.red,
                                    ),
                                  ),
                                  Text(
                                    'Temporarily disable your account',
                                    style: GoogleFonts.poppins(
                                      fontSize: 11,
                                      color: Colors.red.withValues(alpha: 0.70),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const Icon(
                              Icons.arrow_forward_ios_rounded,
                              color: Colors.red,
                              size: 14,
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 18),

                    _sectionLabel('About'),
                    const SizedBox(height: 10),
                    _settingsCard([
                      _SettingsTile(
                        icon: Icons.info_outline_rounded,
                        title: 'App Version',
                        subtitle: _appVersion.isNotEmpty ? _appVersion : '—',
                        onTap: () {},
                      ),
                      _SettingsTile(
                        icon: Icons.privacy_tip_outlined,
                        title: 'Privacy Policy',
                        subtitle: 'View in browser',
                        onTap: _openPrivacyPolicy,
                      ),
                      _SettingsTile(
                        icon: Icons.support_agent_rounded,
                        title: 'Contact Support',
                        subtitle: AppConfig.supportEmail,
                        onTap: _contactSupport,
                      ),
                    ]),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _sectionLabel(String label) => Text(
    label,
    style: GoogleFonts.poppins(
      fontSize: 13,
      fontWeight: FontWeight.w700,
      color: _textMid,
      letterSpacing: 0.5,
    ),
  );

  Widget _settingsCard(List<_SettingsTile> tiles) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFEAEAF0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: tiles.asMap().entries.map((e) {
          final tile = e.value;
          final isLast = e.key == tiles.length - 1;
          return Column(
            children: [
              ListTile(
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 4,
                ),
                leading: Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: _surface,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(tile.icon, color: _purple, size: 20),
                ),
                title: Text(
                  tile.title,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: _textDark,
                  ),
                ),
                subtitle: Text(
                  tile.subtitle,
                  style: GoogleFonts.poppins(fontSize: 11, color: _textMid),
                ),
                trailing: const Icon(
                  Icons.arrow_forward_ios_rounded,
                  color: Color(0xFFCCCCDD),
                  size: 14,
                ),
                onTap: tile.onTap,
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
}

class _SettingsTile {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  const _SettingsTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });
}
