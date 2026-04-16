// FILE: lib/pages/cart_page.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'checkout_page.dart';
import '../widgets/app_top_bar.dart';

// ── Global cart state ────────────────────────────────────────────────────────
List<Map<String, dynamic>> myCart = [];

class CartPage extends StatefulWidget {
  final String selectedStore;
  const CartPage({super.key, required this.selectedStore});

  @override
  State<CartPage> createState() => _CartPageState();
}

class _CartPageState extends State<CartPage> {
  static const Color _purple   = Color(0xFF7C14D4);
  static const Color _orange   = Color(0xFFFF8C00);
  static const Color _bg       = Color(0xFFFAFAFA);
  static const Color _surface  = Color(0xFFF2EEF8);
  static const Color _textDark = Color(0xFF1A1A2E);
  static const Color _textMid  = Color(0xFF6B6B8A);

  double get cartTotal => myCart.fold(0, (sum, item) {
    final p = item['totalPrice'];
    if (p is double) return sum + p;
    if (p is int) return sum + p.toDouble();
    return sum + (double.tryParse(p?.toString() ?? '0') ?? 0.0);
  });

  void _updateQuantity(int index, int delta) {
    setState(() {
      final current = myCart[index]['quantity'] as int;
      if (current + delta > 0) {
        myCart[index]['quantity']   = current + delta;
        myCart[index]['totalPrice'] =
            myCart[index]['unitPrice'] * myCart[index]['quantity'];
      } else {
        myCart.removeAt(index);
      }
    });
  }

