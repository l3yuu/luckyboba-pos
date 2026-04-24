import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config/app_config.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:async';
import 'dart:ui';

class QrPerkPage extends StatefulWidget {
  final String perkName;
  const QrPerkPage({super.key, required this.perkName});

  @override 
  State<QrPerkPage> createState() => _QrPerkPageState();
}

class _QrPerkPageState extends State<QrPerkPage> {
  static const Color _purple   = Color(0xFF7C14D4);
  static const Color _bg       = Color(0xFFFAFAFA);
  static const Color _textDark = Color(0xFF1A1A2E);
  static const Color _textMid  = Color(0xFF6B6B8A);

  static const int _tokenMinutes = 20;

  bool _isRevealed = false;
  bool _isUsed     = false;
  bool _isLoading  = false;
  bool _isExpired  = false;
  String? _errorMsg;

  String _qrData   = 'hidden';
  String _textCode = '------';

  DateTime? _tokenExpiresAt;
  Timer?    _expiryTimer;

  @override
  void initState() {
    super.initState();
    _loadQrState();
  }

  @override
  void dispose() {
    _expiryTimer?.cancel();
    super.dispose();
  }

  // ── Schedule expiry timer ──────────────────────────────────────────────────
  void _scheduleExpiry(DateTime expiresAt) {
    _expiryTimer?.cancel();
    final remaining = expiresAt.difference(DateTime.now());
    if (remaining.isNegative) {
      _onTokenExpired();
      return;
    }
    _expiryTimer = Timer(remaining, () {
      if (mounted && _isRevealed && !_isUsed) _onTokenExpired();
    });
  }

