import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:geolocator/geolocator.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'dart:convert';
import 'dart:math' as math;
import '../config/app_config.dart';
import '../cart/menu_page.dart';
import '../utils/app_theme.dart';
import 'points_page.dart';

const Map<String, String> _kCategoryMap = {
  'Lucky Classic': 'Classic Milktea',
  'Frappes':       'Frappes',
  'Iced Coffees':  'Iced Coffee',
  'Fruit Juices':  'Fruit Soda Series',
};

final List<Map<String, dynamic>> _kStoreLocations = [
  {'name': 'East Fairview',             'branch_id': 6,  'address': 'Dunhill Corner Winston St. East Fairview Q.C',          'image': 'assets/images/eastfairview_branch.png', 'lat': 14.7032, 'lng': 121.0695},
  {'name': 'AUF Angeles',               'branch_id': 7,  'address': 'Stall #7 JCL foodcourt, 704 Fajardo st.',               'image': 'assets/images/auf_branch.jpg',           'lat': 15.1451, 'lng': 120.5941},
  {'name': 'Robinsons Galleria Cebu',   'branch_id': 8,  'address': '3rd Floor, Robinsons Galleria Cebu',                    'image': 'assets/images/galleriacebu_branch.jpg',  'lat': 10.3061, 'lng': 123.9059},
  {'name': 'Jenra Grand Mall',          'branch_id': 9,  'address': 'Upper Ground Floor (near Jollibee Entrance)',           'image': 'assets/images/jenra_branch.png',         'lat': 15.1336, 'lng': 120.5907},
  {'name': 'Pamana Medical Center',     'branch_id': 10, 'address': 'National Highway, Calamba, Laguna',                     'image': 'assets/images/pamana_branch.jpg',        'lat': 14.2017, 'lng': 121.1565},
  {'name': 'Dahlia',                    'branch_id': 11, 'address': '#10 Dahlia Avenue, Fairview, Quezon City',              'image': 'assets/images/dahlia_branch.png',        'lat': 14.7028, 'lng': 121.0664},
  {'name': 'Misamis St., Bago Bantay',  'branch_id': 12, 'address': '43 Misamis St. Sto. Cristo, Bago Bantay',              'image': 'assets/images/misamis_branch.png',       'lat': 14.6598, 'lng': 121.0263},
  {'name': 'Pontiac',                   'branch_id': 13, 'address': 'Pontiac st. cor. Datsun st. Fairview, Quezon City',     'image': 'assets/images/pontiac_branch.png',       'lat': 14.7065, 'lng': 121.0621},
  {'name': 'QCGH',                      'branch_id': 14, 'address': 'Stall # 5 Seminary Road Project 8, Quezon City',        'image': 'assets/images/qcgh_branch.png',          'lat': 14.6669, 'lng': 121.0221},
  {'name': 'Tondo, Manila',             'branch_id': 15, 'address': '539 Perla St., Tondo, Manila',                          'image': 'assets/images/tondo_branch.png',         'lat': 14.6138, 'lng': 120.9678},
  {'name': 'Lucky Boba - Main Branch',  'branch_id': 1,  'address': '356 Vipra St., Sangandaan, Quezon City',                'image': 'assets/images/vipra_branch.png',         'lat': 14.6811, 'lng': 121.0368},
  {'name': 'Starmall Shaw Blvd.',       'branch_id': 16, 'address': 'near Kalentong Jeepney Terminal',                       'image': 'assets/images/starmall_branch.png',      'lat': 14.5826, 'lng': 121.0535},
  {'name': 'Eton Centris',              'branch_id': 17, 'address': 'Second Floor, Eton Centris Station Mall',               'image': 'assets/images/etoncentris_branch.png',   'lat': 14.6444, 'lng': 121.0375},
  {'name': 'Isetann Cubao',             'branch_id': 18, 'address': 'Ground Floor, Isetann Department Store',                'image': 'assets/images/isetann_branch.jpg',       'lat': 14.6219, 'lng': 121.0515},
  {'name': 'Candelaria, Quezon',        'branch_id': 19, 'address': 'Maharlika Highway, Candelaria',                         'image': 'assets/images/candelaria_branch.png',    'lat': 13.9272, 'lng': 121.4233},
  {'name': 'Himlayan Rd., Pasong Tamo', 'branch_id': 20, 'address': '217 Himlayan Road cor. Tandang Sora Ave.',              'image': 'assets/images/himlayanrd_branch.png',    'lat': 14.6785, 'lng': 121.0505},
  {'name': 'Lucky Boba - Bagbag',       'branch_id': 5,  'address': '657, 1116 Quirino Hwy, Novaliches',                     'image': 'assets/images/bagbag_branch.png',        'lat': 14.7000, 'lng': 121.0333},
  {'name': 'Lucky Boba - Cloverleaf',   'branch_id': 21, 'address': 'Ayala Malls Cloverleaf, QC',                            'image': 'assets/images/cloverleaf_branch.jpg',    'lat': 14.6540, 'lng': 121.0020},
  {'name': 'Ayala Malls Fairview Terraces', 'branch_id': 22, 'address': 'Upper Ground Floor, Fairview, QC',                 'image': 'assets/images/ayalateracces_branch.jpg', 'lat': 14.7340, 'lng': 121.0578},
  {'name': 'Ayala Malls Feliz',         'branch_id': 2,  'address': 'Level 4, Food Choices, Pasig City',                     'image': 'assets/images/mallfeliz_branch.jpg',     'lat': 14.6186, 'lng': 121.0963},
  {'name': 'Landmark, Trinoma',         'branch_id': 23, 'address': 'Level 1 Food Center, Landmark Supermarket',             'image': 'assets/images/landmark_branch.jpg',      'lat': 14.6534, 'lng': 121.0336},
  {'name': 'SM North Edsa',             'branch_id': 24, 'address': 'The Block Entrance, SM North Edsa',                     'image': 'assets/images/smnorth_branch.jpg',       'lat': 14.6565, 'lng': 121.0305},
  {'name': 'SM Novaliches',             'branch_id': 3,  'address': 'Ground Floor, SM Novaliches, QC',                       'image': 'assets/images/smnova_branch.jpg',        'lat': 14.7047, 'lng': 121.0346},
  {'name': 'SM San Lazaro',             'branch_id': 25, 'address': 'Lower Ground Floor, SM San Lazaro, Manila',             'image': 'assets/images/sanlazaro_branch.jpg',     'lat': 14.6158, 'lng': 120.9830},
  {'name': 'Sta. Lucia Mall',           'branch_id': 26, 'address': 'Ground Floor, Sta. Lucia East Grand Mall',              'image': 'assets/images/stalucia_branch.jpg',      'lat': 14.6190, 'lng': 121.1000},
  {'name': 'Nova Plaza Mall',           'branch_id': 27, 'address': '3rd Floor, Novaliches, Quezon City',                    'image': 'assets/images/novaplaza_branch.jpg',     'lat': 14.7214, 'lng': 121.0421},
  {'name': 'Spark Place Cubao',         'branch_id': 28, 'address': '2nd Floor, Sparks Place, Cubao, QC',                    'image': 'assets/images/sparkplace_branch.jpg',    'lat': 14.6179, 'lng': 121.0553},
];

