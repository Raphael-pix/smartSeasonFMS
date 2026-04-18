# 🌱 SmartSeason Field Monitoring System — Backend API

A production-quality backend for monitoring agricultural fields across growing seasons. Built for use by agricultural coordinators and field agents in Kenya, including environments with low bandwidth and intermittent connectivity.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Tech Stack Justification](#3-tech-stack-justification)
4. [Project Structure](#4-project-structure)
5. [Setup Instructions](#5-setup-instructions)
6. [Environment Variables](#6-environment-variables)
7. [Database Design](#7-database-design)
8. [Field Status Logic](#8-field-status-logic)
9. [Redis Caching Strategy](#9-redis-caching-strategy)
10. [Background Jobs](#10-background-jobs)
11. [RBAC & Security Design](#11-rbac--security-design)
12. [Supabase Integration](#12-supabase-integration)
13. [API Documentation](#13-api-documentation)
14. [Assumptions Made](#14-assumptions-made)
15. [Trade-offs and Design Decisions](#15-trade-offs-and-design-decisions)
16. [Future Improvements](#16-future-improvements)

---

## 1. Project Overview

SmartSeason allows:

- **Admins (Coordinators)** to create fields, assign them to agents, and monitor progress across all fields via an analytics dashboard.
- **Agents (Field Workers)** to view their assigned fields and submit timestamped observations (stage, notes, photos) directly from the field.

The system is designed around three core realities of agricultural work in Kenya:

- **Offline-first submissions** — agents may be in areas with no connectivity and submit updates hours later.
- **Low-bandwidth responses** — API responses are minimal, paginated, and never over-fetched.
- **Dynamic field health** — "Is this field at risk?" is a computed question, not a stored flag, so it's always accurate.

---

## 2. Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│                    NestJS API Server                   │
│                                                        │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐   │
│  │  Auth    │  │  Fields  │  │     Dashboard      │   │
│  │  Guard   │  │  Module  │  │     Module         │   │
│  └────┬─────┘  └────┬─────┘  └────────┬──────────┘   │
│       │              │                  │              │
│  ┌────▼──────────────▼──────────────────▼──────────┐  │
│  │               PrismaService (global)             │  │
│  └────────────────────┬─────────────────────────────┘  │
│                        │                               │
│  ┌─────────────────────▼──────────────┐               │
│  │         CacheService (global)       │               │
│  │         ioredis ↔ Redis            │               │
│  └────────────────────────────────────┘               │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │   BullMQ Workers (Jobs)                          │ │
│  │   ├── FieldStatusProcessor (every 10 min)        │ │
│  │   └── DashboardProcessor   (every  5 min)        │ │
│  └──────────────────────────────────────────────────┘ │
└──────────────────────┬─────────────────────────────────┘
                        │
         ┌──────────────┴──────────────┐
         │                             │
    ┌────▼─────┐               ┌───────▼──────┐
    │ Supabase  │               │   Supabase   │
    │ PostgreSQL│               │   Storage    │
    │ (Prisma)  │               │ (field imgs) │
    └──────────┘               └──────────────┘
```

**Request lifecycle:**

1. Request hits NestJS — `AuthGuard` verifies Supabase JWT, loads user from DB, attaches to `request.user`.
2. `RolesGuard` checks `@Roles()` decorator against `request.user.role`.
3. Controller delegates to Service. Service reads cache first, falls back to Prisma.
4. On writes, cache keys are invalidated immediately. BullMQ workers proactively re-warm the cache on a schedule.

---

## 3. Tech Stack Justification

| Technology                  | Choice Rationale                                                                                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **NestJS**                  | Opinionated structure enforces separation of concerns. Decorators, DI, and modular architecture make the codebase easy to onboard and extend. Strong TypeScript support.        |
| **PostgreSQL via Supabase** | Managed Postgres with built-in auth, storage, and RLS. Eliminates infrastructure overhead. Free tier sufficient for pilot; scales horizontally.                                 |
| **Prisma v7**               | Type-safe ORM with excellent DX. Schema-first migrations, auto-generated types used directly in service layer. `PrismaService` as injectable class fits NestJS DI naturally.    |
| **Supabase Auth**           | JWT-based auth out of the box. Handles password reset, sessions, and OAuth without custom auth infrastructure. JWT verified server-side using `supabase.auth.getUser()`.        |
| **Redis + ioredis**         | Used for two purposes: BullMQ queue backend and application-level caching. ioredis is the most battle-tested Redis client for Node.js — supports cluster, retry, and keepalive. |
| **BullMQ**                  | Redis-backed job queue. Repeatable jobs with cron expressions, automatic retries with exponential backoff, and a monitoring UI via bull-board.                                  |
| **class-validator**         | Declarative DTO validation. `ValidationPipe` with `whitelist: true` prevents mass assignment attacks automatically.                                                             |
| **Supabase Storage**        | S3-compatible file storage co-located with the database. Eliminates a third-party service dependency.                                                                           |

---

## 4. Project Structure

```
src/
├── main.ts                        # Bootstrap, Swagger, global pipes
├── app.module.ts                  # Root module
├── config/
│   └── configuration.ts           # Typed env config (no process.env leakage)
├── prisma/
│   ├── prisma.service.ts          # Injectable PrismaClient wrapper
│   └── prisma.module.ts           # Global module
├── lib/                           # (removed — replaced by PrismaModule)
├── auth/
│   ├── auth.module.ts
│   ├── guards/
│   │   ├── auth.guard.ts          # Supabase JWT verification
│   │   └── roles.guard.ts         # RBAC enforcement
│   ├── decorators/
│   │   ├── public.decorator.ts    # @Public() — bypasses auth
│   │   ├── roles.decorator.ts     # @Roles(Role.ADMIN)
│   │   └── current-user.decorator.ts  # @CurrentUser()
│   └── types/
│       └── request-user.type.ts
├── users/
│   ├── users.module.ts
│   ├── users.service.ts
│   ├── users.controller.ts
│   └── dto/update-user.dto.ts
├── fields/
│   ├── fields.module.ts
│   ├── fields.service.ts          # Status computation lives here
│   ├── fields.controller.ts
│   ├── types/field-status.type.ts # FieldStatus enum (NOT in schema)
│   └── dto/
│       ├── create-field.dto.ts
│       ├── update-field.dto.ts
│       └── query-fields.dto.ts
├── updates/
│   ├── updates.module.ts
│   ├── updates.service.ts         # Offline-tolerant, syncs lastUpdatedAt
│   ├── updates.controller.ts
│   └── dto/
│       ├── create-update.dto.ts
│       └── query-updates.dto.ts
├── images/
│   ├── images.module.ts
│   ├── images.service.ts          # Supabase Storage upload
│   └── images.controller.ts
├── dashboard/
│   ├── dashboard.module.ts
│   ├── dashboard.service.ts       # Aggregates, cached
│   └── dashboard.controller.ts
├── cache/
│   ├── cache.module.ts            # Global Redis provider
│   └── cache.service.ts           # Namespaced keys + invalidation helpers
└── jobs/
    ├── jobs.module.ts
    ├── jobs.constants.ts           # Queue/job name constants
    ├── jobs.scheduler.ts           # Enqueues repeatable jobs on boot
    └── processors/
        ├── field-status.processor.ts
        └── dashboard.processor.ts
```

---

## 5. Setup Instructions

### Prerequisites

- Node.js ≥ 20
- pnpm (or npm/yarn)
- A Supabase project (free tier works)
- Redis (local via Docker, or a managed instance like Upstash)

### Step 1 — Clone and install

```bash
git clone https://github.com/your-org/smartseason-api.git
cd smartseason-api
pnpm install
```

### Step 2 — Configure environment

```bash
cp .env.example .env
```

Fill in all values in `.env`. See [Environment Variables](#6-environment-variables) for details.

### Step 3 — Run Redis locally (optional)

```bash
docker run -d -p 6379:6379 --name smartseason-redis redis:7-alpine
```

### Step 4 — Run database migrations

```bash
pnpm db:generate   # generates Prisma client
pnpm db:migrate    # applies migrations to Supabase PostgreSQL
```

### Step 5 — Run Supabase SQL setup

In your Supabase project → **SQL Editor**, paste and run the contents of:

```
supabase/migrations/001_setup_trigger_and_rls.sql
```

This creates the auth trigger and all RLS policies.

### Step 6 — Create Supabase Storage bucket

In your Supabase project → **Storage** → **New bucket**:

- Name: `field-images`
- Public: ✅ (or use signed URLs — see [Trade-offs](#15-trade-offs-and-design-decisions))

### Step 7 — Start the server

```bash
# Development (watch mode)
pnpm start:dev

# Production
pnpm build && pnpm start:prod
```

API available at: `http://localhost:3000/api/v1`
Swagger UI at: `http://localhost:3000/api/docs`

---

## 6. Environment Variables

| Variable                    | Description                                 | Example                           |
| --------------------------- | ------------------------------------------- | --------------------------------- |
| `NODE_ENV`                  | Environment                                 | `development`                     |
| `PORT`                      | HTTP port                                   | `3000`                            |
| `DATABASE_URL`              | Supabase transaction pooler URL             | `postgresql://...?pgbouncer=true` |
| `DIRECT_URL`                | Supabase direct connection URL (migrations) | `postgresql://...`                |
| `SUPABASE_URL`              | Your Supabase project URL                   | `https://xyz.supabase.co`         |
| `SUPABASE_ANON_KEY`         | Supabase anon/public key                    | `eyJ...`                          |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only)     | `eyJ...`                          |
| `SUPABASE_JWT_SECRET`       | JWT secret from Supabase settings           | `your-secret`                     |
| `SUPABASE_STORAGE_BUCKET`   | Storage bucket name                         | `field-images`                    |
| `REDIS_HOST`                | Redis host                                  | `localhost`                       |
| `REDIS_PORT`                | Redis port                                  | `6379`                            |
| `REDIS_PASSWORD`            | Redis password (optional)                   | ` `                               |
| `CACHE_TTL_FIELD_STATUS`    | Status cache TTL (seconds)                  | `300`                             |
| `CACHE_TTL_DASHBOARD`       | Dashboard cache TTL (seconds)               | `120`                             |
| `AT_RISK_THRESHOLD_DAYS`    | Days without update → AT_RISK               | `7`                               |
| `MAX_FILE_SIZE_MB`          | Max image upload size                       | `5`                               |
| `ALLOWED_MIME_TYPES`        | Comma-separated allowed MIME types          | `image/jpeg,image/png,image/webp` |

> ⚠️ **Never commit `.env` to version control.** The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — treat it like a database root password.

---

## 7. Database Design

### Entity Relationship Summary

```
User ──< Field (as agent)
User ──< FieldUpdate (as agent)
User ──< FieldImage (as uploader)
User ──< Field (as updatedBy)
Location >── Field (many fields per location county)
Field ──< FieldUpdate
Field ──< FieldImage
```

### Design Decisions

**`User.id` mirrors Supabase `auth.users.id`**
A PostgreSQL trigger syncs the two tables on signup. This avoids a separate lookup table and lets us use the auth UUID as the primary key everywhere.

**`Field.lastUpdatedAt` (denormalized)**
Instead of computing `MAX(observedAt)` from `FieldUpdate` on every status check, we maintain this column with a conditional update (`WHERE lastUpdatedAt IS NULL OR lastUpdatedAt < observedAt`). This is the key performance optimisation for the AT_RISK check — a single column comparison vs. a subquery across potentially millions of update rows.

**`FieldUpdate` is append-only**
No `UPDATE` or `DELETE` is permitted at the database level (no RLS policies allow it). This preserves a full immutable audit trail — critical for agricultural compliance and dispute resolution.

**`Location` is not embedded in `Field`**
Kept as a separate table so multiple fields can share a county/sub-county reference, and so GPS polygon support can be added later without schema changes to `Field`.

**`FieldImage` vs `FieldUpdate.imageUrl`**
`FieldUpdate.imageUrl` is a quick snapshot attached to a specific observation. `FieldImage` is the managed gallery — captioned, linked to uploader, and used for the cover image feature. Both exist intentionally.

---

## 8. Field Status Logic

Field status is **never stored in the database**. It is computed in `FieldsService.computeStatus()` and cached in Redis.

### Rules (evaluated in order)

```typescript
computeStatus(field): FieldStatus {
  // Rule 1: Terminal state — once harvested, always COMPLETED
  if (field.currentStage === CropStage.HARVESTED) {
    return FieldStatus.COMPLETED;
  }

  // Rule 2: Use lastUpdatedAt if available, plantingDate as fallback
  // (covers new fields that have never received an update)
  const referenceDate = field.lastUpdatedAt ?? field.plantingDate;
  const daysSinceUpdate = dayjs().diff(dayjs(referenceDate), 'day');

  // Rule 3: AT_RISK if no activity within threshold
  if (daysSinceUpdate > atRiskThresholdDays) {
    return FieldStatus.AT_RISK;
  }

  // Rule 4: Default — field is being monitored
  return FieldStatus.ACTIVE;
}
```

### Why not store it?

Storing status creates a dual-write problem: you must update status every time a `FieldUpdate` is submitted, every time a day passes, and whenever the threshold configuration changes. A computed approach means the status is always correct without synchronisation overhead.

### AT_RISK Threshold Configuration

The threshold (default: 7 days) is set via `AT_RISK_THRESHOLD_DAYS` in `.env`. Changing this value takes effect on the next cache TTL expiry or job cycle — no migration required.

---

## 9. Redis Caching Strategy

### Key Namespace Schema

```
ss:field:status:{fieldId}       → FieldStatus string, TTL: 5 min
ss:field:list:{scope}           → Paginated field list, TTL: 1 min
ss:dashboard:admin              → Admin dashboard aggregate, TTL: 2 min
ss:dashboard:agent:{agentId}    → Per-agent dashboard, TTL: 2 min
```

All keys are prefixed with `ss:` to namespace SmartSeason within a shared Redis instance.

### Invalidation Strategy

**Write-through invalidation:** Every service write operation (`create`, `update`, `archive`, field update submission) calls `CacheService.invalidateOnFieldUpdate(fieldId)` which atomically deletes:

- The field's status key
- All field list keys (`ss:field:list:*`)
- All dashboard keys (`ss:dashboard:*`)

This is intentionally aggressive — correctness over cache hit rate. For a farming context with moderate write volume, this is acceptable.

**Proactive cache warming:** BullMQ workers run every 5–10 minutes to rebuild caches before they are requested. This means most reads are served from Redis even after invalidation.

### Failure Tolerance

All `CacheService` methods wrap Redis operations in try/catch and **never throw**. A Redis outage degrades performance (cache misses → DB hits) but never breaks the API. This is critical for rural deployments where network infrastructure is unreliable.

---

## 10. Background Jobs

All jobs run via BullMQ with Redis as the queue backend.

### Queue: `field-status`

| Job                      | Trigger            | What it does                                                |
| ------------------------ | ------------------ | ----------------------------------------------------------- |
| `recompute-all-statuses` | Cron: every 10 min | Loads all active fields, recomputes status, writes to Redis |
| `recompute-field-status` | Ad-hoc (future)    | Recomputes status for a single field by ID                  |

### Queue: `dashboard`

| Job                        | Trigger           | What it does                                              |
| -------------------------- | ----------------- | --------------------------------------------------------- |
| `refresh-admin-dashboard`  | Cron: every 5 min | Rebuilds admin aggregate and writes to Redis              |
| `refresh-agent-dashboards` | Cron: every 5 min | Iterates all agents with fields, rebuilds per-agent cache |

### Job Configuration

All jobs are configured with:

- **3 retry attempts** with **exponential backoff** (5s base delay)
- **`removeOnComplete: 100`** — keeps last 100 completed jobs for monitoring
- **`jobId` deduplication** — calling `onApplicationBootstrap` multiple times (e.g., in a multi-replica deployment) won't create duplicate repeatable jobs

### Monitoring

Bull Board UI is available (in development) at `/api/queues`. Secure with `BULL_DASHBOARD_USERNAME` / `BULL_DASHBOARD_PASSWORD`.

---

## 11. RBAC & Security Design

### Roles

| Role    | Description                                                  |
| ------- | ------------------------------------------------------------ |
| `ADMIN` | Agricultural coordinator. Full read/write across all fields. |
| `AGENT` | Field worker. Read and update only their assigned fields.    |

### Guard Chain

Every protected route runs two guards in sequence:

```
Request → AuthGuard → RolesGuard → Controller
```

1. **`AuthGuard`**: Calls `supabase.auth.getUser(token)` to verify the JWT, then loads the user's `public.users` row for role and active status.
2. **`RolesGuard`**: Reads `@Roles()` metadata. If the user's role is not in the allowed list, responds with `403 Forbidden`.

Routes without `@Roles()` are accessible to any authenticated user. Routes with `@Public()` skip both guards (used for health checks only).

### Field-Level Access Control

Beyond RBAC, agents are restricted at the **data level**:

- `FieldsService.findAll()` adds `WHERE agentId = requestUser.id` for agents automatically.
- `FieldsService.findOne()` checks `field.agent.id === requestUser.id` and throws `403` if not matched.
- `UpdatesService.create()` calls `findOne()` first, inheriting the same access check.

This is defence-in-depth: even if a guard is misconfigured, the service layer enforces the boundary.

---

## 12. Supabase Integration

### Auth

- Users register via Supabase Auth (client SDK or Supabase Admin API).
- A PostgreSQL trigger (`handle_new_auth_user`) automatically creates a `public.users` row on signup.
- The NestJS `AuthGuard` calls `supabase.auth.getUser(token)` server-side to verify every request — no custom JWT parsing.
- The `SUPABASE_SERVICE_ROLE_KEY` is used **server-side only** (never exposed to clients).

### Row Level Security (RLS)

RLS policies are defined in `supabase/migrations/001_setup_trigger_and_rls.sql`. They mirror the application-layer RBAC as a second line of defence:

| Table           | Admin policy      | Agent policy                      |
| --------------- | ----------------- | --------------------------------- |
| `users`         | Full read, update | Read own row only                 |
| `fields`        | Full access       | Read assigned fields only         |
| `field_updates` | Full read         | Read/insert on assigned fields    |
| `locations`     | Full access       | Read locations of assigned fields |
| `field_images`  | Full access       | Read images of assigned fields    |

`field_updates` has **no UPDATE or DELETE RLS policy** — making the table append-only at the database level regardless of application behaviour.

### Storage

- Bucket: `field-images` (configure as public or use signed URLs)
- Storage path: `fields/{fieldId}/{uuid}.{ext}`
- File validation (MIME type + size) happens **before** the Supabase upload call.
- `ImagesService` uses the service role client to upload — this bypasses Storage RLS, which is intentional since access control is enforced at the NestJS layer first.

---

## 13. API Documentation

Swagger UI is available at:

```
http://localhost:3000/api/docs
```

> Swagger is disabled in production (`NODE_ENV=production`). Use a tool like Postman with the exported OpenAPI spec for production testing.

### Authentication in Swagger

1. Click the **Authorize** button (top right)
2. Paste your Supabase JWT in the `Bearer` field
3. All subsequent requests will include the `Authorization: Bearer <token>` header

### Endpoint Summary

| Method   | Path                              | Role  | Description                  |
| -------- | --------------------------------- | ----- | ---------------------------- |
| `GET`    | `/api/v1/users`                   | Admin | List all users               |
| `GET`    | `/api/v1/users/agents`            | Admin | List active agents           |
| `GET`    | `/api/v1/users/me`                | Any   | Own profile                  |
| `PATCH`  | `/api/v1/users/:id`               | Any\* | Update user                  |
| `GET`    | `/api/v1/fields`                  | Any   | List fields (scoped by role) |
| `POST`   | `/api/v1/fields`                  | Admin | Create field                 |
| `GET`    | `/api/v1/fields/:id`              | Any   | Get field detail             |
| `PATCH`  | `/api/v1/fields/:id`              | Admin | Update field                 |
| `DELETE` | `/api/v1/fields/:id`              | Admin | Archive field                |
| `GET`    | `/api/v1/fields/:id/updates`      | Any   | List field updates           |
| `POST`   | `/api/v1/fields/:id/updates`      | Any   | Submit field update          |
| `GET`    | `/api/v1/fields/:id/updates/:uid` | Any   | Get single update            |
| `POST`   | `/api/v1/fields/:id/images`       | Any   | Upload image                 |
| `GET`    | `/api/v1/fields/:id/images`       | Any   | List field images            |
| `DELETE` | `/api/v1/fields/:id/images/:iid`  | Any   | Delete image                 |
| `GET`    | `/api/v1/dashboard/admin`         | Admin | Admin dashboard              |
| `GET`    | `/api/v1/dashboard/agent`         | Any   | Agent dashboard              |

\*Agents can only update their own profile; role/isActive changes require Admin.

---

## 14. Assumptions Made

1. **Single-region deployment**: Redis and the API server are in the same region as the Supabase project (e.g., AWS `eu-west-1` for a Kenya deployment). Latency is the primary constraint, not distributed consistency.

2. **Agents have smartphones**: The system assumes agents submit updates via a mobile web interface or companion app that handles `observedAt` timestamping. The API accepts any valid ISO 8601 timestamp.

3. **One agent per field**: The schema supports a single `agentId` on a field. Multi-agent assignment was considered but deferred as it adds significant complexity to the access control layer.

4. **Public storage bucket**: Field images are stored in a public Supabase Storage bucket. In a production deployment with sensitive data, signed URLs should be used instead.

5. **Role promotion is an admin operation**: Agents cannot self-promote. The trigger defaults all new signups to `AGENT`. Admins are created by updating the `role` column directly or via `PATCH /users/:id`.

6. **Redis is available**: The system degrades gracefully on Redis failure (cache misses fall through to DB), but BullMQ jobs will fail to enqueue. A Redis-unavailable alert should be configured in production.

---

## 15. Trade-offs and Design Decisions

### Computed Status vs. Stored Status

**Decision**: Status is computed, not stored.
**Trade-off**: Slightly more CPU per request (offset by Redis caching), but eliminates the risk of stale status flags that don't reflect reality. In an agricultural context, an incorrect "ACTIVE" label on an AT_RISK field could mean a coordinator misses a failing crop.

### `lastUpdatedAt` Denormalization

**Decision**: Maintain `Field.lastUpdatedAt` rather than query `MAX(FieldUpdate.observedAt)`.
**Trade-off**: An additional write on every `FieldUpdate` submission. However, the conditional `updateMany` (`WHERE lastUpdatedAt < observedAt`) is idempotent and safe for concurrent offline submissions. The query savings on every status check are substantial at scale.

### Aggressive Cache Invalidation

**Decision**: Any write operation invalidates all field lists and all dashboard caches.
**Trade-off**: Lower cache hit rate on write-heavy workloads. Accepted because:

- Write volume in an agricultural system is inherently low (agents submit once or twice daily per field).
- Correctness is more important than marginal cache efficiency.
- Proactive BullMQ warming means caches are rebuilt within minutes.

### Public Storage Bucket

**Decision**: Field images are in a public bucket for simplicity.
**Trade-off**: Anyone with the URL can view an image. Acceptable for a pilot; production should use signed URLs with short expiry.

### No Real-time (WebSockets)

**Decision**: REST only, no WebSockets.
**Trade-off**: Admins see a stale dashboard until they refresh. Acceptable given the polling interval of the BullMQ refresh jobs (5 min). Adding WebSocket support via `@nestjs/websockets` is a clear future path.

---

## 16. Future Improvements

| Area                    | Improvement                                                                                                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**                | Add refresh token rotation, device fingerprinting for agent login tracking                                                                                              |
| **Offline Sync**        | Build a sync endpoint that accepts a batch of `FieldUpdate` objects with their `observedAt` timestamps — reduces round trips for agents syncing after connectivity gaps |
| **Weather Integration** | Add a BullMQ job that fetches weather data from Open-Meteo (free, no key required) for each field's GPS coordinates and stores it as a `WeatherSnapshot` table          |
| **Push Notifications**  | Alert admin when a field transitions to AT_RISK (via Firebase Cloud Messaging or Supabase Edge Functions)                                                               |
| **Multi-agent Fields**  | Replace `Field.agentId` with a `FieldAgent` join table — requires updating access control queries                                                                       |
| **Storage Signed URLs** | Replace public bucket with signed URLs (generated on read, short TTL) for sensitive field data                                                                          |
| **Rate Limiting**       | Add `@nestjs/throttler` per-IP and per-user rate limits                                                                                                                 |
| **Audit Log API**       | Expose a read-only `/audit` endpoint for compliance exports                                                                                                             |
| **Analytics**           | Integrate a time-series query for stage progression speed per crop type — useful for predicting harvest windows                                                         |
| **Multi-tenant**        | Add an `Organisation` model so the platform can serve multiple agribusiness clients from one deployment                                                                 |
