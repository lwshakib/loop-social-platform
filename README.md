# Loop Social Platform

A full-stack social media platform with web, mobile, and desktop applications powered by a unified backend API.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![React](https://img.shields.io/badge/React-19-61DAFB)
![Expo](https://img.shields.io/badge/Expo-54-000020)
![Electron](https://img.shields.io/badge/Electron-30-47848F)

## Overview

Loop is a modern social platform that allows users to connect, share, and interact across multiple platforms. The project follows a monorepo structure with shared design patterns and state management across all client applications.

## Project Structure

```
loop-social-platform/
├── server/          # Express.js REST API
├── web/             # React web application
├── mobile/          # React Native (Expo) mobile app
├── desktop/         # Electron desktop application
└── docker-compose.yml
```

## Tech Stack

### Server
- **Runtime:** Node.js with Express 5
- **Language:** TypeScript
- **Database:** MongoDB (Mongoose ODM)
- **Authentication:** JWT with HTTP-only cookies
- **File Storage:** Cloudinary
- **Email:** Nodemailer
- **Validation:** Zod
- **Logging:** Winston + Morgan

### Web
- **Framework:** React 19 with Vite
- **Language:** TypeScript
- **Styling:** TailwindCSS 4
- **UI Components:** shadcn/ui (Radix UI)
- **State Management:** Zustand
- **Forms:** React Hook Form + Zod
- **Routing:** React Router 7
- **Animations:** Framer Motion

### Mobile
- **Framework:** React Native with Expo 54
- **Language:** TypeScript
- **Styling:** NativeWind (TailwindCSS)
- **Navigation:** Expo Router
- **State Management:** Zustand

### Desktop
- **Framework:** Electron 30 + React 18 + Vite
- **Language:** TypeScript
- **Styling:** TailwindCSS 4
- **UI Components:** shadcn/ui (Radix UI)
- **Animations:** Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB instance
- Cloudinary account
- Docker (optional, for email testing)

### Environment Variables

Each project has its own `.env.example` file. Copy and configure them:

```bash
# Server
cp server/.env.example server/.env

# Web
cp web/.env.example web/.env

# Mobile
cp mobile/.env.example mobile/.env.local

# Desktop
cp desktop/.env.example desktop/.env
```

### Installation

```bash
# Install server dependencies
cd server && npm install

# Install web dependencies
cd ../web && npm install

# Install mobile dependencies
cd ../mobile && npm install

# Install desktop dependencies
cd ../desktop && npm install
```

### Running the Applications

#### Server
```bash
cd server
npm run dev     # Development with hot-reload
npm run build   # Build for production
npm start       # Start production server
```

#### Web
```bash
cd web
npm run dev     # Start development server
npm run build   # Build for production
npm run preview # Preview production build
```

#### Mobile
```bash
cd mobile
npm start           # Start Expo development server
npm run android     # Run on Android
npm run ios         # Run on iOS
```

#### Desktop
```bash
cd desktop
npm run dev     # Start development with Electron
npm run build   # Build for distribution
```

### Email Testing (Development)

Start MailHog for local email testing:

```bash
docker-compose up -d
```

- **SMTP Server:** localhost:1025
- **Web UI:** http://localhost:8025

## Scripts

| Project | Command | Description |
|---------|---------|-------------|
| Server | `npm run dev` | Start with hot-reload |
| Server | `npm run build` | Compile TypeScript |
| Web | `npm run dev` | Vite dev server |
| Web | `npm run build` | Production build |
| Mobile | `npm start` | Expo dev server |
| Desktop | `npm run dev` | Electron dev mode |
| Desktop | `npm run build` | Package app |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Author

**Shakib Khan** - [@lwshakib](https://github.com/lwshakib)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Notes

- Cloudinary is used for media storage. Consider disabling video processing on Cloudinary for cost optimization.
- Each sub-project contains its own detailed README with additional configuration options.
