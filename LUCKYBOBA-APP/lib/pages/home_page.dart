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
import '../widgets/tappable_card.dart';
import 'points_page.dart';

const Map<String, String> _kCategoryMap = {
  'Lucky Classic': 'Classic Milktea',
  'Classic':       'Classic Milktea',
  'Classic Jr':    'Classic Jr.',
  'Cheese':        'Cheese Series',
  'Frappes':       'Frappes',
  'Coffees':       'Iced Coffee',
  'Hot Drinks':    'Hot Drinks',
  'Juices':        'Fruit Soda Series',
  'Pudding':       'Pudding',
};

final List<Map<String, dynamic>> _kAllCategories = [
  {'label': 'Classic',    'imagePath': 'assets/images/lucky_classic.png', 'color': const Color(0xFF7C3AED)},
  {'label': 'Classic Jr', 'imagePath': 'assets/images/classicjr.png',     'color': const Color(0xFFF59E0B)},
  {'label': 'Cheese',     'imagePath': 'assets/images/cheese_series.png', 'color': const Color(0xFFFBBF24)},
  {'label': 'Frappes',    'imagePath': 'assets/images/frappe.png',        'color': const Color(0xFFEC4899)},
  {'label': 'Hot Drinks', 'imagePath': 'assets/images/hot_drinks.png',    'color': const Color(0xFFEF4444)},
  {'label': 'Coffees',    'imagePath': 'assets/images/iced_coffee.png',   'color': const Color(0xFF8B5CF6)},
  {'label': 'Juices',     'imagePath': 'assets/images/fruit_juices.png',  'color': const Color(0xFF10B981)},
  {'label': 'Pudding',    'imagePath': 'assets/images/pudding.png',       'color': const Color(0xFF6366F1)},
];

