# Contributing to Loop – Social Platform

First off, thank you for considering contributing to Loop! It's people like you who make the open-source community such an amazing place to learn, inspire, and create.

This document provides guidelines and instructions for contributing to this project. Following these helps us maintain a high standard of code quality and ensures a smooth workflow for everyone.

---

## 🏗️ Getting Started

### 1. Prerequisites

Before you begin, ensure you have the following installed:

- [Bun](https://bun.sh/) (Primary runtime and package manager)
- [Node.js](https://nodejs.org/) (v18+)
- [Git](https://git-scm.com/)
- A running [PostgreSQL](https://www.postgresql.org/) database

### 2. Fork & Clone

1.  **Fork** the repository to your own GitHub account.
2.  **Clone** your fork locally:
    ```bash
    git clone https://github.com/your-username/loop-social-platform.git
    cd loop-social-platform
    ```

### 3. Setup Environment

Copy the example environment file and fill in your local values:

```bash
cp .env.example .env
```

Refer to the `README.md` for detailed explanations of each environment variable.

### 4. Install Dependencies

Loop uses **Bun** for package management. Avoid using `npm` or `yarn` to prevent lockfile conflicts.

```bash
bun install
```

### 5. Database Initialization

Prepare your database by generating the Prisma client and running migrations:

```bash
bun run db:generate
bun run db:migrate
```

### 6. Start Developing

Launch the development server:

```bash
bun run dev
```

---

## 🛠️ Development Workflow

### Branching Strategy

We use a feature-branch workflow. Always create a new branch for your work:

- `feat/` for new features
- `fix/` for bug fixes
- `docs/` for documentation changes
- `chore/` for maintenance tasks

```bash
git checkout -b feat/your-exciting-feature
```

### Coding Standards

To keep the codebase clean and accessible, please follow these conventions:

- **TypeScript**: All new files must use `.ts` or `.tsx`. Avoid using `any`; define interfaces or types instead.
- **Server Actions**: Use Server Actions (in the `/actions` directory) for data mutations.
- **Components**:
  - Use Functional Components with Arrow Functions.
  - Leverage `shadcn/ui` primitives found in `components/ui`.
  - Keep components small and focused.
- **Styling**: Stick to **Tailwind CSS 4** utility classes. Avoid inline styles or custom CSS unless absolutely necessary.
- **State Management**: Use **Zustand** for global client-side state.

### Quality Control

Before submitting a Pull Request, ensure your code passes our quality checks:

1.  **Linting**:
    ```bash
    bun run lint
    ```
2.  **Formatting**:
    ```bash
    bun run format
    ```
3.  **Testing**:
    If you added logic, consider adding a unit test in `__tests__/unit` or an E2E test in `__tests__/e2e`.

---

## 📝 Commit Messages

We follow a simplified version of [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: add Google OAuth support`
- `fix: resolve hydration error in Navbar`
- `docs: update setup instructions in README`
- `style: fix alignment in Profile page`

---

## 🚀 Submitting a Pull Request

1.  **Push** your branch to your fork:
    ```bash
    git push origin feat/your-feature-name
    ```
2.  **Open a PR** against the `main` branch of the upstream repository.
3.  **Describe your changes** clearly in the PR template. Include screenshots for UI changes.
4.  **Reference Issues**: If your PR closes an open issue, include `Closes #123`.

---

## 🐛 Reporting Bugs & Issues

If you find a bug, please open an issue with:

- A clear, descriptive title.
- Steps to reproduce the behavior.
- Expected vs. Actual results.
- Screenshots or code snippets if applicable.

---

## 💡 Feature Requests

Have an idea for Loop? We'd love to hear it! Open an issue with the "Feature Request" label and describe the functionality and the value it adds.

---

_Happy hacking!_ 🚀
