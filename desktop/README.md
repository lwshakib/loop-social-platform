# Loop Social Platform - Desktop App

A native desktop application for the Loop social media platform, built with Electron, React, and Vite.

## 🚀 Features

- **Native Desktop Experience**

  - Cross-platform support (Windows, macOS, Linux)
  - Native window controls and system integration
  - Offline capability

- **Authentication System**

  - Secure sign-in and sign-up
  - JWT token-based authentication
  - Protected routes

- **Social Feed**

  - Browse posts with images and videos
  - Like, comment, share, and save posts
  - Real-time updates

- **Stories**

  - View and create ephemeral stories
  - Story navigation

- **Reels**

  - Short-form video content
  - Video player with controls

- **Messaging**

  - Direct messaging between users
  - Real-time communication

- **User Profiles**

  - View and edit profiles
  - Follow/unfollow users

- **UI/UX**
  - Dark and light theme support
  - Modern, accessible UI components
  - Smooth animations with Framer Motion

## 🛠️ Tech Stack

- **Framework:** Electron 30 + React 18 + Vite
- **Language:** TypeScript
- **Styling:** TailwindCSS 4
- **UI Components:** shadcn/ui (Radix UI)
- **State Management:** Zustand (planned)
- **Forms:** React Hook Form + Zod
- **Animations:** Framer Motion
- **Icons:** Lucide React

## 📁 Project Structure

```
desktop/
├── electron/               # Electron main process
│   ├── main.ts            # Main process entry
│   ├── preload.ts         # Preload scripts
│   └── electron-env.d.ts  # Type definitions
├── src/                   # React renderer process
│   ├── components/        # Reusable UI components
│   │   └── ui/           # shadcn/ui components
│   ├── pages/            # Page components
│   │   ├── HomePage.tsx
│   │   ├── ExplorePage.tsx
│   │   ├── ReelsPage.tsx
│   │   ├── MessagesPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── SignInPage.tsx
│   │   └── SignUpPage.tsx
│   ├── hooks/            # Custom React hooks
│   ├── store/            # State management
│   ├── lib/              # Utility functions
│   ├── types/            # TypeScript types
│   ├── App.tsx
│   └── main.tsx          # Renderer entry point
├── public/               # Static assets
├── dist/                 # Vite build output
├── dist-electron/        # Electron build output
├── electron-builder.json5  # Electron Builder config
└── package.json
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Configure environment variables:

```env
VITE_SERVER_URL=http://localhost:3000
```

### Development

Start the development server with Electron:

```bash
npm run dev
```

This will:

- Start Vite dev server for React
- Launch Electron in development mode
- Enable hot module replacement (HMR)

### Building for Production

Build the application for distribution:

```bash
npm run build
```

This will:

1. Compile TypeScript
2. Build React app with Vite
3. Package with Electron Builder

Output will be in the `dist/` directory.

## 📝 Available Scripts

| Command           | Description                     |
| ----------------- | ------------------------------- |
| `npm run dev`     | Start development with Electron |
| `npm run build`   | Build for production            |
| `npm run lint`    | Run ESLint                      |
| `npm run preview` | Preview Vite build              |

## 🔧 Configuration

### Electron Builder (`electron-builder.json5`)

- Application metadata
- Build targets (Windows, macOS, Linux)
- Installer configuration
- Code signing options

### Vite Configuration (`vite.config.ts`)

- React plugin
- Electron plugin integration
- TailwindCSS plugin
- Path aliases

## 🌐 Environment Variables

| Variable          | Description            | Required |
| ----------------- | ---------------------- | -------- |
| `VITE_SERVER_URL` | Backend API server URL | Yes      |

## 🎨 Theming

The application supports both dark and light themes:

- Theme preference stored in localStorage
- Toggle via theme component
- Default: dark theme

## 📦 Building for Different Platforms

```bash
# Windows
npm run build -- --win

# macOS
npm run build -- --mac

# Linux
npm run build -- --linux
```

## 👤 Author

**Shakib Khan** - [@lwshakib](https://github.com/lwshakib)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

Built with ❤️ using Electron, React, and Vite
