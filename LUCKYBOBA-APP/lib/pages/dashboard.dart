
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'dart:io';

import '../state/profile_notifier.dart';
import '../widgets/custom_navbar.dart';
import '../pages/home_page.dart';
import '../pages/order_page.dart';
import '../cards/cards_page.dart';
import '../pages/stores_page.dart';
import '../account/profile_page.dart';
import '../utils/app_theme.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  int    _selectedIndex = 0;
  String _userName      = '';
  late final List<Widget> _pages;

  @override
  void initState() {
    super.initState();
    _pages = [
      HomePage(onGoToCards: _goToCards),
      const OrderPage(),
      const CardsPage(),
      StoresPage(onBack: () => _onItemTapped(0)),
    ];
    _loadUserData();
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor:          Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ));
  }

  void _goToCards() => _onItemTapped(2);

  Future<void> _loadUserData() async {
    final prefs = await SharedPreferences.getInstance();
    final int? userId = prefs.getInt('user_id');
    final String? userIdStr = prefs.getString('user_id_str');
    final String userKey = userId?.toString() ?? userIdStr ?? '';
    final String imageKey = userKey.isNotEmpty ? 'profileImagePath_$userKey' : 'profileImagePath';
    setState(() => _userName = prefs.getString('userName') ?? 'Guest');
    profileImageNotifier.value = prefs.getString(imageKey);
  }

  void _onItemTapped(int index) {
    if (_selectedIndex == index) return;
    setState(() => _selectedIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    final bool showHeader = _selectedIndex != 3;

    return Scaffold(
      extendBody: true,
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // ── PAGE CONTENT (fills full screen, pages handle their own bg) ──
          Column(
            children: [
              if (showHeader) _buildCleanHeader(),
              Expanded(
                child: IndexedStack(
                  index: _selectedIndex,
                  children: _pages,
                ),
              ),
            ],
          ),
        ],
      ),
      bottomNavigationBar: CustomNavBar(
        selectedIndex: _selectedIndex,
        onTabChange:   _onItemTapped,
      ),
    );
  }

  Widget _buildCleanHeader() {
    return Container(
      // Solid dark-purple header — no giant blurred image behind it
      decoration: BoxDecoration(
        color: AppTheme.primary,
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 10, 20, 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Left: greeting
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    _getTodayLabel().toUpperCase(),
                    style: GoogleFonts.outfit(
                      fontSize: 9,
                      fontWeight: FontWeight.w700,
                      color: Colors.white54,
                      letterSpacing: 2,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Hello, $_userName 👋',
                    style: GoogleFonts.outfit(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),

              // Right: avatar
              GestureDetector(
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const ProfilePage()),
                ).then((_) => _loadUserData()),
                child: ValueListenableBuilder<String?>(
                  valueListenable: profileImageNotifier,
                  builder: (context, imagePath, _) {
                    final hasImage = imagePath != null && File(imagePath).existsSync();
                    return Container(
                      height: 42, width: 42,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white30, width: 2),
                        color: Colors.white.withValues(alpha: 0.1),
                      ),
                      child: ClipOval(
                        child: hasImage
                            ? Image.file(File(imagePath), fit: BoxFit.cover)
                            : const Icon(PhosphorIconsRegular.user, color: Colors.white70, size: 22),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _getTodayLabel() {
    final now = DateTime.now();
    const days   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${days[now.weekday - 1]} • ${months[now.month - 1]} ${now.day}';
  }
}