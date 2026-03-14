# App Icons & Splash Screens Setup Guide

## Overview
This guide explains how to create and setup app icons and splash screens for the Morse Vibe app store submission.

## App Icon Requirements

### Master Icon (Required First)
Create a 1024×1024 PNG file as your master icon:
- **File**: `app-icon-master.png` (place in `public/` folder)
- **Format**: PNG with transparent background recommended
- **Content**: Clear, identifiable logo/design for Morse Vibe

### Required Icon Sizes
Generate the following from your master icon:
- 192×192 px (Android, PWA)
- 512×512 px (Android, PWA)
- 96×96 px (App shortcuts)
- 72×72 px (Android)
- 36×36 px (Android ldpi)

**Filename**: `app-icon-{size}x{size}.png`
**Location**: `public/` folder and `capacitor.config.json` assets

### Icon Generation Tools
1. **Free Online**: 
   - ImageResizer: https://imageresizer.com/
   - icoconvert.com for batch resizing
   
2. **Command Line** (if ImageMagick installed):
   ```bash
   magick app-icon-master.png -resize 192x192 app-icon-192x192.png
   magick app-icon-master.png -resize 512x512 app-icon-512x512.png
   magick app-icon-master.png -resize 96x96 app-icon-96x96.png
   ```

3. **Capacitor Asset Generator** (after creating master):
   ```bash
   npm install --save-dev @capacitor/assets
   npx cap-assets generate --logo app-icon-master.png
   ```

## Splash Screen Requirements

### Sizes Needed
- **iOS**: 2732×2732 px (iPad Pro)
- **Android**: 1080×1920 px (portrait)
- **Android Multi-density**: 
  - xxxhdpi: 1080×1920 px
  - xxhdpi: 720×1280 px
  - xhdpi: 540×960 px
  - hdpi: 480×800 px
  - mdpi: 320×534 px

**Filename**: `splash-{density}.png`
**Location**: `public/splashes/` folder

### Splash Screen Design Tips
- App name/logo at top
- Mauritius-blue background (matching brand)
- Simple, clean design
- Leave space for safe areas (notches, home indicators)

### Generation Process
1. Create master splash (1080×1920 minimum)
2. Use Capacitor command to generate all sizes:
   ```bash
   npx cap-assets generate --splash splash-master.png
   ```

## Capacitor Asset Generator Setup

Once you have `app-icon-master.png`:

```bash
# Install the asset generator
npm install --save-dev @capacitor/assets

# Generate all icons and splashes automatically
npx cap-assets generate --logo app-icon-master.png --splash splash-master.png

# This will populate:
# - ios/App/App/Assets.xcassets/
# - android/app/src/main/res/
```

## After Asset Generation

1. **Rebuild native apps**:
   ```bash
   npx cap copy ios
   npx cap copy android
   ```

2. **Verify in Xcode**:
   - Open `ios/App/App.xcworkspace`
   - Check Assets.xcassets for icons

3. **Verify in Android Studio**:
   - Open `android/` folder
   - Check `app/src/main/res` for mipmap folders

## Testing in Simulator/Emulator

```bash
# iOS
npx cap open ios

# Android
npx cap open android
```

## Important Notes

- **Icon Background**: For iOS, icons should have opaque backgrounds (icons with transparency are rejected)
- **Safe Areas**: Leave padding on splash screens for non-rectangular devices
- **Naming Convention**: Follow strict naming conventions; typos will cause build failures
- **Reapply After Updates**: After regenerating icons, run `npx cap copy` again

## Troubleshooting

**Icons not appearing in app**:
- Run `npx cap copy ios && npx cap copy android`
- Clean Xcode build folder (⌘⇧K)
- Rebuild native projects

**Asset generator not found**:
- Ensure @capacitor/assets is installed: `npm install --save-dev@capacitor/assets`
- Use `npx` to run commands

**Generated images missing**:
- Verify master icon is at least 1024×1024
- Check that source image is PNG format
- Ensure write permissions to target directories

