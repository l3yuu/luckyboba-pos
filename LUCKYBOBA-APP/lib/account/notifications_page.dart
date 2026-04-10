// FILE: lib/pages/notifications_page.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  static const Color _purple   = Color(0xFF7C14D4);
  static const Color _bg       = Color(0xFFFAFAFA);
  static const Color _surface  = Color(0xFFF2EEF8);
  static const Color _textDark = Color(0xFF1A1A2E);
  static const Color _textMid  = Color(0xFF6B6B8A);

  bool _orderUpdates  = true;
  bool _promos        = true;
  bool _appUpdates    = false;
  bool _reminders     = true;

  @override
  void initState() {
    super.initState();
    _loadPrefs();
  }

  Future<void> _loadPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _orderUpdates = prefs.getBool('notif_order_updates') ?? true;
      _promos       = prefs.getBool('notif_promos')        ?? true;
      _appUpdates   = prefs.getBool('notif_app_updates')   ?? false;
      _reminders    = prefs.getBool('notif_reminders')     ?? true;
    });
  }

  Future<void> _save(String key, bool val) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(key, val);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      width: 40, height: 40,
                      decoration: const BoxDecoration(color: _surface, shape: BoxShape.circle),
                      child: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: _purple),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text('Notifications',
                      style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w700, color: _textDark)),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 30),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _sectionLabel('Alerts'),
                    const SizedBox(height: 10),
                    _notifCard([
                      _NotifItem(
                        icon: Icons.receipt_long_rounded,
                        title: 'Order Updates',
                        subtitle: 'Status changes for your orders',
                        value: _orderUpdates,
                        onChanged: (v) { setState(() => _orderUpdates = v); _save('notif_order_updates', v); },
                      ),
                      _NotifItem(
                        icon: Icons.local_offer_rounded,
                        title: 'Promos & Deals',
                        subtitle: 'Exclusive offers and discounts',
                        value: _promos,
                        onChanged: (v) { setState(() => _promos = v); _save('notif_promos', v); },
                      ),
                      _NotifItem(
                        icon: Icons.campaign_rounded,
                        title: 'Reminders',
                        subtitle: 'Cart and reorder reminders',
                        value: _reminders,
                        onChanged: (v) { setState(() => _reminders = v); _save('notif_reminders', v); },
                      ),
                      _NotifItem(
                        icon: Icons.system_update_rounded,
                        title: 'App Updates',
                        subtitle: 'New features and improvements',
                        value: _appUpdates,
                        onChanged: (v) { setState(() => _appUpdates = v); _save('notif_app_updates', v); },
                      ),
                    ]),
                    const SizedBox(height: 20),
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: _purple.withValues(alpha: 0.07),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: _purple.withValues(alpha: 0.15)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.info_outline_rounded, color: _purple, size: 18),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Make sure notifications are enabled in your device settings for Lucky Boba.',
                              style: GoogleFonts.poppins(fontSize: 12, color: _purple),
                            ),
                          ),
                        ],
                      ),
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

  Widget _sectionLabel(String label) => Text(label,
      style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: _textMid, letterSpacing: 0.5));

  Widget _notifCard(List<_NotifItem> items) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFEAEAF0)),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        children: items.asMap().entries.map((e) {
          final item   = e.value;
          final isLast = e.key == items.length - 1;
          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  children: [
                    Container(
                      width: 38, height: 38,
                      decoration: BoxDecoration(color: _surface, borderRadius: BorderRadius.circular(10)),
                      child: Icon(item.icon, color: _purple, size: 18),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(item.title,
                              style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600, color: _textDark)),
                          Text(item.subtitle,
                              style: GoogleFonts.poppins(fontSize: 11, color: _textMid)),
                        ],
                      ),
                    ),
                    Switch(
                      value:           item.value,
                      onChanged:       item.onChanged,
                      activeThumbColor: _purple,
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ],
                ),
              ),
              if (!isLast)
                Padding(
                  padding: const EdgeInsets.only(left: 66, right: 16),
                  child: Divider(height: 1, color: Colors.grey[100]),
                ),
            ],
          );
        }).toList(),
      ),
    );
  }
}

class _NotifItem {
  final IconData         icon;
  final String           title;
  final String           subtitle;
  final bool             value;
  final ValueChanged<bool> onChanged;
  const _NotifItem({required this.icon, required this.title, required this.subtitle, required this.value, required this.onChanged});
}