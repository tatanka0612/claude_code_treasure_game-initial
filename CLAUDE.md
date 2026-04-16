# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # install dependencies
npm run dev:full     # start both backend (port 3001) and frontend (port 3000) concurrently
npm run dev          # frontend only — API calls will fail without the backend
npm run server:dev   # backend only with nodemon auto-reload
npm run build        # production build → output in build/
```

There is no lint, typecheck, or test script configured.

## Architecture

This is a full-stack app: a React 18 + TypeScript frontend (Vite) with an Express + SQLite backend.

**Frontend (`src/App.tsx`):**
- Single file holds all game logic and all screen rendering — no separate routes or context providers
- `Screen` type (`'landing' | 'login' | 'signup' | 'game'`) drives which UI block renders
- Three `Box` objects (id, isOpen, hasTreasure) in `useState`; one randomly assigned `hasTreasure: true` per `initializeGame()` call
- `openBox(id)` updates box state, adjusts score (+100 treasure / -50 skeleton), and sets `gameEnded`; also POSTs to `/api/scores` when a logged-in user's game ends
- Auth state (`AuthUser`: username + JWT token) stored in `useState` and persisted to `localStorage` as `treasure_user`
- `react-hook-form` manages the login/signup form fields and validation

**Backend (`server/index.ts`):**
- Express on port 3001; Vite dev server proxies `/api` → `http://localhost:3001`
- SQLite database at `game.db` (project root) via `better-sqlite3`; schema auto-created on startup
- Two tables: `users` (id, username, password_hash) and `game_scores` (id, user_id, score, result, played_at)
- `POST /api/auth/signup` and `POST /api/auth/login` — hash passwords with bcryptjs, return a JWT (24h expiry)
- `POST /api/scores` and `GET /api/scores/me` — require `Authorization: Bearer <token>`; score history limited to last 10 records
- JWT secret is hardcoded in `server/index.ts` as `treasure-hunt-secret-key-2024`

**UI components (`src/components/ui/`):**
- Shadcn-style components built on Radix UI primitives + Tailwind CSS — treat as a library, not game logic
- `src/components/figma/ImageWithFallback.tsx` is a utility wrapper for images

**Animations:** `motion/react` (Framer Motion) used directly on chest elements for hover scale, flip (rotateY), and reveal transitions.

**Static assets:**
- `src/assets/` — chest images: `treasure_closed.png`, `treasure_opened.png`, `treasure_opened_skeleton.png`, `key.png`
- `src/audios/` — `chest_open.mp3`, `chest_open_with_evil_laugh.mp3`

**Path alias:** `@` resolves to `./src` (configured in `vite.config.ts`).

**Build output** goes to `build/` (not the default `dist/`).
