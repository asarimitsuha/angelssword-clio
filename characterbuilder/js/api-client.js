/* ══════════════════════════════════════════════════════════════════════
   API Client — Fetches game data through the local proxy.
   Caches responses in memory to avoid repeat calls.
   ══════════════════════════════════════════════════════════════════════ */

const ApiClient = (() => {
  "use strict";

  const PROXY_BASE = window.location.hostname === "clio.angelssword.com"
    ? "https://clio-proxy.angelssword.com"
    : "http://localhost:4005";
  const _cache = {};
  let _version = null;

  /* ─── Core fetch with caching ─────────────────────────────────────── */
  async function _get(path) {
    if (_cache[path]) return _cache[path];

    const res = await fetch(`${PROXY_BASE}${path}`);
    if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
    const data = await res.json();
    _cache[path] = data;
    return data;
  }

  /* ─── Get latest version ──────────────────────────────────────────── */
  async function getVersion() {
    if (_version) return _version;
    const data = await _get("/version/latest");
    _version = data.latest || data.version || "0.13.0";
    return _version;
  }

  /* ─── Versioned helpers ───────────────────────────────────────────── */
  async function getPrimaryRaces() {
    const ver = await getVersion();
    return _get(`/${ver}/primary-races`);
  }

  async function getAncestries() {
    const ver = await getVersion();
    return _get(`/${ver}/ancestries`);
  }

  async function getClasses() {
    const ver = await getVersion();
    return _get(`/${ver}/classes`);
  }

  async function getBreakthroughs() {
    const ver = await getVersion();
    return _get(`/${ver}/breakthroughs`);
  }

  async function getKeyAbilities() {
    const ver = await getVersion();
    return _get(`/${ver}/key-abilities`);
  }

  async function getTrueAbilities() {
    const ver = await getVersion();
    return _get(`/${ver}/true-abilities`);
  }

  async function getItems() {
    const ver = await getVersion();
    return _get(`/${ver}/items`);
  }

  async function getTrueAbilitiesByIds(ids) {
    const all = await getTrueAbilities();
    return all.filter((a) => ids.includes(a.trueAbilityId));
  }

  async function getKeywords() {
    const ver = await getVersion();
    return _get(`/${ver}/keywords`);
  }

  async function getClassesFull() {
    if (_cache["__classesFull"]) return _cache["__classesFull"];
    // Try through proxy first (works from file:// protocol), then relative path
    let data;
    try {
      const res = await fetch("http://localhost:4005/data/classes-full.json");
      if (!res.ok) throw new Error(`proxy: ${res.status}`);
      data = await res.json();
    } catch (proxyErr) {
      console.warn("[getClassesFull] proxy failed, trying relative:", proxyErr.message);
      const res2 = await fetch("./data/classes-full.json");
      if (!res2.ok) throw new Error(`classes-full.json: ${res2.status}`);
      data = await res2.json();
    }
    console.log("[getClassesFull] loaded", Array.isArray(data) ? data.length : "?", "classes");
    _cache["__classesFull"] = data;
    return data;
  }

  async function getItemMods() {
    if (_cache["__itemMods"]) return _cache["__itemMods"];
    let data;
    try {
      const res = await fetch("http://localhost:4005/data/items-mods.json");
      if (!res.ok) throw new Error(`proxy: ${res.status}`);
      data = await res.json();
    } catch (proxyErr) {
      console.warn("[getItemMods] proxy failed, trying relative:", proxyErr.message);
      try {
        const res2 = await fetch("./data/items-mods.json");
        if (!res2.ok) throw new Error(`items-mods.json: ${res2.status}`);
        data = await res2.json();
      } catch (relErr) {
        console.warn("[getItemMods] both fetches failed:", relErr.message);
        data = {};
      }
    }
    console.log("[getItemMods] loaded mods for", Object.keys(data).length, "items");
    _cache["__itemMods"] = data;
    return data;
  }

  async function getItemDetail(itemId) {
    const cacheKey = `__item_${itemId}`;
    if (_cache[cacheKey]) return _cache[cacheKey];
    const ver = await getVersion();
    const data = await _get(`/${ver}/item/${itemId}`);
    _cache[cacheKey] = data;
    return data;
  }

  /* ─── Ability lookups by indexId (UUID from class data) ─────────── */
  async function getAbilityByIndexId(indexId) {
    const all = await getTrueAbilities();
    return all.find(a => a.indexId === indexId) || null;
  }

  async function getKeyAbilityByIndexId(indexId) {
    const all = await getKeyAbilities();
    return all.find(a => a.indexId === indexId) || null;
  }

  /* ─── Public API ──────────────────────────────────────────────────── */
  return {
    getVersion,
    getPrimaryRaces,
    getAncestries,
    getClasses,
    getClassesFull,
    getBreakthroughs,
    getKeyAbilities,
    getTrueAbilities,
    getTrueAbilitiesByIds,
    getAbilityByIndexId,
    getKeyAbilityByIndexId,
    getItems,
    getItemMods,
    getItemDetail,
    getKeywords,
  };
})();
