# SmartSeason Field Monitoring System

## Overview

SmartSeason is a web-based agricultural monitoring platform designed to help coordinators and field agents track crop progress across multiple fields during a growing season.

The system is built with a strong focus on:

- Simplicity and usability
- Low-bandwidth environments
- Offline-tolerant workflows
- Real-world applicability in rural Kenyan settings

It enables users to move from manual, paper-based tracking to a structured digital system that provides visibility, traceability, and basic analytics.

---

## Problem Statement

Many small- to medium-scale agricultural operations in Kenya still rely on manual methods to track crop progress. This results in:

- Poor visibility across distributed fields
- Delayed decision-making
- Lack of historical data
- Inefficient coordination between field agents and managers

SmartSeason addresses these challenges by providing a centralized system for field monitoring and reporting.

---

## Core Features

### 1. User Roles & Access Control

- **Admin (Coordinator)**
  - Create and manage fields
  - Assign fields to agents
  - View system-wide data and insights

- **Field Agent**
  - View assigned fields
  - Submit updates and observations

---

### 2. Field Management

Each field contains:

- Name
- Crop type
- Planting date
- Current growth stage
- Assigned agent
- Location (county / optional GPS)

---

### 3. Field Updates (Audit Trail)

- Agents submit updates including:
  - Growth stage
  - Notes/observations
  - Optional images

- Updates are stored as an **append-only log**, ensuring:
  - Full traceability
  - Historical analysis capability

---

### 4. Field Lifecycle

Fields follow a simple lifecycle:

- Planted
- Growing
- Ready
- Harvested

---

### 5. Field Status Logic

Field status is computed dynamically:

- **Completed**
  - Field is harvested

- **At Risk**
  - No updates for a defined period (e.g., 7 days)

- **Active**
  - Field is progressing normally

This avoids stale data and enables real-time insights.

---

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

---

### 7. Offline-Tolerant Design

The system is designed with rural usage in mind:

- Handles delayed updates
- Supports eventual synchronization
- Minimizes payload sizes for low bandwidth usage

---

## System Architecture

### High-Level Components

- **Frontend**: Web application (PWA-ready)
- **Backend**: API server (NestJS)
- **Database**: PostgreSQL (Supabase)
- **Cache Layer**: Redis
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (images)

---

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

---

## Database Design

Core entities:

- **User**
- **Field**
- **FieldUpdate**
- **Location**
- (Optional) FieldImage

Key design principles:

- Normalized schema
- Indexed for performance
- Append-only updates for auditability
- Computed status (not stored)

---

## Caching Strategy (Redis)

Redis is used for:

- Dashboard summaries
- Frequently accessed computed data (e.g., field status)
- Performance optimization for repeated queries

Cache invalidation occurs when:

- New field updates are submitted
- Field assignments change

---

## Background Processing

Using BullMQ (Redis-backed queues) for:

- Recomputing field status
- Updating cached dashboard data
- Handling asynchronous tasks

---

## Security & Access Control

- Authentication via Supabase (JWT-based)
- Role-Based Access Control (RBAC) in backend
- Row Level Security (RLS) in database for additional protection

---

## File Storage

- Field images stored using Supabase Storage
- URLs stored in database
- Upload validation enforced (type, size)

---

## API Documentation

- Swagger documentation available via:
