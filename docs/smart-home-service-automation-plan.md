# Smart Home Service Automation — Full Build Plan
**For: BAUST CSE FEST 2026 Hackathon Challenge**
**Target stack: React (Vite) + Node.js/Express + MongoDB — MERN**
**Audience: an AI coding agent building this project end-to-end**

---

## 1. Project Summary

Build a smart service management platform that automates the flow of requesting, matching, scheduling, and tracking home services (AC repair, plumbing, electrical, cleaning, moving, car care, etc.), removing manual coordination between customers and providers.

Two user roles, one codebase:
- **Customer**: browses services, submits a request, gets auto-matched to a provider, tracks job status.
- **Provider**: sees incoming job requests, accepts/rejects, updates status, manages schedule.

The centerpiece of the system — and the primary judging criterion — is the **Smart Provider Matching Engine**. Everything else (forms, dashboards, tracking UI) exists to feed data into and surface the output of that engine. Do not let CRUD scaffolding consume more build time than the matching logic.

---

## 2. Full Feature Inventory (from challenge brief — nothing omitted)

### 2.1 Service Selection
- Categories: Appliance & Gadget Repair, Plumbing, Electrical, Cleaning & Pest Control, Home Maintenance, Moving & Shifting, Car Care & Repair, Personal Care.
- Each category maps to a set of providers with matching `serviceType`/expertise tags.

### 2.2 Service Request (customer-submitted)
Fields required:
- Service type (from category list)
- Location (text + mock lat/lng)
- Preferred date
- Preferred time window
- Urgency level (Normal / Urgent / Emergency)
- Problem details (free text)
- Optional image upload
- Contact information (name, phone)

### 2.3 Smart Provider Matching
- Mock provider database (see §5).
- Matching considers: **service type match, availability, distance, rating, price, expertise**.
- Match Score formula (weights tunable, urgency-adjusted — see §6).
- Return ranked top 3 recommended providers; customer confirms one.

### 2.4 Scheduling
- Providers have defined available time slots.
- Once a slot is booked (accepted), it is locked — no double-booking.
- System shows only genuinely available slots when matching.

### 2.5 Request Tracking
Status pipeline (customer-visible):
`Requested → Accepted → On the Way → In Progress → Completed`
(add `Rejected` / `Cancelled` as terminal side-states)

### 2.6 Provider Dashboard
- View incoming requests
- Accept / reject jobs
- View customer details for accepted jobs
- View own scheduled jobs (calendar/list)
- Update job status through the pipeline

### 2.7 Bonus Features (pick 2–3 — do not attempt all)
Priority order recommended for a hackathon:
1. **Urgent/emergency job prioritization** (cheap: reweight the match formula, queue urgent jobs first)
2. **Customer notifications** (in-app toast/feed is enough; no real SMS/email needed)
3. **Automatic rescheduling** if a provider cancels/becomes unavailable (re-run matching engine against remaining providers)
4. Provider workload balancing (penalize providers with too many active jobs in scoring)
5. Service history + ratings/feedback after completion
6. Automatic invoice generation (simple computed summary, not a PDF pipeline)

Explicitly deprioritize: real payments, real notifications/SMS integration, production auth hardening — mock these.

---

## 3. Tech Stack & Architecture

```
Frontend:  React 18 + Vite, React Router, TanStack Query (or plain fetch+hooks), 
           Zustand or Context API for lightweight global state, Tailwind CSS
Backend:   Node.js + Express, REST API, JWT auth (mock/simple)
Database:  MongoDB + Mongoose ODM
Realtime:  Optional — Socket.io for live status updates (nice-to-have, not required)
Dev tools: ESLint + Prettier, dotenv, nodemon
```

