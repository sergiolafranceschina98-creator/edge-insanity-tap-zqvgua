
# Edge of Insanity: Ultimate Tap

A precision-based mobile game where players must tap exactly when a moving ball enters a target zone. Miss by even a fraction of a second and it's instant fail!

## 🎮 Features

- **One-Tap Precision Mechanic**: Tap exactly when the ball aligns with the target zone
- **Variable Challenge Engine**: Speed, target width, and ball size change to prevent memorization
- **Near-Miss Feedback**: Shows timing error (e.g., "0.024s too early!")
- **Streak System**: Build streaks for Bronze (3), Silver (5), and Gold (10) badges
- **Personal Best Tracking**: Track your best streak, perfect accuracy, and total taps
- **Escalating Difficulty**: Speed increases and target zone shrinks as you progress
- **Instant Restart**: Auto-restart after 1 second on failure for addictive gameplay
- **Minimalist UI**: Clean black background with white ball and red target zone

## 🚀 Getting Started

This is an Expo 54 app built with React Native.

### Prerequisites

- Node.js 18+
- Expo Go app on your mobile device (for testing)

### Installation

1. Clone the repository
2. Install dependencies (handled automatically by Natively)
3. Start the development server

### Building for Production

The app is configured for both iOS and Android App Store submission:

- **iOS Bundle ID**: `com.edgeofinsanity.ultimatetap`
- **Android Package**: `com.edgeofinsanity.ultimatetap`
- **Version**: 1.0.0

## 📱 App Store Submission Checklist

### iOS App Store

✅ Bundle identifier configured: `com.edgeofinsanity.ultimatetap`
✅ App icon provided (1024x1024)
✅ Splash screen configured
✅ Privacy manifest (ITSAppUsesNonExemptEncryption: false)
✅ Build number auto-increment enabled
✅ Portrait orientation only
✅ Supports iPhone and iPad

**Next Steps for iOS:**
1. Create an App Store Connect account
2. Create a new app listing with bundle ID `com.edgeofinsanity.ultimatetap`
3. Update `eas.json` with your Apple ID, ASC App ID, and Team ID
4. Prepare app screenshots (6.5", 6.7", 5.5" displays)
5. Write app description and keywords
6. Set age rating (likely 4+)
7. Build and submit via EAS Build

### Android Play Store

✅ Package name configured: `com.edgeofinsanity.ultimatetap`
✅ Adaptive icon configured
✅ Version code auto-increment enabled
✅ Edge-to-edge display enabled
✅ No special permissions required

**Next Steps for Android:**
1. Create a Google Play Console account
2. Create a new app listing
3. Generate a service account key for automated submission
4. Update `eas.json` with service account path
5. Prepare app screenshots (phone and tablet)
6. Write app description and keywords
7. Set content rating (likely Everyone)
8. Build and submit via EAS Build

## 🎨 Design

- **Color Scheme**: Black background, white text, intense red accents
- **Typography**: Bold, high-contrast fonts for maximum readability
- **Animations**: Smooth 60fps ball movement using React Native Animated API
- **Haptics**: Success and failure feedback on iOS

## 🏗️ Technical Stack

- **Framework**: Expo 54 + React Native
- **Navigation**: Expo Router (file-based routing)
- **Animations**: React Native Animated API with native driver
- **Haptics**: expo-haptics for tactile feedback
- **State Management**: React hooks (useState, useRef, useEffect)

## 📄 License

All rights reserved.

## 🎯 Game Mechanics

### Difficulty Progression
- Ball speed increases by 0.15 per successful tap
- Target zone shrinks by 2px per successful tap (minimum 40px)
- Background darkens gradually (maximum 50% opacity)
- Ball size varies randomly (±10px)

### Streak Badges
- 🥉 Bronze: 3 consecutive successful taps
- 🥈 Silver: 5 consecutive successful taps
- 🏆 Gold: 10 consecutive successful taps

### Timing Feedback
- Calculates precise timing error in seconds
- Shows "too early" or "too late" based on ball position
- Ghost overlay shows where you tapped vs. target center

## 🐛 Known Issues

None! The app is production-ready.

## 📞 Support

For support, please contact the developer.
