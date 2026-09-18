import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

val signingStorePath = providers.environmentVariable("SNAPSHOT_SIGNING_STORE_PATH").orNull
val signingStorePassword = providers.environmentVariable("SNAPSHOT_SIGNING_STORE_PASSWORD").orNull

android {
    namespace = "fi.aapopihkala.snapshotwidget"
    compileSdk = 36

    defaultConfig {
        applicationId = "fi.aapopihkala.snapshotwidget"
        minSdk = 23
        targetSdk = 36
        versionCode = 75
        versionName = "2.10.46"
    }

    if (signingStorePath != null && signingStorePassword != null) {
        signingConfigs {
            create("release") {
                storeFile = file(signingStorePath)
                storePassword = signingStorePassword
                keyAlias = "snapshot-widget"
                keyPassword = signingStorePassword
            }
        }
    }

    buildTypes {
        getByName("release") {
            signingConfig = signingConfigs.findByName("release")
            isMinifyEnabled = false
        }
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.17.0")
    implementation("androidx.glance:glance-appwidget:1.2.0")
    implementation("androidx.work:work-runtime-ktx:2.11.2")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.10.2")

    testImplementation("junit:junit:4.13.2")
    // Local JVM tests otherwise see Android's mockable org.json stubs, not a real parser.
    testImplementation("org.json:json:20240303")
}
