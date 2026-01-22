# 🚀 Quick Start Guide - Bird Game

## Fastest Way to Run the Game

### 1️⃣ Start Development Server
```bash
npm start
```

### 2️⃣ Run on Android (Choose one option)

**Option A: Using Android Emulator**
- Make sure Android Studio is installed and an emulator is running
```bash
npm run android
```

**Option B: Using Physical Device with Expo Go**
1. Install "Expo Go" app from Google Play Store
2. Scan the QR code shown in terminal
3. Game will open in Expo Go

**Option C: Using Physical Device via USB**
1. Enable USB debugging on your Android device
2. Connect via USB
3. Run: `npm run android`

---

## 🎯 Building APK (Installable Android App)

### Quick APK Build (Recommended)

1. **Install EAS CLI** (one-time setup)
```bash
npm install -g eas-cli
```

2. **Login to Expo** (one-time setup)
```bash
eas login
```
- If you don't have an account, create one at expo.dev

3. **Build APK**
```bash
eas build --platform android --profile preview
```

4. **Download & Install**
- Wait for build to complete (~5-10 minutes)
- Download APK from the provided link
- Transfer to Android device and install

---

## 📱 Testing the Game

Once running, you should see:
- **Home Screen** with 3 level options
- Tap any level to start playing
- Tap birds to make them fly
- Complete all levels to see victory screen

---

## ⚡ Common Issues & Fixes

### "Metro bundler not found"
```bash
npx expo start -c
```

### "Reanimated plugin issue"
Make sure `babel.config.js` includes:
```javascript
plugins: ['react-native-reanimated/plugin']
```

### "Android build failed"
1. Clear cache: `rm -rf node_modules && npm install`
2. Restart: `npm start -- --reset-cache`

---

## 🎮 Game Controls

- **Tap bird** → Bird flies away
- **All birds gone from stick** → Stick breaks  
- **All birds cleared** → Level complete!

---

**Need help? Check the full README.md for detailed documentation.**
