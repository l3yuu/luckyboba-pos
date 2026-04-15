plugins {
    id("com.android.application")
    id("kotlin-android")
    id("dev.flutter.flutter-gradle-plugin")
    id("com.google.gms.google-services")
}

import java.util.Properties
import java.io.FileInputStream

val keystoreProperties = Properties()
val keystorePropertiesFile = rootProject.file("key.properties")
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

android {
    namespace = "com.luckyboba.app"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        applicationId = "com.luckyboba.app"
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        create("release") {
            // Prefer CI env vars; fall back to android/key.properties (not committed).
            val keyAliasValue = System.getenv("KEY_ALIAS") ?: keystoreProperties.getProperty("keyAlias")
            val keyPasswordValue = System.getenv("KEY_PASSWORD") ?: keystoreProperties.getProperty("keyPassword")
            val storePasswordValue = System.getenv("STORE_PASSWORD") ?: keystoreProperties.getProperty("storePassword")
            val storeFileValue = System.getenv("STORE_FILE") ?: keystoreProperties.getProperty("storeFile")

            // Only configure release signing when all required values exist.
            // This lets contributors build release variants without committing secrets.
            if (
                !storeFileValue.isNullOrBlank() &&
                !keyAliasValue.isNullOrBlank() &&
                !keyPasswordValue.isNullOrBlank() &&
                !storePasswordValue.isNullOrBlank()
            ) {
                storeFile = file(storeFileValue)
                keyAlias = keyAliasValue
                keyPassword = keyPasswordValue
                storePassword = storePasswordValue
            }
        }
    }

    buildTypes {
        release {
            // If release keystore isn't provided, fall back to debug signing
            // so builds still work without secrets. For Play Store upload, provide
            // android/key.properties (local) or env vars (CI) so release signing is used.
            val releaseSigning = signingConfigs.getByName("release")
            signingConfig =
                if (releaseSigning.storeFile != null && !releaseSigning.keyAlias.isNullOrBlank()) {
                    releaseSigning
                } else {
                    signingConfigs.getByName("debug")
                }
            isMinifyEnabled = true
        }
    }
}

flutter {
    source = "../.."
}

dependencies {
    implementation(platform("com.google.firebase:firebase-bom:33.1.2"))
    implementation("com.google.firebase:firebase-auth")
    implementation("com.google.android.gms:play-services-auth:21.2.0")
}