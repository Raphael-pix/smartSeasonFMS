# SmartSeason Field Monitoring System

## Overview

SmartSeason is a web-based agricultural monitoring platform designed to help coordinators and field agents track crop progress across multiple fields during a growing season.

The system is built with a strong focus on:

- Simplicity and usability
- Low-bandwidth environments
- Offline-tolerant workflows
- Real-world applicability in rural Kenyan settings

It enables users to move from manual, paper-based tracking to a structured digital system that provides visibility, traceability, and basic analytics.

## Core Features

### 1. User Roles & Access Control

- **Admin (Coordinator)**
  - Create and manage fields
  - Assign fields to agents
  - View system-wide data and insights

- **Field Agent**
  - View assigned fields
  - Submit updates and observations

### 2. Field Management

Each field contains:

- Name
- Crop type
- Planting date
- Current growth stage
- Assigned agent
- Location (county / optional GPS)

### 3. Field Updates (Audit Trail)

- Agents submit updates including:
  - Growth stage
  - Notes/observations
  - Optional images

- Updates are stored as an **append-only log**, ensuring:
  - Full traceability
  - Historical analysis capability

### 4. Field Lifecycle

Fields follow a simple lifecycle:

- Planted
- Growing
- Ready
- Harvested

### 5. Field Status Logic

Field status is computed dynamically:

- **Completed**
  - Field is harvested

- **At Risk**
  - No updates for a defined period (e.g., 7 days)

- **Active**
  - Field is progressing normally

This avoids stale data and enables real-time insights.

### 6. Dashboards

#### Admin Dashboard

- Total number of fields
- Status breakdown (Active, At Risk, Completed)
- Recent updates
- Alerts for at-risk fields

#### Agent Dashboard

- Assigned fields
- Latest updates
- Quick update actions

### 7. Offline-Tolerant Design

The system is designed with rural usage in mind:

- Handles delayed updates
- Supports eventual synchronization
- Minimizes payload sizes for low bandwidth usage

## System Architecture

### High-Level Components

- **Frontend**: Web application (PWA-ready)
- **Backend**: API server (NestJS)
- **Database**: PostgreSQL (Supabase)
- **Cache Layer**: Redis
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (images)

## Tech Stack

### Backend

- NestJS (Node.js framework)
- Prisma ORM
- PostgreSQL (Supabase)
- Redis (caching)
- BullMQ (background jobs)

### Frontend

- Next.js
- Tailwind CSS
- Zustand (state management)

### Infrastructure

- Supabase (Database, Auth, Storage)

## Database Design

Core entities:

- **Farm**
- **User**
- **Field**
- **FieldUpdate**
- **Location**
- **FieldImage**

Key design principles:

- Normalized schema
- Indexed for performance
- Append-only updates for auditability
- Computed status (not stored)

## Caching Strategy (Redis)

Redis is used for:

- Dashboard summaries
- Frequently accessed computed data (e.g., field status)
- Performance optimization for repeated queries

Cache invalidation occurs when:

- New field updates are submitted
- Field assignments change

## Background Processing

Using BullMQ (Redis-backed queues) for:

- Recomputing field status
- Updating cached dashboard data
- Handling asynchronous tasks

## Security & Access Control

- Authentication via Supabase (JWT-based)
- Role-Based Access Control (RBAC) in backend
- Row Level Security (RLS) in database for additional protection

## File Storage

- Field images stored using Supabase Storage
- URLs stored in database
- Upload validation enforced (type, size)

## Design Decisions

This system was designed around real-world agricultural constraints in Kenya, particularly low connectivity, field-level offline work, and multi-tenant farm management.

### 1. Multi-tenancy at the Database Level

Each record (`users`, `fields`, `notifications`, etc.) is scoped by `farmId`.

- Ensures strict data isolation between farms
- Prevents cross-farm data leakage even if application-layer checks fail
- RLS policies reinforce this isolation at the database layer

### 2. Supabase Auth as Identity Source of Truth

User authentication is delegated to Supabase Auth.

- `auth.users.id` is mirrored in `public.users.id`
- A PostgreSQL trigger automatically creates user profiles on signup
- Removes need for custom authentication infrastructure

### 3. Computed Field Status (Not Stored)

Field status (`ACTIVE`, `AT_RISK`, `COMPLETED`) is computed dynamically.

- Avoids stale state issues
- Eliminates background sync complexity
- Ensures consistency across dashboards and notifications

### 4. Event-Driven Notifications (BullMQ)

Notifications are triggered from background jobs rather than request-time logic.

- Ensures reliability even with delayed updates
- Prevents duplicate notifications via deduplication checks
- Supports future extension to email/SMS/push

### 5. Aggressive Cache Invalidation Strategy

Redis caches are invalidated on any write operation.

- Prioritises correctness over cache hit rate
- Suitable for low-to-medium write frequency system (typical farm updates)
- BullMQ workers rebuild caches proactively

### 6. Append-Only Field Updates

`field_updates` is intentionally immutable.

- No `UPDATE`/`DELETE` policies at DB level
- Provides audit trail for agricultural reporting
- Ensures historical integrity of field observations

### 7. Backend-First Security Model

Security is enforced at multiple layers:

- Supabase JWT verification (`AuthGuard`)
- Role-based access control (`RolesGuard`)
- Row Level Security (Postgres RLS)
- Service-layer ownership checks

## 15. Assumptions Made

The following assumptions were made during system design and implementation.

### 1. Single Assigned Agent per Field

Each field is assigned to exactly one agent.

- Simplifies access control logic
- Reduces complexity in update ownership
- Multi-agent support can be added via join table in future

### 2. Stable Internet for Admins, Intermittent for Agents

System assumes:

- Admins operate with stable connectivity (dashboard usage)
- Agents may submit updates with delays or offline buffering

### 3. Supabase is the Primary Backend Infrastructure

The system depends on:

- Supabase Auth for authentication
- Supabase PostgreSQL for data storage
- Supabase Storage for images

### 4. Redis is Available in Production

Used for:

- Caching dashboard and field status
- BullMQ job processing

> System degrades gracefully if Redis is unavailable (cache miss fallback).

### 5. Email and Notification System is In-App Only (Current Scope)

- No external email provider required at MVP stage
- Notifications are delivered via database + frontend polling
- Email/SMS integrations are future enhancements

### 6. Small to Medium-Scale Deployment

Architecture is optimized for:

- Hundreds of farms
- Thousands of fields
- Low-to-moderate write frequency

> Not yet designed for multi-region global scale.

## 16. Demo Credentials (Testing)

Use the following accounts to test the system.

### Admin Account

```
Email:    admin@smartseason.dev
Password: Admin@12345
Role:     ADMIN
```

### Agent Account

```
Email:    agent@smartseason.dev
Password: Agent@12345
Role:     AGENT
```

### Demo Farm Context

Both accounts belong to:

```
Farm:   Demo SmartSeason Farm
FarmId: (auto-assigned via onboarding seed)
```

### Notes for Testing

Users are not limited to demo accounts.

- Users can create their own account using a valid email address via the authentication flow.
- Account creation is handled through Supabase Auth.
- After signup, users are automatically onboarded into the system and assigned a default role (AGENT) unless you create your own farm.
- Admins can later assign users to a farm during onboarding or via invitation flow.
