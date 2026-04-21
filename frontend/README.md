# SmartSeason — Field Monitoring System

A lightweight, mobile-first field monitoring platform for agricultural coordinators and field agents in Kenya. Built for **low-bandwidth conditions** with an offline-first mindset.

> **Frontend repository.** This app talks to a separate NestJS backend that handles authentication (via Supabase), multi-tenant farm isolation, and all data persistence.

---

## ✨ Features

### Multi-Tenant Farms

- Each **Farm** is a tenant boundary — users only ever see data from their own farm
- Onboarding lets new users **create a farm** (becomes Admin) or **join one** with an invite code
- Admins can regenerate invite codes and remove members

### Two Roles

- **Admin (Coordinator)** — manages fields, agents, and views farm-wide dashboards
- **Field Agent** — submits crop updates, photos, and tracks assigned fields

### Field Tracking

- Crop stages: `PLANTED → GROWING → READY → HARVESTED`
- Health status: `ACTIVE`, `AT_RISK`, `COMPLETED`
- Photo gallery and update history per field
- Pagination, filtering, and skeleton loaders for slow networks

### Profile & Settings

- Update name, phone, and password
- Theme: **Light / Dark / System** (persisted, applied on app bootstrap)
- Notification toggles (field updates, at-risk alerts)
- **Data Saver** mode for low bandwidth

### Offline-First UX

- Online/offline indicator in the top bar
- Queued submissions surface as a "queued" badge until they sync

---

## 🛠 Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) v1 (React 19 + SSR)
- **Build**: Vite 7
- **Routing**: TanStack Router (file-based, type-safe)
- **Data**: TanStack Query + Axios
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **State**: Zustand (with persistence)
- **Auth**: Supabase JS SDK (tokens forwarded to NestJS API)
- **Forms**: React Hook Form + Zod

---

## 📁 Project Structure

```
src/
├── routes/              # File-based routes (TanStack Router)
│   ├── __root.tsx       # Root shell + providers
│   ├── index.tsx        # Landing redirect
│   ├── login.tsx        # Sign in
│   ├── signup.tsx       # Create account
│   ├── onboarding.tsx   # Create or join a farm
│   ├── _app.tsx         # Authenticated layout (gates farmId)
│   ├── _app.admin.*     # Admin pages (dashboard, fields, users)
│   ├── _app.agent.*     # Agent pages (dashboard, fields)
│   ├── _app.farm.tsx    # Farm management
│   ├── _app.profile.tsx # Profile + app settings
│   └── _app.fields.$id.tsx
├── components/          # Reusable UI (AppShell, ThemeProvider, etc.)
├── hooks/               # React Query hooks (useFields, useFarms, …)
├── services/            # Axios API clients per domain
├── stores/              # Zustand stores (auth, settings, offline queue)
├── lib/                 # supabase, apiClient, utils
└── styles.css           # Tailwind v4 tokens (oklch theme)
```

---

## 🚀 Getting Started

### Prerequisites

- [npm] (or Node 20+)
- A running NestJS backend
- A Supabase project (URL + publishable key)

### 1. Install

```bash
npm install
```

### 2. Configure environment

Create a `.env` file at the project root:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

### 3. Run the dev server

```bash
npm run dev
```

The app will be available at `http://localhost:3000` (or whichever port Vite picks).

### 4. Build for production

```bash
npm run build
```

---

## 🔐 Authentication & Onboarding Flow

1. **Sign up** at `/signup` → Supabase creates the auth user
2. **Login** at `/login` → JWT stored by Supabase
3. **Onboarding** at `/onboarding` → user has no `farmId` yet:
   - **Create a Farm** → user becomes `ADMIN` of the new farm
   - **Join a Farm** → user enters an invite code (`XXXX-XXXX-XXXX`)
4. After joining/creating, all `/api/v1/*` requests are scoped to the user's farm — enforced server-side at three layers (service code, HTTP guard, database RLS).

The app's `_app` layout redirects users without a `farmId` to `/onboarding` automatically.

---

## 🎨 Design System

- Semantic tokens defined in `src/styles.css` using `oklch`
- Theme variables: `--background`, `--foreground`, `--primary`, `--sidebar-*`, etc.
- Dark mode toggled via `.dark` class on `<html>` (managed by `ThemeProvider`)
- **Never** hardcode colors in components — always use Tailwind classes that map to tokens

---

## 📡 API Contract

All endpoints are documented by the NestJS backend. Key modules consumed here:

| Module    | Endpoint Examples                                    |
| --------- | ---------------------------------------------------- |
| Auth      | Supabase SDK (handled client-side)                   |
| Farms     | `POST /farms`, `POST /farms/join`, `GET /farms/mine` |
| Users     | `GET /users/me`, `PATCH /users/:id`                  |
| Fields    | `GET /fields`, `POST /fields`, `GET /fields/:id`     |
| Updates   | `POST /fields/:id/updates`                           |
| Images    | `POST /fields/:id/images`                            |
| Dashboard | `GET /dashboard/admin`, `GET /dashboard/agent`       |

The Axios client (`src/lib/apiClient.ts`) auto-attaches the Supabase access token and refreshes on 401.

---

## ⚡ Performance Notes

- Pagination on every list endpoint
- Skeleton loaders during fetches
- Minimal animations (motion is reserved for state transitions)
- Data Saver mode reduces image fidelity
- Mobile-first layouts; desktop is a progressive enhancement

---
