# 🏗️ Project Architecture

## Component Hierarchy

```
App.js (Navigation)
├── HomeScreen
│   └── Level Selection Buttons
│
└── GameScreen
    ├── Bird Components (multiple)
    │   └── Flying Animations
    ├── Stick Components (multiple)
    │   └── Breaking Animations
    └── LevelCompleteModal
        ├── Next Level Button
        └── Restart Button
```

## File Structure

```
BirdGame/
│
├── 📱 App Entry Points
│   ├── App.js                    # Main app with navigation
│   ├── index.js                  # Entry point
│   └── babel.config.js           # Babel + Reanimated config
│
├── ⚙️ Configuration
│   ├── app.json                  # Expo configuration
│   ├── eas.json                  # Build profiles
│   └── package.json              # Dependencies
│
├── 📁 src/
│   │
│   ├── 🎮 components/
│   │   ├── Bird.js              # Bird with flying animation
│   │   ├── Stick.js             # Stick with break animation
│   │   └── LevelCompleteModal.js # Victory popup
│   │
│   ├── 📺 screens/
│   │   ├── HomeScreen.js        # Level selection menu
│   │   └── GameScreen.js        # Main gameplay
│   │
│   ├── ⚙️ config/
│   │   └── levels.js            # Level definitions
│   │
│   └── 🛠️ utils/
│       └── (empty - for future helpers)
│
└── 📚 Documentation
    ├── README.md                 # Full documentation
    ├── QUICKSTART.md             # Quick start guide
    └── BUILD_GUIDE.md            # APK build instructions
```

## Data Flow

```
1. App Launches
   ↓
2. HomeScreen Loads
   ↓
3. User Selects Level
   ↓
4. GameScreen Initializes
   - Loads level config from levels.js
   - Creates Bird and Stick components
   - Sets up state management
   ↓
5. User Taps Bird
   ↓
6. Bird Component
   - Triggers fly animation
   - Notifies GameScreen via callback
   ↓
7. GameScreen Updates State
   - Removes bird from activeBirds
   - Checks if stick should break
   - Checks if level is complete
   ↓
8. Level Complete?
   YES → Show LevelCompleteModal
   NO  → Continue playing
   ↓
9. User Chooses Next Level or Restart
   ↓
10. Loop back to step 4 (or 2)
```

## State Management

### GameScreen State
- `currentLevel` - Active level configuration
- `activeBirds` - Set of bird IDs still on screen
- `brokenSticks` - Set of stick IDs that are broken
- `showCompleteModal` - Boolean for modal visibility

### Component-Level State
- Bird: Animation values (translateY, opacity, scale, rotation)
- Stick: Animation values (opacity, scaleY)
- Modal: Animation values (scale, rotation)

## Animation System

### React Native Reanimated Workflow

```
User Tap → Shared Value Update → Animated Style → UI Update
```

**Example: Bird Flying**
1. User taps bird
2. `translateY.value` updated with `withTiming()`
3. `useAnimatedStyle()` calculates new styles
4. UI re-renders with smooth animation
5. Callback notifies parent after duration

## Navigation Flow

```
                    ┌─────────────┐
                    │  App.js     │
                    │ (Navigator) │
                    └──────┬──────┘
                           │
              ┌────────────┴───────────┐
              ▼                        ▼
       ┌─────────────┐         ┌─────────────┐
       │ HomeScreen  │────────→│ GameScreen  │
       │  (Level     │  Start  │  (Play      │
       │  Selection) │  Level  │   Game)     │
       └─────────────┘         └──────┬──────┘
              ▲                       │
              │                       │
              └───────────────────────┘
                   Back Button
```

## Level Configuration Schema

```javascript
{
  id: number,              // Unique level identifier
  name: string,            // Display name
  sticks: [
    {
      id: string,          // Unique stick identifier
      position: {
        x: number,         // Left position (pixels)
        y: number          // Top position (pixels)
      },
      birds: [
        {
          id: string,      // Unique bird identifier
          type: string,    // Color type (blue, red, etc.)
          offset: number   // Horizontal offset from stick center
        }
      ]
    }
  ]
}
```

## Component Props Interface

### Bird Component
```javascript
{
  bird: {
    id: string,
    type: string,
    offset: number
  },
  stickPosition: { x: number, y: number },
  onFly: (birdId: string) => void
}
```

### Stick Component
```javascript
{
  stick: {
    id: string,
    position: { x: number, y: number },
    birds: Array
  },
  isBroken: boolean
}
```

### LevelCompleteModal Component
```javascript
{
  visible: boolean,
  level: number,
  onNextLevel: () => void,
  onRestart: () => void
}
```

## Key Technologies

| Technology | Purpose |
|------------|---------|
| React Native | Mobile app framework |
| Expo | Build & development tools |
| React Navigation | Screen transitions |
| Reanimated 2 | 60 FPS animations |
| Gesture Handler | Touch interactions |
| Hooks | State & lifecycle management |

## Performance Considerations

1. **Shared Values**: Used for animations (doesn't trigger re-renders)
2. **useAnimatedStyle**: Runs on UI thread for smooth 60 FPS
3. **Set Data Structure**: O(1) bird lookup and removal
4. **Component Memoization**: Could be added for optimization
5. **Lazy Loading**: Levels loaded on-demand

---

**This architecture ensures:**
- ✅ Clean separation of concerns
- ✅ Easy to add new levels
- ✅ Smooth 60 FPS animations
- ✅ Maintainable codebase
- ✅ Scalable for future features
