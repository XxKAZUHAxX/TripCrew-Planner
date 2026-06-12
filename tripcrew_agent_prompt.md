# TripCrew — Full-Stack Agent Build Prompt

## Your Role & Mandate

You are a senior full-stack engineer and technical architect. You have been handed a product brief and a tech stack. Your job is **NOT** to immediately write code. Your job is to first produce a complete, implementation-ready technical plan — then, and only then, proceed to build.

This two-phase discipline is non-negotiable. A rushed plan leads to schema refactors mid-build, broken state logic, and auth bugs discovered at the worst time. Take the planning phase seriously. Every decision you make in planning must be justified.

---

## The Product: TripCrew

**TripCrew** is a group trip planning web application. Friends and family create a trip, invite others via a shareable link, propose destinations and activities, vote on them, and coordinate logistics once a winner is decided. It is meant to be fun, social, interactive, and genuinely useful — solving the real-world problem of group trip indecision.

---

## Tech Stack

| Layer    | Technology                                   |
| -------- | -------------------------------------------- |
| Frontend | React (Vite), Bootstrap 5                    |
| Backend  | Node.js, Express.js                          |
| Database | MongoDB with Mongoose ODM                    |
| Auth     | JWT (JSON Web Tokens) + bcrypt               |
| Extras   | nanoid (invite codes), date-fns (date logic) |

> **Future-proofing note:** The architecture should be designed so that Firebase Auth can replace the custom JWT implementation with minimal refactoring later. Keep auth logic in its own middleware module.

---

## Domain Rules (Pre-Resolved — Do Not Re-Decide)

These rules close ambiguities that several features silently depend on. Treat them as fixed requirements, not open questions. If you deviate, justify it explicitly in the plan.

- **Vote scoring (Borda count):** Each member submits one ranked array of destination ObjectIds. For a trip with `N` proposed destinations, a member's 1st choice earns `N` points, 2nd earns `N-1`, … last earns `1`. Unranked destinations earn `0`. A destination's score is the sum across all members' votes. The "live point scores" on the dashboard are these sums.
- **Tie / deadlock condition:** A deadlock exists when the two highest-scoring destinations have an **equal total score**, OR when fewer than 50% of trip members have submitted a vote and the `votingDeadline` has passed. Only then may the Chaos Button (Wheel of Destiny) be enabled. The Wheel's slices are the top destinations involved in the tie (and, if fewer than 2, the top 2 by score).
- **Voting deadline:** Trips have an explicit `votingDeadline` (Date). It is the single source of truth for "The Ghost" badge and the deadlock-by-timeout rule above.
- **Vote-change tracking:** The `votes` document must persist a `changeCount` (Number) that increments on every re-submission of a member's ranking. This is the sole input for "The Overthinker" badge.
- **First voter:** The `votes` document's creation `timestamp` determines "The Hype Machine" (earliest timestamp for the trip).
- **Timezone policy:** All dates are stored and compared in **UTC**. Heatmap keys are `YYYY-MM-DD` strings derived in UTC. "Within 24 hours" comparisons use UTC `Date` math via `date-fns`.
- **Invite trust model:** Anyone holding a valid `inviteCode` may join the trip. Codes do not expire by default, but the schema must include a boolean `inviteActive` flag (default `true`) so the creator can revoke a link without redesign.
- **No realtime layer:** The app is **refresh/poll-on-load**, not socket-based. Vote tallies, the heatmap, and archetype badges are recomputed when the relevant page loads or after a mutating action returns. State this assumption in the frontend plan.
- **Markdown safety:** Playbook instructions are user-authored Markdown rendered in the browser. The rendered output **must be sanitized** (e.g., `dompurify` on the client or a server-side sanitizer) to prevent stored XSS. Include the sanitization step in the plan.

---

## Phase 1: Planning (Complete This Before Writing Any Code)

You must produce each of the following planning artifacts in full before writing implementation code. Each artifact must be specific — no vague statements like "we will store this in MongoDB." Name the collection, name the fields, name the types.

---

### 1.1 — Core Data Architecture

Design the complete Mongoose schema for every collection in the application. For each schema, specify:

- Every field name, Mongoose type, required/optional, and default value
- All `ref` relationships between collections
- Any indexes that should be created (e.g., `inviteCode` must be unique and indexed)
- Whether any fields should use embedded sub-documents vs. references to separate collections, and justify your choice

**Collections to design:**

- `users` — authentication credentials, profile info, badge/archetype array
- `trips` — title, creator, members, invite code, `inviteActive` flag, status enum, trip dates, `votingDeadline`, winning destination ref
- `destinations` — name, description, proposedBy, tripId, budget tier
- `votes` — tripId, userId, ranked array of destination ObjectIds, `changeCount`, timestamp
- `availability` — (see Feature 2 for schema decisions — you must design this here)
- `playbook` — (see Feature 4 for schema decisions — you must design this here)

