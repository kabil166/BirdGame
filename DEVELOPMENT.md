# 🔄 Development Workflow

This guide helps you develop and iterate on the Bird Game.

---

## 🚀 Daily Development Cycle

### 1. Start Your Day
```bash
# Navigate to project
cd /Users/root1/Documents/BirdGame

# Start Metro bundler
npm start
```

### 2. Make Changes
- Edit files in `src/` directory
- Save your changes
- Metro will auto-reload

### 3. Test Changes
- App reloads automatically (Fast Refresh)
- Test on emulator or physical device
- Check console for errors

### 4. Commit Changes (Optional)
```bash
git add .
git commit -m "Your change description"
```

---

## 🎨 Common Development Tasks

### Adding a New Level

**File**: `src/config/levels.js`

```javascript
// Add to LEVELS array
{
  id: 4,  // Next sequential ID
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

**Steps**:
1. Open `src/config/levels.js`
2. Copy an existing level
3. Change ID and birds configuration
4. Save
5. Test by selecting the level

---

### Changing Bird Colors

**File**: `src/config/levels.js`

```javascript
export const BIRD_COLORS = {
  blue: '#4A90E2',
  red: '#E74C3C',
  green: '#2ECC71',
  yellow: '#F39C12',
  purple: '#9B59B6',
  orange: '#FF6B35',  // NEW COLOR
};
```

**Then use**:
```javascript
{ id: 'b1', type: 'orange', offset: 0 }
```

**Color Resources**:
- [Coolors.co](https://coolors.co) - Color palette generator
- [Flat UI Colors](https://flatuicolors.com) - Curated palettes
- [Color Hunt](https://colorhunt.co) - Trending palettes

---

### Adjusting Animation Speed

**File**: `src/config/levels.js`

```javascript
export const GAME_CONFIG = {
  birdSize: 40,
  stickWidth: 200,
  stickHeight: 8,
  flyDuration: 800,    // CHANGE THIS (ms)
  flyHeight: -700,     // CHANGE THIS (pixels)
};
```

**Effects**:
- `flyDuration`: Lower = faster flight
- `flyHeight`: More negative = higher flight

---

### Modifying Bird Appearance

**File**: `src/components/Bird.js`

**Common changes**:

```javascript
// Make bigger birds
const BIRD_SIZE = 50;  // Change from 40

// Adjust wing size
width: GAME_CONFIG.birdSize * 0.8,  // Make wing bigger

// Change beak color
borderLeftColor: '#FFA500',  // Orange beak

// Add more rotation
rotation.value = withTiming(-25, { ... });  // More tilt
```

---

### Adding New Screens

**Steps**:
1. Create file in `src/screens/YourScreen.js`
2. Import in `App.js`
3. Add to Stack Navigator

**Example**:
```javascript
// In App.js
import YourScreen from './src/screens/YourScreen';

<Stack.Screen name="YourScreen" component={YourScreen} />
```

---

## 🐛 Debugging Workflow

### Console Logging

```javascript
// In any component
console.log('Bird ID:', bird.id);
console.log('Active birds:', activeBirds.size);
```

**View logs**:
- Terminal running `npm start`
- React DevTools
- Browser console (if web)

---

### React DevTools

**Install**:
```bash
npm install -g react-devtools
```

**Run**:
```bash
react-devtools
```

Then shake device → Debug → Enable debugging

---

### Common Issues & Fixes

#### Metro Bundler Stuck
```bash
# Clear cache and restart
npx expo start -c
```

#### Changes Not Appearing
```bash
# Force reload
# In terminal, press 'r'
# Or shake device → Reload
```

#### Reanimated Errors
```bash
# Ensure babel.config.js has:
plugins: ['react-native-reanimated/plugin']

# Then restart Metro
npm start -- --reset-cache
```

#### Navigation Issues
```bash
# Clear navigation state
# Uninstall app and reinstall
npm run android --reset-cache
```

---

## 🧪 Testing Strategy

### Manual Testing Checklist

For each change, test:

- [ ] Home screen loads
- [ ] Can select each level
- [ ] Birds appear correctly
- [ ] Tapping bird makes it fly
- [ ] Animation is smooth
- [ ] Stick breaks when appropriate
- [ ] Level complete modal shows
- [ ] Can restart level
- [ ] Can go to next level
- [ ] Back button works
- [ ] No console errors

---

### Device Testing

Test on multiple devices if possible:

**Recommended**:
1. Android emulator (fast iteration)
2. Physical Android device (real performance)
3. Different screen sizes (tablet, phone)

**Commands**:
```bash
# Android emulator
npm run android

# iOS simulator (Mac only)
npm run ios

