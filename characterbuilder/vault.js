/* ══════════════════════════════════════════════════════════════════════
   Character Vault — "My Characters" page logic
   ══════════════════════════════════════════════════════════════════════ */

(() => {
  "use strict";

  const VAULT_KEY = "angelssword_vault";
  const grid = document.getElementById("vault-grid");
  const emptyState = document.getElementById("vault-empty");

  function loadVault() {
    let vault = [];
    try {
      const raw = localStorage.getItem(VAULT_KEY);
      if (raw) vault = JSON.parse(raw);
    } catch (e) { /* ignore */ }

    if (vault.length === 0) {
      grid.style.display = "none";
      emptyState.style.display = "flex";
      return;
    }

    grid.style.display = "";
    emptyState.style.display = "none";
    grid.innerHTML = "";

    // Sort newest first
    vault.sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || ""));

    for (const char of vault) {
      const card = document.createElement("div");
      card.className = "vault-card";
      card.dataset.vaultId = char.vaultId;

      // Portrait thumbnail
      let portraitHtml = '<div class="vault-card-portrait-placeholder">⚔️</div>';
      if (char.portraitData) {
        portraitHtml = `<img class="vault-card-portrait-img" src="${char.portraitData}" alt="${char.name || "Character"}">`;
      }

      // Race info
      const raceParts = [];
      if (char.race?.primaryRaceName) raceParts.push(char.race.primaryRaceName);
      if (char.race?.ancestryName) raceParts.push(char.race.ancestryName);
      const raceText = raceParts.join(" · ") || "Unknown Race";

      // Class summary
      const classSummary = char.classes?.map(c => c.name).join(", ") || "No classes";

      // Date
      const dateText = char.completedAt
        ? new Date(char.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "";

      card.innerHTML = `
        <div class="vault-card-portrait">${portraitHtml}</div>
        <div class="vault-card-info">
          <div class="vault-card-name">${char.name || "Unnamed"}</div>
          <div class="vault-card-race">${raceText}</div>
          <div class="vault-card-classes">${classSummary}</div>
          ${char.gender ? `<div class="vault-card-gender">${char.gender}</div>` : ""}
          <div class="vault-card-date">${dateText}</div>
        </div>
        <div class="vault-card-actions">
          <button class="vault-card-btn vault-card-view" data-action="view" title="View Sheet">📋</button>
          <button class="vault-card-btn vault-card-delete" data-action="delete" title="Delete">🗑️</button>
        </div>
      `;

      card.addEventListener("click", (e) => {
        const actionBtn = e.target.closest("[data-action]");
        if (actionBtn?.dataset.action === "delete") {
          deleteCharacter(char.vaultId);
          return;
        }
        openCharacterSheet(char);
      });

      grid.appendChild(card);
    }
  }

  function deleteCharacter(vaultId) {
    if (!confirm("Delete this character? This cannot be undone.")) return;
    let vault = [];
    try {
      const raw = localStorage.getItem(VAULT_KEY);
      if (raw) vault = JSON.parse(raw);
    } catch (e) { /* ignore */ }
    vault = vault.filter(c => c.vaultId !== vaultId);
    localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
    loadVault();
  }

  /* ─── Build the same cs-sheet as the builder review phase ──────── */
  function openCharacterSheet(char) {
    const overlay = document.getElementById("vault-detail-overlay");
    const nameEl = document.getElementById("vault-detail-name");
    const bodyEl = document.getElementById("vault-detail-body");

    nameEl.textContent = char.name || "Unnamed Character";

    // Set the "Open Sheet" link to the full sheet page
    const openSheetBtn = document.getElementById("vault-open-sheet-btn");
    if (openSheetBtn) openSheetBtn.href = `sheet.html?id=${encodeURIComponent(char.vaultId)}`;

    // Compute effective stats including class bonuses (identical to sheet.js)
    const baseMainStats = char.effectiveMainStats || char.mainStats || {};
    const baseSubStats = char.effectiveSubStats || char.subStats || {};

    // Aggregate class level bonuses
    const classMainBonuses = {};
    const classSubBonuses = {};
    for (const cls of (char.classes || [])) {
      for (const lb of (cls.levelBonuses || [])) {
        if (lb.type === "main" && lb.statKey) {
          classMainBonuses[lb.statKey] = (classMainBonuses[lb.statKey] || 0) + 1;
        } else if (lb.type === "sub" && lb.statKey) {
          classSubBonuses[lb.statKey] = (classSubBonuses[lb.statKey] || 0) + 1;
        }
      }
    }

    const mainStats = {};
    Character.MAIN_STAT_KEYS.forEach(k => { mainStats[k] = (baseMainStats[k] || 0) + (classMainBonuses[k] || 0); });
    const subStats = {};
    Character.SUB_STAT_KEYS.forEach(k => { subStats[k] = (baseSubStats[k] || 0) + (classSubBonuses[k] || 0); });

    const derived = Character.getDerived({ mainStats, subStats, raceBonuses: { mainStat: null, subStat: null }, classes: char.classes });

    // Apply derived overrides (custom sources from override mode)
    if (char.derivedOverrides) {
      for (const dk in char.derivedOverrides) {
        if (derived[dk] !== undefined) {
          const ct = char.derivedOverrides[dk].reduce((s, cs) => s + cs.amount, 0);
          derived[dk] += ct;
        }
      }
    }

    const statSources = char.statSources || {};

    // ── Portrait ──
    let portraitHtml = "";
    if (char.portraitData) {
      portraitHtml = `<img src="${char.portraitData}" alt="${char.name}" style="width:100%;height:100%;object-fit:cover;">`;
    } else {
      portraitHtml = `<div class="cs-portrait-placeholder" style="position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;"><span class="cs-portrait-icon">⚔️</span></div>`;
    }

    // ── Race line ──
    const raceParts = [];
    if (char.race?.primaryRaceName) raceParts.push(char.race.primaryRaceName);
    if (char.race?.ancestryName) raceParts.push(char.race.ancestryName);
    if (char.race?.demonHouseName) raceParts.push(`House ${char.race.demonHouseName}`);
    if (char.race?.elementalMastery) raceParts.push(`${char.race.elementalMastery} Element`);

    // ── Main stat blocks ──
    function renderStatBlocks(stats, keys, nameMap, type) {
      return keys.map(key => {
        const val = stats[key] || 0;
        const bonused = (type === "main" && char.raceBonuses?.mainStat === key) ||
                        (type === "sub" && char.raceBonuses?.subStat === key);
        const sources = statSources[key];
        const tooltipAttr = sources ? ` data-stat-key="${key}" title="${buildSourceTooltip(key, sources)}"` : "";
        return `<div class="cs-stat-block${bonused ? " has-bonus" : ""}"${tooltipAttr}>
          <div class="cs-stat-value">${val}</div>
          <div class="cs-stat-label">${nameMap[key]}</div>
        </div>`;
      }).join("");
    }

    function buildSourceTooltip(key, sources) {
      if (!sources || !sources.length) return "";
      return sources.map(s => `${s.source}: ${s.label} ${s.amount > 0 ? "+" : ""}${s.amount}`).join("\n");
    }

    // ── Derived stats rows ──
    const derivedRows = [
      [{ icon: "❤️", l: "HP", v: derived.hp }, { icon: "💧", l: "Mana", v: derived.mana }, { icon: "⚡", l: "RP", v: derived.rp }, { icon: "✦", l: "AP", v: derived.ap }],
      [{ icon: "🛡️", l: "Evasion", v: derived.evasion }, { icon: "🔰", l: "Guard", v: derived.guard }, { icon: "🛡️", l: "Save", v: derived.savebonus }, { icon: "⚔️", l: "Initiative", v: derived.initiative }],
      [{ icon: "🎯", l: "Potency", v: derived.potency }, { icon: "👟", l: "Speed", v: derived.speed }],
    ];

    // ── Classes ──
    let classesHtml = "";
    if (char.classes?.length) {
      classesHtml = char.classes.map(cls => {
        const masteredBadge = cls.mastered ? ' <span class="cs-mastered-badge">★ Mastered</span>' : "";
        return `<div class="cs-list-item">
          <span class="cs-list-item-name">${cls.name}${masteredBadge}</span>
          <span class="cs-list-item-meta">Tier ${cls.tier} · Lv ${cls.levels}</span>
        </div>`;
      }).join("");
    } else {
      classesHtml = '<div class="cs-empty">No classes selected</div>';
    }

    // ── Breakthroughs ──
    let btHtml = "";
    if (char.breakthroughs?.length) {
      btHtml = char.breakthroughs.map(bt => `<div class="cs-list-item">
        <span class="cs-list-item-name">${bt.name}</span>
        <span class="cs-list-item-meta">${bt.cost} EXP</span>
      </div>`).join("");
    } else {
      btHtml = '<div class="cs-empty">No breakthroughs selected</div>';
    }

    // ── Skills ──
    const skills = char.skills || {};
    const skillEntries = Object.entries(skills).filter(([, v]) => v.points > 0 || v.expertise?.length > 0);
    skillEntries.sort((a, b) => a[0].localeCompare(b[0]));
    let skillsHtml = "";
    if (skillEntries.length) {
      skillsHtml = skillEntries.map(([name, data]) => {
        let expHtml = "";
        if (data.expertise?.length) {
          expHtml = '<div class="cs-skill-expertise">' +
            data.expertise.map(e => `<span class="cs-expertise-tag">${e.name} ${e.points}</span>`).join("") +
            '</div>';
        }
        return `<div class="cs-skill-cell">
          <div class="cs-skill-header">
            <span class="cs-skill-name">${name}</span>
            <span class="cs-skill-value">${data.points}</span>
          </div>
          ${expHtml}
        </div>`;
      }).join("");
    } else {
      skillsHtml = '<div class="cs-empty">No skills allocated</div>';
    }

    // ── Equipment ──
    const equip = char.equipment || [];
    const climRemaining = char.resources?.clim ?? "";
    let equipHtml = "";
    if (equip.length) {
      equipHtml = equip.map(eq => {
        const modsText = eq.mods?.length ? `<span class="cs-equip-mods">${eq.mods.join(", ")}</span>` : "";
        return `<div class="cs-equip-item">
          <div class="cs-equip-name-col">
            <span class="cs-equip-name">${eq.name}</span>
            ${modsText}
          </div>
          <span class="cs-equip-cost">${eq.cost} Clim</span>
        </div>`;
      }).join("");
    } else {
      equipHtml = '<div class="cs-empty">No equipment purchased</div>';
    }

    // ── Assemble the full cs-sheet ──
    bodyEl.innerHTML = `
      <div class="cs-sheet vault-cs-sheet">

        <!-- Top Row: Portrait + Identity + Stats -->
        <div class="cs-top-row">
          <div class="cs-portrait-frame">
            <div class="cs-portrait-area" style="cursor:default;">${portraitHtml}</div>
          </div>
          <div class="cs-identity-stats">
            <div class="cs-identity">
              <div class="cs-name-display">${char.name || "Unnamed"}</div>
              <div class="cs-identity-row">
                <div class="cs-race-line">${raceParts.join("  ·  ")}</div>
                ${char.gender ? `<div class="cs-gender-display">${char.gender}</div>` : ""}
              </div>
            </div>
            <div class="cs-stat-group">
              <div class="cs-stat-group-title">Main Stats</div>
              <div class="cs-stat-blocks">${renderStatBlocks(mainStats, Character.MAIN_STAT_KEYS, Character.MAIN_STAT_NAMES, "main")}</div>
            </div>
            <div class="cs-stat-group">
              <div class="cs-stat-group-title">Sub Stats</div>
              <div class="cs-stat-blocks">${renderStatBlocks(subStats, Character.SUB_STAT_KEYS, Character.SUB_STAT_NAMES, "sub")}</div>
            </div>
          </div>
        </div>

        <!-- Derived Stats Bar -->
        <div class="cs-derived-bar">
          ${derivedRows.map(row => `<div class="cs-derived-row">${row.map(e =>
            `<div class="cs-derived-stat">
              <span class="cs-derived-icon">${e.icon}</span>
              <span class="cs-derived-value">${e.v ?? "—"}</span>
              <span class="cs-derived-label">${e.l}</span>
            </div>`).join("")}</div>`).join("")}
        </div>

        <!-- Two-Column: Classes + Breakthroughs -->
        <div class="cs-two-col">
          <div class="cs-section">
            <div class="cs-section-title">Classes</div>
            <div class="cs-list">${classesHtml}</div>
          </div>
          <div class="cs-section">
            <div class="cs-section-title">Breakthroughs</div>
            <div class="cs-list">${btHtml}</div>
          </div>
        </div>

        <!-- Skills -->
        <div class="cs-section cs-section-full">
          <div class="cs-section-title">Skills</div>
          <div class="cs-skills-grid">${skillsHtml}</div>
        </div>

        <!-- Equipment -->
        <div class="cs-section cs-section-full">
          <div class="cs-section-title">
            Equipment
            <span class="cs-budget-tag">${climRemaining} Clim remaining</span>
          </div>
          <div class="cs-equip-list">${equipHtml}</div>
        </div>

      </div>
    `;

    // Bind stat hover tooltips
    bodyEl.querySelectorAll("[data-stat-key]").forEach(el => {
      el.addEventListener("mouseenter", showStatSourcePopup);
      el.addEventListener("mouseleave", hideStatSourcePopup);
    });

    overlay.classList.add("open");
  }

  /* ─── Stat Source Hover Popup ────────────────────────────────────── */
  let sourcePopup = null;

  function showStatSourcePopup(e) {
    const el = e.currentTarget;
    const key = el.dataset.statKey;
    const title = el.title;
    if (!title) return;

    hideStatSourcePopup();
    sourcePopup = document.createElement("div");
    sourcePopup.className = "cs-stat-source-popup";
    const lines = title.split("\n");
    sourcePopup.innerHTML = lines.map(l => `<div class="cs-stat-source-line">${l}</div>`).join("");

    document.body.appendChild(sourcePopup);
    const rect = el.getBoundingClientRect();
    sourcePopup.style.left = (rect.left + rect.width / 2) + "px";
    sourcePopup.style.top = (rect.bottom + 6) + "px";
  }

  function hideStatSourcePopup() {
    if (sourcePopup) {
      sourcePopup.remove();
      sourcePopup = null;
    }
  }

  // Close modal
  document.getElementById("vault-detail-close").addEventListener("click", () => {
    document.getElementById("vault-detail-overlay").classList.remove("open");
  });
  document.getElementById("vault-detail-overlay").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) e.currentTarget.classList.remove("open");
  });

  // Init
  loadVault();
})();