// Store locations are now fetched dynamically from the backend API.
List<Map<String, dynamic>> _kStoreLocations = [];

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
  Position? _currentPosition;

  List<Map<String, dynamic>> _featuredDrinks = [];
  bool _loadingFeaturedDrinks = true;

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  Future<void> _loadAll() async {
    await Future.wait([
      _fetchBranches(),
      _checkActiveCard(),
      _fetchLuckyPoints(),
      _loadUserName(),
      _fetchFeaturedDrinks(),
    ]);
    await _loadNearestStore();
    _checkInitialBranchSelection();
  }

  Future<void> _fetchBranches() async {
    try {
      final response = await http
          .get(Uri.parse('${AppConfig.apiUrl}/branches/available'))
          .timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        if (mounted) {
          setState(() {
            _kStoreLocations = data.map((b) {
              final lat = double.tryParse(b['latitude']?.toString() ?? '0') ?? 0;
              final lng = double.tryParse(b['longitude']?.toString() ?? '0') ?? 0;
              double distance = 0.0;
              if (_currentPosition != null && lat != 0 && lng != 0) {
                distance = _calcDistance(
                  _currentPosition!.latitude,
                  _currentPosition!.longitude,
                  lat,
                  lng,
                );
              }
              return {
                'name': b['name'],
                'branch_id': b['id'],
                'address': b['address'] ?? '',
                'image': b['image'] ?? 'assets/images/vipra_branch.png',
                'lat': lat,
                'lng': lng,
                'distance': distance,
              };
            }).toList();

            // Sort by distance if current position is available
            if (_currentPosition != null) {
              _kStoreLocations.sort((a, b) => 
                (a['distance'] as double).compareTo(b['distance'] as double));
            }
          });
        }
      }
    } catch (_) {
      // Fallback to minimal if needed
    }
  }

  Future<void> _fetchFeaturedDrinks() async {
    try {
      final response = await http
          .get(Uri.parse('${AppConfig.apiUrl}/featured-drinks'))
          .timeout(const Duration(seconds: 8));
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        if (mounted) {
          setState(() {
            _featuredDrinks = data.map((e) => e as Map<String, dynamic>).toList();
          });
        }
      }
    } catch (_) {}
    finally {
      if (mounted) setState(() => _loadingFeaturedDrinks = false);
    }
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
        if (mounted) setState(() => _currentPosition = pos);
      }
    } catch (_) {}

    final sorted = List<Map<String, dynamic>>.from(_kStoreLocations);
    for (var s in sorted) {
      s['_dist'] = _calcDistance(userLat, userLng, s['lat'], s['lng']);
    }
    sorted.sort((a, b) => (a['_dist'] as double).compareTo(b['_dist'] as double));
    if (mounted) {
      setState(() {
        if (sorted.isNotEmpty) {
          _nearestStore = sorted.first;
          _nearestDist = sorted.first['_dist'];
        } else {
          _nearestStore = null;
          _nearestDist = null;
        }
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
                  if (_loadingFeaturedDrinks)
                    const SizedBox(
                      height: 190,
                      child: Center(
                        child: CircularProgressIndicator(color: _kPurple),
                      ),
                    )
                  else if (_featuredDrinks.isEmpty)
                    _HeroBannerLight(
                      onTap: () => _showBranchPicker('Cheese'),
                      imagePath: 'assets/images/cheese_series.png',
                      title: 'Cheese Series',
                      subTitle: 'Premium Collection',
                      cta: 'ORDER NOW',
                    )
                  else
                    SizedBox(
                      height: 190,
                      child: PageView.builder(
                        itemCount: _featuredDrinks.length,
                        itemBuilder: (context, index) {
                          final item = _featuredDrinks[index];
                          return _HeroBannerLight(
                            onTap: () => _showBranchPicker('Classic'),
                            imagePath: item['image_url'] ?? 'assets/images/cheese_series.png',
                            title: item['title'] ?? '',
                            subTitle: item['subtitle'] ?? '',
                            cta: item['cta_text'] ?? 'ORDER NOW',
                          );
                        },
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
                    height: 120,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      physics: const BouncingScrollPhysics(),
                      padding: EdgeInsets.zero,
                      itemCount: _kAllCategories.length,
                      itemBuilder: (context, index) {
                        final cat = _kAllCategories[index];
                        return _CategoryCard(
                          label: cat['label'] as String,
                          imagePath: cat['imagePath'] as String,
                          color: cat['color'] as Color,
                          onTap: () => _showBranchPicker(cat['label'] as String),
                        );
                      },
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
                      : (_nearestStore == null || _nearestDist == null)
                          ? Container(
                              height: 180,
                              decoration: AppTheme.glassDecoration(
                                borderRadius: 22,
                                opacity: 0.1,
                                shadowColor: _kOrange,
                                shadowBlur: 20,
                              ),
                              child: Center(
                                child: Text(
                                  'No nearby store available yet.',
                                  style: GoogleFonts.outfit(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: _kTextMid,
                                  ),
                                ),
                              ),
                            )
                          : _NearbyStoreBanner(
                              store: _nearestStore!, dist: _nearestDist!),

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
  final VoidCallback? onTap;

  const _HeroBannerLight({
    required this.imagePath,
    required this.title,
    required this.subTitle,
    required this.cta,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return TappableCard(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        height: 190,
        decoration: AppTheme.glassDecoration(
          borderRadius: 22,
          opacity: 0.05,
          shadowColor: _kPurple,
          shadowBlur: 20,
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(22),
          child: Stack(
            children: [
              Positioned.fill(
                child: Hero(
                  tag: 'featured_$title',
                  child: imagePath.startsWith('http')
                      ? Image.network(
                          imagePath,
                          fit: BoxFit.cover,
                          color: Colors.black.withValues(alpha: 0.25),
                          colorBlendMode: BlendMode.darken,
                          errorBuilder: (context, error, trace) => Container(
                            color: const Color(0xFF2D2A42),
                            alignment: Alignment.center,
                            child: const Icon(
                              Icons.local_cafe_rounded,
                              color: Colors.white70,
                              size: 36,
                            ),
                          ),
                        )
                      : Image.asset(
                          imagePath,
                          fit: BoxFit.cover,
                          color: Colors.black.withValues(alpha: 0.25),
                          colorBlendMode: BlendMode.darken,
                          errorBuilder: (context, error, trace) => Container(
                            color: const Color(0xFF2D2A42),
                            alignment: Alignment.center,
                            child: const Icon(
                              Icons.local_cafe_rounded,
                              color: Colors.white70,
                              size: 36,
                            ),
                          ),
                        ),
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
      ),
    );
  }
}

// ── Light category card ────────────────────────────────────────────────────────

class _CategoryCard extends StatelessWidget {
  final String label;
  final String imagePath;
  final Color color;
  final VoidCallback onTap;

  const _CategoryCard({
    required this.label,
    required this.imagePath,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return TappableCard(
      onTap: onTap,
      child: Container(
        width: 100,
        margin: const EdgeInsets.only(right: 12),
        decoration: AppTheme.glassDecoration(
          borderRadius: 20,
          opacity: 0.05,
          shadowColor: color,
          shadowBlur: 14,
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: Stack(
            children: [
              // Background Image
              Positioned.fill(
                child: Hero(
                  tag: 'cat_$label',
                  child: Image.asset(
                    imagePath,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, trace) => Container(
                      color: color.withValues(alpha: 0.20),
                      alignment: Alignment.center,
                      child: Icon(
                        Icons.fastfood_rounded,
                        color: color,
                        size: 26,
                      ),
                    ),
                  ),
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
                        Colors.transparent,
                        Colors.black.withValues(alpha: 0.7),
                      ],
                    ),
                  ),
                ),
              ),
              // Label
              Positioned(
                left: 8,
                right: 8,
                bottom: 10,
                child: Text(
                  label,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.outfit(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                    height: 1.1,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
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
    return TappableCard(
      onTap: () {}, // Handled by outer logic or can be added
      child: Container(
        width: double.infinity,
        height: 180,
        decoration: AppTheme.glassDecoration(
          borderRadius: 22,
          opacity: 0.1,
          shadowColor: _kOrange,
          shadowBlur: 20,
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(22),
          child: Stack(
            children: [
              Positioned.fill(
                child: store['image'].toString().startsWith('http')
                    ? Image.network(
                        store['image'],
                        fit: BoxFit.cover,
                        color: Colors.black.withValues(alpha: 0.35),
                        colorBlendMode: BlendMode.darken,
                        errorBuilder: (context, error, trace) => Container(
                          color: Colors.grey[900],
                          child: const Icon(Icons.store_rounded, color: Colors.white, size: 40),
                        ),
                      )
                    : Image.asset(
                        store['image'],
                        fit: BoxFit.cover,
                        color: Colors.black.withValues(alpha: 0.35),
                        colorBlendMode: BlendMode.darken,
                        errorBuilder: (context, error, trace) => Container(
                          color: Colors.grey[900],
                          child: const Icon(Icons.store_rounded, color: Colors.white, size: 40),
                        ),
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
              child: Image.asset(
                store['image'],
                width: 50,
                height: 50,
                fit: BoxFit.cover,
                errorBuilder: (context, error, trace) => Container(
                  width: 50,
                  height: 50,
                  color: Colors.white10,
                  alignment: Alignment.center,
                  child: const Icon(
                    Icons.storefront_rounded,
                    color: Colors.white70,
                    size: 20,
                  ),
                ),
              ),
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