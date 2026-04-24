// FILE: lib/auth/main.dart
import 'dart:ui'; // For BackdropFilter
import 'package:flutter_facebook_auth/flutter_facebook_auth.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../config/app_config.dart';
import '../utils/app_theme.dart';

import 'signup.dart';
import 'terms_conditions.dart';
import 'landing_promo_page.dart';
import 'onboarding_page.dart';
import 'dart:async';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Skip Firebase on web — no web config exists; web is used for UI debugging only
  if (!kIsWeb) {
    await Firebase.initializeApp();
  }

  // Crash reporting (mobile only)
  if (!kIsWeb) {
    FlutterError.onError = (details) {
      FirebaseCrashlytics.instance.recordFlutterFatalError(details);
    };
    PlatformDispatcher.instance.onError = (error, stack) {
      FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
      return true;
    };
  }

  final prefs = await SharedPreferences.getInstance();
  final bool onboardingDone = prefs.getBool('onboarding_done') ?? false;
  final bool isLoggedIn = _isSessionValid(prefs);
  final bool hasAcceptedTerms = isLoggedIn
      ? (prefs.getBool('has_accepted_terms_${_sessionUserKey(prefs)}') ?? false)
      : false;

  runApp(
    LuckyBobaApp(
      showOnboarding: !onboardingDone,
      isLoggedIn: isLoggedIn,
      hasAcceptedTerms: hasAcceptedTerms,
    ),
  );
}

bool _isSessionValid(SharedPreferences prefs) {
  final int? userId = prefs.getInt('user_id');
  final String? userIdStr = prefs.getString('user_id_str');
  final String? token = prefs.getString('session_token');
  return (userId != null || userIdStr != null) && token != null;
}

String _sessionUserKey(SharedPreferences prefs) {
  final int? userId = prefs.getInt('user_id');
  final String? userIdStr = prefs.getString('user_id_str');
  return userId?.toString() ?? userIdStr ?? '';
}

class LuckyBobaApp extends StatelessWidget {
  final bool showOnboarding;
  final bool isLoggedIn;
  final bool hasAcceptedTerms;

  const LuckyBobaApp({
    super.key,
    required this.showOnboarding,
    required this.isLoggedIn,
    required this.hasAcceptedTerms,
  });

