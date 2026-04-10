// FILE: lib/pages/cards_page.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'dart:math' as math;
import 'card_purchase_page.dart';
import '../config/app_config.dart';

// ── Card model ────────────────────────────────────────────────────────────────
class CardModel {
  final int        id;
  final String     title;
  final String     imageUrl;
  final String     priceLabel;
  final double     priceRaw;
  final List<int>? availableMonths;

  const CardModel({
    required this.id,
    required this.title,
    required this.imageUrl,
    required this.priceLabel,
    required this.priceRaw,
    this.availableMonths,
  });

  factory CardModel.fromJson(Map<String, dynamic> json) {
    List<int>? months;
    final raw = json['available_months'];
    if (raw != null && raw.toString().isNotEmpty && raw.toString() != 'null') {
      final rawStr = raw.toString();
      try {
        final decoded = jsonDecode(rawStr);
        if (decoded is List) {
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          months = decoded.map((e) {
            final eStr = e.toString().trim();
            // Handle numeric strings like "6" or ints like 6
            final asInt = int.tryParse(eStr);
            if (asInt != null && asInt > 0 && asInt <= 12) return asInt;
            // Handle "Jan", "Feb", etc.
            final idx = monthNames.indexWhere((m) => eStr.toLowerCase().startsWith(m.toLowerCase()));
            if (idx >= 0) return idx + 1;
            return 0;
          }).where((m) => m > 0).toList();
        }
      } catch (_) {
        months = rawStr
            .split(',')
            .map((e) => int.tryParse(e.trim()) ?? 0)
            .where((m) => m > 0)
            .toList();
      }
    }
    final double priceRaw =
    (json['price_raw'] ?? json['price'] ?? 0).toDouble();

    final String rawImage = (json['image_url'] ?? json['image'] ?? '').toString();
    String imageUrl = '';
    
    if (rawImage.isNotEmpty) {
      if (rawImage.startsWith('http')) {
        // If the backend returned a full URL (e.g. http://localhost:8000/storage/...),
        // override it with our flutter app's configured backend host to avoid unreachable references.
        final uri = Uri.tryParse(rawImage);
        if (uri != null && uri.path.startsWith('/storage/')) {
          imageUrl = '${AppConfig.storageUrl}/${uri.path.substring(9)}';
        } else {
          imageUrl = rawImage;
        }
      } else if (rawImage.startsWith('/')) {
        imageUrl = '${AppConfig.baseUrl}$rawImage';
      } else {
        imageUrl = '${AppConfig.storageUrl}/$rawImage';
      }
    }

    return CardModel(
      id:              json['id'] as int,
      title:           json['title'] as String,
      imageUrl:        imageUrl,
      priceLabel:      'P${priceRaw.toStringAsFixed(0)}',
      priceRaw:        priceRaw,
      availableMonths: months,
    );
  }

