# Contributing to Loop Social Platform

Thank you for your interest in contributing to Loop! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Testing](#testing)
- [Documentation](#documentation)

---

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Please:

- Be respectful and considerate in all interactions
- Welcome newcomers and help them get started
- Accept constructive criticism gracefully
- Focus on what is best for the community and project
- Show empathy towards other community members

Unacceptable behavior includes harassment, trolling, personal attacks, or publishing others' private information.

---

## Getting Started

### Prerequisites

Before contributing, ensure you have the following installed:

- **Node.js** 18.x or higher
- **npm** (comes with Node.js) or **yarn**
- **Git**
- **MongoDB** (local instance or MongoDB Atlas account)
- **Docker** (optional, for email testing with MailHog)

### Fork and Clone

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/loop-social-platform.git
   cd loop-social-platform
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/lwshakib/loop-social-platform.git
   ```

### Stay Updated

Keep your fork in sync with the upstream repository:

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

---

## Development Setup

### Environment Configuration

Each sub-project requires its own environment variables. Copy the example files:

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

### Installing Dependencies

Install dependencies for each project you're working on:

```bash
# Server
cd server && npm install

# Web
cd web && npm install

# Mobile
cd mobile && npm install

# Desktop
cd desktop && npm install
```

### Running Development Servers

#### Server (API)

```bash
cd server
npm run dev     # Starts Express server with hot-reload on port 5000
```

#### Web Application

```bash
cd web
npm run dev     # Starts Vite dev server on port 5173
```

#### Mobile Application

```bash
cd mobile
npm start       # Starts Expo development server
npm run android # Run on Android emulator/device
npm run ios     # Run on iOS simulator/device
```

#### Desktop Application

```bash
cd desktop
npm run dev     # Starts Electron with Vite in development mode
```

### Email Testing (MailHog)

For testing emails locally:

```bash
docker-compose up -d
```

- **SMTP Server:** `localhost:1025`
- **Web Interface:** `http://localhost:8025`

---

## Project Structure

```
loop-social-platform/
├── server/              # Express.js REST API (TypeScript)
│   ├── src/
│   │   ├── config/      # Configuration files
│   │   ├── controllers/ # Route controllers
│   │   ├── middlewares/ # Express middlewares
│   │   ├── models/      # Mongoose models
│   │   ├── routes/      # API route definitions
│   │   ├── services/    # Business logic
│   │   ├── utils/       # Utility functions
│   │   └── validations/ # Zod schemas
│   └── api/             # Vercel serverless entry
│
├── web/                 # React web app (Vite + TypeScript)
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── store/       # Zustand state management
│   │   ├── services/    # API service functions
│   │   ├── lib/         # Utility libraries
│   │   └── types/       # TypeScript type definitions
│   └── public/          # Static assets
│
├── mobile/              # React Native app (Expo)
│   ├── app/             # Expo Router screens
│   ├── components/      # Reusable components
│   ├── hooks/           # Custom hooks
│   └── store/           # Zustand state
│
├── desktop/             # Electron app (React + Vite)
│   ├── electron/        # Electron main process
│   ├── src/             # React renderer process
│   └── public/          # Static assets
│
└── docker-compose.yml   # Docker services (MailHog)
```

---

## Coding Standards

### General Guidelines

- Write **TypeScript** for all code (strict mode enabled)
- Use **ESLint** and **Prettier** for code formatting
- Follow **DRY** (Don't Repeat Yourself) principles
- Write self-documenting code with meaningful variable/function names
- Keep functions small and focused on a single responsibility
- Add comments only when the code isn't self-explanatory

### TypeScript

```typescript
// ✅ Good: Explicit types, descriptive names
interface UserProfile {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
}

async function getUserById(userId: string): Promise<UserProfile | null> {
  // Implementation
}

// ❌ Bad: Implicit any, unclear names
async function getUser(id) {
  // Implementation
}
```

### React Components

```tsx
// ✅ Good: Functional components with TypeScript props
interface ButtonProps {
  variant: "primary" | "secondary";
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export function Button({
  variant,
  onClick,
  children,
  disabled = false,
}: ButtonProps) {
  return (
    <button
      className={cn("btn", `btn-${variant}`)}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

// ❌ Bad: No types, inline styles
export function Button(props) {
  return <button style={{ color: "blue" }} {...props} />;
}
```

### File Naming Conventions

| Type             | Convention                  | Example            |
| ---------------- | --------------------------- | ------------------ |
| React Components | PascalCase                  | `UserProfile.tsx`  |
| Hooks            | camelCase with `use` prefix | `useAuth.ts`       |
| Utilities        | camelCase                   | `formatDate.ts`    |
| Types/Interfaces | PascalCase                  | `types.ts`         |
| Constants        | SCREAMING_SNAKE_CASE        | `API_ENDPOINTS.ts` |
| CSS/Style files  | kebab-case                  | `user-profile.css` |

### Import Order

Organize imports in this order:

1. React/framework imports
2. Third-party libraries
3. Internal modules (absolute paths)
4. Relative imports
5. Type imports

```typescript
// React
import { useState, useEffect } from "react";

// Third-party
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

// Internal
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";

// Relative
import { UserCard } from "./UserCard";

// Types
import type { User } from "@/types";
```

---

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type       | Description                                       |
| ---------- | ------------------------------------------------- |
| `feat`     | New feature                                       |
| `fix`      | Bug fix                                           |
| `docs`     | Documentation changes                             |
| `style`    | Code style changes (formatting, semicolons, etc.) |
| `refactor` | Code refactoring (no feature/fix)                 |
| `perf`     | Performance improvements                          |
| `test`     | Adding or updating tests                          |
| `chore`    | Maintenance tasks (deps, configs, etc.)           |
| `ci`       | CI/CD changes                                     |

### Scopes

Use the project name as scope: `server`, `web`, `mobile`, `desktop`, or `root` for monorepo-level changes.

### Examples

```bash
# Feature
git commit -m "feat(web): add user profile editing functionality"

# Bug fix
git commit -m "fix(server): resolve JWT token expiration issue"

# Documentation
git commit -m "docs(root): update contributing guidelines"

# Multiple scopes
git commit -m "feat(web,mobile): implement shared authentication hook"
```

### Commit Best Practices

- Keep commits atomic and focused
- Write clear, descriptive commit messages
- Reference issue numbers when applicable: `fix(server): resolve auth bug (#123)`
- Don't commit commented-out code
- Don't commit `.env` files or secrets

---

## Pull Request Process

### Before Submitting

1. **Create a feature branch** from `main`:

   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Ensure your code**:

   - Follows the coding standards
   - Has no linting errors (`npm run lint`)
   - Builds successfully (`npm run build`)
   - Has appropriate tests (if applicable)

3. **Update documentation** if your changes affect:
   - API endpoints
   - Environment variables
   - Setup instructions
   - Component props/interfaces

### Submitting a PR

1. Push your branch to your fork:

   ```bash
   git push origin feat/your-feature-name
   ```

2. Open a Pull Request against `main` branch

3. Fill out the PR template with:
   - **Description**: What does this PR do?
   - **Type**: Feature / Bug fix / Refactor / etc.
   - **Related Issues**: Link any related issues
   - **Screenshots**: If UI changes are involved
   - **Testing**: How was this tested?
   - **Checklist**: Confirm all requirements are met

### PR Review Process

- PRs require at least one approving review
- Address all review comments
- Keep the PR focused—avoid scope creep
- Rebase on `main` if there are conflicts
- Squash commits if requested

### After Merge

- Delete your feature branch
- Pull the latest `main` to your local repository
- Celebrate your contribution! 🎉

---

## Issue Guidelines

### Reporting Bugs

When reporting a bug, include:

1. **Title**: Clear, concise description
2. **Environment**: OS, Node version, browser (if applicable)
3. **Steps to Reproduce**: Numbered list of steps
4. **Expected Behavior**: What should happen
5. **Actual Behavior**: What actually happens
6. **Screenshots/Logs**: If applicable
7. **Possible Solution**: If you have ideas

### Feature Requests

When requesting a feature, include:

1. **Problem Statement**: What problem does this solve?
2. **Proposed Solution**: Describe your ideal solution
3. **Alternatives**: Other solutions you've considered
4. **Additional Context**: Mockups, examples, etc.

### Issue Labels

| Label              | Description                |
| ------------------ | -------------------------- |
| `bug`              | Something isn't working    |
| `enhancement`      | New feature or improvement |
| `documentation`    | Documentation improvements |
| `good first issue` | Good for newcomers         |
| `help wanted`      | Extra attention needed     |
| `priority: high`   | Critical issues            |
| `server`           | Server-related             |
| `web`              | Web app-related            |
| `mobile`           | Mobile app-related         |
| `desktop`          | Desktop app-related        |

---

## Testing

### Running Tests

```bash
# Server tests
cd server
npm test

# Web tests
cd web
npm test

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Write tests for new features and bug fixes
- Follow the AAA pattern: Arrange, Act, Assert
- Use descriptive test names
- Mock external dependencies

```typescript
// Example test
describe("UserService", () => {
  describe("getUserById", () => {
    it("should return user when valid ID is provided", async () => {
      // Arrange
      const userId = "valid-user-id";

      // Act
      const user = await userService.getUserById(userId);

      // Assert
      expect(user).toBeDefined();
      expect(user.id).toBe(userId);
    });

    it("should return null when user is not found", async () => {
      // Arrange
      const userId = "non-existent-id";

      // Act
      const user = await userService.getUserById(userId);

      // Assert
      expect(user).toBeNull();
    });
  });
});
```

---

## Documentation

### When to Update Docs

Update documentation when you:

- Add new features
- Change existing functionality
- Add/modify API endpoints
- Change environment variables
- Update setup/installation steps

### Documentation Locations

| Type               | Location             |
| ------------------ | -------------------- |
| Project overview   | `/README.md`         |
| Server API docs    | `/server/README.md`  |
| Web app docs       | `/web/README.md`     |
| Mobile app docs    | `/mobile/README.md`  |
| Desktop app docs   | `/desktop/README.md` |
| Contributing guide | `/CONTRIBUTING.md`   |

### Writing Good Documentation

- Use clear, concise language
- Include code examples
- Keep it up-to-date
- Add screenshots for UI features
- Link to related resources

---

## Questions?

If you have questions or need help:

1. Check existing [issues](https://github.com/lwshakib/loop-social-platform/issues)
2. Read the project documentation
3. Open a new issue with the `question` label

---

## License

By contributing to Loop Social Platform, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

Thank you for contributing to Loop! 🚀
