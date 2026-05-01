// FILE: lib/pages/stores_page.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:math' as math;
import '../config/app_config.dart';
import '../widgets/app_top_bar.dart';

// ── Shared palette ────────────────────────────────────────────────────────────
const Color _kPurple   = Color(0xFF7C3AED);
const Color _kOrange   = Color(0xFFFF8C00);
const Color _kSurface  = Color(0xFFF2EEF8);
const Color _kTextDark = Color(0xFF1A1A2E);
const Color _kTextMid  = Color(0xFF6B6B8A);

class StoresPage extends StatefulWidget {
  final VoidCallback? onBack;
  const StoresPage({super.key, this.onBack});

  @override
  State<StoresPage> createState() => _StoresPageState();
}

class _StoresPageState extends State<StoresPage> {
  final MapController  _mapController  = MapController();
  late  PageController _pageController;

  List<Map<String, dynamic>> storeLocations = [];
  LatLng _userLocation      = const LatLng(14.7040, 121.0340);
  bool   _isLoadingLocation = false;
  bool   _isLoadingStores   = true;
  bool   _isMapReady        = false;
  int    _selectedIndex     = 0;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(initialPage: 0, viewportFraction: 1.0);
    _fetchStores();
  }

  Future<void> _fetchStores() async {
    setState(() => _isLoadingStores = true);
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.apiUrl}/branches/available'),
        headers: {'Accept': 'application/json'},
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        if (body['success'] == true) {
          final List<dynamic> data = body['data'];
          setState(() {
            storeLocations = data.map((b) {
              final double lat = double.tryParse(b['latitude']?.toString() ?? '') ?? 0.0;
              final double lng = double.tryParse(b['longitude']?.toString() ?? '') ?? 0.0;
              return {
                'name': b['name'] ?? 'Unknown Branch',
                'branch_id': b['id'],
                'address': b['location'] ?? 'No address provided',
                'image': b['image'], // keep it null if null
                'lat': lat,
                'lng': lng,
                'closeTime': '09:00 PM',
                'url': 'https://www.google.com/maps/search/?api=1&query=$lat,$lng',
              };
            }).where((s) => s['lat'] != 0.0 || s['lng'] != 0.0).toList();
            
            if (storeLocations.isEmpty) {
              _useFallbackStores();
              return;
            }

            _calculateAndSortStores();
            _isLoadingStores = false;
          });
          return;
        }
      }
      _useFallbackStores();
    } catch (_) {
      _useFallbackStores();
    }
  }

  void _useFallbackStores() {
    setState(() {
      storeLocations = [
        {'name': 'East Fairview',             'branch_id': 6,  'address': 'Dunhill Corner Winston St. East Fairview Q.C',        'image': 'assets/images/eastfairview_branch.png', 'lat': 14.7032, 'lng': 121.0695, 'closeTime': '09:00 PM', 'url': 'https://www.google.com/maps/search/?api=1&query=14.7032,121.0695'},
        {'name': 'AUF Angeles',               'branch_id': 7,  'address': 'Stall #7 JCL foodcourt, 704 Fajardo st.',             'image': 'assets/images/auf_branch.jpg',           'lat': 15.1451, 'lng': 120.5941, 'closeTime': '07:00 PM', 'url': 'https://www.google.com/maps/search/?api=1&query=15.1451,120.5941'},
        {'name': 'Robinsons Galleria Cebu',   'branch_id': 8,  'address': '3rd Floor, Robinsons Galleria Cebu',                  'image': 'assets/images/galleriacebu_branch.jpg',  'lat': 10.3061, 'lng': 123.9059, 'closeTime': '09:00 PM', 'url': 'https://www.google.com/maps/search/?api=1&query=10.3061,123.9059'},
        {'name': 'Jenra Grand Mall',          'branch_id': 9,  'address': 'Upper Ground Floor (near Jollibee Entrance)',         'image': 'assets/images/jenra_branch.png',         'lat': 15.1336, 'lng': 120.5907, 'closeTime': '08:00 PM', 'url': 'https://www.google.com/maps/search/?api=1&query=15.1336,120.5907'},
        {'name': 'Pamana Medical Center',     'branch_id': 10, 'address': 'National Highway, Calamba, Laguna',                   'image': 'assets/images/pamana_branch.jpg',        'lat': 14.2017, 'lng': 121.1565, 'closeTime': '08:00 PM', 'url': 'https://www.google.com/maps/search/?api=1&query=14.2017,121.1565'},
        {'name': 'Dahlia',                    'branch_id': 11, 'address': '#10 Dahlia Avenue, Fairview, Quezon City',            'image': 'assets/images/dahlia_branch.png',        'lat': 14.7028, 'lng': 121.0664, 'closeTime': '09:00 PM', 'url': 'https://www.google.com/maps/search/?api=1&query=14.7028,121.0664'},
        {'name': 'Misamis St., Bago Bantay',  'branch_id': 12, 'address': '43 Misamis St. Sto. Cristo, Bago Bantay',            'image': 'assets/images/misamis_branch.png',       'lat': 14.6598, 'lng': 121.0263, 'closeTime': '09:00 PM', 'url': 'https://www.google.com/maps/search/?api=1&query=14.6598,121.0263'},
        {'name': 'Pontiac',                   'branch_id': 13, 'address': 'Pontiac st. cor. Datsun st. Fairview, Quezon City',  'image': 'assets/images/pontiac_branch.png',       'lat': 14.7065, 'lng': 121.0621, 'closeTime': '09:00 PM', 'url': 'https://www.google.com/maps/search/?api=1&query=14.7065,121.0621'},
        {'name': 'QCGH',                      'branch_id': 14, 'address': 'Stall # 5 Seminary Road Project 8, Quezon City',     'image': 'assets/images/qcgh_branch.png',          'lat': 14.6669, 'lng': 121.0221, 'closeTime': '08:00 PM', 'url': 'https://www.google.com/maps/search/?api=1&query=14.6669,121.0221'},
        {'name': 'Tondo, Manila',             'branch_id': 15, 'address': '539 Perla St., Tondo, Manila',                       'image': 'assets/images/tondo_branch.png',         'lat': 14.6138, 'lng': 120.9678, 'closeTime': '09:00 PM', 'url': 'https://www.google.com/maps/search/?api=1&query=14.6138,120.9678'},
        {'name': 'Lucky Boba - Main Branch',  'branch_id': 1,  'address': '356 Vipra St., Sangandaan, Quezon City',             'image': 'assets/images/vipra_branch.png',         'lat': 14.6811, 'lng': 121.0368, 'closeTime': '09:00 PM', 'url': 'https://www.google.com/maps/search/?api=1&query=14.6811,121.0368'},
        {'name': 'Starmall Shaw Blvd.',       'branch_id': 16, 'address': 'near Kalentong Jeepney Terminal',                    'image': 'assets/images/starmall_branch.png',      'lat': 14.5826, 'lng': 121.0535, 'closeTime': '09:00 PM', 'url': 'https://www.google.com/maps/search/?api=1&query=14.5826,121.0535'},
        {'name': 'Eton Centris',              'branch_id': 17, 'address': 'Second Floor, Eton Centris Station Mall',            'image': 'assets/images/etoncentris_branch.png',   'lat': 14.6444, 'lng': 121.0375, 'closeTime': '10:00 PM', 'url': 'https://www.google.com/maps/search/?api=1&query=14.6444,121.0375'},
        {'name': 'Isetann Cubao',             'branch_id': 18, 'address': 'Ground Floor, Isetann Department Store',             'image': 'assets/images/isetann_branch.jpg',       'lat': 14.6219, 'lng': 121.0515, 'closeTime': '08:30 PM', 'url': 'https://www.google.com/maps/search/?api=1&query=14.6219,121.0515'},
        {'name': 'Candelaria, Quezon',        'branch_id': 19, 'address': 'Maharlika Highway, Candelaria',                      'image': 'assets/images/candelaria_branch.png',    'lat': 13.9272, 'lng': 121.4233, 'closeTime': '08:00 PM', 'url': 'https://www.google.com/maps/search/?api=1&query=13.9272,121.4233'},
        {'name': 'Himlayan Rd., Pasong Tamo', 'branch_id': 20, 'address': '217 Himlayan Road cor. Tandang Sora Ave.',           'image': 'assets/images/himlayanrd_branch.png',    'lat': 14.6785, 'lng': 121.0505, 'closeTime': '09:00 PM', 'url': 'https://www.google.com/maps/search/?api=1&query=14.6785,121.0505'},
        {'name': 'Lucky Boba - Bagbag',       'branch_id': 5,  'address': '657, 1116 Quirino Hwy, Novaliches',                  'image': 'assets/images/bagbag_branch.png',        'lat': 14.7000, 'lng': 121.0333, 'closeTime': '09:00 PM', 'url': 'https://www.google.com/maps/search/?api=1&query=14.7,121.0333'},
        {'name': 'Lucky Boba - Cloverleaf',   'branch_id': 21, 'address': 'Ayala Malls Cloverleaf, QC',                        'image': 'assets/images/cloverleaf_branch.jpg',    'lat': 14.6540, 'lng': 121.0020, 'closeTime': '09:30 PM', 'url': 'https://www.google.com/maps/search/?api=1&query=14.654,121.002'},
        {'name': 'Ayala Malls Fairview Terraces','branch_id': 22,'address': 'Upper Ground Floor, Fairview, QC',                'image': 'assets/images/ayalateracces_branch.jpg', 'lat': 14.7340, 'lng': 121.0578, 'closeTime': '09:00 PM', 'url': 'https://www.google.com/maps/search/?api=1&query=14.734,121.0578'},
        {'name': 'Lucky Boba - Ayala',        'branch_id': 2,  'address': 'Ayala Center',                                      'image': 'assets/images/mallfeliz_branch.jpg',     'lat': 14.6186, 'lng': 121.0963, 'closeTime': '10:00 PM', 'url': 'https://www.google.com/maps/search/?api=1&query=14.6186,121.0963'},
        {'name': 'Landmark, Trinoma',         'branch_id': 23, 'address': 'Level 1 Food Center, Landmark Supermarket',         'image': 'assets/images/landmark_branch.jpg',      'lat': 14.6534, 'lng': 121.0336, 'closeTime': '09:00 PM', 'url': 'https://www.google.com/maps/search/?api=1&query=14.6534,121.0336'},
        {'name': 'SM North Edsa',             'branch_id': 24, 'address': 'The Block Entrance, SM North Edsa',                 'image': 'assets/images/smnorth_branch.jpg',       'lat': 14.6565, 'lng': 121.0305, 'closeTime': '10:00 PM', 'url': 'https://www.google.com/maps/search/?api=1&query=14.6565,121.0305'},
        {'name': 'SM Novaliches',             'branch_id': 3,  'address': 'Ground Floor, SM Novaliches, QC',                   'image': 'assets/images/smnova_branch.jpg',        'lat': 14.7047, 'lng': 121.0346, 'closeTime': '09:00 PM', 'url': 'https://www.google.com/maps/search/?api=1&query=14.7047,121.0346'},
        {'name': 'SM San Lazaro',             'branch_id': 25, 'address': 'Lower Ground Floor, SM San Lazaro, Manila',         'image': 'assets/images/sanlazaro_branch.jpg',     'lat': 14.6158, 'lng': 120.9830, 'closeTime': '09:00 PM', 'url': 'https://www.google.com/maps/search/?api=1&query=14.6158,120.983'},
        {'name': 'Sta. Lucia Mall',           'branch_id': 26, 'address': 'Ground Floor, Sta. Lucia East Grand Mall',          'image': 'assets/images/stalucia_branch.jpg',      'lat': 14.6190, 'lng': 121.1000, 'closeTime': '09:00 PM', 'url': 'https://www.google.com/maps/search/?api=1&query=14.619,121.1'},
        {'name': 'Nova Plaza Mall',           'branch_id': 27, 'address': '3rd Floor, Novaliches, Quezon City',                'image': 'assets/images/novaplaza_branch.jpg',     'lat': 14.7214, 'lng': 121.0421, 'closeTime': '09:00 PM', 'url': 'https://www.google.com/maps/search/?api=1&query=14.7214,121.0421'},
        {'name': 'Spark Place Cubao',         'branch_id': 28, 'address': '2nd Floor, Sparks Place, Cubao, QC',               'image': 'assets/images/sparkplace_branch.jpg',    'lat': 14.6179, 'lng': 121.0553, 'closeTime': '09:00 PM', 'url': 'https://www.google.com/maps/search/?api=1&query=14.6179,121.0553'},
      ];
      _calculateAndSortStores();
      _isLoadingStores = false;
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _calculateAndSortStores() {
    if (storeLocations.isEmpty) return;
    for (var store in storeLocations) {
      store['distance'] = _calculateDistance(
        _userLocation.latitude, _userLocation.longitude,
        store['lat'],           store['lng'],
      );
    }
    storeLocations.sort((a, b) =>
        (a['distance'] as double).compareTo(b['distance'] as double));
  }

  Future<void> _getCurrentLocation() async {
    setState(() => _isLoadingLocation = true);
    try {
      final position = await Geolocator.getCurrentPosition(
        locationSettings:
            const LocationSettings(accuracy: LocationAccuracy.best),
      );
      setState(() {
        _userLocation = LatLng(position.latitude, position.longitude);
        _calculateAndSortStores();
        _isLoadingLocation = false;
      });
      if (_isMapReady && storeLocations.isNotEmpty) {
        _mapController.move(
            LatLng(storeLocations[0]['lat'] as double,
                storeLocations[0]['lng'] as double),
            15.0);
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingLocation = false);
    }
  }

  void _onPageChanged(int index) {
    setState(() => _selectedIndex = index);
    if (!_isMapReady) return;
    final store = storeLocations[index];
    _mapController.move(
        LatLng(store['lat'] as double, store['lng'] as double), 14.0);
  }

  Future<void> _launchMapsUrl(String urlString) async {
    final Uri url = Uri.parse(urlString);
    if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
      debugPrint('Could not launch $url');
    }
  }

  double _calculateDistance(
      double lat1, double lon1, double lat2, double lon2) {
    var p = 0.017453292519943295;
    var c = math.cos;
    var a = 0.5 -
        c((lat2 - lat1) * p) / 2 +
        c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p)) / 2;
    return 12742 * math.asin(math.sqrt(a));
  }

  @override
  Widget build(BuildContext context) {
    final topPad    = MediaQuery.of(context).padding.top;

    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // ── Full-screen map ─────────────────────────────────────────────────
          Positioned.fill(
            child: FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                initialCenter: _userLocation,
                initialZoom:   12.0,
                onMapReady:    () => setState(() => _isMapReady = true),
              ),
              children: [
                TileLayer(
                  urlTemplate:
                      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
                  subdomains: const ['a', 'b', 'c', 'd'],
                  retinaMode: RetinaMode.isHighDensity(context),
                ),
                MarkerLayer(
                  markers: [
                    // User location dot
                    Marker(
                      point:  _userLocation,
                      width:  48,
                      height: 48,
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.blue.withValues(alpha: 0.15),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.my_location_rounded,
                            color: Colors.blue, size: 22),
                      ),
                    ),

                    // Store markers — logo in a pin-shaped container
                    ...storeLocations.asMap().entries.map((entry) {
                      final i     = entry.key;
                      final store = entry.value;
                      final bool  isSelected = i == _selectedIndex;
                      return Marker(
                        point:     LatLng(store['lat'], store['lng']),
                        width:     isSelected ? 56 : 44,
                        height:    isSelected ? 56 : 44,
                        alignment: Alignment.topCenter,
                        child: GestureDetector(
                          onTap: () {
                            _pageController.animateToPage(i,
                                duration: const Duration(milliseconds: 350),
                                curve:    Curves.easeInOut);
                            _onPageChanged(i);
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 250),
                            width:  isSelected ? 52 : 40,
                            height: isSelected ? 52 : 40,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: isSelected ? _kOrange : _kPurple,
                                width: isSelected ? 2.5 : 2,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: (isSelected ? _kOrange : _kPurple)
                                      .withValues(alpha: 0.30),
                                  blurRadius: isSelected ? 10 : 6,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: ClipOval(
                              child: Padding(
                                padding: const EdgeInsets.all(4),
                                child: Image.asset(
                                  'assets/images/maps_logo.png',
                                  fit: BoxFit.contain,
                                  errorBuilder: (context, error, trace) => Icon(
                                    Icons.location_on_rounded,
                                    color: isSelected ? _kOrange : _kPurple,
                                    size: isSelected ? 24 : 18,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      );
                    }),
                  ],
                ),
              ],
            ),
          ),

          // ── Top bar (consistent light style) ───────────────────────────────
          Positioned(
            top: topPad,
            left: 0,
            right: 0,
            child: Container(
              color: Colors.white.withValues(alpha: 0.90),
              child: AppTopBar(
                title: 'Stores',
                subtitle: 'Choose a branch near you',
                onBack: widget.onBack ?? () => Navigator.of(context).maybePop(),
                trailing: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: _kSurface,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.search_rounded,
                    color: _kPurple,
                    size: 20,
                  ),
                ),
              ),
            ),
          ),

          // ── My-location FAB ─────────────────────────────────────────────────
          Positioned(
            bottom: 350,
            right:  16,
            child: GestureDetector(
              onTap: _isLoadingLocation ? null : _getCurrentLocation,
              child: Container(
                width:  44,
                height: 44,
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color:      Colors.black.withValues(alpha: 0.15),
                      blurRadius: 10,
                      offset:     const Offset(0, 4),
                    ),
                  ],
                ),
                child: _isLoadingLocation
                    ? const Padding(
                        padding: EdgeInsets.all(12),
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: _kPurple))
                    : const Icon(Icons.near_me_rounded,
                        color: _kPurple, size: 20),
              ),
            ),
          ),

          Positioned(
            bottom: 110,
            left: 0,
            right: 0,
            child: SizedBox(
              height: 220,
              child: PageView.builder(
                controller: _pageController,
                itemCount: storeLocations.length,
                onPageChanged: (i) {
                  setState(() => _selectedIndex = i);
                  _mapController.move(
                    LatLng(storeLocations[i]['lat'], storeLocations[i]['lng']),
                    14.5,
                  );
                },
                itemBuilder: (_, i) => _buildStoreCard(storeLocations[i]),
              ),
            ),
          ),
          if (_isLoadingStores)
            Positioned.fill(
              child: Container(
                color: Colors.white.withValues(alpha: 0.6),
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      CircularProgressIndicator(color: _kPurple),
                      const SizedBox(height: 16),
                      Text("Finding nearest stores...",
                          style: GoogleFonts.outfit(
                              color: _kPurple, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  // ── Store card — white with branch image on top ───────────────────────────
  Widget _buildStoreCard(Map<String, dynamic> store) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color:        Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color:      Colors.black.withValues(alpha: 0.14),
            blurRadius: 20,
            offset:     const Offset(0, 6),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Branch image ───────────────────────────────────────────
            SizedBox(
              height: 100,
              width:  double.infinity,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  (store['image'] == null || store['image'].toString().isEmpty)
                      ? Container(
                          color: _kSurface.withValues(alpha: 0.5),
                          child: Center(
                            child: Icon(Icons.store_rounded, color: _kPurple.withValues(alpha: 0.5), size: 40),
                          ),
                        )
                      : store['image'].toString().startsWith('http')
                          ? Image.network(
                              store['image'],
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, trace) => Container(
                                color: _kSurface,
                                child: const Icon(Icons.store_rounded,
                                    color: _kPurple, size: 40),
                              ),
                            )
                          : Image.asset(
                              store['image'],
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, trace) => Container(
                                color: _kSurface,
                                child: const Icon(Icons.store_rounded,
                                    color: _kPurple, size: 40),
                              ),
                            ),
                  // Subtle dark gradient for readability
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.transparent,
                          Colors.black.withValues(alpha: 0.25),
                        ],
                        begin: Alignment.topCenter,
                        end:   Alignment.bottomCenter,
                      ),
                    ),
                  ),
                  // Lucky logo badge top-left
                  Positioned(
                    top:  10,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color:      Colors.black.withValues(alpha: 0.15),
                            blurRadius: 8,
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          SizedBox(
                            width:  18,
                            height: 18,
                            child: Image.asset(
                              'assets/images/maps_logo.png',
                              fit: BoxFit.contain,
                              errorBuilder: (context, error, trace) => const Icon(
                                  Icons.location_on_rounded,
                                  color: _kPurple,
                                  size: 14),
                            ),
                          ),
                          const SizedBox(width: 5),
                          Text('Lucky',
                              style: GoogleFonts.outfit(
                                fontSize:   12,
                                fontWeight: FontWeight.w800,
                                color:      _kPurple,
                              )),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // ── Store info ─────────────────────────────────────────────
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(14, 10, 14, 10),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Left: name, address, close time
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment:  MainAxisAlignment.center,
                        children: [
                          Text(
                            store['name'],
                            style: GoogleFonts.outfit(
                              fontSize:   16,
                              fontWeight: FontWeight.w800,
                              color:      _kTextDark,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            store['address'],
                            style: GoogleFonts.outfit(
                              fontSize: 11,
                              color:    _kTextMid,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Text(
                                'Closes ${store['closeTime']}',
                                style: GoogleFonts.outfit(
                                  fontSize: 11,
                                  color:    _kTextMid,
                                ),
                              ),
                              if (store['distance'] != null) ...[
                                Container(
                                  margin: const EdgeInsets.symmetric(horizontal: 6),
                                  width: 3,
                                  height: 3,
                                  decoration: const BoxDecoration(color: Color(0xFFE2E8F0), shape: BoxShape.circle),
                                ),
                                Text(
                                  '${(store['distance'] as double).toStringAsFixed(1)} km away',
                                  style: GoogleFonts.outfit(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color:    _kPurple,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(width: 12),

                    // Right: action buttons
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // View Menu button (Coming Soon)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.grey[100],
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            'Coming Soon',
                            style: GoogleFonts.outfit(
                              fontSize:   11,
                              fontWeight: FontWeight.w700,
                              color:      Colors.grey[400],
                            ),
                          ),
                        ),
                        const SizedBox(height: 6),
                        // Get Directions button
                        GestureDetector(
                          onTap: () => _launchMapsUrl(store['url']),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 14, vertical: 8),
                            decoration: BoxDecoration(
                              color: _kOrange,
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: [
                                BoxShadow(
                                  color:      _kOrange.withValues(alpha: 0.35),
                                  blurRadius: 10,
                                  offset:     const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Text(
                              'Get Directions',
                              style: GoogleFonts.outfit(
                                fontSize:   11,
                                fontWeight: FontWeight.w700,
                                color:      Colors.white,
                              ),
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
      ),
    );
  }
}