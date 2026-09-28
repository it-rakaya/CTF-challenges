// ============================================================
//  Rakaya Internal Portal  --  "Debug Mode" CTF challenge
//  INTENTIONALLY VULNERABLE. Run only inside an isolated VM/container.
// ============================================================
const express = require('express');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

// Intentionally left in "development" mode, with the secret in the environment.
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.CTF_SECRET = process.env.CTF_SECRET || 'CTF{debug_mode_should_stay_off}';

// Fake internal configuration (part of what leaks)
const appConfig = {
  appName: 'Rakaya Internal Portal',
  version: '2.4.1-internal',
  db: {
    host: 'db.internal.rakaya.local',
    port: 5432,
    name: 'portal_prod',
    user: 'portal_svc',
    password: 'Pr0dPortal!2024'
  },
  cache: { host: 'redis.internal.rakaya.local', port: 6379 }
};

app.use(express.static(path.join(__dirname, 'public')));

// ---------- Normal endpoints ----------
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'rakaya-internal-portal', uptime: Math.round(process.uptime()) });
});

app.get('/profile', (req, res) => {
  res.json({
    name: 'Guest User',
    role: 'Employee',
    department: 'Engineering',
    email: 'guest@rakaya.example'
  });
});

// ---------- Calculator (the vulnerable path) ----------
function parseOperand(value, label) {
  const n = Number(value);
  if (value === undefined || value === '' || Number.isNaN(n)) {
    throw new Error(`Invalid calculation: operand "${label}" is not a number`);
  }
  return n;
}

function add(a, b) {
  return parseOperand(a, 'a') + parseOperand(b, 'b');
}

function calculate(req, res) {
  const result = add(req.query.a, req.query.b);
  res.send(String(result));
}

app.get('/calculate', (req, res) => calculate(req, res));

// ---------- VULNERABILITY: verbose error handler ----------
// Dumps stack trace, environment, and internal config to the client.
app.use((err, req, res, next) => {
  const env = Object.keys(process.env)
    .sort()
    .map((k) => `${k}=${process.env[k]}`)
    .join('\n');

  const body = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>500 - ${escapeHtml(err.message)}</title>
<link rel="stylesheet" href="/style.css"></head>
<body>
<header class="topbar"><span class="brand">Rakaya Internal Portal</span><span class="tag tag-err">DEBUG</span></header>
<main class="container">
<div class="card debug">
<h1>Unhandled Exception</h1>
<p class="muted">${escapeHtml(req.method)} ${escapeHtml(req.originalUrl)}</p>
<h2>Error</h2>
<pre>${escapeHtml(err.name + ': ' + err.message)}</pre>
<h2>Stack Trace</h2>
<pre>${escapeHtml(err.stack)}</pre>
<h2>Request</h2>
<pre>${escapeHtml(JSON.stringify({ query: req.query, headers: req.headers }, null, 2))}</pre>
<h2>Runtime</h2>
<pre>${escapeHtml(JSON.stringify({
    node: process.version,
    platform: process.platform,
    pid: process.pid,
    cwd: process.cwd(),
    mainModule: __filename,
    hostname: os.hostname()
  }, null, 2))}</pre>
<h2>Application Configuration</h2>
<pre>${escapeHtml(JSON.stringify(appConfig, null, 2))}</pre>
<h2>Environment</h2>
<pre>${escapeHtml(env)}</pre>
</div>
</main></body></html>`;

  res.status(500).send(body);
});

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

app.listen(PORT, () => {
  console.log(`Rakaya Internal Portal listening on port ${PORT} (NODE_ENV=${process.env.NODE_ENV})`);
});