  @override
  Widget build(BuildContext context) {
    Widget home;
    if (showOnboarding) {
      home = const OnboardingPage();
    } else if (isLoggedIn) {
      home = hasAcceptedTerms ? const LandingPromoPage() : const TermsPage();
    } else {
      home = const LoginPage();
    }

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Lucky Boba',
      theme: ThemeData(
        useMaterial3: true,
        textTheme: GoogleFonts.poppinsTextTheme(),
        colorScheme: ColorScheme.fromSeed(seedColor: AppTheme.primary),
      ),
      builder: (context, child) {
        return child ?? const SizedBox.shrink();
      },
      home: home,
    );
  }
}

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage>
    with SingleTickerProviderStateMixin {
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _obscure = true;
  bool _loading = false;
  bool _googleLoading = false;
  bool _facebookLoading = false;

  // Only instantiate GoogleSignIn on mobile — web has no client ID configured
  final GoogleSignIn? _googleSignIn = kIsWeb
      ? null
      : GoogleSignIn(scopes: ['email', 'profile']);

  late final AnimationController _entryCtrl;
  late final Animation<double> _fadeAnim;
  late final Animation<Offset> _slideAnim;

  @override
  void initState() {
    super.initState();
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
      ),
    );
    _entryCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    _fadeAnim = CurvedAnimation(parent: _entryCtrl, curve: Curves.easeOut);
    _slideAnim = Tween<Offset>(
      begin: const Offset(0, 0.05),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _entryCtrl, curve: Curves.easeOut));
    _entryCtrl.forward();
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _entryCtrl.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    final email = _emailCtrl.text.trim();
    final password = _passwordCtrl.text.trim();
    if (email.isEmpty || password.isEmpty) {
      _snack('Please fill in all fields', Colors.orange);
      return;
    }
    setState(() => _loading = true);
    try {
      final response = await http
          .post(
            Uri.parse('${AppConfig.apiUrl}/login'),
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: jsonEncode({'email': email, 'password': password}),
          )
          .timeout(const Duration(seconds: 10));

      if (!mounted) return;
      setState(() => _loading = false);

      if (response.statusCode == 200) {
        await _saveUserAndNavigate(jsonDecode(response.body), email);
      } else {
        _snack('Invalid email or password', Colors.redAccent);
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
      _snack('Cannot reach server — check your connection', Colors.redAccent);
    }
  }

  Future<void> _handleGoogleSignIn() async {
    if (kIsWeb || _googleSignIn == null) {
      _snack('Google Sign-In is not available on web', Colors.orange);
      return;
    }
    setState(() => _googleLoading = true);
    try {
      await _googleSignIn.signOut();
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) {
        if (mounted) setState(() => _googleLoading = false);
        return;
      }
      final response = await http
          .post(
            Uri.parse('${AppConfig.apiUrl}/google-login'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'name': googleUser.displayName ?? 'Guest',
              'email': googleUser.email,
            }),
          )
          .timeout(const Duration(seconds: 30));
      if (!mounted) return;
      setState(() => _googleLoading = false);
      if (response.statusCode == 200) {
        await _saveUserAndNavigate(jsonDecode(response.body), googleUser.email);
      } else {
        final body = jsonDecode(response.body);
        _snack(
          'Sign-In Error: ${body['message'] ?? 'Failed to authenticate'}',
          Colors.redAccent,
        );
      }
    } catch (e) {
      if (mounted) setState(() => _googleLoading = false);
      debugPrint('❌ Google Sign-In Error: $e');
      _snack(
        'Google Auth Error: ${e.toString().split(':').last.trim()}',
        Colors.redAccent,
      );
    }
  }

  Future<void> _handleFacebookSignIn() async {
    if (kIsWeb) {
      _snack('Facebook Sign-In is not available on web', Colors.orange);
      return;
    }
    setState(() => _facebookLoading = true);
    try {
      await FacebookAuth.instance.logOut();
      final LoginResult result = await FacebookAuth.instance.login(
        permissions: ['email', 'public_profile'],
      );
      if (result.status != LoginStatus.success) {
        if (mounted) setState(() => _facebookLoading = false);
        return;
      }
      final Map<String, dynamic> userData = await FacebookAuth.instance
          .getUserData(fields: 'name,email,picture');
      final String fbName = userData['name'] as String? ?? 'Guest';
      String fbEmail = userData['email'] as String? ?? '';

      final OAuthCredential credential = FacebookAuthProvider.credential(
        result.accessToken!.tokenString,
      );
      final UserCredential userCredential = await FirebaseAuth.instance
          .signInWithCredential(credential);
      final User? firebaseUser = userCredential.user;

      if (fbEmail.isEmpty && (firebaseUser?.email ?? '').isNotEmpty) {
        fbEmail = firebaseUser!.email!;
      }
      if (fbEmail.isEmpty) {
        final uid =
            firebaseUser?.uid ??
            DateTime.now().millisecondsSinceEpoch.toString();
        fbEmail = 'fb_$uid@facebook.com';
      }
      if (!mounted) return;

      try {
        final response = await http
            .post(
              Uri.parse('${AppConfig.apiUrl}/google-login'),
              headers: {'Content-Type': 'application/json'},
              body: jsonEncode({'name': fbName, 'email': fbEmail}),
            )
            .timeout(const Duration(seconds: 10));
        if (!mounted) return;
        setState(() => _facebookLoading = false);
        if (response.statusCode == 200) {
          await _saveUserAndNavigate(jsonDecode(response.body), fbEmail);
          return;
        }
      } catch (_) {}

      if (!mounted) return;
      setState(() => _facebookLoading = false);
      if (firebaseUser == null) {
        _snack('Facebook Sign-In failed (No User)', Colors.redAccent);
        return;
      }
      await _saveUserAndNavigate({
        'user': {
          'id': firebaseUser.uid,
          'name': fbName,
          'email': fbEmail,
          'role': 'customer',
          'has_active_card': false,
        },
      }, fbEmail);
    } catch (e) {
      if (mounted) setState(() => _facebookLoading = false);
      debugPrint('❌ Facebook Sign-In Error: $e');
      _snack(
        'Facebook Auth Error: ${e.toString().split(':').last.trim()}',
        Colors.redAccent,
      );
    }
  }

  Future<void> _saveUserAndNavigate(
    Map<String, dynamic> data,
    String fallbackEmail,
  ) async {
    final userObj = data['user'] ?? data;
    final dynamic rawId = userObj['id'];
    final String userKey = rawId?.toString() ?? fallbackEmail;
    final String userName = userObj['name'] ?? 'Guest';
    final String userRole = userObj['role'] ?? 'customer';
    final String userEmail = userObj['email'] ?? fallbackEmail;

    final bool hasActiveCard = userObj['has_active_card'] == true;
    final int? cardId = userObj['card_id'] is int
        ? userObj['card_id']
        : int.tryParse(userObj['card_id']?.toString() ?? '');

    final String sessionToken =
        data['token']?.toString() ??
        userObj['token']?.toString() ??
        userObj['api_token']?.toString() ??
        'local_${DateTime.now().millisecondsSinceEpoch}';

    final prefs = await SharedPreferences.getInstance();
    if (rawId is int) {
      await prefs.setInt('user_id', rawId);
    } else {
      await prefs.setString('user_id_str', userKey);
    }

    await prefs.setString('session_token', sessionToken);
    await prefs.setString('userName', userName);
    await prefs.setString('userRole', userRole);
    await prefs.setString('userEmail', userEmail);
    await prefs.setBool('has_active_card', hasActiveCard);
    if (cardId != null) await prefs.setInt('card_id', cardId);

    final bool hasAccepted =
        prefs.getBool('has_accepted_terms_$userKey') ?? false;

    if (!mounted) return;
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(
        builder: (_) =>
            hasAccepted ? const LandingPromoPage() : const TermsPage(),
      ),
      (route) => false,
    );
  }

  void _snack(String msg, Color color) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          msg,
          style: AppTheme.body.copyWith(color: Colors.white, fontSize: 13),
        ),
        backgroundColor: color,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F4F9),
      body: Stack(
        children: [
          // Background Gradient
          Positioned(
            top: -150,
            left: -150,
            child: Container(
              width: 400,
              height: 400,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFFD4B4FF).withValues(alpha: 0.35),
              ),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 80, sigmaY: 80),
                child: Container(color: Colors.transparent),
              ),
            ),
          ),
          SafeArea(
            child: FadeTransition(
              opacity: _fadeAnim,
              child: SlideTransition(
                position: _slideAnim,
                child: Center(
                  child: SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 20,
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Hero(
                          tag: 'app_logo',
                          child: Container(
                            width: 60,
                            height: 60,
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black12,
                                  blurRadius: 10,
                                ),
                              ],
                            ),
                            child: ClipOval(
                              child: Image.asset(
                                'assets/images/lucky_logo.jpg',
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Lucky Boba',
                          style: GoogleFonts.outfit(
                            color: const Color(0xFF8B3AFA),
                            fontSize: 32,
                            fontWeight: FontWeight.w900,
                            fontStyle: FontStyle.italic,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Enter your details to continue.',
                          style: GoogleFonts.poppins(
                            color: Colors.black54,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 32),
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.04),
                                blurRadius: 20,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'EMAIL ADDRESS',
                                style: GoogleFonts.poppins(
                                  color: Colors.black54,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 8),
                              _inputField(
                                controller: _emailCtrl,
                                hint: 'hello@bobaethereal.com',
                                icon: Icons.mail_rounded,
                                isPassword: false,
                              ),
                              const SizedBox(height: 20),
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'PASSWORD',
                                    style: GoogleFonts.poppins(
                                      color: Colors.black54,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                  Text(
                                    'Forgot?',
                                    style: GoogleFonts.poppins(
                                      color: const Color(0xFF8B3AFA),
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              _inputField(
                                controller: _passwordCtrl,
                                hint: '••••••••',
                                icon: Icons.lock_rounded,
                                isPassword: true,
                              ),
                              const SizedBox(height: 24),
                              SizedBox(
                                width: double.infinity,
                                height: 50,
                                child: ElevatedButton(
                                  onPressed: _loading ? null : _handleLogin,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFFA64DFF),
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    elevation: 0,
                                  ),
                                  child: _loading
                                      ? const SizedBox(
                                          width: 24,
                                          height: 24,
                                          child: CircularProgressIndicator(
                                            color: Colors.white,
                                            strokeWidth: 3,
                                          ),
                                        )
                                      : Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
                                          children: [
                                            Text(
                                              'Sign In',
                                              style: GoogleFonts.poppins(
                                                fontSize: 15,
                                                fontWeight: FontWeight.w700,
                                              ),
                                            ),
                                            const SizedBox(width: 8),
                                            const Icon(
                                              Icons.arrow_forward_rounded,
                                              size: 18,
                                            ),
                                          ],
                                        ),
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 32),
                        Text(
                          'Or continue with',
                          style: GoogleFonts.poppins(
                            color: Colors.black54,
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            _socialIconBtn(
                              icon: FontAwesomeIcons.google,
                              color: Colors.redAccent,
                              onTap: _googleLoading
                                  ? () {}
                                  : _handleGoogleSignIn,
                              isLoading: _googleLoading,
                            ),
                            const SizedBox(width: 20),
                            _socialIconBtn(
                              icon: FontAwesomeIcons.facebookF,
                              color: const Color(0xFF1877F2),
                              onTap: _facebookLoading
                                  ? () {}
                                  : _handleFacebookSignIn,
                              isLoading: _facebookLoading,
                            ),
                          ],
                        ),

                        const SizedBox(height: 32),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              "Don't have an account? ",
                              style: GoogleFonts.poppins(
                                color: Colors.black54,
                                fontSize: 13,
                              ),
                            ),
                            GestureDetector(
                              onTap: () => Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => const SignupPage(),
                                ),
                              ),
                              child: Text(
                                'Create one',
                                style: GoogleFonts.poppins(
                                  color: const Color(0xFF8B3AFA),
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _inputField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    required bool isPassword,
  }) {
    return TextField(
      controller: controller,
      obscureText: isPassword && _obscure,
      style: GoogleFonts.poppins(color: Colors.black87, fontSize: 14),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: GoogleFonts.poppins(color: Colors.black38, fontSize: 14),
        filled: true,
        fillColor: const Color(0xFFF3F2F5),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide.none,
        ),
        prefixIcon: Icon(icon, color: Colors.black38, size: 18),
        suffixIcon: isPassword
            ? IconButton(
                onPressed: () => setState(() => _obscure = !_obscure),
                icon: Icon(
                  _obscure
                      ? Icons.visibility_off_outlined
                      : Icons.visibility_outlined,
                  color: Colors.black38,
                  size: 18,
                ),
              )
            : null,
        contentPadding: const EdgeInsets.symmetric(vertical: 14),
      ),
    );
  }

  Widget _socialIconBtn({
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
    bool isLoading = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 50,
        height: 50,
        decoration: BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: isLoading
            ? Center(
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    color: color,
                    strokeWidth: 2.5,
                  ),
                ),
              )
            : Center(child: FaIcon(icon, color: color, size: 20)),
      ),
    );
  }
}
