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

  const TAB_ORDER = ["stats", "abilities", "inventory"];

  const ABILITY_LEVEL_MAP = [
    { level: 1, idKey: "keyAbilityId", nameKey: "keyAbilityName", label: "Key Ability", isKey: true },
    { level: 2, idKey: "ability1Id", nameKey: "ability1Name", label: "Ability 1", isKey: false },
    { level: 4, idKey: "ability2Id", nameKey: "ability2Name", label: "Ability 2", isKey: false },
    { level: 6, idKey: "ability3Id", nameKey: "ability3Name", label: "Ability 3", isKey: false },
    { level: 8, idKey: "ultimateAbilityId", nameKey: "ultimateAbilityName", label: "Ultimate", isKey: false },
  ];

  let statSourcePopup = null;

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
  bindTabNavigation();
  renderAbilitiesPage(char);
  renderInventoryPage(char, saveToVault);

  /* ═══════════════════════════════════════════════════════════════════
     RENDER SHEET
     ═══════════════════════════════════════════════════════════════════ */
  function renderSheet(char, container) {
    const mainStats = char.effectiveMainStats || char.mainStats || {};
    const subStats = char.effectiveSubStats || char.subStats || {};
    const derived = char.derivedStats || {};

    // ── Race line ──
    const raceParts = [];
    if (char.race?.primaryRaceName) raceParts.push(char.race.primaryRaceName);
    if (char.race?.ancestryName) raceParts.push(char.race.ancestryName);
    if (char.race?.demonHouseName) raceParts.push(`House ${char.race.demonHouseName}`);
    if (char.race?.elementalMastery) raceParts.push(`${char.race.elementalMastery} Element`);

    // ── Stat blocks ──
    function renderStatBlocks(stats, keys, nameMap, type) {
      return keys.map(key => {
        const val = stats[key] || 0;
        const bonused = (type === "main" && char.raceBonuses?.mainStat === key) ||
                        (type === "sub" && char.raceBonuses?.subStat === key);
        return `<div class="cs-stat-block${bonused ? " has-bonus" : ""}" data-stat-key="${key}" data-stat-type="${type}">
          <div class="cs-stat-value">${val}</div>
          <div class="cs-stat-label">${nameMap[key]}</div>
        </div>`;
      }).join("");
    }

    // ── Derived stats ──
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
    const genderBtns = genderOptions.map(g =>
      `<button class="cs-gender-btn${char.gender === g ? " active" : ""}" data-gender="${g}">${g}</button>`
    ).join("");

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
            <div class="cs-name-display">${char.name || "Unnamed"}</div>
            <div class="cs-identity-row">
              <div class="cs-race-line">${raceParts.join("  ·  ")}</div>
              <div class="cs-gender-select">
                <label class="cs-gender-label">Gender</label>
                <div class="cs-gender-options" id="cs-gender-options">${genderBtns}</div>
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
          `<div class="cs-derived-stat">
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
        </div>
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

      <!-- Equipped (placeholder) -->
      <div class="cs-section cs-section-full">
        <div class="cs-section-title">Equipped</div>
        <div class="cs-empty" style="padding:16px;text-align:center;font-size:0.82rem;color:var(--clr-text-muted);">Coming soon — equip items from your Inventory tab.</div>
      </div>
    `;

    // Bind stat hover tooltips
    bindStatHovers(char, container);
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
    const container = document.getElementById("cs-gender-options");
    if (!container) return;
    container.addEventListener("click", (e) => {
      const btn = e.target.closest(".cs-gender-btn");
      if (!btn) return;
      container.querySelectorAll(".cs-gender-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      char.gender = btn.dataset.gender;
      saveToVault();
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

  /* ═══════════════════════════════════════════════════════════════════
     TOOLTIP EVENTS — clicking classes, breakthroughs, items, skills
     ═══════════════════════════════════════════════════════════════════ */
  function bindTooltipEvents(char, container) {
    const overlay = document.getElementById("cs-tooltip-overlay");
    const titleEl = document.getElementById("cs-tooltip-title");
    const bodyEl = document.getElementById("cs-tooltip-body");
    const closeBtn = document.getElementById("cs-tooltip-close");

    closeBtn.addEventListener("click", () => overlay.classList.remove("open"));
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.classList.remove("open"); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") overlay.classList.remove("open"); });

    container.addEventListener("click", (e) => {
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
            html += `<div class="ability-stat-row"><span class="ability-stat-label">Associated</span><span class="ability-stat-value">${ka.associatedAbility}</span></div>`;
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

        html += `<div class="inv-item-row" data-idx="${i}">
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
            <div class="inv-qty-controls">
              <button class="inv-qty-btn inv-qty-down" data-idx="${i}" title="Remove one">−</button>
              <span class="inv-qty-value">${item.qty}</span>
              <button class="inv-qty-btn inv-qty-up" data-idx="${i}" title="Add one">+</button>
            </div>
            <button class="inv-item-delete" data-idx="${i}" title="Remove from inventory">✕</button>
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
    });
    document.getElementById("inv-add-confirm")?.addEventListener("click", () => {
      const name = document.getElementById("inv-add-name").value.trim();
      if (!name) return;
      const desc = document.getElementById("inv-add-desc").value.trim();
      if (!char.inventory) char.inventory = [];
      char.inventory.push({
        id: crypto.randomUUID(),
        name,
        cost: 0,
        mods: [],
        itemId: null,
        description: desc,
        custom: true,
        qty: 1,
      });
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

})();
