# 📦 Android APK Build Instructions

This guide will walk you through building an installable APK for Android devices.

## 🎯 Prerequisites

Before building, ensure you have:
- ✅ Node.js installed (v16+)
- ✅ Project dependencies installed (`npm install`)
- ✅ Internet connection (for cloud build)
- ✅ Expo account (free - create at expo.dev)

---

## 🚀 Method 1: EAS Build (Cloud Build - RECOMMENDED)

This method builds your APK in the cloud, no local Android setup needed!

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Login to Expo

```bash
eas login
```

If you don't have an account:
- Go to https://expo.dev
- Create a free account
- Come back and run `eas login`

### Step 3: Build APK

```bash
npm run build:apk
```

Or directly:
```bash
eas build --platform android --profile preview
```

### Step 4: Wait for Build

- Build will start on Expo's servers
- Takes approximately 5-15 minutes
- You can close terminal - build continues in cloud
- Check status at: https://expo.dev/accounts/[your-username]/projects/BirdGame/builds

### Step 5: Download APK

Once complete:
1. You'll get a download link in terminal
2. Or visit expo.dev → Projects → BirdGame → Builds
3. Download the APK file

### Step 6: Install on Android

1. Transfer APK to your Android device
2. Tap the APK file
3. Allow installation from unknown sources (if prompted)
4. Install and play! 🎮

---

## 📱 Method 2: Build AAB for Google Play Store

If you want to publish to Google Play Store:

```bash
npm run build:aab
```

This creates an Android App Bundle (.aab) file optimized for Play Store.

---

## 🔧 Build Configuration

Builds are configured in `eas.json`:

- **preview**: Builds APK for direct installation
- **production**: Builds AAB for Play Store submission
- **development**: Builds development client

---

## 📊 Build Profiles Explained

### Preview Profile (APK)
```bash
npm run build:apk
```
- ✅ For testing and sharing
- ✅ Works on any Android device
- ✅ Can be installed without Play Store
- ✅ Larger file size (includes all architectures)

### Production Profile (AAB)
```bash
npm run build:aab
```
- ✅ For Google Play Store
- ✅ Optimized per-device downloads
- ✅ Smaller download size
- ❌ Requires Google Play Console

---

## 🐛 Troubleshooting

### "eas command not found"
```bash
npm install -g eas-cli
```

### "Login failed"
- Create account at expo.dev first
- Use correct email/password
- Check internet connection

### "Build failed"
Common fixes:
```bash
# Clear node modules
rm -rf node_modules
npm install

# Try again
npm run build:apk
```

### "Package name conflict"
- Change package name in `app.json`
- Under `android.package`
- Use unique identifier like: `com.yourname.birdgame`

---

## 📋 Build Checklist

Before building, verify:

- [ ] All code is working in development (`npm start`)
- [ ] No console errors
- [ ] Tested on Android emulator/device
- [ ] Unique package name in `app.json`
- [ ] App icon and splash screen (optional)
- [ ] Version number updated in `app.json`

---

## 🎨 Customizing App Details

Before final build, customize in `app.json`:

```json
{
  "expo": {
    "name": "Bird Game",           // App name shown on device
    "slug": "BirdGame",
    "version": "1.0.0",            // Your version number
    "android": {
      "package": "com.yourname.birdgame"  // Unique package ID
    }
  }
}
```

---

## 📱 Distribution Options

After building APK:

### Option 1: Direct Distribution
- Share APK file via Google Drive, email, etc.
- Users download and install directly
- No Play Store needed

### Option 2: Beta Testing
- Upload to Google Play Console
- Create closed/open beta test
- Share beta link with testers

### Option 3: Play Store Release
- Build AAB: `npm run build:aab`
- Upload to Google Play Console
- Complete store listing
- Submit for review

---

## 💡 Pro Tips

1. **Test Before Building**
   - Always test in Expo Go first
   - Use `npm run android` for final testing

2. **Version Management**
   - Increment version in `app.json` for each build
   - Keep builds organized

3. **Build Logs**
   - Check build logs on expo.dev for errors
   - Save successful build IDs for reference

4. **File Size**
   - APK will be ~50-100MB
   - Normal for React Native apps
   - Can optimize with Proguard later

---

## 🎯 Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run build:apk` | Build installable APK |
| `npm run build:aab` | Build for Play Store |
| `eas build:list` | View all builds |
| `eas build:cancel` | Cancel running build |

---

## ✅ Success!

Once you have your APK:
- ✨ Install on any Android device
- 🎮 Share with friends and family
- 📱 Test on multiple devices
- 🚀 Upload to Play Store (optional)

**Happy Building! 🎉**
