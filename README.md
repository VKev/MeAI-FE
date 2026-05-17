# MeAI Monorepo

A monorepo containing multiple MeAI applications (Creator, Social Feed, and future editors) managed with **pnpm workspaces**.

## 📁 Structure

```
.
├── apps/
│   ├── meai-creator-fe/              # Creator app (React Router SSR + Cloudflare Workers)
│   └── meai-social-fe/       # Social feed app (React + Vite SPA)
├── packages/
│   ├── shared-types/         # Shared TypeScript types
│   ├── shared-utils/         # Shared utility functions
│   ├── eslint-config/        # Shared ESLint configuration
│   └── tsconfig/             # Shared TypeScript config
├── pnpm-workspace.yaml       # Workspace configuration
└── package.json              # Root package.json with workspace scripts
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18
- **pnpm** >= 11 (install: `npm install -g pnpm`)

### Installation

```bash
# Install dependencies (pnpm workspace)
pnpm install
```

### Development

```bash
# Run Creator app (port 3000)
pnpm run dev:creator

# Run Social Feed app (port 3030)
pnpm run dev:social

# Run both apps simultaneously (in separate terminals)
# Terminal 1:
pnpm run dev:creator

# Terminal 2:
pnpm run dev:social
```

### Build

```bash
# Build Creator app (React Router SSR)
pnpm run build:creator

# Build Social Feed app (Vite SPA)
pnpm run build:social

# Build all apps
pnpm run build
```

### Other Commands

```bash
# Lint all apps
pnpm run lint

# Format check
pnpm run format:check

# Format fix
pnpm run format:fix

# Type check Creator
pnpm --filter creator run typecheck
```

## 📦 Apps

### Creator (`apps/meai-creator-fe`)

- **Framework:** React Router v7 (Server-Side Rendering)
- **Build:** Vite
- **Deploy:** Cloudflare Workers
- **Port:** 3000 (dev)
- **Commands:**
  ```bash
  pnpm --filter creator dev      # Dev server
  pnpm --filter creator build    # Build SSR
  pnpm --filter creator start    # Start local Wrangler
  ```

### Social Feed (`apps/meai-social-fe`)

- **Framework:** React 19
- **Build:** Vite
- **Deploy:** Static hosting
- **Port:** 3030 (dev)
- **Commands:**
  ```bash
  pnpm --filter meai-social-fe dev      # Dev server
  pnpm --filter meai-social-fe build    # Build SPA
  pnpm --filter meai-social-fe preview  # Preview build
  ```

## 🔧 Environment Setup

### Creator App (`apps/meai-creator-fe/.env`)

```env
VITE_API_URL=https://vkev.me
VITE_STRIPE_PUBLISHABLE_KEY=<your-key>
VITE_GOOGLE_CLIENT_ID=<your-id>
SESSION_SECRET=<your-secret>
SESSION_EXPIRES_IN_DAYS=365
```

### Social Feed App (`apps/meai-social-fe/.env`)

```env
VITE_API_URL=https://vkev.me
VITE_GOOGLE_CLIENT_ID=<your-id>
VITE_NODE_ENV=development
```

Each app has its own `.env` file. Copy from `.env.example` if needed:

```bash
cp .env.example apps/meai-creator-fe/.env
cp apps/meai-social-fe/.env.example apps/meai-social-fe/.env
```

## 📝 Shared Packages

### `@meai/shared-types`

Shared TypeScript type definitions across apps.

```bash
pnpm --filter @meai/shared-types add <package>
```

### `@meai/shared-utils`

Shared utility functions across apps.

### `@meai/eslint-config`

Shared ESLint configuration.

### `@meai/tsconfig`

Shared TypeScript base configuration.

## 🚢 Deployment

### Creator (Cloudflare Workers)

Automatically deployed on `main` branch push via GitHub Actions.

- Workflow: `.github/workflows/deploy-cloudflare.yml`
- URL: `creator.meai.vkev.me`
- Environment: Cloudflare, GitHub Secrets

### Social Feed

Deploy manually to your hosting provider (Netlify, Vercel, etc.)

```bash
pnpm --filter meai-social-fe run build
# Upload dist/ folder to your host
```

## 🔀 Git Workflow

### Merge from Source Repos

When pulling latest code from source repositories:

**Creator (MeAI-FE source):**

```bash
git remote add meai-fe-source <original-repo-url>
git fetch meai-fe-source main
git merge meai-fe-source/main -- apps/meai-fe/  # Merge to monorepo path
```

**Social (MeAI-Social-FE source):**

```bash
git remote add social-source <original-repo-url>
git fetch social-source main
git merge social-source/main -- apps/meai-social-fe/  # Merge to monorepo path
```

## 📚 pnpm Workspace Commands

```bash
# Run script in specific app
pnpm --filter creator run <script>
pnpm --filter meai-social-fe run <script>

# Run script in all apps
pnpm -r run <script>

# Add dependency to specific app
pnpm --filter creator add <package>

# Add dev dependency
pnpm --filter creator add -D <package>

# Remove dependency
pnpm --filter creator remove <package>

# Update dependencies
pnpm update
```

## 🐛 Troubleshooting

### Dependencies not installing?

```bash
# Clear pnpm cache and reinstall
pnpm store prune
rm pnpm-lock.yaml
pnpm install
```

### Port already in use?

- Creator (3000): `lsof -i :3000` → `kill -9 <PID>`
- Social (3030): `lsof -i :3030` → `kill -9 <PID>`

### Build fails?

```bash
# Clean build artifacts
rm -rf apps/*/dist apps/*/build
pnpm run build
```

## 📖 Documentation

- [pnpm Workspaces](https://pnpm.io/workspaces)
- [React Router](https://reactrouter.com/)
- [Vite](https://vitejs.dev/)
- [Cloudflare Workers](https://workers.cloudflare.com/)

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make changes in the respective app folder
3. Run `pnpm run lint` and `pnpm run format:fix`
4. Commit changes with descriptive messages
5. Submit a pull request

## 📞 Support

For issues or questions, check the respective app's README:

- [Creator App](./apps/meai-creator-fe/README.md)
- [Social Feed App](./apps/meai-social-fe/README.md)
