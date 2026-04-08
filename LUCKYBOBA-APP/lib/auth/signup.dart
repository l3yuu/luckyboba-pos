// FILE: lib/auth/signup.dart
import 'dart:ui'; // For BackdropFilter
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';
import 'dart:convert';
import 'package:google_fonts/google_fonts.dart';
import '../config/app_config.dart';
import '../utils/app_theme.dart';

class SignupPage extends StatefulWidget {
  const SignupPage({super.key});

  @override
  State<SignupPage> createState() => _SignupPageState();
}

class _SignupPageState extends State<SignupPage>
    with SingleTickerProviderStateMixin {

  final _nameCtrl     = TextEditingController();
  final _emailCtrl    = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmCtrl  = TextEditingController();
  bool  _obscure      = true;
  bool  _obscureConf  = true;
  bool  _loading      = false;

  late final AnimationController _entryCtrl;
  late final Animation<double>   _fadeAnim;
  late final Animation<Offset>   _slideAnim;

  @override
  void initState() {
    super.initState();
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor:          Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ));
    _entryCtrl = AnimationController(
      vsync:    this,
      duration: const Duration(milliseconds: 1000),
    );
    _fadeAnim = CurvedAnimation(parent: _entryCtrl, curve: Curves.easeOut);
    _slideAnim = Tween<Offset>(begin: const Offset(0, 0.05), end: Offset.zero)
        .animate(CurvedAnimation(parent: _entryCtrl, curve: Curves.easeOut));
    _entryCtrl.forward();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmCtrl.dispose();
    _entryCtrl.dispose();
    super.dispose();
  }

  bool _isValidEmail(String email) => RegExp(r'^[\w\.\-]+@[\w\-]+\.\w{2,}$').hasMatch(email);
  bool _isStrongPassword(String password) => password.length >= 8;

  Future<void> _handleSignup() async {
    final name     = _nameCtrl.text.trim();
    final email    = _emailCtrl.text.trim();
    final password = _passwordCtrl.text.trim();
    final confirm  = _confirmCtrl.text.trim();

    if (name.isEmpty || email.isEmpty || password.isEmpty || confirm.isEmpty) {
      _snack('Please fill in all fields', Colors.orange);
      return;
    }
    if (!_isValidEmail(email)) {
      _snack('Please enter a valid email address', Colors.orange);
      return;
    }
    if (!_isStrongPassword(password)) {
      _snack('Password must be at least 8 characters', Colors.orange);
      return;
    }
    if (password != confirm) {
      _snack('Passwords do not match', Colors.redAccent);
      return;
    }

    setState(() => _loading = true);
    try {
      final UserCredential userCredential = await FirebaseAuth.instance.createUserWithEmailAndPassword(
        email: email, password: password,
      );
      await userCredential.user?.updateDisplayName(name);

      final response = await http.post(
        Uri.parse('${AppConfig.apiUrl}/register'),
        headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
        body: jsonEncode({'name': name, 'email': email, 'password': password}),
      ).timeout(const Duration(seconds: 10));

      if (!mounted) return;
      setState(() => _loading = false);

      if (response.statusCode == 201 || response.statusCode == 200) {
        _snack('Account created successfully! 🎉', Colors.green);
        await Future.delayed(const Duration(milliseconds: 800));
        if (mounted) Navigator.pop(context);
      } else {
        await userCredential.user?.delete();
        final error = jsonDecode(response.body);
        _snack(error['message'] ?? 'Registration failed', Colors.redAccent);
      }
    } on FirebaseAuthException catch (e) {
      if (mounted) setState(() => _loading = false);
      _snack(e.message ?? 'Sign up failed', Colors.redAccent);
    } catch (e) {
      if (mounted) setState(() => _loading = false);
      _snack('Server error — check your connection', Colors.redAccent);
    }
  }

  void _snack(String msg, Color color) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg, style: AppTheme.body.copyWith(color: Colors.white, fontSize: 13)),
      backgroundColor: color,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: Stack(
        children: [
          Positioned.fill(
            child: Image.asset(
              'assets/images/prompt_image.png',
              fit: BoxFit.cover,
              color: Colors.black.withValues(alpha: 0.45),
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
                    AppTheme.primary.withValues(alpha: 0.3),
                    Colors.black.withValues(alpha: 0.7),
                  ],
                ),
              ),
            ),
          ),
          Positioned.fill(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
              child: Container(color: Colors.black.withValues(alpha: 0.15)),
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
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Align(
                          alignment: Alignment.centerLeft,
                          child: GestureDetector(
                            onTap: () => Navigator.pop(context),
                            child: Container(
                              width: 42, height: 42,
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.1),
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white24, width: 1.5),
                              ),
                              child: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 16),
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),
                        Hero(
                          tag: 'app_logo',
                          child: Container(
                            width: 80, height: 80,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(color: AppTheme.primary.withValues(alpha: 0.4), blurRadius: 40, spreadRadius: 8),
                              ],
                              border: Border.all(color: Colors.white, width: 2.5),
                            ),
                            child: ClipOval(
                              child: Image.asset('assets/images/lucky_logo.jpg', fit: BoxFit.cover),
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text('Lucky Boba', style: GoogleFonts.outfit(color: Colors.white, fontSize: 38, fontWeight: FontWeight.w900, letterSpacing: -1)),
                        const SizedBox(height: 4),
                        Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3), decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)), child: Text('CREATE YOUR PROFILE', style: GoogleFonts.outfit(color: Colors.white70, letterSpacing: 2.5, fontSize: 8, fontWeight: FontWeight.w800))),
                        const SizedBox(height: 32),
                        Container(
                          padding: const EdgeInsets.all(28),
                          decoration: AppTheme.glassDecoration(borderRadius: 32),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Register', style: AppTheme.subHeading.copyWith(color: Colors.white, fontSize: 20)),
                              const SizedBox(height: 24),
                              _inputField(controller: _nameCtrl, hint: 'Full Name', icon: Icons.person_outline_rounded, isPassword: false, obscure: false),
                              const SizedBox(height: 16),
                              _inputField(controller: _emailCtrl, hint: 'Email Address', icon: Icons.alternate_email_rounded, isPassword: false, obscure: false, keyboardType: TextInputType.emailAddress),
                              const SizedBox(height: 16),
                              _inputField(controller: _passwordCtrl, hint: 'Password', icon: Icons.lock_outline_rounded, isPassword: true, obscure: _obscure, onToggle: () => setState(() => _obscure = !_obscure)),
                              const SizedBox(height: 16),
                              _inputField(controller: _confirmCtrl, hint: 'Confirm Password', icon: Icons.lock_reset_rounded, isPassword: true, obscure: _obscureConf, onToggle: () => setState(() => _obscureConf = !_obscureConf)),
                              const SizedBox(height: 32),
                              SizedBox(
                                width: double.infinity, height: 58,
                                child: ElevatedButton(
                                  onPressed: _loading ? null : _handleSignup,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppTheme.secondary,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                    elevation: 0,
                                  ),
                                  child: _loading
                                      ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 3)
                                      : Text('Create Account', style: AppTheme.buttonText.copyWith(fontSize: 15)),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 36),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text("Already have an account? ", style: AppTheme.body.copyWith(color: Colors.white70)),
                            GestureDetector(
                              onTap: () => Navigator.pop(context),
                              child: Text('Sign In', style: AppTheme.body.copyWith(color: AppTheme.secondary, fontWeight: FontWeight.w800)),
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

  Widget _inputField({required TextEditingController controller, required String hint, required IconData icon, required bool isPassword, required bool obscure, VoidCallback? onToggle, TextInputType? keyboardType}) {
    return TextField(
      controller: controller,
      obscureText: isPassword && obscure,
      keyboardType: keyboardType,
      style: AppTheme.body.copyWith(color: Colors.white, fontWeight: FontWeight.w500),
      decoration: AppTheme.inputStyle(hint: hint, icon: icon, suffixIcon: isPassword ? IconButton(onPressed: onToggle, icon: Icon(obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined, color: Colors.white70, size: 20)) : null).copyWith(
        fillColor: Colors.white.withValues(alpha: 0.1),
        hintStyle: AppTheme.body.copyWith(color: Colors.white38, fontSize: 13),
        prefixIcon: Icon(icon, color: Colors.white70, size: 20),
      ),
    );
  }
}