// ── Purple + orange palette ──────────────────────────────────────────────────
const Color _kPurple      = Color(0xFF7C3AED);
const Color _kPurpleLight = Color(0xFF9D4EDD);
const Color _kOrange      = Color(0xFFFF8C00);
const Color _kWhite       = Colors.white;
const Color _kBg          = Color(0xFFF4F4F8);

double _calcDistance(double lat1, double lon1, double lat2, double lon2) {
  var p = 0.017453292519943295;
  var c = math.cos;
  var a = 0.5 - c((lat2 - lat1) * p) / 2 +
      c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p)) / 2;
  return 12742 * math.asin(math.sqrt(a));
}

class HomePage extends StatefulWidget {
  final VoidCallback? onGoToCards;
  const HomePage({super.key, this.onGoToCards});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  bool   _hasActiveCard  = false;
  bool   _loadingPoints  = true;
  int    _luckyPoints    = 0;
  bool   _loadingNearby  = true;
  Map<String, dynamic>? _nearestStore;
  double _nearestDist    = 0;
  String _userName       = '';

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  Future<void> _loadAll() async {
    await Future.wait([
      _checkActiveCard(),
      _fetchLuckyPoints(),
      _loadNearestStore(),
      _loadUserName(),
    ]);
    _checkInitialBranchSelection();
  }

