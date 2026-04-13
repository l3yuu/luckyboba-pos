// FILE: lib/account/profile_page.dart
import 'dart:io';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';

import '../config/app_config.dart';
import '../state/profile_notifier.dart';
import '../auth/main.dart';
import 'order_history_page.dart';
import 'notifications_page.dart';
import 'contact_us_page.dart';
import 'legal_page.dart';
import 'language_page.dart';
import 'account_settings_page.dart';

// ── Shared palette (matches home_page & menu_page) ────────────────────────────
const Color _kPurple      = Color(0xFF7C3AED);
const Color _kPurpleLight = Color(0xFF9D4EDD);
const Color _kPurpleDark  = Color(0xFF6D28D9);
const Color _kOrange      = Color(0xFFFF8C00);
const Color _kBg          = Color(0xFFF4F4F8);
const Color _kSurface     = Color(0xFFF2EEF8);
const Color _kTextDark    = Color(0xFF1A1A2E);
const Color _kTextMid     = Color(0xFF6B6B8A);

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  static const Set<String> _adminRoles = {
    'superadmin',
    'branch_manager',
    'cashier',
  };

  String  _userName         = 'Loading...';
  String  _userRole         = 'customer';
  String  _userEmail        = '';
  String? _profileImagePath;
  bool    _isUploading      = false;

  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final prefs = await SharedPreferences.getInstance();
    final int?    userId    = prefs.getInt('user_id');
    final String? userIdStr = prefs.getString('user_id_str');
    final String  userKey   = userId?.toString() ?? userIdStr ?? '';
    final String  imageKey  =
        userKey.isNotEmpty ? 'profileImagePath_$userKey' : 'profileImagePath';

    setState(() {
      _userName         = prefs.getString('userName') ?? 'Guest User';
      _userRole         = prefs.getString('userRole') ?? 'customer';
      _userEmail        = prefs.getString('userEmail') ?? '';
      _profileImagePath = prefs.getString(imageKey);
    });
    profileImageNotifier.value = _profileImagePath;
  }

  // ── Update display name ───────────────────────────────────────────────────
  Future<void> _showEditUsernameDialog() async {
    await showDialog(
      context: context,
      builder: (_) => _EditNameDialog(
        initialName: _userName,
        onSave:      _updateDisplayName,
      ),
    );
  }

  Future<void> _updateDisplayName(String newName) async {
    final prefs = await SharedPreferences.getInstance();
    final String? token =
        prefs.getString('token') ?? prefs.getString('session_token');
    if (mounted) setState(() => _userName = newName);
    try {
      final response = await http.put(
        Uri.parse('${AppConfig.apiUrl}/user/name'),
        headers: {
          'Content-Type': 'application/json',
          'Accept':       'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'name': newName}),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        await prefs.setString('userName', newName);
        if (mounted) _showSnack('Display name updated!', _kPurple);
      } else {
        final oldName = prefs.getString('userName') ?? _userName;
        if (mounted) setState(() => _userName = oldName);
        final body    = jsonDecode(response.body);
        if (mounted) {
          _showSnack(body['message'] ?? 'Failed to update name', Colors.redAccent);
        }
      }
    } catch (_) {
      final oldName = prefs.getString('userName') ?? _userName;
      if (mounted) {
        setState(() => _userName = oldName);
        _showSnack('Cannot reach server — check your Wi-Fi', Colors.redAccent);
      }
    }
  }

  // ── Admin panel ───────────────────────────────────────────────────────────
  Future<void> _openAdminPanel() async {
    final Uri url = Uri.parse('https://luckybobastores.com');
    if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
      if (mounted) _showSnack('Could not open Admin Panel', Colors.red);
    }
  }

  // ── Image picker ──────────────────────────────────────────────────────────
  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? picked = await _picker.pickImage(
        source:       source,
        maxWidth:     512,
        maxHeight:    512,
        imageQuality: 85,
      );
      if (picked == null) return;
      setState(() => _isUploading = true);

      final prefs = await SharedPreferences.getInstance();
      final String? token =
          prefs.getString('token') ?? prefs.getString('session_token');

      final request = http.MultipartRequest(
        'POST', Uri.parse('${AppConfig.apiUrl}/user/avatar'));
      request.headers.addAll({
        'Accept': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      });
      request.files.add(await http.MultipartFile.fromPath('image', picked.path));

      final streamedResponse =
          await request.send().timeout(const Duration(seconds: 15));
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        final int?    userId    = prefs.getInt('user_id');
        final String? userIdStr = prefs.getString('user_id_str');
        final String  userKey   = userId?.toString() ?? userIdStr ?? '';
        final String  imageKey  =
            userKey.isNotEmpty ? 'profileImagePath_$userKey' : 'profileImagePath';

        await prefs.setString(imageKey, picked.path);
        profileImageNotifier.value = picked.path;
        if (mounted) {
          setState(() {
            _profileImagePath = picked.path;
            _isUploading      = false;
          });
          _showSnack('Profile picture updated!', _kPurple);
        }
      } else {
        if (mounted) setState(() => _isUploading = false);
        String errorMessage =
            'Failed to upload image (Code: ${response.statusCode})';
        try {
          final decoded = jsonDecode(response.body);
          if (decoded['message'] != null) errorMessage = decoded['message'];
        } catch (_) {}
        if (mounted) _showSnack(errorMessage, Colors.redAccent);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isUploading = false);
        _showSnack('Cannot reach server. Check your connection.', Colors.redAccent);
      }
    }
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  Future<void> _logout() async {
    final prefs = await SharedPreferences.getInstance();
    final bool onboardingDone = prefs.getBool('onboarding_done') ?? true;

    final Map<String, String> savedImages = {};
    final Map<String, bool>   savedTerms  = {};
    final Set<String>         allKeys     = prefs.getKeys();
    for (final key in allKeys) {
      if (key.startsWith('profileImagePath_')) {
        final val = prefs.getString(key);
        if (val != null) savedImages[key] = val;
      }
      if (key.startsWith('has_accepted_terms_')) {
        final val = prefs.getBool(key);
        if (val != null) savedTerms[key] = val;
      }
    }

    await prefs.clear();
    await prefs.setBool('onboarding_done', onboardingDone);
    for (final e in savedImages.entries) { await prefs.setString(e.key, e.value); }
    for (final e in savedTerms.entries)  { await prefs.setBool(e.key, e.value); }
    profileImageNotifier.value = null;

    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      PageRouteBuilder(
        pageBuilder:        (context, animation, secondaryAnimation) => const LoginPage(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) =>
            FadeTransition(opacity: animation, child: child),
        transitionDuration: const Duration(milliseconds: 400),
      ),
      (route) => false,
    );
  }

  // ── Image source bottom sheet ─────────────────────────────────────────────
  void _showImageSourceSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40, height: 4,
                  decoration: BoxDecoration(
                      color: const Color(0xFFEAEAF0),
                      borderRadius: BorderRadius.circular(2)),
                ),
              ),
              const SizedBox(height: 16),
              Text('Update Profile Photo',
                  style: GoogleFonts.outfit(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: _kTextDark)),
              const SizedBox(height: 16),
              _sourceOption(
                icon: Icons.camera_alt_rounded,
                label: 'Take a Photo',
                onTap: () { Navigator.pop(context); _pickImage(ImageSource.camera); },
              ),
              const SizedBox(height: 10),
              _sourceOption(
                icon: Icons.photo_library_rounded,
                label: 'Choose from Gallery',
                onTap: () { Navigator.pop(context); _pickImage(ImageSource.gallery); },
              ),
              if (_profileImagePath != null) ...[
                const SizedBox(height: 10),
                _sourceOption(
                  icon: Icons.delete_outline_rounded,
                  label: 'Remove Photo',
                  color: Colors.red,
                  onTap: () async {
                    final prefs = await SharedPreferences.getInstance();
                    final int?    userId    = prefs.getInt('user_id');
                    final String? userIdStr = prefs.getString('user_id_str');
                    final String  userKey   =
                        userId?.toString() ?? userIdStr ?? '';
                    final String  imageKey  = userKey.isNotEmpty
                        ? 'profileImagePath_$userKey'
                        : 'profileImagePath';
                    await prefs.remove(imageKey);
                    profileImageNotifier.value = null;
                    setState(() => _profileImagePath = null);
                    if (mounted) Navigator.pop(context);
                  },
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _sourceOption({
    required IconData     icon,
    required String       label,
    required VoidCallback onTap,
    Color?                color,
  }) {
    final c = color ?? _kTextDark;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: color != null
              ? Colors.red.withValues(alpha: 0.06)
              : _kSurface,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          children: [
            Icon(icon, color: c, size: 22),
            const SizedBox(width: 14),
            Text(label,
                style: GoogleFonts.outfit(
                    fontSize: 14, fontWeight: FontWeight.w600, color: c)),
          ],
        ),
      ),
    );
  }

  void _showSnack(String msg, Color bg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg, style: GoogleFonts.outfit(fontSize: 13)),
      backgroundColor: bg,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ));
  }

  // ── BUILD ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final topPad = MediaQuery.of(context).padding.top;
    final String displayEmail = _userEmail.isNotEmpty
        ? _userEmail
        : '${_userName.toLowerCase().replaceAll(' ', '')}@luckyboba.com';
    final bool isAdmin = _adminRoles.contains(_userRole);

    return Scaffold(
      backgroundColor: _kBg,
      body: Column(
        children: [
          // ── Full-bleed purple header ──────────────────────────────────────
          _buildHeader(topPad, displayEmail),

          // ── Scrollable menu sections ──────────────────────────────────────
          Expanded(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 40),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [

                  // ── Admin panel button (staff only) ───────────────────
                  if (isAdmin) ...[
                    GestureDetector(
                      onTap: _openAdminPanel,
                      child: Container(
                        width:   double.infinity,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 20, vertical: 16),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF4A0A8A), _kPurple],
                            begin: Alignment.topLeft,
                            end:   Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color:      _kPurple.withValues(alpha: 0.30),
                              blurRadius: 16,
                              offset:     const Offset(0, 6),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(
                                  Icons.admin_panel_settings_rounded,
                                  color: Colors.white, size: 22),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Admin Panel',
                                      style: GoogleFonts.outfit(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w700,
                                          color: Colors.white)),
                                  Text('Open POS management dashboard',
                                      style: GoogleFonts.outfit(
                                          fontSize: 11,
                                          color: Colors.white
                                              .withValues(alpha: 0.75))),
                                ],
                              ),
                            ),
                            const Icon(Icons.open_in_new_rounded,
                                color: Colors.white, size: 18),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // ── Account section ───────────────────────────────────
                  _sectionLabel('Account'),
                  const SizedBox(height: 10),
                  _menuCard([
                    _MenuTileData(
                      icon:     PhosphorIconsRegular.pencilSimple,
                      title:    'Edit Display Name',
                      subtitle: _userName,
                      onTap:    _showEditUsernameDialog,
                    ),
                    _MenuTileData(
                      icon:     PhosphorIconsRegular.gear,
                      title:    'Account Settings',
                      subtitle: 'Email, password, phone & more',
                      onTap:    () => Navigator.push(context,
                          MaterialPageRoute(
                              builder: (_) => const AccountSettingsPage())),
                    ),
                    _MenuTileData(
                      icon:     PhosphorIconsRegular.receipt,
                      title:    'Order History',
                      subtitle: 'Order history & receipt',
                      onTap:    () => Navigator.push(context,
                          MaterialPageRoute(
                              builder: (_) => const OrderHistoryPage())),
                    ),
                    _MenuTileData(
                      icon:     PhosphorIconsRegular.bell,
                      title:    'Notifications',
                      subtitle: 'Notifications or messages',
                      onTap:    () => Navigator.push(context,
                          MaterialPageRoute(
                              builder: (_) => const NotificationsPage())),
                    ),
                    _MenuTileData(
                      icon:     PhosphorIconsRegular.translate,
                      title:    'Language',
                      subtitle: 'English . Language',
                      onTap:    () => Navigator.push(context,
                          MaterialPageRoute(
                              builder: (_) => const LanguagePage())),
                    ),
                  ]),

                  const SizedBox(height: 20),

                  // ── Support section ───────────────────────────────────
                  _sectionLabel('Support'),
                  const SizedBox(height: 10),
                  _menuCard([
                    _MenuTileData(
                      icon:  PhosphorIconsRegular.phoneCall,
                      title: 'Contact Us',
                      onTap: () => Navigator.push(context,
                          MaterialPageRoute(
                              builder: (_) => const ContactUsPage())),
                    ),
                    _MenuTileData(
                      icon:  PhosphorIconsRegular.shieldCheck,
                      title: 'Privacy Policy',
                      onTap: () => Navigator.push(context,
                          MaterialPageRoute(
                              builder: (_) => const LegalPage(
                                  type: LegalType.privacy))),
                    ),
                    _MenuTileData(
                      icon:  PhosphorIconsRegular.fileText,
                      title: 'Terms & Conditions',
                      onTap: () => Navigator.push(context,
                          MaterialPageRoute(
                              builder: (_) => const LegalPage(
                                  type: LegalType.terms))),
                    ),
                  ]),

                  const SizedBox(height: 20),

                  // ── Log out button ────────────────────────────────────
                  GestureDetector(
                    onTap: () => showDialog(
                      context: context,
                      builder: (_) => AlertDialog(
                        backgroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(18)),
                        title: Text('Log Out',
                            style: GoogleFonts.outfit(
                                fontWeight: FontWeight.w700,
                                color: _kTextDark)),
                        content: Text(
                          'Are you sure you want to log out?',
                          style: GoogleFonts.outfit(
                              fontSize: 13, color: _kTextMid),
                        ),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(context),
                            child: Text('Cancel',
                                style: GoogleFonts.outfit(
                                    color: _kTextMid,
                                    fontWeight: FontWeight.w600)),
                          ),
                          TextButton(
                            onPressed: () {
                              Navigator.pop(context);
                              _logout();
                            },
                            child: Text('Log Out',
                                style: GoogleFonts.outfit(
                                    color: Colors.red,
                                    fontWeight: FontWeight.w700)),
                          ),
                        ],
                      ),
                    ),
                    child: Container(
                      width:   double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      decoration: BoxDecoration(
                        color: Colors.red.withValues(alpha: 0.07),
                        borderRadius: BorderRadius.circular(14),
                        border:
                            Border.all(color: Colors.red.withValues(alpha: 0.2)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.logout_rounded,
                              color: Colors.red, size: 20),
                          const SizedBox(width: 10),
                          Text('Log Out',
                              style: GoogleFonts.outfit(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.red)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Purple header with avatar, name, email, role ──────────────────────────

  Widget _buildHeader(double topPad, String displayEmail) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        // Gradient background
        Container(
          width: double.infinity,
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [_kPurpleDark, _kPurpleLight],
              begin: Alignment.topLeft,
              end:   Alignment.bottomRight,
            ),
          ),
          padding: EdgeInsets.only(
              top: topPad + 16, left: 20, right: 20, bottom: 44),
          child: Column(
            children: [
              // ── Back button row ────────────────────────────────────────
              Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      width:  40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.arrow_back_ios_new_rounded,
                          size: 18, color: Colors.white),
                    ),
                  ),
                  const Spacer(),
                ],
              ),
              const SizedBox(height: 12),

              // ── Avatar ────────────────────────────────────────────────
              Stack(
                alignment: Alignment.bottomRight,
                children: [
                  Container(
                    width:  100,
                    height: 100,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white.withValues(alpha: 0.15),
                      border: Border.all(
                          color: Colors.white.withValues(alpha: 0.5),
                          width: 3),
                    ),
                    child: ClipOval(
                      child: _isUploading
                          ? const Center(
                              child: CircularProgressIndicator(
                                  color: Colors.white, strokeWidth: 2))
                          : _profileImagePath != null &&
                                  File(_profileImagePath!).existsSync()
                              ? Image.file(File(_profileImagePath!),
                                  fit: BoxFit.cover,
                                  width: 100,
                                  height: 100)
                              : Icon(PhosphorIconsRegular.user,
                                  color: Colors.white, size: 48),
                    ),
                  ),
                  GestureDetector(
                    onTap: _showImageSourceSheet,
                    child: Container(
                      width:  32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: _kOrange,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                      child: const Icon(Icons.camera_alt_rounded,
                          color: Colors.white, size: 15),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // ── Name ─────────────────────────────────────────────────
              GestureDetector(
                onTap: _showEditUsernameDialog,
                child: Row(
                  mainAxisSize:        MainAxisSize.min,
                  mainAxisAlignment:   MainAxisAlignment.center,
                  children: [
                    Flexible(
                      child: Text(
                        _userName,
                        style: GoogleFonts.outfit(
                          fontSize:   22,
                          fontWeight: FontWeight.w800,
                          color:      Colors.white,
                        ),
                        textAlign: TextAlign.center,
                        overflow:  TextOverflow.ellipsis,
                        maxLines:  1,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.20),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Icon(Icons.edit_rounded,
                          color: Colors.white, size: 12),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 4),

              // ── Email ─────────────────────────────────────────────────
              Text(
                displayEmail,
                style: GoogleFonts.outfit(
                    fontSize: 12,
                    color: Colors.white.withValues(alpha: 0.80)),
              ),

              const SizedBox(height: 8),

              // ── Role badge ────────────────────────────────────────────
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                      color: Colors.white.withValues(alpha: 0.30)),
                ),
                child: Text(
                  _userRole[0].toUpperCase() + _userRole.substring(1),
                  style: GoogleFonts.outfit(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Colors.white),
                ),
              ),
            ],
          ),
        ),

        // ── Wave at the bottom of the header ──────────────────────────
        Positioned(
          bottom: 0,
          left:   0,
          right:  0,
          child: CustomPaint(
            size: const Size(double.infinity, 32),
            painter: _WavePainter(color: _kBg),
          ),
        ),
      ],
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  Widget _sectionLabel(String label) {
    return Text(
      label,
      style: GoogleFonts.outfit(
          fontSize:      15,
          fontWeight:    FontWeight.w800,
          color:         _kTextDark,
          letterSpacing: 0.2),
    );
  }

  Widget _menuCard(List<_MenuTileData> tiles) {
    return Container(
      decoration: BoxDecoration(
        color:        Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFEAEAF0), width: 1),
        boxShadow: [
          BoxShadow(
            color:      Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset:     const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: tiles.asMap().entries.map((entry) {
          final i      = entry.key;
          final tile   = entry.value;
          final isLast = i == tiles.length - 1;

          return Column(
            children: [
              InkWell(
                onTap:        tile.onTap ?? () {},
                borderRadius: BorderRadius.only(
                  topLeft:     i == 0
                      ? const Radius.circular(18)
                      : Radius.zero,
                  topRight:    i == 0
                      ? const Radius.circular(18)
                      : Radius.zero,
                  bottomLeft:  isLast
                      ? const Radius.circular(18)
                      : Radius.zero,
                  bottomRight: isLast
                      ? const Radius.circular(18)
                      : Radius.zero,
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 14),
                  child: Row(
                    children: [
                      // Icon container
                      Container(
                        width:  42,
                        height: 42,
                        decoration: BoxDecoration(
                          color:        _kSurface,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(tile.icon, color: _kPurple, size: 20),
                      ),
                      const SizedBox(width: 14),

                      // Title + subtitle
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(tile.title,
                                style: GoogleFonts.outfit(
                                    fontSize:   14,
                                    fontWeight: FontWeight.w700,
                                    color:      _kTextDark)),
                            if (tile.subtitle != null)
                              Text(tile.subtitle!,
                                  style: GoogleFonts.outfit(
                                      fontSize: 11, color: _kTextMid)),
                          ],
                        ),
                      ),

                      const Icon(Icons.arrow_forward_ios_rounded,
                          color: Color(0xFFCCCCDD), size: 14),
                    ],
                  ),
                ),
              ),
              if (!isLast)
                Padding(
                  padding: const EdgeInsets.only(left: 72, right: 16),
                  child: Divider(height: 1, color: Colors.grey[100]),
                ),
            ],
          );
        }).toList(),
      ),
    );
  }
}

