# epam-lab1

EPAM Lab 1 — User Authentication System.

The implementation lives on the [`baseline`](https://github.com/ffbilsel/epam-lab1/tree/baseline) branch.

## Branches

- **`main`** — landing branch (this README only).
- **`baseline`** — Node.js + Express + SQLite authentication system with login, registration, and password management (change / forgot / reset). Includes a minimal HTML/CSS/JS frontend.

## Quick start (from the `baseline` branch)

```powershell
git checkout baseline
npm install
Copy-Item .env.example .env   # then edit JWT_SECRET
npm start
```

Open http://localhost:3000.

See the README on the `baseline` branch for full API and security documentation.