  Future<void> _loadUserName() async {
    final prefs = await SharedPreferences.getInstance();
    final name = prefs.getString('user_name') ?? prefs.getString('name') ?? '';
    if (mounted) setState(() => _userName = name);
  }

  Future<void> _checkInitialBranchSelection() async {
    final prefs = await SharedPreferences.getInstance();
    if (prefs.getInt('selected_branch_id') == null) {
      WidgetsBinding.instance
          .addPostFrameCallback((_) => _showBranchPicker('Lucky Classic'));
    }
  }

  Future<void> _checkActiveCard() async {
    final prefs = await SharedPreferences.getInstance();
    final int? userId = prefs.getInt('user_id');
    if (userId == null) return;
    try {
      final response = await http
          .get(Uri.parse('${AppConfig.apiUrl}/check-card-status/$userId'))
          .timeout(const Duration(seconds: 8));
      if (response.statusCode == 200) {
        final data    = jsonDecode(response.body);
        final hasCard = data['has_active_card'] == true;
        await prefs.setBool('has_active_card', hasCard);
        if (mounted) setState(() => _hasActiveCard = hasCard);
      }
    } catch (_) {}
  }

  Future<void> _fetchLuckyPoints() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('session_token') ?? '';
    if (token.isEmpty) {
      if (mounted) setState(() => _loadingPoints = false);
      return;
    }
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.apiUrl}/points'),
        headers: {'Accept': 'application/json', 'Authorization': 'Bearer $token'},
      ).timeout(const Duration(seconds: 8));
      if (response.statusCode == 200) {
        final data  = jsonDecode(response.body);
        final dynamic raw = data['points'] ?? 0;
        if (mounted) {
          setState(() => _luckyPoints =
              raw is int ? raw : int.tryParse(raw.toString()) ?? 0);
        }
      }
    } catch (_) {}
    finally {
      if (mounted) setState(() => _loadingPoints = false);
    }
  }

  Future<void> _loadNearestStore() async {
    double userLat = 14.7040, userLng = 121.0340;
    try {
      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.whileInUse ||
          perm == LocationPermission.always) {
        final pos = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
        ).timeout(const Duration(seconds: 5));
        userLat = pos.latitude;
        userLng = pos.longitude;
      }
    } catch (_) {}

    final sorted = List<Map<String, dynamic>>.from(_kStoreLocations);
    for (var s in sorted) {
      s['_dist'] = _calcDistance(userLat, userLng, s['lat'], s['lng']);
    }
    sorted.sort((a, b) => (a['_dist'] as double).compareTo(b['_dist'] as double));
    if (mounted) {
      setState(() {
        _nearestStore = sorted.first;
        _nearestDist  = sorted.first['_dist'];
        _loadingNearby = false;
      });
    }
  }

  Future<void> _showBranchPicker(String categoryLabel) async {
    final String? menuCategory = _kCategoryMap[categoryLabel];
    if (menuCategory == null) return;
    final sorted = List<Map<String, dynamic>>.from(_kStoreLocations);
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _BranchPickerSheet(
        categoryLabel: categoryLabel,
        menuCategory: menuCategory,
        stores: sorted,
      ),
    );
  }

  void _goToCards() {
    if (widget.onGoToCards != null) widget.onGoToCards!();
  }

  // ── BUILD ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final topPad = MediaQuery.of(context).padding.top;

    return Container(
      color: _kBg,
      child: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Purple header ──────────────────────────────────────────────
            _buildPurpleHeader(topPad),

            // ── White content area ─────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 28),

                  // What's Hot / Featured
                  Row(
                    children: [
                      const Icon(PhosphorIconsFill.fire,
                          color: _kOrange, size: 20),
                      const SizedBox(width: 8),
                      Text('Featured Drinks',
                          style: GoogleFonts.outfit(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF1A1A2E))),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Hero banner
                  _TappableCard(
                    child: _HeroBannerLight(
                      imagePath: 'assets/images/promo1.png',
                      title: 'Winter Specials',
                      subTitle: 'Premium Series',
                      cta: 'ORDER NOW',
                    ),
                  ),

                  const SizedBox(height: 28),

                  // Categories
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Categories',
                          style: GoogleFonts.outfit(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF1A1A2E))),
                      GestureDetector(
                        child: Text('See All',
                            style: GoogleFonts.outfit(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: _kPurple)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  SizedBox(
                    height: 100,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      physics: const BouncingScrollPhysics(),
                      padding: EdgeInsets.zero,
                      children: [
                        _CategoryCard(
                          label: 'Classics',
                          icon: PhosphorIconsFill.coffee,
                          color: const Color(0xFF7C3AED),
                          onTap: () => _showBranchPicker('Lucky Classic'),
                        ),
                        _CategoryCard(
                          label: 'Frappes',
                          icon: PhosphorIconsFill.iceCream,
                          color: const Color(0xFFEC4899),
                          onTap: () => _showBranchPicker('Frappes'),
                        ),
                        _CategoryCard(
                          label: 'Coffees',
                          icon: PhosphorIconsFill.coffee,
                          color: const Color(0xFF8B5CF6),
                          onTap: () => _showBranchPicker('Iced Coffees'),
                        ),
                        _CategoryCard(
                          label: 'Juices',
                          icon: PhosphorIconsFill.drop,
                          color: const Color(0xFF10B981),
                          onTap: () => _showBranchPicker('Fruit Juices'),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 28),

                  // Nearest branch
                  Text('Visit Us',
                      style: GoogleFonts.outfit(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF1A1A2E))),
                  const SizedBox(height: 14),

                  _loadingNearby
                      ? Container(
                          height: 180,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.06),
                                blurRadius: 12,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: const Center(
                              child: CircularProgressIndicator(
                                  color: _kPurple)),
                        )
                      : _NearbyStoreBanner(
                          store: _nearestStore!, dist: _nearestDist),

                  const SizedBox(height: 120),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Purple header widget ───────────────────────────────────────────────────

  Widget _buildPurpleHeader(double topPad) {
    final greeting = _userName.isNotEmpty
        ? 'Hi, ${_userName.split(' ').first}!'
        : 'Welcome!';

    return Stack(
      clipBehavior: Clip.none,
      children: [
        // Purple background
        Container(
          width: double.infinity,
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF6D28D9), _kPurpleLight],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          padding: EdgeInsets.only(
              top: topPad + 16, left: 20, right: 20, bottom: 40),
          child: Column(
            children: [
              // Top row: logo + search icon
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const SizedBox(width: 40),
                  // Logo / brand name
                  Row(
                    children: [
                      Image.asset(
                        'assets/images/logo.png',
                        height: 40,
                        errorBuilder: (context, error, trace) => const Icon(
                          PhosphorIconsFill.star,
                          color: _kOrange,
                          size: 36,
                        ),
                      ),
                    ],
                  ),
                  // Search button
                  GestureDetector(
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.search_rounded,
                          color: _kWhite, size: 22),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              // Greeting
              Text(
                greeting,
                style: GoogleFonts.outfit(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  color: _kWhite,
                ),
              ),

              const SizedBox(height: 20),

              // Stat cards row
              IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Expanded(
                      child: _StatCardLight(
                        label: 'Loyalty Points',
                        value: _loadingPoints
                            ? '...'
                            : '$_luckyPoints Points',
                        icon: PhosphorIconsFill.sparkle,
                        iconColor: _kOrange,
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => PointsPage(points: _luckyPoints),
                          ),
                        ).then((_) => _fetchLuckyPoints()),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: _StatCardLight(
                        label: 'Active Rewards',
                        value: _hasActiveCard ? 'Active' : 'None',
                        subValue: _hasActiveCard ? 'Available' : null,
                        icon: PhosphorIconsFill.gift,
                        iconColor: const Color(0xFF10B981),
                        badge: _hasActiveCard ? null : 'GET',
                        onTap: _goToCards,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),

        // Wave curve at the bottom of purple header
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: CustomPaint(
            size: const Size(double.infinity, 32),
            painter: _WavePainter(color: _kBg),
          ),
        ),
      ],
    );
  }
}

// ── Wave painter ─────────────────────────────────────────────────────────────

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
  bool shouldRepaint(_WavePainter old) => old.color != color;
}

