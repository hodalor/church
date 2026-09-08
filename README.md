# Prynova Church Management System

## Overview

Prynova is a multi-tenant SaaS church management platform for running church operations across finance, members, attendance, communication, pastoral care, analytics, and administration.

## Architecture

The repository is organized as three separate applications:

- `church/backend` - Node.js + Express + MongoDB REST API
- `church/frontend` - React.js admin dashboard built with Create React App
- `church/mobile` - Flutter member mobile app
- `church/biometric-bridge` - local Windows fingerprint bridge for ZKTeco USB scanners

```text
                    +----------------------+
                    |   MongoDB Database   |
                    +----------+-----------+
                               ^
                               |
                    +----------+-----------+
                    |  backend (Express)   |
                    |  REST API + JWT auth |
                    +-----+-----------+----+
                          ^           ^
                          |           |
               HTTP/JSON  |           |  HTTP/JSON
                          |           |
          +---------------+--+     +--+----------------+
          | frontend (CRA)   |     | mobile (Flutter)  |
          | Admin dashboard  |     | Member application|
          +------------------+     +-------------------+
                          \
                           \ uploads/media
                            \
                      +------+-------+
                      |   Supabase   |
                      |   Storage    |
                      +--------------+
```

## Tech Stack

- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- bcrypt
- Supabase Storage
- React
- TailwindCSS
- React Query
- Zustand
- Flutter
- Riverpod
- Dio

## Prerequisites

- Node.js 18+
- MongoDB 6+ (local or Atlas)
- Flutter 3.x SDK
- A Supabase project (free tier works)
- Git

## Quick Start (Docker - Recommended)

1. Clone the repository.
2. Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env`.
3. Run `docker compose up`.
4. Open the frontend at `http://localhost:3000`.
5. Check the backend health endpoint at `http://localhost:5000/api/v1/health`.

## Manual Setup

### Backend

```bash
cd church/backend
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
```

### Frontend

```bash
cd church/frontend
npm install
cp .env.example .env
# Edit .env with your values
npm start
```

### Mobile

```bash
cd church/mobile
flutter pub get
flutter run
```

## Running Tests

### Backend

```bash
cd church/backend
npm test
```

### Frontend

```bash
cd church/frontend
npm test
```

## Environment Variables

See:

- `backend/.env.example`
- `frontend/.env.example`

Backend variables for server boot, MongoDB, JWT, seed admin, and Supabase are required for a normal local setup. SMS, WhatsApp, SMTP email, Firebase push notifications, and Anthropic AI integrations are optional and can be left unset if you are not using those features.

## External Services

- Supabase: Used for file and media storage across the platform.
- Twilio: Used for SMS and WhatsApp messaging integrations.
- Firebase: Used for push notifications and requires platform-specific mobile setup such as `google-services.json`.
- Anthropic: Used for AI Pastor Assistant features.

## Biometric Setup

Fingerprint enrollment and biometric service attendance use a local Windows bridge because browsers cannot call the ZKTeco USB SDK directly.

1. Install the ZKTeco `ZKFinger SDK for Windows` for the `SLK20R`.
2. Configure and run `biometric-bridge/server.js` on the scanner PC.
3. Set `REACT_APP_BIOMETRIC_BRIDGE_URL=http://127.0.0.1:4113` in `frontend/.env`.

See `biometric-bridge/README.md` for the bridge contract and SDK adapter wiring.

## Multi-Tenancy

Prynova isolates tenant data using a `tenantId` that is carried through authentication and applied to records at the API and database layer. Each church operates within its own logical tenant boundary so members, transactions, users, and analytics stay separated from other tenants.

## Default Super Admin

On first startup, the backend seeds a default super admin account using:

- `SUPER_ADMIN_TENANT_ID`
- `SUPER_ADMIN_USERNAME`
- `SUPER_ADMIN_PIN`

Use secure production values before deploying outside local development.

## License

MIT
