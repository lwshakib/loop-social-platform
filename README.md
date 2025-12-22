# Loop – Social Platform

Loop is a modern, full-stack social media platform built with **Next.js 16**, **React 19**, **Better Auth**, and **Prisma**. It features a rich, responsive UI powered by **shadcn/ui**, **Tailwind CSS 4**, and **Framer Motion**.

![Loop App Demo](public/demo.png)

## Features

- **Authentication**: Secure sign-up/sign-in via Email/Password and Google OAuth using **Better Auth**.
- **Social Core**:
  - User Profiles (`/[username]`)
  - Create Posts (`/create`)
  - Explore Feed (`/explore`)
  - Reels (Short video content)
  - Stories
  - Search with history
  - Real-time Notifications
- **Tech Highlights**:
  - **Prisma ORM** with PostgreSQL interactions
  - **Bun** runtime integration for high-performance scripts
  - **Tailwind CSS v4** styling
  - **Dark Mode** support

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui, Framer Motion
- **Auth**: [Better Auth](https://better-auth.com/)
- **Database**: PostgreSQL, Prisma ORM
- **Package Manager**: Bun

## Prerequisites

- **Bun**: Required (Project uses `bun.lock` and bun-specific scripts)
- **Node.js**: 18+
- **PostgreSQL**: Local or hosted instance
- **Cloudinary**: For media uploads

## Environment Variables

Create a `.env` file in the project root. Add the following variables:

```env
# App
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# Database
DATABASE_URL="postgresql://user:password@host:port/db_name"

# Better Auth
BETTER_AUTH_SECRET="your_generated_secret_key"
BETTER_AUTH_URL="http://localhost:3000"

# OAuth (Google)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

## Getting Started

1.  **Installation**:
    Clone the repository and navigate to the project directory:

    ```bash
    git clone https://github.com/lwshakib/loop-social-platform.git
    cd loop-social-platform
    ```

2.  **Install Dependencies**:

    ```bash
    bun install
    ```

3.  **Database Setup**:
    Ensure your PostgreSQL database is running and `DATABASE_URL` is set in `.env`.

    ```bash
    bun run db:generate
    bun run db:migrate
    ```

4.  **Run Development Server**:
    ```bash
    bun run dev
    # or
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
.
├── actions/              # Server Actions
├── app/                  # Next.js App Router
│   ├── (auth)/           # Authentication pages
│   ├── (main)/           # Main app pages (Feed, Profile, etc.)
│   ├── api/              # API Routes
│   └── globals.css       # Global styles
├── components/           # React components
│   └── ui/               # shadcn/ui primitives
├── context/              # React Context Providers
├── hooks/                # Custom Hooks
├── lib/                  # Utilities, Auth, Prisma client
├── prisma/               # Database Schema
├── proxy.ts              # Middleware/Proxy logic
└── public/               # Static assets
```

## Scripts

- `dev`: Start development server
- `build`: Build for production
- `start`: Start production server
- `db:generate`: Generate Prisma Client (`bun x prisma generate`)
- `db:migrate`: Run migrations (`bun x prisma migrate`)
- `db:studio`: Open Prisma Studio (`bun x prisma studio`)

## License

This project is licensed under the MIT License.
