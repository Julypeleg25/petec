# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Petec** is a full-stack TypeScript monorepo for a veterinary hospital management system. It handles animal patients, medical records, cases, anesthesia forms, medicines, and system administration.

## Monorepo Structure

npm workspaces with three packages:
- `frontend/` — React SPA (Create React App)
- `backend/` — Node.js/Express API
- `packages/shared/` — Shared DTOs, types, constants, utilities (package name: `@petec/shared`)

The `shared` package must be built before `backend` or `frontend` when doing a full build.

## Common Commands

```bash
# Development
npm run dev:backend        # Start backend with hot reload (tsx watch)
npm run dev:frontend       # Start frontend dev server (port 3000)

# Build (must build shared first)
npm run build              # Builds all packages in order: shared → backend → frontend

# Type checking
npm run typecheck          # Type-checks all packages

# Seed database
npm run -w backend seed    # Run database seed

# Tests
npm run -w frontend test   # Frontend tests (React Testing Library + Jest)

# Clean install
npm run install:clean      # Remove node_modules + package-lock.json, then reinstall
```

## Architecture

### Backend (`backend/src/`)

Layered architecture: **Routes → Controllers → Services → Repositories → Models (Mongoose)**

- `controllers/` — Request/response handling
- `services/` — Business logic
- `repositories/` — MongoDB data access via Mongoose
- `models/` — Mongoose schemas (Patient, User, Case, MasterCase, AnesthesiaForm, PatientDocument, PatientMedicine, AuditLog, and system lookup models)
- `middlewares/` — Auth (JWT), error handling, request logging, security (Helmet)
- `mappers/` — DTO ↔ domain object conversion
- `config/config.ts` — Zod-validated env config (reads from `config.json` + env vars)
- `routes/` — auth, patient, admin, table, users, medicine

**Backend uses TypeScript path aliases** (e.g., `@controllers/`, `@services/`, `@shared/`). These are defined in `backend/tsconfig.json` and resolved at runtime by `tsc-alias` post-build.

### Frontend (`frontend/src/`)

- `features/` — Feature modules: `auth`, `medicine`, `patients`, `system-management`, `table`
- `components/` — Shared UI components
- `utils/` — Reusable form components (`FormInput`, `FormSelect`, `FormCheckbox`, `FormTextarea`, `FormUploadImage`), hooks, and utilities
- `router/` — React Router v6 route definitions
- `lib/` — TanStack Query client setup
- `config/config.ts` — Zod-validated frontend env (API_URL)

**State management:** TanStack Query (server state) + React Hook Form (form state)

### Shared (`packages/shared/src/`)

- `dtos/` — Zod schemas used for both validation and TypeScript types (auth, patient, case, anesthesia, admin, user, table, bulkTemplate)
- `types/` — Shared TypeScript interfaces
- `constants/` — Route paths, pagination defaults, auth constants
- `errors/` — Custom error classes

Imported in both frontend and backend as `@petec/shared`.

## Key Technologies

| Layer | Tech |
|-------|------|
| Frontend | React 18, React Router v6, TanStack Query v5, React Hook Form, Zod, Axios, Recharts |
| Backend | Express 5, Mongoose 9, MongoDB, JWT, Multer, Puppeteer (PDF), Mailjet (email), Winston (logging) |
| Shared | Zod 4, tsup (bundler) |
| Language | TypeScript 5.9 throughout |

## Database

MongoDB via Mongoose. Connection URI comes from `MONGODB_URI` env/config. Database name: `petec_v1`.

Key collections: `patients`, `cases`, `master_cases`, `anesthesia_forms`, `patient_documents`, `patient_medicines`, `audit_logs`, plus system lookup collections (animal types, race types, gender types, medicine categories, etc.).

## Authentication

JWT-based with roles: **Admin, Doctor, Assistant, Reception**. Tokens stored in HTTP-only cookies. Auth middleware in `backend/src/middlewares/`.

## Environment Configuration

Both frontend and backend use Zod to validate config. Default values are in `config.json` files which are overridden by environment variables:

- `backend/src/config/config.json` — PORT, MONGODB_URI, FRONTEND_URL, token expiries, MAIL_ADMIN
- `frontend/src/config/config.json` — API_URL

## Internationalization

The app is in Hebrew. Zod validation error messages are translated to Hebrew in `frontend/src/index.tsx`.