// ── Wave painter (same as menu_page) ─────────────────────────────────────────

class _WavePainter extends CustomPainter {
  final Color color;
  const _WavePainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = color;
    final path  = Path()
      ..moveTo(0, size.height)
      ..quadraticBezierTo(size.width * 0.25, 0, size.width * 0.5, size.height * 0.5)
      ..quadraticBezierTo(size.width * 0.75, size.height, size.width, 0)
      ..lineTo(size.width, size.height)
      ..close();
    canvas.drawPath(path, paint);

    // Solid bottom cap so content beneath is correct color
    final capPaint = Paint()..color = color;
    canvas.drawRect(
      Rect.fromLTWH(0, size.height - 2, size.width, 2),
      capPaint,
    );
  }

  @override
  bool shouldRepaint(_WavePainter old) => true; // Forced repaint for hot reload
}

// ── Menu tile data ────────────────────────────────────────────────────────────

class _MenuTileData {
  final IconData      icon;
  final String        title;
  final String?       subtitle;
  final VoidCallback? onTap;

  const _MenuTileData({
    required this.icon,
    required this.title,
    this.subtitle,
    this.onTap,
  });
}

// ── Edit name dialog ──────────────────────────────────────────────────────────

class _EditNameDialog extends StatefulWidget {
  final String                       initialName;
  final Future<void> Function(String) onSave;

