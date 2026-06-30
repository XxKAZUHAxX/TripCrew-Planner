# TripCrew

Group trip planning web app. Friends create a trip, invite via link, propose destinations, vote (Borda count), break deadlocks with the Wheel of Destiny, settle on dates with an availability heatmap, earn funny archetype badges, and coordinate via a Trip Playbook.

## Stack

- **Frontend:** React (Vite) + TypeScript, Tailwind CSS v4 + shadcn-style UI
- **Backend:** Node.js + Express + TypeScript
- **Database:** MongoDB + Mongoose
- **Auth:** JWT + bcrypt
- **Shared:** `@tripcrew/shared` — type-only domain & API contracts
- **Tooling:** Vitest, ESLint, Prettier

## Project layout

```
client/   React Vite app
server/   Express API
```

## Getting started

### Server

```bash
cd server
cp .env.example .env   # fill in values
npm install
npm run dev
```

### Client

```bash
cd client
cp .env.example .env   # fill in values
npm install
npm run dev
```

## Environment variables

See `server/.env.example` and `client/.env.example`.
