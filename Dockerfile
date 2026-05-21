FROM node:20-slim

WORKDIR /workspace

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.5.0 --activate

ENV PNPM_STORE_DIR=/pnpm/store

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json worker-configuration.d.ts ./

COPY apps/meai-creator-fe/package.json apps/meai-creator-fe/package.json
COPY apps/meai-editor-fe/package.json apps/meai-editor-fe/package.json
COPY apps/meai-social-fe/package.json apps/meai-social-fe/package.json

# workspace packages
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --frozen-lockfile

COPY . .
