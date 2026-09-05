# Solvent — Fintech Web Application

A full-stack fintech web app for money transfers, bill payments, and merchant transactions. Built with a React (Vite) frontend and an Express + Sequelize + MySQL backend.

> **Note:** The upstream plan originally specified PostgreSQL/MongoDB, but the implemented backend uses **MySQL** (Sequelize dialect `mysql`).

## Table of Contents
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Running the App](#running-the-app)
- [API Reference](#api-reference)
- [Implemented Features](#implemented-features)
- [Planned / Roadmap](#planned--roadmap)
- [Environment Variables](#environment-variables)
- [License](#license)

## Overview
Solvent is a fintech platform providing **money transfers, bill payments, and merchant transactions** through a clean, secure interface. It includes user authentication with **MFA**, **KYC verification**, password reset, and a settings panel.

## Tech Stack
- **Frontend:** React 19, React Router 7, Material UI (MUI), Recharts, Vite
- **Backend:** Node.js, Express, JSON Web Tokens (JWT), bcrypt, multer (file uploads)
- **Database:** MySQL, Sequelize ORM, Sequelize CLI (migrations)
- **Security:** helmet, express-rate-limit, bcrypt, JWT, MFA

## Project Structure
```
Solvent-app/
├── frontend/              # React (Vite) SPA
│   └── src/
│       ├── components/    # Auth, Dashboard, Layout, payment, Transactions,
│       │                  #   Notifications, Settings
│       ├── services/      # api.js (axios), authAPI, kycAPI, transferAPI,
│       │                  #   paymentAPI, notificationAPI
│       ├── utils/auth.js  # token/user localStorage helpers
│       └── App.jsx        # Routes (public + protected)
└── server/                # Express API
    ├── controllers/       # auth, kyc, transaction, payment, notification
    ├── middleware/        # auth (JWT), securityHeaders
    ├── migrations/        # Sequelize migrations
    ├── models/            # User, Transaction, Payment, Notification, KYC
    ├── routes/            # index.js mounts everything under /api
    └── server.js          # Entry point (helmet, CORS, rate-limit, routes)
```

## Prerequisites
- Node.js (v18+) and npm
- A running MySQL server

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Louis-4test/Solvent-app.git
   cd Solvent-app
   ```

2. **Backend dependencies:**
   ```bash
   cd server
   npm install
   ```

3. **Frontend dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

## Database Setup

1. Create a MySQL database (default name: `solvent`):
   ```sql
   CREATE DATABASE IF NOT EXISTS solvent;
   ```

2. Configure connection credentials in `server/.env` (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME) — or edit `server/migrations/config/config.json` for CLI defaults.

3. Run the migrations to create/alter tables:
   ```bash
   cd server
   npm run db:migrate
   ```
   > This also adds the password-reset and admin columns on the `users` table. The API will error on `/auth/me` and `/auth/change-password` if this migration hasn't been run.

## Running the App

Run the backend API (port 3000):
```bash
cd server
npm run server
```

Run the frontend dev server (port 5173, proxies `/api` → `http://localhost:3000`):
```bash
cd frontend
npm run dev
```

Open http://localhost:5173.

Production frontend build:
```bash
cd frontend
npm run build
```

## API Reference

Base URL: `http://localhost:3000/api`

### Auth
| Method | Endpoint                    | Auth | Description                        |
|--------|-----------------------------|------|------------------------------------|
| POST   | `/auth/register`            | —    | Create account                     |
| POST   | `/auth/login`               | —    | Log in (returns token or MFA prompt) |
| POST   | `/auth/send-mfa`            | —    | Send MFA / verification code       |
| POST   | `/auth/verify-mfa`          | —    | Verify registration MFA code       |
| POST   | `/auth/verify-login-mfa`    | —    | Complete login with MFA code       |
| GET    | `/auth/me`                  | JWT  | Current user profile               |
| POST   | `/auth/forgot-password`     | —    | Request password reset email       |
| POST   | `/auth/reset-password`      | —    | Reset password with token          |
| POST   | `/auth/change-password`     | JWT  | Change password (logged in)        |

### KYC
| Method | Endpoint        | Auth | Description                     |
|--------|-----------------|------|---------------------------------|
| POST   | `/kyc/upload`   | JWT  | Upload ID document (multipart)  |
| GET    | `/kyc/status`   | JWT  | Get KYC status + submissions    |

### Transactions
| Method | Endpoint                    | Auth | Description                        |
|--------|-----------------------------|------|------------------------------------|
| POST   | `/transactions/transfer`    | JWT  | Send money by recipient phone      |
| GET    | `/transactions/me`          | JWT  | Recent transactions                |

### Payments
| Method | Endpoint            | Auth | Description              |
|--------|---------------------|------|--------------------------|
| POST   | `/payments`         | JWT  | Initiate a payment       |
| GET    | `/payments/history` | JWT  | Payment history          |

### Notifications
| Method | Endpoint                | Auth | Description              |
|--------|-------------------------|------|--------------------------|
| GET    | `/notifications`        | JWT  | List notifications       |
| GET    | `/notifications/:id`    | JWT  | Single notification      |
| POST   | `/notifications`        | JWT  | Create a notification    |
| PATCH  | `/notifications/:id/read` | JWT | Mark one as read         |
| PATCH  | `/notifications/read-all` | JWT | Mark all as read         |

Other endpoints: `GET /health`, `GET /`, `GET /api-docs`.

## Implemented Features
- **Auth & onboarding:** register, login, MFA enrollment (registration) & login MFA, forgot/reset password, `/auth/me`
- **Security:** helmet + security headers, JWT auth middleware, global + auth-specific rate limiting (login/register/MFA/forgot-password)
- **KYC:** document upload (multer, 5MB limit) with simulated background verification and status/verification timestamp
- **Transfers & payments:** record transactions/payments with generated references (no live ledger yet)
- **Notifications:** system-generated messages on transfers, payments, and KYC verification; read/unread + mark-all-read
- **Frontend pages:** Landing/Dashboard (balances + chart + recent transactions + quick actions + KYC banner), Transactions, Fund Transfer, Bill Payment, Merchant Payment, Notifications, Settings (profile, KYC, change password), Reset Password, Forgot Password, Login, Register, MFA

## Planned / Roadmap
- **Balance/wallet ledger** — transfers & payments currently create records but don't debit/credit real balances
- **Admin panel** — admin login, dashboards, user/merchant management, transaction monitoring, compliance/audit logs (RBAC groundwork exists)
- **Receipts & QR payments** — receipts view; QR-scan merchant payment
- **Production email** — `EMAIL_USERNAME`/`EMAIL_PASSWORD` are commented out in `.env`; email is simulated in dev
- **Repo hygiene** — `.env` is currently tracked by git (rotate the JWT secret); add `uploads/` to `.gitignore`

## Environment Variables
Create `server/.env` with:
```
PORT=3000
NODE_ENV=development
JWT_SECRET=<your-secret>
SESSION_SECRET=<your-secret>
FRONTEND_URL=http://localhost:5173
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=
DB_NAME=solvent
EMAIL_USERNAME=
EMAIL_PASSWORD=
```

For the frontend, set `VITE_API_URL` (defaults to `http://localhost:3000/api`) — see `frontend/src/services/api.js`.

## License
Proprietary / internal project.
