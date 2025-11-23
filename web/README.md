# Loop Social Platform - Web Application

A modern social media platform built with React, TypeScript, and Vite. Loop provides a comprehensive social networking experience with features including posts, stories, reels, messaging, and user profiles.

## 🚀 Features

- **Authentication System**

  - Secure sign-in and sign-up
  - JWT token-based authentication with refresh tokens
  - Protected routes and automatic token validation

- **Social Feed**

  - Home feed with posts (text, image, and video)
  - Like, comment, share, and save posts
  - View counts and engagement metrics
  - Real-time updates

- **Stories**

  - Create and view ephemeral stories
  - Story navigation and viewing

- **Reels**

  - Short-form video content
  - Video player with playback controls
  - Reel navigation and discovery

- **Explore**

  - Discover new content and users
  - Content discovery feed

- **Messaging**

  - Direct messaging between users
  - Real-time communication

- **User Profiles**

  - View and edit user profiles
  - Profile customization
  - Username-based profile routing (`@username`)

- **UI/UX**
  - Dark and light theme support
  - Responsive design
  - Modern, accessible UI components
  - Smooth animations with Framer Motion

## 🛠️ Tech Stack

### Core

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router 7** - Client-side routing

### UI & Styling

- **Tailwind CSS v4** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Animation library
- **Lucide React** - Icon library

### State Management & Data

- **Zustand** - Lightweight state management
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### Additional Libraries

- **Sonner** - Toast notifications
- **date-fns** - Date formatting
- **Recharts** - Data visualization
- **next-themes** - Theme management

## 📁 Project Structure

```
web/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── Layout.tsx      # Main layout component
│   │   ├── VideoPlayer.tsx # Video player component
│   │   └── theme-*.tsx     # Theme-related components
│   ├── pages/              # Page components
│   │   ├── HomePage.tsx
│   │   ├── ExplorePage.tsx
│   │   ├── ReelsPage.tsx
│   │   ├── MessagesPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── SignInPage.tsx
│   │   ├── SignUpPage.tsx
│   │   └── StoriesPage.tsx
│   ├── store/              # Zustand stores
│   │   └── userStore.ts
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   ├── App.tsx
│   └── main.tsx            # Application entry point
├── public/                 # Static assets
├── dist/                   # Build output
└── package.json
```

## 🚦 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn package manager

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the root directory:

```env
VITE_SERVER_URL=http://localhost:3000
```

Replace `http://localhost:3000` with your backend server URL.

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port shown in the terminal).

### Building for Production

Build the application:

```bash
npm run build
```

The production build will be in the `dist/` directory.

Preview the production build:

```bash
npm run preview
```

### Linting

Run ESLint to check for code issues:

```bash
npm run lint
```

## 🔐 Authentication

The application uses JWT-based authentication with the following flow:

1. Users sign in/sign up through the authentication pages
2. Access tokens and refresh tokens are stored in HTTP-only cookies
3. Protected routes automatically validate tokens
4. Expired access tokens are refreshed using refresh tokens
5. Invalid or missing tokens redirect to the sign-in page

## 🎨 Theming

The application supports both dark and light themes:

- Theme preference is stored in localStorage
- Users can toggle themes using the theme toggle component
- Default theme is set to "dark"

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔧 Configuration

### Vite Configuration

The project uses Vite with:

- React plugin for Fast Refresh
- Tailwind CSS plugin
- Path alias `@` pointing to `./src`

### TypeScript Configuration

- `tsconfig.json` - Base TypeScript configuration
- `tsconfig.app.json` - Application-specific config
- `tsconfig.node.json` - Node.js-specific config

### ESLint Configuration

The project uses ESLint with TypeScript support. To enable stricter type-aware rules, see the ESLint configuration file.

## 🌐 Environment Variables

| Variable          | Description            | Required |
| ----------------- | ---------------------- | -------- |
| `VITE_SERVER_URL` | Backend API server URL | Yes      |

## 📦 Key Dependencies

### Production

- `react` & `react-dom` - React framework
- `react-router` - Routing
- `zustand` - State management
- `axios` - HTTP client
- `@radix-ui/*` - UI primitives
- `tailwindcss` - CSS framework
- `framer-motion` - Animations

### Development

- `typescript` - TypeScript compiler
- `vite` - Build tool
- `eslint` - Linting
- `@vitejs/plugin-react` - Vite React plugin

## 🤝 Contributing

When contributing to this project:

1. Follow the existing code style
2. Use TypeScript for type safety
3. Write meaningful component and function names
4. Test your changes thoroughly
5. Ensure ESLint passes without errors

## 📄 License

This project is part of the Loop Social Platform.

---

Built with ❤️ using React, TypeScript, and Vite
