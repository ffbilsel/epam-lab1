# EPAM Lab 1 — User Authentication System

Email-based authentication with JWT, bcrypt password hashing, and password-reset via email.

- **Backend**: Node.js + Express + SQLite (`better-sqlite3`)
- **Frontend**: React + TypeScript (Vite)
- **Security**: helmet, CORS, rate limiting, bcrypt (cost 12), hashed reset tokens, no user enumeration on forgot-password

> Legacy: an older minimal HTML/CSS/JS variant lives on the `baseline` branch.

## Setup

```powershell
npm run install:all
Copy-Item .env.example .env   # then edit JWT_SECRET
npm run dev
```

- API:      http://localhost:3000
- Frontend: http://localhost:5173

In dev, password-reset links are printed to the server console (no SMTP required).

## Production

```powershell
npm run build:client
npm start
```

## API

All responses use this shape:

```json
{ "success": true,  "data":  { } }
{ "success": false, "error": { "code": "AUTH_FAILED", "message": "..." } }
```

| Method | Path                         | Body                          | Description |
|-------:|------------------------------|-------------------------------|-------------|
| POST   | `/api/auth/register`         | `{ email, password }`         | Create account, returns JWT |
| POST   | `/api/auth/login`            | `{ email, password }`         | Validate email → look up user → bcrypt-compare → return JWT |
| POST   | `/api/auth/forgot-password`  | `{ email }`                   | Sends a reset link (logged in dev) |
| POST   | `/api/auth/reset-password`   | `{ token, newPassword }`      | Consumes token, sets new password |
| GET    | `/api/auth/me`               | _Bearer token_                | Returns current user |

### Success example

```json
{ "success": true, "data": { "token": "eyJ...", "expiresIn": 3600, "user": { "id": 1, "email": "a@b.com" } } }
```

### Password rules

Min 8 chars, at least 1 uppercase letter, at least 1 number.

### Error codes

`VALIDATION_ERROR`, `EMAIL_TAKEN`, `AUTH_FAILED`, `UNAUTHORIZED`, `INVALID_TOKEN`, `INVALID_RESET_TOKEN`, `RATE_LIMITED`, `USER_NOT_FOUND`, `NOT_FOUND`, `INTERNAL_ERROR`.

