// FILE: lib/auth/signup.dart
import 'dart:ui'; // For BackdropFilter
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
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
      if (!kIsWeb) {
        final UserCredential userCredential = await FirebaseAuth.instance.createUserWithEmailAndPassword(
          email: email, password: password,
        );
        await userCredential.user?.updateDisplayName(name);
      }

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
        if (!kIsWeb) {
          await FirebaseAuth.instance.currentUser?.delete();
        }
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
      backgroundColor: const Color(0xFFF6F4F9),
      body: Stack(
        children: [
          // Background gradient bubble (matching login)
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
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Back button
                        Align(
                          alignment: Alignment.centerLeft,
                          child: GestureDetector(
                            onTap: () => Navigator.pop(context),
                            child: Container(
                              width: 40, height: 40,
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
                              child: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFF8B3AFA), size: 16),
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Logo
                        Hero(
                          tag: 'app_logo',
                          child: Container(
                            width: 60, height: 60,
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(color: Colors.black12, blurRadius: 10),
                              ],
                            ),
                            child: ClipOval(
                              child: Image.asset('assets/images/lucky_logo.jpg', fit: BoxFit.cover),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Title
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
                          'Create your account to get started.',
                          style: GoogleFonts.poppins(
                            color: Colors.black54,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 32),

                        // Form card
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
                              Text('FULL NAME', style: GoogleFonts.poppins(color: Colors.black54, fontSize: 11, fontWeight: FontWeight.w700)),
                              const SizedBox(height: 8),
                              _inputField(controller: _nameCtrl, hint: 'John Doe', icon: Icons.person_rounded, isPassword: false, obscure: false),

                              const SizedBox(height: 20),
                              Text('EMAIL ADDRESS', style: GoogleFonts.poppins(color: Colors.black54, fontSize: 11, fontWeight: FontWeight.w700)),
                              const SizedBox(height: 8),
                              _inputField(controller: _emailCtrl, hint: 'hello@bobaethereal.com', icon: Icons.mail_rounded, isPassword: false, obscure: false, keyboardType: TextInputType.emailAddress),

                              const SizedBox(height: 20),
                              Text('PASSWORD', style: GoogleFonts.poppins(color: Colors.black54, fontSize: 11, fontWeight: FontWeight.w700)),
                              const SizedBox(height: 8),
                              _inputField(controller: _passwordCtrl, hint: '••••••••', icon: Icons.lock_rounded, isPassword: true, obscure: _obscure, onToggle: () => setState(() => _obscure = !_obscure)),

                              const SizedBox(height: 20),
                              Text('CONFIRM PASSWORD', style: GoogleFonts.poppins(color: Colors.black54, fontSize: 11, fontWeight: FontWeight.w700)),
                              const SizedBox(height: 8),
                              _inputField(controller: _confirmCtrl, hint: '••••••••', icon: Icons.lock_rounded, isPassword: true, obscure: _obscureConf, onToggle: () => setState(() => _obscureConf = !_obscureConf)),

                              const SizedBox(height: 24),
                              SizedBox(
                                width: double.infinity, height: 50,
                                child: ElevatedButton(
                                  onPressed: _loading ? null : _handleSignup,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFFA64DFF),
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    elevation: 0,
                                  ),
                                  child: _loading
                                      ? const SizedBox(
                                          width: 24, height: 24,
                                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3),
                                        )
                                      : Row(
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            Text('Create Account', style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700)),
                                            const SizedBox(width: 8),
                                            const Icon(Icons.arrow_forward_rounded, size: 18),
                                          ],
                                        ),
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 32),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              "Already have an account? ",
                              style: GoogleFonts.poppins(color: Colors.black54, fontSize: 13),
                            ),
                            GestureDetector(
                              onTap: () => Navigator.pop(context),
                              child: Text(
                                'Sign In',
                                style: GoogleFonts.poppins(color: const Color(0xFF8B3AFA), fontSize: 13, fontWeight: FontWeight.w700),
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

  Widget _inputField({required TextEditingController controller, required String hint, required IconData icon, required bool isPassword, required bool obscure, VoidCallback? onToggle, TextInputType? keyboardType}) {
    return TextField(
      controller: controller,
      obscureText: isPassword && obscure,
      keyboardType: keyboardType,
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
                onPressed: onToggle,
                icon: Icon(
                  obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                  color: Colors.black38,
                  size: 18,
                ),
              )
            : null,
        contentPadding: const EdgeInsets.symmetric(vertical: 14),
      ),
    );
  }
}