  void _onTokenExpired() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('qr_used_${widget.perkName}', _today());
    await _clearLocalCache(prefs);
    if (!mounted) return;
    setState(() {
      _isUsed         = true;
      _isRevealed     = false;
      _isExpired      = false;
      _qrData         = 'hidden';
      _textCode       = '------';
      _tokenExpiresAt = null;
    });
  }

  // ── Load state on init — uses perk-status (read-only, no side effects) ─────
  Future<void> _loadQrState() async {
    final prefs        = await SharedPreferences.getInstance();
    final String today = _today();

    // 1. Check local used flag first (fastest)
    if (prefs.getString('qr_used_${widget.perkName}') == today) {
      if (mounted) setState(() => _isUsed = true);
      return;
    }

    // 2. Verify with server using read-only perk-status endpoint
    try {
      final String? token = prefs.getString('session_token');
      if (token != null) {
        final response = await http.get(
          Uri.parse(
            '${AppConfig.apiUrl}/cards/perk-status?perk_name=${Uri.encodeComponent(widget.perkName)}',
          ),
          headers: {
            'Accept':        'application/json',
            'Authorization': 'Bearer $token',
          },
        );

        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          if (data['used'] == true) {
            await prefs.setString('qr_used_${widget.perkName}', today);
            await _clearLocalCache(prefs);
            if (mounted) setState(() => _isUsed = true);
            return;
          }
        }
      }
    } catch (_) {
      // Network error — fall through to cached token check
    }

    // 3. Load cached token if still valid
    final String? savedDate    = prefs.getString('qr_date_${widget.perkName}');
    final String? expiresAtStr = prefs.getString('qr_expires_${widget.perkName}');

    if (savedDate == today && expiresAtStr != null) {
      final DateTime expiresAt = DateTime.parse(expiresAtStr).toLocal();
      if (DateTime.now().isBefore(expiresAt)) {
        if (mounted) {
          setState(() {
            _isRevealed     = true;
            _qrData         = prefs.getString('qr_data_${widget.perkName}') ?? 'hidden';
            _textCode       = prefs.getString('qr_text_${widget.perkName}') ?? '------';
            _tokenExpiresAt = expiresAt;
          });
        }
        _scheduleExpiry(expiresAt);
      } else {
        await _clearLocalCache(prefs);
        if (mounted) setState(() => _isExpired = true);
      }
    }
  }

  // ── Reveal QR — calls generate-qr which records usage ─────────────────────
  Future<void> _revealQrCode() async {
    setState(() { _isLoading = true; _errorMsg = null; _isExpired = false; });

    try {
      final prefs         = await SharedPreferences.getInstance();
      final String? token = prefs.getString('session_token');

      if (token == null) {
        setState(() => _errorMsg = 'Session expired. Please log in again.');
        return;
      }

      final response = await http.post(
        Uri.parse('${AppConfig.apiUrl}/cards/generate-qr'),
        headers: {
          'Content-Type':  'application/json',
          'Accept':        'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'perk_name': widget.perkName}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        final DateTime expiresAt = data['expires_at'] != null
            ? DateTime.parse(data['expires_at']).toLocal()
            : DateTime.now().add(const Duration(minutes: _tokenMinutes));

        await prefs.setString('qr_date_${widget.perkName}',    _today());
        await prefs.setString('qr_data_${widget.perkName}',    data['signed_token']);
        await prefs.setString('qr_text_${widget.perkName}',    data['display_code']);
        await prefs.setString('qr_expires_${widget.perkName}', expiresAt.toIso8601String());

        if (mounted) {
          setState(() {
            _isRevealed     = true;
            _qrData         = data['signed_token'];
            _textCode       = data['display_code'];
            _tokenExpiresAt = expiresAt;
          });
        }
        _scheduleExpiry(expiresAt);

      } else if (response.statusCode == 409) {
        final prefs2 = await SharedPreferences.getInstance();
        await prefs2.setString('qr_used_${widget.perkName}', _today());
        if (mounted) setState(() => _isUsed = true);

      } else {
        final body = jsonDecode(response.body);
        if (mounted) {
          setState(() =>
          _errorMsg = body['message'] ?? 'Something went wrong. Please try again.');
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _errorMsg = 'Network error. Please check your connection.');
      }
      debugPrint('QR reveal error: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _clearLocalCache(SharedPreferences prefs) async {
    await prefs.remove('qr_date_${widget.perkName}');
    await prefs.remove('qr_data_${widget.perkName}');
    await prefs.remove('qr_text_${widget.perkName}');
    await prefs.remove('qr_expires_${widget.perkName}');
  }

  String _today() => DateTime.now().toIso8601String().substring(0, 10);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        surfaceTintColor: Colors.transparent,
        title: Text(
          widget.perkName,
          style: GoogleFonts.poppins(
            color: _textDark,
            fontWeight: FontWeight.w700,
            fontSize: 15,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded,
              color: Color(0xFF1A1A2E), size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: const Color(0xFFEAEAF0)),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              if (!_isUsed)
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.redAccent.withValues(alpha: 0.07),
                    border: Border.all(
                        color: Colors.redAccent.withValues(alpha: 0.4),
                        width: 1.5),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(PhosphorIconsFill.warningCircle,
                          color: Colors.redAccent, size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Do not reveal until you are at the counter!',
                              style: GoogleFonts.poppins(
                                fontWeight: FontWeight.w700,
                                color: Colors.redAccent,
                                fontSize: 12,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              'This perk can only be used once per day. '
                                  'QR codes are valid for $_tokenMinutes minutes.',
                              style: GoogleFonts.poppins(
                                color: Colors.redAccent.withValues(alpha: 0.8),
                                fontSize: 11,
                                height: 1.4,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

              if (_isExpired) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.orange.withValues(alpha: 0.08),
                    border: Border.all(
                        color: Colors.orange.withValues(alpha: 0.4), width: 1.5),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(PhosphorIconsRegular.clockCountdown,
                          color: Colors.orange, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Your QR code expired. Tap "Reveal" to get a new one.',
                          style: GoogleFonts.poppins(
                              fontSize: 11, color: Colors.orange.shade800),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              if (_errorMsg != null) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.orange.withValues(alpha: 0.08),
                    border: Border.all(
                        color: Colors.orange.withValues(alpha: 0.4), width: 1.5),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(PhosphorIconsRegular.info,
                          color: Colors.orange, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _errorMsg!,
                          style: GoogleFonts.poppins(
                              fontSize: 11, color: Colors.orange.shade800),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 28),

              Expanded(
                child: Center(
                  child: _isUsed ? _buildUsedState() : _buildQrArea(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildUsedState() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 100,
          height: 100,
          decoration: BoxDecoration(
            color: const Color(0xFFF3F0FF),
            shape: BoxShape.circle,
            border: Border.all(color: _purple.withValues(alpha: 0.2), width: 2),
          ),
          child: const Icon(PhosphorIconsFill.checkCircle,
              color: _purple, size: 48),
        ),
        const SizedBox(height: 24),
        Text('Perk Claimed!',
            style: GoogleFonts.poppins(
                fontSize: 22, fontWeight: FontWeight.w700, color: _textDark)),
        const SizedBox(height: 8),
        Text(
          'You\'ve already used your\n${widget.perkName} perk today.',
          textAlign: TextAlign.center,
          style: GoogleFonts.poppins(fontSize: 14, color: _textMid, height: 1.5),
        ),
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          decoration: BoxDecoration(
            color: const Color(0xFFF3F0FF),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: _purple.withValues(alpha: 0.2)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(PhosphorIconsRegular.calendarBlank,
                  color: _purple, size: 18),
              const SizedBox(width: 8),
              Text('Come back tomorrow!',
                  style: GoogleFonts.poppins(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: _purple)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildQrArea() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (_isRevealed && _tokenExpiresAt != null) ...[
          _ExpiryCountdown(expiresAt: _tokenExpiresAt!),
          const SizedBox(height: 16),
        ],

        Container(
          width: 270,
          height: 270,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: const Color(0xFFEAEAF0), width: 1),
            boxShadow: [
              BoxShadow(
                color: _purple.withValues(alpha: 0.10),
                blurRadius: 24,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              ImageFiltered(
                imageFilter: ImageFilter.blur(
                  sigmaX: _isRevealed ? 0.0 : 10.0,
                  sigmaY: _isRevealed ? 0.0 : 10.0,
                ),
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: QrImageView(
                    data: _qrData,
                    version: QrVersions.auto,
                    size: 200,
                    eyeStyle: QrEyeStyle(
                        eyeShape: QrEyeShape.square, color: _purple),
                    dataModuleStyle: QrDataModuleStyle(
                        dataModuleShape: QrDataModuleShape.square,
                        color: _purple),
                  ),
                ),
              ),
              if (!_isRevealed)
                _isLoading
                    ? const CircularProgressIndicator(color: _purple)
                    : ElevatedButton.icon(
                  onPressed: _revealQrCode,
                  icon: const Icon(PhosphorIconsRegular.eye, size: 18),
                  label: Text('Reveal QR Code',
                      style: GoogleFonts.poppins(
                          fontWeight: FontWeight.w700)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _purple,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 22, vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16)),
                    elevation: 0,
                  ),
                ),
            ],
          ),
        ),

        const SizedBox(height: 24),

        if (_isRevealed) ...[
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFEAEAF0), width: 1),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                Text(
                  'CASHIER CODE',
                  style: GoogleFonts.poppins(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: _textMid,
                    letterSpacing: 1.5,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  _textCode,
                  style: GoogleFonts.poppins(
                    fontSize: 26,
                    fontWeight: FontWeight.w700,
                    color: _purple,
                    letterSpacing: 3,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(PhosphorIconsRegular.qrCode,
                  size: 14, color: Color(0xFF6B6B8A)),
              const SizedBox(width: 6),
              Text(
                'Show this to the cashier to redeem',
                style: GoogleFonts.poppins(fontSize: 11, color: _textMid),
              ),
            ],
          ),
        ],
      ],
    );
  }
}

// ── Live countdown widget ──────────────────────────────────────────────────────
class _ExpiryCountdown extends StatefulWidget {
  final DateTime expiresAt;
  const _ExpiryCountdown({required this.expiresAt});

  @override
  State<_ExpiryCountdown> createState() => _ExpiryCountdownState();
}

class _ExpiryCountdownState extends State<_ExpiryCountdown> {
  late Duration _remaining;
  Timer? _ticker;

  @override
  void initState() {
    super.initState();
    _updateRemaining();
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) _updateRemaining();
    });
  }

  void _updateRemaining() {
    final remaining = widget.expiresAt.difference(DateTime.now());
    setState(() => _remaining = remaining.isNegative ? Duration.zero : remaining);
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final int totalSecs = _remaining.inSeconds;
    final bool urgent   = totalSecs < 60;
    final String label  =
        '${(_remaining.inMinutes).toString().padLeft(2, '0')}:'
        '${(totalSecs % 60).toString().padLeft(2, '0')}';

    final Color color = urgent ? Colors.redAccent : const Color(0xFF7C14D4);

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
      decoration: BoxDecoration(
        color: urgent
            ? Colors.redAccent.withValues(alpha: 0.08)
            : const Color(0xFFF3F0FF),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: urgent
              ? Colors.redAccent.withValues(alpha: 0.4)
              : const Color(0xFF7C14D4).withValues(alpha: 0.2),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(PhosphorIconsRegular.timer, size: 15, color: color),
          const SizedBox(width: 7),
          Text(
            urgent ? 'Expires in $label — hurry!' : 'Valid for $label',
            style: GoogleFonts.poppins(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}