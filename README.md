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
- **Persistence:** **MongoDB via Mongoose** (`server/src/models`). The server requires a reachable
  `MONGODB_URI` and refuses to start without it — no file-backed fallback.

## Quick start

```bash
cp .env.example server/.env   # then set MONGODB_URI in server/.env (required)
npm install          # installs both workspaces
npm run seed         # (optional) seeds demo data — happens automatically on first run
npm run dev          # starts server (:5001) + client (:5173) together
```

Open http://localhost:5173

> Note: the backend runs on **:5001** because macOS AirPlay Receiver occupies :5000.
> The Vite dev server proxies `/api` to :5001, so no environment config is required.

### Demo accounts

| Role     | Phone       | Password  |
| -------- | ----------- | --------- |
| Customer | 01700000000 | pass1234  |
| Provider | 01800000001 | pass1234  |
| Admin    | 01900000000 | admin1234 |

Accounts are unique by **phone and email** (case-insensitive) — duplicate sign-ups are rejected.

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
| --------- | ------------ | -------- | ------ | ----- | --------- |
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
    │   ├── models/            # mongoose schemas (User, Provider, ServiceRequest)
    │   ├── repo/              # MongoDB repository layer
    │   ├── services/          # matchingEngine, seedData, seed
    │   ├── controllers/       # auth, request, match, provider
    │   ├── routes/            # auth, requests, providers, public
    │   ├── middleware/        # auth, errorHandler
    │   └── utils/
    ├── test/                  # matching engine unit tests
    └── data/                  # file-backed store (git-ignored)
```

## Super Admin (full-site control)

`/admin` — protected by an `admin` role. The seeded admin can:

- **Overview**: platform stats (customers, providers, requests, revenue).
- **Users**: list **both** customers and provider accounts; edit name/phone/email/role, or delete an account (and its provider profile).
- **Providers**: edit business info/rating, view services, and **activate/deactivate** providers.
- **Requests**: review every request across the platform with status and contact details.

## Design system

Applied from the `ui-ux-pro-max` skill (verified match: _Home Services (Plumber/Electrician)_) —
see `design-system/servio/MASTER.md`.

- **Trust-blue palette** (`#1E40AF`) + **safety-orange** CTAs (`#EA580C`), soft-blue background.
- **Poppins** headings + **Open Sans** body.
- Trust & Authority landing pattern, WCAG focus states, `prefers-reduced-motion`, 44px touch targets.

## Extra features (bonuses from the brief)

- **Customer notifications** — bell dropdown in the navbar driven by each request's timeline.
- **Automatic invoice** — computed summary (base + 6% fee + 5% VAT) shown on completed jobs.
- **Auto-reschedule** — a rejected/cancelled job can be re-matched, excluding the previous provider.
- **Profile & Settings** (`/settings`) — customers edit name/email/location; providers edit business info,
  services & prices and toggle their 7-day work schedule.
- **Image upload** — optional photo on a service request.

## Definition of done (MVP) — all met

- [x] Customer selects a service, completes the request wizard and submits
- [x] System returns ranked provider matches with a visible score breakdown
- [x] Customer confirms a provider → slot locked, no double-booking possible
- [x] Customer sees a live status tracker (Requested → … → Completed)
- [x] Provider dashboard lists incoming requests, accepts/rejects, updates status
- [x] Urgency level visibly changes matching priority/weights
- [x] Profile & settings for both customer and provider
- [x] Fully responsive, cohesive design
- [x] Realistic, demo-ready seed data (Rahim Electronics & Dhanmondi AC-repair scenario)

## Code quality

- ESLint flat config (`eslint.config.js`) + Prettier (`.prettierrc`) — `npm run lint` and `npm run format`.
- Backend logic is isolated in `services/` and unit-tested (`npm test`).
- Data layer is backed by **MongoDB** through the Mongoose models in `server/src/models`; the
  connection string is read from `MONGODB_URI` in `server/.env`.

```

```