  bool get isAvailableThisMonth {
    if (availableMonths == null || availableMonths!.isEmpty) return true;
    return availableMonths!.contains(DateTime.now().month);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
class CardsPage extends StatefulWidget {
  const CardsPage({super.key});

  @override
  State<CardsPage> createState() => _CardsPageState();
}

class _CardsPageState extends State<CardsPage> {
  static const Color _purple   = Color(0xFF7C14D4);
  static const Color _bg       = Color(0xFFFAFAFA);
  static const Color _textDark = Color(0xFF1A1A2E);
  static const Color _textMid  = Color(0xFF6B6B8A);

  bool        _isLoading     = true;
  bool        _hasActiveCard = false;
  bool        _errorFetching = false;
  CardModel?  _activeCard;
  List<CardModel> _cards = [];

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  Future<void> _loadAll() async {
    if (mounted) setState(() { _isLoading = true; _errorFetching = false; });
    await Future.wait([_fetchCards(), _checkSubscription()]);
    _resolveActiveCard();
    if (mounted) setState(() => _isLoading = false);
  }

  // ── Build auth headers ────────────────────────────────────────────────────
  Future<Map<String, String>> _authHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final String? token = prefs.getString('session_token');
    return {
      'Content-Type': 'application/json',
      'Accept':       'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // ── Read userId from int OR string pref ───────────────────────────────────
  Future<int?> _getUserId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt('user_id')
        ?? int.tryParse(prefs.getString('user_id_str') ?? '');
  }

  // ── Fetch cards from API ──────────────────────────────────────────────────
  Future<void> _fetchCards() async {
    try {
      final headers  = await _authHeaders();
      final response = await http
          .get(Uri.parse('${AppConfig.apiUrl}/cards'), headers: headers)
          .timeout(const Duration(seconds: 10));

      debugPrint('Cards status: ${response.statusCode}');
      debugPrint('Cards body: ${response.body}');

      if (!mounted) return;

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        List raw = [];
        if (data is List) {
          raw = data;
        } else if (data['data'] is List) {
          raw = data['data'];
        } else if (data['cards'] is List) {
          raw = data['cards'];
        }

        if (mounted) {
          setState(() {
            _cards         = raw.map((e) => CardModel.fromJson(e)).toList();
            _errorFetching = false;
          });
        }
      } else {
        debugPrint('Cards error response: ${response.body}');
        if (mounted) setState(() => _errorFetching = true);
      }
    } catch (e) {
      debugPrint('Cards fetch error: $e');
      if (mounted) setState(() => _errorFetching = true);
    }
  }

  // ── Check active card from API + cache ───────────────────────────────────
  Future<void> _checkSubscription() async {
    final prefs  = await SharedPreferences.getInstance();
    final int? userId = await _getUserId();

    final bool cached = prefs.getBool('has_active_card') ?? false;
    if (cached && mounted) setState(() => _hasActiveCard = true);

    if (userId == null) return;
    try {
      final headers  = await _authHeaders();
      final response = await http
          .get(
        Uri.parse('${AppConfig.apiUrl}/check-card-status/$userId'),
        headers: headers,
      )
          .timeout(const Duration(seconds: 10));

      if (!mounted) return;
      if (response.statusCode == 200) {
        final data    = jsonDecode(response.body);
        final hasCard = data['has_active_card'] == true;
        if (hasCard) {
          final int? id = data['card_id'] is int
              ? data['card_id']
              : int.tryParse(data['card_id'].toString());
          await prefs.setBool('has_active_card', true);
          if (id != null) await prefs.setInt('card_id', id);
        } else {
          await prefs.setBool('has_active_card', false);
          await prefs.remove('card_id');
        }
        if (mounted) setState(() => _hasActiveCard = hasCard);
      }
    } catch (e) {
      debugPrint('Card status check failed: $e');
    }
  }

  void _resolveActiveCard() async {
    if (!_hasActiveCard || _cards.isEmpty) return;
    final prefs   = await SharedPreferences.getInstance();
    final int? id = prefs.getInt('card_id');
    CardModel? found;
    try {
      found = _cards.firstWhere((c) => c.id == id);
    } catch (_) {
      found = _cards.first;
    }
    if (mounted) setState(() => _activeCard = found);
  }

  void _showBirthdayDialog(CardModel card) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Row(children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
                color: _purple.withValues(alpha: 0.10), shape: BoxShape.circle),
            child: Icon(PhosphorIconsRegular.cake, color: _purple, size: 22),
          ),
          const SizedBox(width: 12),
          Text('Birthday Card',
              style: GoogleFonts.poppins(
                  color: _textDark, fontWeight: FontWeight.w700, fontSize: 16)),
        ]),
        content: Text(
          'Please present a valid ID with your birth date to the cashier when claiming this card.',
          style: GoogleFonts.poppins(color: _textMid, fontSize: 13, height: 1.5),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel',
                style: GoogleFonts.poppins(color: _textMid, fontWeight: FontWeight.w600)),
          ),
          ElevatedButton(
            onPressed: () { Navigator.pop(context); _goToPurchase(card); },
            style: ElevatedButton.styleFrom(
                backgroundColor: _purple, foregroundColor: Colors.white, elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            child: Text('I Understand',
                style: GoogleFonts.poppins(fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  void _goToPurchase(CardModel card, {bool isOwned = false}) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => CardPurchasePage(
          cardId:       card.id,
          cardTitle:    card.title,
          cardImageUrl: card.imageUrl,
          cardPrice:    card.priceLabel,
          isOwned:      isOwned,
        ),
      ),
    ).then((_) => _loadAll());
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Container(color: _bg,
          child: const Center(child: CircularProgressIndicator(color: Color(0xFF7C14D4))));
    }

    // ── Error ─────────────────────────────────────────────────────────────
    if (_errorFetching && _cards.isEmpty) {
      return Container(
        color: _bg,
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              const Icon(Icons.wifi_off_rounded, size: 48, color: Color(0xFFAAAAAA)),
              const SizedBox(height: 16),
              Text('Could not load cards',
                  style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700, color: _textDark)),
              const SizedBox(height: 8),
              Text('Check your connection and try again.',
                  style: GoogleFonts.poppins(fontSize: 13, color: _textMid), textAlign: TextAlign.center),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: _loadAll,
                icon: const Icon(Icons.refresh_rounded),
                label: Text('Retry', style: GoogleFonts.poppins(fontWeight: FontWeight.w700)),
                style: ElevatedButton.styleFrom(
                    backgroundColor: _purple, foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)), elevation: 0),
              ),
            ]),
          ),
        ),
      );
    }

    // ── Active card ───────────────────────────────────────────────────────
    if (_hasActiveCard && _activeCard != null) {
      return Container(
        color: _bg,
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Container(
                height: 180, width: double.infinity,
                decoration: BoxDecoration(borderRadius: BorderRadius.circular(22),
                    boxShadow: [BoxShadow(color: _purple.withValues(alpha: 0.20), blurRadius: 24, offset: const Offset(0, 10))]),
                child: ClipRRect(borderRadius: BorderRadius.circular(22),
                    child: _CardFace(imageUrl: _activeCard!.imageUrl)),
              ),
              const SizedBox(height: 24),
              Text(_activeCard!.title,
                  style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.w700, color: _textDark)),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                decoration: BoxDecoration(color: Colors.green.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(20)),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.check_circle_rounded, color: Colors.green, size: 14),
                  const SizedBox(width: 6),
                  Text('Card Active',
                      style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.green)),
                ]),
              ),
              const SizedBox(height: 28),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => _goToPurchase(_activeCard!, isOwned: true),
                  icon: const Icon(Icons.credit_card_rounded, size: 18),
                  label: Text('View My Card & Perks',
                      style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 15)),
                  style: ElevatedButton.styleFrom(
                      backgroundColor: _purple, foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)), elevation: 0),
                ),
              ),
            ]),
          ),
        ),
      );
    }

    // ── Card picker ───────────────────────────────────────────────────────
    return Container(
      color: _bg,
      child: RefreshIndicator(
        color: _purple,
        onRefresh: _loadAll,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 110),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Choose Your Card',
                    style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.w700, color: _textDark)),
                const SizedBox(height: 4),
                Text('Tap a card to flip it and see the design',
                    style: GoogleFonts.poppins(fontSize: 12, color: _textMid)),
                const SizedBox(height: 24),

                if (_cards.isEmpty)
                  Center(child: Padding(
                    padding: const EdgeInsets.only(top: 60),
                    child: Column(children: [
                      const Icon(Icons.credit_card_off_rounded, size: 48, color: Color(0xFFAAAAAA)),
                      const SizedBox(height: 12),
                      Text('No cards available right now.',
                          style: GoogleFonts.poppins(fontSize: 14, color: _textMid)),
                    ]),
                  ))
                else
                  ..._cards.map((card) => Padding(
                    padding: const EdgeInsets.only(bottom: 20),
                    child: FlipCardItem(
                      card:        card,
                      isAvailable: card.isAvailableThisMonth,
                      onBuyPressed: () {
                        if (card.title.toLowerCase().contains('birthday')) {
                          _showBirthdayDialog(card);
                        } else {
                          _goToPurchase(card);
                        }
                      },
                    ),
                  )),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── FLIP CARD ITEM ────────────────────────────────────────────────────────────
