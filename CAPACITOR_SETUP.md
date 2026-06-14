# Capacitor Setup Guide - EthioLearn Pro

This guide helps you convert the PWA to native Android/iOS apps using Capacitor.

## Prerequisites

### For Android Development:
- **Node.js** (v18+) - already installed
- **Java Development Kit (JDK)** 11+ - [Download](https://www.oracle.com/java/technologies/downloads/)
- **Android SDK** - Install via Android Studio
- **Android Studio** - [Download](https://developer.android.com/studio)
- **Gradle** - Usually bundled with Android Studio

### For iOS Development:
- **macOS** (10.15+)
- **Xcode** - Install from App Store
- **CocoaPods** - `sudo gem install cocoapods`

## Installation & Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Build the web app
```bash
npm run build
```

### 3. Initialize Capacitor
```bash
# Add Capacitor to project
npx cap init

# When prompted:
# App name: EthioLearn Pro
# App Package ID: com.ethiolearn.pro
# Web asset directory: dist/public
```

### 4. Add Android platform
```bash
npm run cap:add:android
```

### 5. Sync web assets to Android
```bash
npm run cap:sync
```

## Building for Android

### Development Build
```bash
# Open Android Studio to build
npm run cap:open:android
```

In Android Studio:
1. Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Wait for build to complete
3. APK will be in `android/app/build/outputs/apk/debug/`

### Release Build (APK for Play Store)
```bash
# Create signed APK
npm run cap:build:android
```

Then in Android Studio:
1. **Build** → **Generate Signed Bundle/APK**
2. Select **APK**
3. Choose keystore or create new one
4. Select **release** build variant
5. Finish signing process

### Quick All-in-One Command
```bash
npm run mobile:android
# This runs: build → sync → open Android Studio
```

## Building for iOS

### Development Build
```bash
# Open Xcode
npm run cap:open:ios
```

In Xcode:
1. Select **Product** → **Build For** → **Running**
2. Select a simulator or connected device
3. Press Play (▶️) to run

### Release Build (for App Store)
```bash
npm run cap:build:ios
```

Then in Xcode:
1. **Product** → **Archive**
2. **Distribute App**
3. Follow App Store Connect instructions

### Quick All-in-One Command
```bash
npm run mobile:ios
# This runs: build → sync → open Xcode
```

## Project Structure

```
aksum-pro/
├── src/                    # React source files
│   ├── main.tsx           # Entry point (now with Capacitor init)
│   ├── capacitor-init.ts  # Capacitor plugin initialization
│   └── ...
├── public/                # Static assets
│   ├── manifest.json      # PWA manifest
│   ├── sw.js             # Service Worker
│   └── ethiolearn_icon.jpg
├── dist/public/           # Built web app (Capacitor uses this)
├── android/               # Android native project
│   ├── app/
│   ├── build.gradle
│   └── gradlew
├── ios/                   # iOS native project
│   ├── App/
│   ├── Podfile
│   └── App.xcworkspace
├── capacitor.config.ts    # Capacitor configuration
├── package.json          # Updated with Capacitor scripts
└── vite.config.ts        # Updated build output
```

## Available Capacitor Plugins

Already configured:
- `@capacitor/app` - App lifecycle
- `@capacitor/keyboard` - Keyboard handling
- `@capacitor/device` - Device info
- `@capacitor/camera` - Camera access
- `@capacitor/filesystem` - File system access
- `@capacitor/geolocation` - GPS location
- `@capacitor/network` - Network status

### Adding more plugins
```bash
npm install @capacitor/plugin-name
npx cap sync
```

## Common Issues & Solutions

### Issue: `dist/public` directory not found
**Solution:**
```bash
npm run build
npm run cap:sync
```

### Issue: Android build fails with Gradle error
**Solution:**
```bash
cd android
./gradlew clean
cd ..
npm run cap:sync
npm run cap:open:android
```

### Issue: Cannot find Android SDK
**Solution:**
1. Open Android Studio
2. **Tools** → **SDK Manager**
3. Install Android SDK (API 33+)
4. Set `ANDROID_HOME` environment variable

### Issue: Capacitor not detecting changes
**Solution:**
```bash
npm run build
npm run cap:sync
npm run cap:open:android  # or iOS
```

## Environment Variables

For the Gemini API and Firebase:
```bash
# .env.local
VITE_GEMINI_API_KEY=your_key_here
VITE_FIREBASE_CONFIG=your_config_here
```

These will be bundled into the native app during build.

## Testing on Device

### Android
```bash
# With Android device connected via USB
adb devices  # Verify device is listed
npm run cap:open:android  # Deploy to device
```

### iOS
```bash
# With connected iPhone
npm run cap:open:ios  # Deploy to device in Xcode
```

## Debugging

### Android
```bash
# View native logs
adb logcat | grep chromium

# Chrome DevTools
chrome://inspect  # In Chrome browser
```

### iOS
```bash
# View native logs in Xcode Console
# Enable Device Logging: Debug → Open System Log
```

## Publishing

### Google Play Store
1. Build release APK/Bundle
2. Create Play Store app listing
3. Upload APK/Bundle in Release section
4. Fill in store listing details
5. Submit for review

### Apple App Store
1. Create App Store Connect app
2. Build release archive in Xcode
3. Upload via Xcode or Transporter
4. Fill in TestFlight & App Store details
5. Submit for review

## Useful Commands

```bash
npm run cap                  # Show Capacitor CLI help
npm run cap:sync            # Sync web app to native
npm run cap:add:android     # Add Android platform
npm run cap:add:ios         # Add iOS platform
npm run cap:open:android    # Open in Android Studio
npm run cap:open:ios        # Open in Xcode
npm run cap:build:android   # Build release APK
npm run mobile:android      # One-command: build + sync + open
npm run mobile:ios          # One-command: build + sync + open
npm run clean               # Clean dist folder
```

## References

- [Capacitor Docs](https://capacitorjs.com/)
- [Android Development](https://developer.android.com/)
- [iOS Development](https://developer.apple.com/)
- [Google Play Store](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com/)
