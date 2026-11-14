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
Solvent is a fintech platform providing **money transfers, bill payments, and merchant transactions** through a clean, secure interface. It includes user authentication with **MFA**, **KYC verification**, password reset, a settings panel, and an **admin console** for platform operations.

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
│       ├── components/    # Auth, Dashboard, Admin, Layout, payment,
│       │                  #   Transactions, Notifications, Settings, Profile
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
   > This also adds the password-reset, admin, avatar, and account-status columns on the `users` table. The API will error on `/auth/me` and `/auth/change-password` if this migration hasn't been run.

4. Load the development demo users, transactions, payment, and notifications:
   ```bash
   cd server
   npm run db:seed
   ```
   The seeder is safe to run more than once and refuses to run when `NODE_ENV=production`.
   Demo login: `alex.demo@example.test` / `DemoPass123!`. The other demo accounts use
   the same password: `sam.demo@example.test` and `taylor.demo@example.test`.
   Admin console login: `admin.demo@example.test` / `DemoPass123!`.

   To promote an existing account instead:
   ```bash
   cd server
   npm run db:promote-admin -- someone@example.com
   ```

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
| Method | Endpoint                               | Auth        | Description                              |
|--------|----------------------------------------|-------------|------------------------------------------|
| POST   | `/kyc/upload`                          | JWT         | Submit identity documents (multipart)    |
| GET    | `/kyc/status`                          | JWT         | Get KYC status + submissions             |
| GET    | `/kyc/submissions/:id/document/:side`  | JWT (owner/admin) | Stream a private KYC document      |

### Transactions
| Method | Endpoint                    | Auth | Description                        |
|--------|-----------------------------|------|------------------------------------|
| POST   | `/transactions/transfer`    | JWT  | Send money by recipient phone      |
| GET    | `/transactions/me`          | JWT  | Recent transactions                |

### Payments
| Method | Endpoint                 | Auth | Description                              |
|--------|--------------------------|------|------------------------------------------|
| POST   | `/payments`              | JWT  | Initiate a bill or merchant payment      |
| POST   | `/payments/qr`           | JWT  | Pay a merchant from a QR payload/code    |
| GET    | `/payments/history`      | JWT  | Payment history                          |
| GET    | `/payments/search`       | JWT  | Search the current user's payments       |
| GET    | `/payments/:paymentId`   | JWT  | Payment details                          |

### Receipts
| Method | Endpoint              | Auth | Description                              |
|--------|-----------------------|------|------------------------------------------|
| GET    | `/receipts`           | JWT  | Paginated receipt history (payments + transfers) |
| GET    | `/receipts/:reference`| JWT  | Receipt detail by payment/transaction reference |

### Merchants
| Method | Endpoint          | Auth | Description                              |
|--------|-------------------|------|------------------------------------------|
| GET    | `/merchants`      | JWT  | List active merchants and QR payloads    |
| GET    | `/merchants/:code`| JWT  | Look up a merchant by code               |

### Notifications
| Method | Endpoint                | Auth | Description              |
|--------|-------------------------|------|--------------------------|
| GET    | `/notifications`        | JWT  | List notifications       |
| GET    | `/notifications/:id`    | JWT  | Single notification      |
| POST   | `/notifications`        | JWT  | Create a notification    |
| PATCH  | `/notifications/:id/read` | JWT | Mark one as read         |
| PATCH  | `/notifications/read-all` | JWT | Mark all as read         |

### Admin
All admin endpoints require a JWT belonging to an active administrator.

| Method | Endpoint                            | Auth       | Description                              |
|--------|-------------------------------------|------------|------------------------------------------|
| GET    | `/admin/dashboard`                  | Admin JWT  | Platform KPIs, trends, and recent activity |
| GET    | `/admin/users`                      | Admin JWT  | Paginated user search (role/status/KYC)  |
| PATCH  | `/admin/users/:id`                  | Admin JWT  | Change role, KYC, verification, or status |
| GET    | `/admin/transactions`               | Admin JWT  | Paginated transaction monitoring         |
| PATCH  | `/admin/transactions/:id/status`    | Admin JWT  | Update a transaction status              |
| GET    | `/admin/payments`                   | Admin JWT  | Paginated payment monitoring             |
| GET    | `/admin/kyc`                        | Admin JWT  | Paginated KYC review queue               |
| PATCH  | `/admin/kyc/:id`                    | Admin JWT  | Approve or reject a pending submission   |

Other endpoints: `GET /health`, `GET /`, `GET /api-docs`.

## Implemented Features
- **Auth & onboarding:** register, login, MFA enrollment (registration) & login MFA, forgot/reset password, `/auth/me`
- **Security:** helmet + security headers, JWT auth middleware, global + auth-specific rate limiting (login/register/MFA/forgot-password)
- **KYC:** document upload (multer, 5MB limit), private document storage, status/history, simulated verification, and an admin review queue with approval/rejection reasons
- **Transfers & payments:** record transactions/payments with generated references (no live ledger yet), bill payments, merchant QR payments, manual merchant-code lookup, and camera scanning
- **Receipts:** searchable payment/transfer receipt history, receipt detail, print/save-PDF, reference copy, and text download
- **Notifications:** system-generated messages on transfers, payments, and KYC verification; read/unread + mark-all-read
- **Profile:** profile editing, avatar add/change/remove, and account deletion
- **Frontend pages:** Landing/Dashboard (balances + chart + recent transactions + quick actions + KYC banner), Transactions, Fund Transfer, Bill Payment, Merchant Payment, Notifications, Settings (profile, KYC, change password), Reset Password, Forgot Password, Login, Register, MFA
- **Admin console:** role-protected `/admin` area with platform KPIs, 7-day activity chart, payment mix, user search/filtering, role and KYC management, private KYC document previews, account suspension/reactivation, and transaction/payment monitoring

## Planned / Roadmap
- **Balance/wallet ledger** — transfers & payments currently create records but don't debit/credit real balances
- **Compliance tooling** — audit logs and exportable compliance reports
- **Production email** — `EMAIL_USERNAME`/`EMAIL_PASSWORD` are commented out in `.env`; email is simulated in dev
- **Repo hygiene** — `.env` is currently tracked by git (rotate the JWT secret)

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
