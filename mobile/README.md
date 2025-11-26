# Loop Social Platform - Mobile App

A cross-platform mobile application for the Loop social media platform, built with React Native and Expo.

## 🚀 Features

- **Authentication**
  - User sign-in and sign-up
  - Secure token-based authentication
  - Protected navigation routes

- **Social Feed**
  - Browse and interact with posts
  - Like, comment, and save content
  - Pull-to-refresh functionality

- **Reels**
  - Short-form video content
  - Smooth video playback with expo-video
  - Swipe navigation between reels

- **Notifications**
  - Real-time notification updates
  - Activity tracking

- **User Profiles**
  - View and manage profiles
  - Follow/unfollow users

## 🛠️ Tech Stack

- **Framework:** React Native with Expo 54
- **Language:** TypeScript
- **Navigation:** Expo Router (file-based routing)
- **Styling:** NativeWind (TailwindCSS for React Native)
- **State Management:** Zustand
- **Storage:** AsyncStorage
- **Video:** expo-video
- **Animations:** React Native Reanimated

## 📁 Project Structure

```
mobile/
├── app/                    # File-based routing
│   ├── (auth)/            # Authentication screens
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── (home)/            # Main app screens
│   │   ├── index.tsx      # Home feed
│   │   ├── explore.tsx
│   │   ├── create.tsx
│   │   ├── reels.tsx
│   │   └── profile.tsx
│   ├── reel/              # Individual reel view
│   ├── notifications.tsx
│   └── _layout.tsx        # Root layout
├── hooks/                  # Custom React hooks
├── store/                  # Zustand stores
├── assets/                 # Images and fonts
├── app.json               # Expo configuration
├── tailwind.config.js     # TailwindCSS config
└── package.json
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator
- Expo Go app (for physical device testing)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env.local
```

3. Configure environment variables:

```env
EXPO_PUBLIC_SERVER_URL=http://localhost:3000
```

### Running the App

```bash
# Start Expo development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web
```

### Development Options

After starting the dev server, you can open the app in:

- **Expo Go** - Scan QR code with Expo Go app
- **Android Emulator** - Press `a` in terminal
- **iOS Simulator** - Press `i` in terminal (Mac only)
- **Development Build** - For full native functionality

## 📝 Available Scripts

| Command           | Description                   |
| ----------------- | ----------------------------- |
| `npm start`       | Start Expo development server |
| `npm run android` | Run on Android emulator       |
| `npm run ios`     | Run on iOS simulator          |
| `npm run web`     | Run in web browser            |
| `npm run lint`    | Run ESLint                    |

## 🎨 Styling

The app uses **NativeWind** for styling, which brings TailwindCSS to React Native:

```tsx
<View className="flex-1 bg-black p-4">
  <Text className="text-white text-lg font-bold">Hello Loop!</Text>
</View>
```

## 🔧 Configuration

### Expo Configuration (`app.json`)

- App name, slug, and version
- iOS and Android specific settings
- Splash screen and icons
- Plugins configuration

### Metro Configuration (`metro.config.js`)

- Asset handling
- NativeWind integration

## 🌐 Environment Variables

| Variable                 | Description            | Required |
| ------------------------ | ---------------------- | -------- |
| `EXPO_PUBLIC_SERVER_URL` | Backend API server URL | Yes      |

## 👤 Author

**Shakib Khan** - [@lwshakib](https://github.com/lwshakib)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

Built with ❤️ using React Native and Expo
