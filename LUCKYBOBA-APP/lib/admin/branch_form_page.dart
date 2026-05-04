import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';
import '../utils/app_theme.dart';

class BranchFormPage extends StatefulWidget {
  final dynamic branch; // null for add, not null for edit
  const BranchFormPage({super.key, this.branch});

  @override
  State<BranchFormPage> createState() => _BranchFormPageState();
}

class _BranchFormPageState extends State<BranchFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _locationController = TextEditingController();
  final _addressController = TextEditingController();
  final _latController = TextEditingController();
  final _lngController = TextEditingController();
  final _ownerController = TextEditingController();
  final _gcashNameController = TextEditingController();
  final _gcashNumberController = TextEditingController();
  final _mayaNameController = TextEditingController();
  final _mayaNumberController = TextEditingController();
  final _kioskPinController = TextEditingController();
  final _kioskPasswordController = TextEditingController();
  
  String _status = 'active';
  String _ownershipType = 'company';
  String _vatType = 'vat';
  int? _selectedManagerId;
  
  File? _imageFile;
  File? _gcashQrFile;
  File? _mayaQrFile;
  final _picker = ImagePicker();
  
  List<dynamic> _managers = [];
  bool _isSaving = false;
  bool _isLoadingManagers = true;

  @override
  void initState() {
    super.initState();
    if (widget.branch != null) {
      _nameController.text = widget.branch['name'] ?? '';
      _locationController.text = widget.branch['location'] ?? '';
      _addressController.text = widget.branch['store_address'] ?? '';
      _latController.text = widget.branch['latitude']?.toString() ?? '';
      _lngController.text = widget.branch['longitude']?.toString() ?? '';
      _ownerController.text = widget.branch['owner_name'] ?? '';
      _gcashNameController.text = widget.branch['gcash_name'] ?? '';
      _gcashNumberController.text = widget.branch['gcash_number'] ?? '';
      _mayaNameController.text = widget.branch['maya_name'] ?? '';
      _mayaNumberController.text = widget.branch['maya_number'] ?? '';
      _kioskPinController.text = widget.branch['kiosk_pin'] ?? '';
      _kioskPasswordController.text = widget.branch['kiosk_password'] ?? '';
      _status = widget.branch['status']?.toString().toLowerCase() == 'active' ? 'active' : 'inactive';
      _ownershipType = widget.branch['ownership_type'] ?? 'company';
      _vatType = widget.branch['vat_type'] ?? 'vat';
      _selectedManagerId = widget.branch['manager']?['id'];
    }
    _fetchManagers();
  }

  Future<void> _fetchManagers() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      
      final response = await http.get(
        Uri.parse('${AppConfig.apiUrl}/users?role=branch_manager'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          setState(() {
            _managers = data['data'];
            _isLoadingManagers = false;
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching managers: $e');
      setState(() => _isLoadingManagers = false);
    }
  }

  Future<void> _pickImage(String type) async {
    final pickedFile = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    if (pickedFile != null) {
      setState(() {
        if (type == 'branch') _imageFile = File(pickedFile.path);
        if (type == 'gcash') _gcashQrFile = File(pickedFile.path);
        if (type == 'maya') _mayaQrFile = File(pickedFile.path);
      });
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isSaving = true);
    
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      
      final isEdit = widget.branch != null;
      final url = isEdit 
          ? '${AppConfig.apiUrl}/branches/${widget.branch['id']}' 
          : '${AppConfig.apiUrl}/branches';

      // Using MultipartRequest to support image upload
      var request = http.MultipartRequest(isEdit ? 'POST' : 'POST', Uri.parse(url));
      
      if (isEdit) {
        // Laravel workaround for PUT multipart: use POST with _method=PUT
        request.fields['_method'] = 'PUT';
      }

      request.headers.addAll({
        'Accept': 'application/json',
        'Authorization': 'Bearer $token',
      });

      request.fields['name'] = _nameController.text;
      request.fields['location'] = _locationController.text;
      request.fields['store_address'] = _addressController.text;
      request.fields['latitude'] = _latController.text;
      request.fields['longitude'] = _lngController.text;
      request.fields['owner_name'] = _ownerController.text;
      request.fields['status'] = _status;
      request.fields['ownership_type'] = _ownershipType;
      request.fields['vat_type'] = _vatType;
      request.fields['gcash_name'] = _gcashNameController.text;
      request.fields['gcash_number'] = _gcashNumberController.text;
      request.fields['maya_name'] = _mayaNameController.text;
      request.fields['maya_number'] = _mayaNumberController.text;
      request.fields['kiosk_pin'] = _kioskPinController.text;
      request.fields['kiosk_password'] = _kioskPasswordController.text;
      
      if (_selectedManagerId != null) {
        request.fields['manager_id'] = _selectedManagerId.toString();
      }

      if (_imageFile != null) {
        request.files.add(await http.MultipartFile.fromPath('image', _imageFile!.path));
      }
      if (_gcashQrFile != null) {
        request.files.add(await http.MultipartFile.fromPath('gcash_qr', _gcashQrFile!.path));
      }
      if (_mayaQrFile != null) {
        request.files.add(await http.MultipartFile.fromPath('maya_qr', _mayaQrFile!.path));
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      setState(() => _isSaving = false);

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (mounted) Navigator.pop(context, true);
      } else {
        final errorData = jsonDecode(response.body);
        _showError(errorData['message'] ?? 'Failed to save branch');
      }
    } catch (e) {
      setState(() => _isSaving = false);
      _showError('Connection error: $e');
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.redAccent),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.branch != null;
    
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          isEdit ? 'Edit Branch' : 'New Branch',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w700),
        ),
        actions: [
          if (_isSaving)
            const Center(child: Padding(padding: EdgeInsets.all(16.0), child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))))
          else
            TextButton(
              onPressed: _save,
              child: Text('SAVE', style: GoogleFonts.outfit(color: AppTheme.primary, fontWeight: FontWeight.w800)),
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildImagePicker(),
              const SizedBox(height: 24),
              _buildSectionTitle('Basic Information'),
              _buildTextField('Branch Name', _nameController, Icons.store_rounded),
              _buildTextField('Short Location', _locationController, Icons.location_on_rounded, hint: 'e.g. Quezon City'),
              _buildTextField('Full Address', _addressController, Icons.map_rounded, maxLines: 2),
              
              const SizedBox(height: 24),
              _buildSectionTitle('Coordinates'),
              Row(
                children: [
                  Expanded(child: _buildTextField('Latitude', _latController, Icons.explore_rounded, keyboardType: TextInputType.number)),
                  const SizedBox(width: 12),
                  Expanded(child: _buildTextField('Longitude', _lngController, Icons.explore_rounded, keyboardType: TextInputType.number)),
                ],
              ),
              
              const SizedBox(height: 24),
              _buildSectionTitle('Management & Configuration'),
              _buildManagerDropdown(),
              const SizedBox(height: 12),
              _buildTextField('Owner Name', _ownerController, Icons.person_rounded),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(child: _buildDropdown('Status', _status, ['active', 'inactive'], (val) => setState(() => _status = val!))),
                  const SizedBox(width: 12),
                  Expanded(child: _buildDropdown('Type', _ownershipType, ['company', 'franchise'], (val) => setState(() => _ownershipType = val!))),
                ],
              ),
              const SizedBox(height: 12),
              _buildDropdown('VAT Type', _vatType, ['vat', 'non_vat'], (val) => setState(() => _vatType = val!)),
              
              const SizedBox(height: 24),
              _buildSectionTitle('Payment Settings (GCash)'),
              _buildTextField('GCash Name', _gcashNameController, Icons.account_circle_rounded),
              _buildTextField('GCash Number', _gcashNumberController, Icons.phone_android_rounded, keyboardType: TextInputType.phone),
              _buildSmallImagePicker('GCash QR Code', _gcashQrFile, widget.branch?['gcash_qr'], 'gcash'),
              
              const SizedBox(height: 24),
              _buildSectionTitle('Payment Settings (Maya)'),
              _buildTextField('Maya Name', _mayaNameController, Icons.account_circle_rounded),
              _buildTextField('Maya Number', _mayaNumberController, Icons.phone_android_rounded, keyboardType: TextInputType.phone),
              _buildSmallImagePicker('Maya QR Code', _mayaQrFile, widget.branch?['maya_qr'], 'maya'),

              const SizedBox(height: 24),
              _buildSectionTitle('Kiosk Settings'),
              _buildTextField('Kiosk PIN', _kioskPinController, Icons.pin_rounded, keyboardType: TextInputType.number),
              _buildTextField('Kiosk Password', _kioskPasswordController, Icons.password_rounded, keyboardType: TextInputType.visiblePassword),
              
              if (isEdit) ...[
                const SizedBox(height: 40),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: _confirmDelete,
                    icon: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent),
                    label: Text('DELETE BRANCH', style: GoogleFonts.outfit(color: Colors.redAccent, fontWeight: FontWeight.w700)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      side: const BorderSide(color: Colors.redAccent),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                  ),
                ),
              ],

              const SizedBox(height: 100), // Space for bottom padding
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _confirmDelete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.grey[900],
        title: Text('Delete Branch', style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold)),
        content: Text('Are you sure you want to delete this branch? This will also soft-delete related raw materials.', style: GoogleFonts.outfit(color: Colors.white70)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text('CANCEL', style: GoogleFonts.outfit(color: Colors.white54))),
          TextButton(onPressed: () => Navigator.pop(context, true), child: Text('DELETE', style: GoogleFonts.outfit(color: Colors.redAccent, fontWeight: FontWeight.bold))),
        ],
      ),
    );

    if (confirmed == true) {
      _deleteBranch();
    }
  }

  Future<void> _deleteBranch() async {
    setState(() => _isSaving = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      
      final response = await http.delete(
        Uri.parse('${AppConfig.apiUrl}/branches/${widget.branch['id']}'),
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      setState(() => _isSaving = false);
      if (response.statusCode == 200) {
        if (mounted) Navigator.pop(context, true);
      } else {
        _showError('Failed to delete branch');
      }
    } catch (e) {
      setState(() => _isSaving = false);
      _showError('Connection error: $e');
    }
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title.toUpperCase(),
        style: GoogleFonts.outfit(
          fontSize: 11,
          fontWeight: FontWeight.w800,
          color: Colors.white54,
          letterSpacing: 1.5,
        ),
      ),
    );
  }

  Widget _buildImagePicker() {
    final existingImageUrl = widget.branch?['image'] != null 
        ? '${AppConfig.baseUrl}/storage/${widget.branch['image']}' 
        : null;

    return Center(
      child: GestureDetector(
        onTap: () => _pickImage('branch'),
        child: Container(
          width: double.infinity,
          height: 180,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
          ),
          child: _imageFile != null
              ? ClipRRect(
                  borderRadius: BorderRadius.circular(24),
                  child: Image.file(_imageFile!, fit: BoxFit.cover),
                )
              : existingImageUrl != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(24),
                      child: Image.network(existingImageUrl, fit: BoxFit.cover),
                    )
                  : Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.add_a_photo_rounded, size: 40, color: Colors.white.withValues(alpha: 0.3)),
                        const SizedBox(height: 8),
                        Text(
                          'Upload Branch Photo',
                          style: GoogleFonts.outfit(color: Colors.white38, fontSize: 13),
                        ),
                      ],
                    ),
        ),
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, IconData icon, {String? hint, int maxLines = 1, TextInputType keyboardType = TextInputType.text}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextFormField(
        controller: controller,
        maxLines: maxLines,
        keyboardType: keyboardType,
        style: GoogleFonts.outfit(color: Colors.white),
        decoration: InputDecoration(
          labelText: label,
          hintText: hint,
          labelStyle: GoogleFonts.outfit(color: Colors.white54),
          prefixIcon: Icon(icon, color: AppTheme.primary.withValues(alpha: 0.7), size: 20),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: const BorderSide(color: AppTheme.primary),
          ),
          filled: true,
          fillColor: Colors.white.withValues(alpha: 0.05),
        ),
        validator: (value) => value == null || value.isEmpty ? 'This field is required' : null,
      ),
    );
  }

  Widget _buildDropdown(String label, String value, List<String> items, Function(String?) onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.outfit(color: Colors.white54, fontSize: 12)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: value,
              dropdownColor: Colors.grey[900],
              style: GoogleFonts.outfit(color: Colors.white),
              isExpanded: true,
              items: items.map((e) => DropdownMenuItem(value: e, child: Text(e.toUpperCase()))).toList(),
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildManagerDropdown() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Assign Branch Manager', style: GoogleFonts.outfit(color: Colors.white54, fontSize: 12)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<int?>(
              value: _selectedManagerId,
              hint: Text('Select Manager', style: GoogleFonts.outfit(color: Colors.white24)),
              dropdownColor: Colors.grey[900],
              style: GoogleFonts.outfit(color: Colors.white),
              isExpanded: true,
              items: [
                DropdownMenuItem<int?>(value: null, child: Text('No Manager Assigned', style: GoogleFonts.outfit(color: Colors.white38))),
                if (_isLoadingManagers)
                  DropdownMenuItem<int?>(value: null, enabled: false, child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primary)))
                else
                  ..._managers.map((m) => DropdownMenuItem<int?>(
                    value: m['id'],
                    child: Text('${m['name']} (${m['branch_name'] ?? 'Available'})'),
                  )),
              ],
              onChanged: (val) => setState(() => _selectedManagerId = val),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSmallImagePicker(String label, File? localFile, String? remotePath, String type) {
    final existingImageUrl = remotePath != null 
        ? '${AppConfig.baseUrl}/storage/$remotePath' 
        : null;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: GoogleFonts.outfit(color: Colors.white54, fontSize: 12)),
          const SizedBox(height: 8),
          GestureDetector(
            onTap: () => _pickImage(type),
            child: Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
              ),
              child: localFile != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Image.file(localFile, fit: BoxFit.cover),
                    )
                  : existingImageUrl != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: Image.network(existingImageUrl, fit: BoxFit.cover),
                        )
                      : Icon(Icons.qr_code_2_rounded, color: Colors.white.withValues(alpha: 0.2), size: 40),
            ),
          ),
        ],
      ),
    );
  }
}
