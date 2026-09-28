/*
 * IDOR Mystery - INTENTIONALLY VULNERABLE training application.
 * Run ONLY inside an isolated lab / VM. Do not deploy anywhere real.
 */
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');

// ---- In-memory data ------------------------------------------------------
const users = {
  alice: { password: 'alice123' },
  bob: { password: 'bob123' }
};
const orders = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data', 'orders.json'), 'utf8')
);
const sessions = new Map(); // sid -> username

// ---- Helpers -------------------------------------------------------------
function parseCookies(header) {
  const out = {};
  (header || '').split(';').forEach((part) => {
    const i = part.indexOf('=');
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

// Browsers navigating to a URL get the HTML page; API clients (fetch with
// Accept: application/json, curl, etc.) get JSON from the very same route.
function wantsHtml(req) {
  return req.accepts(['json', 'html']) === 'html';
}

// ---- Middleware ----------------------------------------------------------
app.use(express.json());

app.use((req, res, next) => {
  const sid = parseCookies(req.headers.cookie).sid;
  const username = sid ? sessions.get(sid) : null;
  req.user = username ? { username } : null;
  next();
});

function requireLogin(req, res, next) {
  if (req.user) return next();
  if (wantsHtml(req)) return res.redirect('/');
  return res.status(401).json({ error: 'Not authenticated' });
}

// ---- Auth ----------------------------------------------------------------
app.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = users[username];
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  const sid = crypto.randomBytes(24).toString('hex');
  sessions.set(sid, username);
  res.setHeader('Set-Cookie', `sid=${sid}; HttpOnly; Path=/; SameSite=Lax`);
  res.json({ ok: true, username });
});

app.post('/logout', (req, res) => {
  const sid = parseCookies(req.headers.cookie).sid;
  if (sid) sessions.delete(sid);
  res.setHeader('Set-Cookie', 'sid=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0');
  res.json({ ok: true });
});

app.get('/api/me', requireLogin, (req, res) => {
  res.json({ username: req.user.username });
});

// ---- Pages ---------------------------------------------------------------
app.get('/', (req, res) => res.sendFile(path.join(PUBLIC, 'index.html')));

app.get('/dashboard', requireLogin, (req, res) =>
  res.sendFile(path.join(PUBLIC, 'dashboard.html'))
);

// Keep direct access to the protected page files from bypassing the login redirect
app.get(['/dashboard.html', '/orders.html', '/order.html'], (req, res) =>
  res.redirect('/dashboard')
);

// ---- Orders --------------------------------------------------------------
// List: only the logged-in user's own orders.
app.get('/orders', requireLogin, (req, res) => {
  if (wantsHtml(req)) return res.sendFile(path.join(PUBLIC, 'orders.html'));
  const mine = orders.filter((o) => o.owner === req.user.username);
  res.set('Cache-Control', 'no-store');
  res.json(mine);
});

// Detail.
// !!! INTENTIONALLY VULNERABLE (IDOR / BOLA) !!!
// The order is looked up by id only. There is NO check that the order
// belongs to the logged-in user. Do not "fix" this - it is the challenge.
app.get('/orders/:id', requireLogin, (req, res) => {
  if (wantsHtml(req)) return res.sendFile(path.join(PUBLIC, 'order.html'));
  const order = orders.find((o) => o.id === Number(req.params.id));
  res.set('Cache-Control', 'no-store');
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// ---- Static assets & 404 -------------------------------------------------
app.use(express.static(PUBLIC, { index: false }));

app.use((req, res) => {
  if (wantsHtml(req)) return res.status(404).send('Page not found');
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ShopNest (IDOR Mystery lab) listening on http://0.0.0.0:${PORT}`);
});
