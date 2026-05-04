# epam-lab1 — `baseline`

Node.js + Express + SQLite authentication system with a minimal HTML/CSS/JS frontend. The most feature-complete of the implementations: register, login, logout, `/me`, change password, forgot / reset password.

## Stack

- **Backend**: Node.js + Express
- **Frontend**: Vanilla HTML/CSS/JS (served from `public/`)
- **Database**: SQLite (`better-sqlite3`)
- **Auth**: JWT in HttpOnly, SameSite=Lax cookie (also accepts `Authorization: Bearer`)
- **Hashing**: bcrypt (cost 12)

## Quick start

```powershell
git checkout baseline
npm install
Copy-Item .env.example .env   # then edit JWT_SECRET
npm start
```

App: http://localhost:3000

## Pages

| Page              | Path                    |
|-------------------|-------------------------|
| Home              | `/`                     |
| Register          | `/register.html`        |
| Login             | `/login.html`           |
| Dashboard         | `/dashboard.html`       |
| Change password   | `/change-password.html` |
| Forgot password   | `/forgot.html`          |
| Reset password    | `/reset.html`           |

## API

All endpoints accept and return JSON.

| Method | Path                          | Auth           | Body                                     |
|-------:|-------------------------------|----------------|------------------------------------------|
| POST   | `/api/auth/register`          | –              | `{ email, username, password }`          |
| POST   | `/api/auth/login`             | –              | `{ identifier, password }`               |
| POST   | `/api/auth/logout`            | –              | –                                        |
| GET    | `/api/auth/me`                | cookie/Bearer  | –                                        |
| POST   | `/api/auth/change-password`   | cookie/Bearer  | `{ currentPassword, newPassword }`       |
| POST   | `/api/auth/forgot-password`   | –              | `{ email }`                              |
| POST   | `/api/auth/reset-password`    | –              | `{ token, newPassword }`                 |

### Password rules

- 8–128 characters
- Must contain lowercase, uppercase, digit, and special character

### Reset token

In `NODE_ENV !== 'production'`, `forgot-password` returns the raw token in the JSON response (`devToken`) so you can test without email infrastructure. In production it's only logged server-side and should be sent via email.

## Security

- Passwords stored as **bcrypt** hashes (cost 12)
- JWTs signed with `JWT_SECRET`; **HttpOnly + SameSite=Lax** cookie (and `Secure` in production)
- Reset tokens stored as **SHA-256** hashes, single-use, expire after ~30 minutes
- Login & sensitive endpoints **rate-limited** (20 req / 15 min per IP)
- Login responds with a generic error on bad credentials and runs bcrypt against a dummy hash on unknown users to limit user enumeration
- `forgot-password` always returns the same message regardless of whether the email exists

## Project structure

```
.
├── server.js              # Express bootstrap
├── src/
│   ├── auth.js            # Auth router (all endpoints)
│   ├── db.js              # SQLite connection & schema
│   ├── middleware.js      # JWT auth middleware
│   └── validators.js      # Email/username/password validation
├── public/                # Static frontend (HTML/CSS/JS)
└── data/auth.sqlite       # Created at first run
```

## Other branches

- [`main`](https://github.com/ffbilsel/epam-lab1/tree/main) — branch index and overview.
- [`partial-precision`](https://github.com/ffbilsel/epam-lab1/tree/partial-precision) — Express + SQLite + React/TS (Vite).
- [`max-precision`](https://github.com/ffbilsel/epam-lab1/tree/max-precision) — Express + SQLite + React/TS + Tailwind.
