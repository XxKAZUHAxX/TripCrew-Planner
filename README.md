# TripCrew

Group trip planning web app. Friends create a trip, invite via link, propose destinations, vote (Borda count), break deadlocks with the Wheel of Destiny, settle on dates with an availability heatmap, earn funny archetype badges, and coordinate via a Trip Playbook.

## Stack

- **Frontend:** React (Vite) + Bootstrap 5
- **Backend:** Node.js + Express
- **Database:** MongoDB + Mongoose
- **Auth:** JWT + bcrypt

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
