# 🌱 SmartSeason Field Monitoring System

A backend API for monitoring agricultural fields across farms. Built for coordinators and field workers, with farm-level data isolation, offline-first data capture, and low-bandwidth optimization.


## Overview

SmartSeason manages agricultural fields across independent farms. Two roles exist:

**Admin (Farm Owner / Coordinator)** — manages a single farm, creates fields, assigns agents, views farm-wide analytics.

**Agent (Field Worker)** — belongs to one farm, views only their assigned fields, submits field updates and images.

Every request is scoped to a `farmId`. Cross-farm access is never allowed.


## Tech Stack

| Layer           | Technology              |
| --------------- | ----------------------- |
| Framework       | NestJS (TypeScript)     |
| Database        | PostgreSQL via Supabase |
| ORM             | Prisma                  |
| Auth            | Supabase Auth (JWT)     |
| File Storage    | Supabase Storage        |
| Caching         | Redis                   |
| Background Jobs | BullMQ                  |


## Setup

**1. Install dependencies**

```bash
npm install
```

**2. Configure environment**

```bash
cp .env.example .env
# Fill in your values
```

**3. Generate Prisma client**

```bash
npx prisma generate
```

**4. Run migrations**

```bash
npx prisma migrate dev --name init
```

**5. Start the server**

```bash
npm run start:dev
```


## Environment Variables

| Variable                    | Description                             | Example                           |
| --------------------------- | --------------------------------------- | --------------------------------- |
| `NODE_ENV`                  | Environment                             | `development`                     |
| `PORT`                      | HTTP port                               | `3000`                            |
| `DATABASE_URL`              | Supabase transaction pooler URL         | `postgresql://...?pgbouncer=true` |
| `DIRECT_URL`                | Direct connection URL (for migrations)  | `postgresql://...`                |
| `SUPABASE_URL`              | Supabase project URL                    | `https://xyz.supabase.co`         |
| `SUPABASE_ANON_KEY`         | Supabase public key                     | `eyJ...`                          |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) | `eyJ...`                          |
| `SUPABASE_JWT_SECRET`       | JWT secret from Supabase settings       | `your-secret`                     |
| `SUPABASE_STORAGE_BUCKET`   | Storage bucket name                     | `field-images`                    |
| `REDIS_HOST`                | Redis host                              | `localhost`                       |
| `REDIS_PORT`                | Redis port                              | `6379`                            |
| `REDIS_PASSWORD`            | Redis password                          | _(optional)_                      |
| `CACHE_TTL_FIELD_STATUS`    | Field status cache TTL (seconds)        | `300`                             |
| `CACHE_TTL_DASHBOARD`       | Dashboard cache TTL (seconds)           | `120`                             |
| `AT_RISK_THRESHOLD_DAYS`    | Days without update before AT_RISK      | `7`                               |
| `MAX_FILE_SIZE_MB`          | Max image upload size                   | `5`                               |
| `ALLOWED_MIME_TYPES`        | Allowed image MIME types                | `image/jpeg,image/png,image/webp` |


## API Docs

Swagger is available at `http://localhost:3000/api/docs` when the server is running.
