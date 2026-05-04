# epam-lab1 — `max-precision`

Production-leaning rebuild of the authentication system. Same flows (register, login, password reset) with a strict API contract, hardened defaults, and a Tailwind-styled React/TS UI.

## Stack

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + TypeScript + Tailwind CSS (Vite)
- **Database**: SQLite (`better-sqlite3`)
- **Security**: helmet, CORS allow-list, per-IP+email rate limit (5/hour) on auth endpoints, bcrypt cost 12, JWT 24h, SHA-256-hashed single-use reset tokens, anti-enumeration timing on login

## Quick start

```powershell
git checkout max-precision
Copy-Item .env.example .env   # then edit JWT_SECRET
npm run install:all
npm run dev
```

- API:      http://localhost:3000
- Web app:  http://localhost:5173

In dev, password-reset links are printed to the server console (no SMTP required).

## Production

```powershell
npm run build
npm start
```

## API

All responses use this shape:

```json
{ "success": true,  "data":  { "token": "...", "expiresIn": 86400 } }
{ "success": false, "error": { "code": "AUTH_FAILED", "message": "Invalid email or password" } }
```

| Method | Path                          | Body                          | Description                                                     |
|-------:|-------------------------------|-------------------------------|-----------------------------------------------------------------|
| POST   | `/api/auth/register`          | `{ email, password }`         | Create account, returns JWT                                     |
| POST   | `/api/auth/login`             | `{ email, password }`         | Validate email → look up user → bcrypt-compare → return JWT     |
| POST   | `/api/auth/reset-password`    | `{ email }` _or_ `{ token, password }` | Request a reset email, or consume a token to set a new password |
| GET    | `/api/health`                 | –                             | Health check                                                    |

### Password rules

Min 8 characters, at least 1 uppercase letter, at least 1 number.

### Error codes

`AUTH_FAILED`, `EMAIL_TAKEN`, `INVALID_TOKEN`, `WEAK_PASSWORD`, `INVALID_INPUT`, `RATE_LIMITED`, `SERVER_ERROR`, `NOT_FOUND` (server) — plus client-side `NETWORK` / `TIMEOUT`.

## Security

- **bcrypt** cost 12; constant-time bcrypt comparison even on missing user (anti-enumeration)
- **JWT** signed with `JWT_SECRET`, 24-hour session expiry
- Reset tokens are 32 random bytes, **stored as SHA-256 hashes**, single-use; using one invalidates all other outstanding tokens for the user
- Per-IP+email **rate limit**: 5 attempts/hour on `/register`, `/login`, `/reset-password`
- `helmet`, JSON body size limit, CORS restricted to `CLIENT_ORIGIN`

## Project structure

```
.
├── package.json           # workspace scripts (install:all, dev, build, start)
├── server/                # Express + TS API
│   └── src/
│       ├── index.ts
│       ├── auth.routes.ts
│       ├── auth.service.ts
│       ├── validation.ts
│       ├── mailer.ts
│       ├── db.ts
│       └── config.ts
└── client/                # React + TS + Tailwind (Vite)
    └── src/
        ├── pages/
        ├── components/
        ├── api.ts
        └── utils.ts
```

## Other branches

- [`main`](https://github.com/ffbilsel/epam-lab1/tree/main) — branch index and overview.
- [`baseline`](https://github.com/ffbilsel/epam-lab1/tree/baseline) — Express + SQLite + vanilla HTML/CSS/JS.
- [`partial-precision`](https://github.com/ffbilsel/epam-lab1/tree/partial-precision) — Express + SQLite + React/TS (Vite).