  void _showClearCartDialog() {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18)),
        title: Text('Clear Cart',
            style: GoogleFonts.poppins(
                fontWeight: FontWeight.w700, color: _textDark)),
        content: Text('Remove all items from your cart?',
            style: GoogleFonts.poppins(fontSize: 13, color: _textMid)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel',
                style: GoogleFonts.poppins(
                    color: _textMid, fontWeight: FontWeight.w600)),
          ),
          TextButton(
            onPressed: () {
              setState(() => myCart.clear());
              Navigator.pop(context);
            },
            child: Text('Clear',
                style: GoogleFonts.poppins(
                    color: Colors.red, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(
        child: Column(
          children: [

            AppTopBar(
              title: 'My Cart',
              subtitle: myCart.isEmpty
                  ? 'No items yet'
                  : '${myCart.length} item${myCart.length > 1 ? 's' : ''} in cart',
              onBack: () => Navigator.pop(context),
              trailing: myCart.isNotEmpty
                  ? GestureDetector(
                      onTap: _showClearCartDialog,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 7),
                        decoration: BoxDecoration(
                          color: Colors.red.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                              color: Colors.red.withValues(alpha: 0.2)),
                        ),
                        child: Text(
                          'Clear all',
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Colors.red[400],
                          ),
                        ),
                      ),
                    )
                  : null,
            ),

            // ── CART ITEMS ───────────────────────────────────────────────
            Expanded(
              child: myCart.isEmpty
                  ? _buildEmptyCart()
                  : ListView.builder(
                physics:     const BouncingScrollPhysics(),
                padding:     const EdgeInsets.fromLTRB(16, 4, 16, 16),
                itemCount:   myCart.length,
                itemBuilder: (context, index) =>
                    _buildCartItemCard(myCart[index], index),
              ),
            ),

            // ── CHECKOUT BOTTOM BAR ──────────────────────────────────────
            if (myCart.isNotEmpty)
              Container(
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 22),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(24)),
                  boxShadow: [
                    BoxShadow(
                      color:      Colors.black.withValues(alpha: 0.07),
                      blurRadius: 16,
                      offset:     const Offset(0, -4),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Subtotal',
                            style: GoogleFonts.poppins(
                                fontSize: 13, color: _textMid)),
                        Text(
                          '₱${cartTotal.toStringAsFixed(2)}',
                          style: GoogleFonts.poppins(
                              fontSize:   13,
                              fontWeight: FontWeight.w600,
                              color:      _textDark),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    const Divider(color: Color(0xFFEAEAF0)),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Total',
                            style: GoogleFonts.poppins(
                              fontSize:   16,
                              fontWeight: FontWeight.w700,
                              color:      _textDark,
                            )),
                        Text(
                          '₱${cartTotal.toStringAsFixed(2)}',
                          style: GoogleFonts.poppins(
                            fontSize:   22,
                            fontWeight: FontWeight.w800,
                            color:      _purple,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => CheckoutPage(
                              selectedStore: widget.selectedStore,
                            ),
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _purple,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14)),
                          elevation: 0,
                        ),
                        child: Text(
                          'Proceed to Checkout',
                          style: GoogleFonts.poppins(
                            fontSize:   15,
                            fontWeight: FontWeight.w700,
                            color:      Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  Widget _buildEmptyCart() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width:  100,
            height: 100,
            decoration: const BoxDecoration(
                color: _surface, shape: BoxShape.circle),
            child: const Icon(Icons.shopping_basket_outlined,
                size: 48, color: _purple),
          ),
          const SizedBox(height: 20),
          Text('Your cart is empty',
              style: GoogleFonts.poppins(
                fontSize:   18,
                fontWeight: FontWeight.w700,
                color:      _textDark,
              )),
          const SizedBox(height: 8),
          Text(
            'Add some items from the menu\nto get started',
            textAlign: TextAlign.center,
            style: GoogleFonts.poppins(fontSize: 13, color: _textMid),
          ),
          const SizedBox(height: 28),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(
              backgroundColor: _purple,
              padding: const EdgeInsets.symmetric(
                  horizontal: 28, vertical: 14),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14)),
              elevation: 0,
            ),
            child: Text('Browse Menu',
                style: GoogleFonts.poppins(
                  fontSize:   14,
                  fontWeight: FontWeight.w700,
                  color:      Colors.white,
                )),
          ),
        ],
      ),
    );
  }

  // ── Cart item card ────────────────────────────────────────────────────────
  Widget _buildCartItemCard(Map<String, dynamic> item, int index) {
    final String  name     = item['name']  ?? 'Item';
    final String  size     = item['size']  ?? '';
    final String? image    = item['image']?.toString();
    final int     quantity = item['quantity'] as int? ?? 1;

    final List addOns = (item['toppings'] as List?)?.isNotEmpty == true
        ? item['toppings'] as List
        : (item['add_ons'] as List?)?.isNotEmpty == true
        ? item['add_ons'] as List
        : [];

    final String addOnsText =
    addOns.isEmpty ? 'No add-ons' : addOns.join(', ');

    final double totalPrice = () {
      final p = item['totalPrice'];
      if (p is double) return p;
      if (p is int) return p.toDouble();
      return double.tryParse(p?.toString() ?? '0') ?? 0.0;
    }();

    return Container(
      margin:  const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color:        Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFEAEAF0), width: 1),
        boxShadow: [
          BoxShadow(
            color:      Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset:     const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── IMAGE ────────────────────────────────────────────────────
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: image != null && image.isNotEmpty
                ? CachedNetworkImage(
              imageUrl: image,
              width:  76,
              height: 76,
              fit:    BoxFit.cover,
              placeholder: (context, url) => _imagePlaceholder(),
              errorWidget: (context, url, error) => _imagePlaceholder(),
            )
                : _imagePlaceholder(),
          ),

          const SizedBox(width: 14),

          // ── DETAILS ──────────────────────────────────────────────────
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        name,
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.w700,
                          fontSize:   13,
                          color:      _textDark,
                          height:     1.3,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    GestureDetector(
                      onTap: () => setState(() => myCart.removeAt(index)),
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: Colors.red.withValues(alpha: 0.08),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.close_rounded,
                            size: 14, color: Colors.red),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 4),

                if (size.isNotEmpty && size != 'Regular')
                  Container(
                    margin: const EdgeInsets.only(bottom: 4),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color:        _surface,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(size,
                        style: GoogleFonts.poppins(
                            fontSize:   10,
                            color:      _purple,
                            fontWeight: FontWeight.w600)),
                  ),

                Text(
                  addOnsText,
                  style:    GoogleFonts.poppins(fontSize: 11, color: _textMid),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),

                const SizedBox(height: 10),

                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '₱${totalPrice.toStringAsFixed(2)}',
                      style: GoogleFonts.poppins(
                        fontWeight: FontWeight.w800,
                        color:      _orange,
                        fontSize:   15,
                      ),
                    ),
                    Row(
                      children: [
                        _qtyButton(
                          icon:   Icons.remove_rounded,
                          onTap:  () => _updateQuantity(index, -1),
                          filled: false,
                        ),
                        Padding(
                          padding:
                          const EdgeInsets.symmetric(horizontal: 12),
                          child: Text(
                            '$quantity',
                            style: GoogleFonts.poppins(
                              fontWeight: FontWeight.w700,
                              fontSize:   15,
                              color:      _textDark,
                            ),
                          ),
                        ),
                        _qtyButton(
                          icon:   Icons.add_rounded,
                          onTap:  () => _updateQuantity(index, 1),
                          filled: true,
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _qtyButton({
    required IconData     icon,
    required VoidCallback onTap,
    required bool         filled,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width:  30,
        height: 30,
        decoration: BoxDecoration(
          color:        filled ? _purple : _surface,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon,
            size: 16, color: filled ? Colors.white : _purple),
      ),
    );
  }

  Widget _imagePlaceholder() {
    return Container(
      width:  76,
      height: 76,
      color:  _surface,
      child: const Center(
        child: Icon(Icons.local_cafe_rounded, color: _purple, size: 28),
      ),
    );
  }
}