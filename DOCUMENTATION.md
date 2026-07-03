# TripCrew — Developer & User Documentation

## Table of Contents

1. [What is TripCrew?](#1-what-is-tripcrew)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Prerequisites](#4-prerequisites)
5. [Environment Setup](#5-environment-setup)
6. [Running the Application](#6-running-the-application)
7. [Running the Tests](#7-running-the-tests)
8. [API Reference](#8-api-reference)
9. [Feature Guides](#9-feature-guides)
    - [9.1 Authentication](#91-authentication)
    - [9.2 Creating & Managing Trips](#92-creating--managing-trips)
    - [9.3 Inviting Members](#93-inviting-members)
    - [9.4 Proposing Destinations](#94-proposing-destinations)
    - [9.5 Voting (Borda Count)](#95-voting-borda-count)
    - [9.6 Trip Dashboard & Live Scores](#96-trip-dashboard--live-scores)
    - [9.7 Archetype Badges](#97-archetype-badges)
    - [9.8 Availability Heatmap](#98-availability-heatmap)
    - [9.9 Wheel of Destiny (Deadlock Breaker)](#99-wheel-of-destiny-deadlock-breaker)
    - [9.10 Trip Playbook](#910-trip-playbook)
10. [Authorization Rules](#10-authorization-rules)
11. [Frontend Page Map](#11-frontend-page-map)
12. [Codebase Walkthrough](#12-codebase-walkthrough)
13. [Deployment](#13-deployment)
14. [Common Issues & Troubleshooting](#14-common-issues--troubleshooting)

---

## 1. What is TripCrew?

TripCrew is a **group trip planning web application**. It solves the real-world problem of group indecision when planning travel with friends and family. The core loop is:

1. A **host** creates a trip and shares an invite link.
2. **Members** join and propose destinations.
3. Everyone **votes** using a ranked-choice ballot (Borda count scoring).
4. If the vote ends in a tie or too few people vote by the deadline, the host spins the **Wheel of Destiny** to pick a winner.
5. Members mark **when they are free** on an availability calendar heatmap.
6. Once a destination is decided, the **Playbook** unlocks: the host writes instructions (Markdown), and everyone tracks their own preparation checklist.
7. Along the way, the system automatically awards **archetype badges** (The Ghost, The Dictator, etc.) based on member behavior.

---

## 2. Tech Stack

| Layer        | Technology                                               |
| ------------ | -------------------------------------------------------- |
| Language     | TypeScript (strict) across client, server and shared     |
| Frontend     | React 18 (Vite), Tailwind CSS v4 + shadcn-style UI kit   |
| Backend      | Node.js 18+, Express 4 (run via `tsx`, built with `tsc`) |
| Database     | MongoDB (Mongoose ODM)                                   |
| Shared types | `@tripcrew/shared` — domain & API contracts (types-only) |
| Auth         | JWT (jsonwebtoken) + bcrypt (bcryptjs)                   |
| Invite codes | nanoid                                                   |
| Date logic   | date-fns                                                 |
| Markdown     | marked + DOMPurify (XSS sanitization)                    |
| Toasts       | sonner                                                   |
| Tooling      | Vitest, ESLint, Prettier                                 |

---

## 3. Project Structure

```
tripcrew/
├── .gitignore
├── README.md
├── DOCUMENTATION.md          ← you are here
├── tripcrew_agent_prompt.md  ← original product brief
│
├── shared/                   @tripcrew/shared — types-only package (import type only)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── domain.ts         Wire-shape domain types + unions
│       ├── api.ts            Request/response contracts for every endpoint
│       └── index.ts          Barrel re-export
│
├── client/                   React + Vite + TypeScript app
│   ├── index.html
│   ├── vite.config.js        Vite + Tailwind plugin + `@` alias
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── eslint.config.js
│   ├── package.json
│   ├── .env                  ← copy of .env.example; fill in values
│   ├── .env.example
│   └── src/
│       ├── main.tsx          Entry point
│       ├── App.tsx           Router + AuthProvider
│       ├── index.css         Tailwind + design tokens (theme, wheel, markdown)
│       ├── lib/
│       │   └── utils.ts      cn() class-merge helper
│       ├── api/              Typed API layer (never call axios directly in components)
│       │   ├── axiosInstance.ts   Axios singleton + JWT interceptor
│       │   ├── auth.api.ts
│       │   ├── trips.api.ts
│       │   ├── destinations.api.ts
│       │   ├── votes.api.ts
│       │   ├── availability.api.ts
│       │   ├── wheel.api.ts
│       │   ├── archetypes.api.ts
│       │   └── playbook.api.ts
│       ├── context/
│       │   └── AuthContext.tsx    User + token state; login/logout/register
│       ├── hooks/
│       │   └── useAuth.ts         Consumes AuthContext
│       ├── components/
│       │   ├── ui/                shadcn-style primitives (button, card, input,
│       │   │                      label, textarea, badge, alert, skeleton, spinner,
│       │   │                      tooltip, progress, confirm-dialog)
│       │   ├── ProtectedRoute.tsx  Redirects unauthenticated users to /login
│       │   ├── NavBar.tsx
│       │   ├── AuthForm.tsx
│       │   ├── MembersList.tsx     Members + badge chips
│       │   ├── BadgeChip.tsx       Colored badge with tooltip
│       │   ├── DestinationList.tsx Propose + list destinations
│       │   ├── DestinationCard.tsx Single destination with remove button
│       │   ├── ScoreBoard.tsx      Borda score progress bars
│       │   ├── ChaosButton.tsx     Wheel trigger (creator-only)
│       │   ├── RankableList.tsx    Re-rank vote list (move up/down)
│       │   ├── CalendarGrid.tsx    Month calendar with heatmap overlay
│       │   ├── DateCell.tsx        Single calendar cell
│       │   ├── Legend.tsx          Heatmap color scale key
│       │   ├── WheelCanvas.tsx     Canvas wheel + CSS spin animation
│       │   ├── WinnerBanner.tsx    Post-spin celebratory banner
│       │   ├── DeadlineBadge.tsx   Voting deadline display with live countdown
│       │   ├── SafeMarkdown.tsx    Markdown renderer (DOMPurify-sanitized)
│       │   ├── MarkdownEditor.tsx  Creator's textarea for instructions
│       │   ├── Checklist.tsx       Shared task list with per-member state
│       │   └── TaskRow.tsx         Single checklist row
│       ├── pages/
│       │   ├── Landing.tsx
│       │   ├── Login.tsx
│       │   ├── Register.tsx
│       │   ├── TripsList.tsx
│       │   ├── Join.tsx
│       │   ├── TripDashboard.tsx
│       │   ├── VotePage.tsx
│       │   ├── AvailabilityPage.tsx
│       │   ├── WheelPage.tsx
│       │   ├── PlaybookPage.tsx
│       │   └── NotFound.tsx
│       └── utils/
│           ├── colorScale.ts   Heatmap count → hex color
│           ├── dateKeys.ts     UTC date utilities + month grid builder
│           ├── borda.ts        Client-side Borda point helper
│           ├── errors.ts       getErrorMessage (typed Axios errors)
│           ├── refs.ts         refId (populated-vs-id duality)
│           ├── budget.ts       Budget tier labels and metadata
│           ├── deadline.ts     Deadline formatting and countdown helpers
│           └── tripStatus.ts   Trip status display labels
│
└── server/                   Express + TypeScript API
    ├── server.ts             Entry point (boots DB + app)
    ├── app.ts                Express factory (mounts all routers)
    ├── tsconfig.json
    ├── tsconfig.build.json    Build config (emits dist/, excludes tests)
    ├── vitest.config.ts
    ├── eslint.config.js
    ├── package.json
    ├── .env                  ← copy of .env.example; fill in values
    ├── .env.example
    ├── types/
    │   └── express.d.ts      Request augmentation (req.user, req.trip)
    ├── config/
    │   └── db.ts             Mongoose connection
    ├── models/
    │   ├── User.ts
    │   ├── Trip.ts           (includes checklistTemplates sub-docs)
    │   ├── Destination.ts
    │   ├── Vote.ts
    │   └── Availability.ts
    ├── middleware/
    │   ├── auth.middleware.ts    requireAuth, issueToken
    │   ├── trip.middleware.ts    requireMembership, requireCreator, requireDecided
    │   └── error.middleware.ts   notFound, errorHandler
    ├── controllers/
    │   ├── auth.controller.ts
    │   ├── trips.controller.ts
    │   ├── destinations.controller.ts
    │   ├── votes.controller.ts
    │   ├── availability.controller.ts
    │   ├── wheel.controller.ts
    │   ├── archetypes.controller.ts
    │   └── playbook.controller.ts
    ├── routes/
    │   ├── auth.routes.ts
    │   ├── trips.routes.ts
    │   ├── destinations.routes.ts
    │   ├── votes.routes.ts
    │   ├── availability.routes.ts
    │   ├── wheel.routes.ts
    │   ├── archetypes.routes.ts
    │   └── playbook.routes.ts
    ├── utils/
    │   ├── borda.ts        computeBordaScores, rankByScore
    │   ├── deadlock.ts     evaluateDeadlock
    │   └── archetypes.ts   computeArchetypes, ARCHETYPES definitions
    └── smoke/              Vitest integration suites (in-memory MongoDB)
        ├── harness.ts
        ├── auth.smoke.test.ts
        ├── trips.smoke.test.ts
        ├── destinations.smoke.test.ts
        ├── votes.smoke.test.ts
        ├── dashboard.smoke.test.ts
        ├── availability.smoke.test.ts
        ├── wheel.smoke.test.ts
        └── playbook.smoke.test.ts
```

---

## 4. Prerequisites

| Requirement      | Version | Notes                                             |
| ---------------- | ------- | ------------------------------------------------- |
| Node.js          | 18+     | v24 used during development                       |
| npm              | 9+      | Comes with Node                                   |
| MongoDB          | 6+      | Local install **or** MongoDB Atlas (free)         |
| A modern browser | —       | Chrome, Firefox, Edge — canvas required for Wheel |

> **No Docker required.** The smoke tests use an in-memory MongoDB so you can run the full test suite without any running database.

---

## 5. Environment Setup

### 5.1 Server environment (`server/.env`)

Open `server/.env` and fill in the two required values:

```env
PORT=5000
MONGODB_URI=<your MongoDB connection string>
JWT_SECRET=<a long random string — at least 32 characters>
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
```

**`MONGODB_URI` examples:**

| Setup         | Example URI                                                   |
| ------------- | ------------------------------------------------------------- |
| Local MongoDB | `mongodb://127.0.0.1:27017/tripcrew`                          |
| MongoDB Atlas | `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/tripcrew` |

**`JWT_SECRET`** — generate a strong secret:

```powershell
# PowerShell
[System.Web.Security.Membership]::GeneratePassword(48, 8)
# or simply use any long random string you create manually
```

**`CLIENT_ORIGIN`** — must match the address the React dev server runs on (default `http://localhost:5173`). Change this to your production domain when deploying.

---

### 5.2 Client environment (`client/.env`)

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

If you change the server port or deploy to a remote server, update this URL. The `VITE_` prefix is required for Vite to expose the variable to the browser bundle.

---

## 6. Running the Application

Open **two terminal windows** — one for the server, one for the client.

### Terminal 1 — Start the server

```powershell
cd "D:\Projects\TripCrew Planner\server"
npm install          # first time only (also links the local @tripcrew/shared package)
npm run dev          # starts on http://localhost:5000 (tsx watch, auto-restart on save)
```

Expected output:

```
MongoDB connected
Server listening on http://localhost:5000
```

Verify it works:

```powershell
Invoke-RestMethod http://localhost:5000/api/health
# → { status: "ok", time: "2026-06-12T..." }
```

### Terminal 2 — Start the client

```powershell
cd "D:\Projects\TripCrew Planner\client"
npm install          # first time only
npm run dev          # starts on http://localhost:5173
```

Expected output:

```
  VITE v5.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

Open your browser at **http://localhost:5173** and you should see the TripCrew landing page.

### Production build

```powershell
# Client → static assets in client/dist/
cd client
npm run build        # outputs to client/dist/
npm run preview      # serves the production build locally on :4173

# Server → compiled JavaScript in server/dist/
cd ../server
npm run build        # tsc -> server/dist/
npm start            # node dist/server.js
```

> The `@tripcrew/shared` package is **types-only** — its types are erased at
> compile time, so nothing from it ends up in either bundle.

---

## 7. Running the Tests

Both packages use **Vitest**. The server suites are integration ('smoke') tests
that boot the real Express app against an **in-memory MongoDB** (no running
database needed) and exercise every API route end-to-end.

```powershell
# Backend integration suites
cd "D:\Projects\TripCrew Planner\server"
npm test

# Frontend unit/component tests (Vitest + Testing Library)
cd "D:\Projects\TripCrew Planner\client"
npm test
```

All suites should pass on a clean install. If you run the server tests in parallel they may produce a spurious worker crash due to concurrent in-memory MongoDB instances — run `npx vitest run --no-file-parallelism` to avoid this.

---

## 8. API Reference

All routes are prefixed with `/api`. The server runs on port `5000` by default.

**Authentication header:**

```
Authorization: Bearer <jwt_token>
```

---

### Auth — `/api/auth`

| Method | Path        | Auth | Description                        | Request Body                | Response          |
| ------ | ----------- | ---- | ---------------------------------- | --------------------------- | ----------------- |
| POST   | `/register` | No   | Create a new account               | `{ name, email, password }` | `{ token, user }` |
| POST   | `/login`    | No   | Log in with email + password       | `{ email, password }`       | `{ token, user }` |
| GET    | `/me`       | Yes  | Get the current authenticated user | —                           | `{ user }`        |

---

### Trips — `/api/trips`

| Method | Path                   | Auth | Member | Creator | Description                                            |
| ------ | ---------------------- | ---- | ------ | ------- | ------------------------------------------------------ |
| POST   | `/`                    | Yes  | —      | —       | Create a trip                                          |
| GET    | `/`                    | Yes  | —      | —       | List trips you are a member of                         |
| GET    | `/:tripId`             | Yes  | Yes    | —       | Get full trip detail + destinations                    |
| PATCH  | `/:tripId`             | Yes  | Yes    | Yes     | Edit title / dates / voting deadline                   |
| GET    | `/preview/:inviteCode` | Yes  | —      | —       | Preview a trip's name and member count before joining  |
| POST   | `/join/:inviteCode`    | Yes  | —      | —       | Join a trip via invite code                            |
| PATCH  | `/:tripId/invite`      | Yes  | Yes    | Yes     | Toggle `inviteActive` (enable/revoke link)             |
| DELETE | `/:tripId`             | Yes  | Yes    | Yes     | Delete a trip and all its data (host only)             |
| POST   | `/:tripId/leave`       | Yes  | Yes    | —       | Leave a trip (non-creator members only)                |
| POST   | `/:tripId/conclude`    | Yes  | Yes    | —       | Conclude voting; host any time, members after deadline |
| GET    | `/:tripId/dashboard`   | Yes  | Yes    | —       | Scores + badges + deadlock status                      |

**Create trip body:**

```json
{ "title": "Summer Escape", "votingDeadline": "2026-07-01T00:00:00.000Z" }
```

---

### Destinations — `/api/trips/:tripId/destinations`

| Method | Path   | Auth | Member | Description                            |
| ------ | ------ | ---- | ------ | -------------------------------------- |
| POST   | `/`    | Yes  | Yes    | Propose a destination                  |
| GET    | `/`    | Yes  | Yes    | List all destinations for the trip     |
| DELETE | `/:id` | Yes  | Yes    | Delete (proposer or trip creator only) |

**Propose body:**

```json
{ "name": "Tokyo", "description": "Sushi heaven", "budgetTier": "high" }
```

`budgetTier` must be one of: `"low"`, `"medium"`, `"high"`.

---

### Votes — `/api/trips/:tripId`

| Method | Path     | Auth | Member | Description                                                           |
| ------ | -------- | ---- | ------ | --------------------------------------------------------------------- |
| PUT    | `/vote`  | Yes  | Yes    | Submit or update ranked vote. Re-submission increments `changeCount`. |
| GET    | `/vote`  | Yes  | Yes    | Get your current vote                                                 |
| GET    | `/tally` | Yes  | Yes    | Get Borda scores for all destinations                                 |

**Vote body:**

```json
{ "ranking": ["<destId1>", "<destId2>", "<destId3>"] }
```

- `ranking` is an **ordered array** of destination ObjectIds (1st element = highest score).
- Destinations not in the array receive **0 points** (unranked).
- Duplicates and unknown IDs are rejected with `400`.

---

### Availability — `/api/trips/:tripId/availability`

| Method | Path       | Auth | Member | Description                                         |
| ------ | ---------- | ---- | ------ | --------------------------------------------------- |
| PUT    | `/`        | Yes  | Yes    | Save (upsert) your available dates                  |
| GET    | `/me`      | Yes  | Yes    | Get your currently saved dates                      |
| GET    | `/heatmap` | Yes  | Yes    | Aggregated count per date across all members        |
| GET    | `/summary` | Yes  | Yes    | Dates ranked by availability, with member name list |

**Save dates body:**

```json
{ "dates": ["2026-07-04", "2026-07-05", "2026-07-06"] }
```

- All dates must be `YYYY-MM-DD` strings in UTC.
- Sending a new array **replaces** the previous selection entirely.

**Heatmap response:**

```json
{ "2026-07-04": 3, "2026-07-05": 5, "2026-07-06": 2 }
```

**Summary response:**

```json
{
    "memberCount": 5,
    "entries": [
        {
            "date": "2026-07-05",
            "members": [
                { "id": "...", "name": "Alice" },
                { "id": "...", "name": "Bob" }
            ]
        },
        { "date": "2026-07-04", "members": [{ "id": "...", "name": "Alice" }] }
    ]
}
```

Entries are sorted descending by member count. Dates with no members are omitted.

---

### Wheel of Destiny — `/api/trips/:tripId/wheel`

| Method | Path      | Auth | Member | Creator | Description                                           |
| ------ | --------- | ---- | ------ | ------- | ----------------------------------------------------- |
| GET    | `/status` | Yes  | Yes    | —       | Check if wheel is eligible; get candidate slices      |
| POST   | `/spin`   | Yes  | Yes    | Yes     | Pick the winner (server-authoritative), set `decided` |

**Status response:**

```json
{
    "eligible": true,
    "tie": true,
    "timeout": false,
    "slices": [
        { "destId": "...", "name": "Tokyo", "score": 5 },
        { "destId": "...", "name": "Bali", "score": 5 }
    ],
    "status": "voting"
}
```

**Spin response:**

```json
{
  "winningDestinationId": "<destId>",
  "winnerIndex": 1,
  "slices": [...],
  "status": "decided"
}
```

> `winnerIndex` is the index into `slices` the wheel must animate to. The client uses this to drive the CSS rotation — the server picks the winner first, then the animation plays.

---

### Archetypes — `/api/trips/:tripId`

| Method | Path          | Auth | Member | Description                                        |
| ------ | ------------- | ---- | ------ | -------------------------------------------------- |
| GET    | `/archetypes` | Yes  | Yes    | Compute and return badges per member               |
| GET    | `/dashboard`  | Yes  | Yes    | Combined: scores + badges + deadlock (single call) |

**Dashboard response:**

```json
{
    "scores": [{ "destId": "...", "name": "Tokyo", "score": 10 }],
    "badges": { "<userId>": ["The Ghost", "The Accountant"] },
    "definitions": {
        "The Ghost": "Has cast zero votes with the deadline looming (<24h)."
    },
    "deadlock": {
        "eligible": false,
        "tie": false,
        "timeout": false,
        "slices": []
    },
    "status": "voting",
    "memberCount": 3,
    "voterCount": 2,
    "votedMemberIds": ["<userId1>", "<userId2>"]
}
```

---

### Playbook — `/api/trips/:tripId/playbook`

> **All playbook routes return `403` if `trip.status === "voting"`.**

| Method | Path                    | Auth | Member | Creator | Description                               |
| ------ | ----------------------- | ---- | ------ | ------- | ----------------------------------------- |
| GET    | `/`                     | Yes  | Yes    | —       | Get instructions, winning dest, checklist |
| PATCH  | `/instructions`         | Yes  | Yes    | Yes     | Update Markdown instructions              |
| POST   | `/tasks`                | Yes  | Yes    | —       | Add a checklist task template             |
| PATCH  | `/tasks/:taskId/toggle` | Yes  | Yes    | —       | Toggle YOUR OWN completion on a task      |
| DELETE | `/tasks/:taskId`        | Yes  | Yes    | —       | Delete task (author or creator only)      |

**Playbook GET response:**

```json
{
    "instructions": "# Meeting point\nLobby at 9am",
    "winningDestination": { "_id": "...", "name": "Tokyo" },
    "checklist": [
        {
            "id": "...",
            "label": "Book flights",
            "completedByMe": false,
            "completedByCount": 2
        }
    ]
}
```

---

## 9. Feature Guides

### 9.1 Authentication

**Registering:**

1. Go to **http://localhost:5173/register**.
2. Enter your name, email, and a password (min 6 characters).
3. On success you are automatically logged in and redirected to `/trips`.

**Logging in:**

1. Go to **http://localhost:5173/login**.
2. Enter your email and password.
3. The JWT is stored in `localStorage` and attached to every subsequent API request automatically.

**Logging out:**

- Click **Logout** in the navbar. The token is cleared from localStorage and you are redirected to `/login`.

**Token expiry:**

- Tokens expire after **7 days** (configurable via `JWT_EXPIRES_IN` in `server/.env`).
- On a `401` response, the Axios interceptor automatically clears the stale token and the app redirects to login on the next protected page visit.

---

### 9.2 Creating & Managing Trips

**Create a trip:**

1. Log in and go to `/trips`.
2. Fill in the **Title** (required) and optionally a **Voting deadline** (datetime-local picker).
3. Click **Create**. You are redirected to the new trip's dashboard.
4. You are automatically added as the first member and designated as **Host**.

**Edit a trip (host only):**

- Use `PATCH /api/trips/:tripId` with any of `{ title, startDate, endDate, votingDeadline }`.

**Trip status flow:**

```
voting  →  decided  →  archived
```

- `voting` — the default state; voting is open and destinations can be proposed.
- `decided` — set when voting is concluded; the Playbook unlocks and destination proposals are closed.
- `archived` — set manually (future use).

**Concluding voting:**

The host can click **Conclude voting now** on the dashboard at any time to end voting early and determine the winner based on current votes. If the voting deadline passes, the result is calculated automatically on the next page load. Concluding sends members to the Playbook (clear winner) or the Wheel of Destiny (tie or insufficient votes).

---

### 9.3 Inviting Members

**Sharing the link:**

1. On the trip dashboard, the invite link is displayed as:
   `http://localhost:5173/join/<inviteCode>`
2. Copy and share it with anyone you want to invite.

**Joining:**

1. The recipient opens the link in their browser.
2. If they are not logged in, they are redirected to `/login` and then back to the join page.
3. The join page shows a **trip preview** — the trip name and how many members have already joined — before committing.
4. They click **Join this trip** to become a member. If they are already a member, the button navigates directly to the trip dashboard.

**Revoking the link (host only):**

- Call `PATCH /api/trips/:tripId/invite` with `{ "inviteActive": false }`.
- New joins via the old code are blocked with `403`.
- Existing members are unaffected.
- Re-enable by sending `{ "inviteActive": true }`.

> **Note:** The invite code itself never changes; only `inviteActive` is toggled.

---

### 9.4 Proposing Destinations

1. Open the trip dashboard.
2. Use the **Propose a destination** form:
    - **Name** (required)
    - **Description** (optional)
    - **Budget tier**: `low`, `medium`, or `high`
3. Click **Add**. The destination appears in the list immediately.

**Deleting a destination:**

- The proposer of a destination or the trip creator can click **Remove** on any card.
- Deleting a destination after votes have been cast does not invalidate those votes; the deleted id simply scores 0 in future tally calculations.

---

### 9.5 Voting (Borda Count)

**How Borda count works:**

- With `N` proposed destinations, your **1st choice earns N points**, 2nd earns N-1, …, last earns 1.
- Destinations you **don't rank earn 0 points**.
- Each destination's score is the **sum across all members' votes**.

**Example** (3 destinations: Tokyo, Bali, Oslo):

| Member | 1st (3pts) | 2nd (2pts) | 3rd (1pt) |
| ------ | ---------- | ---------- | --------- |
| Alice  | Tokyo      | Bali       | Oslo      |
| Bob    | Bali       | Tokyo      | Oslo      |
| Carol  | Tokyo      | Oslo       | Bali      |

Scores: Tokyo = 3+2+3 = **8**, Bali = 2+3+1 = **6**, Oslo = 1+1+2 = **4**

**To cast a vote:**

1. Go to `/trips/:tripId/vote`.
2. The **Unranked** list shows all proposed destinations.
3. Click **Add to ranking** to promote a destination to your ranked list.
4. Use **↑ / ↓** to reorder, **✕** to remove from ranking.
5. Click **Save vote**. The live scoreboard on the right updates immediately.

**Re-voting:**

- You can update your vote any number of times.
- Each update increments your `changeCount` (used for the Overthinker badge).

**Voting lock:**

- Once the trip status becomes `decided`, the vote page becomes read-only. Rankings are displayed but cannot be changed and the Save button is hidden.

**Partial vote warning:**

- If you save while some destinations are unranked, a confirmation dialog warns you that unranked items receive no points. You can proceed or cancel to finish ranking first.

---

### 9.6 Trip Dashboard & Live Scores

The dashboard (`/trips/:tripId`) is the central hub and loads all data in **one API call** (`GET /api/trips/:tripId/dashboard`).

It shows:

- **Trip title** and current status badge ("🗳️ Voting in progress", "✅ Destination decided", "📦 Archived").
- **ScoreBoard** — destinations ranked by Borda score, with the winner highlighted once decided.
- **Voting deadline badge** — displays the deadline date; switches to a live countdown when fewer than 48 hours remain, and shows "Deadline has passed" once expired.
- **Voted indicator** — a vote icon next to each member who has submitted their ranking, plus a "X of Y members have voted" tally beneath the scoreboard.
- **Members list** — each member with their current archetype badges.
- **Destinations** — all proposals with budget tier labels; the proposal form is disabled once voting concludes.
- **Navigation links** — Vote (disabled with tooltip when decided), Availability, Wheel of Destiny (when eligible), and Playbook.
- **Conclude voting now** button (host only, while `voting`) — ends voting early; navigates to the Playbook on a clear winner, or the Wheel of Destiny on a tie.
- **Leave trip** button (non-host members) — removes you from the trip after confirmation.
- **Delete trip** button (host only) — permanently deletes the trip and all its data after confirmation.
- **Invite link** — copy button; host can deactivate or reactivate the link (deactivation requires confirmation).

> The dashboard uses a **refresh-on-load** model (no sockets). Scores and badges update each time the page is visited or after a mutating action returns.

---

### 9.7 Archetype Badges

Badges are computed **on-the-fly** every time the dashboard loads. They are based on trip-specific behavior, not global user identity.

| Badge               | Condition                                                                 |
| ------------------- | ------------------------------------------------------------------------- |
| 👑 The Dictator     | Has proposed **more than 5** destinations for this trip.                  |
| 👻 The Ghost        | Has cast **zero votes** AND the voting deadline is **within 24 hours**.   |
| 🧮 The Accountant   | Has proposed **2+ destinations**, all with `budgetTier = "low"`.          |
| 🤔 The Overthinker  | Has changed their vote ranking **more than 3 times** (`changeCount > 3`). |
| 🎉 The Hype Machine | Was the **first person** to cast a vote for this trip.                    |

A member can hold **multiple badges simultaneously**. Members **can see their own badges** (intentional — the comedy is self-aware).

---

### 9.8 Availability Heatmap

**Purpose:** Settle on _when_ to travel before deciding _where_.

**How to mark your availability:**

1. Go to `/trips/:tripId/availability`.
2. A calendar grid shows one month at a time. Use the **← / →** arrows to navigate up to **6 months ahead** from the current month.
3. **Tap or click** a date to toggle it; **drag** across multiple dates to select or deselect them in one gesture. Touch devices are fully supported.
4. Your selected dates are outlined in blue.
5. Selections **save automatically** when you release (pointer or touch up).

**Reading the heatmap:**

- The background color of each cell shows how many members are free that day:

| Color       | Hex       | Meaning         |
| ----------- | --------- | --------------- |
| White       | `#ffffff` | 0 members free  |
| Light green | `#C0DD97` | 1 member free   |
| Teal        | `#5DCAA5` | 2 members free  |
| Dark green  | `#0F6E56` | 3+ members free |

- The **Legend** below the calendar shows the color scale with labels that adapt to the total member count (e.g. "All 5 available").

**Best dates panel:**

Below the calendar is a **Best dates for your group** collapsible panel. It lists dates sorted by availability count, and hovering a row shows which members are free on that day. This makes it easy to spot the best travel window without reading individual heatmap cells.

**Data model:** Each member's availability is stored as a separate document. Updating one member never touches another's data.

---

### 9.9 Wheel of Destiny (Deadlock Breaker)

**When does the wheel unlock?**

The Chaos Button appears (for the host only) when **either** of these conditions is true:

1. **Tie:** The two highest-scoring destinations have an equal Borda score (and the score is greater than 0).
2. **Timeout:** The voting deadline has passed AND fewer than 50% of trip members have submitted a vote.

**How it works (technical detail):**

1. The host clicks **Spin the Wheel of Destiny**.
2. The app calls `POST /api/trips/:tripId/wheel/spin` **first**.
3. The **server** randomly picks the winner among the tied destinations, saves `winningDestination` on the trip, and changes `status` to `"decided"`.
4. The server returns the `winnerIndex` back to the client.
5. The wheel animates to land on that predetermined index using a CSS `transform: rotate()` + `transition` over 5 seconds.
6. On `transitionend`, the `WinnerBanner` is displayed.

> **Why server-first?** This prevents the wheel from visually landing on one destination while the server records a different one.

**Non-creator experience:**

- Non-creator members see a waiting message: "Waiting for [host name] to spin the Wheel of Destiny…" with a **Refresh** button to manually re-check.
- The page also polls automatically every 10 seconds in the background. Once the result is in, the winner banner appears for everyone without a manual refresh.

**After the spin:**

- The trip status changes to `decided`.
- The winner banner appears for **all members**.
- The Playbook immediately becomes accessible.
- No further spinning is possible on that trip.

> If the host does not spin within 12 hours of the voting deadline, the wheel spins automatically.

---

### 9.10 Trip Playbook

**Access:** `/trips/:tripId/playbook` — only accessible after the trip status becomes `decided`. Returns `403` while still in `voting` status.

**Host capabilities:**

1. Click **Edit** to enter Markdown editing mode.
2. Write meeting points, protocols, packing lists, etc. in Markdown.
3. Click **Save instructions**. The rendered view appears with full Markdown formatting (headings, bold, lists, links, code).
4. **Security:** All rendered Markdown passes through **DOMPurify** before being injected into the DOM — stored XSS attacks via the instructions field are blocked.

**All member capabilities:**

- View the rendered instructions.
- See the **winning destination** highlighted at the top.
- Add **checklist tasks** (shared task templates visible to everyone).
- Check/uncheck tasks — your completion state is **independent** of other members'. Checking a task marks it done only for you; others see their own state.
- The `completedByCount` badge shows how many members have completed each task.

**Deleting a task:**

- Only the task author or the trip creator can delete a task template.

---

## 10. Authorization Rules

Every protected route goes through a middleware chain. The rules are enforced server-side — client-side conditional rendering is a UX convenience only.

| Middleware          | File                 | What it checks                                                |
| ------------------- | -------------------- | ------------------------------------------------------------- |
| `requireAuth`       | `auth.middleware.js` | Valid JWT in `Authorization: Bearer` header                   |
| `requireMembership` | `trip.middleware.js` | `req.user.id` is in `trip.members[]`; attaches `req.trip`     |
| `requireCreator`    | `trip.middleware.js` | `req.user.id === trip.creator`                                |
| `requireDecided`    | `trip.middleware.js` | `trip.status !== 'voting'`; returns `403` for playbook routes |

**Composition example for the spin route:**

```
POST /api/trips/:tripId/wheel/spin
  → requireAuth        (must be logged in)
  → requireMembership  (must be in this trip)
  → requireCreator     (must be the host)
  → spinWheel controller
```

---

## 11. Frontend Page Map

| URL                           | Access        | Description                              |
| ----------------------------- | ------------- | ---------------------------------------- |
| `/`                           | Public        | Landing page with CTAs                   |
| `/login`                      | Public        | Login form                               |
| `/register`                   | Public        | Registration form                        |
| `/trips`                      | Authenticated | Trip list + create trip form             |
| `/join/:inviteCode`           | Authenticated | Join trip via invite link                |
| `/trips/:tripId`              | Trip member   | Dashboard: scores, destinations, members |
| `/trips/:tripId/vote`         | Trip member   | Submit ranked vote; view live scores     |
| `/trips/:tripId/availability` | Trip member   | Click-drag calendar heatmap              |
| `/trips/:tripId/wheel`        | Trip member*  | Wheel animation; spin button (host only) |
| `/trips/:tripId/playbook`     | Trip member†  | Instructions + checklist                 |
| `*` (any unmatched path)      | Public        | 404 — Page not found                     |

\* All members can view the wheel page; only the host can trigger a spin.  
† Redirects / returns `403` until `trip.status === "decided"`.

**`<ProtectedRoute>`** wraps every authenticated route. If no token is found in `localStorage`, it redirects to `/login`, preserving the originally requested path so the user is returned there after login.

---

## 12. Codebase Walkthrough

### Adding a new API endpoint

1. **Create / update the Mongoose model** in `server/models/` if new fields are needed.
2. **Write the controller function** in `server/controllers/`. Always use `async/await` + `try/catch` with `next(err)`.
3. **Add the route** in the appropriate `server/routes/` file, composing the correct middleware chain.
4. **Mount the router** in `server/app.ts`.
5. **Add (or update) the request/response contract** in `shared/src/api.ts`.
6. **Add the API call function** in the appropriate `client/src/api/*.api.ts` file, typed against the shared contract.
7. **Use it in a component or page** by calling that function — never call axios directly from a component.

### Adding a new page

1. Create `client/src/pages/MyPage.tsx`.
2. Import and add a `<Route>` in `client/src/App.tsx`, wrapping with `<ProtectedRoute>` if auth is required.
3. Add any necessary API call functions to `client/src/api/`.

### Middleware composition

Middleware is applied **left-to-right** on the route. Each middleware calls `next()` to continue or `res.status(xxx).json(...)` to short-circuit.

```js
// Example: only authenticated trip members can call this
router.get("/something", requireAuth, requireMembership, myController);

// Example: only the trip creator can call this
router.patch(
    "/something",
    requireAuth,
    requireMembership,
    requireCreator,
    myController,
);
```

---

## 13. Deployment

TripCrew has three runtime pieces that each need a home:

| Piece        | Built form                           | What it needs                               |
| ------------ | ------------------------------------ | ------------------------------------------- |
| **Frontend** | `client/dist/` static files          | Any static file host (Netlify, Nginx, etc.) |
| **Backend**  | `server/dist/server.js` Node process | A server that can run Node 18+              |
| **Database** | MongoDB                              | MongoDB Atlas free tier OR a local `mongod` |

All options below are **completely free**. Pick the one that fits your situation:

| Option                                  | Always on?             | Complexity      | Hardware   | Best for                            |
| --------------------------------------- | ---------------------- | --------------- | ---------- | ----------------------------------- |
| **A — Render + Netlify**                | No (15 min idle sleep) | ⭐ Easiest      | None       | Quickest cloud setup                |
| **B — Fly.io + Netlify**                | Yes                    | ⭐⭐ Medium     | None       | Always-on, no hardware              |
| **C — Raspberry Pi 5 (full self-host)** | Yes                    | ⭐⭐⭐ Involved | RPi 5 8 GB | Full control, zero cloud dependency |
| **D — Pi backend + Netlify frontend**   | Yes                    | ⭐⭐ Medium     | RPi 5 8 GB | Best of both worlds                 |

> **Never commit `.env` files.** All secrets (`JWT_SECRET`, `MONGODB_URI`) must be injected as environment variables on the hosting platform, not checked into source control.

---

### Pre-requisite for all options — MongoDB Atlas Free Tier

MongoDB Atlas M0 is free forever (512 MB storage, enough for a personal trip planner).

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → create a free account.
2. Click **Create** → choose **M0 Free** → pick any region.
3. Under **Database Access**: add a database user (e.g. `tripcrew`) with a strong password. Save it.
4. Under **Network Access**: click **Add IP Address → Allow Access from Anywhere** (`0.0.0.0/0`).
    > For the Raspberry Pi option you can tighten this to your Pi's public IP later.
5. Click **Connect → Drivers → Node.js**. Copy the connection string — it looks like:
    ```
    mongodb+srv://tripcrew:<password>@cluster0.xxxxx.mongodb.net/tripcrew?retryWrites=true&w=majority
    ```
    Replace `<password>` with your DB user's password. Keep this URI handy — every option below uses it as `MONGODB_URI`.

---

### Option A — Render (backend) + Netlify (frontend)

Render and Netlify both pull directly from GitHub and rebuild on every push. This is the easiest path from zero to a live public URL.

**Limitation:** Render's free Web Services sleep after 15 minutes of no traffic. The first request after a sleep takes ~30 seconds to warm up. Fine for a small group of friends who are actively using it.

#### A1. Push the whole monorepo to GitHub

The entire project (`client/`, `server/`, and `shared/`) must be in one GitHub repository.

```powershell
# From the project root
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

#### A2. Deploy the backend on Render

1. Go to [render.com](https://render.com) → sign up (free) → **New → Web Service**.
2. Connect your GitHub account and select the TripCrew repo.
3. Fill in the form:

    | Field              | Value                          |
    | ------------------ | ------------------------------ |
    | **Name**           | `tripcrew-api`                 |
    | **Root Directory** | `server`                       |
    | **Runtime**        | `Node`                         |
    | **Build Command**  | `npm install && npm run build` |
    | **Start Command**  | `node dist/server.js`          |
    | **Instance Type**  | Free                           |

    > Render clones the full monorepo, so the `file:../shared` dependency in `server/package.json` resolves correctly — `../shared` exists alongside `server/` in the clone.

4. Under **Environment Variables**, add:

    | Key              | Value                                                 |
    | ---------------- | ----------------------------------------------------- |
    | `NODE_ENV`       | `production`                                          |
    | `PORT`           | `5000`                                                |
    | `MONGODB_URI`    | _(your Atlas URI)_                                    |
    | `JWT_SECRET`     | _(long random string — see generation command below)_ |
    | `JWT_EXPIRES_IN` | `7d`                                                  |
    | `CLIENT_ORIGIN`  | _(your Netlify URL — fill this in after step A3)_     |

5. Click **Create Web Service**. Note the URL Render gives you (e.g. `https://tripcrew-api.onrender.com`).

#### A3. Deploy the frontend on Netlify

1. Go to [netlify.com](https://netlify.com) → sign up (free) → **Add new site → Import an existing project**.
2. Connect GitHub, pick the same repo.
3. Configure:

    | Field                 | Value                          |
    | --------------------- | ------------------------------ |
    | **Base directory**    | `client`                       |
    | **Build command**     | `npm install && npm run build` |
    | **Publish directory** | `dist`                         |

4. Under **Environment variables**, add:

    | Key                 | Value                                   |
    | ------------------- | --------------------------------------- |
    | `VITE_API_BASE_URL` | `https://tripcrew-api.onrender.com/api` |

5. Click **Deploy site**. Netlify gives you a URL like `https://tripcrew-abc123.netlify.app`.

    > Netlify automatically serves `index.html` for unknown routes (SPA fallback), so React Router works without extra configuration.

#### A4. Wire them together

Go back to Render → your `tripcrew-api` service → **Environment** tab → update `CLIENT_ORIGIN` to your Netlify URL (e.g. `https://tripcrew-abc123.netlify.app`). Save — Render redeploys automatically.

Share the Netlify URL with your friends. Done.

---

### Option B — Fly.io (backend) + Netlify (frontend)

Fly.io's free tier gives you two shared-CPU VMs that **do not sleep**. The backend stays warm at all times. Requires Docker installed locally.

#### B1. Install the Fly CLI

```powershell
# Windows — run in PowerShell
iwr https://fly.io/install.ps1 -useb | iex
fly auth signup   # or: fly auth login
```

#### B2. Create a Dockerfile for the server

Create the file `server/Dockerfile` (at the repo root level so it can access `shared/`):

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

# Copy the shared package first (server depends on file:../shared)
COPY shared/ ./shared/
COPY server/package*.json ./server/
RUN cd server && npm install
COPY server/ ./server/
RUN cd server && npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server/package.json ./package.json
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "dist/server.js"]
```

#### B3. Launch and deploy to Fly.io

Run from the **repo root**:

```powershell
cd "D:\Projects\TripCrew Planner"
fly launch --name tripcrew-api --dockerfile server/Dockerfile --no-deploy
```

Fly creates `fly.toml`. Open it and confirm the internal port is `5000`:

```toml
[http_service]
  internal_port = 5000
  force_https   = true
```

Set secrets (these stay server-side, never in source control):

```powershell
fly secrets set `
  NODE_ENV=production `
  MONGODB_URI="mongodb+srv://tripcrew:..." `
  JWT_SECRET="<your-random-secret>" `
  JWT_EXPIRES_IN=7d `
  CLIENT_ORIGIN="https://tripcrew-abc123.netlify.app"
```

Deploy:

```powershell
fly deploy --dockerfile server/Dockerfile
```

Fly prints your app URL: `https://tripcrew-api.fly.dev`.

#### B4. Deploy the frontend on Netlify

Follow **Option A steps A1 and A3**, setting `VITE_API_BASE_URL` to `https://tripcrew-api.fly.dev/api`.

---

### Option C — Raspberry Pi 5 (Full Self-Host)

The Pi runs everything: Nginx (serves the React SPA + reverse-proxies the API), PM2 (keeps the Node process alive), and optionally MongoDB. A Cloudflare Tunnel gives your friends a stable public HTTPS URL without any port forwarding or router configuration.

#### C1. Flash the Operating System

On your Windows PC, download [Raspberry Pi Imager](https://www.raspberrypi.com/software/) and flash an SD card:

- **OS**: Raspberry Pi OS Lite (64-bit) — no desktop needed
- In **Advanced settings** (gear icon): enable SSH, set a hostname (e.g. `tripcrew`), set a username/password, configure your WiFi credentials.

Insert the SD card into the Pi, power it on, then SSH in from your PC:

```powershell
ssh pi@tripcrew.local
# or use the Pi's local IP: ssh pi@192.168.x.x
```

Update and install base tools:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl nginx
```

#### C2. Install Node.js 20 via NVM

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
node -v    # should print v20.x.x
npm install -g pm2
```

#### C3. Database — choose one

**Recommended: MongoDB Atlas (zero maintenance)** — use the Atlas URI from the pre-requisite step. Skip ahead to C4.

**Alternative: Install MongoDB 7 locally on the Pi**

```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc \
  | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

echo "deb [ arch=arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
  https://repo.mongodb.org/apt/debian bookworm/mongodb-org/7.0 main" \
  | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt update && sudo apt install -y mongodb-org
sudo systemctl enable --now mongod
```

Verify: `mongosh --eval "db.adminCommand('ping')"` → `{ ok: 1 }`.

When using local MongoDB, set `MONGODB_URI=mongodb://127.0.0.1:27017/tripcrew` in `.env`.

#### C4. Clone and build the project

```bash
cd ~
git clone https://github.com/<you>/<repo>.git tripcrew
cd tripcrew

# Build the backend
cd server
npm install
npm run build

# Build the frontend (produces static files in client/dist/)
cd ../client
npm install
npm run build
```

Create the server environment file:

```bash
nano ~/tripcrew/server/.env
```

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=<your Atlas URI or mongodb://127.0.0.1:27017/tripcrew>
JWT_SECRET=<long random string — see generation command at end of this section>
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=https://<your-public-domain>   # fill in after C7
```

#### C5. Start the server with PM2

```bash
cd ~/tripcrew/server
pm2 start dist/server.js --name tripcrew-api
pm2 save        # persist process list across reboots
pm2 startup     # copy and run the command it prints to register PM2 as a system service
```

Verify the API is running locally:

```bash
curl http://localhost:5000/api/health
# → {"status":"ok","time":"..."}
```

#### C6. Configure Nginx

Nginx serves the React SPA and reverse-proxies all `/api/` traffic to Express.

```bash
sudo nano /etc/nginx/sites-available/tripcrew
```

Paste the following (replace the username in `root` if you chose something other than `pi`):

```nginx
server {
    listen 80;
    server_name _;    # matches any hostname — Cloudflare Tunnel handles the real domain

    # Serve the React SPA
    root /home/pi/tripcrew/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;   # SPA fallback — all routes return index.html
    }

    # Reverse-proxy API requests to Express
    location /api/ {
        proxy_pass         http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        keep-alive;
    }
}
```

Enable the site and test:

```bash
sudo ln -s /etc/nginx/sites-available/tripcrew /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default    # remove the default placeholder
sudo nginx -t                                   # must say "test is successful"
sudo systemctl reload nginx
```

Verify everything works locally end-to-end:

```bash
curl http://localhost/api/health
# → {"status":"ok","time":"..."}
```

#### C7. Expose to the internet

Choose one of the following methods. **Method 1 (Cloudflare Tunnel) is recommended** because it requires no router changes and gives your friends a stable HTTPS URL.

---

**Method 1 — Cloudflare Tunnel (recommended: no port forwarding, free HTTPS)**

You need: a free [Cloudflare account](https://cloudflare.com) and a domain name pointed to Cloudflare's nameservers. If you don't already own a domain, a cheap `.com` from Porkbun or Namecheap costs ~$10/year; you then add it to Cloudflare for free DNS management.

```bash
# Install cloudflared on the Pi (ARM64)
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb \
  -o cloudflared.deb
sudo dpkg -i cloudflared.deb

# Log in (run this on the Pi; it prints a URL — open it on your PC to authenticate)
cloudflared tunnel login

# Create a named tunnel
cloudflared tunnel create tripcrew

# Route your subdomain to the tunnel
cloudflared tunnel route dns tripcrew tripcrew.yourdomain.com

# Create the config file
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

`~/.cloudflared/config.yml`:

```yaml
tunnel: tripcrew
credentials-file: /home/pi/.cloudflared/<tunnel-id>.json

ingress:
    - hostname: tripcrew.yourdomain.com
      service: http://localhost:80 # Nginx handles routing from here
    - service: http_status:404
```

Install as a system service so it starts on boot:

```bash
sudo cloudflared service install
sudo systemctl enable --now cloudflared
```

Update `CLIENT_ORIGIN` in `server/.env` to `https://tripcrew.yourdomain.com`, then restart the API:

```bash
pm2 restart tripcrew-api
```

Your friends access `https://tripcrew.yourdomain.com`. Cloudflare provides HTTPS automatically.

---

**Method 2 — Quick Tunnel (zero config, temporary URL — good for a quick test)**

No account or domain required. The URL is random and changes every time you restart the tunnel.

```bash
cloudflared tunnel --url http://localhost:80
```

It prints a URL like `https://some-random-words.trycloudflare.com`. Share that in your group chat. When you restart the Pi or the command, you get a new URL.

---

**Method 3 — DuckDNS + Port Forwarding + Let's Encrypt (free, persistent URL, requires router access)**

1. Register a free subdomain at [duckdns.org](https://www.duckdns.org) (e.g. `tripcrew.duckdns.org`). Copy your token.

2. On the Pi, add a cron job to keep the DNS record pointing to your home IP:

    ```bash
    crontab -e
    # Add this line:
    */5 * * * * curl -s "https://www.duckdns.org/update?domains=tripcrew&token=<your-token>&ip=" > /dev/null
    ```

3. In your **router's admin panel**, forward **TCP ports 80 and 443** to the Pi's local IP address (usually `192.168.x.x`).

4. Install certbot and get a free SSL certificate:

    ```bash
    sudo apt install -y certbot python3-certbot-nginx
    sudo certbot --nginx -d tripcrew.duckdns.org
    ```

    Certbot edits your Nginx config to add HTTPS and redirects. Enable auto-renewal:

    ```bash
    sudo systemctl enable certbot.timer
    ```

Your friends access `https://tripcrew.duckdns.org`.

---

**Method 4 — Tailscale (free VPN, no port forwarding, but friends need the app)**

No domain, no port forwarding — but every person who wants to access TripCrew must install the free Tailscale app on their device and be invited to your tailnet.

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

Tailscale assigns the Pi a stable IP (e.g. `100.x.x.x`) and a hostname (`tripcrew.tail<xxxx>.ts.net`). Invite friends via the [Tailscale admin panel](https://login.tailscale.com/admin/). They then access `http://tripcrew.tail<xxxx>.ts.net` directly.

---

#### C8. Updating the app after code changes

Whenever you push new code:

```bash
cd ~/tripcrew
git pull origin main

# Rebuild and restart the backend
cd server && npm install && npm run build
pm2 restart tripcrew-api

# Rebuild the frontend (Nginx picks up new files immediately)
cd ../client && npm install && npm run build
```

---

### Option D — Raspberry Pi (backend) + Netlify (frontend) + Atlas (database)

This hybrid keeps the always-on Pi handling the API while Netlify's global CDN serves the frontend with zero latency everywhere.

1. Follow **Option C steps C1–C6**, but use a simplified Nginx config that only proxies the API (no frontend serving needed):

    ```nginx
    server {
        listen 80;
        server_name _;

        location /api/ {
            proxy_pass         http://127.0.0.1:5000;
            proxy_http_version 1.1;
            proxy_set_header   Host            $host;
            proxy_set_header   X-Real-IP       $remote_addr;
            proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
    ```

2. Expose the Pi's port 80 using **Cloudflare Tunnel** (Method 1 in C7) pointing to `http://localhost:80`. Your API tunnel URL becomes something like `https://tripcrew-api.yourdomain.com`.

3. Follow **Option A steps A1 and A3** to deploy the frontend to Netlify. Set:
    - `VITE_API_BASE_URL` = `https://tripcrew-api.yourdomain.com/api`

4. On the Pi, update `server/.env`:
    - `CLIENT_ORIGIN` = your Netlify URL (e.g. `https://tripcrew-abc123.netlify.app`)

5. Restart the API:

    ```bash
    pm2 restart tripcrew-api
    ```

Share your Netlify URL with friends. The frontend loads fast from Netlify's CDN; all API calls tunnel securely through Cloudflare to your Pi.

---

### Environment Variables Reference

| Variable            | Location | Description                                                                                               |
| ------------------- | -------- | --------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`          | server   | Set to `production` for all live deployments                                                              |
| `PORT`              | server   | Port Express listens on (default `5000`)                                                                  |
| `MONGODB_URI`       | server   | Full MongoDB Atlas connection string                                                                      |
| `JWT_SECRET`        | server   | Long random string — changing it invalidates all active sessions                                          |
| `JWT_EXPIRES_IN`    | server   | Token lifetime (e.g. `7d`, `30d`)                                                                         |
| `CLIENT_ORIGIN`     | server   | Exact URL of the frontend — controls the CORS `Access-Control-Allow-Origin` header (no trailing slash)    |
| `VITE_API_BASE_URL` | client   | Full URL of the API including `/api` suffix (e.g. `https://api.example.com/api`) — baked in at build time |

Generate a cryptographically strong `JWT_SECRET`:

```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

### Pre-flight Checklist

Run through this before sharing the link with your friends:

- [ ] `MONGODB_URI` is set and the Atlas cluster allows connections from your server's IP (or `0.0.0.0/0`)
- [ ] `JWT_SECRET` is a long, randomly generated string — not a placeholder
- [ ] `CLIENT_ORIGIN` exactly matches the frontend URL (correct protocol `https://`, correct domain, no trailing slash)
- [ ] `VITE_API_BASE_URL` is the production API URL, not `localhost`
- [ ] The API health check responds: `curl https://<your-api-url>/api/health` → `{"status":"ok",...}`
- [ ] The frontend loads in a browser and you can register, log in, and create a trip

---

## 14. Common Issues & Troubleshooting

### `MongoDB connected` never appears

- Check that `MONGODB_URI` in `server/.env` is set correctly.
- For Atlas, ensure your IP address is whitelisted in the Atlas Network Access settings.
- For a local install, confirm `mongod` is running: `Get-Service MongoDB` (Windows) or `systemctl status mongod` (Linux).

### `401 Invalid or expired token` on every request

- The token may have expired (default TTL: 7 days). Log out and log back in.
- Ensure `JWT_SECRET` in `server/.env` has not changed since the token was issued. Changing the secret invalidates all existing tokens.

### CORS error in the browser (`Access-Control-Allow-Origin`)

- `CLIENT_ORIGIN` in `server/.env` must exactly match the origin the browser sends.
- If you use `http://localhost:5173`, that value must be in `CLIENT_ORIGIN` — no trailing slash, correct port.

### Wheel spin returns `409 No deadlock`

- No deadlock condition exists yet. The wheel only unlocks when either:
    - The top two destinations have an exactly equal Borda score, OR
    - The voting deadline has passed with fewer than 50% of members having voted.
- Check `GET /api/trips/:tripId/wheel/status` for the current `eligible`, `tie`, and `timeout` values.

### Playbook returns `403`

- The trip status is still `"voting"`. The playbook unlocks only after the winning destination is decided (via the Conclude voting action or the Wheel of Destiny spin).

### `Failed to load` on the heatmap with no data

- If no member has submitted availability yet, the heatmap API returns `{}` (an empty object), which is the correct response. The calendar grid renders all cells as white.

### Smoke tests fail with `MODULE_NOT_FOUND`

- Always run the tests from the `server/` directory:
    ```powershell
    cd "D:\Projects\TripCrew Planner\server"
    npm test
    ```