---

### 1.2 — Express API Route Map

List every API route the application requires. For each route, specify:

- HTTP method and path
- Auth required? (boolean)
- Trip membership required? (must be a member of that specific trip)
- Creator-only? (only the trip creator can call this)
- A one-line description of what it does
- The expected request body shape (if POST/PATCH)
- The expected response shape

Organize routes into these groups: Auth, Trips, Destinations, Votes, Availability, Wheel of Destiny, Archetypes, Playbook.

---

### 1.3 — Auth & Authorization Strategy

Describe exactly how authorization works across the application:

- How JWT tokens are issued (payload shape, expiry)
- How the Express middleware extracts and validates the token
- How the middleware verifies that a user is a **member** of a specific trip (not just authenticated)
- How **creator-only** permissions are enforced for actions like triggering the Wheel or editing the Playbook
- Where these middleware functions live in the file structure and how they are composed on routes

---

### 1.4 — Frontend Page & Component Map

List every React page (route) and the key components it is composed of. For each page, specify:

- The React Router path
- Who can access it (public, authenticated, trip member only)
- The top-level state it owns and manages
- Which API calls it makes on mount and on user interaction
- Key child components and what props they receive

Pages to plan: Landing/Home, Auth (Login/Register), Trip Dashboard, Invite/Join, Vote Page, Availability Heatmap, Wheel of Destiny (modal or page), Trip Playbook.

---

### 1.5 — Feature Deep-Dives (Plan Each Feature Thoroughly)

For each of the four special features below, produce a dedicated planning section. Each section must answer all the sub-questions listed. This is where most implementation bugs are born — be exhaustive.

---

#### Feature 1: The Deadlock Breaker — Wheel of Destiny

**What it does:** When a vote is tied or the group is deadlocked, the trip creator can hit a "Chaos Button" that launches a spinning wheel. The wheel's slices are the top-voted destinations/activities. It spins with animation and lands on a winner. The outcome finalizes the trip destination.

**Planning questions you must answer before writing code:**

**React State & Animation:**

- What pieces of state does the Wheel component own? List every `useState` variable, its type, and its initial value.
- How do you determine the final winning slice _before_ the animation starts, so the wheel always lands correctly (deterministic winner prevents visual bugs where the wheel visually lands on slice A but the code declares slice B the winner)?
- Describe the exact CSS or canvas approach for the wheel rotation animation. What CSS property drives the spin? How do you calculate the target rotation degrees from the predetermined winner index?
- How does the component signal "spin complete" so the UI can show the celebratory state and trigger the API call?

**Data Flow:**

- What API call is made when the spin completes? Specify the route, method, and payload.
- How does this update the `trips` document in MongoDB? What fields change and to what values?
- After the wheel lands, the Playbook should automatically become accessible. How does the trip status change trigger this unlock? Define the `status` enum values for the Trip schema (e.g., `voting`, `decided`, `archived`) and what transitions are valid.

**Host-Only Permission:**

- The "Chaos Button" must only be visible/usable by the trip creator. How is this enforced on both the frontend (conditional render) and the backend (middleware check)?

---

#### Feature 2: The "When Free?" Availability Heatmap

**What it does:** Before voting on _where_ to go, members settle on _when_ they are available. Each member clicks/drags dates on a calendar grid to mark their free days. The UI overlays all members' inputs as a heatmap — the more members free on a date, the darker the cell.

**Planning questions you must answer before writing code:**

**MongoDB Schema Design (this is the critical decision):**

- Evaluate three storage approaches and select one with full justification:
    - **Option A:** Store availability as an array of ISO date strings on the `users` collection, scoped per tripId.
    - **Option B:** Store availability as an array of ISO date strings in a sub-document embedded in the `trips` collection (e.g., `trip.availability: [{ userId, dates: [...] }]`).
    - **Option C:** A separate `availability` collection with documents containing `tripId`, `userId`, and `dates: [ISOString]`.
