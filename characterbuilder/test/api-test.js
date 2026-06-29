/* ══════════════════════════════════════════════════════════════════════
   Character Builder — API Test Explorer
   Client-side JS that tests connectivity to the TTRPG API via the
   local proxy server and renders results into the endpoint cards.
   ══════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ─── Configuration ───────────────────────────────────────────────── */
  const PROXY_BASE = "http://localhost:4005/api/ttrpg";

  /* ─── State ───────────────────────────────────────────────────────── */
  let currentVersion = null;

  /* ─── Endpoint Definitions ────────────────────────────────────────── */
  const ENDPOINTS = {
    version: {
      path: () => "/version/latest",
      label: "Version",
      parseResult: (data) => ({
        summary: `Version ${data.versionNumber} — "${data.name}"`,
        chips: [{ text: data.versionNumber }, { text: data.name }],
      }),
    },
    ancestries: {
      path: () => `/${currentVersion}/ancestries`,
      label: "Ancestries",
      requiresVersion: true,
      parseResult: (data) => ({
        summary: `${data.length} ancestries found`,
        count: data.length,
        chips: data.slice(0, 6).map((d) => ({
          text: d.name,
          img: d.imageSmUrl || null,
        })),
      }),
    },
    classes: {
      path: () => `/${currentVersion}/classes`,
      label: "Classes",
      requiresVersion: true,
      parseResult: (data) => ({
        summary: `${data.length} classes found`,
        count: data.length,
        chips: data.slice(0, 6).map((d) => ({
          text: `${d.name} (T${d.tier})`,
          img: d.imageSmUrl || null,
        })),
      }),
    },
    "primary-races": {
      path: () => `/${currentVersion}/primary-races`,
      label: "Primary Races",
      requiresVersion: true,
      parseResult: (data) => ({
        summary: `${data.length} primary races found`,
        count: data.length,
        chips: data.slice(0, 6).map((d) => ({
          text: d.name,
          img: d.imageSmUrl || null,
        })),
      }),
    },
    breakthroughs: {
      path: () => `/${currentVersion}/breakthroughs`,
      label: "Breakthroughs",
      requiresVersion: true,
      parseResult: (data) => ({
        summary: `${data.length} breakthroughs found`,
        count: data.length,
        chips: data.slice(0, 6).map((d) => ({
          text: `${d.name} (${d.cost} pts)`,
        })),
      }),
    },
    "true-abilities": {
      path: () => `/${currentVersion}/true-abilities`,
      label: "True Abilities",
      requiresVersion: true,
      parseResult: (data) => ({
        summary: `${data.length} true abilities found`,
        count: data.length,
        chips: data.slice(0, 6).map((d) => ({
          text: d.name,
        })),
      }),
    },
    "key-abilities": {
      path: () => `/${currentVersion}/key-abilities`,
      label: "Key Abilities",
      requiresVersion: true,
      parseResult: (data) => ({
        summary: `${data.length} key abilities found`,
        count: data.length,
        chips: data.slice(0, 6).map((d) => ({
          text: d.name,
        })),
      }),
    },
    items: {
      path: () => `/${currentVersion}/items`,
      label: "Items",
      requiresVersion: true,
      parseResult: (data) => ({
        summary: `${data.length} items found`,
        count: data.length,
        chips: data.slice(0, 6).map((d) => ({
          text: `${d.name} (${d.type})`,
          img: d.imageSmUrl || null,
        })),
      }),
    },
    keywords: {
      path: () => `/${currentVersion}/keywords`,
      label: "Keywords",
      requiresVersion: true,
      parseResult: (data) => ({
        summary: `${data.length} keywords found`,
        count: data.length,
        chips: data.slice(0, 6).map((d) => ({
          text: d.name,
        })),
      }),
    },
    monsters: {
      path: () => `/${currentVersion}/monsters`,
      label: "Bestiary",
      requiresVersion: true,
      parseResult: (data) => ({
        summary: `${data.length} monsters found`,
        count: data.length,
        chips: data.slice(0, 6).map((d) => ({
          text: `${d.name} (DL${d.dangerLevel})`,
          img: d.imageSmUrl || null,
        })),
      }),
    },
    blogs: {
      path: () => "/blogs",
      label: "Blogs",
      parseResult: (data) => ({
        summary: `${data.length} blog posts found`,
        count: data.length,
        chips: data.slice(0, 4).map((d) => ({
          text: d.title,
        })),
      }),
    },
  };

  /* ─── DOM References ──────────────────────────────────────────────── */
  const statusIndicator = document.getElementById("status-indicator");
  const statusVersion = document.getElementById("status-version");
  const btnTestAll = document.getElementById("btn-test-all");

  /* ─── API Fetch Helper ────────────────────────────────────────────── */
  async function apiFetch(path) {
    const url = `${PROXY_BASE}${path}`;
    const startTime = performance.now();

    const res = await fetch(url);
    const elapsed = Math.round(performance.now() - startTime);

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      throw new ApiError(res.status, res.statusText, errorBody, elapsed);
    }

    const data = await res.json();
    return { data, elapsed };
  }

  class ApiError extends Error {
    constructor(status, statusText, body, elapsed) {
      super(`${status} ${statusText}`);
      this.status = status;
      this.statusText = statusText;
      this.body = body;
      this.elapsed = elapsed;
    }
  }

  /* ─── Render Helpers ──────────────────────────────────────────────── */

  /**
   * Build the HTML for a successful result panel.
   */
  function renderSuccess(parsed, rawData, elapsed) {
    const rawId = `raw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    let chipsHtml = "";
    if (parsed.chips && parsed.chips.length) {
      chipsHtml = `<div class="result-samples">
        ${parsed.chips
          .map(
            (c) =>
              `<span class="sample-chip">${
                c.img
                  ? `<img src="${escapeHtml(c.img)}" alt="" loading="lazy">`
                  : ""
              }${escapeHtml(c.text)}</span>`
          )
          .join("")}
      </div>`;
    }

    const countBadge =
      parsed.count !== undefined
        ? `<span class="badge badge-count">${parsed.count} records</span>`
        : "";

    return `
      <div class="result-status">
        <span class="badge badge-success">✅ SUCCESS</span>
        ${countBadge}
        <span class="result-time">${elapsed}ms</span>
      </div>
      ${chipsHtml}
      <button class="result-raw-toggle" onclick="document.getElementById('${rawId}').classList.toggle('open'); this.textContent = this.textContent === 'Show Raw JSON' ? 'Hide Raw JSON' : 'Show Raw JSON';">Show Raw JSON</button>
      <pre class="result-raw" id="${rawId}">${escapeHtml(
      JSON.stringify(rawData, null, 2)
    )}</pre>
    `;
  }

  /**
   * Build the HTML for an error result panel.
   */
  function renderError(err) {
    const elapsed =
      err.elapsed !== undefined ? `<span class="result-time">${err.elapsed}ms</span>` : "";

    return `
      <div class="result-status">
        <span class="badge badge-error">❌ FAILED</span>
        ${elapsed}
      </div>
      <div class="result-error-msg">${escapeHtml(err.message)}${
      err.body ? `\n\n${escapeHtml(err.body)}` : ""
    }</div>
    `;
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ─── Test Single Endpoint ────────────────────────────────────────── */
  async function testEndpoint(key) {
    const def = ENDPOINTS[key];
    if (!def) return;

    const card = document.getElementById(`card-${key}`);
    const resultEl = document.getElementById(`result-${key}`);
    const btn = card.querySelector(".btn-test");

    // If it needs a version and we don't have one yet, fetch it first
    if (def.requiresVersion && !currentVersion) {
      await testEndpoint("version");
      if (!currentVersion) {
        // Version fetch failed — can't continue
        resultEl.innerHTML = renderError(
          new Error("Cannot test: version fetch failed. Fix the version endpoint first.")
        );
        resultEl.classList.add("open");
        card.classList.add("error");
        return;
      }
    }

    // Set loading state
    btn.disabled = true;
    btn.classList.add("loading");
    btn.innerHTML = '<span class="spinner"></span>';
    card.classList.remove("success", "error");

    try {
      const { data, elapsed } = await apiFetch(def.path());
      const parsed = def.parseResult(data);

      // Special: store version
      if (key === "version" && data.versionNumber) {
        currentVersion = data.versionNumber;
        updateStatusBar(true, data.versionNumber);
      }

      resultEl.innerHTML = renderSuccess(parsed, data, elapsed);
      resultEl.classList.add("open");
      card.classList.add("success");
    } catch (err) {
      resultEl.innerHTML = renderError(err);
      resultEl.classList.add("open");
      card.classList.add("error");

      if (key === "version") {
        updateStatusBar(false);
      }
    }

    // Reset button
    btn.disabled = false;
    btn.classList.remove("loading");
    btn.textContent = "Re-test";
  }

  /* ─── Test All Endpoints ──────────────────────────────────────────── */
  async function testAll() {
    btnTestAll.disabled = true;
    btnTestAll.innerHTML = '<span class="spinner"></span> Testing…';

    // Always start with version
    await testEndpoint("version");

    // Then test the rest in sequence (to be kind to the API)
    const otherKeys = Object.keys(ENDPOINTS).filter((k) => k !== "version");
    for (const key of otherKeys) {
      await testEndpoint(key);
      // Small stagger so results animate in
      await new Promise((r) => setTimeout(r, 150));
    }

    btnTestAll.disabled = false;
    btnTestAll.innerHTML = '<span class="btn-icon">⚡</span> Test All Endpoints';
  }

  /* ─── Status Bar Updates ──────────────────────────────────────────── */
  function updateStatusBar(connected, version) {
    statusIndicator.className = "status-indicator " + (connected ? "connected" : "error");
    statusIndicator.querySelector(".status-text").textContent = connected
      ? "Connected"
      : "Connection Failed";

    if (version) {
      statusVersion.textContent = `v${version}`;
      statusVersion.classList.add("visible");
    }
  }

  /* ─── Event Listeners ─────────────────────────────────────────────── */
  document.addEventListener("DOMContentLoaded", () => {
    // Initialize shared utilities
    if (typeof initParticles === "function") {
      initParticles({
        count: 40,
        colors: [
          { r: 223, g: 184, b: 88 },
          { r: 91, g: 181, b: 166 },
          { r: 200, g: 230, b: 210 },
          { r: 255, g: 248, b: 238 },
        ],
      });
    }
    if (typeof initNavbar === "function") initNavbar();
    if (typeof initMobileNav === "function") initMobileNav();
    if (typeof initScrollReveal === "function") initScrollReveal();

    // Individual test buttons
    document.querySelectorAll(".btn-test").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.target;
        if (target) testEndpoint(target);
      });
    });

    // Test All button
    btnTestAll.addEventListener("click", testAll);
  });
})();
