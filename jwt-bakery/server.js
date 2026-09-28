/**
 * JWT Bakery — a deliberately vulnerable training application.
 *
 * This server implements its own tiny JWT-like token scheme
 * (header.payload.signature) instead of relying on a battle-tested
 * library end-to-end, so the vulnerability is easy to read and reason
 * about. DO NOT model production code on this file. See TRAINER.md.
 */

const path = require("path");
const crypto = require("crypto");
const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT || 3000;

// Secret used when *issuing* tokens. In this deliberately vulnerable
// app, this secret is never actually checked again on the verify
// path below — see verifyToken().
const SIGNING_SECRET = "secret";

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// ---------------------------------------------------------------------------
// "Database" — hardcoded users. No persistence, no external services.
// ---------------------------------------------------------------------------
const USERS = {
  alice: { password: "alice123", role: "user" },
  // The admin account exists, but its password is not distributed to
  // trainees. Reaching /admin is meant to happen via token
  // manipulation, not by logging in as this account.
  admin: { password: crypto.randomBytes(24).toString("hex"), role: "admin" },
};

// ---------------------------------------------------------------------------
// Base64URL helpers
// ---------------------------------------------------------------------------
function base64urlEncode(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlDecode(input) {
  let str = input.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return Buffer.from(str, "base64").toString("utf8");
}

// ---------------------------------------------------------------------------
// Minimal JWT-like token: header.payload.signature
// ---------------------------------------------------------------------------

/**
 * Issues a signed token. The signature is computed correctly here
 * (HMAC-SHA256 over header + "." + payload, using SIGNING_SECRET),
 * so a freshly issued token looks exactly like a "real" JWT.
 */
function signToken(payload) {
  const header = { alg: "none", typ: "JWT" };
  const headerB64 = base64urlEncode(JSON.stringify(header));
  const payloadB64 = base64urlEncode(JSON.stringify(payload));
  return `${headerB64}.${payloadB64}.`;
}

/**
 * Verifies a token and returns its decoded payload, or null.
 *
 * INTENTIONAL VULNERABILITY:
 * This function checks that the token has the *shape* of a JWT
 * (three dot-separated, base64url, JSON-decodable parts) and that a
 * signature segment is present — but it never recomputes the HMAC
 * over the header/payload and compares it against SIGNING_SECRET.
 * In other words: the payload is *decoded*, not *verified*.
 *
 * Any client that can produce a structurally valid token — including
 * one with a payload it edited by hand — is treated as authentic.
 * This is the same class of bug as calling jwt.decode() where an
 * application meant to call jwt.verify().
 */
function verifyToken(token) {
  if (typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signature] = parts;

  try {
    const header = JSON.parse(base64urlDecode(headerB64));
    const payload = JSON.parse(base64urlDecode(payloadB64));

    // ...and the header must merely *look* like a JWT header.
    if (!header || typeof header !== "object" || !header.alg) return null;
    if (!payload || typeof payload !== "object") return null;
    if (!payload.username || !payload.role) return null;

    return payload;
  } catch (err) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Auth middleware
// ---------------------------------------------------------------------------
function getTokenFromRequest(req) {
  if (req.cookies && req.cookies.token) return req.cookies.token;
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }
  return null;
}

function requireAuth(req, res, next) {
  const token = getTokenFromRequest(req);
  const payload = verifyToken(token);
  if (!payload) {
    return res.redirect("/login");
  }
  req.user = payload;
  req.rawToken = token;
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).type("text/plain").send("Admins only.");
  }
  next();
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = USERS[username];

  if (!user || user.password !== password) {
    return res
      .status(401)
      .type("text/plain")
      .send("Invalid username or password.");
  }

  const token = signToken({ username, role: user.role });

  // Deliberately NOT httpOnly: trainees are meant to be able to read
  // and edit this cookie's value in the browser (or copy it out and
  // manipulate it with curl / jwt.io). Real apps should almost always
  // use httpOnly, Secure, SameSite cookies for session tokens.
  res.cookie("token", token, { httpOnly: false, sameSite: "lax" });

  // Also return it in the JSON body, so the token is easy to grab
  // when testing with curl or a REST client instead of a browser.
  res.json({ token, username, role: user.role });
});

app.get("/dashboard", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

app.get("/admin", requireAuth, requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// Small JSON endpoint the static pages call to render "who am I"
// info (username/role/raw token) without embedding the flag or any
// server secret in client-side JS.
app.get("/api/me", requireAuth, (req, res) => {
  res.json({
    username: req.user.username,
    role: req.user.role,
    token: req.rawToken,
  });
});

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`JWT Bakery is open for business on http://localhost:${PORT}`);
});
