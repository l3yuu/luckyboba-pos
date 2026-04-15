// FILE: lib/cart/menu_page.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'item_customization_page.dart';
import 'cart_page.dart';
import '../config/app_config.dart';
import '../widgets/tappable_card.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';

// ── Palette (matches home_page.dart) ─────────────────────────────────────────
const Color _kPurple      = Color(0xFF7C3AED);
const Color _kPurpleLight = Color(0xFF9D4EDD);
const Color _kOrange      = Color(0xFFFF8C00);
const Color _kBg          = Color(0xFFF4F4F8);
const Color _kSurface     = Color(0xFFF2EEF8);
const Color _kTextDark    = Color(0xFF1A1A2E);
const Color _kTextMid     = Color(0xFF6B6B8A);

class MenuPage extends StatefulWidget {
  final String? selectedStore;
  final String? initialCategory;
  final int?    branchId;

  const MenuPage({
    super.key,
    this.selectedStore,
    this.initialCategory,
    this.branchId,
  });

  @override
  State<MenuPage> createState() => _MenuPageState();
}

class _MenuPageState extends State<MenuPage> {
  static const Set<String> _hiddenCategories = {
    'PROMOS',
    'GRAND OPENING PROMO',
    'FREEBIES',
  };

  int           _selectedCategoryIndex = 0;
  List<dynamic> _allMenuItems          = [];
  List<String>  _categories            = [];
  Set<int>      _favoritedIds          = {};
  bool          _isLoading             = true;
  bool          _hasActiveCard         = false;

