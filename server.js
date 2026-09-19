#!/usr/bin/env node
/* ==========================================================================
   The Madras Diaries — content server
   --------------------------------------------------------------------------
   Serves the public site and a password-protected admin that writes the JSON
   files in content/. No npm dependencies — Node's standard library only.

     node server.js                     start on port 3000
     PORT=8080 node server.js           start on another port
     node server.js --set-password      set or change the admin password

   The password is stored in content/.auth.json as a scrypt hash with a random
   salt. The plain password is never written to disk.
   ========================================================================== */

"use strict";

const http = require("http");
const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const crypto = require("crypto");

const ROOT = __dirname;
const CONTENT = path.join(ROOT, "content");
const MEDIA = path.join(CONTENT, "media");
const AUTH_FILE = path.join(CONTENT, ".auth.json");
const PORT = process.env.PORT || 3000;
/* Set TRUST_PROXY=1 when something terminates TLS in front of this (Caddy,
   nginx, Render, Railway, Cloudflare). Off by default: trusting the header
   unconditionally would let anyone spoof their address past the rate limit. */
const TRUST_PROXY = process.env.TRUST_PROXY === "1";

/* Which JSON files the admin is allowed to read and write. Anything not on
   this list is rejected, so a crafted name can't reach another file. */
const DOCS = ["site", "theme", "text", "menu", "deals", "specials"];

const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif",
  ".mp4": "video/mp4", ".webm": "video/webm", ".ico": "image/x-icon",
  ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8",
};

/* ------------------------------------------------------------------ auth */

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

async function readAuth() {
  try { return JSON.parse(await fsp.readFile(AUTH_FILE, "utf8")); }
  catch { return null; }
}

async function setPassword(password) {
  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  const salt = crypto.randomBytes(16).toString("hex");
  await fsp.mkdir(CONTENT, { recursive: true });
  await fsp.writeFile(AUTH_FILE, JSON.stringify({
    salt, hash: hashPassword(password, salt), updated: new Date().toISOString(),
  }, null, 2));
  await fsp.chmod(AUTH_FILE, 0o600).catch(() => {});
}

async function checkPassword(password) {
  const auth = await readAuth();
  if (!auth) return false;
  const candidate = Buffer.from(hashPassword(String(password || ""), auth.salt), "hex");
  const stored = Buffer.from(auth.hash, "hex");
  /* Constant-time compare so a wrong password can't be found by timing. */
  return candidate.length === stored.length && crypto.timingSafeEqual(candidate, stored);
}

/* Sessions live in memory: restarting the server logs everyone out, which is
   the right default for a single-restaurant admin. */
const sessions = new Map();
const SESSION_MS = 1000 * 60 * 60 * 8;

function newSession() {
  const id = crypto.randomBytes(32).toString("hex");
  sessions.set(id, { created: Date.now() });
  return id;
}

function validSession(req) {
  const cookie = req.headers.cookie || "";
  const m = /(?:^|;\s*)md_session=([a-f0-9]{64})/.exec(cookie);
  if (!m) return false;
  const s = sessions.get(m[1]);
  if (!s) return false;
  if (Date.now() - s.created > SESSION_MS) { sessions.delete(m[1]); return false; }
  return m[1];
}

function clientIp(req) {
  if (TRUST_PROXY) {
    const fwd = req.headers["x-forwarded-for"];
    if (fwd) return String(fwd).split(",")[0].trim();
  }
  return req.socket.remoteAddress || "?";
}

/* Throttle login attempts so the password can't be guessed at speed. */
const attempts = new Map();
function rateLimited(ip) {
  const a = attempts.get(ip);
  if (!a) return false;
  if (Date.now() - a.first > 15 * 60 * 1000) { attempts.delete(ip); return false; }
  return a.count >= 10;
}
function noteFailure(ip) {
  const a = attempts.get(ip) || { first: Date.now(), count: 0 };
  a.count++;
  attempts.set(ip, a);
}

/* ---------------------------------------------------------------- helpers */

