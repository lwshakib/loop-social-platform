## Loop – Social Platform

Loop is a modern, full‑stack social media platform built with **Next.js 16 (App Router)**, **React 19**, **Clerk** for authentication, and **PostgreSQL + Drizzle ORM** for data persistence. It includes features like posts, reels, stories, notifications, messaging, search, and rich UI components powered by **shadcn/ui**, **Radix UI**, and **Tailwind CSS**.

### Features

- **Authentication & onboarding**

  - Email/password, OAuth, and session management via `@clerk/nextjs`
  - Auth layouts in `src/app/(auth)` (`sign-in`, `sign-up`)

- **Core social features**

  - User profiles at `/{username}`
  - Create and edit posts at `/create` and `/p/[postId]`
  - Reels pages at `/reels` and `/reels/[postId]` with a custom `video-player`
  - Stories at `/stories/[username]/[storyId]`
  - Explore feed at `/explore` and `/api/explore`
  - Likes, comments, bookmarks on posts (`src/app/api/posts/**`)
  - Follow/followers/following and suggestions (`src/app/api/users/**`)
  - Search with history (`/search` and `src/app/api/search/**`)
  - Notifications and basic messaging (`/notifications`, `/messages`)

- **Modern UI/UX**

  - App shell layout in `src/app/(main)/layout.tsx` with left sidebar, mobile nav, and top navigation
  - Dark/light mode with `next-themes` and `mode-toggle`
  - Reusable UI primitives in `src/components/ui` (buttons, dialogs, sheets, sidebar, forms, etc.)
  - Toasts and feedback using `sonner`

- **Media & uploads**

  - Cloudinary signature endpoint at `src/app/api/cloudinary/signature/route.ts`
  - Client utilities in `src/lib` and `src/actions` for handling media and posts

- **Data & backend**
  - PostgreSQL database powered by **Drizzle ORM**
  - Schema in `src/db/schema.ts`
  - DB entrypoint in `src/db/index.ts`
  - Typed server actions in `src/actions`

---

### Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript, RSC)
- **Language**: TypeScript
- **UI/Styling**:
  - Tailwind CSS 4 (`@tailwindcss/postcss`)
  - shadcn/ui + Radix UI primitives
  - `framer-motion` for animations
  - `lucide-react` icons
- **Auth**: `@clerk/nextjs`, `@clerk/themes`
- **Database**: PostgreSQL with `drizzle-orm`, migrations/config via `drizzle-kit`
- **Data fetching & state**:
  - Next.js Route Handlers (`src/app/api/**`)
  - `zustand` for client state where needed
- **Media**: `cloudinary` SDK
- **Forms & validation**: `react-hook-form`, `@hookform/resolvers`, `zod`
- **Tooling**:
  - ESLint 9 + `eslint-config-next`
  - Prettier (see `.prettierc`)
  - TypeScript 5

---

### Prerequisites

- **Node.js**: 18.18+ (recommended LTS)
- **Package manager**: npm (project ships with `package-lock.json`)
- **PostgreSQL** database (local or hosted)
- **Cloudinary** account (for media uploads)
- **Clerk** account (for authentication)

---

### Environment Variables

Create a `.env.local` file in the project root (not committed to git). At minimum, you will need:

```bash
DATABASE_URL="postgres://USER:PASSWORD@HOST:PORT/DB_NAME"

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="<your-clerk-publishable-key>"
CLERK_SECRET_KEY="<your-clerk-secret-key>"

# Cloudinary
CLOUDINARY_CLOUD_NAME="<your-cloud-name>"
CLOUDINARY_API_KEY="<your-api-key>"
CLOUDINARY_API_SECRET="<your-api-secret>"
```

You may have additional variables for deployment or provider-specific settings depending on your environment. Check any usage of `process.env` in `src/` and `drizzle.config.ts` when wiring up new environments.

---

### Installation

Clone the repository and install dependencies:

```bash
git clone <your-repo-url> loop-social-platform
cd loop-social-platform
npm install
```

---

### Database Setup

This project uses **Drizzle ORM** with a PostgreSQL database.

1. Ensure `DATABASE_URL` is set in your `.env.local` (or `.env`) file.
2. Push the schema to your database:

```bash
npm run db:push
```

This reads from `src/db/schema.ts` and synchronizes your database using `drizzle.config.ts`.

---

### Running the App

Start the development server:

```bash
npm run dev
```

By default, the app runs at [http://localhost:3000](http://localhost:3000).

For production builds:

```bash
npm run build
npm start
```

---

### Project Structure (Overview)

```text
src/
  app/
    (auth)/           # Auth routes (sign-in, sign-up) and layout
    (main)/           # Main app shell and social routes
      _components/    # Layout components (sidebar, mobile nav, post dialog, video player, etc.)
      [username]/     # User profile pages
      create/         # Create post page
      explore/        # Explore feed
      messages/       # Messages page
      notifications/  # Notifications page
      p/[postId]/     # Single post page
      reels/          # Reels listing and detail pages
      search/         # Search page
      stories/        # Stories pages
    api/              # REST-like route handlers (posts, reels, stories, users, search, Cloudinary)
    globals.css       # Global styles (Tailwind base, theme, etc.)
    layout.tsx        # Root layout

  actions/            # Server actions for posts, users, etc.
  components/         # Shared top-level components (mode toggle, theme provider, sidebar logo)
    ui/               # Generated shadcn/ui primitives
  context/            # React context providers
  db/                 # Drizzle ORM database setup and schema
  hooks/              # Custom hooks (e.g., debounced search, mobile detection)
  lib/                # Utilities and helpers (post actions, utils, tests)
  types/              # Shared TypeScript types
```

---

### Available Scripts

From `package.json`:

- **`npm run dev`** – Start Next.js in development mode.
- **`npm run build`** – Create an optimized production build.
- **`npm start`** – Start the production server (after `build`).
- **`npm run lint`** – Run ESLint over the project.
- **`npm run format`** – Format the codebase with Prettier.
- **`npm run format:check`** – Check formatting with Prettier (no changes).
- **`npm run db:push`** – Push Drizzle schema to the database.

---

### Coding Standards

- **Linting**: ESLint is configured via `eslint.config.mjs` with Next.js + Prettier integration.
- **Formatting**: Prettier is configured in `.prettierc` and `.prettierignore`. Use:

```bash
npm run format
```

to format the codebase before committing.

---

### Deployment

You can deploy this project to any platform that supports Next.js 16 (e.g. Vercel, Netlify, custom Node server).

At a high level:

1. Set all required environment variables in your hosting provider (database, Clerk, Cloudinary, etc.).
2. Ensure the database is reachable from your hosting environment.
3. Run the build and start commands:

   - **Build**: `npm run build`
   - **Start**: `npm start`

For Vercel specifically, import the repository, configure environment variables in the dashboard, and Vercel will handle build and deployment automatically.

---

### License

This project is licensed under the **MIT License**. See `LICENSE` for details.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
