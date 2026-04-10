// FILE: lib/cart/menu_page.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'item_customization_page.dart';
import 'cart_page.dart';
import '../config/app_config.dart';
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
  bool          _isLoading             = true;

  final ScrollController _chipScrollCtrl = ScrollController();

  @override
  void initState() {
    super.initState();
    _fetchMenu();
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
                          itemBuilder: (context, index) =>
                              _buildItemCard(groupedItems[index]),
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
              top: topPad + 16, left: 20, right: 20, bottom: 28),
          child: Column(
            children: [
              // Top row: back + title + cart
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
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Lucky Menu',
                          style: GoogleFonts.outfit(
                            fontSize:   20,
                            fontWeight: FontWeight.w800,
                            color:      Colors.white,
                          ),
                        ),
                        if (widget.selectedStore != null)
                          Text(
                            widget.selectedStore!,
                            style: GoogleFonts.outfit(
                              fontSize: 12,
                              color:    Colors.white.withValues(alpha: 0.75),
                              fontWeight: FontWeight.w500,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                      ],
                    ),
                  ),
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
                      width:  40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(PhosphorIconsRegular.shoppingCart,
                          size: 20, color: Colors.white),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        // Wave clipper at the bottom of header
        Positioned(
          bottom: -1,
          left:   0,
          right:  0,
          child: CustomPaint(
            size: const Size(double.infinity, 28),
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

    return GestureDetector(
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
              child: ClipRRect(
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(18)),
                child: imageUrl != null && imageUrl.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl:    imageUrl,
                        width:       double.infinity,
                        fit:         BoxFit.cover,
                        placeholder: (context, url) =>
                            _buildShimmerPlaceholder(),
                        errorWidget: (context, url, error) =>
                            _buildPlaceholderImage(),
                      )
                    : _buildPlaceholderImage(),
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
    final path  = Path();
    path.moveTo(0, 0);
    path.quadraticBezierTo(
        size.width * 0.25, size.height,
        size.width * 0.5,  size.height * 0.5);
    path.quadraticBezierTo(
        size.width * 0.75, 0,
        size.width,        size.height * 0.5);
    path.lineTo(size.width, 0);
    path.close();
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(_WavePainter old) => old.color != color;
}