- Justify your chosen approach in terms of: query efficiency, ease of aggregation, document size limits (MongoDB's 16MB document cap), and how straightforward it is to update one member's availability without touching others'.

**Aggregation Logic:**

- Write the full MongoDB aggregation pipeline (or equivalent Mongoose query) that takes a `tripId` and returns an object shaped as `{ "2025-07-04": 3, "2025-07-05": 5, "2025-07-06": 2 }` — where each key is a date string and each value is the count of members available on that date. This pipeline must be fully specified before any code is written.

**React Component Design:**

- How is the calendar grid rendered? A 7-column CSS grid of date cells covering a configurable month range.
- How does click-and-drag selection work? What event handlers are needed (`onMouseDown`, `onMouseEnter`, `onMouseUp`)? What state tracks the current drag selection?
- How are heatmap colors calculated from the count data? Define the color scale (e.g., 0 members = white, 1 = light green `#C0DD97`, 2 = `#5DCAA5`, 3+ = `#0F6E56`) and write the function that maps a count to a CSS color value.
- How does a member save their selection? Describe the debounce or explicit save strategy.

---

#### Feature 3: Automatic Group Archetype Badges

**What it does:** The system automatically assigns funny role badges to members on the trip dashboard based on their behavior. Badges are re-evaluated each time the dashboard loads.

**Planning questions you must answer before writing code:**

**Architecture Decision:**

- Evaluate two approaches and select one with justification:
    - **Option A — Computed on-the-fly:** Each time the trip dashboard is loaded, an Express endpoint runs MongoDB Aggregation Pipelines to evaluate every member against every archetype rule and returns the results. Badges are never persisted.
    - **Option B — Stored on the User/Trip schema:** Badge computation runs at key events (vote submitted, destination proposed, deadline approached) and the result is stored as an array on either the `users` collection or embedded in the trip's members array. The dashboard just reads the stored value.
- Justify your choice. Consider: how stale can a badge be? Is it acceptable for "The Ghost" badge to only appear when someone loads the dashboard, or must it appear in real-time? Does storing badges add meaningful complexity?

**Archetype Definitions (specify all of these precisely):**
For each archetype, write the exact evaluation logic as a MongoDB aggregation condition or a JavaScript function operating on fetched data:

- **The Dictator** — Has proposed more than 5 destinations for this trip.
- **The Ghost** — Has cast zero votes AND the trip voting deadline is within 24 hours.
- **The Accountant** — All destinations proposed by this user have a `budgetTier` of `"low"` (minimum 2 proposals to qualify).
- **The Overthinker** _(bonus archetype)_ — Has changed their vote ranking more than 3 times.
- **The Hype Machine** _(bonus archetype)_ — Was the first to cast a vote for this trip.

**Frontend Display:**

- Where on the Trip Dashboard do badges appear? Describe the UI placement (e.g., next to member avatar in the members list).
- How is the badge styled? Define the visual treatment (color, icon, tooltip with the funny description).
- Should a member see their own badge? Justify this UX decision.

---

#### Feature 4: The Trip Playbook & Destination Hub

**What it does:** Once a destination is finalized (via vote or Wheel of Destiny), the Playbook unlocks as the central coordination hub. It shows the winning destination, host-editable instructions (meeting points, protocols), and a shared checklist where each member tracks their own preparation tasks.

**Planning questions you must answer before writing code:**

**Database Design (two decisions to make):**

_Decision 1 — Instructions storage:_

- Evaluate and choose between:
    - **Option A:** Store `instructions` as a Markdown string field directly on the `trips` document.
    - **Option B:** Create a separate `playbooks` collection with a one-to-one relationship to `trips`.
- Justify based on: document size concerns, query simplicity, and whether playbook data will ever need to be queried independently of the trip.

_Decision 2 — Checklist storage:_

- The checklist has two layers: a shared list of task _templates_ visible to all (e.g., "Book flights"), and each member's individual _completion state_ for each task.
- Design the schema that handles both layers. Specify whether task completion state is stored as an embedded array in the trip document, a separate `checklist` collection, or something else. Justify your choice.
- Every member has their own checked/unchecked state per task. How is this modeled?

**Authorization Logic:**

- The Playbook must only be visible to authenticated members of that specific trip. Describe exactly how the Express middleware chain verifies this (token → user → trip membership check).
- Only the trip creator can PATCH the instructions field. How is the creator check implemented in the route handler?
- Any member can PATCH their own checklist completion status. How does the route ensure a member can only update _their own_ completion state and not another member's?

**Unlock Logic:**

- The Playbook route/page should return a `403` or redirect if the trip `status` is still `voting`. Describe where this check lives — in the Express route, in a middleware, or in the React component's routing guard.

---

### 1.6 — File & Folder Structure

Produce the complete file tree for the project. Every file that will be created must appear in this tree. No placeholders like `...more files`. If it needs to exist, list it.

The structure must clearly separate:

```
tripcrew/
├── client/          (React Vite app)
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── api/     (Axios instance + API call functions)
│   │   └── utils/
└── server/          (Express app)
    ├── routes/
    ├── controllers/
    ├── models/
    ├── middleware/
    └── utils/
```

---

### 1.7 — Build Sequence & Dependency Order

List the implementation steps in the exact order they should be built, grouped into milestones. Each step must be one atomic, testable unit of work. Steps that depend on a previous step being complete must be sequenced correctly. No step should require something that hasn't been built yet.

Example format:

- **Milestone 1: Foundation** — Project scaffold, env config, DB connection, base Express server
- **Milestone 2: Auth** — User model, register/login routes, JWT middleware
- **Milestone 3: Trips Core** — Trip model, create/join/fetch routes, invite code generation
- _(continue for all milestones through Playbook)_

---

## Phase 2: Implementation

Only after completing all Phase 1 planning artifacts above, proceed to implementation. Follow these rules during implementation:

**Code quality standards:**

- Every Express route must use `async/await` with `try/catch`. No unhandled promise rejections.
- Every Mongoose model must be in its own file in `server/models/`.
- Auth middleware must be imported and applied — never inline JWT verification in a route handler.
- React components must not make API calls directly. All API calls live in `src/api/` as named async functions. Components call those functions.
- Use `react-router-dom` v6 for routing. Protect private routes with a `<ProtectedRoute>` wrapper component.
- Environment variables: all secrets (JWT secret, MongoDB URI) live in a `.env` file. Provide a `.env.example` with all required keys listed (no values).
- User-authored Markdown (Playbook instructions) must be sanitized before rendering. Never use `dangerouslySetInnerHTML` with unsanitized content.
- After each milestone, perform a manual smoke test of that milestone's deliverable (e.g., hit the new route, render the new page) and note the result before committing. "Testable unit of work" means each step can be exercised in isolation.

**Git & Version Control Protocol (Non-Negotiable):**

- _Atomic Commits:_ You must maintain a clean, incremental local project history. Do not write large chunks of the application and commit them all at once. Make local atomic commits immediately after completing a single unit of work (e.g., creating a single Mongoose model, adding an Express route file, setting up a React context provider, or finishing a specific code refactor).
- _No Remote Pushes:_ Do NOT attempt to run `git push` or interact with remote repositories at any point during your iteration loop. The user will handle pushing the entire local history to GitHub at the end of the run. Your only responsibility is local staging and committing.
- _Explanatory Commit Messages:_ Every commit message must be clear, descriptive, and explain _what_ was added/changed and _why_. Use the conventional commit format (e.g., `feat: add availability heatmap schema and aggregation query`, `refactor: move JWT validation into standalone auth middleware`, or `fix: resolve deterministic winner calculation bug in wheel state`).
- _Iterative Check-ins:_ Before moving from one milestone in your build sequence to the next, confirm that all current code is locally committed and that your working directory (`git status`) is completely clean.

**Do not:**

- Skip any part of the planning output when transitioning to code.
- Write a route before its corresponding Mongoose model exists.
- Write a React page before its API functions are defined.
- Hard-code any user IDs, trip IDs, or secrets.

---

## Deliverables Checklist

When complete, the agent must confirm each of the following exists and works:

- [ ] User can register and log in; JWT is stored client-side and sent with requests
- [ ] User can create a trip and receive a shareable invite link with a unique code
- [ ] Any user with the invite link can join the trip
- [ ] Members can propose destinations with name, description, and budget tier
- [ ] Members can submit a ranked vote across all proposed destinations
- [ ] Vote tally is visible on the dashboard with live point scores (Borda count)
- [ ] Trip creator can trigger the Wheel of Destiny when a tie or deadlock exists (per the defined deadlock condition)
- [ ] Wheel spins with animation and deterministically lands on the winner
- [ ] Winning destination is saved to the trip document and status changes to `decided`
- [ ] Members can mark their available dates on the calendar heatmap
- [ ] Heatmap correctly overlays all members' availability with color intensity
- [ ] Archetype badges appear on the trip dashboard for qualifying members
- [ ] Playbook page is locked (`403`) until a destination is decided
- [ ] Trip creator can write/edit Playbook instructions (Markdown rendered)
- [ ] Playbook Markdown is sanitized before rendering (no stored XSS)
- [ ] All members can view the Playbook and check off their own checklist tasks
- [ ] All routes are protected by appropriate auth and membership middleware

---

## Final Instruction to the Agent

Read this entire prompt before producing any output. Your first output must be the complete Phase 1 planning document. Only after presenting the full plan — and receiving no objections — should you begin writing code. If anything in the brief is ambiguous, state your assumption explicitly in the planning document and proceed. Do not ask clarifying questions; make a reasonable decision and document it.

The quality of the plan determines the quality of the code. Plan like an architect. Build like an engineer.