function send(res, status, body, headers = {}) {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(String(body));
  res.writeHead(status, Object.assign({
    "Content-Length": buf.length,
    "X-Content-Type-Options": "nosniff",
  }, headers));
  res.end(buf);
}

const json = (res, status, obj, headers = {}) =>
  send(res, status, JSON.stringify(obj),
       Object.assign({ "Content-Type": "application/json; charset=utf-8" }, headers));

function readBody(req, limit = 60 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", c => {
      size += c.length;
      if (size > limit) { reject(new Error("Body too large")); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

/* ------------------------------------------------------------------ media */

const MEDIA_TYPES = {
  "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp",
  "image/gif": ".gif", "image/svg+xml": ".svg",
  "video/mp4": ".mp4", "video/webm": ".webm",
};

async function saveMedia(body, contentType, filename) {
  const ext = MEDIA_TYPES[contentType];
  if (!ext) throw new Error("Unsupported file type: " + contentType);
  const safe = String(filename || "upload")
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "upload";
  const name = safe + "-" + crypto.randomBytes(4).toString("hex") + ext;
  await fsp.mkdir(MEDIA, { recursive: true });
  await fsp.writeFile(path.join(MEDIA, name), body);
  return "content/media/" + name;
}

/* ----------------------------------------------------------------- routes */

async function handleApi(req, res, url) {
  const ip = clientIp(req);

  if (url.pathname === "/api/login" && req.method === "POST") {
    if (rateLimited(ip)) return json(res, 429, { error: "Too many attempts. Try again in 15 minutes." });
    let password;
    try { password = JSON.parse(await readBody(req, 4096)).password; } catch { return json(res, 400, { error: "Bad request" }); }
    if (!(await readAuth())) return json(res, 503, { error: "No admin password set. Run: node server.js --set-password" });
    if (!(await checkPassword(password))) { noteFailure(ip); return json(res, 401, { error: "Wrong password" }); }
    attempts.delete(ip);
    const id = newSession();
    return json(res, 200, { ok: true }, {
      "Set-Cookie": `md_session=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MS / 1000}`,
    });
  }

  if (url.pathname === "/api/logout" && req.method === "POST") {
    const id = validSession(req);
    if (id) sessions.delete(id);
    return json(res, 200, { ok: true }, { "Set-Cookie": "md_session=; HttpOnly; Path=/; Max-Age=0" });
  }

  if (url.pathname === "/api/session") {
    return json(res, 200, { authenticated: !!validSession(req), configured: !!(await readAuth()) });
  }

  /* Everything past here needs a valid session. */
  if (!validSession(req)) return json(res, 401, { error: "Not signed in" });

  if (url.pathname === "/api/password" && req.method === "POST") {
    let b;
    try { b = JSON.parse(await readBody(req, 4096)); } catch { return json(res, 400, { error: "Bad request" }); }
    if (!(await checkPassword(b.current))) return json(res, 401, { error: "Current password is wrong" });
    try { await setPassword(b.next); } catch (e) { return json(res, 400, { error: e.message }); }
    return json(res, 200, { ok: true });
  }

  const docMatch = /^\/api\/content\/([a-z]+)$/.exec(url.pathname);
  if (docMatch) {
    const name = docMatch[1];
    if (!DOCS.includes(name)) return json(res, 404, { error: "Unknown document" });
    const file = path.join(CONTENT, name + ".json");

    if (req.method === "GET") {
      try { return send(res, 200, await fsp.readFile(file), { "Content-Type": MIME[".json"] }); }
      catch { return json(res, 404, { error: "Not found" }); }
    }

    if (req.method === "PUT") {
      let parsed;
      try { parsed = JSON.parse((await readBody(req, 8 * 1024 * 1024)).toString("utf8")); }
      catch { return json(res, 400, { error: "That isn't valid JSON" }); }
      /* Keep the previous version so a bad edit can be rolled back. */
      try { await fsp.copyFile(file, file + ".bak"); } catch {}
      /* Write to a temp file and rename, so a crash mid-write can't leave a
         half-written file that breaks the site. */
      const tmp = file + ".tmp";
      await fsp.writeFile(tmp, JSON.stringify(parsed, null, 2) + "\n");
      await fsp.rename(tmp, file);
      return json(res, 200, { ok: true, saved: name });
    }
  }

  if (url.pathname === "/api/media" && req.method === "POST") {
    const type = (req.headers["content-type"] || "").split(";")[0].trim();
    const name = req.headers["x-filename"] || "upload";
    let body;
    try { body = await readBody(req); } catch (e) { return json(res, 413, { error: e.message }); }
    try { return json(res, 200, { ok: true, path: await saveMedia(body, type, name) }); }
    catch (e) { return json(res, 400, { error: e.message }); }
  }

  if (url.pathname === "/api/media" && req.method === "GET") {
    try {
      const files = await fsp.readdir(MEDIA);
      return json(res, 200, { files: files.filter(f => f[0] !== ".").map(f => "content/media/" + f) });
    } catch { return json(res, 200, { files: [] }); }
  }

  return json(res, 404, { error: "Unknown endpoint" });
}

async function serveStatic(req, res, url) {
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith("/")) rel += "index.html";
  const full = path.join(ROOT, rel);
  /* Never serve outside the project, and never serve the auth file. */
  if (!full.startsWith(ROOT + path.sep) && full !== path.join(ROOT, "index.html")) {
    return send(res, 403, "Forbidden");
  }
  if (path.basename(full).startsWith(".")) return send(res, 404, "Not found");

  try {
    const stat = await fsp.stat(full);
    if (stat.isDirectory()) return send(res, 404, "Not found");
    const ext = path.extname(full).toLowerCase();
    const etag = `"${stat.size}-${stat.mtimeMs}"`;
    if (req.headers["if-none-match"] === etag) return send(res, 304, "");
    return send(res, 200, await fsp.readFile(full), {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "ETag": etag,
      "Cache-Control": ext === ".json" || ext === ".html" ? "no-cache" : "public, max-age=3600",
    });
  } catch {
    return send(res, 404, "Not found");
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://" + (req.headers.host || "localhost"));
  try {
    if (url.pathname.startsWith("/api/")) return await handleApi(req, res, url);
    return await serveStatic(req, res, url);
  } catch (err) {
    console.error(err);
    return json(res, 500, { error: "Server error" });
  }
});

/* ------------------------------------------------------------------- CLI */

async function main() {
  if (process.argv.includes("--set-password")) {
    const fromArg = process.argv[process.argv.indexOf("--set-password") + 1];
    const pw = fromArg && !fromArg.startsWith("--") ? fromArg : process.env.ADMIN_PASSWORD;
    if (!pw) {
      console.error("Usage: node server.js --set-password 'your-password'");
      console.error("   or: ADMIN_PASSWORD='your-password' node server.js --set-password");
      process.exit(1);
    }
    try { await setPassword(pw); console.log("Admin password set. Start the server with: node server.js"); }
    catch (e) { console.error(e.message); process.exit(1); }
    return;
  }

  if (!(await readAuth())) {
    if (process.env.ADMIN_PASSWORD) {
      try {
        await setPassword(process.env.ADMIN_PASSWORD);
        console.log("  Admin password set from ADMIN_PASSWORD.");
      } catch (e) {
        console.error("  ADMIN_PASSWORD rejected: " + e.message);
      }
    } else {
      console.log("\n  No admin password set yet. Either run:");
      console.log("    node server.js --set-password 'your-password'");
      console.log("  or start the server with ADMIN_PASSWORD set.\n");
    }
  }

  if (!TRUST_PROXY && process.env.NODE_ENV === "production") {
    console.log("  Note: behind a proxy? Set TRUST_PROXY=1 so login rate\n" +
                "  limiting sees real visitor addresses.\n");
  }

  server.listen(PORT, () => {
    console.log(`\n  The Madras Diaries`);
    console.log(`  site   http://localhost:${PORT}/`);
    console.log(`  admin  http://localhost:${PORT}/admin.html\n`);
  });
}

if (require.main === module) main();
module.exports = { server, setPassword, checkPassword };
