# RenewGuard Web (Agent Portal)

React + Vite agent portal, split out from the main RenewGuard monorepo for
independent deployment. Talks to the `renewguard-backend` API.

Originally served by the Ktor backend at `/app`; now deployed standalone.

## Local dev

```bash
npm install
npm run dev
```

Dev server proxies `/api` to `http://localhost:8080` (see `vite.config.ts`).

## Production build & deploy

1. Copy `.env.production.example` to `.env.production` and set
   `VITE_API_BASE` to your deployed `renewguard-backend` URL.
2. `npm run deploy` (builds then runs `wrangler deploy`).

---

# RenewGuard Agent Web Portal

React + Vite + TypeScript agent portal for **RenewGuard** (AntSolutions). Talks to the existing Ktor backend via `/api/app/*` using the `RG_AGENT` session cookie.

## Dev

Requires Node.js 18+ and the Ktor backend on port 8080.

```bat
cd web
npm install
npm run dev
```

Open http://localhost:5173/app/ — Vite proxies `/api` to `http://localhost:8080`.

Backend (separate terminal):

```bat
gradlew.bat :backend:run
```

## Production build

```bat
cd web
npm install
npm run build
```

Output: `web/dist/`. The Ktor server prefers this directory and serves it at **http://localhost:8080/app** (SPA fallback to `index.html`). If `web/dist` is missing, it falls back to the legacy embedded `app.html`.

## URLs

| Mode | URL |
|------|-----|
| Vite dev | http://localhost:5173/app/ |
| Production (via Ktor) | http://localhost:8080/app |

Marketing `/` and admin `/admin` are unchanged.
