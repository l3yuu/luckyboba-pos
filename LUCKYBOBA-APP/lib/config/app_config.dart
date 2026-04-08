class AppConfig {
  AppConfig._();

  // Injected at build time via --dart-define
  static const String _env = String.fromEnvironment(
    'APP_ENV',
    defaultValue: 'development',
  );

  static bool get isProduction => _env == 'production';
  static bool get isStaging => _env == 'staging';
  static bool get isDev => _env == 'development';

  // Read injected API_URL and STRIPE_KEY
  static const String _injectedApiUrl = String.fromEnvironment('API_URL');
  static const String _injectedStripeKey = String.fromEnvironment('STRIPE_KEY');

  static const String _productionBase = 'https://luckybobastores.com';
  static const String _stagingBase = 'https://staging.luckybobastores.com';
  static const String _devBase = 'http://192.168.254.115:8000';

  static String get baseUrl {
    // If API_URL was injected, use its parent (strip /api if present)
    if (_injectedApiUrl.isNotEmpty) {
      return _injectedApiUrl.replaceAll('/api', '');
    }
    if (isProduction) return _productionBase;
    if (isStaging) return _stagingBase;
    return _devBase;
  }

  static String get apiUrl => _injectedApiUrl.isNotEmpty ? _injectedApiUrl : '$baseUrl/api';
  static String get storageUrl => '$baseUrl/storage';

  static String get stripeKey => _injectedStripeKey.isNotEmpty ? _injectedStripeKey : 'your_stripe_key';
}