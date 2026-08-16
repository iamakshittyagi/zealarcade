# Zeal Arcade

A full-stack web arcade: 15 classic games reimagined with a glassmorphism UI, wrapped in a coin economy with per-game leaderboards, rewards, and an admin dashboard.

Players sign up, receive 100 starting Z Coins, pay an entry fee per game, and earn coins by winning. Wins, losses, high scores, and totals are aggregated per user per game to drive both global and per-game leaderboards.

- **Client** — React 19 + Vite, React Router 7, plain CSS with design tokens
- **Server** — Express 5, MongoDB via Mongoose 9, JWT auth
- **Fonts** — [Aldrich](https://fonts.google.com/specimen/Aldrich) (single weight, 400)

---

## Table of contents

- [Tech stack](#tech-stack)
- [Games](#games)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Running the app](#running-the-app)
- [Demo account](#demo-account)
- [Admin access](#admin-access)
- [API reference](#api-reference)
- [Data models](#data-models)
- [Frontend routes](#frontend-routes)
- [Styling](#styling)
- [Troubleshooting](#troubleshooting)
- [Known issues](#known-issues)

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, React Router 7, Axios, Lucide icons |
| Backend | Node.js, Express 5, Mongoose 9 |
| Database | MongoDB (local or Atlas) |
| Auth | JWT (`jsonwebtoken`), password hashing via `bcryptjs` (cost 10) |
| Security middleware | `helmet`, `cors` |
| Tooling | ESLint 10, nodemon |

---

## Games

All 15 games are implemented client-side as React components under `client/src/games/`. Entry fees and win rewards are stored per game in MongoDB and seeded by `server/seed.js`.

| Game | `gameId` | Type | Entry fee | Reward on win |
|---|---|---|---|---|
| Chess | `chess` | multi | 25 | 75 |
| Ludo | `ludo` | multi | 20 | 50 |
| Sea Battle | `sea-battle` | multi | 15 | 35 |
| Sudoku | `sudoku` | single | 15 | 35 |
| Snake & Ladder | `snake-ladder` | multi | 15 | 30 |
| Air Hockey | `air-hockey` | multi | 10 | 25 |
| Connect Four | `connect-four` | multi | 10 | 25 |
| Arrows | `arrows` | single | 10 | 20 |
| Pac-Man | `pacman` | single | 10 | 20 |
| Ping Pong | `ping-pong` | multi | 10 | 20 |
| Snake | `snake` | single | 10 | 20 |
| Tic-Tac-Toe | `tic-tac-toe` | multi | 10 | 20 |
| Flappy Bird | `flappy-bird` | single | 10 | 15 |
| Hand Slap | `hand-slap` | multi | 5 | 12 |
| RPS | `rps` | multi | 5 | 10 |

`type` is `single` (solo only) or `multi` (playable against the computer). The Arcade page groups them into **Single Player** and **vs Computer** tabs.

---

## Project structure

```
ZealArcade/
├── client/                     # React + Vite frontend
│   ├── index.html              # HTML shell, Google Fonts link
│   ├── vite.config.js
│   ├── .env                    # VITE_API_URL (not committed)
│   └── src/
│       ├── main.jsx
│       ├── App.jsx             # Router + route guards
│       ├── api/
│       │   ├── axios.js        # Axios instance, JWT interceptor, 401 auto-logout
│       │   ├── auth.js         # register / login / adminLogin / me / coins
│       │   ├── games.js        # games, sessions, scores
│       │   └── admin.js        # admin dashboard calls
│       ├── context/
│       │   └── GameContext.jsx # Auth + coin balance provider (useGame hook)
│       ├── components/
│       │   ├── Layout.jsx      # Header/Footer wrapper (toggleable)
│       │   ├── Header.jsx      # Nav, coin balance, refer & bonus buttons
│       │   ├── Footer.jsx
│       │   └── AdminGuard.jsx  # Keeps admins out of player-only routes
│       ├── pages/
│       │   ├── Welcome.jsx     # Landing page
│       │   ├── Login.jsx  Signup.jsx  AdminLogin.jsx
│       │   ├── Arcade.jsx      # Game library
│       │   ├── Leaderboard.jsx # Global + per-game tabs
│       │   ├── Rewards.jsx     # Spin, scratch, shop, top-ups
│       │   └── Admin.jsx       # Admin dashboard
│       ├── games/              # 15 game components
│       └── styles/
│           ├── variables.css   # Design tokens (colors, fonts, radii, shadows)
│           └── global.css
│
└── server/                     # Express API
    ├── server.js               # App entry: helmet, CORS, routes
    ├── seed.js                 # Seeds games + demo users + leaderboard scores
    ├── .env                    # PORT, MONGO_URI, JWT_SECRET (not committed)
    ├── config/db.js            # Mongoose connection
    ├── middleware/
    │   └── authMiddleware.js   # protect (JWT) + adminOnly (role gate)
    ├── models/
    │   ├── User.js  Game.js  Score.js  GameSession.js
    ├── controllers/
    │   ├── authController.js   gameController.js   adminController.js
    └── routes/
        ├── auth.js  games.js  leaderboard.js  admin.js
```

---

## Getting started

### Prerequisites

- **Node.js 20+** (developed against Node 25)
- **MongoDB** — either a local `mongod` or a MongoDB Atlas cluster
- **npm**

### Install

```bash
git clone https://github.com/A-Jayanth-03/ZealArcade.git
cd ZealArcade

# Backend
cd server && npm install

# Frontend
cd ../client && npm install
```

> **Cross-platform note:** `node_modules` is platform-specific — Vite's `rolldown` bundler ships native binaries per OS. If you copy a project folder between Windows and macOS/Linux, delete `node_modules` and reinstall, or the build fails with `Cannot find module './rolldown-binding.<platform>.node'`.

### Seed the database

```bash
cd server
node seed.js
```

This does three things:

1. Replaces the `games` collection with the 15 games listed above.
2. Creates 8 seeded leaderboard accounts — `ProGamer99`, `Shadow_Strike`, `NinjaWarrior`, `ChessKing`, `PixelHunter`, `LudoLegend`, `SudokuPro`, `SpeedSnake` — each with a starting coin balance. Existing usernames are skipped, so re-running is safe.
3. Generates per-game `Score` documents for them, so the leaderboard isn't empty on first run.

> All seeded accounts share the password `demo1234`. They exist to populate the leaderboard — remove them, or change their passwords, before deploying anywhere public.

---

## Environment variables

Neither `.env` file is committed. Create both.

**`server/.env`**

```ini
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/ZealArcade
JWT_SECRET=replace-with-a-long-random-string
# CLIENT_URL=https://your-frontend.vercel.app   # production only, for CORS
```

**`client/.env`**

```ini
VITE_API_URL=http://localhost:5000/api
```

Notes:

- `JWT_SECRET` should be long and random — e.g. `openssl rand -base64 48`. It signs every auth token; anyone who knows it can forge one.
- Use `127.0.0.1` rather than `localhost` in `MONGO_URI`. `config/db.js` overrides DNS to `8.8.8.8`/`1.1.1.1` outside production, which can prevent `localhost` from resolving on restricted networks.
- `CLIENT_URL` is appended to the CORS allowlist. Without it, only `http://localhost:5173` and `:5174` are permitted.
- `VITE_API_URL` must include the `/api` suffix and match the port the server is actually on.

---

## Running the app

Two terminals:

```bash
# Terminal 1 — API
cd server && npm run dev      # nodemon, or `npm start` for plain node

# Terminal 2 — client
cd client && npm run dev      # Vite dev server on http://localhost:5173
```

Then open **http://localhost:5173**.

| Service | Default URL |
|---|---|
| Client | http://localhost:5173 |
| API | http://localhost:5000 |
| Health check | `GET http://localhost:5000/` |

### macOS: port 5000 conflict

macOS runs **AirPlay Receiver** on port 5000, so the server cannot bind it and fails with `EADDRINUSE`. Either:

- Turn it off — *System Settings → General → AirDrop & Handoff → AirPlay Receiver*, or
- Use another port, keeping both env files in sync:

```ini
# server/.env
PORT=5001
# client/.env
VITE_API_URL=http://localhost:5001/api
```

### Other scripts

```bash
cd client
npm run build      # production build to dist/
npm run preview    # serve the built bundle
npm run lint       # ESLint
```

---

## Demo account

The login page shows these credentials as a hint:

| Username | Password |
|---|---|
| `Zealtester` | `Zeal123` |

If the account doesn't exist in your database, create it:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"Zealtester","email":"zealtester@zealarcade.test","password":"Zeal123"}'
```

New accounts start with **100 Z Coins**.

---

## Admin access

Admins log in at **`/admin-login`** and land on the `/admin` dashboard (users, sessions, platform stats). `AdminGuard` keeps admin accounts out of player routes, and `adminOnly` middleware rejects non-admins at the API.

Registration always creates a `player`. To promote an account, update it directly:

```bash
mongosh ZealArcade --eval 'db.users.updateOne({username:"YourUser"},{$set:{role:"admin"}})'
```

Valid roles are `player` and `admin`.

---

## API reference

Base URL: `http://localhost:5000/api`

Protected routes need an `Authorization: Bearer <token>` header. The client attaches this automatically via an Axios interceptor and logs out on any `401`.

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Create an account. Requires `username`, `email`, `password` (min 6 chars). Returns token + user. |
| POST | `/login` | — | Log in with `username` + `password`. Rejects banned/deleted accounts. |
| POST | `/admin-login` | — | Same, but requires `role: 'admin'`. |
| GET | `/me` | Player | Current user. |
| POST | `/coins` | Player | Adjust balance by `{ delta: number }`. See [Known issues](#known-issues). |

Tokens expire after **7 days**. `passwordHash` is stripped from every user response by a `toJSON` transform on the schema.

### Games & sessions — `/api`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/games` | — | All games, sorted by name. |
| POST | `/sessions` | Player | Start a session for `{ gameId }`. Returns the session. |
| POST | `/sessions/:id/end` | Player | End a session with `{ result, score, finalState }`. `result` is `win` \| `loss` \| `draw` \| `abandoned`. Updates aggregates and credits `rewardOnWin` on a win. |
| GET | `/scores/me` | Player | The caller's stats across all games. |
| GET | `/leaderboard` | — | Leaderboard (see below). |

### Leaderboard

`GET /api/leaderboard`

| Query param | Default | Description |
|---|---|---|
| `gameId` | — | Omit for the global leaderboard; supply for a single game. |
| `sortBy` | `wins` | One of `wins`, `highScore`, `totalScore`, `totalGames`. |
| `limit` | `20` | Capped at 100. |

- **Global** — groups every `Score` by user, sums wins/games/score, computes `winRate`, sorts by coins.
- **Per-game** — filters by `gameId` and joins user details.

### Admin — `/api/admin`

All routes require a valid token **and** `role: 'admin'`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/users` | Paginated, searchable user list. |
| PATCH | `/users/:id` | Ban/unban (`status`), change `role`, adjust coins (`coinsDelta`). Cannot target your own account. |
| DELETE | `/users/:id` | Soft delete — sets `status` to `deleted`. |
| GET | `/sessions` | Recent game sessions (audit log). |
| GET | `/stats` | Platform-wide dashboard metrics. |

---

## Data models

**User** — `username` (unique, 3–20 chars), `email` (unique, validated), `passwordHash`, `role` (`player` \| `admin`), `status` (`active` \| `banned` \| `deleted`), `coins` (default 100), `totalGamesPlayed`, `lastLogin`, timestamps.

**Game** — `gameId` (unique slug), `name`, `type` (`single` \| `multi` \| `both`), `description`, `minPlayers`, `maxPlayers`, `entryFee`, `rewardOnWin`.

**GameSession** — `gameId`, `players[]`, `status` (`active` \| `completed` \| `abandoned`), `winner`, `result`, `score`, `finalState`, `startedAt`, `endedAt`, `durationSeconds`.

**Score** — one document per user per game: `user`, `gameId`, `wins`, `losses`, `draws`, `totalGames`, `highScore`, `totalScore`, `lastPlayed`. This is the leaderboard's source of truth.

---

## Frontend routes

| Route | Access | Page |
|---|---|---|
| `/` | Public | Landing page |
| `/login` · `/signup` | Public | Player auth |
| `/admin-login` | Public | Admin auth |
| `/arcade` | Player | Game library |
| `/leaderboard` | Player | Global + per-game rankings |
| `/rewards` | Player | Spin, scratch card, shop, coin top-up |
| `/admin` | Admin | Dashboard |
| `/games/:slug` | Player | 15 game routes, e.g. `/games/chess` |
| `*` | — | Redirects to `/` |

`ProtectedRoute` requires a session; `AdminGuard` separates admin and player areas.

---

## Styling

Design tokens live in [`client/src/styles/variables.css`](client/src/styles/variables.css) — colors, fonts, radii, shadows. Most pages and games carry their own scoped `<style>` block alongside the component.

Typography is driven by three tokens, all currently set to **Aldrich**:

```css
--font-body:   'Aldrich', sans-serif;
--font-ui:     'Aldrich', sans-serif;
--font-arcade: 'Aldrich', sans-serif;
```

The font is loaded in [`client/index.html`](client/index.html). To change it, update the Google Fonts `<link>` and these three tokens; the two canvas games that set `ctx.font` directly (`PingPong.jsx`, `AirHockey.jsx`) also hardcode the family name.

> Aldrich ships **weight 400 only**. Any `font-weight: 600/700/800` rule renders as browser-synthesized bold rather than a true bold cut.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `EADDRINUSE` on port 5000 (macOS) | AirPlay Receiver owns port 5000. Disable it or change `PORT`. |
| Server prints "running" then exits | `config/db.js` calls `process.exit(1)` when Mongo is unreachable. Check `MONGO_URI` and that `mongod` is running. |
| `querySrv ENOTFOUND ...mongodb.net` | Atlas SRV lookup failed — cluster paused/deleted, IP not allowlisted, or DNS blocked. Verify the cluster, or point `MONGO_URI` at a local instance. |
| `Cannot find module './rolldown-binding.<platform>.node'` | `node_modules` came from a different OS. `rm -rf node_modules && npm install`. |
| `Permission denied` when deleting `node_modules` | Directories lost their write bit (common after a Windows→Unix copy). `chmod -R u+w node_modules` first. |
| Network errors in the browser, API healthy | `VITE_API_URL` port doesn't match the server's, or the origin isn't in the CORS allowlist. Vite must be restarted after editing `.env`. |
| Empty arcade or leaderboard | Database not seeded. Run `node seed.js`. |
| Blocked by CORS in production | Set `CLIENT_URL` on the server to your deployed frontend origin. |

---

## Known issues

Documented so they don't get lost. **The project is not production-ready as-is.**

**Never commit `.env` or backup copies of it.** A `server/.env.backup` containing a live `JWT_SECRET` was previously committed to this repository. Anyone with that value can mint a token for any user, including `role: 'admin'`. If you are working from that history: rotate `JWT_SECRET`, remove the file from tracking, and purge it from git history.

Other outstanding items:

1. **`POST /api/auth/coins` is unauthenticated in effect.** It accepts any `delta` from the client, so any logged-in user can grant themselves unlimited coins. Coin changes should be derived server-side from verified game outcomes.
2. **`POST /api/sessions/:id/end` doesn't verify session ownership.** It never checks that the caller is among `session.players`, and credits the score and coins to whoever makes the request. `score` is also client-supplied with no type check, bounds, or per-game cap.
3. **No rate limiting.** `express-rate-limit` and `express-validator` are installed but never imported, leaving login and registration open to brute force.
4. **Admin role update is broken.** `adminController.js` allowlists `['user', 'admin']` while the schema enum is `['player', 'admin']`. Demoting an admin to `player` silently no-ops, and `'user'` writes a value the schema doesn't allow (`findByIdAndUpdate` skips validators by default).
5. **Shadowed route.** `server.js` mounts `gameRoutes` at `/api` before `leaderboardRoutes` at `/api/leaderboard`, so the root handler in `routes/leaderboard.js` is unreachable — and returns a different response shape than the handler that actually serves the request.
6. **Dead duplicate.** `components/GameWrapper.jsx` is an unused, out-of-date copy of `context/GameContext.jsx`. Everything imports the latter.
7. **Line endings.** The repo has no `.gitattributes`, so CRLF/LF churn can produce diffs touching thousands of lines with no real changes. Adding `* text=auto eol=lf` prevents this.
8. **Lint debt.** `npm run lint` reports roughly 60 errors and 17 warnings — mostly unused `React` imports (unnecessary in React 19), plus a `set-state-in-effect` in `pages/Admin.jsx` that causes cascading renders.

---

## License

ISC