### Monorepo structure
```
smart-service-automation/
├── client/                      # React + Vite app
│   ├── src/
│   │   ├── api/                 # axios/fetch wrappers per resource
│   │   ├── components/
│   │   │   ├── common/          # Button, Card, Modal, Badge, StatusStepper...
│   │   │   ├── customer/        # ServiceSelector, RequestForm, ProviderMatchCard, TrackerTimeline
│   │   │   └── provider/        # RequestQueue, JobCard, ScheduleCalendar
│   │   ├── pages/
│   │   │   ├── customer/        # Home, NewRequest, MatchResults, TrackRequest, History
│   │   │   └── provider/        # Dashboard, JobDetail, Schedule
│   │   ├── layouts/              # CustomerLayout, ProviderLayout
│   │   ├── hooks/
│   │   ├── store/                # global state
│   │   ├── utils/                # formatters, distance calc, status labels
│   │   ├── constants/             # service categories, urgency levels, status enum
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── config/               # db.js, env.js
│   │   ├── models/                # User, Provider, ServiceRequest, Booking
│   │   ├── controllers/           # requestController, providerController, matchController, authController
│   │   ├── routes/                # /api/requests, /api/providers, /api/auth, /api/dashboard
│   │   ├── services/              # matchingEngine.js  <-- core algorithm lives here, isolated & unit-testable
│   │   ├── middleware/             # auth, errorHandler, validate
│   │   ├── utils/                  # distanceCalc, seedData
│   │   ├── app.js
│   │   └── server.js
│   ├── seed/                       # mock provider/service seed scripts
│   └── package.json
├── .env.example
└── README.md
```

**Why this structure:** matching logic is isolated in `services/matchingEngine.js` — pure functions, no Express dependency, so it's testable and demo-able in isolation ("here's our algorithm working standalone"). Controllers stay thin; they call services.

---

## 4. Data Models (Mongoose schemas)

```js
// User (base — customer or provider via role)
{
  name, phone, email, role: 'customer' | 'provider',
  location: { address, lat, lng },
  createdAt
}

// Provider (extends/references User)
{
  userId,
  businessName,
  serviceTypes: [String],        // e.g. ['AC Repair', 'Electrical']
  rating: Number,                 // 0-5
  pricePerService: { serviceType: price },
  location: { address, lat, lng },
  availability: [{ date, startTime, endTime, isBooked: Boolean }],
  activeJobCount: Number,          // for workload balancing bonus
  isActive: Boolean
}

// ServiceRequest
{
  customerId,
  serviceType,
  location: { address, lat, lng },
  preferredDate,
  preferredTimeWindow: { start, end },
  urgency: 'Normal' | 'Urgent' | 'Emergency',
  problemDetails: String,
  imageUrl: String,                // optional
  contact: { name, phone },
  status: 'Requested' | 'Accepted' | 'On the Way' | 'In Progress' | 'Completed' | 'Rejected' | 'Cancelled',
  matchedProviderId,
  candidateMatches: [{ providerId, score, breakdown }],  // top matches shown to customer
  timeline: [{ status, timestamp }],  // audit trail for tracker UI
  createdAt
}
```

---

## 5. Mock Data Requirements

- Seed 15–25 providers spread across the 8 service categories.
- Use realistic Bangladeshi context: areas like Dhanmondi, Mirpur, Gulshan, Uttara, Banani with approximate lat/lng; prices in BDT (৳); provider names in a mix of Bangla-style business names ("Rahim Electronics", "Dhaka AC Care") and generic ones.
- Vary rating (3.5–5.0), price, and availability windows so the matching algorithm has meaningful differentiation to demonstrate.
- Include at least one deliberately "best match" provider per demo scenario so the algorithm's output is obviously correct during the demo.

---

## 6. Matching Algorithm (core deliverable — build this carefully)

Normalize each factor to a 0–1 scale, then apply weighted sum:

```
score = w_availability * availabilityScore
      + w_distance     * (1 - normalizedDistance)
      + w_rating       * (rating / 5)
      + w_price        * (1 - normalizedPrice)
      + w_expertise     * expertiseMatchScore
```

- `availabilityScore`: 1 if provider has a free slot overlapping the requested window, scaled down for near-misses, 0 if unavailable.
- `normalizedDistance`: distance / maxSearchRadius, clamped 0–1 (use haversine formula on mock lat/lng).
- `expertiseMatchScore`: 1 if provider's `serviceTypes` includes exact requested type, partial credit for related categories.
- `normalizedPrice`: price / maxPriceInCategory.

**Urgency-adjusted weights** (this is what makes it "smart," not just a static formula):
| Urgency | availability | distance | rating | price | expertise |
|---|---|---|---|---|---|
| Normal | 0.20 | 0.20 | 0.25 | 0.20 | 0.15 |
| Urgent | 0.35 | 0.30 | 0.15 | 0.10 | 0.10 |
| Emergency | 0.45 | 0.35 | 0.10 | 0.05 | 0.05 |

Return top 3 providers sorted by score, with the score breakdown attached (for UI transparency — showing *why* a provider was recommended is a strong demo point).

Double-booking prevention: before finalizing a match, re-check the provider's `availability` slot `isBooked` flag inside a transaction/atomic update — reject if already taken and re-run matching against the remaining candidates.

