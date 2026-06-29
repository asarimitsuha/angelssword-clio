/* ══════════════════════════════════════════════════════════════════════
   TTRPG API Proxy Server
   Forwards requests from the browser to the Angel's Sword TTRPG API.
   Keeps the API key secure on the server side.

   Usage:  npm run proxy
   Runs on: http://localhost:4005
   ══════════════════════════════════════════════════════════════════════ */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const https = require("https");
const http = require("http");

const app = express();
const PORT = process.env.PROXY_PORT || 4005;

const API_KEY = process.env.TTRPG_API_KEY;
const API_BASE = process.env.TTRPG_API_BASE || "https://api.angelssword.com/ttrpg";

if (!API_KEY) {
  console.error("❌  TTRPG_API_KEY is not set in .env — proxy cannot start.");
  process.exit(1);
}

/* ─── CORS — allow local dev servers ────────────────────────────────── */
app.use(
  cors({
    origin: true,
    methods: ["GET"],
  })
);

/* ─── Health check ──────────────────────────────────────────────────── */
app.get("/health", (_req, res) => {
  res.json({ status: "ok", apiBase: API_BASE });
});

/* ─── Serve static data files (e.g. classes-full.json) ──────────────── */
const path = require("path");
app.use("/data", express.static(path.join(__dirname, "characterbuilder", "data")));

/* ─── Proxy all /api/ttrpg/* requests ───────────────────────────────── */
app.get("/api/ttrpg/*", (req, res) => {
  // Strip the /api/ttrpg prefix to get the downstream path
  const downstreamPath = req.path.replace(/^\/api\/ttrpg/, "");
  const targetUrl = `${API_BASE}${downstreamPath}`;

  console.log(`➜  ${req.method} ${req.path}  →  ${targetUrl}`);

  const parsedUrl = new URL(targetUrl);
  const transport = parsedUrl.protocol === "https:" ? https : http;

  const proxyReq = transport.request(
    targetUrl,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 AngelsSword-Clio/1.0",
        Authorization: `Bearer ${API_KEY}`,
      },
    },
    (proxyRes) => {
      let body = "";

      proxyRes.on("data", (chunk) => {
        body += chunk;
      });

      proxyRes.on("end", () => {
        const status = proxyRes.statusCode;

        // Forward the status code
        res.status(status);
        res.set("Content-Type", "application/json");

        // Log result
        if (status >= 200 && status < 300) {
          console.log(`   ✅ ${status} — ${body.length} bytes`);
        } else {
          console.log(`   ⚠️  ${status} — ${body.substring(0, 200)}`);
        }

        res.send(body);
      });
    }
  );

  proxyReq.on("error", (err) => {
    console.error(`   ❌ Proxy error: ${err.message}`);
    res.status(502).json({
      error: "Proxy Error",
      message: `Failed to reach upstream API: ${err.message}`,
    });
  });

  proxyReq.end();
});

/* ─── Start ─────────────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\n⚔  Angel's Sword API Proxy`);
  console.log(`   Listening on: http://localhost:${PORT}`);
  console.log(`   Upstream API: ${API_BASE}`);
  console.log(`   API Key:      ${API_KEY.substring(0, 8)}…\n`);
});