  const _EditNameDialog({required this.initialName, required this.onSave});

  @override
  State<_EditNameDialog> createState() => _EditNameDialogState();
}

class _EditNameDialogState extends State<_EditNameDialog> {
  late final TextEditingController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = TextEditingController(text: widget.initialName);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Text('Edit Display Name',
          style: GoogleFonts.outfit(
              fontWeight: FontWeight.w700, color: _kTextDark)),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Choose a name others will see on your profile.',
              style: GoogleFonts.outfit(fontSize: 12, color: _kTextMid)),
          const SizedBox(height: 14),
          TextField(
            controller: _ctrl,
            autofocus:  false,
            maxLength:  30,
            style: GoogleFonts.outfit(fontSize: 14, color: _kTextDark),
            decoration: InputDecoration(
              hintText:  'Enter display name',
              hintStyle: GoogleFonts.outfit(color: _kTextMid, fontSize: 13),
              filled:       true,
              fillColor:    _kSurface,
              counterStyle: GoogleFonts.outfit(fontSize: 10, color: _kTextMid),
              border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide:   BorderSide.none),
              focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide:
                      const BorderSide(color: _kPurple, width: 1.5)),
              prefixIcon: const Icon(Icons.person_outline_rounded,
                  color: _kPurple, size: 20),
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text('Cancel',
              style: GoogleFonts.outfit(
                  color: _kTextMid, fontWeight: FontWeight.w600)),
        ),
        TextButton(
          onPressed: () async {
            final newName = _ctrl.text.trim();
            if (newName.isEmpty) return;
            Navigator.pop(context);
            await widget.onSave(newName);
          },
          child: Text('Save',
              style: GoogleFonts.outfit(
                  color: _kPurple, fontWeight: FontWeight.w700)),
        ),
      ],
    );
  }
}