  final ScrollController _chipScrollCtrl = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadState();
  }

  Future<void> _loadState() async {
    await _loadLoyaltyStatus();
    await _fetchMenu();
    if (_hasActiveCard) {
      await _fetchFavorites();
    }
  }

  Future<void> _loadLoyaltyStatus() async {
    final prefs = await SharedPreferences.getInstance();
    final bool? localStatus = prefs.getBool('has_active_card');
    if (localStatus != null) {
      if (mounted) setState(() => _hasActiveCard = localStatus);
    }
    
    final int? userId = prefs.getInt('user_id');
    if (userId == null) return;
    try {
      final response = await http
          .get(Uri.parse('${AppConfig.apiUrl}/check-card-status/$userId'))
          .timeout(const Duration(seconds: 8));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final hasCard = data['has_active_card'] == true;
        await prefs.setBool('has_active_card', hasCard);
        if (mounted) setState(() => _hasActiveCard = hasCard);
      }
    } catch (_) {}
  }

  Future<void> _fetchFavorites() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token') ?? '';
      if (token.isEmpty) return;

      final response = await http.get(
        Uri.parse('${AppConfig.apiUrl}/favorites'),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        final Set<int> ids = data.map<int>((fav) => fav['menu_item_id'] as int).toSet();
        if (mounted) setState(() => _favoritedIds = ids);
      }
    } catch (_) {}
  }

  Future<void> _toggleFavorite(int menuItemId) async {
    if (!_hasActiveCard) {
      _showLoyaltyRequired();
      return;
    }

    final bool isAdding = !_favoritedIds.contains(menuItemId);
    
    // Optimistic update
    setState(() {
      if (isAdding) {
        _favoritedIds.add(menuItemId);
      } else {
        _favoritedIds.remove(menuItemId);
      }
    });

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token') ?? '';
      
      final response = isAdding 
        ? await http.post(
            Uri.parse('${AppConfig.apiUrl}/favorites'),
            headers: {
              'Authorization': 'Bearer $token',
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            body: json.encode({'menu_item_id': menuItemId}),
          )
        : await http.delete(
            Uri.parse('${AppConfig.apiUrl}/favorites/$menuItemId'),
            headers: {
              'Authorization': 'Bearer $token',
              'Accept': 'application/json',
            },
          );

      if (response.statusCode >= 400) {
        // Rollback on error
        setState(() {
          if (isAdding) {
            _favoritedIds.remove(menuItemId);
          } else {
            _favoritedIds.add(menuItemId);
          }
        });
        final data = json.decode(response.body);
        _showErrorSnackBar(data['message'] ?? 'Action failed.');
      }
    } catch (e) {
      // Rollback on connection error
      setState(() {
        if (isAdding) {
          _favoritedIds.remove(menuItemId);
        } else {
          _favoritedIds.add(menuItemId);
        }
      });
      _showErrorSnackBar('Connection error.');
    }
  }

  void _showLoyaltyRequired() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Loyalty Required', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
        content: Text(
          'Adding drinks to your "Favorites" list is a premium feature. Please activate your Loyalty Card to enjoy this perk!',
          style: GoogleFonts.outfit(fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Not Now', style: GoogleFonts.outfit(color: _kTextMid)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // Navigate back to home or cards page
              Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: _kPurple,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: Text('Get Card', style: GoogleFonts.outfit(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.redAccent),
    );
  }

  @override
  void dispose() {
    _chipScrollCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchMenu() async {
    try {
      String url = '${AppConfig.apiUrl}/public-menu';
      if (widget.branchId != null) {
        url += '?branch_id=${widget.branchId}';
      }

      final response = await http
          .get(Uri.parse(url))
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);

        final Set<String>   cats           = {};
        final List<dynamic> sanitizedItems = [];

        for (var item in data) {
          String cat = item['category']?.toString().trim() ?? '';
          if (cat.isEmpty || cat == 'null') cat = 'General';
          if (_hiddenCategories.contains(cat.toUpperCase())) continue;
          item['category'] = cat;
          cats.add(cat);
          sanitizedItems.add(item);
        }

        final sortedCats = cats.toList()..sort();

        int startIndex = 0;
        if (widget.initialCategory != null) {
          final idx = sortedCats.indexWhere(
            (c) =>
              c.toLowerCase().contains(widget.initialCategory!.toLowerCase()) ||
              widget.initialCategory!.toLowerCase().contains(c.toLowerCase()),
          );
          if (idx != -1) startIndex = idx;
        }

        setState(() {
          _allMenuItems          = sanitizedItems;
          _categories            = sortedCats.isEmpty ? ['General'] : sortedCats;
          _selectedCategoryIndex = startIndex;
          _isLoading             = false;
        });

        if (startIndex > 0) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            _chipScrollCtrl.animateTo(
              startIndex * 110.0,
              duration: const Duration(milliseconds: 400),
              curve:    Curves.easeOut,
            );
          });
        }
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  String? _buildImageUrl(dynamic rawImage) {
    String? imageUrl = rawImage?.toString().trim();
    if (imageUrl == null || imageUrl.isEmpty || imageUrl == 'null') return null;
    if (imageUrl.startsWith('http')) {
      return imageUrl.replaceAll('http://localhost:', 'http://10.0.2.2:');
    }
    if (imageUrl.startsWith('/')) imageUrl = imageUrl.substring(1);
    return Uri.encodeFull('${AppConfig.storageUrl}/$imageUrl');
  }

  List<Map<String, dynamic>> get _groupedCurrentItems {
    if (_categories.isEmpty) return [];
    final categoryItems = _allMenuItems
        .where((i) => i['category'] == _categories[_selectedCategoryIndex])
        .toList();
    final Map<String, List<dynamic>> grouped = {};
    for (final item in categoryItems) {
      final name = (item['name'] ?? '').toString().trim();
      grouped.putIfAbsent(name, () => []).add(item);
    }
    return grouped.entries.map((entry) {
      final variants = entry.value;
      variants.sort((a, b) {
        final priceA = double.tryParse(
            a['sellingPrice']?.toString() ?? a['price']?.toString() ?? '0') ?? 0;
        final priceB = double.tryParse(
            b['sellingPrice']?.toString() ?? b['price']?.toString() ?? '0') ?? 0;
        return priceA.compareTo(priceB);
      });
      final representative = Map<String, dynamic>.from(variants.first as Map);
      representative['variants'] = variants;
      return representative;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final groupedItems = _groupedCurrentItems;
    final topPad = MediaQuery.of(context).padding.top;

    return Scaffold(
      backgroundColor: _kBg,
      body: Column(
        children: [
          // ── Purple wave header ──────────────────────────────────────────────
          _buildHeader(topPad),

          // ── Category chips ──────────────────────────────────────────────────
          const SizedBox(height: 14),
          _buildCategoryChips(),
          const SizedBox(height: 14),

          // ── Menu grid ───────────────────────────────────────────────────────
          Expanded(
            child: _isLoading
                ? _buildMenuSkeleton()
                : groupedItems.isEmpty
                    ? _buildEmptyState()
                    : RefreshIndicator(
                        onRefresh:       _fetchMenu,
                        color:           _kPurple,
                        backgroundColor: Colors.white,
                        child: GridView.builder(
                          physics: const AlwaysScrollableScrollPhysics(),
                          cacheExtent: 1500,
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
                          gridDelegate:
                              const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount:   2,
                            crossAxisSpacing: 14,
                            mainAxisSpacing:  14,
                            childAspectRatio: 0.72,
                          ),
                          itemCount:   groupedItems.length,
                          itemBuilder: (context, index) {
                            return TweenAnimationBuilder<double>(
                              duration: Duration(milliseconds: 350 + (index * 50)),
                              tween: Tween(begin: 0.0, end: 1.0),
                              curve: Curves.easeOutCubic,
                              builder: (context, value, child) {
                                return Opacity(
                                  opacity: value,
                                  child: Transform.translate(
                                    offset: Offset(0, 20 * (1 - value)),
                                    child: child,
                                  ),
                                );
                              },
                              child: _buildItemCard(groupedItems[index]),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  // ── Purple header with wave ─────────────────────────────────────────────────

  Widget _buildHeader(double topPad) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        // Gradient background
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
              top: topPad + 14, left: 16, right: 16, bottom: 36),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Back button
              GestureDetector(
                onTap: () => Navigator.pop(context),
                child: Container(
                  width:  38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.arrow_back_ios_new_rounded,
                      size: 16, color: Colors.white),
                ),
              ),
              const SizedBox(width: 12),

              // Title + branch name
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Lucky Menu',
                      style: GoogleFonts.outfit(
                        fontSize:   18,
                        fontWeight: FontWeight.w800,
                        color:      Colors.white,
                      ),
                    ),
                    if (widget.selectedStore != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Row(
                          children: [
                            Icon(Icons.storefront_rounded,
                                size: 12,
                                color: Colors.white.withValues(alpha: 0.70)),
                            const SizedBox(width: 4),
                            Flexible(
                              child: Text(
                                widget.selectedStore!,
                                style: GoogleFonts.outfit(
                                  fontSize:   11,
                                  color:      Colors.white.withValues(alpha: 0.75),
                                  fontWeight: FontWeight.w500,
                                ),
                                maxLines:  1,
                                overflow:  TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),

              // Cart button
              GestureDetector(
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => CartPage(
                      selectedStore: widget.selectedStore ?? '',
                    ),
                  ),
                ),
                child: Container(
                  width:  38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(PhosphorIconsRegular.shoppingCart,
                      size: 18, color: Colors.white),
                ),
              ),
            ],
          ),
        ),

        // Wave clipper at the bottom of header
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

  // ── Horizontal category chips ───────────────────────────────────────────────

  Widget _buildCategoryChips() {
    return SizedBox(
      height: 38,
      child: ListView.builder(
        controller:      _chipScrollCtrl,
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _categories.length,
        itemBuilder: (context, index) {
          final bool selected = index == _selectedCategoryIndex;
          return GestureDetector(
            onTap: () => setState(() => _selectedCategoryIndex = index),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              margin:   const EdgeInsets.only(right: 10),
              padding:  const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
              decoration: BoxDecoration(
                gradient: selected
                    ? const LinearGradient(
                        colors: [Color(0xFF6D28D9), _kPurpleLight],
                        begin: Alignment.topLeft,
                        end:   Alignment.bottomRight,
                      )
                    : null,
                color:        selected ? null : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: selected ? Colors.transparent : const Color(0xFFEAEAF0),
                  width: 1,
                ),
                boxShadow: selected
                    ? [
                        BoxShadow(
                          color:      _kPurple.withValues(alpha: 0.25),
                          blurRadius: 8,
                          offset:     const Offset(0, 3),
                        )
                      ]
                    : [],
              ),
              child: Text(
                _categories[index],
                style: GoogleFonts.outfit(
                  fontSize:   12,
                  fontWeight: FontWeight.w700,
                  color:      selected ? Colors.white : _kTextMid,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  // ── Item card (2-column grid) ───────────────────────────────────────────────

  Widget _buildItemCard(Map<String, dynamic> item) {
    final String        itemName = item['name'] ?? 'Boba Drink';
    final String?       imageUrl = _buildImageUrl(item['image']);
    final List<dynamic> variants =
        item['variants'] as List<dynamic>? ?? [item];

    final double startingPrice = double.tryParse(
            item['sellingPrice']?.toString() ??
                item['price']?.toString() ??
                '0') ??
        0.0;

    final bool hasMultiplePrices = variants.length > 1 &&
        variants.any((v) {
          final p = double.tryParse(v['sellingPrice']?.toString() ??
                  v['price']?.toString() ??
                  '0') ??
              0.0;
          return p != startingPrice;
        });

    return TappableCard(
      onTap: () {
        final List<Map<String, dynamic>> normalizedVariants =
            variants.map<Map<String, dynamic>>((v) {
          final map = Map<String, dynamic>.from(v as Map);
          final raw = map['sellingPrice'] ?? map['price'];
          map['price'] = (raw is double)
              ? raw
              : (raw is int)
                  ? raw.toDouble()
                  : double.tryParse(raw?.toString() ?? '0') ?? 0.0;
          map['image'] = _buildImageUrl(map['image']);
          return map;
        }).toList();

        final Map<String, dynamic> itemToPass = Map.from(item);
        itemToPass['image']    = imageUrl;
        itemToPass['price']    = startingPrice;
        itemToPass['variants'] = normalizedVariants;

        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ItemCustomizationPage(
              item:          itemToPass,
              selectedStore: widget.selectedStore ?? '',
            ),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color:        Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFEAEAF0), width: 1),
          boxShadow: [
            BoxShadow(
              color:      Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset:     const Offset(0, 4),
            )
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            Expanded(
              flex: 3,
              child: Stack(
                children: [
                  ClipRRect(
                    borderRadius:
                        const BorderRadius.vertical(top: Radius.circular(18)),
                    child: Hero(
                      tag: 'menu_item_${item['id']}',
                      child: imageUrl != null && imageUrl.isNotEmpty
                          ? CachedNetworkImage(
                              imageUrl: imageUrl,
                              width: double.infinity,
                              fit: BoxFit.cover,
                              placeholder: (context, url) =>
                                  _buildShimmerPlaceholder(),
                              errorWidget: (context, url, error) =>
                                  _buildPlaceholderImage(),
                            )
                          : _buildPlaceholderImage(),
                    ),
                  ),
                    // Favorite Heart Overlay
                    Positioned(
                      top:  8,
                      right: 8,
                      child: GestureDetector(
                        onTap: () => _toggleFavorite(item['id']),
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.85),
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.1),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              )
                            ],
                          ),
                          child: Icon(
                            _favoritedIds.contains(item['id'])
                                ? Icons.favorite_rounded
                                : Icons.favorite_outline_rounded,
                            size: 16,
                            color: _favoritedIds.contains(item['id'])
                                ? Colors.redAccent
                                : _kTextMid,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            // Name + price + add button
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment:  MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      itemName,
                      style: GoogleFonts.outfit(
                        fontWeight: FontWeight.w700,
                        fontSize:   12,
                        color:      _kTextDark,
                        height:     1.3,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Flexible(
                          child: Text(
                            hasMultiplePrices
                                ? 'from ₱${startingPrice.toStringAsFixed(0)}'
                                : '₱${startingPrice.toStringAsFixed(0)}',
                            style: GoogleFonts.outfit(
                              fontWeight: FontWeight.w700,
                              color:      _kOrange,
                              fontSize:   13,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF6D28D9), _kPurpleLight],
                              begin: Alignment.topLeft,
                              end:   Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.add_rounded,
                              color: Colors.white, size: 16),
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

  // ── Helpers ─────────────────────────────────────────────────────────────────

  Widget _buildPlaceholderImage() {
    return Container(
      color: _kSurface,
      width: double.infinity,
      child: const Center(
        child: Icon(PhosphorIconsRegular.coffee,
            color: _kPurple, size: 36),
      ),
    );
  }

  Widget _buildShimmerPlaceholder() {
    return Shimmer.fromColors(
      baseColor:     _kSurface,
      highlightColor: Colors.white,
      child: Container(
        width:  double.infinity,
        height: double.infinity,
        color:  Colors.white,
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(PhosphorIconsRegular.coffee, size: 48, color: Colors.grey[300]),
          const SizedBox(height: 12),
          Text(
            'No items in this category',
            style: GoogleFonts.outfit(color: _kTextMid, fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuSkeleton() {
    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount:   2,
        crossAxisSpacing: 14,
        mainAxisSpacing:  14,
        childAspectRatio: 0.72,
      ),
      itemCount:   6,
      itemBuilder: (context, index) => _buildItemSkeleton(),
    );
  }

  Widget _buildItemSkeleton() {
    return Container(
      decoration: BoxDecoration(
        color:        Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFEAEAF0), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 3,
            child: Shimmer.fromColors(
              baseColor:     _kSurface,
              highlightColor: Colors.white,
              child: Container(
                decoration: const BoxDecoration(
                  color:        Colors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
                ),
              ),
            ),
          ),
          Expanded(
            flex: 2,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Shimmer.fromColors(
                    baseColor:     _kSurface,
                    highlightColor: Colors.white,
                    child: Container(
                      width:  100,
                      height: 12,
                      decoration: BoxDecoration(
                        color:        Colors.white,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ),
                  const Spacer(),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Shimmer.fromColors(
                        baseColor:     _kSurface,
                        highlightColor: Colors.white,
                        child: Container(
                          width:  60,
                          height: 16,
                          decoration: BoxDecoration(
                            color:        Colors.white,
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                      ),
                      Shimmer.fromColors(
                        baseColor:     _kSurface,
                        highlightColor: Colors.white,
                        child: Container(
                          width:  28,
                          height: 28,
                          decoration: BoxDecoration(
                            color:        Colors.white,
                            borderRadius: BorderRadius.circular(10),
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
}

// ── Wave painter (matches home_page purple header bottom curve) ───────────────

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