class FlipCardItem extends StatefulWidget {
  final CardModel    card;
  final bool         isAvailable;
  final VoidCallback onBuyPressed;

  const FlipCardItem({
    super.key,
    required this.card,
    required this.isAvailable,
    required this.onBuyPressed,
  });

  @override
  State<FlipCardItem> createState() => _FlipCardItemState();
}

class _FlipCardItemState extends State<FlipCardItem>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double>   _animation;
  bool _isFlipped = false;

  static const Color _purple   = Color(0xFF7C14D4);
  static const Color _textDark = Color(0xFF1A1A2E);

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 600));
    _animation = Tween<double>(begin: 0, end: 1).animate(
        CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
  }

  @override
  void dispose() { _controller.dispose(); super.dispose(); }

  void _toggleFlip() {
    if (!mounted) return;
    setState(() => _isFlipped = !_isFlipped);
    _isFlipped ? _controller.forward() : _controller.reverse();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GestureDetector(
          onTap: _toggleFlip,
          child: Container(
            height: 200, width: double.infinity,
            decoration: BoxDecoration(borderRadius: BorderRadius.circular(22),
                boxShadow: [BoxShadow(color: _purple.withValues(alpha: 0.15), blurRadius: 20, offset: const Offset(0, 8))]),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(22),
              child: Stack(children: [
                Positioned.fill(
                  child: Opacity(
                    opacity: widget.isAvailable ? 1.0 : 0.45,
                    child: AnimatedBuilder(
                      animation: _animation,
                      builder: (_, _) {
                        final angle  = _animation.value * math.pi;
                        final isBack = angle > math.pi / 2;
                        return Transform(
                          transform: Matrix4.identity()
                            ..setEntry(3, 2, 0.001)
                            ..rotateY(angle),
                          alignment: Alignment.center,
                          child: isBack
                              ? Transform(
                              alignment: Alignment.center,
                              transform: Matrix4.rotationY(math.pi),
                              child: Image.asset('assets/cards/back_card.png', fit: BoxFit.cover))
                              : _CardFace(imageUrl: widget.card.imageUrl),
                        );
                      },
                    ),
                  ),
                ),
                if (!widget.isAvailable)
                  Positioned.fill(child: Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                      decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.55), borderRadius: BorderRadius.circular(12)),
                      child: Text('COMING SOON',
                          style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white, letterSpacing: 1.5)),
                    ),
                  )),
                Positioned(top: 12, right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.45), borderRadius: BorderRadius.circular(20)),
                      child: Row(mainAxisSize: MainAxisSize.min, children: [
                        const Icon(Icons.flip_rounded, color: Colors.white, size: 12),
                        const SizedBox(width: 4),
                        Text('Tap to flip',
                            style: GoogleFonts.poppins(fontSize: 10, color: Colors.white, fontWeight: FontWeight.w500)),
                      ]),
                    )),
              ]),
            ),
          ),
        ),
        const SizedBox(height: 14),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFEAEAF0), width: 1),
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 3))]),
          child: Row(children: [
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(widget.card.title,
                  style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700, color: _textDark)),
              Text(widget.card.priceLabel,
                  style: GoogleFonts.poppins(fontSize: 13, color: _purple, fontWeight: FontWeight.w600)),
            ])),
            GestureDetector(
              onTap: widget.isAvailable ? widget.onBuyPressed : null,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
                decoration: BoxDecoration(
                    color: widget.isAvailable ? _purple : Colors.grey[300],
                    borderRadius: BorderRadius.circular(12)),
                child: Text('Buy',
                    style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 13,
                        color: widget.isAvailable ? Colors.white : Colors.grey[500])),
              ),
            ),
          ]),
        ),
      ],
    );
  }
}

// ── Card face — network image ─────────────────────────────────────────────────
class _CardFace extends StatelessWidget {
  final String imageUrl;
  const _CardFace({required this.imageUrl});

  @override
  Widget build(BuildContext context) {
    if (imageUrl.isEmpty) return _placeholder();
    return CachedNetworkImage(
      imageUrl: imageUrl,
      fit: BoxFit.cover,
      width: double.infinity,
      height: double.infinity,
      placeholder: (context, url) => Container(
          color: const Color(0xFFF2EEF8),
          child: const Center(child: CircularProgressIndicator(color: Color(0xFF7C14D4), strokeWidth: 2))),
      errorWidget: (context, url, error) => _placeholder(),
    );
  }

  Widget _placeholder() => Container(color: const Color(0xFFF2EEF8),
      child: const Center(child: Icon(Icons.credit_card_rounded, color: Color(0xFF7C14D4), size: 48)));
}