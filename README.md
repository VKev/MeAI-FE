# MeAI Monorepo

This repository hosts multiple MeAI front-end applications organized with `pnpm` workspaces, including the Creator app, the Social Feed app, and an Editor workspace for future editors.

## Project structure

```
.
├── apps/                      # Applications: Creator, Social, Editor
│   ├── meai-creator-fe/       # Creator app (React Router SSR)
│   └── meai-editor-fe/        # Editor app (React + Vite SPA)
│   └── meai-social-fe/        # Social feed app (React + Vite SPA)
├── packages/                  # Shared packages
├── pnpm-workspace.yaml        # Workspace configuration
└── package.json               # Root scripts and dependencies
```

## Quick start

Prerequisites: `Node.js >= 18`, `pnpm >= 10`.

Install dependencies:

```bash
pnpm install
```

Development (run individual apps):

```bash
# Creator (SSR, dev server on port 3000)
pnpm --filter meai-creator-fe dev

# Social Feed (SPA, dev server on port 3030)
pnpm --filter meai-social-fe dev

# Editor (local dev)
pnpm --filter meai-editor-fe dev
```

Docker (run all three apps together):

```bash
docker compose up --build
```

Exposed ports:

- Creator: http://localhost:3000
- Editor: http://localhost:3003
- Social: http://localhost:3030

Build:

```bash
pnpm --filter meai-creator-fe build
pnpm --filter meai-social-fe build
pnpm --filter meai-editor-fe build
# or build all workspaces
pnpm -r run build
```

Common scripts:

```bash
pnpm -r run lint           # lint all workspaces
pnpm -r run format:check   # format check
pnpm -r run format:fix     # apply formatting
```

## Applications

- Creator — `apps/meai-creator-fe`
  - Server-side rendering using React Router and Vite
  - Deployment target: Cloudflare Workers
  - Development port: 3000

- Social Feed — `apps/meai-social-fe`
  - Client SPA built with React and Vite
  - Deployment target: static hosting (Netlify, Vercel, etc.)
  - Development port: 3030

- Editor — `apps/meai-editor-fe`
  - Editor workspace for specialized editor features
  - Development: see `apps/meai-editor-fe` for app-specific commands and configuration

## Environment variables

Creator (`apps/meai-creator-fe/.env`):

```env
VITE_API_URL=https://vkev.me
VITE_STRIPE_PUBLISHABLE_KEY=<your-key>
VITE_GOOGLE_CLIENT_ID=<your-id>
SESSION_SECRET=<your-secret>
SESSION_EXPIRES_IN_DAYS=365
```

Social (`apps/meai-social-fe/.env`):

```env
VITE_API_URL=https://vkev.me
VITE_GOOGLE_CLIENT_ID=<your-id>
VITE_NODE_ENV=development
```

Copy environment templates if required:

```bash
cp .env.example apps/meai-creator-fe/.env
cp apps/meai-social-fe/.env.example apps/meai-social-fe/.env
```

## Shared packages

- `@meai/shared-types` — shared TypeScript types
- `@meai/shared-utils` — shared utility functions
- `@meai/eslint-config` and `@meai/tsconfig` — shared configuration

Add a package to a specific workspace:

```bash
pnpm --filter <workspace> add <package>
```

## Deployment

- Creator: automated deployment on push to `main` via GitHub Actions to Cloudflare Workers.
  - Pipeline: `.github/workflows/deploy-cloudflare.yml`

- Social Feed: build and deploy static assets to your hosting provider.

```bash
pnpm --filter meai-social-fe build
# upload the generated dist/ to your static host
```

## Git workflow

- Create feature branches from `main`.
- Follow conventional commit practices and provide clear PR descriptions.
- Run linters and formatters before opening a PR:

```bash
pnpm -r run lint
pnpm -r run format:fix
```

When merging code from external source repositories, use `git remote` and `git merge` targeting the appropriate subdirectory within the monorepo.

## Troubleshooting

- Dependency issues:

```bash
pnpm store prune
rm pnpm-lock.yaml
pnpm install
```

- Port conflicts:

```bash
lsof -i :<port>    # find process
kill -9 <PID>      # terminate
```

- Clean build artifacts and rebuild:

```bash
rm -rf apps/*/dist apps/*/build
pnpm -r run build
```

## References

- pnpm Workspaces: https://pnpm.io/workspaces
- Vite: https://vitejs.dev/
- React Router: https://reactrouter.com/
- Cloudflare Workers: https://workers.cloudflare.com/

## Contributing

1. Create a branch from `main`.
2. Implement changes within the relevant `apps/*` folder.
3. Run the linter and formatter.
4. Open a pull request with a clear description of the changes.

---

If you would like adjustments to tone, length, or additional deployment specifics, I can update `README.md` accordingly.
