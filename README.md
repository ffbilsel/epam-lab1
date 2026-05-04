# epam-lab1 — User Authentication System

EPAM Lab 1: a small, end-to-end user authentication exercise implemented three different ways across branches. Each implementation focuses on the same flows (register, login, password reset) but with progressively richer stacks and stricter contracts.

This `main` branch is the landing page and branch index. Pick a branch below to explore an implementation.

## Branches

- [`baseline`](https://github.com/ffbilsel/epam-lab1/tree/baseline) — **Node.js + Express + SQLite** with a minimal **vanilla HTML/CSS/JS** frontend. Most feature-complete (login, register, logout, `/me`, change-password, forgot/reset). Identifier-based login (email or username), JWT in HttpOnly cookie.
- [`partial-precision`](https://github.com/ffbilsel/epam-lab1/tree/partial-precision) — **Node.js + Express + SQLite** backend, **React + TypeScript (Vite)** frontend. Email-only login. Standard `{ success, data, error }` response envelope.
- [`max-precision`](https://github.com/ffbilsel/epam-lab1/tree/max-precision) — Production-leaning rebuild: **Node.js + Express + SQLite** backend, **React + TypeScript + Tailwind CSS** frontend. Strict response envelope, hardened defaults (helmet, CORS allow-list, rate-limited auth endpoints, bcrypt cost 12, 24h JWT, hashed single-use reset tokens).

## At a glance

| Branch              | Backend                  | Frontend                   | Auth identifier | Response shape                      |
|---------------------|--------------------------|----------------------------|-----------------|--------------------------------------|
| `baseline`          | Express + SQLite         | Vanilla HTML/CSS/JS        | email or username | `{ ok, ... }` / cookie-based JWT     |
| `partial-precision` | Express + SQLite         | React + TS (Vite)          | email           | `{ success, data, error }`           |
| `max-precision`     | Express + SQLite         | React + TS + Tailwind      | email           | `{ success, data, error }` (strict)  |

## Try a branch

```powershell
git checkout <branch-name>
Copy-Item .env.example .env   # then edit JWT_SECRET
# follow the branch README's "Quick start"
```

See the README on each branch for full setup, API, and security documentation.
