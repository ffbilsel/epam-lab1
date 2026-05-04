# epam-lab1

EPAM Lab 1 — User Authentication System.

The implementation lives on the [`baseline`](https://github.com/ffbilsel/epam-lab1/tree/baseline) branch.

## Branches

- **`main`** — landing branch (this README only).
- **`baseline`** — Node.js + Express + SQLite authentication system with login, registration, and password management (change / forgot / reset). Includes a minimal HTML/CSS/JS frontend.

## Quick start 

```powershell
git checkout max-precision
Copy-Item .env.example .env   # then edit JWT_SECRET
npm run install:all
npm run dev
```

- API: http://localhost:3000
- Web app: http://localhost:5173

See the README on the `baseline` branch for full API and security documentation.
