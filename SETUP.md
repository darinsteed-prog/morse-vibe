# Morse Vibe — App Store Setup Guide

## Prerequisites

- Node.js 18+
- For iOS: a Mac with Xcode 15+ installed
- For Android: Android Studio installed
- Apple Developer account ($99/yr) for App Store
- Google Play Developer account ($25 one-time) for Play Store

---

## Step 1 — Deploy the WebSocket server

The app needs a live server for the Remote sync feature.
Railway is the easiest option.

1. Push this repo to GitHub
2. Go to https://railway.app → New Project → Deploy from GitHub
3. Select your repo
4. Add environment variable: `NODE_ENV=production`
5. Railway auto-detects Node — it will run `npm run dev` by default.
   Change the start command to: `node --loader tsx/esm server.ts`
   Or add a `Procfile` with: `web: node --loader tsx/esm server.ts`
6. Copy your Railway URL (e.g. `https://morse-vibe-production.up.railway.app`)

---

## Step 2 — Configure the app to point to your server

Create a `.env` file in the project root:

```
VITE_SERVER_URL=https://your-morse-vibe.up.railway.app
```

---

## Step 3 — Install dependencies and build

```bash
npm install
npm run build          # builds React app into /dist
```

---

## Step 4 — Add native platforms

```bash
# Install Capacitor CLI globally (one-time)
npm install -g @capacitor/cli

# Add platforms
npx cap add ios
npx cap add android

# Sync the built web assets into the native projects
npx cap sync
```

---

## Step 5 — iOS (App Store)

```bash
npx cap open ios
```

This opens Xcode. Then:

1. Select your team under **Signing & Capabilities**
2. Change the Bundle Identifier from `com.morsevibe.app` to something unique
3. Set the version and build number
4. Connect a physical iPhone (haptics don't work in the simulator)
5. Run on device to test
6. **Product → Archive** to create a release build
7. Upload via **Xcode → Organizer → Distribute App**
8. Submit in App Store Connect (https://appstoreconnect.apple.com)

### Required App Store assets
- App icon: 1024×1024 PNG (no alpha)
- Screenshots: at least one per device size (6.5", 5.5")
- Privacy policy URL (required — vibration/haptics count as device sensors)

---

## Step 6 — Android (Play Store)

```bash
npx cap open android
```

This opens Android Studio. Then:

1. Wait for Gradle sync to complete
2. Change the applicationId in `android/app/build.gradle` to your unique ID
3. Connect a physical Android phone
4. Run on device to test
5. **Build → Generate Signed Bundle/APK**
   - Choose **Android App Bundle (.aab)**
   - Create a new keystore (keep this file safe — you can never change it)
6. Upload the `.aab` to Google Play Console (https://play.google.com/console)

### Required Play Store assets
- App icon: 512×512 PNG
- Feature graphic: 1024×500 PNG
- Screenshots: at least 2
- Short description (80 chars) and full description

---

## After initial setup

When you update the app:

```bash
npm run build
npx cap sync
# Then re-archive in Xcode / rebuild in Android Studio
```

---

## Haptics notes

- **iOS**: Uses `@capacitor/haptics` → `Haptics.impact()` — works on all iPhones with a Taptic Engine (iPhone 7+). The Web Vibration API is completely blocked on iOS, which is why Capacitor is needed.
- **Android**: Also uses native haptics via Capacitor, which is richer than the web API. Falls back to `navigator.vibrate` on web.
- The status badge in the app header shows "Native" when running inside Capacitor.
