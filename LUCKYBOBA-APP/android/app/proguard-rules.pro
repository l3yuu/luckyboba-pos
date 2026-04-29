# Keep Flutter internals
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# Keep your app's specific launch point
-keep class app.luckyboba.app.MainActivity { *; }

# Ignore missing Play Core classes
-dontwarn com.google.android.play.core.**
-dontwarn io.flutter.embedding.engine.deferredcomponents.**

# Also add these to be safe for R8
-keep class com.google.android.play.core.** { *; }