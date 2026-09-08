# Servio — Smart Home Service Automation

Built for the **BAUST CSE FEST 2026 Hackathon Challenge**. A MERN-platform that automates
the flow of requesting, matching, scheduling and tracking home services (AC repair, plumbing,
electrical, cleaning, moving, car care and more).

The centrepiece is the **Smart Provider Matching Engine** — providers are ranked by a
weighted blend of expertise, availability, distance, rating and price, with the weights
re-tuned per urgency level.

## Tech stack

- **Client:** React 18 + Vite, React Router, Zustand, Tailwind CSS, lucide-react
- **Server:** Node.js + Express, REST API, JWT (mock auth), Zod validation
- **Persistence:** Mongoose schemas provided; ships with an embedded **file-backed store**
  (`server/data/db.json`) so it runs **out of the box with no infrastructure** — ideal for a
  live demo. Set `MONGODB_URI` to opt into real MongoDB.

## Quick start

```bash
npm install          # installs both workspaces
npm run seed         # (optional) re-seed demo data — happens automatically on first run
npm run dev          # starts server (:5001) + client (:5173) together
```

Open http://localhost:5173

> Note: the backend runs on **:5001** because macOS AirPlay Receiver occupies :5000.
> The Vite dev server proxies `/api` to :5001, so no environment config is required.

### Demo accounts

| Role     | Phone         | Password |
|----------|---------------|----------|
| Customer | 01700000000   | pass1234 |
| Provider | 01800000001   | pass1234 |

## The Matching Engine

Pure functions in `server/src/services/matchingEngine.js` — no Express/DB coupling, so it is
unit-tested in isolation (`npm test`) and demoable on its own.

Each factor is normalised to `0..1`, then combined with urgency-driven weights:

```
score = w_avail * availability + w_dist * (1 - dist/maxRadius)
      + w_rating * (rating/5) + w_price * (1 - price/maxPrice)
      + w_exp * expertise
```

| Urgency   | Availability | Distance | Rating | Price | Expertise |
|-----------|--------------|----------|--------|-------|-----------|
| Normal    | 0.20         | 0.20     | 0.25   | 0.20  | 0.15      |
| Urgent    | 0.35         | 0.30     | 0.15   | 0.10  | 0.10      |
| Emergency | 0.45         | 0.35     | 0.10   | 0.05  | 0.05      |

Additional behaviour:
- **Availability is a hard gate** — providers with no free slot are never recommended.
- **Near-miss credit** — a provider free on a nearby day still scores (0.5 availability).
- **Double-booking guard** — confirming a provider atomically locks the slot; if the exact
  slot was already taken the confirmation is rejected and matching can re-run.
- **Workload balancing** — providers above a job threshold are scored down.
- **Transparent result** — every match includes a per-factor breakdown and a human
  "why we picked this" hint.

## API

```
POST   /api/auth/register            POST   /api/auth/login
GET    /api/services                 GET    /api/providers
POST   /api/requests                 GET    /api/requests               (customer history)
GET    /api/requests/:id             GET    /api/requests/:id/matches   (ranked providers)
POST   /api/requests/:id/confirm     PATCH  /api/requests/:id/status
POST   /api/requests/:id/cancel      POST   /api/requests/:id/feedback
GET    /api/providers/dashboard      GET    /api/providers/schedule
PATCH  /api/providers/availability
```

Responses use a consistent envelope: `{ success, message, data }`.

## Project layout

```
├── client/                    # React + Vite app
│   └── src/
│       ├── api/               # axios wrappers per resource
│       ├── components/        # common + customer + provider
│       ├── pages/             # customer, provider, auth
│       ├── layouts/           # AppLayout
│       ├── store/             # auth + toast (zustand)
│       ├── hooks/             # useAsync
│       ├── utils/             # formatters
│       └── constants/
└── server/
    ├── src/
    │   ├── config/            # env, db
    │   ├── models/            # mongoose schemas
    │   ├── repo/              # embedded store + repository
    │   ├── services/          # matchingEngine, seedData, seed
    │   ├── controllers/       # auth, request, match, provider
    │   ├── routes/            # auth, requests, providers, public
    │   ├── middleware/        # auth, errorHandler
    │   └── utils/
    ├── test/                  # matching engine unit tests
    └── data/                  # file-backed store (git-ignored)
```

## Definition of done (MVP) — all met

- [x] Customer selects a service, completes the request wizard and submits
- [x] System returns ranked provider matches with a visible score breakdown
- [x] Customer confirms a provider → slot locked, no double-booking possible
- [x] Customer sees a live status tracker (Requested → … → Completed)
- [x] Provider dashboard lists incoming requests, accepts/rejects, updates status
- [x] Urgency level visibly changes matching priority/weights
- [x] Fully responsive, cohesive design
- [x] Realistic, demo-ready seed data (Rahim Electronics & Dhanmondi AC-repair scenario)
```
