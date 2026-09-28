# IDOR Mystery (ShopNest CTF lab)

> **WARNING - INTENTIONALLY VULNERABLE.**
> This application contains a deliberate access-control flaw for security
> training. Run it **only** inside an isolated local VM / lab network. Never
> expose it to the internet or deploy it anywhere real. Do not "fix" the bug -
> it is the challenge.

A tiny Node.js + Express e-commerce app used as a CTF exercise for software
developer trainees. No database, no external services.

## Run locally

```bash
npm install
npm start
```

Open <http://localhost:3000>. Set a different port with `PORT=8080 npm start`.

## Run with Docker

```bash
docker build -t idor-mystery .
docker run -p 3000:3000 idor-mystery
```

## Accounts (hand these to trainees)

| Username | Password |
|---|---|
| alice | alice123 |
| bob | bob123 |

Trainees start as `alice`. Do not tell them the vulnerability class.

## Project layout

```
idor-mystery/
├── package.json
├── server.js            # Express app (contains the intentional flaw)
├── public/
│   ├── index.html       # Login page
│   ├── dashboard.html   # Dashboard
│   ├── orders.html      # My Orders list
│   ├── order.html       # Order details page
│   ├── app.js           # Shared front-end helpers (nav, fetch)
│   └── style.css
├── data/
│   └── orders.json      # In-memory seed data (includes the flag order)
├── Dockerfile
├── README.md
└── TRAINER.md           # Solution, flag, and remediation - trainers only
```

## Routes

| Method | Path | Notes |
|---|---|---|
| GET | `/` | Login page |
| POST | `/login` | JSON `{username, password}`; sets session cookie |
| POST | `/logout` | Ends the session |
| GET | `/api/me` | Current user |
| GET | `/dashboard` | Dashboard page (login required) |
| GET | `/orders` | Browser: My Orders page. Non-browser (`Accept: application/json`): the caller's own orders |
| GET | `/orders/:id` | Browser: order details page. Non-browser: order JSON |

Browsers get HTML and API clients (curl, fetch with `Accept: application/json`)
get JSON from the same URL.

## For trainers

See [`TRAINER.md`](TRAINER.md). It covers the objective, vulnerability,
attack path, solution, flag, secure fix, and a secure Express example.
Keep it away from trainees (the Docker image excludes it automatically).

Sessions are held in memory, so restarting the app logs everyone out.
