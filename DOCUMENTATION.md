# TripCrew — Developer & User Documentation

## Table of Contents

1. [What is TripCrew?](#1-what-is-tripcrew)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Prerequisites](#4-prerequisites)
5. [Environment Setup](#5-environment-setup)
6. [Running the Application](#6-running-the-application)
7. [Running the Backend Smoke Tests](#7-running-the-backend-smoke-tests)
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
13. [Deployment Notes](#13-deployment-notes)
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

| Layer        | Technology                                  |
|--------------|---------------------------------------------|
| Frontend     | React 18 (Vite), Bootstrap 5                |
| Backend      | Node.js 18+, Express 4                      |
| Database     | MongoDB (Mongoose ODM)                      |
| Auth         | JWT (jsonwebtoken) + bcrypt (bcryptjs)      |
| Invite codes | nanoid                                       |
| Date logic   | date-fns                                    |
| Markdown     | marked + DOMPurify (XSS sanitization)       |

---

## 3. Project Structure

```
tripcrew/
├── .gitignore
├── README.md
├── DOCUMENTATION.md          ← you are here
├── tripcrew_agent_prompt.md  ← original product brief
│
├── client/                   React Vite app
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── .env                  ← copy of .env.example; fill in values
│   ├── .env.example
│   └── src/
│       ├── main.jsx          Entry point
│       ├── App.jsx           Router + AuthProvider
│       ├── index.css         Global styles (heatmap, wheel CSS)
│       ├── api/              All API call functions (never call axios directly in components)
│       │   ├── axiosInstance.js   Axios singleton + JWT interceptor
│       │   ├── auth.api.js
│       │   ├── trips.api.js
│       │   ├── destinations.api.js
│       │   ├── votes.api.js
│       │   ├── availability.api.js
│       │   ├── wheel.api.js
│       │   ├── archetypes.api.js
│       │   └── playbook.api.js
│       ├── context/
│       │   └── AuthContext.jsx    User + token state; login/logout/register
│       ├── hooks/
│       │   └── useAuth.js         Consumes AuthContext
│       ├── components/
│       │   ├── ProtectedRoute.jsx  Redirects unauthenticated users to /login
│       │   ├── NavBar.jsx
│       │   ├── AuthForm.jsx
│       │   ├── MembersList.jsx     Members + badge chips
│       │   ├── BadgeChip.jsx       Colored badge with tooltip
│       │   ├── DestinationList.jsx Propose + list destinations
│       │   ├── DestinationCard.jsx Single destination with remove button
│       │   ├── ScoreBoard.jsx      Borda score progress bars
│       │   ├── ChaosButton.jsx     Wheel trigger (creator-only)
│       │   ├── RankableList.jsx    Drag-to-rank vote list (move up/down)
│       │   ├── CalendarGrid.jsx    Month calendar with heatmap overlay
│       │   ├── DateCell.jsx        Single calendar cell
│       │   ├── Legend.jsx          Heatmap color scale key
│       │   ├── WheelCanvas.jsx     Canvas wheel + CSS spin animation
│       │   ├── WinnerBanner.jsx    Post-spin celebratory banner
│       │   ├── SafeMarkdown.jsx    Markdown renderer (DOMPurify-sanitized)
│       │   ├── MarkdownEditor.jsx  Creator's textarea for instructions
│       │   ├── Checklist.jsx       Shared task list with per-member state
│       │   └── TaskRow.jsx         Single checklist row
│       ├── pages/
│       │   ├── Landing.jsx
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── TripsList.jsx
│       │   ├── Join.jsx
│       │   ├── TripDashboard.jsx
│       │   ├── VotePage.jsx
│       │   ├── AvailabilityPage.jsx
│       │   ├── WheelPage.jsx
│       │   └── PlaybookPage.jsx
│       └── utils/
│           ├── colorScale.js   Heatmap count → hex color
│           ├── dateKeys.js     UTC date utilities + month grid builder
│           └── borda.js        Client-side Borda point helper
│
└── server/                   Express API
    ├── server.js             Entry point (boots DB + app)
    ├── app.js                Express factory (mounts all routers)
    ├── package.json
    ├── .env                  ← copy of .env.example; fill in values
    ├── .env.example
    ├── config/
    │   └── db.js             Mongoose connection
    ├── models/
    │   ├── User.js
    │   ├── Trip.js           (includes checklistTemplates sub-docs)
    │   ├── Destination.js
    │   ├── Vote.js
    │   └── Availability.js
    ├── middleware/
    │   ├── auth.middleware.js    requireAuth, issueToken
    │   ├── trip.middleware.js    requireMembership, requireCreator, requireDecided
    │   └── error.middleware.js   notFound, errorHandler
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── trips.controller.js
    │   ├── destinations.controller.js
    │   ├── votes.controller.js
    │   ├── availability.controller.js
    │   ├── wheel.controller.js
    │   ├── archetypes.controller.js
    │   └── playbook.controller.js
    ├── routes/
    │   ├── auth.routes.js
    │   ├── trips.routes.js
    │   ├── destinations.routes.js
    │   ├── votes.routes.js
    │   ├── availability.routes.js
    │   ├── wheel.routes.js
    │   ├── archetypes.routes.js
    │   └── playbook.routes.js
    ├── utils/
    │   ├── borda.js        computeBordaScores, rankByScore
    │   ├── deadlock.js     evaluateDeadlock
    │   └── archetypes.js   computeArchetypes, ARCHETYPES definitions
    └── smoke/              Backend integration tests (no test runner needed)
        ├── harness.js
        ├── auth.smoke.js
        ├── trips.smoke.js
        ├── destinations.smoke.js
        ├── votes.smoke.js
        ├── dashboard.smoke.js
        ├── availability.smoke.js
        ├── wheel.smoke.js
        └── playbook.smoke.js
```

---

## 4. Prerequisites

| Requirement     | Version | Notes                                      |
|-----------------|---------|--------------------------------------------|
| Node.js         | 18+     | v24 used during development                |
| npm             | 9+      | Comes with Node                            |
| MongoDB         | 6+      | Local install **or** MongoDB Atlas (free)  |
| A modern browser| —       | Chrome, Firefox, Edge — canvas required for Wheel |

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

| Setup              | Example URI                                                   |
|--------------------|---------------------------------------------------------------|
| Local MongoDB      | `mongodb://127.0.0.1:27017/tripcrew`                          |
| MongoDB Atlas      | `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/tripcrew` |

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
npm install          # first time only
npm run dev          # starts on http://localhost:5000 with --watch (auto-restart)
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
cd client
npm run build        # outputs to client/dist/
npm run preview      # serves the production build locally on :4173
```

---

## 7. Running the Backend Smoke Tests

The smoke tests use an **in-memory MongoDB** (no running database needed) and test every API route end-to-end. They run with plain Node — no test runner to install.

```powershell
cd "D:\Projects\TripCrew Planner\server"

# Run a single suite
node smoke/auth.smoke.js

# Run the full suite
node smoke/auth.smoke.js
node smoke/trips.smoke.js
node smoke/destinations.smoke.js
node smoke/votes.smoke.js
node smoke/dashboard.smoke.js
node smoke/availability.smoke.js
node smoke/wheel.smoke.js
node smoke/playbook.smoke.js
```

Each test prints `ok: <description>` for passing assertions and `FAIL: <description>` for failures. The process exits with code `1` if any assertion fails.

All 62 assertions should pass on a clean install.

---

## 8. API Reference

All routes are prefixed with `/api`. The server runs on port `5000` by default.

**Authentication header:**
```
Authorization: Bearer <jwt_token>
```

---

### Auth — `/api/auth`

| Method | Path        | Auth | Description                          | Request Body                         | Response                  |
|--------|-------------|------|--------------------------------------|--------------------------------------|---------------------------|
| POST   | `/register` | No   | Create a new account                 | `{ name, email, password }`          | `{ token, user }`         |
| POST   | `/login`    | No   | Log in with email + password         | `{ email, password }`                | `{ token, user }`         |
| GET    | `/me`       | Yes  | Get the current authenticated user   | —                                    | `{ user }`                |

---

### Trips — `/api/trips`

| Method | Path                        | Auth | Member | Creator | Description                          |
|--------|-----------------------------|------|--------|---------|--------------------------------------|
| POST   | `/`                         | Yes  | —      | —       | Create a trip                        |
| GET    | `/`                         | Yes  | —      | —       | List trips you are a member of       |
| GET    | `/:tripId`                  | Yes  | Yes    | —       | Get full trip detail + destinations  |
| PATCH  | `/:tripId`                  | Yes  | Yes    | Yes     | Edit title / dates / voting deadline |
| POST   | `/join/:inviteCode`         | Yes  | —      | —       | Join a trip via invite code          |
| PATCH  | `/:tripId/invite`           | Yes  | Yes    | Yes     | Toggle `inviteActive` (enable/revoke link) |
| GET    | `/:tripId/dashboard`        | Yes  | Yes    | —       | Scores + badges + deadlock status    |

**Create trip body:**
```json
{ "title": "Summer Escape", "votingDeadline": "2026-07-01T00:00:00.000Z" }
```

---

### Destinations — `/api/trips/:tripId/destinations`

| Method | Path  | Auth | Member | Description                                       |
|--------|-------|------|--------|---------------------------------------------------|
| POST   | `/`   | Yes  | Yes    | Propose a destination                             |
| GET    | `/`   | Yes  | Yes    | List all destinations for the trip                |
| DELETE | `/:id`| Yes  | Yes    | Delete (proposer or trip creator only)            |

**Propose body:**
```json
{ "name": "Tokyo", "description": "Sushi heaven", "budgetTier": "high" }
```
`budgetTier` must be one of: `"low"`, `"medium"`, `"high"`.

---

### Votes — `/api/trips/:tripId`

| Method | Path      | Auth | Member | Description                                                      |
|--------|-----------|------|--------|------------------------------------------------------------------|
| PUT    | `/vote`   | Yes  | Yes    | Submit or update ranked vote. Re-submission increments `changeCount`. |
| GET    | `/vote`   | Yes  | Yes    | Get your current vote                                            |
| GET    | `/tally`  | Yes  | Yes    | Get Borda scores for all destinations                            |

**Vote body:**
```json
{ "ranking": ["<destId1>", "<destId2>", "<destId3>"] }
```
- `ranking` is an **ordered array** of destination ObjectIds (1st element = highest score).
- Destinations not in the array receive **0 points** (unranked).
- Duplicates and unknown IDs are rejected with `400`.

---

### Availability — `/api/trips/:tripId/availability`

| Method | Path       | Auth | Member | Description                                   |
|--------|------------|------|--------|-----------------------------------------------|
| PUT    | `/`        | Yes  | Yes    | Save (upsert) your available dates            |
| GET    | `/me`      | Yes  | Yes    | Get your currently saved dates                |
| GET    | `/heatmap` | Yes  | Yes    | Aggregated count per date across all members  |

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

---

### Wheel of Destiny — `/api/trips/:tripId/wheel`

| Method | Path      | Auth | Member | Creator | Description                                           |
|--------|-----------|------|--------|---------|-------------------------------------------------------|
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
    { "destId": "...", "name": "Bali",  "score": 5 }
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

| Method | Path          | Auth | Member | Description                                         |
|--------|---------------|------|--------|-----------------------------------------------------|
| GET    | `/archetypes` | Yes  | Yes    | Compute and return badges per member                |
| GET    | `/dashboard`  | Yes  | Yes    | Combined: scores + badges + deadlock (single call)  |

**Dashboard response:**
```json
{
  "scores": [{ "destId": "...", "name": "Tokyo", "score": 10 }],
  "badges": { "<userId>": ["The Ghost", "The Accountant"] },
  "definitions": { "The Ghost": "Has cast zero votes with the deadline looming (<24h)." },
  "deadlock": { "eligible": false, "tie": false, "timeout": false, "slices": [] },
  "status": "voting",
  "memberCount": 3,
  "voterCount": 2
}
```

---

### Playbook — `/api/trips/:tripId/playbook`

> **All playbook routes return `403` if `trip.status === "voting"`.**

| Method | Path                       | Auth | Member | Creator | Description                             |
|--------|----------------------------|------|--------|---------|-----------------------------------------|
| GET    | `/`                        | Yes  | Yes    | —       | Get instructions, winning dest, checklist |
| PATCH  | `/instructions`            | Yes  | Yes    | Yes     | Update Markdown instructions            |
| POST   | `/tasks`                   | Yes  | Yes    | —       | Add a checklist task template           |
| PATCH  | `/tasks/:taskId/toggle`    | Yes  | Yes    | —       | Toggle YOUR OWN completion on a task    |
| DELETE | `/tasks/:taskId`           | Yes  | Yes    | —       | Delete task (author or creator only)    |

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
3. The JWT is stored in `localStorage` under the key `tripcrew_token` and attached to every subsequent API request via an Axios interceptor.

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
- `voting` — the default state; voting is open.
- `decided` — set when the wheel is spun; the Playbook unlocks.
- `archived` — set manually (future use).

---

### 9.3 Inviting Members

**Sharing the link:**
1. On the trip dashboard, the invite link is displayed as:
   `http://localhost:5173/join/<inviteCode>`
2. Copy and share it with anyone you want to invite.

**Joining:**
1. The recipient opens the link in their browser.
2. If they are not logged in, they are redirected to `/login` and then back to the join page.
3. They click **Join this trip** to become a member.

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
|--------|-----------|-----------|---------|
| Alice  | Tokyo     | Bali      | Oslo    |
| Bob    | Bali      | Tokyo     | Oslo    |
| Carol  | Tokyo     | Oslo      | Bali    |

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

---

### 9.6 Trip Dashboard & Live Scores

The dashboard (`/trips/:tripId`) is the central hub and loads all data in **one API call** (`GET /api/trips/:tripId/dashboard`).

It shows:
- **Trip title** and current status badge.
- **ScoreBoard** — all destinations ranked by Borda score with a proportional progress bar.
- **Members list** — each member with their current archetype badges.
- **Destinations** — all proposals with budget tier labels.
- **Navigation links** to Vote, Heatmap, Wheel, and Playbook pages.
- **Chaos Button** — visible only to the trip creator when a deadlock is detected.
- **Invite link** — for sharing.

> The dashboard uses a **refresh-on-load** model (no sockets). Scores and badges update each time the page is visited or after a mutating action returns.

---

### 9.7 Archetype Badges

Badges are computed **on-the-fly** every time the dashboard loads. They are based on trip-specific behavior, not global user identity.

| Badge           | Condition                                                                 |
|-----------------|---------------------------------------------------------------------------|
| 👑 The Dictator  | Has proposed **more than 5** destinations for this trip.                  |
| 👻 The Ghost     | Has cast **zero votes** AND the voting deadline is **within 24 hours**.   |
| 🧮 The Accountant| Has proposed **2+ destinations**, all with `budgetTier = "low"`.         |
| 🤔 The Overthinker | Has changed their vote ranking **more than 3 times** (`changeCount > 3`). |
| 🎉 The Hype Machine | Was the **first person** to cast a vote for this trip.                 |

A member can hold **multiple badges simultaneously**. Members **can see their own badges** (intentional — the comedy is self-aware).

---

### 9.8 Availability Heatmap

**Purpose:** Settle on *when* to travel before deciding *where*.

**How to mark your availability:**
1. Go to `/trips/:tripId/availability`.
2. A calendar grid shows the **current month + 2 future months**.
3. **Click** a date to toggle it; **click and drag** to select/deselect multiple dates in one gesture.
4. Your selected dates are outlined in blue.
5. Selections **save automatically** when you release the mouse.

**Reading the heatmap:**
- The background color of each cell shows how many members are free that day:

| Color       | Hex       | Meaning              |
|-------------|-----------|----------------------|
| White       | `#ffffff` | 0 members free       |
| Light green | `#C0DD97` | 1 member free        |
| Teal        | `#5DCAA5` | 2 members free       |
| Dark green  | `#0F6E56` | 3+ members free      |

- Hover over any cell to see the exact date and count in a tooltip.
- The **Legend** below each month grid shows the color scale.

**Data model:** Each member's availability is stored as its own document in a separate collection. Updating one member never touches another's data.

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

**After the spin:**
- The trip status changes to `decided`.
- The Playbook immediately becomes accessible.
- No further spinning is possible on that trip.

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

| Middleware          | File                         | What it checks                                                  |
|---------------------|------------------------------|-----------------------------------------------------------------|
| `requireAuth`       | `auth.middleware.js`         | Valid JWT in `Authorization: Bearer` header                     |
| `requireMembership` | `trip.middleware.js`         | `req.user.id` is in `trip.members[]`; attaches `req.trip`      |
| `requireCreator`    | `trip.middleware.js`         | `req.user.id === trip.creator`                                  |
| `requireDecided`    | `trip.middleware.js`         | `trip.status !== 'voting'`; returns `403` for playbook routes  |

**Composition example for the spin route:**
```
POST /api/trips/:tripId/wheel/spin
  → requireAuth        (must be logged in)
  → requireMembership  (must be in this trip)
  → requireCreator     (must be the host)
  → spinWheel controller
```

**Firebase Auth migration path:** Only `auth.middleware.js` needs to be rewritten to verify a Firebase ID token instead of a JWT. All downstream middleware and controllers are completely unaffected.

---

## 11. Frontend Page Map

| URL                             | Access          | Description                                |
|---------------------------------|-----------------|--------------------------------------------|
| `/`                             | Public          | Landing page with CTAs                     |
| `/login`                        | Public          | Login form                                 |
| `/register`                     | Public          | Registration form                          |
| `/trips`                        | Authenticated   | Trip list + create trip form               |
| `/join/:inviteCode`             | Authenticated   | Join trip via invite link                  |
| `/trips/:tripId`                | Trip member     | Dashboard: scores, destinations, members   |
| `/trips/:tripId/vote`           | Trip member     | Submit ranked vote; view live scores       |
| `/trips/:tripId/availability`   | Trip member     | Click-drag calendar heatmap                |
| `/trips/:tripId/wheel`          | Trip member*    | Wheel animation; spin button (host only)   |
| `/trips/:tripId/playbook`       | Trip member†    | Instructions + checklist                   |

\* All members can view the wheel page; only the host can trigger a spin.  
† Redirects / returns `403` until `trip.status === "decided"`.

**`<ProtectedRoute>`** wraps every authenticated route. If no token is found in `localStorage`, it redirects to `/login`, preserving the originally requested path so the user is returned there after login.

---

## 12. Codebase Walkthrough

### Adding a new API endpoint

1. **Create / update the Mongoose model** in `server/models/` if new fields are needed.
2. **Write the controller function** in `server/controllers/`. Always use `async/await` + `try/catch` with `next(err)`.
3. **Add the route** in the appropriate `server/routes/` file, composing the correct middleware chain.
4. **Mount the router** in `server/app.js`.
5. **Add the API call function** in the appropriate `client/src/api/*.api.js` file.
6. **Use it in a component or page** by calling that function — never call axios directly from a component.

### Adding a new page

1. Create `client/src/pages/MyPage.jsx`.
2. Import and add a `<Route>` in `client/src/App.jsx`, wrapping with `<ProtectedRoute>` if auth is required.
3. Add any necessary API call functions to `client/src/api/`.

### Middleware composition

Middleware is applied **left-to-right** on the route. Each middleware calls `next()` to continue or `res.status(xxx).json(...)` to short-circuit.

```js
// Example: only authenticated trip members can call this
router.get('/something', requireAuth, requireMembership, myController);

// Example: only the trip creator can call this
router.patch('/something', requireAuth, requireMembership, requireCreator, myController);
```

---

## 13. Deployment Notes

### Server (Node/Express)

1. Set `NODE_ENV=production` in your environment.
2. Use a process manager (e.g., PM2): `pm2 start server.js`.
3. Set `CLIENT_ORIGIN` to your production frontend domain (e.g., `https://tripcrew.example.com`).
4. Use MongoDB Atlas or a managed MongoDB provider.
5. Store `JWT_SECRET` and `MONGODB_URI` as environment variables in your hosting platform — **never commit `.env` to source control**.

### Client (React/Vite)

1. Set `VITE_API_BASE_URL` to your production API URL (e.g., `https://api.tripcrew.example.com/api`).
2. Run `npm run build` to produce `client/dist/`.
3. Serve `client/dist/` with any static host (Vercel, Netlify, Nginx, etc.).
4. Configure the host to serve `index.html` for all routes (SPA fallback).

### Nginx SPA fallback example

```nginx
location / {
  root /var/www/tripcrew/dist;
  try_files $uri $uri/ /index.html;
}
```

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
- The trip status is still `"voting"`. The playbook unlocks only after the winning destination is decided (via wheel spin or when status is manually advanced).

### `Failed to load` on the heatmap with no data
- If no member has submitted availability yet, the heatmap API returns `{}` (an empty object), which is the correct response. The calendar grid renders all cells as white.

### Smoke tests fail with `MODULE_NOT_FOUND`
- Always run smoke tests from the `server/` directory:
  ```powershell
  cd "D:\Projects\TripCrew Planner\server"
  node smoke/auth.smoke.js
  ```

### `passwordHash` appears in API response
- The `User` model uses `select: false` on `passwordHash`. If you see it in a response, a query is explicitly selecting it (e.g., `.select('+passwordHash')`), which is intentional only during login. The `toSafeJSON()` method never includes it.
