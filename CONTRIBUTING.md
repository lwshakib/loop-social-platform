## Contributing to Loop – Social Platform

Thanks for your interest in contributing! This document describes how to get set up locally and the conventions to follow when submitting changes.

### Project Repository

The canonical repository is hosted on GitHub under **@lwshakib**. If you are working from a fork, keep it in sync with the upstream repository.

### Getting Started

1. **Fork** the repository on GitHub (if you are an external contributor).
2. **Clone** your fork:

```bash
git clone https://github.com/lwshakib/loop-social-platform.git
cd loop-social-platform
```

3. **Install dependencies**:

```bash
npm install
```

4. **Set up environment variables**:
   - Create a `.env.local` file (see `README.md` for required variables, including `DATABASE_URL`, Clerk keys, and Cloudinary keys).

5. **Prepare the database**:

```bash
npm run db:push
```

6. **Run the dev server**:

```bash
npm run dev
```

### Branching & Workflow

- Work on a **feature branch** off `main`, e.g.:

```bash
git checkout -b feature/your-feature-name
```

- Keep your branch up to date with `main` and resolve conflicts locally before opening a PR.

### Code Style & Quality

- **TypeScript & Next.js**:
  - Prefer **TypeScript** for all new code.
  - Use the **App Router** conventions and follow the existing folder structure (`src/app`, `src/actions`, `src/db`, etc.).

- **Formatting**:
  - This project uses **Prettier**; run:

```bash
npm run format
```

- **Linting**:
  - Run ESLint before pushing:

```bash
npm run lint
```

- **Styling**:
  - Use **Tailwind CSS** utility classes.
  - Use existing **shadcn/ui** and **Radix UI** components from `src/components/ui` rather than introducing new, overlapping primitives.

### Commits

- Keep commits **small and focused**.
- Use clear, descriptive messages (e.g. `feat: add reels autoplay`, `fix: handle empty search query`, `chore: update drizzle schema`).

### Pull Requests

When opening a pull request:

1. Ensure the app builds and runs locally without errors.
2. Confirm `npm run lint` and `npm run format:check` pass.
3. Add or update tests if applicable (e.g. in `src/lib/__tests__`).
4. Provide a clear description:
   - What you changed.
   - Why you changed it.
   - Any breaking changes or migration steps (e.g. `db:push` required).

### Reporting Issues & Feature Requests

- Use GitHub Issues to:
  - Report bugs (include steps to reproduce, expected vs actual behavior, and environment info).
  - Propose enhancements or new features (describe the use case and any UI/UX considerations).

### Questions

If you’re unsure about anything (architecture, style, or scope), open a draft PR or GitHub Discussion/Issue and tag **@lwshakib** for feedback before investing significant work.


