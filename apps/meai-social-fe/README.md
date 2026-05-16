# MeAI-Social-Platform

MeAI-Social-Platform is a basic social network that focuses on essential user interactions: posting, following, commenting, notifications, and reporting.

## Overview

- Goal: deliver a simple, reliable social feed experience.
- Scope: core features only, without complex ranking or recommendation algorithms.

## Key Features

- User authentication and identity reference from the primary system
- Post creation and deletion
- News feed ordered by newest first
- Comments and comment replies
- Follow and unfollow users
- Notifications for follow and comment events
- Reporting content for admin review

## Core Entities

- User (reference from the primary system)
- Post
- Comment
- Follow
- Notification
- Report

## Core Behavior

- Feed includes posts from the user and from followed users, sorted by creation time (newest first).
- Notifications trigger on follow and comment actions.

## Project Setup Commands

```bash
npm install
npm run dev
```

Optional:

```bash
npm run build
npm run preview
```

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- ESLint

## Project Structure

```
.
├─ public/
├─ src/
│  ├─ assets/
│  ├─ components/
│  │  └─ ui/
│  ├─ lib/
│  ├─ App.tsx
│  ├─ main.tsx
│  ├─ App.css
│  └─ index.css
├─ components.json
├─ eslint.config.js
├─ index.html
├─ package.json
├─ tsconfig.json
├─ tsconfig.app.json
├─ tsconfig.node.json
└─ vite.config.ts
```
