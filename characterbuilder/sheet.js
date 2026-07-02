/* ══════════════════════════════════════════════════════════════════════
   Character Sheet — Full standalone view (sheet.html)
   Reads character from localStorage vault by URL ?id= param.
   Replicates the builder review phase with interactive tooltips,
   portrait controls, and gender selector.
   ══════════════════════════════════════════════════════════════════════ */

(() => {
  "use strict";

  const VAULT_KEY = "angelssword_vault";

  /* ─── Hoisted declarations (must be before init) ──────────────────── */
  let portraitImg = null;
  let portraitZoom = 1, portraitPanX = 0, portraitPanY = 0;
  let portraitDragging = false, portraitLastX = 0, portraitLastY = 0;

  const TAB_ORDER = ["stats", "abilities", "inventory", "proficiencies"];

  const ABILITY_LEVEL_MAP = [
    { level: 1, idKey: "keyAbilityId", nameKey: "keyAbilityName", label: "Key Ability", isKey: true },
    { level: 2, idKey: "ability1Id", nameKey: "ability1Name", label: "Ability 1", isKey: false },
    { level: 4, idKey: "ability2Id", nameKey: "ability2Name", label: "Ability 2", isKey: false },
    { level: 6, idKey: "ability3Id", nameKey: "ability3Name", label: "Ability 3", isKey: false },
    { level: 8, idKey: "ultimateAbilityId", nameKey: "ultimateAbilityName", label: "Ultimate", isKey: false },
  ];

  let statSourcePopup = null;

  const BAG_CONFIG = {
    "alchemy-rig":        { capacity: 2,  accepts: ["Elixir", "Flask", "Potion", "Salve", "Poison"] },
    "alchemy-rig--deluxe-": { capacity: 5, accepts: ["Elixir", "Flask", "Potion", "Salve", "Poison"] },
    "fuel-cartridge-pack": { capacity: 20, accepts: ["Fuel Shell", "Small Shell", "Medium Shell"] },
  };
  const _burdenCache = {};   // itemId → { burden, imageUrl }
  const CONSUMABLE_TYPES = ["Elixir", "Flask", "Potion", "Salve", "Poison", "Small Shell", "Medium Shell", "Fuel Shell"];

  /* ─── Load character from vault ──────────────────────────────────── */
  const params = new URLSearchParams(window.location.search);
  const vaultId = params.get("id");

  if (!vaultId) {
    document.getElementById("sheet-root").innerHTML =
      '<div class="cs-tip-loading" style="padding:60px;text-align:center;">No character ID specified.<br><a href="vault.html" style="color:var(--clr-gold);">← Back to vault</a></div>';
    return;
  }

  let vault = [];
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    if (raw) vault = JSON.parse(raw);
  } catch (e) { /* ignore */ }

  const charIndex = vault.findIndex(c => c.vaultId === vaultId);
  if (charIndex === -1) {
    document.getElementById("sheet-root").innerHTML =
      '<div class="cs-tip-loading" style="padding:60px;text-align:center;">Character not found.<br><a href="vault.html" style="color:var(--clr-gold);">← Back to vault</a></div>';
    return;
  }

  const char = vault[charIndex];
  document.title = `${char.name || "Unnamed"} — Angel's Sword`;

  /* ─── Save helper ────────────────────────────────────────────────── */
  function saveToVault() {
    vault[charIndex] = char;
    localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
  }

  /* ─── Render ─────────────────────────────────────────────────────── */
  const root = document.getElementById("sheet-root");
  renderSheet(char, root);
  bindPortraitEvents(char);
  bindGenderEvents(char);
  bindTooltipEvents(char, root);
  bindExpControls(char);
  bindOverrideMode(char);
  bindRenameEvents(char, saveToVault);
  bindTabNavigation();
  renderAbilitiesPage(char);
  renderInventoryPage(char, saveToVault);
  updateEquippedSection(char, saveToVault);
  renderProficienciesPage(char, saveToVault);

  /* ═══════════════════════════════════════════════════════════════════
     RENDER SHEET
     ═══════════════════════════════════════════════════════════════════ */
  function renderSheet(char, container) {
    // ── Compute effective stats including class bonuses ──
    const baseMainStats = char.effectiveMainStats || char.mainStats || {};
    const baseSubStats = char.effectiveSubStats || char.subStats || {};

    // Aggregate class level bonuses
    const classMainBonuses = {};
    const classSubBonuses = {};
    const classBonusSources = {}; // key -> [{source, value}]
    for (const cls of (char.classes || [])) {
      for (const lb of (cls.levelBonuses || [])) {
        if (lb.type === "main" && lb.statKey) {
          classMainBonuses[lb.statKey] = (classMainBonuses[lb.statKey] || 0) + 1;
          if (!classBonusSources[lb.statKey]) classBonusSources[lb.statKey] = [];
          classBonusSources[lb.statKey].push({ source: `${cls.name} (L${lb.level} Soul)`, value: 1 });
        } else if (lb.type === "sub" && lb.statKey) {
          classSubBonuses[lb.statKey] = (classSubBonuses[lb.statKey] || 0) + 1;
          if (!classBonusSources[lb.statKey]) classBonusSources[lb.statKey] = [];
          classBonusSources[lb.statKey].push({ source: `${cls.name} (L${lb.level} Heart)`, value: 1 });
        }
      }
    }

    // Final effective stats = base + class bonuses
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

    // ── Race line ──
    let raceParts;
    if (char.race?.isHybrid) {
      const prefix = char.race.hybridDisplayPrefix || "Hybrid";
      const subrace = char.race.ancestryName || "";
      raceParts = [`${prefix} ${subrace}`.trim()];
    } else {
      raceParts = [];
      if (char.race?.primaryRaceName) raceParts.push(char.race.primaryRaceName);
      if (char.race?.ancestryName) raceParts.push(char.race.ancestryName);
      if (char.race?.demonHouseName) raceParts.push(`House ${char.race.demonHouseName}`);
      if (char.race?.elementalMastery) raceParts.push(`${char.race.elementalMastery} Element`);
    }

    // ── Stat blocks ──
    function renderStatBlocks(stats, keys, nameMap, type) {
      return keys.map(key => {
        const val = stats[key] || 0;
        const bonused = (type === "main" && char.raceBonuses?.mainStat === key) ||
                        (type === "sub" && char.raceBonuses?.subStat === key);
        const hasClassBonus = (type === "main" && classMainBonuses[key]) || (type === "sub" && classSubBonuses[key]);
        return `<div class="cs-stat-block${bonused ? " has-bonus" : ""}${hasClassBonus ? " has-class-bonus" : ""}" data-stat-key="${key}" data-stat-type="${type}" style="cursor:pointer;">
          <div class="cs-stat-value">${val}</div>
          <div class="cs-stat-label">${nameMap[key]}</div>
        </div>`;
      }).join("");
    }

    // ── Derived stats ──
    const derivedRows = [
      [{ icon: "❤️", l: "HP", k: "hp", v: derived.hp }, { icon: "💧", l: "Mana", k: "mana", v: derived.mana }, { icon: "⚡", l: "RP", k: "rp", v: derived.rp }, { icon: "✦", l: "AP", k: "ap", v: derived.ap }],
      [{ icon: "🛡️", l: "Evasion", k: "evasion", v: derived.evasion }, { icon: "🔰", l: "Guard", k: "guard", v: derived.guard }, { icon: "🛡️", l: "Save", k: "savebonus", v: derived.savebonus }, { icon: "⚔️", l: "Initiative", k: "initiative", v: derived.initiative }],
      [{ icon: "🎯", l: "Potency", k: "potency", v: derived.potency }, { icon: "👟", l: "Speed", k: "speed", v: derived.speed }],
    ];

    // ── Classes ──
    let classesHtml = "";
    if (char.classes?.length) {
      classesHtml = char.classes.map(cls => {
        const masteredBadge = cls.mastered ? ' <span class="cs-mastered-badge">★ Mastered</span>' : "";
        return `<div class="cs-list-item" data-type="class" data-id="${cls.classId}">
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
      btHtml = char.breakthroughs.map(bt => `<div class="cs-list-item" data-type="breakthrough" data-id="${bt.breakthroughId}">
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
        return `<div class="cs-skill-cell" data-type="skill" data-id="${name}">
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

    // ── Gender buttons ──
    const genderOptions = ["Male", "Female", "N/A"];
    const genderCollapsed = !!char.gender;
    const genderBtns = genderOptions.map(g =>
      `<button class="cs-gender-btn${char.gender === g ? " active" : ""}" data-gender="${g}"${genderCollapsed && char.gender !== g ? ' style="display:none;"' : ''}>${g}</button>`
    ).join("");
    const genderDisplay = genderCollapsed
      ? `<span class="cs-gender-chosen" id="cs-gender-chosen" title="Click to change">${char.gender}</span>`
      : "";

    // ── Assemble ──
    container.innerHTML = `
      <!-- Top Row: Portrait + Identity + Stats -->
      <div class="cs-top-row">
        <div class="cs-portrait-frame">
          <div class="cs-portrait-area" id="cs-portrait-area">
            <canvas id="cs-portrait-canvas" width="220" height="280"></canvas>
            <div class="cs-portrait-placeholder" id="cs-portrait-placeholder">
              <span class="cs-portrait-icon">📷</span>
              <span class="cs-portrait-label">Upload Portrait</span>
            </div>
            <input type="file" id="cs-portrait-input" accept="image/*" style="display:none;">
          </div>
          <div class="cs-portrait-controls" id="cs-portrait-controls" style="display:none;">
            <button class="cs-portrait-btn" id="cs-zoom-in" title="Zoom In">+</button>
            <button class="cs-portrait-btn" id="cs-zoom-out" title="Zoom Out">−</button>
            <button class="cs-portrait-btn" id="cs-portrait-reset" title="Reset">↺</button>
            <button class="cs-portrait-btn cs-portrait-btn-change" id="cs-portrait-change" title="Change Image">📷</button>
            <button class="cs-portrait-btn cs-portrait-btn-commit" id="cs-portrait-commit" title="Lock Portrait">✓</button>
          </div>
          <div class="cs-portrait-controls cs-portrait-locked" id="cs-portrait-locked" style="display:none;">
            <span class="cs-portrait-locked-label">Portrait Locked</span>
            <button class="cs-portrait-btn cs-portrait-btn-change" id="cs-portrait-edit" title="Edit Portrait">✎</button>
          </div>
        </div>
        <div class="cs-identity-stats">
          <div class="cs-identity">
            <div class="cs-name-display" id="cs-char-name" contenteditable="true" spellcheck="false" title="Click to rename">${char.name || "Unnamed"}</div>
            <div class="cs-identity-row">
              <div class="cs-race-line">${raceParts.join("  ·  ")}</div>
              <div class="cs-gender-select" id="cs-gender-select">
                <label class="cs-gender-label">Gender</label>
                ${genderDisplay}
                <div class="cs-gender-options${genderCollapsed ? ' collapsed' : ''}" id="cs-gender-options">${genderBtns}</div>
              </div>
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
          `<div class="cs-derived-stat" data-derived-key="${e.k}" style="cursor:pointer;">
            <span class="cs-derived-icon">${e.icon}</span>
            <span class="cs-derived-value">${e.v ?? "—"}</span>
            <span class="cs-derived-label">${e.l}</span>
          </div>`).join("")}</div>`).join("")}
      </div>

      <!-- Soul Core + EXP -->
      <div class="cs-sc-exp-bar" id="cs-sc-exp-bar">
        <div class="cs-sc-block">
          <div class="cs-sc-icon">✦</div>
          <div class="cs-sc-value" id="cs-sc-value">${Character.calculateSC(char)}</div>
          <div class="cs-sc-label">Soul Core</div>
        </div>
        <div class="cs-exp-info">
          <span class="cs-exp-item"><span class="cs-exp-item-label">Total EXP</span> <span class="cs-exp-item-value cs-exp-editable" id="cs-exp-total">${char.totalExp || Character.calculateStartingExp(char)}</span></span>
          <span class="cs-exp-divider">·</span>
          <span class="cs-exp-item"><span class="cs-exp-item-label">Spent</span> <span class="cs-exp-item-value">${Character.calculateSC(char)}</span></span>
          <span class="cs-exp-divider">·</span>
          <span class="cs-exp-item"><span class="cs-exp-item-label">Unspent</span> <span class="cs-exp-item-value" id="cs-exp-unspent">${(char.totalExp || Character.calculateStartingExp(char)) - Character.calculateSC(char)}</span></span>
          <span class="cs-exp-divider">·</span>
          <span class="cs-exp-adjust">
            <button class="cs-exp-btn" id="cs-exp-minus" title="−25 EXP">−</button>
            <button class="cs-exp-btn" id="cs-exp-plus" title="+25 EXP">+</button>
          </span>
          <span class="cs-exp-divider">·</span>
          <button class="spend-exp-btn" id="cs-spend-exp" title="Spend EXP on Classes or Breakthroughs">✦ Spend EXP</button>
          <button class="override-btn" id="cs-override-btn" title="Override Mode: Manually edit stats and skills">⚙ Override</button>
        </div>
      </div>

      <!-- Two-Column: Classes + Breakthroughs -->
      <div class="cs-two-col">
        <div class="cs-section">
          <div class="cs-section-title">Classes</div>
          <div class="cs-list" id="cs-classes-list">${classesHtml}</div>
        </div>
        <div class="cs-section">
          <div class="cs-section-title">Breakthroughs</div>
          <div class="cs-list" id="cs-bt-list">${btHtml}</div>
        </div>
      </div>

      <!-- Skills -->
      <div class="cs-section cs-section-full">
        <div class="cs-section-title">Skills</div>
        <div class="cs-skills-grid" id="cs-skills-grid">${skillsHtml}</div>
      </div>

      <!-- Equipped -->
      <div class="cs-section cs-section-full equipped-section" id="equipped-section">
        <div class="cs-section-title">Equipped</div>
        <div id="equipped-content"><div class="cs-empty">Loading…</div></div>
      </div>
    `;

    // Bind stat hover tooltips
    bindStatHovers(char, container);
    bindDerivedStatHovers(char, container);
  }

  /* ═══════════════════════════════════════════════════════════════════
     PORTRAIT SYSTEM
     ═══════════════════════════════════════════════════════════════════ */

  function bindPortraitEvents(char) {
    const canvas = document.getElementById("cs-portrait-canvas");
    if (!canvas) { console.warn("[portrait] canvas not found"); return; }
    const ctx = canvas.getContext("2d");
    const placeholder = document.getElementById("cs-portrait-placeholder");
    const controls = document.getElementById("cs-portrait-controls");
    const fileInput = document.getElementById("cs-portrait-input");
    if (!placeholder || !controls || !fileInput) { console.warn("[portrait] missing elements"); return; }
    let portraitLocked = false;

    // Click to upload
    placeholder.addEventListener("click", () => fileInput.click());
    canvas.addEventListener("click", () => { if (!portraitImg) fileInput.click(); });
    document.getElementById("cs-portrait-change").addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          portraitImg = img;
          portraitZoom = 1;
          portraitPanX = 0;
          portraitPanY = 0;
          const scaleX = canvas.width / img.width;
          const scaleY = canvas.height / img.height;
          portraitZoom = Math.max(scaleX, scaleY);
          portraitPanX = (canvas.width - img.width * portraitZoom) / 2;
          portraitPanY = (canvas.height - img.height * portraitZoom) / 2;
          drawPortrait();
          placeholder.style.display = "none";
          controls.style.display = "flex";
          portraitLocked = false;
          document.getElementById("cs-portrait-locked").style.display = "none";
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });

    // Zoom
    document.getElementById("cs-zoom-in").addEventListener("click", () => {
      if (!portraitImg || portraitLocked) return;
      portraitZoom *= 1.15;
      portraitPanX = (canvas.width - portraitImg.width * portraitZoom) / 2;
      portraitPanY = (canvas.height - portraitImg.height * portraitZoom) / 2;
      drawPortrait();
    });
    document.getElementById("cs-zoom-out").addEventListener("click", () => {
      if (!portraitImg || portraitLocked) return;
      portraitZoom *= 0.87;
      portraitPanX = (canvas.width - portraitImg.width * portraitZoom) / 2;
      portraitPanY = (canvas.height - portraitImg.height * portraitZoom) / 2;
      drawPortrait();
    });
    document.getElementById("cs-portrait-reset").addEventListener("click", () => {
      if (!portraitImg || portraitLocked) return;
      const scaleX = canvas.width / portraitImg.width;
      const scaleY = canvas.height / portraitImg.height;
      portraitZoom = Math.max(scaleX, scaleY);
      portraitPanX = (canvas.width - portraitImg.width * portraitZoom) / 2;
      portraitPanY = (canvas.height - portraitImg.height * portraitZoom) / 2;
      drawPortrait();
    });

    // Mouse wheel zoom
    canvas.addEventListener("wheel", (e) => {
      if (!portraitImg || portraitLocked) return;
      e.preventDefault();
      const oldZoom = portraitZoom;
      portraitZoom *= e.deltaY < 0 ? 1.1 : 0.91;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      portraitPanX = mx - (mx - portraitPanX) * (portraitZoom / oldZoom);
      portraitPanY = my - (my - portraitPanY) * (portraitZoom / oldZoom);
      drawPortrait();
    });

    // Drag to pan
    canvas.addEventListener("mousedown", (e) => {
      if (!portraitImg || portraitLocked) return;
      portraitDragging = true;
      portraitLastX = e.clientX;
      portraitLastY = e.clientY;
      canvas.style.cursor = "grabbing";
    });
    window.addEventListener("mousemove", (e) => {
      if (!portraitDragging) return;
      portraitPanX += e.clientX - portraitLastX;
      portraitPanY += e.clientY - portraitLastY;
      portraitLastX = e.clientX;
      portraitLastY = e.clientY;
      drawPortrait();
    });
    window.addEventListener("mouseup", () => {
      if (portraitDragging) {
        portraitDragging = false;
        canvas.style.cursor = "grab";
      }
    });

    // Touch support
    canvas.addEventListener("touchstart", (e) => {
      if (!portraitImg || portraitLocked || e.touches.length !== 1) return;
      portraitDragging = true;
      portraitLastX = e.touches[0].clientX;
      portraitLastY = e.touches[0].clientY;
    }, { passive: true });
    canvas.addEventListener("touchmove", (e) => {
      if (!portraitDragging || e.touches.length !== 1) return;
      e.preventDefault();
      portraitPanX += e.touches[0].clientX - portraitLastX;
      portraitPanY += e.touches[0].clientY - portraitLastY;
      portraitLastX = e.touches[0].clientX;
      portraitLastY = e.touches[0].clientY;
      drawPortrait();
    }, { passive: false });
    canvas.addEventListener("touchend", () => { portraitDragging = false; });

    // Commit / Lock
    document.getElementById("cs-portrait-commit").addEventListener("click", () => {
      portraitLocked = true;
      controls.style.display = "none";
      document.getElementById("cs-portrait-locked").style.display = "flex";
      canvas.style.cursor = "default";
      char.portraitData = canvas.toDataURL("image/png");
      saveToVault();
    });
    document.getElementById("cs-portrait-edit").addEventListener("click", () => {
      portraitLocked = false;
      controls.style.display = "flex";
      document.getElementById("cs-portrait-locked").style.display = "none";
      canvas.style.cursor = "grab";
    });

    // Restore saved portrait
    if (char.portraitData) {
      const img = new Image();
      img.onload = () => {
        portraitImg = img;
        const scaleX = canvas.width / img.width;
        const scaleY = canvas.height / img.height;
        portraitZoom = Math.max(scaleX, scaleY);
        portraitPanX = (canvas.width - img.width * portraitZoom) / 2;
        portraitPanY = (canvas.height - img.height * portraitZoom) / 2;
        drawPortrait();
        placeholder.style.display = "none";
        portraitLocked = true;
        controls.style.display = "none";
        document.getElementById("cs-portrait-locked").style.display = "flex";
        canvas.style.cursor = "default";
      };
      img.src = char.portraitData;
    }
  }

  function drawPortrait() {
    const canvas = document.getElementById("cs-portrait-canvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!portraitImg) return;
    ctx.drawImage(portraitImg, portraitPanX, portraitPanY, portraitImg.width * portraitZoom, portraitImg.height * portraitZoom);
  }

  /* ═══════════════════════════════════════════════════════════════════
     GENDER SELECTOR
     ═══════════════════════════════════════════════════════════════════ */
  function bindGenderEvents(char) {
    // Use document-level delegation so events survive renderSheet() DOM replacement
    document.addEventListener("click", (e) => {
      // Handle clicking a gender button
      const btn = e.target.closest(".cs-gender-btn");
      if (btn) {
        const container = document.getElementById("cs-gender-options");
        if (!container) return;
        container.querySelectorAll(".cs-gender-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        char.gender = btn.dataset.gender;
        saveToVault();

        // Collapse: hide non-selected buttons, show chosen label
        container.querySelectorAll(".cs-gender-btn").forEach(b => {
          b.style.display = b.dataset.gender === char.gender ? "" : "none";
        });
        container.classList.add("collapsed");

        // Update or create the chosen label
        const selectEl = document.getElementById("cs-gender-select");
        if (selectEl) {
          let chosenEl = document.getElementById("cs-gender-chosen");
          if (!chosenEl) {
            chosenEl = document.createElement("span");
            chosenEl.className = "cs-gender-chosen";
            chosenEl.id = "cs-gender-chosen";
            chosenEl.title = "Click to change";
            const label = selectEl.querySelector(".cs-gender-label");
            if (label) label.after(chosenEl);
          }
          chosenEl.textContent = char.gender;
        }
        return;
      }

      // Handle clicking the chosen gender label -> expand
      const chosenEl = e.target.closest(".cs-gender-chosen");
      if (chosenEl) {
        const container = document.getElementById("cs-gender-options");
        if (!container) return;
        // Show all buttons
        container.querySelectorAll(".cs-gender-btn").forEach(b => {
          b.style.display = "";
        });
        container.classList.remove("collapsed");
        // Remove the chosen label
        chosenEl.remove();
        return;
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════════════
     EXP CONTROLS (+/- and click-to-edit)
     ═══════════════════════════════════════════════════════════════════ */
  function bindExpControls(char) {
    const totalEl = document.getElementById("cs-exp-total");
    const unspentEl = document.getElementById("cs-exp-unspent");
    const minusBtn = document.getElementById("cs-exp-minus");
    const plusBtn = document.getElementById("cs-exp-plus");
    if (!totalEl || !minusBtn || !plusBtn) return;

    // Initialize totalExp if not set
    if (!char.totalExp) {
      char.totalExp = Character.calculateStartingExp(char);
    }

    function refreshExpDisplay() {
      const sc = Character.calculateSC(char);
      totalEl.textContent = char.totalExp;
      if (unspentEl) unspentEl.textContent = char.totalExp - sc;
    }

    // +/- buttons in increments of 25
    plusBtn.addEventListener("click", () => {
      char.totalExp += 25;
      refreshExpDisplay();
      saveToVault();
    });
    minusBtn.addEventListener("click", () => {
      const sc = Character.calculateSC(char);
      char.totalExp = Math.max(sc, char.totalExp - 25); // can't go below spent
      refreshExpDisplay();
      saveToVault();
    });

    // Click total EXP value to direct-edit
    totalEl.addEventListener("click", () => {
      const current = char.totalExp;
      const input = document.createElement("input");
      input.type = "number";
      input.value = current;
      input.className = "cs-exp-inline-input";
      input.min = Character.calculateSC(char);
      input.step = 25;
      totalEl.textContent = "";
      totalEl.appendChild(input);
      input.focus();
      input.select();

      const commit = () => {
        const val = parseInt(input.value) || current;
        const sc = Character.calculateSC(char);
        char.totalExp = Math.max(sc, val);
        refreshExpDisplay();
        saveToVault();
      };
      input.addEventListener("blur", commit);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); input.blur(); }
        if (e.key === "Escape") { input.value = current; input.blur(); }
      });
    });

    // Spend EXP button
    document.getElementById("cs-spend-exp")?.addEventListener("click", () => {
      openSpendExpChooser(char, saveToVault, refreshExpDisplay);
    });
  }

  /* ═══════════════════════════════════════════════════════════════════
     OVERRIDE MODE — inline editing of stats and skills
     ═══════════════════════════════════════════════════════════════════ */
  var overrideActive = false;

  function bindOverrideMode(char) {
    const btn = document.getElementById("cs-override-btn");
    if (!btn) return;
    const root = document.getElementById("character-sheet");

    btn.addEventListener("click", () => {
      overrideActive = !overrideActive;
      btn.classList.toggle("active", overrideActive);
      if (root) root.classList.toggle("cs-override-active", overrideActive);

      if (overrideActive) {
        enableSkillEditing(char);
      } else {
        disableSkillEditing();
      }
    });
  }

  function enableStatEditing(char) {
    document.querySelectorAll(".cs-stat-block").forEach(block => {
      const valueEl = block.querySelector(".cs-stat-value");
      if (!valueEl) return;
      valueEl.contentEditable = "true";
      valueEl.classList.add("cs-editable");

      valueEl.addEventListener("focus", function () {
        this._prevVal = parseInt(this.textContent) || 0;
      });

      valueEl.addEventListener("blur", function () {
        const newVal = parseInt(this.textContent) || 0;
        const oldVal = this._prevVal || 0;
        const delta = newVal - oldVal;
        if (delta === 0) return;

        const key = block.dataset.statKey;
        const type = block.dataset.statType;

        if (type === "main") {
          if (!char.mainStats) char.mainStats = {};
          if (!char.effectiveMainStats) char.effectiveMainStats = {};
          char.mainStats[key] = (char.mainStats[key] || 0) + delta;
          char.effectiveMainStats[key] = (char.effectiveMainStats[key] || 0) + delta;
        } else {
          if (!char.subStats) char.subStats = {};
          if (!char.effectiveSubStats) char.effectiveSubStats = {};
          char.subStats[key] = (char.subStats[key] || 0) + delta;
          char.effectiveSubStats[key] = (char.effectiveSubStats[key] || 0) + delta;
        }

        if (!char.statSources) char.statSources = {};
        if (!char.statSources[key]) char.statSources[key] = [];
        const existing = char.statSources[key].find(s => s.source === "Custom" && s.label === "Override");
        if (existing) {
          existing.amount += delta;
          if (existing.amount === 0) {
            char.statSources[key] = char.statSources[key].filter(s => s !== existing);
          }
        } else {
          char.statSources[key].push({ source: "Custom", label: "Override", amount: delta });
        }

        if (!char.customOverrides) char.customOverrides = { stats: {} };
        if (!char.customOverrides.stats) char.customOverrides.stats = {};
        if (!char.customOverrides.stats[key]) {
          char.customOverrides.stats[key] = { type, amount: delta };
        } else {
          char.customOverrides.stats[key].amount += delta;
        }

        saveToVault();
      });

      valueEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); valueEl.blur(); }
      });
    });
  }

  function disableStatEditing() {
    document.querySelectorAll(".cs-stat-value.cs-editable").forEach(el => {
      el.contentEditable = "false";
      el.classList.remove("cs-editable");
    });
  }

  function enableSkillEditing(char) {
    const grid = document.getElementById("cs-skills-grid");
    if (!grid) return;

    grid.querySelectorAll(".cs-skill-cell").forEach(cell => {
      const name = cell.dataset.id;
      const valueEl = cell.querySelector(".cs-skill-value");
      if (valueEl) {
        valueEl.contentEditable = "true";
        valueEl.classList.add("cs-editable");
        valueEl.addEventListener("focus", function () { this._prev = parseInt(this.textContent) || 0; });
        valueEl.addEventListener("blur", function () {
          const newVal = Math.max(0, parseInt(this.textContent) || 0);
          this.textContent = newVal;
          if (!char.skills) char.skills = {};
          if (!char.skills[name]) char.skills[name] = { points: 0, expertise: [] };
          char.skills[name].points = newVal;
          saveToVault();
        });
        valueEl.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); valueEl.blur(); } });
      }

      // Delete skill button
      if (!cell.querySelector(".cs-override-del-skill-btn")) {
        const delBtn = document.createElement("button");
        delBtn.className = "cs-override-del-skill-btn";
        delBtn.textContent = "\u00d7";
        delBtn.title = "Remove skill";
        delBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (char.skills && char.skills[name]) {
            delete char.skills[name];
            saveToVault();
            overrideRefreshSkills(char);
          }
        });
        const header = cell.querySelector(".cs-skill-header");
        if (header) header.appendChild(delBtn);
      }

      // Delete expertise buttons
      cell.querySelectorAll(".cs-expertise-tag").forEach((tag, idx) => {
        if (!tag.querySelector(".cs-override-del-exp-btn")) {
          const delExp = document.createElement("button");
          delExp.className = "cs-override-del-exp-btn";
          delExp.textContent = "\u00d7";
          delExp.title = "Remove expertise";
          delExp.addEventListener("click", (e) => {
            e.stopPropagation();
            if (char.skills && char.skills[name] && char.skills[name].expertise) {
              char.skills[name].expertise.splice(idx, 1);
              saveToVault();
              overrideRefreshSkills(char);
            }
          });
          tag.appendChild(delExp);
        }
      });

      if (!cell.querySelector(".cs-override-add-exp-btn")) {
        const addExpBtn = document.createElement("button");
        addExpBtn.className = "cs-override-add-exp-btn";
        addExpBtn.textContent = "+exp";
        addExpBtn.title = "Add expertise";
        addExpBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          showAddExpertiseInput(cell, name, char);
        });
        cell.appendChild(addExpBtn);
      }
    });

    if (!grid.querySelector(".cs-override-add-skill-btn")) {
      const addBtn = document.createElement("button");
      addBtn.className = "cs-override-add-skill-btn";
      addBtn.innerHTML = "+ Add Skill";
      addBtn.addEventListener("click", () => showAddSkillInput(grid, char));
      grid.appendChild(addBtn);
    }
  }

  function disableSkillEditing() {
    const grid = document.getElementById("cs-skills-grid");
    if (!grid) return;
    grid.querySelectorAll(".cs-skill-value.cs-editable").forEach(el => {
      el.contentEditable = "false";
      el.classList.remove("cs-editable");
    });
    grid.querySelectorAll(".cs-override-add-exp-btn, .cs-override-add-skill-btn, .cs-override-input-row, .cs-override-del-skill-btn, .cs-override-del-exp-btn").forEach(el => el.remove());
  }

  function showAddSkillInput(grid, char) {
    grid.querySelectorAll(".cs-override-input-row").forEach(el => el.remove());
    const row = document.createElement("div");
    row.className = "cs-override-input-row";
    row.innerHTML = '<input type="text" class="cs-override-text-input" placeholder="Skill name..." maxlength="40">' +
      '<input type="number" class="cs-override-num-input" placeholder="Pts" min="0" max="99" value="1">' +
      '<button class="cs-override-confirm-btn">\u2713</button>' +
      '<button class="cs-override-cancel-btn">\u2715</button>';
    grid.appendChild(row);
    const nameInput = row.querySelector(".cs-override-text-input");
    nameInput.focus();

    row.querySelector(".cs-override-confirm-btn").addEventListener("click", () => {
      const name = nameInput.value.trim();
      const pts = parseInt(row.querySelector(".cs-override-num-input").value) || 1;
      if (!name) return;
      if (!char.skills) char.skills = {};
      if (!char.skills[name]) char.skills[name] = { points: 0, expertise: [] };
      char.skills[name].points += pts;
      saveToVault();
      overrideRefreshSkills(char);
    });
    row.querySelector(".cs-override-cancel-btn").addEventListener("click", () => row.remove());
    nameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") row.querySelector(".cs-override-confirm-btn").click();
      if (e.key === "Escape") row.remove();
    });
  }

  function showAddExpertiseInput(cell, skillName, char) {
    cell.querySelectorAll(".cs-override-input-row").forEach(el => el.remove());
    const row = document.createElement("div");
    row.className = "cs-override-input-row";
    row.innerHTML = '<input type="text" class="cs-override-text-input" placeholder="Expertise name..." maxlength="40">' +
      '<input type="number" class="cs-override-num-input" placeholder="Pts" min="1" max="99" value="2">' +
      '<button class="cs-override-confirm-btn">\u2713</button>' +
      '<button class="cs-override-cancel-btn">\u2715</button>';
    cell.appendChild(row);
    const nameInput = row.querySelector(".cs-override-text-input");
    nameInput.focus();

    row.querySelector(".cs-override-confirm-btn").addEventListener("click", () => {
      const expName = nameInput.value.trim();
      const pts = parseInt(row.querySelector(".cs-override-num-input").value) || 2;
      if (!expName) return;
      if (!char.skills) char.skills = {};
      if (!char.skills[skillName]) char.skills[skillName] = { points: 0, expertise: [] };
      char.skills[skillName].expertise.push({ name: expName, points: pts });
      saveToVault();
      overrideRefreshSkills(char);
    });
    row.querySelector(".cs-override-cancel-btn").addEventListener("click", () => row.remove());
    nameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") row.querySelector(".cs-override-confirm-btn").click();
      if (e.key === "Escape") row.remove();
    });
  }

  function overrideRefreshSkills(char) {
    const grid = document.getElementById("cs-skills-grid");
    if (!grid || !char.skills) return;
    const entries = Object.entries(char.skills).filter(([_, v]) => v.points > 0 || v.expertise?.length > 0);
    entries.sort((a, b) => a[0].localeCompare(b[0]));
    if (entries.length > 0) {
      grid.innerHTML = entries.map(([name, data]) => {
        let expHtml = '';
        if (data.expertise?.length) {
          expHtml = '<div class="cs-skill-expertise">' +
            data.expertise.map(e => `<span class="cs-expertise-tag">${e.name} ${e.points}</span>`).join('') +
            '</div>';
        }
        return `<div class="cs-skill-cell" data-type="skill" data-id="${name}">
          <div class="cs-skill-header">
            <span class="cs-skill-name">${name}</span>
            <span class="cs-skill-value">${data.points}</span>
          </div>
          ${expHtml}
        </div>`;
      }).join('');
    } else {
      grid.innerHTML = '<div class="cs-empty">No skills allocated</div>';
    }
    if (overrideActive) enableSkillEditing(char);
  }

    /* ═══════════════════════════════════════════════════════════════════
     STAT SOURCE HOVER
     ═══════════════════════════════════════════════════════════════════ */
  // statSourcePopup hoisted to top of IIFE

  function bindStatHovers(char, container) {
    container.querySelectorAll("[data-stat-key]").forEach(el => {
      el.addEventListener("mouseenter", (e) => showStatSourceHover(e, char, el.dataset.statKey, el.dataset.statType));
      el.addEventListener("mouseleave", hideStatSourceHover);
    });
  }

  function showStatSourceHover(e, char, key, type) {
    hideStatSourceHover();
    const nameMap = type === "main" ? Character.MAIN_STAT_NAMES : Character.SUB_STAT_NAMES;
    const stats = type === "main" ? (char.effectiveMainStats || char.mainStats) : (char.effectiveSubStats || char.subStats);
    const totalVal = stats[key] || 0;

    const lines = [`${nameMap[key]} ${totalVal}`];

    if ((type === "main" && char.raceBonuses?.mainStat === key) ||
        (type === "sub" && char.raceBonuses?.subStat === key)) {
      lines.push(`  Race: ${char.race?.primaryRaceName || "Race"} +1`);
    }

    const sources = char.statSources?.[key] || [];
    for (const s of sources) {
      lines.push(`  ${s.source}: ${s.label} ${s.amount > 0 ? "+" : ""}${s.amount}`);
    }

    const bonusTotal = ((type === "main" && char.raceBonuses?.mainStat === key) ||
                        (type === "sub" && char.raceBonuses?.subStat === key) ? 1 : 0)
                       + sources.reduce((sum, s) => sum + s.amount, 0);
    const baseAlloc = totalVal - bonusTotal;
    if (baseAlloc > 0) lines.push(`  Base: Allocated +${baseAlloc}`);

    statSourcePopup = document.createElement("div");
    statSourcePopup.className = "cs-stat-source-popup";
    statSourcePopup.innerHTML = lines.map(l => `<div class="cs-stat-source-line">${l}</div>`).join("");
    document.body.appendChild(statSourcePopup);

    const rect = e.currentTarget.getBoundingClientRect();
    statSourcePopup.style.left = (rect.left + rect.width / 2) + "px";
    statSourcePopup.style.top = (rect.bottom + 6) + "px";
  }

  function hideStatSourceHover() {
    if (statSourcePopup) { statSourcePopup.remove(); statSourcePopup = null; }
  }

  /* ── Derived stat formula descriptions ──────────────────────────── */
  const DERIVED_FORMULAS = {
    hp:         { label: "HP",         formula: (m, s) => `20 base + Toughness(${m.toughness || 0}) × 10`, stat: "toughness", type: "main", base: 20, mult: 10 },
    mana:       { label: "Mana",       formula: (m, s) => `6 base + Power(${m.power || 0})`, stat: "power", type: "main", base: 6, mult: 1 },
    rp:         { label: "RP",         formula: (m, s) => `2 base + Agility(${m.agility || 0})`, stat: "agility", type: "main", base: 2, mult: 1 },
    evasion:    { label: "Evasion",    formula: (m, s) => `7 base + Agility(${m.agility || 0})`, stat: "agility", type: "main", base: 7, mult: 1 },
    potency:    { label: "Potency",    formula: (m, s) => `11 base + Focus(${m.focus || 0})`, stat: "focus", type: "main", base: 11, mult: 1 },
    guard:      { label: "Guard",      formula: (m, s) => `Toughness(${m.toughness || 0})`, stat: "toughness", type: "main", base: 0, mult: 1 },
    initiative: { label: "Initiative", formula: (m, s) => `Agility(${m.agility || 0})`, stat: "agility", type: "main", base: 0, mult: 1 },
    savebonus:  { label: "Save",       formula: (m, s) => `Toughness(${m.toughness || 0})`, stat: "toughness", type: "main", base: 0, mult: 1 },
    ap:         { label: "AP",         formula: () => `4 (fixed)`, stat: null, base: 4, mult: 0 },
    speed:      { label: "Speed",      formula: () => `20 (fixed)`, stat: null, base: 20, mult: 0 },
  };

  function bindDerivedStatHovers(char, container) {
    container.querySelectorAll("[data-derived-key]").forEach(el => {
      el.addEventListener("mouseenter", (e) => showDerivedSourceHover(e, char, el.dataset.derivedKey));
      el.addEventListener("mouseleave", hideStatSourceHover);
    });
  }

  function showDerivedSourceHover(e, char, key) {
    hideStatSourceHover();
    const info = DERIVED_FORMULAS[key];
    if (!info) return;

    const baseMainStats = char.effectiveMainStats || char.mainStats || {};
    const baseSubStats = char.effectiveSubStats || char.subStats || {};
    const classMainBonuses = {};
    for (const cls of (char.classes || [])) {
      for (const lb of (cls.levelBonuses || [])) {
        if (lb.type === "main" && lb.statKey) classMainBonuses[lb.statKey] = (classMainBonuses[lb.statKey] || 0) + 1;
      }
    }
    const mainStats = {};
    Character.MAIN_STAT_KEYS.forEach(k => { mainStats[k] = (baseMainStats[k] || 0) + (classMainBonuses[k] || 0); });
    const subStats = {};
    Character.SUB_STAT_KEYS.forEach(k => { subStats[k] = (baseSubStats[k] || 0); });

    const baseDerived = Character.getDerived({ mainStats, subStats, raceBonuses: { mainStat: null, subStat: null }, classes: char.classes });
    const baseVal = baseDerived[key] || 0;

    const lines = [`${info.label}`];
    lines.push(`  Formula: ${info.formula(mainStats, subStats)}`);

    // Key ability HP bonus
    if (key === "hp") {
      let keyAbilityHp = 0;
      for (const cls of (char.classes || [])) {
        if (cls.keyAbilityHpBonus) {
          keyAbilityHp += cls.keyAbilityHpBonus;
          lines.push(`  ${cls.name}: Key Ability +${cls.keyAbilityHpBonus}`);
        }
      }
    }

    // Custom overrides
    const overrides = char.derivedOverrides?.[key] || [];
    for (const ov of overrides) {
      lines.push(`  ${ov.source}: ${ov.label} ${ov.amount >= 0 ? "+" : ""}${ov.amount}`);
    }

    const overrideTotal = overrides.reduce((s, o) => s + o.amount, 0);
    const total = baseVal + overrideTotal;
    lines.push(`  Total: ${total}`);

    statSourcePopup = document.createElement("div");
    statSourcePopup.className = "cs-stat-source-popup";
    statSourcePopup.innerHTML = lines.map(l => `<div class="cs-stat-source-line">${l}</div>`).join("");
    document.body.appendChild(statSourcePopup);

    const rect = e.currentTarget.getBoundingClientRect();
    statSourcePopup.style.left = (rect.left + rect.width / 2) + "px";
    statSourcePopup.style.top = (rect.bottom + 6) + "px";
  }

  /* ═══════════════════════════════════════════════════════════════════
     TOOLTIP EVENTS — clicking classes, breakthroughs, items, skills
     ═══════════════════════════════════════════════════════════════════ */
  function getStatSources(char, key, type) {
    const sources = [];
    // Base stat
    const base = type === "main" ? (char.mainStats?.[key] || 0) : (char.subStats?.[key] || 0);
    if (base > 0) sources.push({ source: "Base (Creation)", value: base });
    // Race bonus
    if (type === "main" && char.raceBonuses?.mainStat === key && char.raceBonuses.mainVal) {
      sources.push({ source: `Race (${char.race?.primaryRaceName || "Race"})`, value: char.raceBonuses.mainVal });
    }
    if (type === "sub" && char.raceBonuses?.subStat === key && char.raceBonuses.subVal) {
      sources.push({ source: `Race (${char.race?.primaryRaceName || "Race"})`, value: char.raceBonuses.subVal });
    }
    // Class level bonuses
    for (const cls of (char.classes || [])) {
      for (const lb of (cls.levelBonuses || [])) {
        if (lb.statKey === key && lb.type === type) {
          const label = lb.type === "sub" ? `${cls.name} (L${lb.level} Heart)` : `${cls.name} (L${lb.level} Soul)`;
          sources.push({ source: label, value: 1 });
        }
      }
    }
    return sources;
  }

  function bindTooltipEvents(char, container) {
    const overlay = document.getElementById("cs-tooltip-overlay");
    const titleEl = document.getElementById("cs-tooltip-title");
    const bodyEl = document.getElementById("cs-tooltip-body");
    const closeBtn = document.getElementById("cs-tooltip-close");

    closeBtn.addEventListener("click", () => overlay.classList.remove("open"));
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.classList.remove("open"); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") overlay.classList.remove("open"); });

    container.addEventListener("click", (e) => {
      // Stat block click → show sources (with override editing)
      const statBlock = e.target.closest(".cs-stat-block");
      if (statBlock) {
        const key = statBlock.dataset.statKey;
        const type = statBlock.dataset.statType;
        const nameMap = type === "main" ? Character.MAIN_STAT_NAMES : Character.SUB_STAT_NAMES;
        const sources = getStatSources(char, key, type);
        const total = sources.reduce((s, src) => s + src.value, 0);
        titleEl.textContent = nameMap[key] || key;

        let html = '<div class="cs-tip-row" style="margin-bottom:8px;"><strong>Sources:</strong></div>';
        for (const src of sources) {
          html += `<div class="cs-tip-row cs-tip-indent">• ${src.source}: <strong>${src.value >= 0 ? "+" : ""}${src.value}</strong></div>`;
        }

        // Custom sources from statSources
        const customSources = (char.statSources?.[key] || []).filter(s => s.source === "Custom");
        if (customSources.length > 0) {
          for (let ci = 0; ci < customSources.length; ci++) {
            const cs = customSources[ci];
            html += `<div class="cs-tip-row cs-tip-indent cs-tip-custom-source">• Custom (${cs.label}): <strong>${cs.amount >= 0 ? "+" : ""}${cs.amount}</strong>`;
            if (overrideActive) {
              html += ` <button class="cs-override-del-source-btn" data-source-idx="${ci}" title="Remove source">\u00d7</button>`;
            }
            html += `</div>`;
          }
        }

        const grandTotal = total + customSources.reduce((s, cs) => s + cs.amount, 0);
        html += `<div class="cs-tip-row" style="margin-top:8px;border-top:1px solid var(--clr-border);padding-top:8px;"><strong>Total: ${grandTotal}</strong></div>`;

        if (overrideActive) {
          html += '<div class="cs-override-add-source-form" style="margin-top:10px;border-top:1px solid var(--clr-border);padding-top:10px;">';
          html += '<div style="margin-bottom:6px;font-size:0.75rem;color:#e6a032;font-weight:600;">Add Custom Source</div>';
          html += '<div class="cs-override-input-row">';
          html += '<input type="text" class="cs-override-text-input" id="cs-override-source-name" placeholder="Source name..." maxlength="40">';
          html += '<input type="number" class="cs-override-num-input" id="cs-override-source-val" placeholder="+/-" value="1">';
          html += '<button class="cs-override-confirm-btn" id="cs-override-source-add">\u2713</button>';
          html += '</div></div>';
        }

        bodyEl.innerHTML = html;

        // Bind override source interactions
        if (overrideActive) {
          bodyEl.querySelectorAll(".cs-override-del-source-btn").forEach(btn => {
            btn.addEventListener("click", (ev) => {
              ev.stopPropagation();
              const idx = parseInt(btn.dataset.sourceIdx);
              const customs = (char.statSources?.[key] || []).filter(s => s.source === "Custom");
              if (customs[idx]) {
                const cs = customs[idx];
                if (type === "main") {
                  if (char.mainStats) char.mainStats[key] = (char.mainStats[key] || 0) - cs.amount;
                  if (char.effectiveMainStats) char.effectiveMainStats[key] = (char.effectiveMainStats[key] || 0) - cs.amount;
                } else {
                  if (char.subStats) char.subStats[key] = (char.subStats[key] || 0) - cs.amount;
                  if (char.effectiveSubStats) char.effectiveSubStats[key] = (char.effectiveSubStats[key] || 0) - cs.amount;
                }
                char.statSources[key] = char.statSources[key].filter(s => s !== cs);
                const valEl = statBlock.querySelector(".cs-stat-value");
                if (valEl) {
                  const nv = type === "main" ? (char.effectiveMainStats?.[key] || char.mainStats?.[key] || 0) : (char.effectiveSubStats?.[key] || char.subStats?.[key] || 0);
                  valEl.textContent = nv;
                }
                saveToVault();
                statBlock.click();
              }
            });
          });

          const addBtn = document.getElementById("cs-override-source-add");
          const nameIn = document.getElementById("cs-override-source-name");
          const valIn = document.getElementById("cs-override-source-val");
          if (addBtn && nameIn && valIn) {
            const doAdd = () => {
              const label = nameIn.value.trim();
              const amount = parseInt(valIn.value) || 0;
              if (!label || amount === 0) return;
              if (!char.statSources) char.statSources = {};
              if (!char.statSources[key]) char.statSources[key] = [];
              char.statSources[key].push({ source: "Custom", label: label, amount: amount });
              if (type === "main") {
                if (!char.mainStats) char.mainStats = {};
                if (!char.effectiveMainStats) char.effectiveMainStats = {};
                char.mainStats[key] = (char.mainStats[key] || 0) + amount;
                char.effectiveMainStats[key] = (char.effectiveMainStats[key] || 0) + amount;
              } else {
                if (!char.subStats) char.subStats = {};
                if (!char.effectiveSubStats) char.effectiveSubStats = {};
                char.subStats[key] = (char.subStats[key] || 0) + amount;
                char.effectiveSubStats[key] = (char.effectiveSubStats[key] || 0) + amount;
              }
              const valEl = statBlock.querySelector(".cs-stat-value");
              if (valEl) {
                const nv = type === "main" ? (char.effectiveMainStats?.[key] || char.mainStats?.[key] || 0) : (char.effectiveSubStats?.[key] || char.subStats?.[key] || 0);
                valEl.textContent = nv;
              }
              saveToVault();
              statBlock.click();
            };
            addBtn.addEventListener("click", doAdd);
            nameIn.addEventListener("keydown", (ev) => { if (ev.key === "Enter") doAdd(); });
            valIn.addEventListener("keydown", (ev) => { if (ev.key === "Enter") doAdd(); });
            nameIn.focus();
          }
        }

        overlay.classList.add("open");
        return;
      }

      // Derived stat click → show formula + override editing
      const derivedEl = e.target.closest("[data-derived-key]");
      if (derivedEl) {
        const dk = derivedEl.dataset.derivedKey;
        const info = DERIVED_FORMULAS[dk];
        if (!info) return;

        // Compute current stats for the formula display
        const bMain = char.effectiveMainStats || char.mainStats || {};
        const bSub = char.effectiveSubStats || char.subStats || {};
        const cMainB = {};
        for (const cls of (char.classes || [])) {
          for (const lb of (cls.levelBonuses || [])) {
            if (lb.type === "main" && lb.statKey) cMainB[lb.statKey] = (cMainB[lb.statKey] || 0) + 1;
          }
        }
        const ms = {};
        Character.MAIN_STAT_KEYS.forEach(k => { ms[k] = (bMain[k] || 0) + (cMainB[k] || 0); });
        const ss = {};
        Character.SUB_STAT_KEYS.forEach(k => { ss[k] = (bSub[k] || 0); });

        const baseDerived = Character.getDerived({ mainStats: ms, subStats: ss, raceBonuses: { mainStat: null, subStat: null }, classes: char.classes });
        const baseVal = baseDerived[dk] || 0;

        titleEl.textContent = info.label;

        let html = '<div class="cs-tip-row" style="margin-bottom:8px;"><strong>Sources:</strong></div>';
        html += `<div class="cs-tip-row cs-tip-indent">• Formula: <strong>${info.formula(ms, ss)}</strong></div>`;

        // Key ability HP bonus
        if (dk === "hp") {
          for (const cls of (char.classes || [])) {
            if (cls.keyAbilityHpBonus) {
              html += `<div class="cs-tip-row cs-tip-indent">• ${cls.name} (Key Ability): <strong>+${cls.keyAbilityHpBonus}</strong></div>`;
            }
          }
        }

        html += `<div class="cs-tip-row cs-tip-indent">• Base Value: <strong>${baseVal}</strong></div>`;

        // Custom overrides
        const customOverrides = char.derivedOverrides?.[dk] || [];
        if (customOverrides.length > 0) {
          for (let ci = 0; ci < customOverrides.length; ci++) {
            const cs = customOverrides[ci];
            html += `<div class="cs-tip-row cs-tip-indent cs-tip-custom-source">• Custom (${cs.label}): <strong>${cs.amount >= 0 ? "+" : ""}${cs.amount}</strong>`;
            if (overrideActive) {
              html += ` <button class="cs-override-del-source-btn" data-derived-src-idx="${ci}" title="Remove source">\u00d7</button>`;
            }
            html += `</div>`;
          }
        }

        const overrideTotal = customOverrides.reduce((s, o) => s + o.amount, 0);
        const grandTotal = baseVal + overrideTotal;
        html += `<div class="cs-tip-row" style="margin-top:8px;border-top:1px solid var(--clr-border);padding-top:8px;"><strong>Total: ${grandTotal}</strong></div>`;

        if (overrideActive) {
          html += '<div class="cs-override-add-source-form" style="margin-top:10px;border-top:1px solid var(--clr-border);padding-top:10px;">';
          html += '<div style="margin-bottom:6px;font-size:0.75rem;color:#e6a032;font-weight:600;">Add Custom Source</div>';
          html += '<div class="cs-override-input-row">';
          html += '<input type="text" class="cs-override-text-input" id="cs-override-derived-name" placeholder="Source name..." maxlength="40">';
          html += '<input type="number" class="cs-override-num-input" id="cs-override-derived-val" placeholder="+/-" value="1">';
          html += '<button class="cs-override-confirm-btn" id="cs-override-derived-add">\u2713</button>';
          html += '</div></div>';
        }

        bodyEl.innerHTML = html;

        // Bind derived override interactions
        if (overrideActive) {
          bodyEl.querySelectorAll("[data-derived-src-idx]").forEach(btn => {
            btn.addEventListener("click", (ev) => {
              ev.stopPropagation();
              const idx = parseInt(btn.dataset.derivedSrcIdx);
              const customs = char.derivedOverrides?.[dk] || [];
              if (customs[idx]) {
                customs.splice(idx, 1);
                if (customs.length === 0) delete char.derivedOverrides[dk];
                // Re-compute and update display
                const newDerived = Character.getDerived({ mainStats: ms, subStats: ss, raceBonuses: { mainStat: null, subStat: null }, classes: char.classes });
                const newOverrideTotal = (char.derivedOverrides?.[dk] || []).reduce((s, o) => s + o.amount, 0);
                const valEl = derivedEl.querySelector(".cs-derived-value");
                if (valEl) valEl.textContent = newDerived[dk] + newOverrideTotal;
                saveToVault();
                derivedEl.click();
              }
            });
          });

          const addBtn = document.getElementById("cs-override-derived-add");
          const nameIn = document.getElementById("cs-override-derived-name");
          const valIn = document.getElementById("cs-override-derived-val");
          if (addBtn && nameIn && valIn) {
            const doAdd = () => {
              const label = nameIn.value.trim();
              const amount = parseInt(valIn.value) || 0;
              if (!label || amount === 0) return;
              if (!char.derivedOverrides) char.derivedOverrides = {};
              if (!char.derivedOverrides[dk]) char.derivedOverrides[dk] = [];
              char.derivedOverrides[dk].push({ source: "Custom", label: label, amount: amount });
              // Update display
              const newDerived = Character.getDerived({ mainStats: ms, subStats: ss, raceBonuses: { mainStat: null, subStat: null }, classes: char.classes });
              const newOverrideTotal = char.derivedOverrides[dk].reduce((s, o) => s + o.amount, 0);
              const valEl = derivedEl.querySelector(".cs-derived-value");
              if (valEl) valEl.textContent = newDerived[dk] + newOverrideTotal;
              saveToVault();
              derivedEl.click();
            };
            addBtn.addEventListener("click", doAdd);
            nameIn.addEventListener("keydown", (ev) => { if (ev.key === "Enter") doAdd(); });
            valIn.addEventListener("keydown", (ev) => { if (ev.key === "Enter") doAdd(); });
            nameIn.focus();
          }
        }

        overlay.classList.add("open");
        return;
      }

      const item = e.target.closest(".cs-list-item, .cs-equip-item, .cs-skill-cell");
      if (!item) return;
      const type = item.dataset.type;
      const id = item.dataset.id;

      if (type === "class") {
        showClassDetail(char, id, titleEl, bodyEl, overlay);
      } else if (type === "breakthrough") {
        const bt = char.breakthroughs?.find(b => b.breakthroughId === id);
        if (bt) {
          titleEl.textContent = bt.name;
          bodyEl.innerHTML = `
            <div class="cs-tip-row"><strong>Cost:</strong> ${bt.cost} EXP</div>
            ${bt.requirements ? `<div class="cs-tip-row"><strong>Requirements:</strong> ${bt.requirements}</div>` : ""}
            ${bt.description ? `<div class="cs-tip-row cs-tip-desc">${bt.description}</div>` : ""}
          `;
          overlay.classList.add("open");
        }
      } else if (type === "skill") {
        const skillData = char.skills?.[id];
        if (skillData) {
          titleEl.textContent = id;
          let body = `<div class="cs-tip-row"><strong>Points:</strong> ${skillData.points}</div>`;
          // Show class sources for skill points
          for (const cls of (char.classes || [])) {
            for (const lb of (cls.levelBonuses || [])) {
              if (lb.type === "skill" && lb.skillName === id) {
                body += `<div class="cs-tip-row cs-tip-indent">• +${lb.points} from ${cls.name} (L3)</div>`;
              }
            }
          }
          if (skillData.expertise?.length > 0) {
            body += '<div class="cs-tip-row"><strong>Expertise:</strong></div>';
            for (const exp of skillData.expertise) {
              body += `<div class="cs-tip-row cs-tip-indent">• ${exp.name}: ${exp.points} pts</div>`;
            }
          }
          bodyEl.innerHTML = body;
          overlay.classList.add("open");
        }
      } else if (type === "equipment") {
        showEquipDetail(char, id, titleEl, bodyEl, overlay);
      }
    });
  }

  /* ─── Rich Class Detail ─────────────────────────────────────────── */
  async function showClassDetail(char, classId, titleEl, bodyEl, overlay) {
    const charCls = char.classes?.find(c => c.classId === classId);
    if (!charCls) return;
    titleEl.textContent = charCls.name;
    bodyEl.innerHTML = '<div class="cs-tip-loading">Loading class data…</div>';
    overlay.classList.add("open");
    try {
      const allClasses = await ApiClient.getClassesFull();
      const cls = allClasses.find(c => c.classId === classId);
      if (!cls) {
        bodyEl.innerHTML = `<div class="cs-tip-row"><strong>Tier:</strong> ${charCls.tier}</div><div class="cs-tip-row"><strong>Levels:</strong> ${charCls.levels}</div>`;
        return;
      }
      const diffDots = Array.from({ length: 5 }, (_, i) => i < cls.difficulty ? "●" : "○").join("");
      let html = "";
      if (cls.imageSmUrl) html += `<img class="cs-tip-class-img" src="${cls.imageSmUrl}" alt="${cls.name}">`;
      html += `<div class="cs-tip-meta-row">`;
      html += `<span class="cls-tier-badge tier-${cls.tier}">Tier ${cls.tier}</span>`;
      html += `<span class="cls-role-tag role-${(cls.role1 || "").toLowerCase()}">${cls.role1 || ""}</span>`;
      if (cls.role2) html += `<span class="cls-role-tag role-${cls.role2.toLowerCase()}">${cls.role2}</span>`;
      html += `<span class="cs-tip-diff">${diffDots}</span></div>`;
      html += `<div class="cs-tip-row"><strong>Your Level:</strong> ${charCls.levels} / 8${charCls.mastered ? " ★ Mastered" : ""}</div>`;
      const reqText = cls.requirements && cls.requirements !== "None" && cls.requirements !== "None." ? cls.requirements : "";
      if (reqText) html += `<div class="cs-tip-row cs-tip-req">⚠ ${reqText}</div>`;
      if (cls.description) html += `<div class="cs-tip-row cs-tip-desc">${cls.description}</div>`;
      html += `<div class="cs-tip-prog-title">Progression</div><div class="cs-tip-prog">`;
      const levels = [
        { key: "keyAbilityName", label: "Key Ability" }, { key: "ability1Name", label: "Ability 1" },
        { key: "skills", label: "Skills" }, { key: "ability2Name", label: "Ability 2" },
        { key: "heart", label: "Heart" }, { key: "ability3Name", label: "Ability 3" },
        { key: "soul", label: "Soul" }, { key: "ultimateAbilityName", label: "Ultimate" },
      ];
      levels.forEach((def, i) => {
        const lvl = i + 1;
        html += `<div class="cs-tip-prog-row ${lvl <= charCls.levels ? "unlocked" : "locked"}">
          <span class="cs-tip-prog-lv">Lv.${lvl}</span>
          <span class="cs-tip-prog-label">${def.label}</span>
          <span class="cs-tip-prog-value">${cls[def.key] || "—"}</span>
        </div>`;
      });
      html += `</div>`;
      bodyEl.innerHTML = html;
    } catch (err) {
      bodyEl.innerHTML = `<div class="cs-tip-row"><strong>Tier:</strong> ${charCls.tier}</div><div class="cs-tip-row"><strong>Levels:</strong> ${charCls.levels}</div>`;
    }
  }

  /* ─── Rich Equipment Detail ─────────────────────────────────────── */
  async function showEquipDetail(char, itemId, titleEl, bodyEl, overlay) {
    const eq = char.equipment?.find(e => e.itemId === itemId);
    if (!eq) return;
    titleEl.textContent = eq.name;
    bodyEl.innerHTML = '<div class="cs-tip-loading">Loading item data…</div>';
    overlay.classList.add("open");
    try {
      const itemData = await ApiClient.getItemDetail(itemId);
      let html = "";
      if (itemData.imageSmUrl) html += `<img class="cs-tip-item-img" src="${itemData.imageSmUrl}" alt="${itemData.name}">`;
      if (itemData.category) html += `<div class="cs-tip-row"><strong>Category:</strong> ${itemData.category}</div>`;
      if (itemData.slot) html += `<div class="cs-tip-row"><strong>Slot:</strong> ${itemData.slot}</div>`;
      html += `<div class="cs-tip-row"><strong>Base Cost:</strong> ${itemData.cost || "Free"}</div>`;
      html += `<div class="cs-tip-row"><strong>Your Cost:</strong> ${eq.cost} Clim</div>`;
      if (eq.mods?.length > 0) html += `<div class="cs-tip-row"><strong>Mods:</strong> ${eq.mods.join(", ")}</div>`;
      if (itemData.description) html += `<div class="cs-tip-row cs-tip-desc">${itemData.description}</div>`;
      if (itemData.damage) html += `<div class="cs-tip-row"><strong>Damage:</strong> ${itemData.damage}</div>`;
      if (itemData.range) html += `<div class="cs-tip-row"><strong>Range:</strong> ${itemData.range}</div>`;
      if (itemData.guard) html += `<div class="cs-tip-row"><strong>Guard:</strong> +${itemData.guard}</div>`;
      if (itemData.penalty) html += `<div class="cs-tip-row"><strong>Penalty:</strong> ${itemData.penalty}</div>`;
      bodyEl.innerHTML = html;
    } catch (err) {
      bodyEl.innerHTML = `<div class="cs-tip-row"><strong>Cost:</strong> ${eq.cost} Clim</div>`;
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
     TAB NAVIGATION
     ═══════════════════════════════════════════════════════════════════ */
  // TAB_ORDER hoisted to top of IIFE

  function bindTabNavigation() {
    const tabBtns = document.querySelectorAll(".sheet-tab-btn");
    const prevBtn = document.getElementById("sheet-tab-prev");
    const nextBtn = document.getElementById("sheet-tab-next");

    function switchToTab(tabName) {
      // Update buttons
      tabBtns.forEach(b => b.classList.toggle("active", b.dataset.tab === tabName));
      // Update pages
      document.querySelectorAll(".sheet-tab-page").forEach(p => p.classList.remove("active"));
      const page = document.getElementById(`sheet-page-${tabName}`);
      if (page) page.classList.add("active");
      // Update arrows
      const idx = TAB_ORDER.indexOf(tabName);
      prevBtn.disabled = idx <= 0;
      nextBtn.disabled = idx >= TAB_ORDER.length - 1;
      // Refresh data-driven tabs when switching to them
      if (tabName === "abilities") renderAbilitiesPage(char);
    }

    tabBtns.forEach(btn => {
      btn.addEventListener("click", () => switchToTab(btn.dataset.tab));
    });
    prevBtn.addEventListener("click", () => {
      const activeBtn = document.querySelector(".sheet-tab-btn.active");
      const idx = TAB_ORDER.indexOf(activeBtn?.dataset.tab || "stats");
      if (idx > 0) switchToTab(TAB_ORDER[idx - 1]);
    });
    nextBtn.addEventListener("click", () => {
      const activeBtn = document.querySelector(".sheet-tab-btn.active");
      const idx = TAB_ORDER.indexOf(activeBtn?.dataset.tab || "stats");
      if (idx < TAB_ORDER.length - 1) switchToTab(TAB_ORDER[idx + 1]);
    });

    // Initial arrow state
    switchToTab("stats");
  }

  /* ═══════════════════════════════════════════════════════════════════
     ABILITIES PAGE
     ═══════════════════════════════════════════════════════════════════ */

  /**
   * Ability levels mapping:
   * Lv 1 = Key Ability (keyAbilityId)
   * Lv 2 = Ability 1   (ability1Id)
   * Lv 4 = Ability 2   (ability2Id)
   * Lv 6 = Ability 3   (ability3Id)
   * Lv 8 = Ultimate    (ultimateAbilityId)
   */
  // ABILITY_LEVEL_MAP hoisted to top of IIFE

  async function renderAbilitiesPage(char) {
    const container = document.getElementById("abilities-root");
    if (!container) { console.warn("[abilities] container not found"); return; }
    if (!char.classes || char.classes.length === 0) {
      container.innerHTML = '<div class="cs-empty" style="padding:40px;text-align:center;">No classes — no abilities yet.</div>';
      console.log("[abilities] no classes on char");
      return;
    }

    container.innerHTML = '<div class="cs-tip-loading" style="padding:40px;text-align:center;">Loading abilities…</div>';
    console.log("[abilities] loading for", char.classes.length, "classes:", char.classes.map(c => c.name + " Lv" + c.levels));

    try {
      // Fetch full class data to get ability IDs
      let allClasses;
      try {
        allClasses = await ApiClient.getClassesFull();
        console.log("[abilities] loaded full class data:", allClasses?.length);
      } catch (fetchErr) {
        console.warn("[abilities] getClassesFull failed, will try name lookup:", fetchErr.message);
        allClasses = [];
      }

      let html = "";

      for (const charCls of char.classes) {
        // Try exact classId match first, then fall back to name match
        let clsData = allClasses.find(c => c.classId === charCls.classId);
        if (!clsData) clsData = allClasses.find(c => c.name === charCls.name);

        if (!clsData) {
          // Can't find full data — show class header with note
          html += `<div class="ability-class-group">
            <div class="ability-class-header">
              <span>${charCls.name}</span>
              <span class="ability-class-tier">Tier ${charCls.tier} · Lv ${charCls.levels}</span>
            </div>
            <div class="ability-list">
              <div class="cs-empty" style="padding:12px;font-size:0.8rem;">Could not load ability data for this class. Start the proxy server to see abilities.</div>
            </div>
          </div>`;
          continue;
        }

        html += `<div class="ability-class-group">`;
        html += `<div class="ability-class-header">
          <span>${clsData.name}</span>
          <span class="ability-class-tier">Tier ${clsData.tier} · Lv ${charCls.levels}</span>
        </div>`;
        html += `<div class="ability-list">`;

        for (const def of ABILITY_LEVEL_MAP) {
          if (charCls.levels < def.level) continue; // haven't reached this level

          const abilityId = clsData[def.idKey];
          const abilityName = clsData[def.nameKey] || "—";
          if (!abilityName || abilityName === "—") continue;

          html += `<div class="ability-card" data-ability-id="${abilityId || ""}" data-ability-name="${abilityName}" data-is-key="${def.isKey}" data-class-name="${clsData.name}">
            <span class="ability-card-level">Lv.${def.level}</span>
            <span class="ability-card-name">${abilityName}</span>
            <span class="ability-card-source">${def.label}</span>
          </div>`;
        }

        html += `</div></div>`;
      }

      container.innerHTML = html || '<div class="cs-empty" style="padding:40px;text-align:center;">No abilities found for your class levels.</div>';

      // Bind click events
      container.querySelectorAll(".ability-card").forEach(card => {
        card.addEventListener("click", () => {
          const abilityId = card.dataset.abilityId;
          const abilityName = card.dataset.abilityName;
          const isKey = card.dataset.isKey === "true";
          showAbilityDetail(abilityId, abilityName, isKey);
        });
      });

    } catch (err) {
      console.error("[abilities] Fatal error:", err);
      container.innerHTML = `<div class="cs-empty" style="padding:40px;text-align:center;">Failed to load abilities: ${err.message}</div>`;
    }
  }

  /* ─── Show ability detail in tooltip modal ──────────────────────── */
  async function showAbilityDetail(abilityId, abilityName, isKey) {
    const overlay = document.getElementById("cs-tooltip-overlay");
    const titleEl = document.getElementById("cs-tooltip-title");
    const bodyEl = document.getElementById("cs-tooltip-body");

    titleEl.textContent = abilityName;
    bodyEl.innerHTML = '<div class="cs-tip-loading">Loading ability data…</div>';
    overlay.classList.add("open");

    try {
      if (isKey) {
        // Key Ability — different structure
        const ka = abilityId
          ? await ApiClient.getKeyAbilityByIndexId(abilityId)
          : null;

        if (ka) {
          let html = "";
          const benefits = [ka.benefit1, ka.benefit2, ka.benefit3, ka.benefit4].filter(b => b && b.trim());
          if (benefits.length) {
            html += '<div class="ability-desc">';
            for (const b of benefits) {
              html += `<div class="ability-stat-row">
                <span class="ability-stat-value">${stripHtmlLight(b)}</span>
              </div>`;
            }
            html += '</div>';
          }
          if (ka.associatedAbility) {
            const assocAbility = await ApiClient.getAbilityByIndexId(ka.associatedAbility);
            if (assocAbility) {
              html += '<div class="cls-ability-assoc">';
              html += '<div class="cls-ability-assoc-name">' + assocAbility.name + '</div>';
              if (assocAbility.apCost && assocAbility.apCost !== "-" && assocAbility.apCost !== "0" && assocAbility.apCost !== "") html += '<span class="cls-ability-tag">AP: ' + assocAbility.apCost + '</span>';
              if (assocAbility.manaCost && assocAbility.manaCost !== "-" && assocAbility.manaCost !== "0" && assocAbility.manaCost !== "") html += '<span class="cls-ability-tag">Mana: ' + assocAbility.manaCost + '</span>';
              if (assocAbility.rpCost && assocAbility.rpCost !== "-" && assocAbility.rpCost !== "0" && assocAbility.rpCost !== "") html += '<span class="cls-ability-tag">RP: ' + assocAbility.rpCost + '</span>';
              if (assocAbility.range && assocAbility.range !== "-") html += '<span class="cls-ability-tag">Range: ' + assocAbility.range + '</span>';
              if (assocAbility.keywords) html += '<span class="cls-ability-tag">' + assocAbility.keywords + '</span>';
              if (assocAbility.description) html += '<div class="cls-ability-desc">' + assocAbility.description + '</div>';
              html += '</div>';
            } else {
              html += `<div class="ability-stat-row"><span class="ability-stat-label">Associated Ability</span><span class="ability-stat-value">(Could not load details)</span></div>`;
            }
          }
          bodyEl.innerHTML = html || '<div class="cs-tip-row">Key ability — no further details available.</div>';
        } else {
          bodyEl.innerHTML = '<div class="cs-tip-row">Key ability details not found.</div>';
        }
      } else {
        // True Ability
        const ab = abilityId
          ? await ApiClient.getAbilityByIndexId(abilityId)
          : null;

        if (ab) {
          let html = "";

          // Keywords
          if (ab.keywords) {
            const kwList = ab.keywords.split(",").map(k => k.trim()).filter(Boolean);
            if (kwList.length) {
              html += '<div class="ability-detail-keywords">';
              for (const kw of kwList) {
                html += `<span class="ability-keyword-badge" data-keyword="${kw}">${kw}</span>`;
              }
              html += '</div>';
            }
          }

          // Stats
          if (ab.range && ab.range !== "-") html += `<div class="ability-stat-row"><span class="ability-stat-label">Range</span><span class="ability-stat-value">${ab.range}</span></div>`;
          if (ab.manaCost && ab.manaCost !== "-" && ab.manaCost !== "0" && ab.manaCost !== "") html += `<div class="ability-stat-row"><span class="ability-stat-label">Mana Cost</span><span class="ability-stat-value">${ab.manaCost} MP</span></div>`;
          if (ab.apCost && ab.apCost !== "-" && ab.apCost !== "0" && ab.apCost !== "") html += `<div class="ability-stat-row"><span class="ability-stat-label">AP Cost</span><span class="ability-stat-value">${ab.apCost} AP</span></div>`;
          if (ab.rpCost && ab.rpCost !== "-" && ab.rpCost !== "0" && ab.rpCost !== "") html += `<div class="ability-stat-row"><span class="ability-stat-label">RP Cost</span><span class="ability-stat-value">${ab.rpCost} RP</span></div>`;
          if (ab.otherCosts && ab.otherCosts.trim()) html += `<div class="ability-stat-row"><span class="ability-stat-label">Other Costs</span><span class="ability-stat-value">${ab.otherCosts}</span></div>`;
          if (ab.requirement && ab.requirement !== "-" && ab.requirement.trim()) html += `<div class="ability-stat-row"><span class="ability-stat-label">Requirement</span><span class="ability-stat-value">${ab.requirement}</span></div>`;

          // Description
          if (ab.description) {
            html += `<div class="ability-desc">${ab.description}</div>`;
          }

          // Keyword definition area (populated on click)
          html += '<div id="keyword-def-area"></div>';

          bodyEl.innerHTML = html || '<div class="cs-tip-row">No ability details available.</div>';

          // Bind keyword clicks
          bodyEl.querySelectorAll(".ability-keyword-badge").forEach(badge => {
            badge.addEventListener("click", () => showKeywordDef(badge.dataset.keyword));
          });
        } else {
          bodyEl.innerHTML = '<div class="cs-tip-row">Ability details not found in the database.</div>';
        }
      }
    } catch (err) {
      console.error("Failed to load ability:", err);
      bodyEl.innerHTML = '<div class="cs-tip-row">Failed to load ability data.</div>';
    }
  }

  /* ─── Keyword definition ────────────────────────────────────────── */
  async function showKeywordDef(keywordName) {
    const area = document.getElementById("keyword-def-area");
    if (!area) return;

    try {
      const all = await ApiClient.getKeywords();
      const kw = all.find(k => k.name.toLowerCase() === keywordName.toLowerCase());
      if (kw) {
        area.innerHTML = `<div class="keyword-def-box">
          <div class="keyword-def-title">${kw.name}</div>
          <div class="keyword-def-text">${kw.description}</div>
        </div>`;
      } else {
        area.innerHTML = `<div class="keyword-def-box">
          <div class="keyword-def-title">${keywordName}</div>
          <div class="keyword-def-text">No definition found for this keyword.</div>
        </div>`;
      }
    } catch (err) {
      area.innerHTML = '';
    }
  }

  /* ─── HTML strip helper ─────────────────────────────────────────── */
  function stripHtmlLight(html) {
    // Light strip — keep structure but remove tags
    return html.replace(/<[^>]+>/g, "");
  }

  /* ═══════════════════════════════════════════════════════════════════
     INVENTORY PAGE
     ═══════════════════════════════════════════════════════════════════ */

  function renderInventoryPage(char, save) {
    const container = document.getElementById("inventory-root");
    if (!container) return;

    // Ensure inventory array exists
    if (!char.inventory) {
      // Migrate purchased equipment into inventory with qty 1
      char.inventory = (char.equipment || []).map(eq => ({
        id: eq.itemId || crypto.randomUUID(),
        name: eq.name,
        cost: eq.cost || 0,
        mods: eq.mods || [],
        itemId: eq.itemId || null,
        description: "",
        custom: false,
        qty: 1,
      }));
      save();
    }

    // Ensure clim exists
    if (char.clim === undefined) {
      char.clim = parseInt(char.resources?.clim) || 0;
      save();
    }

    rebuildInventoryUI(char, container, save);
  }

  function rebuildInventoryUI(char, container, save) {
    const inv = char.inventory || [];

    // ── Clim section ──
    let html = `
      <div class="inv-clim-bar">
        <div class="inv-clim-label">Clim</div>
        <div class="inv-clim-controls">
          <button class="inv-clim-btn" id="inv-clim-minus" title="−10 Clim">−</button>
          <span class="inv-clim-value" id="inv-clim-value" contenteditable="true" inputmode="numeric">${char.clim}</span>
          <button class="inv-clim-btn" id="inv-clim-plus" title="+10 Clim">+</button>
        </div>
        <button class="spend-exp-btn shop-btn" id="inv-open-shop" title="Open shop to purchase items">🛒 Shop</button>
      </div>
    `;

    // ── Item list ──
    html += `<div class="inv-section-title">Items <span class="inv-item-count">${inv.length}</span></div>`;
    html += `<div class="inv-item-list" id="inv-item-list">`;

    if (inv.length === 0) {
      html += '<div class="cs-empty" style="padding:20px;text-align:center;">No items in inventory</div>';
    } else {
      for (let i = 0; i < inv.length; i++) {
        const item = inv[i];
        const modsText = item.mods?.length ? `<span class="cs-equip-mods">${item.mods.join(", ")}</span>` : "";
        const descText = item.description ? `<div class="inv-item-desc">${item.description}</div>` : "";
        const costText = item.cost ? `<span class="inv-item-cost">${item.cost} Clim</span>` : "";
        const customBadge = item.custom ? '<span class="inv-item-custom-badge">Custom</span>' : "";

        const equipClass = item.equipped ? "equipped" : "";
        const equipLabel = item.equipped ? "Equipped" : "Equip";

        html += `<div class="inv-item-row" data-idx="${i}">
          <button class="inv-equip-btn ${equipClass}" data-idx="${i}">${equipLabel}</button>
          <div class="inv-item-info">
            <div class="inv-item-name-row">
              <span class="inv-item-name ${item.itemId && !item.custom ? 'inv-item-clickable' : ''}" data-type="${item.custom ? '' : 'equipment'}" data-id="${item.itemId || ''}">${item.name}</span>
              ${customBadge}
              ${modsText}
            </div>
            ${descText}
          </div>
          <div class="inv-item-right">
            ${costText}
            <div class="inv-qty-controls ${item.equipped ? 'inv-qty-disabled' : ''}">
              <button class="inv-qty-btn inv-qty-down" data-idx="${i}" title="Remove one" ${item.equipped ? 'disabled' : ''}>−</button>
              <span class="inv-qty-value">${item.qty}</span>
              <button class="inv-qty-btn inv-qty-up" data-idx="${i}" title="Add one" ${item.equipped ? 'disabled' : ''}>+</button>
            </div>
            <button class="inv-item-delete" data-idx="${i}" title="Remove from inventory" ${item.equipped ? 'disabled' : ''}>✕</button>
          </div>
        </div>`;
      }
    }

    html += `</div>`;

    // ── Add item button ──
    html += `
      <button class="inv-add-btn" id="inv-add-item">
        <span class="inv-add-icon">+</span> Add Custom Item
      </button>
    `;

    // ── Add item form (hidden by default) ──
    html += `
      <div class="inv-add-form" id="inv-add-form" style="display:none;">
        <input class="inv-add-input" id="inv-add-name" type="text" placeholder="Item name" maxlength="80">
        <textarea class="inv-add-textarea" id="inv-add-desc" placeholder="Description (optional)" rows="2" maxlength="300"></textarea>
        <div class="inv-add-burden-row">
          <label class="inv-add-label">Burden</label>
          <input class="inv-add-burden" id="inv-add-burden" type="number" min="0" max="99" value="0" step="1">
        </div>
        <button class="inv-add-advanced-toggle" id="inv-add-advanced-toggle" type="button">▸ Advanced</button>
        <div class="inv-add-advanced" id="inv-add-advanced" style="display:none;">
          <label class="inv-add-checkbox-label">
            <input type="checkbox" id="inv-add-alchemy"> Alchemy Item
            <span class="inv-add-hint">(Can be stored in Alchemy Rigs)</span>
          </label>
        </div>
        <div class="inv-add-actions">
          <button class="inv-add-confirm" id="inv-add-confirm">Add to Inventory</button>
          <button class="inv-add-cancel" id="inv-add-cancel">Cancel</button>
        </div>
      </div>
    `;

    container.innerHTML = html;
    bindInventoryEvents(char, container, save);
  }

  function bindInventoryEvents(char, container, save) {
    // Equip toggle
    container.querySelectorAll(".inv-equip-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.idx);
        const it = char.inventory[idx];

        if (it.equipped) {
          // Unequipping — just toggle off
          it.equipped = false;
          if (char.bags) {
            for (const bagId of Object.keys(char.bags)) {
              char.bags[bagId] = char.bags[bagId].filter(b => b.sourceIdx !== idx);
            }
          }
          save();
          rebuildInventoryUI(char, container, save);
          updateEquippedSection(char, save);
        } else if (it.qty > 1) {
          // Multiple qty — ask how many to equip
          showQuantityPrompt(it.name, it.qty, (count) => {
            // Reduce original qty
            it.qty -= count;
            if (it.qty <= 0) {
              char.inventory.splice(idx, 1);
              fixBagIndicesAfterRemove(char, idx);
            }
            // Create individual equipped entries
            for (let i = 0; i < count; i++) {
              char.inventory.push({
                id: crypto.randomUUID(),
                name: it.name,
                baseName: it.baseName || it.name,
                cost: it.cost || 0,
                mods: it.mods ? [...it.mods] : [],
                itemId: it.itemId || null,
                description: it.description || "",
                custom: it.custom || false,
                burden: it.burden,
                imageUrl: it.imageUrl,
                qty: 1,
                equipped: true,
              });
            }
            save();
            rebuildInventoryUI(char, container, save);
            updateEquippedSection(char, save);
          });
        } else {
          // Single item — just toggle
          it.equipped = true;
          save();
          rebuildInventoryUI(char, container, save);
          updateEquippedSection(char, save);
        }
      });
    });

    // Clim +/-
    const climValEl = document.getElementById("inv-clim-value");
    document.getElementById("inv-clim-minus")?.addEventListener("click", () => {
      char.clim = Math.max(0, (char.clim || 0) - 10);
      climValEl.textContent = char.clim;
      save();
    });
    document.getElementById("inv-clim-plus")?.addEventListener("click", () => {
      char.clim = (char.clim || 0) + 10;
      climValEl.textContent = char.clim;
      save();
    });
    // Direct edit clim
    climValEl?.addEventListener("blur", () => {
      const val = parseInt(climValEl.textContent);
      if (!isNaN(val) && val >= 0) {
        char.clim = val;
        save();
      } else {
        climValEl.textContent = char.clim;
      }
    });
    climValEl?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); climValEl.blur(); }
    });

    // Quantity controls
    container.querySelectorAll(".inv-qty-up").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.idx);
        char.inventory[idx].qty++;
        save();
        rebuildInventoryUI(char, container, save);
      });
    });
    container.querySelectorAll(".inv-qty-down").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.idx);
        if (char.inventory[idx].qty > 1) {
          char.inventory[idx].qty--;
          save();
          rebuildInventoryUI(char, container, save);
        }
      });
    });

    // Delete item
    container.querySelectorAll(".inv-item-delete").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.idx);
        char.inventory.splice(idx, 1);
        save();
        rebuildInventoryUI(char, container, save);
      });
    });

    // Shop button
    document.getElementById("inv-open-shop")?.addEventListener("click", () => {
      openShopModal(char, save, container);
    });

    // Item name click → tooltip (for API items)
    container.querySelectorAll(".inv-item-clickable").forEach(el => {
      el.addEventListener("click", () => {
        const itemId = el.dataset.id;
        if (itemId) showEquipmentTooltip(char, itemId);
      });
    });

    // Add custom item form
    document.getElementById("inv-add-item")?.addEventListener("click", () => {
      document.getElementById("inv-add-form").style.display = "block";
      document.getElementById("inv-add-item").style.display = "none";
      document.getElementById("inv-add-name").focus();
    });
    document.getElementById("inv-add-cancel")?.addEventListener("click", () => {
      document.getElementById("inv-add-form").style.display = "none";
      document.getElementById("inv-add-item").style.display = "";
      document.getElementById("inv-add-name").value = "";
      document.getElementById("inv-add-desc").value = "";
      document.getElementById("inv-add-burden").value = "0";
      document.getElementById("inv-add-alchemy").checked = false;
      document.getElementById("inv-add-advanced").style.display = "none";
    });
    // Advanced toggle
    document.getElementById("inv-add-advanced-toggle")?.addEventListener("click", () => {
      const adv = document.getElementById("inv-add-advanced");
      const btn = document.getElementById("inv-add-advanced-toggle");
      if (adv.style.display === "none") {
        adv.style.display = "block";
        btn.textContent = "▾ Advanced";
      } else {
        adv.style.display = "none";
        btn.textContent = "▸ Advanced";
      }
    });
    document.getElementById("inv-add-confirm")?.addEventListener("click", () => {
      const name = document.getElementById("inv-add-name").value.trim();
      if (!name) return;
      const desc = document.getElementById("inv-add-desc").value.trim();
      const burden = parseFloat(document.getElementById("inv-add-burden").value) || 0;
      const isAlchemy = document.getElementById("inv-add-alchemy").checked;
      if (!char.inventory) char.inventory = [];
      const customItem = {
        id: crypto.randomUUID(),
        name,
        cost: 0,
        mods: [],
        itemId: null,
        description: desc,
        custom: true,
        burden,
        qty: 1,
      };
      if (isAlchemy) customItem.isAlchemy = true;
      char.inventory.push(customItem);
      save();
      rebuildInventoryUI(char, container, save);
    });
  }

  /* ─── Equipment tooltip reuse ──────────────────────────────────── */
  function showEquipmentTooltip(char, itemId) {
    const overlay = document.getElementById("cs-tooltip-overlay");
    const titleEl = document.getElementById("cs-tooltip-title");
    const bodyEl = document.getElementById("cs-tooltip-body");

    // Build a temporary char-like object that has this item in equipment
    // so showEquipDetail can find it
    const eq = char.inventory?.find(e => e.itemId === itemId) ||
               char.equipment?.find(e => e.itemId === itemId);
    if (!eq) return;

    const tempChar = { equipment: [eq] };
    showEquipDetail(tempChar, itemId, titleEl, bodyEl, overlay);
  }

  /* ═══════════════════════════════════════════════════════════════════
     RENAME SYSTEM
     ═══════════════════════════════════════════════════════════════════ */
  function bindRenameEvents(char, save) {
    const nameEl = document.getElementById("cs-char-name");
    if (!nameEl) return;

    nameEl.addEventListener("focus", () => nameEl.classList.add("cs-name-editing"));

    nameEl.addEventListener("blur", () => {
      nameEl.classList.remove("cs-name-editing");
      const newName = nameEl.textContent.trim();
      if (newName && newName !== char.name) {
        char.name = newName;
        document.title = `${newName} — Angel's Sword`;
        save();
      } else {
        nameEl.textContent = char.name || "Unnamed";
      }
    });

    nameEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); nameEl.blur(); }
      if (e.key === "Escape") {
        nameEl.textContent = char.name || "Unnamed";
        nameEl.blur();
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════════════
     EQUIPPED SECTION + BURDEN
     ═══════════════════════════════════════════════════════════════════ */

  async function fetchItemMeta(itemId) {
    if (_burdenCache[itemId] !== undefined) return _burdenCache[itemId];
    try {
      const data = await ApiClient.getItemDetail(itemId);
      const meta = {
        burden: parseFloat(data.burden) || 0,
        imageUrl: data.imageSmUrl || "",
      };
      _burdenCache[itemId] = meta;
      return meta;
    } catch {
      return { burden: 0, imageUrl: "" };
    }
  }

  async function updateEquippedSection(char, save) {
    const content = document.getElementById("equipped-content");
    if (!content) return;

    // Defaults
    if (char.maxBurden === undefined) char.maxBurden = 10;
    if (!char.bags) char.bags = {};

    const equipped = (char.inventory || []).filter(it => it.equipped);

    // Fetch burden for equipped items that don't have it yet
    const burdenPromises = equipped.map(async (it) => {
      if (it.burden !== undefined && it.imageUrl !== undefined) return;
      if (it.itemId && !it.custom) {
        const meta = await fetchItemMeta(it.itemId);
        it.burden = meta.burden;
        it.imageUrl = meta.imageUrl;
      } else {
        it.burden = 0;
        it.imageUrl = "";
      }
    });
    await Promise.all(burdenPromises);
    save();

    // Figure out which items are stored inside bags
    const baggedIdxs = new Set();
    for (const bagId of Object.keys(char.bags)) {
      for (const bItem of (char.bags[bagId] || [])) {
        if (bItem.sourceIdx !== undefined) baggedIdxs.add(bItem.sourceIdx);
      }
    }

    // Calculate total burden (exclude bagged items)
    let totalBurden = 0;
    for (const it of char.inventory || []) {
      if (!it.equipped) continue;
      const idx = char.inventory.indexOf(it);
      if (baggedIdxs.has(idx)) continue;
      totalBurden += (it.burden || 0) * (it.qty || 1);
    }

    const overBurden = totalBurden > char.maxBurden && !char.burdenOverride;
    const pct = char.maxBurden > 0 ? Math.min(100, (totalBurden / char.maxBurden) * 100) : 0;

    let html = `
      <div class="equipped-burden-bar">
        <span class="equipped-burden-label">Burden</span>
        <div class="equipped-burden-progress">
          <div class="equipped-burden-fill ${overBurden ? 'over' : ''}" style="width:${pct}%"></div>
        </div>
        <span class="equipped-burden-text">
          ${totalBurden} / <span class="equipped-burden-max" id="equipped-max-burden" contenteditable="true" inputmode="numeric" title="Click to edit max burden">${char.maxBurden}</span>
        </span>
        <label class="equipped-override-label">
          <input type="checkbox" class="equipped-override-cb" id="equipped-override" ${char.burdenOverride ? 'checked' : ''}>
          Override
        </label>
      </div>
    `;

    if (equipped.length === 0) {
      html += '<div class="cs-empty" style="padding:16px;text-align:center;font-size:0.82rem;">No items equipped — go to Inventory to equip items.</div>';
    } else {
      html += '<div class="equipped-list">';
      for (const it of equipped) {
        const idx = char.inventory.indexOf(it);
        const inBag = baggedIdxs.has(idx);
        const isBag = BAG_CONFIG[it.itemId];
        const burdenText = it.burden !== undefined ? it.burden : "?";
        const qtyText = it.qty > 1 ? ` ×${it.qty}` : "";
        const bagBtn = isBag ? `<button class="equipped-item-bag-btn" data-bag-item-id="${it.itemId}" data-idx="${idx}">Open Bag</button>` : "";
        const inBagLabel = inBag ? '<span class="equipped-in-bag-label">In Bag</span>' : "";

        const canDrag = !inBag && !isBag;
        const isConsumable = !isBag && (it.isAlchemy || CONSUMABLE_TYPES.some(t => (it.name || "").toLowerCase().includes(t.toLowerCase()) || (it.baseName || "").toLowerCase().includes(t.toLowerCase())));
        const useBtn = isConsumable ? `<button class="equipped-item-use" data-idx="${idx}" title="Use this item">Use</button>` : "";
        html += `<div class="equipped-item ${inBag ? 'in-bag' : ''}" ${canDrag ? `draggable="true" data-drag-idx="${idx}"` : ''}>
          <span class="equipped-item-name" data-item-id="${it.itemId || ''}" data-clickable="${it.itemId && !it.custom ? 'true' : 'false'}">${it.name}${qtyText}</span>
          ${inBagLabel}
          ${bagBtn}
          ${useBtn}
          <span class="equipped-item-burden">${burdenText}</span>
          <button class="equipped-item-unequip" data-idx="${idx}" title="Unequip">✕</button>
        </div>`;
      }
      html += '</div>';
    }

    // Clean up previous drag ghost images
    document.querySelectorAll("img[data-drag-ghost]").forEach(g => g.remove());

    content.innerHTML = html;
    bindEquippedEvents(char, content, save);
  }

  function bindEquippedEvents(char, content, save) {
    // Drag: on mousedown, fetch item image and prepare ghost
    content.querySelectorAll(".equipped-item[draggable='true']").forEach(el => {
      el.addEventListener("mousedown", async () => {
        if (el._dragGhost) return; // already loaded
        const idx = parseInt(el.dataset.dragIdx);
        const it = char.inventory[idx];
        if (!it?.itemId || it.custom) return;
        try {
          const data = await ApiClient.getItemDetail(it.itemId);
          const imgUrl = data?.imageSmUrl;
          if (!imgUrl) return;
          const ghost = document.createElement("img");
          ghost.src = imgUrl;
          ghost.style.cssText = "width:48px;height:48px;object-fit:contain;border-radius:6px;position:absolute;top:-9999px;";
          ghost.setAttribute("data-drag-ghost", "true");
          document.body.appendChild(ghost);
          el._dragGhost = ghost;
        } catch { /* ignore */ }
      });

      el.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/equip-idx", el.dataset.dragIdx);
        e.dataTransfer.effectAllowed = "move";
        el.classList.add("dragging");
        if (el._dragGhost) {
          e.dataTransfer.setDragImage(el._dragGhost, 24, 24);
        }
      });
      el.addEventListener("dragend", () => el.classList.remove("dragging"));
    });

    // Use consumable
    content.querySelectorAll(".equipped-item-use").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.idx);
        const it = char.inventory[idx];
        showUseConfirm(it.name, () => {
          // Remove from bags first
          if (char.bags) {
            for (const bagId of Object.keys(char.bags)) {
              char.bags[bagId] = (char.bags[bagId] || []).filter(b => b.sourceIdx !== idx);
            }
          }

          if (it.qty > 1) {
            // Just decrement qty
            it.qty--;
          } else {
            // Remove from inventory entirely
            char.inventory.splice(idx, 1);
            fixBagIndicesAfterRemove(char, idx);
          }

          save();
          updateEquippedSection(char, save);
          const invRoot = document.getElementById("inventory-root");
          if (invRoot) rebuildInventoryUI(char, invRoot, save);
        });
      });
    });

    // Burden max edit
    const maxEl = document.getElementById("equipped-max-burden");
    maxEl?.addEventListener("blur", () => {
      const v = parseInt(maxEl.textContent);
      if (!isNaN(v) && v > 0) {
        char.maxBurden = v;
        save();
        updateEquippedSection(char, save);
      } else {
        maxEl.textContent = char.maxBurden;
      }
    });
    maxEl?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); maxEl.blur(); }
    });

    // Override checkbox
    document.getElementById("equipped-override")?.addEventListener("change", (e) => {
      char.burdenOverride = e.target.checked;
      save();
      updateEquippedSection(char, save);
    });

    // Item name click → tooltip
    content.querySelectorAll(".equipped-item-name[data-clickable='true']").forEach(el => {
      el.style.cursor = "pointer";
      el.addEventListener("click", () => {
        if (el.dataset.itemId) showEquipmentTooltip(char, el.dataset.itemId);
      });
    });

    // Unequip button
    content.querySelectorAll(".equipped-item-unequip").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.idx);
        char.inventory[idx].equipped = false;
        // Remove from bags too
        if (char.bags) {
          for (const bagId of Object.keys(char.bags)) {
            char.bags[bagId] = (char.bags[bagId] || []).filter(b => b.sourceIdx !== idx);
          }
        }
        save();
        updateEquippedSection(char, save);
        const invRoot = document.getElementById("inventory-root");
        if (invRoot) rebuildInventoryUI(char, invRoot, save);
      });
    });

    // Open Bag buttons
    content.querySelectorAll(".equipped-item-bag-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const bagItemId = btn.dataset.bagItemId;
        const idx = parseInt(btn.dataset.idx);
        const bagItem = char.inventory[idx];
        openBagWindow(char, bagItem, bagItemId, save);
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════════
     BAG WINDOW SYSTEM
     ═══════════════════════════════════════════════════════════════════ */

  function openBagWindow(char, bagItem, bagItemId, save) {
    const existing = document.getElementById("bag-window-" + bagItemId);
    if (existing) { existing.remove(); return; }

    const cfg = BAG_CONFIG[bagItemId];
    if (!cfg) return;
    if (!char.bags[bagItemId]) char.bags[bagItemId] = [];

    const win = document.createElement("div");
    win.className = "bag-window";
    win.id = "bag-window-" + bagItemId;
    win.style.top = "120px";
    win.style.left = "60%";
    document.body.appendChild(win);

    function rebuildBagUI() {
      const contents = char.bags[bagItemId] || [];
      let totalBagBurden = 0;
      for (const c of contents) totalBagBurden += (c.burden || 0) * (c.qty || 1);

      const pct = cfg.capacity > 0 ? Math.min(100, (totalBagBurden / cfg.capacity) * 100) : 0;
      const over = totalBagBurden > cfg.capacity;

      let html = `
        <div class="bag-window-header" id="bag-drag-${bagItemId}">
          <span class="bag-window-title">${bagItem.name}</span>
          <button class="bag-window-close">✕</button>
        </div>
        <div class="bag-window-burden">
          <span>Burden</span>
          <div class="equipped-burden-progress" style="flex:1;margin:0 8px;">
            <div class="equipped-burden-fill ${over ? 'over' : ''}" style="width:${pct}%"></div>
          </div>
          <span>${totalBagBurden} / ${cfg.capacity}</span>
        </div>
        <div class="bag-window-accepts">Accepts: ${cfg.accepts.join(", ")}</div>
        <div class="bag-window-items">
      `;

      if (contents.length === 0) {
        html += '<div class="bag-window-empty">Bag is empty</div>';
      } else {
        for (let i = 0; i < contents.length; i++) {
          const c = contents[i];
          html += `<div class="bag-window-item">
            <span class="bag-window-item-name" data-item-id="${c.itemId || ''}">${c.name}${c.qty > 1 ? ' ×' + c.qty : ''}</span>
            <span class="equipped-item-burden">${c.burden || 0}</span>
            <button class="bag-window-item-remove" data-bidx="${i}" title="Remove from bag">✕</button>
          </div>`;
        }
      }
      html += '</div>';

      // Show compatible equipped items that can be added
      const compatible = (char.inventory || []).filter((it, idx) => {
        if (!it.equipped) return false;
        if (contents.some(c => c.sourceIdx === idx)) return false;
        for (const otherId of Object.keys(char.bags)) {
          if (otherId === bagItemId) continue;
          if ((char.bags[otherId] || []).some(c => c.sourceIdx === idx)) return false;
        }
        if (it.itemId === bagItemId) return false;
        if (BAG_CONFIG[it.itemId]) return false;
        return isCompatibleWithBag(it, cfg);
      });

      if (compatible.length > 0) {
        html += '<div class="bag-window-add-section"><div class="bag-window-add-title">Add to bag:</div>';
        for (const it of compatible) {
          const idx = char.inventory.indexOf(it);
          html += `<button class="bag-window-add-item" data-idx="${idx}">${it.name} (${it.burden || '?'})</button>`;
        }
        html += '</div>';
      }

      win.innerHTML = html;

      // Close
      win.querySelector(".bag-window-close")?.addEventListener("click", () => win.remove());

      // Remove from bag
      win.querySelectorAll(".bag-window-item-remove").forEach(btn => {
        btn.addEventListener("click", () => {
          char.bags[bagItemId].splice(parseInt(btn.dataset.bidx), 1);
          save();
          rebuildBagUI();
          updateEquippedSection(char, save);
        });
      });

      // Add to bag
      win.querySelectorAll(".bag-window-add-item").forEach(btn => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.dataset.idx);
          const it = char.inventory[idx];
          char.bags[bagItemId].push({
            sourceIdx: idx, itemId: it.itemId, name: it.name,
            burden: it.burden || 0, qty: it.qty || 1,
          });
          save();
          rebuildBagUI();
          updateEquippedSection(char, save);
        });
      });

      // Item click → tooltip
      win.querySelectorAll(".bag-window-item-name").forEach(el => {
        if (el.dataset.itemId) {
          el.style.cursor = "pointer";
          el.addEventListener("click", () => showEquipmentTooltip(char, el.dataset.itemId));
        }
      });

      // Drop zone for dragging equipped items into this bag
      const dropZone = win.querySelector(".bag-window-items") || win;
      dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("bag-drop-hover");
      });
      dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("bag-drop-hover");
      });
      dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("bag-drop-hover");
        const idx = parseInt(e.dataTransfer.getData("text/equip-idx"));
        if (isNaN(idx)) return;
        const it = char.inventory[idx];
        if (!it || !it.equipped) return;
        // Already in this bag?
        if (contents.some(c => c.sourceIdx === idx)) return;
        // Already in another bag?
        for (const otherId of Object.keys(char.bags)) {
          if (otherId === bagItemId) continue;
          if ((char.bags[otherId] || []).some(c => c.sourceIdx === idx)) return;
        }
        if (!isCompatibleWithBag(it, cfg)) return;
        char.bags[bagItemId].push({
          sourceIdx: idx, itemId: it.itemId, name: it.name,
          burden: it.burden || 0, qty: it.qty || 1,
        });
        save();
        rebuildBagUI();
        updateEquippedSection(char, save);
      });

      // Draggable window
      makeDraggable(win, win.querySelector(".bag-window-header"));
    }

    rebuildBagUI();
  }

  function isCompatibleWithBag(item, bagCfg) {
    // Custom alchemy items are compatible with alchemy rigs
    if (item.isAlchemy && bagCfg.accepts.some(a => ["Elixir","Flask","Potion","Salve","Poison"].includes(a))) {
      return true;
    }
    const nameLC = (item.name || "").toLowerCase();
    const baseLC = (item.baseName || item.name || "").toLowerCase();
    for (const accepted of bagCfg.accepts) {
      const acc = accepted.toLowerCase();
      if (nameLC.includes(acc) || baseLC.includes(acc)) return true;
    }
    return false;
  }

  function makeDraggable(el, handle) {
    if (!handle) return;
    let dragging = false, startX = 0, startY = 0, origX = 0, origY = 0;
    handle.style.cursor = "grab";

    handle.addEventListener("mousedown", (e) => {
      if (e.target.closest("button")) return;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = el.getBoundingClientRect();
      origX = rect.left;
      origY = rect.top;
      handle.style.cursor = "grabbing";
      e.preventDefault();
    });

    window.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      el.style.left = (origX + e.clientX - startX) + "px";
      el.style.top = (origY + e.clientY - startY) + "px";
    });

    window.addEventListener("mouseup", () => {
      if (dragging) { dragging = false; handle.style.cursor = "grab"; }
    });
  }

  /* ─── Use Consumable Confirm ───────────────────────────────────── */
  function showUseConfirm(itemName, onConfirm) {
    // Remove any existing confirm
    document.getElementById("use-confirm-overlay")?.remove();

    const overlay = document.createElement("div");
    overlay.id = "use-confirm-overlay";
    overlay.className = "use-confirm-overlay";
    overlay.innerHTML = `
      <div class="use-confirm-box">
        <div class="use-confirm-title">Use Item</div>
        <div class="use-confirm-text">Are you sure you want to use <strong>${itemName}</strong>?<br>This will remove it from your inventory.</div>
        <div class="use-confirm-actions">
          <button class="use-confirm-no" id="use-confirm-no">No</button>
          <button class="use-confirm-yes" id="use-confirm-yes">Yes, Use It</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById("use-confirm-yes").addEventListener("click", () => {
      overlay.remove();
      onConfirm();
    });
    document.getElementById("use-confirm-no").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
  }

  /* ─── Fix bag sourceIdx after inventory splice ────────────────── */
  function fixBagIndicesAfterRemove(char, removedIdx) {
    if (!char.bags) return;
    for (const bagId of Object.keys(char.bags)) {
      for (const b of (char.bags[bagId] || [])) {
        if (b.sourceIdx > removedIdx) b.sourceIdx--;
      }
    }
  }

  /* ─── Quantity Prompt ──────────────────────────────────────────── */
  function showQuantityPrompt(itemName, maxQty, onConfirm) {
    document.getElementById("qty-prompt-overlay")?.remove();

    const overlay = document.createElement("div");
    overlay.id = "qty-prompt-overlay";
    overlay.className = "use-confirm-overlay";
    overlay.innerHTML = `
      <div class="use-confirm-box">
        <div class="use-confirm-title">Equip ${itemName}</div>
        <div class="use-confirm-text">How many would you like to equip?</div>
        <div class="qty-prompt-controls">
          <button class="inv-clim-btn" id="qty-prompt-minus">−</button>
          <span class="qty-prompt-value" id="qty-prompt-value">1</span>
          <button class="inv-clim-btn" id="qty-prompt-plus">+</button>
          <span class="qty-prompt-max">/ ${maxQty}</span>
        </div>
        <div class="use-confirm-actions">
          <button class="use-confirm-yes" id="qty-prompt-confirm">Equip</button>
          <button class="use-confirm-no" id="qty-prompt-cancel">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    let val = 1;
    const valEl = document.getElementById("qty-prompt-value");

    document.getElementById("qty-prompt-minus").addEventListener("click", () => {
      if (val > 1) { val--; valEl.textContent = val; }
    });
    document.getElementById("qty-prompt-plus").addEventListener("click", () => {
      if (val < maxQty) { val++; valEl.textContent = val; }
    });
    document.getElementById("qty-prompt-confirm").addEventListener("click", () => {
      overlay.remove();
      onConfirm(val);
    });
    document.getElementById("qty-prompt-cancel").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
  }

  /* ═══════════════════════════════════════════════════════════════════
     SHARED MODAL INFRASTRUCTURE
     ═══════════════════════════════════════════════════════════════════ */

  function getUnspentExp(char) {
    const total = char.totalExp || Character.calculateStartingExp(char);
    return total - Character.calculateSC(char);
  }

  function openFullModal(title, buildBodyFn, onClose) {
    document.getElementById("full-modal-overlay")?.remove();
    const overlay = document.createElement("div");
    overlay.id = "full-modal-overlay";
    overlay.className = "full-modal-overlay";
    overlay.innerHTML = `
      <div class="full-modal">
        <div class="full-modal-header">
          <div class="full-modal-title">${title}</div>
          <button class="full-modal-close">\u2715</button>
        </div>
        <div class="full-modal-body" id="full-modal-body"></div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => { overlay.remove(); if (onClose) onClose(); };
    overlay.querySelector(".full-modal-close").addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

    const body = overlay.querySelector("#full-modal-body");
    buildBodyFn(body, close);
    return overlay;
  }

  function refreshSheetAfterExpChange(char, save) {
    save();
    // Update SC display
    const scEl = document.getElementById("cs-sc-value");
    if (scEl) scEl.textContent = Character.calculateSC(char);
    // Update EXP displays
    const totalEl = document.getElementById("cs-exp-total");
    const unspentEl = document.getElementById("cs-exp-unspent");
    const total = char.totalExp || Character.calculateStartingExp(char);
    const sc = Character.calculateSC(char);
    if (totalEl) totalEl.textContent = total;
    if (unspentEl) unspentEl.textContent = total - sc;

    // Rebuild classes list
    const clsList = document.getElementById("cs-classes-list");
    if (clsList) {
      if (char.classes?.length) {
        clsList.innerHTML = char.classes.map(cls => {
          const masteredBadge = cls.mastered ? ' <span class="cs-mastered-badge">★ Mastered</span>' : '';
          return `<div class="cs-list-item" data-type="class" data-id="${cls.classId}">
            <span class="cs-list-item-name">${cls.name}${masteredBadge}</span>
            <span class="cs-list-item-meta">Tier ${cls.tier} · Lv ${cls.levels}</span>
          </div>`;
        }).join('');
      } else {
        clsList.innerHTML = '<div class="cs-empty">No classes selected</div>';
      }
    }

    // Rebuild breakthroughs list
    const btList = document.getElementById("cs-bt-list");
    if (btList) {
      if (char.breakthroughs?.length) {
        btList.innerHTML = char.breakthroughs.map(bt => `<div class="cs-list-item" data-type="breakthrough" data-id="${bt.breakthroughId}">
          <span class="cs-list-item-name">${bt.name}</span>
          <span class="cs-list-item-meta">${bt.cost} EXP</span>
        </div>`).join('');
      } else {
        btList.innerHTML = '<div class="cs-empty">No breakthroughs selected</div>';
      }
    }

    // Re-render stat blocks with class bonuses
    const baseMainStats = char.effectiveMainStats || char.mainStats || {};
    const baseSubStats = char.effectiveSubStats || char.subStats || {};
    const classMainBonuses = {};
    const classSubBonuses = {};
    for (const cls of (char.classes || [])) {
      for (const lb of (cls.levelBonuses || [])) {
        if (lb.type === "main" && lb.statKey) classMainBonuses[lb.statKey] = (classMainBonuses[lb.statKey] || 0) + 1;
        if (lb.type === "sub" && lb.statKey) classSubBonuses[lb.statKey] = (classSubBonuses[lb.statKey] || 0) + 1;
      }
    }
    // Update each stat value element
    document.querySelectorAll(".cs-stat-block").forEach(block => {
      const key = block.dataset.statKey;
      const type = block.dataset.statType;
      const base = type === "main" ? (baseMainStats[key] || 0) : (baseSubStats[key] || 0);
      const classBonus = type === "main" ? (classMainBonuses[key] || 0) : (classSubBonuses[key] || 0);
      const total = base + classBonus;
      const valueEl = block.querySelector(".cs-stat-value");
      if (valueEl) valueEl.textContent = total;
      if (classBonus > 0) block.classList.add("has-class-bonus");
      else block.classList.remove("has-class-bonus");
    });

    // Rebuild skills grid if present
    const skillsGrid = document.getElementById("cs-skills-grid");
    if (skillsGrid && char.skills) {
      const skillEntries = Object.entries(char.skills).filter(([_, v]) => v.points > 0 || v.expertise?.length > 0);
      skillEntries.sort((a, b) => a[0].localeCompare(b[0]));
      if (skillEntries.length > 0) {
        skillsGrid.innerHTML = skillEntries.map(([name, data]) => {
          let expHtml = '';
          if (data.expertise?.length) {
            expHtml = '<div class="cs-skill-expertise">' +
              data.expertise.map(e => `<span class="cs-expertise-tag">${e.name} ${e.points}</span>`).join('') +
              '</div>';
          }
          return `<div class="cs-skill-cell" data-type="skill" data-id="${name}">
            <div class="cs-skill-header">
              <span class="cs-skill-name">${name}</span>
              <span class="cs-skill-value">${data.points}</span>
            </div>
            ${expHtml}
          </div>`;
        }).join('');
      } else {
        skillsGrid.innerHTML = '<div class="cs-empty">No skills allocated</div>';
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
     SPEND EXP — TABBED MODAL (Breakthroughs + Classes)
     Uses ClassBrowser.create() for the Classes tab (same system as builder)
     ═══════════════════════════════════════════════════════════════════ */

  let spendExpClassBrowser = null;

  function openSpendExpModal(char, save, defaultTab) {
    const startTab = defaultTab || "breakthroughs";
    let currentTab = startTab;
    let classesConfirmed = false;

    // Snapshot character state for revert on cancel
    const snapshot = {
      classes: JSON.parse(JSON.stringify(char.classes || [])),
      totalExp: char.totalExp,
      clim: char.clim,
      mainStats: char.mainStats ? JSON.parse(JSON.stringify(char.mainStats)) : undefined,
      subStats: char.subStats ? JSON.parse(JSON.stringify(char.subStats)) : undefined,
      effectiveMainStats: char.effectiveMainStats ? JSON.parse(JSON.stringify(char.effectiveMainStats)) : undefined,
      effectiveSubStats: char.effectiveSubStats ? JSON.parse(JSON.stringify(char.effectiveSubStats)) : undefined,
      statSources: char.statSources ? JSON.parse(JSON.stringify(char.statSources)) : undefined,
      interludeActions: char.interludeActions ? JSON.parse(JSON.stringify(char.interludeActions)) : undefined,
    };

    ApiClient.getBreakthroughs().then(allBts => {
      openFullModal("\u2726 Spend EXP", (body, close) => {
        function renderTabbedContent() {
          if (spendExpClassBrowser) {
            spendExpClassBrowser.destroy();
            spendExpClassBrowser = null;
          }

          body.innerHTML = `
            <div class="spend-exp-tabs" id="spend-exp-tabs">
              <button class="spend-exp-tab ${currentTab === 'breakthroughs' ? 'active' : ''}" data-exp-tab="breakthroughs">\u2726 Breakthroughs</button>
              <button class="spend-exp-tab ${currentTab === 'classes' ? 'active' : ''}" data-exp-tab="classes">\u2694 Classes</button>
            </div>
            <div class="spend-exp-body" id="spend-exp-body"></div>
          `;

          const tabBody = document.getElementById("spend-exp-body");

          if (currentTab === "breakthroughs") {
            renderBtBrowser(tabBody, close, allBts, char, save);
          } else {
            tabBody.innerHTML = '<div class="cs-tip-loading" style="padding:60px;text-align:center;">Loading classes...</div>';

            spendExpClassBrowser = ClassBrowser.create({
              containerEl: tabBody,
              character: char,
              budgetBase: getUnspentExp(char),
              humanBonus: 0,
              ipMax: 3,
              showBudget: true,
              showInterlude: false,
              deferSync: true,
              showConfirmButton: true,
              idPrefix: "spendexp",
              characterModule: Character,
              apiClient: ApiClient,
              stripHtml: function (s) { return (s || "").replace(/<[^>]*>/g, ""); },
              onMessage: function (text) {
                // Show toast notification (skip empty strings from dismissAndFlash)
                if (!text) return;
                let toast = document.getElementById('spendexp-toast');
                if (!toast) {
                  toast = document.createElement('div');
                  toast.id = 'spendexp-toast';
                  toast.className = 'spendexp-toast';
                  document.body.appendChild(toast);
                }
                toast.textContent = text;
                toast.classList.remove('show');
                void toast.offsetWidth; // force reflow
                toast.classList.add('show');
                clearTimeout(toast._timer);
                toast._timer = setTimeout(() => toast.classList.remove('show'), 4000);
              },
              onClassesChanged: function () {
                refreshSheetAfterExpChange(char, save);
              },
              onSave: function () {
                save();
              },
              onConfirm: function () {
                classesConfirmed = true;
                refreshSheetAfterExpChange(char, save);
                close();
              },
            });

            spendExpClassBrowser.init().catch(function (err) {
              console.error("[SpendEXP ClassBrowser] init failed:", err);
              tabBody.innerHTML = '<div class="cs-tip-loading" style="padding:60px;text-align:center;">Failed to load classes.</div>';
            });
          }

          document.querySelectorAll(".spend-exp-tab").forEach(tab => {
            tab.addEventListener("click", () => {
              const newTab = tab.dataset.expTab;
              if (newTab === currentTab) return;
              currentTab = newTab;
              renderTabbedContent();
            });
          });
        }

        renderTabbedContent();
      }, () => {
        // On modal close
        if (spendExpClassBrowser) {
          // If not confirmed, revert character state
          if (!classesConfirmed) {
            char.classes = snapshot.classes;
            char.totalExp = snapshot.totalExp;
            char.clim = snapshot.clim;
            if (snapshot.mainStats !== undefined) char.mainStats = snapshot.mainStats;
            if (snapshot.subStats !== undefined) char.subStats = snapshot.subStats;
            if (snapshot.effectiveMainStats !== undefined) char.effectiveMainStats = snapshot.effectiveMainStats;
            if (snapshot.effectiveSubStats !== undefined) char.effectiveSubStats = snapshot.effectiveSubStats;
            if (snapshot.statSources !== undefined) char.statSources = snapshot.statSources;
            if (snapshot.interludeActions !== undefined) char.interludeActions = snapshot.interludeActions;
            save();
          }
          spendExpClassBrowser.destroy();
          spendExpClassBrowser = null;
        }
        refreshSheetAfterExpChange(char, save);
      });
    });
  }

  function openSpendExpChooser(char, save, refreshExpDisplay) {
    openSpendExpModal(char, save, "breakthroughs");
  }

  async function openBreakthroughBrowser(char, save) {
    openSpendExpModal(char, save, "breakthroughs");
  }

  async function openClassBrowser(char, save) {
    openSpendExpModal(char, save, "classes");
  }

  /* ── Breakthrough requirement checker ─────────────────────────── */
  let btOverrideMode = false;
  let btMiraneMode = true;
  let btAvailableOnly = false;

  /** Breakthroughs banned under Mirane Expedition rules (from miraneban.txt) */
  const BT_MIRANE_BAN_LIST = [
    "Angelblooded (Human) (Restricted)",
    "Curse of Vampirism",
  ];

  function checkBtRequirement(bt, char) {
    const req = (bt.requirements || "").replace(/<[^>]+>/g, "").trim();
    if (!req || req === "-" || req.toLowerCase() === "none") return { met: true, reason: "" };

    const lower = req.toLowerCase();
    const reasons = [];

    // "character creation" check — always fails on the sheet (post-creation)
    if (lower.includes("character creation") || lower.includes("taken at character creation")) {
      if (!char.breakthroughs?.some(b => b.breakthroughId === bt.breakthroughId)) {
        reasons.push("Can only be taken at character creation");
      }
    }

    // Race checks: "Must be a [race]"
    const raceMatch = lower.match(/must be (?:a |an )?(\w[\w\s'-]*?)(?:\.|,| and | or |$)/i);
    if (raceMatch) {
      const reqRace = raceMatch[1].trim();
      const charRaces = [
        char.race?.primaryRaceName,
        char.race?.ancestryName,
        char.race?.demonHouseName,
      ].filter(Boolean).map(r => r.toLowerCase());
      
      // Multi-race check: "Must be a Nio, Bullfolk or Bearfolk"
      const PRIMARY_RACES = ["human", "fae", "demon", "chimera", "youkai"];
      const raceOptions = reqRace.split(/,\s*|\s+or\s+/i).map(r => r.trim().toLowerCase());
      const raceMatched = raceOptions.some(opt => {
        const words = opt.split(/\s+/).filter(w => w.length > 0);
        if (words.length > 1) {
          // Compound match: "sylph fae" → strip primary race, check only subrace
          const subraceWords = words.filter(w => !PRIMARY_RACES.includes(w));
          if (subraceWords.length > 0) {
            return subraceWords.every(word => charRaces.some(cr => cr.includes(word)));
          }
          return false;
        }
        // Single-word: simple match
        return charRaces.some(cr => cr.includes(opt) || opt.includes(cr));
      });
      if (!raceMatched && !lower.includes("gm approval")) {
        reasons.push(`Requires race: ${reqRace}`);
      }
    }

    // Breakthrough prereq: "Must have [breakthrough name]" or "Must have the [name] breakthrough"
    const btPrereqPatterns = [
      /must have (?:the )?["']?([^"'.]+?)["']?\s*(?:breakthrough|$)/gi,
      /must have (?:purchased |the )?([^.]+?)(?:\.|$)/gi,
    ];
    for (const pattern of btPrereqPatterns) {
      let m;
      while ((m = pattern.exec(lower)) !== null) {
        const prereqName = m[1].trim();
        // Skip non-breakthrough prereqs
        if (prereqName.includes("proficien") || prereqName.includes("armor") || prereqName.includes("skill") || prereqName.includes("flight") || prereqName.includes("used") || prereqName.includes("visited") || prereqName.includes("believer")) continue;
        const hasIt = char.breakthroughs?.some(b => b.name.toLowerCase().includes(prereqName));
        if (!hasIt) {
          reasons.push(`Requires: ${prereqName}`);
        }
      }
    }

    // Class mastery: "[class] mastered"
    const classMatch = lower.match(/(\w[\w\s'-]*?)\s+mastered/i);
    if (classMatch) {
      const reqClass = classMatch[1].trim();
      const hasMastered = char.classes?.some(c => c.name.toLowerCase().includes(reqClass) && c.mastered);
      if (!hasMastered) {
        reasons.push(`Requires ${reqClass} mastered`);
      }
    }

    // GM Approval
    if (lower.includes("gm approval") || lower.includes("requires gm")) {
      reasons.push("Requires GM Approval");
    }

    // Proficiency checks
    if (lower.includes("proficient with") || lower.includes("proficiency in")) {
      // Can't reliably check; allow with warning
    }

    if (reasons.length === 0) return { met: true, reason: "" };
    // Deduplicate
    const unique = [...new Set(reasons)];
    return { met: false, reason: unique.join("; ") };
  }
  /* ── Multi-take breakthrough support ──────────────────────────── */
  function isMultiTakeBt(bt) {
    const text = ((bt.description || '') + ' ' + (bt.name || '')).toLowerCase();
    return text.includes('multiple times') || text.includes('taken multiple') ||
           (text.includes('can be taken') && text.includes('times'));
  }

  /**
   * Choice configuration for multi-take breakthroughs.
   * type: "buttons" (≤10 discrete choices) | "text" (free-form input) | "none" (just stacks)
   */
  const MULTI_TAKE_CHOICES = {
    "Primary Stat Training": {
      type: "buttons",
      label: "Choose a primary stat",
      options: ["Focus", "Power", "Agility", "Toughness"],
      escalatingCost: { base: 400, increment: 100, max: 700 },
    },
    "Secondary Stat Training": {
      type: "buttons",
      label: "Choose a secondary stat",
      options: ["Fitness", "Cunning", "Reason", "Awareness", "Presence"],
    },
    "Weapon Training": {
      type: "text",
      label: "Enter weapon group name",
      placeholder: "e.g. Swords, Axes, Bows...",
      unique: true,
    },
    "Speciality Weapon Training": {
      type: "text",
      label: "Enter speciality weapon group",
      placeholder: "e.g. Whips, Flails...",
      unique: true,
    },
    "Language Training": {
      type: "text",
      label: "Enter language name",
      placeholder: "e.g. Elvish, Draconic...",
      unique: true,
    },
    "Skill Training": {
      type: "text",
      label: "Enter skill name (not crafting)",
      placeholder: "e.g. Athletics, Perception...",
    },
    "Blend In II (Slimefolk)": {
      type: "text",
      label: "Enter race to disguise as",
      placeholder: "e.g. Elf, Dwarf...",
      unique: true,
    },
    "Universal Training": {
      type: "none",
      label: "Stat & skill choices are applied manually",
    },
    "Wide Circuits IV": {
      type: "none",
      label: "+1 maximum Mana (stacks)",
    },
    "Fae Flash Acrobat (Fae)": {
      type: "none",
      label: "Already owned — this does not stack",
      maxCount: 1,
    },
  };

  function renderBtBrowser(body, close, allBts, char, save) {
    const unspent = getUnspentExp(char);
    // Count how many times each BT is owned
    const ownedCounts = new Map();
    (char.breakthroughs || []).forEach(b => {
      ownedCounts.set(b.breakthroughId, (ownedCounts.get(b.breakthroughId) || 0) + 1);
    });

    let html = `
      <div class="browser-budget">
        <span class="browser-budget-label">Unspent EXP</span>
        <span class="browser-budget-value ${unspent < 0 ? 'over-budget' : ''}" id="bt-browser-budget">${unspent}</span>
      </div>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap;">
        <input class="browser-search" id="bt-browser-search" type="text" placeholder="Search breakthroughs..." style="flex:1;min-width:140px;">
        <button class="browser-filter-btn ${btOverrideMode ? 'active-orange' : ''}" id="bt-override-btn" title="Override: bypass requirement checks">⚡ Override</button>
        <button class="cls-mirane-btn ${btMiraneMode ? 'active' : ''}" id="bt-mirane-btn" title="Mirane: filter out banned breakthroughs"><span class="cls-mirane-indicator"></span><span class="cls-mirane-label">Mirane</span></button>
        <button class="cls-mirane-btn ${btAvailableOnly ? 'active' : ''}" id="bt-available-btn" title="Show only available breakthroughs"><span class="cls-mirane-indicator"></span><span>Available</span></button>
      </div>
      <div class="browser-grid" id="bt-browser-grid">
    `;

    // Apply Mirane and Available filters
    let filteredBts = allBts;
    if (btMiraneMode) {
      filteredBts = filteredBts.filter(bt => !BT_MIRANE_BAN_LIST.includes(bt.name));
    }
    if (btAvailableOnly && !btOverrideMode) {
      filteredBts = filteredBts.filter(bt => {
        const reqCheck = checkBtRequirement(bt, char);
        return reqCheck.met;
      });
    }

    for (const bt of filteredBts) {
      const cost = parseInt(bt.cost) || 0;
      const ownCount = ownedCounts.get(bt.breakthroughId) || 0;
      const isOwned = ownCount > 0;
      const multiTake = isMultiTakeBt(bt);
      const choiceCfg = MULTI_TAKE_CHOICES[bt.name] || null;
      const maxCount = choiceCfg && choiceCfg.maxCount ? choiceCfg.maxCount : Infinity;
      const canBuyMore = multiTake && ownCount < maxCount;
      const reqCheck = checkBtRequirement(bt, char);
      const isLocked = !reqCheck.met && !btOverrideMode && !isOwned;
      const isBtBanned = btMiraneMode && BT_MIRANE_BAN_LIST.includes(bt.name);
      const desc = (bt.description || "").replace(/<[^>]+>/g, "").substring(0, 120);

      html += `
        <div class="browser-card ${isOwned ? 'owned' : ''} ${isLocked ? 'locked' : ''} ${multiTake && isOwned ? 'multi-owned' : ''}" data-bt-id="${bt.breakthroughId}" data-name="${(bt.name||'').toLowerCase()}">
          <div class="browser-card-name">${bt.name}</div>
          <div class="browser-card-meta">${bt.requirements || "No requirements"}</div>
          ${isLocked ? `<div class="browser-card-lock-reason">\u26A0 ${reqCheck.reason}</div>` : ''}
          <div class="browser-card-desc">${desc}${desc.length >= 120 ? '...' : ''}</div>
          <div class="browser-card-cost">${cost} EXP${multiTake ? ' <small style="opacity:0.6">(repeatable)</small>' : ''}</div>
          ${((!isOwned && !isLocked) || (canBuyMore && !isLocked)) ? `<div class="browser-card-actions"><button class="browser-action-btn unlock" data-bt-id="${bt.breakthroughId}">Purchase</button></div>` : ''}
          ${isOwned ? '<div class="browser-card-owned-badge">\u2714 Owned' + (multiTake ? ' \u00d7' + ownCount : '') + '</div>' : ''}
        </div>
      `;
    }
    html += `</div>`;
    body.innerHTML = html;

    // Override toggle
    document.getElementById("bt-override-btn")?.addEventListener("click", () => {
      btOverrideMode = !btOverrideMode;
      renderBtBrowser(body, close, allBts, char, save);
    });

    // Mirane toggle
    document.getElementById("bt-mirane-btn")?.addEventListener("click", () => {
      btMiraneMode = !btMiraneMode;
      renderBtBrowser(body, close, allBts, char, save);
    });

    // Available Only toggle
    document.getElementById("bt-available-btn")?.addEventListener("click", () => {
      btAvailableOnly = !btAvailableOnly;
      renderBtBrowser(body, close, allBts, char, save);
    });

    // Search
    document.getElementById("bt-browser-search")?.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      body.querySelectorAll(".browser-card").forEach(card => {
        card.style.display = card.dataset.name.includes(q) ? "" : "none";
      });
    });

    // Purchase — for multi-take BTs, open detail modal for choice picking
    body.querySelectorAll(".browser-action-btn.unlock").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const btId = btn.dataset.btId;
        const bt = allBts.find(b => b.breakthroughId === btId);
        if (!bt) return;
        const multiTake = isMultiTakeBt(bt);
        const choiceCfg = MULTI_TAKE_CHOICES[bt.name] || null;
        // Multi-take BTs with choices → open detail modal instead
        if (multiTake && choiceCfg && choiceCfg.type !== 'none') {
          const card = btn.closest('.browser-card');
          if (card) card.click(); // triggers the detail modal
          return;
        }
        const cost = parseInt(bt.cost) || 0;
        if (cost > getUnspentExp(char)) {
          showUseConfirmSimple("Not Enough EXP", `You need ${cost} EXP but only have ${getUnspentExp(char)} unspent.`, null);
          return;
        }
        showUseConfirmSimple("Purchase Breakthrough", `Spend ${cost} EXP on <strong>${bt.name}</strong>?`, () => {
          char.breakthroughs = char.breakthroughs || [];
          char.breakthroughs.push({
            breakthroughId: btId,
            name: bt.name,
            cost: cost,
            requirements: bt.requirements || "",
            description: (bt.description || "").replace(/<[^>]+>/g, ""),
            abilityId: bt.ability || null,
            fromCreation: false,
          });
          refreshSheetAfterExpChange(char, save);
          renderBtBrowser(body, close, allBts, char, save);
        });
      });
    });

    // Card click -> full detail overlay
    body.querySelectorAll(".browser-card").forEach(card => {
      card.addEventListener("click", (e) => {
        // Don't open detail if they clicked the purchase button
        if (e.target.closest(".browser-action-btn")) return;
        const btId = card.dataset.btId;
        const bt = allBts.find(b => b.breakthroughId === btId);
        if (!bt) return;

        let cost = parseInt(bt.cost) || 0;
        const ownCount = ownedCounts.get(bt.breakthroughId) || 0;
        // Escalating cost for breakthroughs like Primary Stat Training
        const _choiceCfg = MULTI_TAKE_CHOICES[bt.name] || null;
        if (_choiceCfg && _choiceCfg.escalatingCost) {
          cost = Math.min(_choiceCfg.escalatingCost.base + (ownCount * _choiceCfg.escalatingCost.increment), _choiceCfg.escalatingCost.max);
        }
        const isOwned = ownCount > 0;
        const multiTake = isMultiTakeBt(bt);
        const choiceCfg = MULTI_TAKE_CHOICES[bt.name] || null;
        const reqCheck = checkBtRequirement(bt, char);
        const isLocked = !reqCheck.met && !btOverrideMode && !isOwned;
        const fullDesc = (bt.description || "No description.").replace(/<[^>]+>/g, "");
        const reqText = bt.requirements ? bt.requirements.replace(/<[^>]+>/g, "") : "None";

        // Create overlay
        let overlay = document.getElementById("bt-detail-overlay");
        if (overlay) overlay.remove();
        overlay = document.createElement("div");
        overlay.id = "bt-detail-overlay";
        overlay.className = "bt-detail-overlay";
        overlay.innerHTML = `
          <div class="bt-detail-box">
            <button class="bt-detail-close" id="bt-detail-close">\u2715</button>
            <h2 class="bt-detail-title">${bt.name}</h2>
            <div class="bt-detail-req">
              <span class="bt-detail-req-label">Requirements:</span>
              <span class="bt-detail-req-text">${reqText}</span>
            </div>
            ${isLocked ? `<div class="bt-detail-lock-reason">\u26A0 ${reqCheck.reason}</div>` : ''}
            <div class="bt-detail-desc">${fullDesc}</div>
            ${multiTake ? '<div class="bt-detail-multi-info">' + (isOwned ? '<div class="bt-detail-own-count">Owned \u00d7' + ownCount + '</div>' : '') + '<div class="bt-detail-choice-area" id="bt-detail-choice-area"></div></div>' : ''}
            <div class="bt-detail-footer">
              <span class="bt-detail-cost">${cost} EXP</span>
              ${isOwned && !multiTake
                ? '<span class="bt-detail-owned">\u2714 Owned</span> <button class="bt-detail-remove-btn" id="bt-detail-remove">\u2212 Unlearn</button>'
                : isOwned && multiTake
                  ? '<span class="bt-detail-owned">\\u2714 Owned \\u00d7' + ownCount + '</span> <button class="bt-detail-remove-btn" id="bt-detail-remove">\\u2212 Unlearn</button> <button class="bt-detail-purchase-btn" id="bt-detail-purchase">\\u2726 Purchase Again</button>'
                : (!isLocked
                  ? '<button class="bt-detail-purchase-btn" id="bt-detail-purchase">\u2726 Purchase</button>'
                  : '<span class="bt-detail-locked">\uD83D\uDD12 Locked</span>')}
            </div>
          </div>
        `;
        document.body.appendChild(overlay);
        // Force reflow then animate in
        void overlay.offsetWidth;
        overlay.classList.add("active");

        // Populate choice picker for multi-take BTs
        if (multiTake && choiceCfg) {
          const choiceArea = document.getElementById('bt-detail-choice-area');
          if (choiceArea) {
            if (choiceCfg.type === 'buttons') {
              choiceArea.innerHTML = '<div class="bt-choice-label">' + choiceCfg.label + '</div><div class="bt-choice-btns">' +
                choiceCfg.options.map(opt => '<button class="bt-choice-btn" data-choice="' + opt + '">' + opt + '</button>').join('') + '</div>';
              choiceArea.querySelectorAll('.bt-choice-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                  choiceArea.querySelectorAll('.bt-choice-btn').forEach(b => b.classList.remove('selected'));
                  btn.classList.add('selected');
                });
              });
            } else if (choiceCfg.type === 'text') {
              choiceArea.innerHTML = '<div class="bt-choice-label">' + choiceCfg.label + '</div>' +
                '<input type="text" class="bt-choice-input" id="bt-detail-choice-input" placeholder="' + (choiceCfg.placeholder || '') + '">';
            } else {
              choiceArea.innerHTML = '<div class="bt-choice-label" style="opacity:0.6;font-style:italic">' + choiceCfg.label + '</div>';
            }
          }
        }

        // Close
        const closeDetail = () => { overlay.classList.remove("active"); setTimeout(() => overlay.remove(), 200); };
        document.getElementById("bt-detail-close").addEventListener("click", closeDetail);
        overlay.addEventListener("click", (ev) => { if (ev.target === overlay) closeDetail(); });

        // Purchase from detail
        const purchaseBtn = document.getElementById("bt-detail-purchase");
        if (purchaseBtn) {
          purchaseBtn.addEventListener("click", () => {
            if (cost > getUnspentExp(char)) {
              showUseConfirmSimple("Not Enough EXP", `You need ${cost} EXP but only have ${getUnspentExp(char)} unspent.`, null);
              return;
            }
            showUseConfirmSimple("Purchase Breakthrough", `Spend ${cost} EXP on <strong>${bt.name}</strong>?`, () => {
              char.breakthroughs = char.breakthroughs || [];
              const choiceEl = document.getElementById('bt-detail-choice-input') || document.querySelector('.bt-choice-btn.selected');
              const choiceVal = choiceEl ? (choiceEl.value || choiceEl.dataset.choice || '').trim() : '';
              char.breakthroughs.push({
                breakthroughId: btId,
                name: bt.name + (choiceVal ? ': ' + choiceVal : ''),
                cost: cost,
                requirements: bt.requirements || "",
                description: fullDesc,
                abilityId: bt.ability || null,
                fromCreation: false,
                choice: choiceVal || null,
              });
              closeDetail();
              refreshSheetAfterExpChange(char, save);
              renderBtBrowser(body, close, allBts, char, save);
            });
          });
        }

        // Remove / Unlearn from detail
        const removeBtn = document.getElementById("bt-detail-remove");
        if (removeBtn) {
          removeBtn.addEventListener("click", () => {
            showUseConfirmSimple("Unlearn Breakthrough", `Remove <strong>${bt.name}</strong> and refund ${cost} EXP?`, () => {
              // For multi-take, remove only ONE instance; for single, remove all
              if (multiTake) {
                const idx = (char.breakthroughs || []).findIndex(b => b.breakthroughId === btId);
                if (idx !== -1) char.breakthroughs.splice(idx, 1);
              } else {
                char.breakthroughs = (char.breakthroughs || []).filter(b => b.breakthroughId !== btId);
              }
              closeDetail();
              refreshSheetAfterExpChange(char, save);
              renderBtBrowser(body, close, allBts, char, save);
            });
          });
        }
      });
    });
  }





  /* ── Skill definitions (ported from builder) ────────────────────── */
  const SHEET_SKILL_CATEGORIES = [
    { stat: "Fitness",   skills: ["Athletics", "Riding"] },
    { stat: "Cunning",   skills: ["Deception", "Roguecraft", "Stealth"] },
    { stat: "Reason",    skills: ["Artifice", "Appraise", "Common Knowledge", "Flight", "History", "Linguistics", "Magic", "Medicine", "Religion"] },
    { stat: "Awareness", skills: ["Animal Husbandry", "Insight", "Perception", "Survival"] },
    { stat: "Presence",  skills: ["Art", "Intimidation", "Negotiation"] },
  ];
  const SHEET_ALL_SKILL_NAMES = SHEET_SKILL_CATEGORIES.flatMap(c => c.skills);
  const SHEET_ARTISAN_SKILLS = ["Alchemy", "Blacksmith", "Farming", "Carpentry", "Armorsmithing", "Artificer"];

  function parseClassSkillGrantSheet(skillsText, className) {
    if (!skillsText) return [];
    const clean = skillsText.replace(/<[^>]+>/g, "").trim();
    const grants = [];
    const parts = clean.split(/(?=You also gain|You gain)/i).filter(s => s.trim());

    for (const part of parts) {
      const pointMatch = part.match(/\+?(\d+)\s+(?:skill\s+point|skill\b|Transmuter\s+point)/i);
      if (!pointMatch) continue;
      const points = parseInt(pointMatch[1]);
      let allowedSkills = [];
      let isArtisan = false;

      const artisanMatch = part.match(/(?:in|on)\s+(Alchemy|Blacksmith(?:ing)?|Farming|Carpentry|Armorsmithing|Artificer)/i);
      if (artisanMatch) {
        const artName = artisanMatch[1].replace(/ing$/i, "");
        const normalized = SHEET_ARTISAN_SKILLS.find(a => a.toLowerCase().startsWith(artName.toLowerCase())) || artisanMatch[1];
        allowedSkills = [normalized];
        isArtisan = true;
      } else if (/any\s+(?:non[- ]?craft|normal\s+skill|non[- ]?gathering)/i.test(part)) {
        allowedSkills = [...SHEET_ALL_SKILL_NAMES];
      } else {
        const listMatch = part.match(/(?:spend\s+(?:in|on)|points\s+(?:in|on))\s+(.+?)(?:\.\s*You\s+can|\.$|$)/i);
        if (listMatch) {
          const names = listMatch[1].split(/,\s*|\s+or\s+|\s+and\s+/i).map(n => n.trim().replace(/\.$/, "")).filter(n => n.length > 0);
          for (const name of names) {
            const match = SHEET_ALL_SKILL_NAMES.find(s => s.toLowerCase() === name.toLowerCase());
            if (match) allowedSkills.push(match);
            else {
              const artMatch = SHEET_ARTISAN_SKILLS.find(a => a.toLowerCase() === name.toLowerCase());
              if (artMatch) { allowedSkills.push(artMatch); isArtisan = true; }
            }
          }
        }
        if (allowedSkills.length === 0) allowedSkills = [...SHEET_ALL_SKILL_NAMES];
      }

      grants.push({ name: className, points, remaining: points, allowedSkills, isArtisan });
    }
    return grants;
  }

  /* ── Class skill picker modal ──────────────────────────────────── */
  function showClassSkillPicker(cls, char, owned, save, onDone) {
    const grants = parseClassSkillGrantSheet(cls.skills, cls.name);
    if (grants.length === 0) { onDone(); return; }

    // Track allocations locally: skillName -> { points, expertise: [{name, points}] }
    const allocs = {};
    let totalBudget = grants.reduce((s, g) => s + g.points, 0);

    function calcSpent() {
      let s = 0;
      for (const al of Object.values(allocs)) {
        s += al.points + al.expertise.length; // each expertise costs 1 skill pt
      }
      return s;
    }

    // Merge all allowed skills across grants
    const allAllowed = new Set();
    grants.forEach(g => g.allowedSkills.forEach(s => allAllowed.add(s)));

    function getAlloc(sk) {
      if (!allocs[sk]) allocs[sk] = { points: 0, expertise: [] };
      return allocs[sk];
    }

    openFullModal(`\u2694 ${cls.name} \u2014 Skill Points (Level 3)`, (body, close) => {
      function renderPicker() {
        const spent = calcSpent();
        const remaining = totalBudget - spent;
        let html = `
          <div class="browser-budget">
            <span class="browser-budget-label">Skill Points</span>
            <span class="browser-budget-value" id="skill-pick-budget">${remaining} / ${totalBudget} remaining</span>
          </div>
          <div class="skill-pick-desc">${cls.skills || ''}</div>
          <div class="skill-pick-grid">
        `;

        for (const skillName of [...allAllowed].sort()) {
          const al = getAlloc(skillName);
          const pts = al.points;
          const existing = char.skills?.[skillName]?.points || 0;
          const expCount = al.expertise.length;
          const hasPoints = pts > 0 || expCount > 0;

          html += `
            <div class="skill-pick-card ${hasPoints ? 'has-points' : ''}" data-skill="${skillName}">
              <div class="skill-pick-expertise-arrow" data-skill="${skillName}" title="Add Expertise (1 pt \u2192 2 expertise pts)">\u25B2</div>
              <button class="skill-pick-minus" data-skill="${skillName}" ${pts <= 0 ? 'disabled' : ''}>\u2212</button>
              <div class="skill-pick-center">
                <span class="skill-pick-name">${skillName}</span>
                <span class="skill-pick-value">${pts}</span>
                ${existing > 0 ? `<span class="skill-pick-existing">base: ${existing}</span>` : ''}
                ${expCount > 0 ? `<span class="skill-pick-exp-badge">${expCount} exp</span>` : ''}
              </div>
              <button class="skill-pick-plus" data-skill="${skillName}" ${remaining <= 0 ? 'disabled' : ''}>+</button>
            </div>
          `;
        }

        html += `</div>`;
        html += `<div style="margin-top:16px;display:flex;justify-content:flex-end;gap:10px;">
          <button class="browser-action-btn unlock" id="skill-pick-confirm" style="padding:8px 24px;">Confirm Skills</button>
        </div>`;
        body.innerHTML = html;

        // + buttons
        body.querySelectorAll(".skill-pick-plus").forEach(btn => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const sk = btn.dataset.skill;
            if (calcSpent() >= totalBudget) return;
            getAlloc(sk).points++;
            renderPicker();
          });
        });

        // - buttons
        body.querySelectorAll(".skill-pick-minus").forEach(btn => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const sk = btn.dataset.skill;
            const al = getAlloc(sk);
            if (al.points <= 0) return;
            al.points--;
            renderPicker();
          });
        });

        // Expertise arrows
        body.querySelectorAll(".skill-pick-expertise-arrow").forEach(arrow => {
          arrow.addEventListener("click", (e) => {
            e.stopPropagation();
            const sk = arrow.dataset.skill;
            openSkillExpertisePopup(sk, getAlloc(sk), totalBudget - calcSpent(), () => renderPicker());
          });
        });

        // Confirm
        document.getElementById("skill-pick-confirm")?.addEventListener("click", () => {
          char.skills = char.skills || {};
          owned.levelBonuses = owned.levelBonuses || [];
          for (const [skillName, al] of Object.entries(allocs)) {
            const totalPts = al.points + al.expertise.length; // expertise costs 1 pt each
            if (totalPts <= 0) continue;
            if (!char.skills[skillName]) char.skills[skillName] = { points: 0, expertise: [] };
            char.skills[skillName].points += al.points;
            // Add expertise entries
            for (const exp of al.expertise) {
              char.skills[skillName].expertise = char.skills[skillName].expertise || [];
              const existing = char.skills[skillName].expertise.find(e => e.name === exp.name);
              if (existing) existing.points += exp.points;
              else char.skills[skillName].expertise.push({ name: exp.name, points: exp.points });
            }
            owned.levelBonuses.push({ level: 3, type: "skill", skillName, points: al.points, expertise: al.expertise });
          }
          save();
          document.getElementById("full-modal-overlay")?.remove();
          onDone();
        });
      }
      renderPicker();
    });
  }

  /* ── Expertise popup for skill picker ─────────────────────────── */
  function openSkillExpertisePopup(skillName, alloc, remainingBudget, onUpdate) {
    document.getElementById("expertise-pick-overlay")?.remove();
    const overlay = document.createElement("div");
    overlay.id = "expertise-pick-overlay";
    overlay.className = "use-confirm-overlay";

    function renderPopup() {
      const expHtml = alloc.expertise.length === 0
        ? '<div style="color:var(--clr-text-dim);font-size:0.75rem;margin:8px 0;">No expertise added yet.</div>'
        : alloc.expertise.map((exp, i) => `
          <div style="display:flex;align-items:center;gap:8px;margin:4px 0;">
            <span style="flex:1;font-size:0.78rem;">${exp.name}</span>
            <span style="font-family:var(--font-mono);font-size:0.75rem;color:var(--clr-gold);">${exp.points} pts</span>
            <button class="exp-pop-remove" data-idx="${i}" style="background:none;border:none;color:#e74c3c;cursor:pointer;font-size:0.9rem;" title="Remove">\u2715</button>
          </div>
        `).join('');

      overlay.innerHTML = `
        <div class="use-confirm-box" style="max-width:380px;">
          <div class="use-confirm-title">Expertise: ${skillName}</div>
          <div style="font-size:0.72rem;color:var(--clr-text-dim);margin-bottom:10px;">
            Each expertise costs <strong>1 skill point</strong> and grants <strong>2 expertise points</strong>.
          </div>
          <div id="exp-entries">${expHtml}</div>
          <div style="display:flex;gap:8px;margin-top:12px;">
            <input type="text" id="exp-name-input" placeholder="New expertise name..." maxlength="60"
              style="flex:1;padding:6px 10px;border:1px solid var(--clr-border);border-radius:6px;background:rgba(255,255,255,0.03);color:var(--clr-text);font-size:0.78rem;">
            <button id="exp-add-btn" class="browser-action-btn unlock" style="padding:4px 12px;font-size:0.65rem;" ${remainingBudget <= 0 ? 'disabled title="No skill points remaining"' : ''}>Add (+2 pts)</button>
          </div>
          <div style="margin-top:14px;text-align:right;">
            <button id="exp-close-btn" class="browser-action-btn unlock" style="padding:6px 16px;">Done</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      // Add expertise
      document.getElementById("exp-add-btn")?.addEventListener("click", () => {
        const input = document.getElementById("exp-name-input");
        const name = (input?.value || "").trim();
        if (!name) return;
        alloc.expertise.push({ name, points: 2 });
        onUpdate();
        overlay.remove();
        openSkillExpertisePopup(skillName, alloc, onUpdate);
      });

      // Enter key to add
      document.getElementById("exp-name-input")?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") document.getElementById("exp-add-btn")?.click();
      });

      // Remove
      overlay.querySelectorAll(".exp-pop-remove").forEach(btn => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.dataset.idx);
          alloc.expertise.splice(idx, 1);
          onUpdate();
          overlay.remove();
          openSkillExpertisePopup(skillName, alloc, onUpdate);
        });
      });

      // Done
      document.getElementById("exp-close-btn")?.addEventListener("click", () => {
        overlay.remove();
      });

      // Click outside
      overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
    }
    renderPopup();
  }

  /* ── Stat choice parser (ported from builder) ──────────────────── */
  function parseStatChoicesSheet(text, statType) {
    if (!text) return [];
    const allNames = statType === "main"
      ? Object.values(Character.MAIN_STAT_NAMES)
      : Object.values(Character.SUB_STAT_NAMES);
    const allKeys = statType === "main" ? Character.MAIN_STAT_KEYS : Character.SUB_STAT_KEYS;
    const nameToKey = {};
    allKeys.forEach((k, i) => { nameToKey[allNames[i].toLowerCase()] = k; });

    const textLower = text.toLowerCase();
    if (textLower.includes(" or ")) {
      const found = [];
      for (const name of allNames) {
        if (textLower.includes(name.toLowerCase())) {
          found.push({ name, key: nameToKey[name.toLowerCase()] });
        }
      }
      return found;
    }
    return [];
  }

  /* ── Stat picker modal ─────────────────────────────────────────── */
  function showStatPickerModal(className, isHeart, text, choices, onPick) {
    document.getElementById("stat-pick-overlay")?.remove();
    const overlay = document.createElement("div");
    overlay.id = "stat-pick-overlay";
    overlay.className = "stat-pick-overlay";
    overlay.innerHTML = `
      <div class="stat-pick-box">
        <div class="stat-pick-title">${className} — ${isHeart ? "Heart (Level 5)" : "Soul (Level 7)"}</div>
        <div class="stat-pick-text">${text}</div>
        <div class="stat-pick-options">
          ${choices.map(c => `<button class="stat-pick-option" data-key="${c.key}">+1 ${c.name}</button>`).join("")}
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelectorAll(".stat-pick-option").forEach(btn => {
      btn.addEventListener("click", () => {
        overlay.remove();
        onPick(btn.dataset.key);
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════════
     SHOP MODAL
     ═══════════════════════════════════════════════════════════════════ */

  async function openShopModal(char, save, invContainer) {
    const [allItems, itemModsData] = await Promise.all([
      ApiClient.getItems(),
      ApiClient.getItemMods(),
    ]);
    const items = allItems.filter(i => i.subType !== "Mods");

    openFullModal("\ud83d\uded2 Item Shop", (body, close) => {
      renderShop(body, close, items, itemModsData, char, save, invContainer);
    });
  }

  function getItemFilterCategory(item) {
    const t = (item.type || "").toLowerCase();
    const st = (item.subType || "").toLowerCase();
    if (t.includes("weapon") || st.includes("weapon")) return "weapons";
    if (t.includes("armor") || st.includes("armor") || st.includes("shield")) return "armor";
    if (t.includes("alchemy")) return "alchemy";
    if (t.includes("artifice")) return "artifice";
    if (t.includes("adventuring")) return "adventuring";
    return "other";
  }

  function parseItemCostSheet(costStr) {
    if (!costStr) return 0;
    const m = String(costStr).match(/[\d,]+/);
    return m ? parseInt(m[0].replace(/,/g, "")) : 0;
  }

  function getModsForItemSheet(item, modsData) {
    const mods = modsData[item.itemId];
    return Array.isArray(mods) ? mods : [];
  }

  function renderShop(body, close, items, modsData, char, save, invContainer) {
    let currentCat = "all";
    let detailItem = null;
    let detailMods = [];

    function renderGrid() {
      const filtered = currentCat === "all" ? items : items.filter(i => getItemFilterCategory(i) === currentCat);

      let html = `
        <div class="browser-budget">
          <span class="browser-budget-label">Clim Balance</span>
          <span class="browser-budget-value" id="shop-budget">${char.clim || 0}</span>
        </div>
        <div class="browser-tabs" id="shop-tabs">
          ${["all","weapons","armor","alchemy","artifice","adventuring","other"].map(c =>
            `<button class="browser-tab ${c === currentCat ? 'active' : ''}" data-cat="${c}">${c.charAt(0).toUpperCase()+c.slice(1)}</button>`
          ).join("")}
        </div>
        <input class="browser-search" id="shop-search" type="text" placeholder="Search items...">
      `;

      if (detailItem) {
        html += renderShopDetail(detailItem, detailMods, modsData, char);
      } else {
        html += `<div class="browser-grid" id="shop-grid">`;
        for (const item of filtered) {
          const cost = parseItemCostSheet(item.cost);
          const imgSrc = item.imageSmUrl || "";
          html += `
            <div class="browser-card" data-item-id="${item.itemId}" data-name="${(item.name||'').toLowerCase()}">
              ${imgSrc ? `<div class="browser-card-img"><img src="${imgSrc}" alt="${item.name}" loading="lazy"></div>` : ''}
              <div class="browser-card-name">${item.name}</div>
              <div class="browser-card-meta">${item.subType || item.type}</div>
              <div class="browser-card-cost">${cost > 0 ? cost + " Clim" : "Free"}</div>
            </div>
          `;
        }
        html += `</div>`;
      }

      body.innerHTML = html;

      // Tabs
      body.querySelectorAll(".browser-tab").forEach(tab => {
        tab.addEventListener("click", () => {
          currentCat = tab.dataset.cat;
          detailItem = null;
          detailMods = [];
          renderGrid();
        });
      });

      // Search
      document.getElementById("shop-search")?.addEventListener("input", (e) => {
        const q = e.target.value.toLowerCase();
        body.querySelectorAll(".browser-card").forEach(card => {
          if (card.dataset.name) card.style.display = card.dataset.name.includes(q) ? "" : "none";
        });
      });

      if (detailItem) {
        const goBack = () => { detailItem = null; detailMods = []; renderGrid(); };
        bindShopDetailEvents(body, detailItem, detailMods, modsData, char, save, invContainer, close, goBack);
      } else {
        // Card click → detail
        body.querySelectorAll(".browser-card").forEach(card => {
          card.addEventListener("click", () => {
            const itemId = card.dataset.itemId;
            const item = items.find(i => i.itemId === itemId);
            if (item) {
              detailItem = item;
              detailMods = [];
              renderGrid();
            }
          });
        });
      }
    }

    renderGrid();
  }

  function renderShopDetail(item, selectedMods, modsData, char) {
    const baseCost = parseItemCostSheet(item.cost);
    const modCost = selectedMods.reduce((s, m) => s + (m.p || 0), 0) * 25;
    const totalCost = baseCost + modCost;
    const availMods = getModsForItemSheet(item, modsData);
    const imgSrc = item.imageSmUrl || "";
    const desc = item.description || "No description available.";

    let modsHtml = '';
    if (availMods.length > 0) {
      modsHtml = `
        <div class="shop-detail-mods-title">Available Mods</div>
        <div class="shop-detail-mods">
          ${availMods.map((m, i) => {
            const isSelected = selectedMods.some(sm => sm.n === m.n);
            return `<span class="shop-detail-mod ${isSelected ? 'selected' : ''}" data-mod-idx="${i}">${m.n} (+${m.p * 25} Clim)</span>`;
          }).join("")}
        </div>
      `;
    }

    return `
      <div class="shop-detail">
        <div class="shop-detail-header">
          ${imgSrc ? `<img class="shop-detail-img" src="${imgSrc}" alt="${item.name}">` : ''}
          <div class="shop-detail-info">
            <div class="shop-detail-name">${item.name}</div>
            <div class="shop-detail-type">${item.type} — ${item.subType || "General"}</div>
            <div class="shop-detail-cost">${totalCost > 0 ? totalCost + " Clim" : "Free"}${modCost > 0 ? ` (base ${baseCost} + mods ${modCost})` : ''}</div>
          </div>
        </div>
        <div class="shop-detail-desc">${desc}</div>
        ${modsHtml}
        <div class="shop-detail-actions">
          <button class="browser-action-btn unlock" id="shop-detail-buy">Purchase${totalCost > 0 ? ` (${totalCost} Clim)` : ''}</button>
          <button class="browser-action-btn" id="shop-detail-back" style="border-color:var(--clr-border);color:var(--clr-text-dim);">\u2190 Back</button>
        </div>
      </div>
    `;
  }

  function bindShopDetailEvents(body, item, selectedMods, modsData, char, save, invContainer, close, goBack) {
    const availMods = getModsForItemSheet(item, modsData);

    // Mod toggle
    body.querySelectorAll(".shop-detail-mod").forEach(el => {
      el.addEventListener("click", () => {
        const idx = parseInt(el.dataset.modIdx);
        const mod = availMods[idx];
        const existing = selectedMods.findIndex(m => m.n === mod.n);
        if (existing >= 0) {
          selectedMods.splice(existing, 1);
        } else {
          selectedMods.push(mod);
        }
        // Re-render detail portion
        const detailEl = body.querySelector(".shop-detail");
        if (detailEl) {
          detailEl.outerHTML = renderShopDetail(item, selectedMods, modsData, char);
          bindShopDetailEvents(body, item, selectedMods, modsData, char, save, invContainer, close, goBack);
        }
      });
    });

    // Buy
    document.getElementById("shop-detail-buy")?.addEventListener("click", () => {
      const baseCost = parseItemCostSheet(item.cost);
      const modCost = selectedMods.reduce((s, m) => s + (m.p || 0), 0) * 25;
      const totalCost = baseCost + modCost;

      if (totalCost > (char.clim || 0)) {
        showUseConfirmSimple("Not Enough Clim", `This costs ${totalCost} Clim but you only have ${char.clim || 0}.`, null);
        return;
      }

      const modNames = selectedMods.map(m => m.n);
      const displayName = modNames.length > 0 ? item.name + " (" + modNames.join(", ") + ")" : item.name;

      showUseConfirmSimple("Confirm Purchase", `Buy <strong>${displayName}</strong> for ${totalCost} Clim?`, () => {
        char.clim = (char.clim || 0) - totalCost;
        char.inventory = char.inventory || [];
        char.inventory.push({
          id: crypto.randomUUID(),
          name: displayName,
          baseName: item.name,
          cost: totalCost,
          mods: modNames,
          itemId: item.itemId,
          description: "",
          custom: false,
          qty: 1,
        });
        save();
        if (invContainer) rebuildInventoryUI(char, invContainer, save);
        // Update budget display
        const budgetEl = document.getElementById("shop-budget");
        if (budgetEl) budgetEl.textContent = char.clim;
        // Update clim display
        const climEl = document.getElementById("inv-clim-value");
        if (climEl) climEl.textContent = char.clim;
      });
    });

    // Back
    document.getElementById("shop-detail-back")?.addEventListener("click", () => {
      goBack();
    });
  }

  /* ── Browser detail popup ──────────────────────────────────────── */
  function showBrowserDetail(title, descHtml, extraHtml) {
    const overlay = document.getElementById("cs-tooltip-overlay");
    const titleEl = document.getElementById("cs-tooltip-title");
    const bodyEl = document.getElementById("cs-tooltip-body");
    if (!overlay || !titleEl || !bodyEl) return;
    titleEl.textContent = title;
    bodyEl.innerHTML = (extraHtml ? `<div style="margin-bottom:12px;font-size:0.78rem;color:var(--clr-text-dim);">${extraHtml}</div>` : "") + descHtml;
    overlay.classList.add("active");
  }

  /* ── Simple confirm (reusable) ─────────────────────────────────── */
  function showUseConfirmSimple(title, text, onConfirm) {
    document.getElementById("use-confirm-overlay")?.remove();
    const overlay = document.createElement("div");
    overlay.id = "use-confirm-overlay";
    overlay.className = "use-confirm-overlay";
    overlay.innerHTML = `
      <div class="use-confirm-box">
        <div class="use-confirm-title">${title}</div>
        <div class="use-confirm-text">${text}</div>
        <div class="use-confirm-actions">
          ${onConfirm ? `
            <button class="use-confirm-no" id="simple-confirm-no">No</button>
            <button class="use-confirm-yes" id="simple-confirm-yes">Confirm</button>
          ` : `
            <button class="use-confirm-yes" id="simple-confirm-ok">OK</button>
          `}
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    if (onConfirm) {
      document.getElementById("simple-confirm-yes").addEventListener("click", () => { overlay.remove(); onConfirm(); });
      document.getElementById("simple-confirm-no").addEventListener("click", () => overlay.remove());
    } else {
      document.getElementById("simple-confirm-ok").addEventListener("click", () => overlay.remove());
    }
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
  }

  /* ═══════════════════════════════════════════════════════════════════
     PROFICIENCIES TAB
     ═══════════════════════════════════════════════════════════════════ */
  function renderProficienciesPage(char, save) {
    const container = document.getElementById("proficiencies-root");
    if (!container) return;

    // Initialize proficiency data
    if (!char.proficiencies) {
      char.proficiencies = {
        weapons: [],
        armor: [],
        languages: [],
      };
      // Seed from race data
      const raceName = char.race?.primaryRaceName?.toLowerCase() || "";
      if (raceName === "demon") {
        char.proficiencies.languages.push("Common", "Sorthen");
      } else if (raceName === "fae") {
        char.proficiencies.languages.push("Sylvan", "Common");
      } else if (raceName === "human") {
        char.proficiencies.languages.push("Common");
      } else if (raceName === "youkai") {
        char.proficiencies.languages.push("Kiraran", "Common");
      } else if (raceName === "chimera") {
        char.proficiencies.languages.push("Common");
      } else {
        char.proficiencies.languages.push("Common");
      }
    }

    const CATEGORIES = [
      { key: "weapons", label: "Weapon Proficiencies", icon: "\u2694", placeholder: "e.g. Light Swords, Channeling Weapons..." },
      { key: "armor",   label: "Armor Proficiencies",  icon: "\u{1F6E1}",  placeholder: "e.g. Light Armor, Shields..." },
      { key: "languages", label: "Languages",          icon: "\u{1F4AC}", placeholder: "e.g. Sorthen, Sylvan..." },
    ];

    function render() {
      let html = `<div class="prof-page">`;

      for (const cat of CATEGORIES) {
        const items = char.proficiencies[cat.key] || [];
        html += `
          <div class="prof-section">
            <div class="prof-section-header">
              <span class="prof-section-icon">${cat.icon}</span>
              <span class="prof-section-title">${cat.label}</span>
              <span class="prof-section-count">${items.length}</span>
            </div>
            <div class="prof-list" id="prof-list-${cat.key}">
        `;
        for (let i = 0; i < items.length; i++) {
          html += `
            <div class="prof-item">
              <span class="prof-item-text">${items[i]}</span>
              <button class="prof-item-remove" data-cat="${cat.key}" data-idx="${i}" title="Remove">\u2715</button>
            </div>
          `;
        }
        if (items.length === 0) {
          html += `<div class="prof-empty">None</div>`;
        }
        html += `
            </div>
            <div class="prof-add-row">
              <input type="text" class="prof-add-input" id="prof-input-${cat.key}" placeholder="${cat.placeholder}" maxlength="80">
              <button class="prof-add-btn" data-cat="${cat.key}">+ Add</button>
            </div>
          </div>
        `;
      }

      html += `</div>`;
      container.innerHTML = html;

      // Bind remove buttons
      container.querySelectorAll(".prof-item-remove").forEach(btn => {
        btn.addEventListener("click", () => {
          const cat = btn.dataset.cat;
          const idx = parseInt(btn.dataset.idx);
          char.proficiencies[cat].splice(idx, 1);
          save();
          render();
        });
      });

      // Bind add buttons
      container.querySelectorAll(".prof-add-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const cat = btn.dataset.cat;
          const input = document.getElementById(`prof-input-${cat}`);
          const val = input.value.trim();
          if (!val) return;
          char.proficiencies[cat] = char.proficiencies[cat] || [];
          char.proficiencies[cat].push(val);
          save();
          render();
        });
      });

      // Bind enter key on inputs
      container.querySelectorAll(".prof-add-input").forEach(input => {
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const cat = input.id.replace("prof-input-", "");
            const val = input.value.trim();
            if (!val) return;
            char.proficiencies[cat] = char.proficiencies[cat] || [];
            char.proficiencies[cat].push(val);
            save();
            render();
          }
        });
      });
    }

    render();
  }

})();