// ── Light stat card (used in purple header) ───────────────────────────────────

class _StatCardLight extends StatelessWidget {
  final String label, value;
  final String? subValue, badge;
  final IconData icon;
  final Color iconColor;
  final VoidCallback? onTap;

  const _StatCardLight({
    required this.label,
    required this.value,
    this.subValue,
    this.badge,
    required this.icon,
    required this.iconColor,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.10),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: iconColor, size: 16),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    label,
                    style: GoogleFonts.outfit(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey[600],
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (badge != null)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: _kPurple.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      badge!,
                      style: GoogleFonts.outfit(
                        fontSize: 8,
                        fontWeight: FontWeight.w900,
                        color: _kPurple,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: GoogleFonts.outfit(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: const Color(0xFF1A1A2E),
                height: 1.1,
              ),
            ),
            if (subValue != null) ...[
              const SizedBox(height: 2),
              Text(
                subValue!,
                style: GoogleFonts.outfit(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: Colors.grey[500],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Light hero banner (Featured Drinks card) ──────────────────────────────────

class _HeroBannerLight extends StatelessWidget {
  final String imagePath, title, subTitle, cta;
  const _HeroBannerLight({
    required this.imagePath,
    required this.title,
    required this.subTitle,
    required this.cta,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: 190,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: _kPurple.withValues(alpha: 0.18),
            blurRadius: 18,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(22),
        child: Stack(
          children: [
            Positioned.fill(
              child: Image.asset(
                imagePath,
                fit: BoxFit.cover,
                color: Colors.black.withValues(alpha: 0.25),
                colorBlendMode: BlendMode.darken,
              ),
            ),
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      Colors.black.withValues(alpha: 0.75),
                    ],
                  ),
                ),
              ),
            ),
            Positioned(
              left: 18,
              right: 18,
              bottom: 18,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        subTitle.toUpperCase(),
                        style: GoogleFonts.outfit(
                            fontSize: 9,
                            color: Colors.white60,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 2),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        title,
                        style: GoogleFonts.outfit(
                            fontSize: 22,
                            color: _kWhite,
                            fontWeight: FontWeight.w800),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 9),
                    decoration: BoxDecoration(
                      color: _kOrange,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      cta,
                      style: GoogleFonts.outfit(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: _kWhite),
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

// ── Light category card ────────────────────────────────────────────────────────

class _CategoryCard extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _CategoryCard({
    required this.label,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 78,
        margin: const EdgeInsets.only(right: 14),
        child: Column(
          children: [
            Container(
              width: 68,
              height: 68,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                    color: color.withValues(alpha: 0.2), width: 1.2),
              ),
              child: Icon(icon, color: color, size: 28),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: GoogleFonts.outfit(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF4B4B6B)),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Nearby store banner ────────────────────────────────────────────────────────

class _NearbyStoreBanner extends StatelessWidget {
  final Map<String, dynamic> store;
  final double dist;
  const _NearbyStoreBanner({required this.store, required this.dist});

  @override
  Widget build(BuildContext context) {
    return _TappableCard(
      child: Container(
        width: double.infinity,
        height: 180,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(22),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(22),
          child: Stack(
            children: [
              Positioned.fill(
                child: Image.asset(
                  store['image'],
                  fit: BoxFit.cover,
                  color: Colors.black.withValues(alpha: 0.35),
                  colorBlendMode: BlendMode.darken,
                ),
              ),
              Positioned.fill(
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        Colors.black.withValues(alpha: 0.80),
                      ],
                    ),
                  ),
                ),
              ),
              Positioned(
                top: 14,
                right: 14,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.25),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '${dist.toStringAsFixed(1)} KM',
                    style: GoogleFonts.outfit(
                        fontSize: 10,
                        color: _kWhite,
                        fontWeight: FontWeight.w800),
                  ),
                ),
              ),
              Positioned(
                left: 18,
                right: 18,
                bottom: 18,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'NEAREST BRANCH',
                      style: GoogleFonts.outfit(
                          fontSize: 9,
                          color: _kOrange,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.5),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      store['name'],
                      style: GoogleFonts.outfit(
                          fontSize: 20,
                          color: _kWhite,
                          fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Branch picker sheet ────────────────────────────────────────────────────────

class _BranchPickerSheet extends StatelessWidget {
  final String categoryLabel, menuCategory;
  final List<Map<String, dynamic>> stores;
  const _BranchPickerSheet({
    required this.categoryLabel,
    required this.menuCategory,
    required this.stores,
  });

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.75,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (_, scrollCtrl) => Container(
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.9),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 12),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 24),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Choose Branch',
                            style: GoogleFonts.outfit(
                                fontSize: 24,
                                fontWeight: FontWeight.w800,
                                color: Colors.white)),
                        Text('Browsing $categoryLabel',
                            style: GoogleFonts.outfit(
                                fontSize: 12, color: Colors.white54)),
                      ],
                    ),
                  ),
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: const BoxDecoration(
                          color: Colors.white10, shape: BoxShape.circle),
                      child: const Icon(Icons.close_rounded,
                          color: Colors.white, size: 20),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Expanded(
              child: ListView.builder(
                controller: scrollCtrl,
                padding: const EdgeInsets.symmetric(horizontal: 24),
                itemCount: stores.length,
                itemBuilder: (_, i) => _BranchTile(
                  store: stores[i],
                  isNearest: i == 0,
                  onTap: () async {
                    final prefs = await SharedPreferences.getInstance();
                    await prefs.setInt(
                        'selected_branch_id', stores[i]['branch_id']);
                    await prefs.setString(
                        'selected_branch_name', stores[i]['name']);
                    if (context.mounted) {
                      Navigator.pop(context);
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => MenuPage(
                            selectedStore: stores[i]['name'],
                            branchId: stores[i]['branch_id'],
                          ),
                        ),
                      );
                    }
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BranchTile extends StatelessWidget {
  final Map<String, dynamic> store;
  final bool isNearest;
  final VoidCallback onTap;
  const _BranchTile(
      {required this.store, required this.isNearest, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(16),
        decoration: AppTheme.glassDecoration(borderRadius: 20, opacity: 0.1),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.asset(store['image'],
                  width: 50, height: 50, fit: BoxFit.cover),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(store['name'],
                      style: GoogleFonts.outfit(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: Colors.white)),
                  Text(store['address'],
                      style: GoogleFonts.outfit(
                          fontSize: 11, color: Colors.white54),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
            if (isNearest)
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _kOrange.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text('NEAR',
                    style: GoogleFonts.outfit(
                        fontSize: 8,
                        fontWeight: FontWeight.w900,
                        color: _kOrange)),
              ),
          ],
        ),
      ),
    );
  }
}

// ── Tappable card (scale animation) ───────────────────────────────────────────

class _TappableCard extends StatefulWidget {
  final Widget child;
  const _TappableCard({required this.child});

  @override
  State<_TappableCard> createState() => _TappableCardState();
}

class _TappableCardState extends State<_TappableCard>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 100));
    _scale = Tween(begin: 1.0, end: 0.97)
        .animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOut));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _ctrl.forward(),
      onTapUp: (_) => _ctrl.reverse(),
      onTapCancel: () => _ctrl.reverse(),
      child: ScaleTransition(scale: _scale, child: widget.child),
    );
  }
}