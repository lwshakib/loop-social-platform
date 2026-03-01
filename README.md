# <img src="public/logo.svg" width="40" height="40" align="center" /> Loop – Social Platform

Loop is a high-performance, modern social networking platform designed for seamless interaction. Built with a cutting-edge stack including **Next.js 16**, **React 19**, **Better Auth**, and **Prisma**, Loop provides a fast, secure, and visually stunning experience across all devices.

![Loop App Demo](public/demo.png)

## 🚀 Key Features

### 👤 User Management & Discovery

- **Advanced Authentication**: Secure login and registration powered by **Better Auth**, supporting both traditional Email/Password and **Google OAuth**.
- **Rich Profiles**: Customizable user profiles with avatars, cover images, bios, and display handles.
- **Social Graph**: robust follow/unfollow system to build your network.
- **Dynamic Search**: Real-time search for users and content with persistent search history.

### 📝 Content & Interaction

- **Multi-Media Posts**: Share thoughts via text, or upload images and videos (powered by **Cloudinary**).
- **Interactive Feed**: A dynamic home feed with infinite scroll and real-time content updates.
- **Engagement Tools**: Like, bookmark, and share posts with ease.
- **Threaded Comments**: Engage in deep conversations with nested, multi-level comment support.
- **Stories**: Share ephemeral moments that disappear after 24 hours.
- **Reels**: Quick-consumption short-form video content with an optimized player.

### 🔔 Experience & Performance

- **Real-time Notifications**: Stay updated with interactions (likes, follows, comments) as they happen.
- **Responsive Design**: Mobile-first architecture using **Tailwind CSS 4** and **shadcn/ui**.
- **Dark Mode**: Beautifully crafted dark and light themes for any environment.
- **Performance Optimized**: Leverages **Bun** runtime and Next.js Server Components for maximum efficiency.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Actions)
- **Frontend Logic**: [React 19](https://react.dev/), [Zustand](https://zustand.docs.pmnd.rs/) (State Management)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Framer Motion](https://www.framer.com/motion/)
- **Authentication**: [Better Auth](https://better-auth.com/)
- **Database Logic**: [Prisma ORM](https://www.prisma.io/) with [PostgreSQL](https://www.postgresql.org/)
- **Media Hosting**: [Cloudinary](https://cloudinary.com/)
- **Runtime & Tooling**: [Bun](https://bun.sh/), TypeScript, ESLint, Prettier

## ⚙️ How It Works

Loop follows a modern server-centric architecture:

1.  **Data Layer**: Prisma manages the PostgreSQL schema, providing type-safe database access.
2.  **Authentication**: Better Auth handles session persistence and OAuth flows securely.
3.  **App Logic**: Server Actions handle data mutations, reducing client-side bundle size.
4.  **UI/UX**: Components are built with accessible primitives from Radix UI and styled with Tailwind 4.

## 📥 Getting Started

### Prerequisites

- **Bun**: v1.1.20+ (Required for `bun.lock`)
- **Node.js**: v18.17+
- **PostgreSQL**: A running instance (local or via Supabase/Neon)
- **Cloudinary Account**: For handling media uploads

### Installation

1.  **Clone the Repo**:

    ```bash
    git clone https://github.com/lwshakib/loop-social-platform.git
    cd loop-social-platform
    ```

2.  **Install Dependencies**:

    ```bash
    bun install
    ```

3.  **Setup Environment**:
    Create a `.env` file in the root directory:

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

4.  **Synchronize Database**:

    ```bash
    bun run db:generate
    bun run db:migrate
    ```

5.  **Launch**:
    ```bash
    bun run dev
    ```
    Visit [http://localhost:3000](http://localhost:3000) to see Loop in action.

## 📁 Project Structure

```bash
.
├── actions/              # Server Actions for Mutations
├── app/                  # Next.js App Router (Pages & APIs)
│   ├── (auth)/           # Auth Routes (Sign-in, Sign-up)
│   ├── (main)/           # Core Experience (Feed, Profile)
│   └── api/              # Backend Endpoints
├── components/           # Reusable UI & Complex Components
├── context/              # Global State & Providers
├── hooks/                # Custom React Hooks
├── lib/                  # Auth Config, Prisma Client, Utils
├── prisma/               # Database Models & Migrations
└── public/               # Static Assets (Logos, Icons)
```

## 📜 Scripts

| Command              | Description                           |
| :------------------- | :------------------------------------ |
| `bun run dev`        | Starts the development server         |
| `bun run build`      | Builds the application for production |
| `bun run lint`       | Runs ESLint to check for code issues  |
| `bun run format`     | Formats code using Prettier           |
| `bun run db:migrate` | Applies database migrations           |
| `bun run db:studio`  | Opens Prisma Studio to view data      |
| `bun run test:e2e`   | Runs Playwright E2E tests             |

## 🤝 Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 🛡️ License

Loop is open-source software licensed under the [MIT License](LICENSE).
