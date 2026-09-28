# Debug Mode

**Category:** Web / Information Disclosure  **Difficulty:** Easy

Welcome to the **Rakaya Internal Portal**, a small internal tool used by employees.
Something on this server knows more than it should. Your goal is to capture the flag.

Flag format: `CTF{...}`

> **WARNING:** This application is *intentionally vulnerable*. Run it only inside an
> isolated local VM or container. Never deploy it to a shared or public network.

## Run locally

```bash
npm install
npm start
```

Then open <http://localhost:3000>.

## Run with Docker

```bash
docker build -t debug-mode .
docker run --rm -p 3000:3000 debug-mode
```

## Rules

- Stay within the application running on your assigned instance.
- Use only a browser and/or `curl`.
- Do not attack the host machine or other trainees.

Good luck!
