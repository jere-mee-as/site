plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

// Release signing comes from the environment (CI decodes the keystore to a temp file).
// Without JRL_KEYSTORE_PATH the release build is signed with the local debug key so it still installs.
val releaseKeystore: String? = System.getenv("JRL_KEYSTORE_PATH")?.takeIf { it.isNotBlank() }

android {
    namespace = "ing.jere.launcher"
    compileSdk = 35

    defaultConfig {
        applicationId = "ing.jere.launcher"
        minSdk = 26
        targetSdk = 35
        versionCode = 3
        versionName = "0.3.0"
    }

    signingConfigs {
        releaseKeystore?.let { path ->
            create("release") {
                storeFile = file(path)
                storePassword = System.getenv("JRL_KEYSTORE_PASSWORD")
                keyAlias = System.getenv("JRL_KEY_ALIAS")
                keyPassword = System.getenv("JRL_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            // The old APK was not minified either; keeping it off means no keep rules for the JS bridge.
            isMinifyEnabled = false
            signingConfig = signingConfigs.findByName("release") ?: signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation(libs.androidx.activity.ktx)
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.webkit)
    implementation(libs.kotlinx.coroutines.android)
}
