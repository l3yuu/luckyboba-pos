  import 'package:flutter/foundation.dart';

  /// Global notifier — updated by ProfilePage, listened to by DashboardPage.
  final profileImageNotifier = ValueNotifier<String?>(null);