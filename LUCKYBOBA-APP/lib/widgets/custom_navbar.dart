import 'dart:ui';
import 'package:flutter/material.dart';
import '../utils/app_theme.dart';

class CustomNavBar extends StatelessWidget {
  final int selectedIndex;
  final Function(int) onTabChange;

  const CustomNavBar({
    super.key,
    required this.selectedIndex,
    required this.onTabChange,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.only(left: 30, right: 30, bottom: 24),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(35),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: AppTheme.glassDecoration(
                borderRadius: 35,
                opacity: 0.15,
                borderAlpha: 0.2,
              ).copyWith(
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.1),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildNavItem(index: 0, icon: Icons.storefront_rounded),
                  _buildNavItem(index: 1, icon: Icons.local_drink_rounded),
                  _buildNavItem(index: 2, icon: Icons.credit_card_rounded),
                  _buildNavItem(index: 3, icon: Icons.map_rounded),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required int index,
    required IconData icon,
  }) {
    bool isSelected = selectedIndex == index;
    final Color color = isSelected ? Colors.white : Colors.white.withValues(alpha: 0.5);

    return GestureDetector(
      onTap: () => onTabChange(index),
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOutCubic,
        width: 55,
        height: 55,
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primary.withValues(alpha: 0.8) : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: isSelected
              ? Border.all(color: Colors.white24)
              : null,
        ),
        child: Icon(
          icon,
          color: color,
          size: 26,
        ),
      ),
    );
  }
}