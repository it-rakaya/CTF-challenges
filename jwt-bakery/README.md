# JWT Bakery 🥐

## Story

JWT Bakery just launched its new website. Customers can log in to see
their dashboard, and the bakery's staff have a private area — the
"secret kitchen" at `/admin` — where the day's special recipes are
kept. The bakery's developers were in a hurry launching the login
system, and word around town is that it might not be as solid as they
think.

## How to Start

```bash
npm install
npm start
```

The app will be available at `http://localhost:3000`.

Or with Docker:

```bash
docker build -t jwt-bakery .
docker run -p 3000:3000 jwt-bakery
```

## Basic Application Information

- Built with Node.js + Express, no database, no external services.
- Customer accounts: `alice / alice123` and `bob / bob123`.
- An `admin` account exists, but its credentials are not given to you
  — logging in as `admin` directly is not the intended path.
- Routes: `/`, `/login`, `/dashboard`, `/admin`, `/logout`.
- Logging in issues a session token. Take a close look at how it's
  structured.

## Challenge Objective

Reach `/admin` and retrieve the flag, **without** knowing the admin
account's password.

You are encouraged to:

- Inspect the token you're issued after logging in as `alice` or `bob`.
- Understand its structure: `header.payload.signature`.
- Decode its contents (a tool like [jwt.io](https://jwt.io), or plain
  `base64` on the command line, works fine).
- Think about what the server can and can't check about a token it
  receives back from you.

Good luck, and happy baking.