---

## 7. API Endpoints

```
POST   /api/auth/register            
POST   /api/auth/login               

GET    /api/services                 # list categories
POST   /api/requests                  # create a new service request
GET    /api/requests/:id             # get request + status/timeline
GET    /api/requests/:id/matches     # get ranked provider matches
POST   /api/requests/:id/confirm     # customer confirms a matched provider -> locks slot
PATCH  /api/requests/:id/status      # provider updates status (accept/reject/on the way/...)
GET    /api/customers/:id/requests   # customer's request history

GET    /api/providers/:id/dashboard  # incoming + active jobs for a provider
GET    /api/providers/:id/schedule   # provider's booked slots
PATCH  /api/providers/:id/availability
```

---

## 8. UI/UX Guidelines

- **Design language**: modern, clean, card-based; generous whitespace; rounded corners (`rounded-xl`/`2xl`); soft shadows over hard borders.
- **Color system**: one primary brand color (e.g. a confident blue or teal) + semantic colors for status (blue=Requested, amber=Accepted, purple=On the Way, orange=In Progress, green=Completed, red=Rejected/Cancelled).
- **Typography**: one clean sans-serif (Inter/Manrope), clear hierarchy (headings bold, body regular, generous line-height).
- **Status Tracker**: horizontal stepper component with icons, animated active-state pulse, timestamps per step.
- **Match results**: provider cards showing rating (stars), distance, price, availability, and a short "why recommended" tag pulled from the score breakdown — not just a raw number.
- **Forms**: multi-step wizard (service → details → time/urgency → confirm) rather than one long form; progress indicator at top.
- **Provider dashboard**: table/kanban toggle for incoming requests; one-click accept/reject; status update as a dropdown or button group matching the pipeline.
- **Responsiveness**: mobile-first — most real users of this kind of app are on phones.
- **Microinteractions**: subtle hover states, loading skeletons (not spinners) for async data, toast notifications for status changes.
- **Accessibility**: sufficient color contrast, focus states on all interactive elements, semantic HTML.

Avoid generic "admin template" look — use distinct spacing rhythm, a real color identity, and illustration/icon set (lucide-react is fine) rather than default browser styling.

---

## 9. Coding Standards

- Consistent ESLint + Prettier config across client/server.
- Environment variables via `.env` (never hardcode Mongo URI/secrets).
- Controllers: thin, delegate to services; services: pure business logic, unit-testable.
- Central error-handling middleware on the backend; consistent JSON error shape `{ success, message, data }`.
- Input validation on all POST/PATCH routes (e.g. `express-validator` or `zod`).
- Meaningful commit-sized functions; JSDoc comments on the matching engine specifically since it's the algorithmic core.
- No business logic inside React components — keep components presentational, push logic into hooks/`api/` layer.

---

## 10. Build Order for the AI Agent (phased)

1. **Scaffold**: initialize `client` (Vite+React+Tailwind) and `server` (Express+Mongoose), set up `.env`, connect MongoDB, basic health-check route.
2. **Models + seed data**: build schemas, write and run seed script for providers/services (§5).
3. **Matching engine**: implement `services/matchingEngine.js` as pure functions first, test with sample inputs before wiring to routes.
4. **Request flow API**: request creation, matching endpoint, confirm endpoint, status update endpoint, double-booking guard.
5. **Customer frontend**: service selection → request wizard → match results → confirmation → tracker page.
6. **Provider frontend**: dashboard (incoming/active jobs), accept/reject, status update controls, schedule view.
7. **Polish pass**: notifications (toast feed), urgency prioritization surfaced in UI, empty/loading/error states, responsive check.
8. **Bonus feature(s)** from §2.7 if time remains.
9. **Demo data check**: verify the seeded scenario mirrors the brief's AC-repair/Dhanmondi/Saturday example so the recommended provider is obviously "Rahim Electronics"-equivalent during the live demo.

---

## 11. Definition of Done (MVP)

- [ ] Customer can select a service, fill the request wizard, submit
- [ ] System returns ranked provider matches with visible score breakdown
- [ ] Customer confirms a provider → slot locked, no double-booking possible
- [ ] Customer sees live status tracker (Requested → ... → Completed)
- [ ] Provider dashboard lists incoming requests, can accept/reject, update status
- [ ] Urgency level visibly changes matching priority/weights
- [ ] Fully responsive, cohesive visual design, no default/unstyled elements
- [ ] Seed data realistic and demo-ready