# Web browser (for quick UI checks)
npm run web
```

---

## 📦 Build & Release Workflow

### Development Build
```bash
# Quick test build
eas build --platform android --profile development
```

### Preview Build (APK for Testing)
```bash
# Shareable APK
npm run build:apk
```

### Production Build (Play Store)
```bash
# Optimized AAB
npm run build:aab
```

---

## 🔄 Version Management

### Update Version Number

**File**: `app.json`

```json
{
  "expo": {
    "version": "1.1.0"  // Increment this
  }
}
```

**Versioning Guide**:
- `1.0.0` → `1.0.1` = Bug fixes
- `1.0.0` → `1.1.0` = New features
- `1.0.0` → `2.0.0` = Major changes

---

## 📁 File Organization Tips

### When Adding Features

**New Component**:
→ `src/components/YourComponent.js`

**New Screen**:
→ `src/screens/YourScreen.js`

**New Utility**:
→ `src/utils/yourUtility.js`

**New Config**:
→ `src/config/yourConfig.js`

### Keep It Organized
- One component per file
- Related files in same directory
- Clear, descriptive names
- Comments for complex logic

---

## 🎯 Performance Optimization

### Check Performance

**In app**:
1. Enable performance monitor (shake → Show Perf Monitor)
2. Should see 60 FPS during animations
3. Low memory usage

**If performance issues**:

```javascript
// Memoize expensive components
import React, { memo } from 'react';

export default memo(Bird);
```

```javascript
// Reduce re-renders
const birds = useMemo(() => {
  return currentLevel.sticks.flatMap(s => s.birds);
}, [currentLevel]);
```

---

## 🛠️ Development Tools Setup

### VS Code Extensions (Recommended)

1. **ES7+ React/Redux/React-Native snippets**
2. **React Native Tools**
3. **Prettier - Code formatter**
4. **GitLens** (if using Git)

### VS Code Settings

Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "javascript.suggest.autoImports": true
}
```

---

## 📊 Development Metrics

Track your progress:

### Lines of Code
```bash
find src -name "*.js" -exec wc -l {} + | tail -1
```

### Component Count
```bash
ls src/components/*.js | wc -l
```

### Level Count
```bash
grep -c '"id":' src/config/levels.js
```

---

## 🎨 Rapid Prototyping

### Quick Visual Changes

**Change Background**:
`src/screens/GameScreen.js` → styles.container.backgroundColor

**Change Header**:
`src/screens/GameScreen.js` → styles.header

**Change Button Colors**:
`src/screens/HomeScreen.js` → styles.levelButton

**Change Modal**:
`src/components/LevelCompleteModal.js` → styles

---

## 🚀 Hot Reload Tips

**Maximizing Fast Refresh**:
1. Keep components pure
2. Avoid side effects in render
3. Use hooks properly
4. Small, focused components

**When it doesn't work**:
- Modified outside of a component
- Changed non-component exports
- Changed a class component

**Solution**: Full reload (press 'r')

---

## 📝 Code Style Guide

### Naming Conventions

```javascript
// Components: PascalCase
const Bird = () => { ... };

// Functions: camelCase
const handleBirdFly = () => { ... };

// Constants: UPPER_SNAKE_CASE
const BIRD_COLORS = { ... };

// Files: PascalCase for components, camelCase for utilities
Bird.js
levels.js
```

### Component Structure

```javascript
// 1. Imports
import React, { useState } from 'react';

// 2. Component
const MyComponent = ({ prop1, prop2 }) => {
  // 3. Hooks
  const [state, setState] = useState();
  
  // 4. Handlers
  const handleAction = () => { ... };
  
  // 5. Render
  return ( ... );
};

// 6. Styles
const styles = StyleSheet.create({ ... });

// 7. Export
export default MyComponent;
```

---

## 🎯 Feature Development Checklist

When adding a new feature:

- [ ] Plan the feature (wireframe if UI)
- [ ] Create/modify necessary files
- [ ] Implement the feature
- [ ] Test manually
- [ ] Check console for errors
- [ ] Test on multiple screen sizes
- [ ] Update documentation if needed
- [ ] Commit changes
- [ ] Deploy/build if ready

---

## 🔄 Git Workflow (Optional)

If using Git:

```bash
# Create feature branch
git checkout -b feature/new-level

# Make changes, test, commit
git add .
git commit -m "Add level 4 with 20 birds"

# Merge to main
git checkout main
git merge feature/new-level

# Tag releases
git tag v1.1.0
```

---

## 📚 Learning Resources

### React Native
- [Official Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev/)

### Reanimated
- [Reanimated Docs](https://docs.swmansion.com/react-native-reanimated/)

### React Navigation
- [Navigation Docs](https://reactnavigation.org/docs/getting-started)

### Community
- [Expo Discord](https://chat.expo.dev/)
- [Reactiflux Discord](https://www.reactiflux.com/)
- Stack Overflow (tag: react-native)

---

## 🎉 You're Ready!

You now have a complete development workflow for:
- ✅ Daily development
- ✅ Adding features
- ✅ Debugging issues
- ✅ Testing changes
- ✅ Building releases
- ✅ Optimizing performance

**Happy coding!** 🚀

---

**Next**: Open `src/config/levels.js` and add your first custom level!
