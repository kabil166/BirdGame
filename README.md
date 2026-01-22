# 🐦 Bird Game - React Native

A simple and fun 2D mobile game where you tap birds to set them free!

## 🎮 Game Overview

- **Objective**: Tap on birds sitting on sticks to make them fly away
- **Mechanics**: When all birds from a stick fly away, the stick breaks
- **Goal**: Clear all birds from all sticks to complete the level
- **Levels**: 3 progressively challenging levels included

## 🎨 Features

- ✨ Smooth animations using React Native Reanimated
- 🎯 Simple tap-to-play gameplay
- 🌈 Colorful bird designs (5 different colors)
- 📱 Beautiful UI with level selection
- 🏆 Level completion celebrations
- 🔄 Restart and progress system

## 🛠️ Technologies Used

- **React Native** - Mobile app framework
- **Expo** - Development and build tooling
- **React Navigation** - Screen navigation
- **React Native Reanimated** - Smooth animations
- **React Native Gesture Handler** - Touch interactions

## 📦 Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Android Studio (for Android development)
- Expo CLI

### Setup Steps

1. **Clone or navigate to the project directory**
   ```bash
   cd /Users/root1/Documents/BirdGame
   ```

2. **Install dependencies** (if not already done)
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

## 🚀 Running the Game

### Development Mode

#### Run on Android Device/Emulator
```bash
npm run android
```

#### Run on iOS Device/Simulator (Mac only)
```bash
npm run ios
```

#### Run on Web Browser
```bash
npm run web
```

### Using Expo Go App

1. Install **Expo Go** from Google Play Store or Apple App Store
2. Run `npm start` in your project directory
3. Scan the QR code with your phone's camera (iOS) or Expo Go app (Android)

## 📱 Building APK for Android

### Method 1: EAS Build (Recommended)

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**
   ```bash
   eas login
   ```

3. **Configure EAS Build**
   ```bash
   eas build:configure
   ```

4. **Build APK**
   ```bash
   eas build --platform android --profile preview
   ```
   
   This will build an APK that you can install on any Android device.

5. **Download APK**
   - Once the build is complete, you'll get a download link
   - Download the APK and install it on your Android device

### Method 2: Local Build with Expo

1. **Install Expo CLI globally** (if not already)
   ```bash
   npm install -g expo-cli
   ```

2. **Build locally** (requires Android SDK)
   ```bash
   expo build:android -t apk
   ```

### Method 3: Generate AAB for Google Play Store

```bash
eas build --platform android --profile production
```

This creates an Android App Bundle (AAB) ready for Google Play Store submission.

## 🎯 How to Play

1. **Start**: Launch the game and select a level from the home screen
2. **Tap Birds**: Tap on any bird to make it fly upward
3. **Break Sticks**: When all birds from a stick have flown, the stick breaks
4. **Complete Level**: Clear all birds to see the level complete screen
5. **Progress**: Move to the next level or restart the current one

## 📁 Project Structure

```
BirdGame/
├── src/
│   ├── components/
│   │   ├── Bird.js              # Bird component with flying animation
│   │   ├── Stick.js             # Stick component with break animation
│   │   └── LevelCompleteModal.js # Victory popup
│   ├── screens/
│   │   ├── HomeScreen.js        # Level selection screen
│   │   └── GameScreen.js        # Main gameplay screen
│   └── config/
│       └── levels.js            # Level configurations
├── App.js                       # Main app with navigation
├── app.json                     # Expo configuration
├── babel.config.js              # Babel configuration
└── package.json                 # Dependencies
```

## 🎨 Game Components

### Bird Component
- 5 different colored birds (blue, red, green, yellow, purple)
- Custom design with body, wing, eye, and beak
- Smooth flying animation with rotation and fade effects

### Stick Component
- Horizontal wooden sticks
- Break animation when all birds fly away
- Shadow effect for depth

### Level System
- **Level 1**: 3 birds on 2 sticks (beginner)
- **Level 2**: 7 birds on 3 sticks (intermediate)
- **Level 3**: 13 birds on 4 sticks (advanced)

## 🔧 Customization

### Adding New Levels

Edit `src/config/levels.js` to add more levels:

```javascript
{
  id: 4,
  name: 'Level 4',
  sticks: [
    {
      id: 's1',
      position: { x: 50, y: 150 },
      birds: [
        { id: 'b1', type: 'blue', offset: -40 },
        { id: 'b2', type: 'red', offset: 40 },
      ],
    },
  ],
}
```

### Changing Bird Colors

Modify `BIRD_COLORS` in `src/config/levels.js`:

```javascript
export const BIRD_COLORS = {
  blue: '#4A90E2',
  red: '#E74C3C',
  // Add more colors...
};
```

### Adjusting Game Speed

Change animation timings in `src/config/levels.js`:

```javascript
export const GAME_CONFIG = {
  flyDuration: 1000, // milliseconds (lower = faster)
  flyHeight: -600,   // pixels (more negative = higher)
};
```

## 🐛 Troubleshooting

### Metro Bundler Issues
```bash
npx react-native start --reset-cache
```

### Build Failures
```bash
# Clear cache
rm -rf node_modules
npm install

# Clear Expo cache
expo start -c
```

### Android Build Issues
- Ensure Android SDK is properly installed
- Check that `ANDROID_HOME` environment variable is set
- Update to latest Expo SDK if needed

## 📝 Future Improvements

- [ ] Add sound effects
- [ ] Add background music
- [ ] More bird animations (flapping wings)
- [ ] Power-ups and special birds
- [ ] Score system
- [ ] Leaderboards
- [ ] More levels with random generation
- [ ] Different backgrounds per level
- [ ] Tutorial level

## 📄 License

This project is open source and available for personal and educational use.

## 🙏 Credits

Created with ❤️ using React Native and Expo

---

**Enjoy playing Bird Game! 🎮🐦**
