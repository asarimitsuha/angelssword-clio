/* ═══════════════════════════════════════════════════════════════════════════
   ClassBrowser — shared, self-contained class-browsing module.
   Attach via window.ClassBrowser  (IIFE, no imports).
   ═══════════════════════════════════════════════════════════════════════════ */
window.ClassBrowser = (function () {
  "use strict";

  /* ─── Constants ──────────────────────────────────────────────────────── */

  /** Progression level definitions (8 rows) */
  var CLS_LEVELS = [
    { key: "keyAbilityName",      label: "Key Ability" },
    { key: "ability1Name",        label: "Ability 1" },
    { key: "skills",              label: "Skills" },
    { key: "ability2Name",        label: "Ability 2" },
    { key: "heart",               label: "Heart" },
    { key: "ability3Name",        label: "Ability 3" },
    { key: "soul",                label: "Soul" },
    { key: "ultimateAbilityName", label: "Ultimate" },
  ];

  /**
   * Free class grants keyed by race/house/ancestry.
   * Each entry: match fields, classId, starting level, display source.
   */
  var FREE_CLASS_GRANTS = [
    // Demon Houses
    { match: { race: "demon", demonHouseId: "wi"  }, classId: "saboteur",                 level: 1, source: "House Wi" },
    { match: { race: "demon", demonHouseId: "un"  }, classId: "maid",                     level: 1, source: "House Un" },
    { match: { race: "demon", demonHouseId: "vi"  }, classId: "medic",                    level: 1, source: "House Vi" },
    // Fae Ancestries
    { match: { race: "fae",   ancestryId: "gnome"  }, classId: "miner",                   level: 1, source: "Gnome" },
    { match: { race: "fae",   ancestryId: "selkie" }, classId: "hydromancer",              level: 2, source: "Selkie" },
    // Youkai Ancestries
    { match: { race: "youkai", ancestryId: "raijin" }, classId: "flash-star-blade-style-", level: 1, source: "Raijin" },
  ];

  /** Interlude actions that consume unused IP */
  var INTERLUDE_ACTIONS = [
    { id: "job",   label: "Job",   desc: "+300 CLIM", clim: 300, exp: 0  },
    { id: "train", label: "Train", desc: "+25 EXP",   clim: 0,   exp: 25 },
    { id: "other", label: "Other", desc: "Manual",    clim: 0,   exp: 0  },
  ];

  /** Classes banned under Mirane Expedition rules */
  var clsMiraneBanList = [
    "angelblooded", "shinigami-eyes", "vampire", "vampire-lord", "true-shinigami-eyes",
  ];

  /** Classes known to grant at least 1 spell when unlocked */
  var SPELL_GRANTING_CLASSES = new Set([
    "mage", "sorcerer", "acolyte", "pyromancer", "hydromancer", "cryomancer",
    "electromancer", "aeromancer", "mycomancer", "sage", "archsage",
    "battle-mage", "mage-knight", "aerial-mage", "warding-mage",
    "abjurer", "sanctioner", "elementalist", "phosphomancer",
    "spellblade", "spell-blademaster", "starcaller", "daionmyoji",
    "high-priest", "onmyoji", "necromancer", "necromaster",
    "pyromaster", "aeromaster", "shadow-thief", "shadowbringer",
    "windbringer", "zephyr-warder", "venomancer",
  ]);


  /* ═══════════════════════════════════════════════════════════════════════
     Factory: create(config) → controller
     ═══════════════════════════════════════════════════════════════════════ */

  /**
   * @param {Object} config
   * @param {HTMLElement}  config.containerEl      — where to render the browser
   * @param {Object}       config.character        — character object (read/write)
   * @param {number}       [config.budgetBase=1000] — EXP budget (Infinity for none)
   * @param {number}       [config.humanBonus=100]  — extra for humans (0 for none)
   * @param {number}       [config.ipMax=3]         — IP limit (Infinity for none)
   * @param {boolean}      [config.showBudget=true]
   * @param {boolean}      [config.showInterlude=true]
   * @param {Function}     [config.onMessage]       — (text, sprite) => void
   * @param {Function}     [config.onClassesChanged]
   * @param {Function}     [config.onSave]
   * @param {Object}       config.characterModule   — Character module reference
   * @param {Object}       config.apiClient         — ApiClient module reference
   * @param {Function}     config.stripHtml         — utility
   * @param {string}       [config.idPrefix='cb']   — DOM ID prefix
   */
  function create(config) {
    /* ─── Config defaults ──────────────────────────────────────────── */
    var cfg = {
      containerEl:      config.containerEl,
      character:        config.character,
      budgetBase:       config.budgetBase   != null ? config.budgetBase   : 1000,
      humanBonus:       config.humanBonus   != null ? config.humanBonus   : 100,
      ipMax:            config.ipMax        != null ? config.ipMax        : 3,
      showBudget:       config.showBudget   != null ? config.showBudget   : true,
      showInterlude:    config.showInterlude != null ? config.showInterlude : true,
      deferSync:        config.deferSync    != null ? config.deferSync    : false,
      showConfirmButton: config.showConfirmButton != null ? config.showConfirmButton : false,
      onMessage:        config.onMessage        || function () {},
      onClassesChanged: config.onClassesChanged || function () {},
      onSave:           config.onSave           || function () {},
      onConfirm:        config.onConfirm        || function () {},
      characterModule:  config.characterModule,
      apiClient:        config.apiClient,
      stripHtml:        config.stripHtml || function (s) { return s; },
      idPrefix:         config.idPrefix || "cb",
    };

    /* ─── Internal state ───────────────────────────────────────────── */
    var character       = cfg.character;
    var allClassesData  = [];
    var _keyAbilities   = null; // cached from API
    var _trueAbilities   = null; // cached from API

    // ── Floating hover tooltip for abilities ──
    var hoverTip = document.createElement("div");
    hoverTip.className = "cls-ability-hover-tip";
    hoverTip.id = cfg.idPrefix + "-ability-hover-tip";
    document.body.appendChild(hoverTip);
    var hoverTipTimer = null;
    var hoverTipAbilityCache = {}; // abilityId → HTML content

    function showHoverTip(e, html) {
      hoverTip.innerHTML = html;
      hoverTip.style.left = "-9999px";
      hoverTip.style.top = "-9999px";
      hoverTip.classList.add("visible");
      // Wait one frame so the browser computes layout
      requestAnimationFrame(function () {
        positionHoverTip(e);
      });
    }

    function positionHoverTip(e) {
      var cx = e.clientX || 0;
      var cy = e.clientY || 0;
      // fallback if event coords are 0 (stale)
      if (cx === 0 && cy === 0 && e.target) {
        var rect = e.target.getBoundingClientRect();
        cx = rect.right;
        cy = rect.top + rect.height / 2;
      }
      var tipW = hoverTip.offsetWidth;
      var tipH = hoverTip.offsetHeight;
      var x = cx + 14;
      var y = cy + 14;
      if (x + tipW > window.innerWidth - 12) x = cx - tipW - 14;
      if (y + tipH > window.innerHeight - 12) y = window.innerHeight - tipH - 12;
      if (y < 12) y = 12;
      if (x < 12) x = 12;
      hoverTip.style.left = x + "px";
      hoverTip.style.top = y + "px";
    }

    function hideHoverTip() {
      hoverTip.classList.remove("visible");
      if (hoverTipTimer) { clearTimeout(hoverTipTimer); hoverTipTimer = null; }
    }

    async function buildAbilityHtml(lvl, abilityId) {
      if (hoverTipAbilityCache[abilityId]) return hoverTipAbilityCache[abilityId];
      var html = "";
      var isKey = (lvl === 1);
      try {
        if (isKey) {
          if (!_keyAbilities) {
            _keyAbilities = await cfg.apiClient.getKeyAbilities();
            if (!Array.isArray(_keyAbilities)) _keyAbilities = Object.values(_keyAbilities).flat();
          }
          var ka = _keyAbilities.find(function (a) { return a.indexId === abilityId; });
          if (ka) {
            var benefits = [ka.benefit1, ka.benefit2, ka.benefit3, ka.benefit4].filter(function (b) { return b && b.trim(); });
            html += benefits.map(function (b) { return '<div class="cls-htip-benefit">' + b + '</div>'; }).join("");
            if (ka.associatedAbility) {
              if (!_trueAbilities) {
                _trueAbilities = await cfg.apiClient.getTrueAbilities();
                if (!Array.isArray(_trueAbilities)) _trueAbilities = Object.values(_trueAbilities).flat();
              }
              var assoc = _trueAbilities.find(function (a) { return a.indexId === ka.associatedAbility; });
              if (assoc) {
                html += '<div class="cls-htip-assoc">';
                html += '<div class="cls-htip-assoc-name">' + assoc.name + '</div>';
                var tags = [];
                if (assoc.apCost && assoc.apCost !== "-" && assoc.apCost !== "0" && assoc.apCost !== "") tags.push("AP: " + assoc.apCost);
                if (assoc.manaCost && assoc.manaCost !== "-" && assoc.manaCost !== "0" && assoc.manaCost !== "") tags.push("Mana: " + assoc.manaCost);
                if (assoc.rpCost && assoc.rpCost !== "-" && assoc.rpCost !== "0" && assoc.rpCost !== "") tags.push("RP: " + assoc.rpCost);
                if (assoc.range && assoc.range !== "-") tags.push("Range: " + assoc.range);
                if (tags.length) html += '<div class="cls-htip-tags">' + tags.map(function(t) { return '<span class="cls-htip-tag">' + t + '</span>'; }).join("") + '</div>';
                if (assoc.keywords) html += '<div class="cls-htip-keywords">' + assoc.keywords + '</div>';
                if (assoc.description) html += '<div class="cls-htip-desc">' + assoc.description + '</div>';
                html += '</div>';
              }
            }
          }
        } else {
          if (!_trueAbilities) {
            _trueAbilities = await cfg.apiClient.getTrueAbilities();
            if (!Array.isArray(_trueAbilities)) _trueAbilities = Object.values(_trueAbilities).flat();
          }
          var ta = _trueAbilities.find(function (a) { return a.indexId === abilityId; });
          if (ta) {
            var tags2 = [];
            if (ta.apCost && ta.apCost !== "-" && ta.apCost !== "0" && ta.apCost !== "") tags2.push("AP: " + ta.apCost);
            if (ta.manaCost && ta.manaCost !== "-" && ta.manaCost !== "0" && ta.manaCost !== "") tags2.push("Mana: " + ta.manaCost);
            if (ta.rpCost && ta.rpCost !== "-" && ta.rpCost !== "0" && ta.rpCost !== "") tags2.push("RP: " + ta.rpCost);
            if (ta.range && ta.range !== "-") tags2.push("Range: " + ta.range);
            if (tags2.length) html += '<div class="cls-htip-tags">' + tags2.map(function(t) { return '<span class="cls-htip-tag">' + t + '</span>'; }).join("") + '</div>';
            if (ta.keywords) html += '<div class="cls-htip-keywords">' + ta.keywords + '</div>';
            if (ta.requirement && ta.requirement !== "-") html += '<div class="cls-htip-req">Requires: ' + ta.requirement + '</div>';
            if (ta.description) html += '<div class="cls-htip-desc">' + ta.description + '</div>';
          }
        }
      } catch (err) {
        html = '<div class="cls-htip-desc">Could not load ability.</div>';
      }
      if (!html) html = '<div class="cls-htip-desc">No details available.</div>';
      hoverTipAbilityCache[abilityId] = html;
      return html;
    }

    var clsSelected     = new Map();   // classId → { levels: 1-8, data: classObj }
    var clsDetailCls    = null;
    var clsOverrideMode = false;
    var clsMiraneMode   = true;
    var clsAvailableOnly = false;
    var clsFreeClasses  = new Set();   // classIds that were granted free
    var clsInterludeActions = [];      // array of action ids, each costs 1 IP
    var clsBaselineClasses  = new Map(); // classId → baselineLevel (from before this session)
    var clsRemovedBaseline  = new Map(); // classId → { removedLevels, data, originalLevel }

    // DOM roots (created in buildDOM)
    var detailOverlay   = null;
    var statPickOverlay = null;
    var escHandler      = null;        // keydown handler reference for cleanup

    /* ─── Helpers ──────────────────────────────────────────────────── */
    /** Prefixed getElementById scoped to our generated DOM */
    function $(id) { return document.getElementById(cfg.idPrefix + "-" + id); }

    function say(text, sprite) { cfg.onMessage(text, sprite || "1"); }

    /* ─── Budget helpers ───────────────────────────────────────────── */
    function getClsBudget() {
      var isHuman = character.race?.primaryRaceId === "human" ||
                    character.race?.primaryRaceName?.toLowerCase() === "human";
      var noBonus = character.race?.noHumanBonus === true;
      return cfg.budgetBase + (isHuman && !noBonus ? cfg.humanBonus : 0);
    }

    function getClsSpentExp() {
      var total = 0;
      clsSelected.forEach(function (entry, classId) {
        if (clsFreeClasses.has(classId)) return; // free classes don't cost EXP
        var baseLevel = clsBaselineClasses.get(classId) || 0;
        if (baseLevel === 0) {
          // Entirely new class: full cost
          total += entry.data.tier * 100;          // unlock cost
          total += (entry.levels - 1) * 100;       // ability levels
        } else if (entry.levels > baseLevel) {
          // Existing class: only cost of NEW levels
          total += (entry.levels - baseLevel) * 100;
        } else if (entry.levels < baseLevel) {
          // Reduced below baseline: credit for removed levels
          total -= (baseLevel - entry.levels) * 100;
        }
        // entry.levels === baseLevel: no cost change
      });
      // Credit for entirely removed baseline classes
      clsRemovedBaseline.forEach(function (removal) {
        if (clsFreeClasses.has(removal.data.classId)) return;
        total -= removal.data.tier * 100;          // refund unlock
        total -= (removal.originalLevel - 1) * 100; // refund ability levels
      });
      return total;
    }

    function getClsUsedIP() {
      var newClasses = 0;
      clsSelected.forEach(function (_, classId) {
        if (!clsFreeClasses.has(classId) && !clsBaselineClasses.has(classId)) newClasses++;
      });
      return newClasses + clsInterludeActions.length;
    }

    /* ─── DOM Generation ───────────────────────────────────────────── */
    function buildDOM() {
      var p = cfg.idPrefix;
      var container = cfg.containerEl;
      container.innerHTML = "";

      /* Budget bar + IP + overrides + search + filters */
      var headerHTML = "";

      if (cfg.showBudget) {
        headerHTML += '<div class="bt-budget-bar">' +
          '<span class="bt-budget-label">EXP Budget</span>' +
          '<div class="bt-budget-meter"><div class="bt-budget-fill" id="' + p + '-cls-budget-fill"></div></div>' +
          '<span class="bt-budget-value" id="' + p + '-cls-budget-value">' + getClsBudget() + ' / ' + getClsBudget() + '</span>' +
          '<span class="cls-ip-display" id="' + p + '-cls-ip-display">' +
            'IP: <strong id="' + p + '-cls-ip-value">0 / ' + cfg.ipMax + '</strong>' +
          '</span>' +
          '<button class="bt-override-btn" id="' + p + '-cls-override-btn">' +
            '<span class="bt-override-indicator"></span>' +
            '<span class="bt-override-label">Override</span>' +
          '</button>' +
          '<button class="cls-mirane-btn" id="' + p + '-cls-mirane-btn">' +
            '<span class="cls-mirane-indicator"></span>' +
            '<span class="cls-mirane-label">Mirane</span>' +
          '</button>' +
        '</div>';
      }

      headerHTML +=
        '<div class="bt-search-wrap">' +
          '<span class="bt-search-icon">🔍</span>' +
          '<input type="text" id="' + p + '-cls-search" class="bt-search-input" placeholder="Search classes by name, role, or requirement..." autocomplete="off">' +
        '</div>' +
        '<div class="cls-filter-bar">' +
          '<select id="' + p + '-cls-filter-tier" class="cls-filter-select">' +
            '<option value="">All Tiers</option>' +
            '<option value="1">Tier 1</option>' +
            '<option value="2">Tier 2</option>' +
            '<option value="3">Tier 3</option>' +
          '</select>' +
          '<select id="' + p + '-cls-filter-diff" class="cls-filter-select">' +
            '<option value="">All Difficulty</option>' +
            '<option value="1">★</option>' +
            '<option value="2">★★</option>' +
            '<option value="3">★★★</option>' +
            '<option value="4">★★★★</option>' +
          '</select>' +
          '<select id="' + p + '-cls-filter-role" class="cls-filter-select">' +
            '<option value="">All Roles</option>' +
            '<option value="Striker">Striker</option>' +
            '<option value="Defender">Defender</option>' +
            '<option value="Healer">Healer</option>' +
            '<option value="Support">Support</option>' +
            '<option value="Controller">Controller</option>' +
            '<option value="Utility">Utility</option>' +
            '<option value="Specialist">Specialist</option>' +
            '<option value="Artisan">Artisan</option>' +
            '<option value="Gatherer">Gatherer</option>' +
          '</select>' +
          '<button class="cls-mirane-btn" id="' + p + '-cls-available-btn">' +
            '<span class="cls-mirane-indicator"></span>' +
            '<span>Available Only</span>' +
          '</button>' +
        '</div>';

      /* Main layout: grid + cart */
      var layoutHTML =
        '<div class="bt-layout">' +
          '<div class="cls-grid" id="' + p + '-cls-grid"></div>' +
          '<div class="bt-cart cls-cart" id="' + p + '-cls-cart">' +
            '<div class="bt-cart-header">' +
              '<span class="bt-cart-title">Classes</span>' +
              '<span class="bt-cart-count" id="' + p + '-cls-cart-count">0</span>' +
            '</div>' +
            '<div class="bt-cart-items" id="' + p + '-cls-cart-items">' +
              '<div class="bt-cart-empty">No classes selected</div>' +
            '</div>' +
            '<div class="bt-cart-total">' +
              '<span>Total Cost</span>' +
              '<span id="' + p + '-cls-cart-total-cost">0 EXP</span>' +
            '</div>' +
            (cfg.showInterlude
              ? '<div class="cls-cart-ip">' +
                  '<span>IP Used</span>' +
                  '<span id="' + p + '-cls-cart-ip-used">0 / ' + cfg.ipMax + '</span>' +
                '</div>'
              : '') +
            (cfg.showConfirmButton
              ? '<button class="cls-confirm-btn" id="' + p + '-cls-confirm-btn">✦ Confirm & Purchase</button>'
              : '') +
          '</div>' +
        '</div>';

      container.innerHTML = headerHTML + layoutHTML;

      /* Detail modal overlay — appended to document.body */
      detailOverlay = document.createElement("div");
      detailOverlay.className = "cls-detail-overlay";
      detailOverlay.id = p + "-cls-detail-overlay";
      detailOverlay.innerHTML =
        '<div class="cls-detail-modal" id="' + p + '-cls-detail-modal">' +
          '<button class="bt-detail-close" id="' + p + '-cls-detail-close">✕</button>' +
          '<div class="cls-detail-top">' +
            '<img class="cls-detail-img" id="' + p + '-cls-detail-img" src="" alt="">' +
            '<div class="cls-detail-info">' +
              '<h3 class="cls-detail-name" id="' + p + '-cls-detail-name"></h3>' +
              '<div class="cls-detail-meta">' +
                '<span class="cls-tier-badge" id="' + p + '-cls-detail-tier"></span>' +
                '<span class="cls-diff-badge" id="' + p + '-cls-detail-diff"></span>' +
                '<span class="cls-role-tag" id="' + p + '-cls-detail-role1"></span>' +
                '<span class="cls-role-tag" id="' + p + '-cls-detail-role2"></span>' +
              '</div>' +
              '<div class="cls-detail-req" id="' + p + '-cls-detail-req"></div>' +
            '</div>' +
          '</div>' +
          '<div class="cls-detail-desc" id="' + p + '-cls-detail-desc"></div>' +
          '<div class="cls-progression">' +
            '<h4 class="cls-progression-title">Progression</h4>' +
            '<div class="cls-progression-table" id="' + p + '-cls-progression-table"></div>' +
          '</div>' +
          '<div class="cls-detail-guide" id="' + p + '-cls-detail-guide"></div>' +
          '<div class="cls-detail-actions">' +
            '<button class="cls-detail-unlock-btn" id="' + p + '-cls-detail-unlock-btn">Unlock Class</button>' +
            '<button class="cls-detail-level-btn" id="' + p + '-cls-detail-level-btn" style="display:none;">Level Up (100 EXP)</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(detailOverlay);

      /* Stat-pick modal overlay — appended to document.body, hidden by default */
      statPickOverlay = document.createElement("div");
      statPickOverlay.className = "stat-pick-overlay";
      statPickOverlay.id = p + "-stat-pick-overlay";
      statPickOverlay.style.display = "none";
      statPickOverlay.innerHTML =
        '<div class="stat-pick-box">' +
          '<h3 class="stat-pick-title" id="' + p + '-stat-pick-title">Choose a Stat Increase</h3>' +
          '<p class="stat-pick-desc" id="' + p + '-stat-pick-desc"></p>' +
          '<div class="stat-pick-options" id="' + p + '-stat-pick-options"></div>' +
        '</div>';
      document.body.appendChild(statPickOverlay);

      /* ── Wire up header controls ──────────────────────────────────── */
      if (cfg.showBudget) {
        // Override toggle
        var overrideBtn = $(  "cls-override-btn");
        if (clsOverrideMode) overrideBtn.classList.add("active");
        overrideBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          clsOverrideMode = !clsOverrideMode;
          overrideBtn.classList.toggle("active", clsOverrideMode);
          updateClsBudget();
          applyClsFilters();
        });

        // Mirane toggle
        var miraneBtn = $("cls-mirane-btn");
        if (clsMiraneMode) miraneBtn.classList.add("active");
        miraneBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          clsMiraneMode = !clsMiraneMode;
          miraneBtn.classList.toggle("active", clsMiraneMode);
          applyClsFilters();
        });
      }

      // Search
      var searchInput = $("cls-search");
      searchInput.oninput = function () { applyClsFilters(); };

      // Available Only toggle
      var availBtn = $("cls-available-btn");
      if (clsAvailableOnly) availBtn.classList.add("active");
      availBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        clsAvailableOnly = !clsAvailableOnly;
        availBtn.classList.toggle("active", clsAvailableOnly);
        applyClsFilters();
      });

      // Filters
      $("cls-filter-tier").onchange = function () { applyClsFilters(); };
      $("cls-filter-diff").onchange = function () { applyClsFilters(); };
      $("cls-filter-role").onchange = function () { applyClsFilters(); };

      /* ── Bind detail modal events ─────────────────────────────────── */
      bindClsDetailModal();

      /* ── Confirm & Purchase button ─────────────────────────────────── */
      if (cfg.showConfirmButton) {
        var confirmBtn = $("cls-confirm-btn");
        if (confirmBtn) {
          confirmBtn.disabled = true; // disabled until changes are made
          confirmBtn.addEventListener("click", function () {
            syncClassesToCharacter();
            cfg.onConfirm();
          });
        }
      }
    }

    /* ─── Filter logic ─────────────────────────────────────────────── */
    function applyClsFilters() {
      var q    = ($("cls-search")?.value || "").toLowerCase().trim();
      var tier = $("cls-filter-tier")?.value || "";
      var diff = $("cls-filter-diff")?.value || "";
      var role = $("cls-filter-role")?.value || "";
      var stripHtml = cfg.stripHtml;

      var filtered = allClassesData;

      if (q) {
        filtered = filtered.filter(function (c) {
          return c.name.toLowerCase().includes(q) ||
            c.role1.toLowerCase().includes(q) ||
            (c.role2 && c.role2.toLowerCase().includes(q)) ||
            c.requirements.toLowerCase().includes(q) ||
            stripHtml(c.description).toLowerCase().includes(q);
        });
      }
      if (tier) filtered = filtered.filter(function (c) { return String(c.tier) === tier; });
      if (diff) filtered = filtered.filter(function (c) { return String(c.difficulty) === diff; });
      if (role) filtered = filtered.filter(function (c) { return c.role1 === role || c.role2 === role; });

      // Available Only: hide classes with unmet requirements or mirane-banned
      if (clsAvailableOnly && !clsOverrideMode) {
        filtered = filtered.filter(function (c) {
          if (clsMiraneMode && clsMiraneBanList.includes(c.classId)) return false;
          return checkClassRequirement(c).met;
        });
      }

      renderClassCards(filtered);
    }

    function getFilteredClasses() {
      var q    = ($("cls-search")?.value || "").toLowerCase().trim();
      var tier = $("cls-filter-tier")?.value || "";
      var diff = $("cls-filter-diff")?.value || "";
      var role = $("cls-filter-role")?.value || "";
      var stripHtml = cfg.stripHtml;

      var filtered = allClassesData;
      if (q) {
        filtered = filtered.filter(function (c) {
          return c.name.toLowerCase().includes(q) ||
            c.role1.toLowerCase().includes(q) ||
            (c.role2 && c.role2.toLowerCase().includes(q)) ||
            c.requirements.toLowerCase().includes(q) ||
            stripHtml(c.description).toLowerCase().includes(q);
        });
      }
      if (tier) filtered = filtered.filter(function (c) { return String(c.tier) === tier; });
      if (diff) filtered = filtered.filter(function (c) { return String(c.difficulty) === diff; });
      if (role) filtered = filtered.filter(function (c) { return c.role1 === role || c.role2 === role; });
      return filtered;
    }

    /* ─── Card Rendering ───────────────────────────────────────────── */
    function renderClassCards(list) {
      var grid = $("cls-grid");
      grid.innerHTML = "";

      if (list.length === 0) {
        grid.innerHTML = '<div class="bt-empty-state">No classes match your filters.</div>';
        return;
      }

      list.forEach(function (cls) {
        var card = document.createElement("div");
        card.className = "cls-card";
        card.dataset.clsId = cls.classId;

        var sel = clsSelected.get(cls.classId);
        var isFreeClass = clsFreeClasses.has(cls.classId);
        if (sel) {
          card.classList.add("selected");
          if (sel.levels >= 8) card.classList.add("mastered");
        }
        if (isFreeClass) card.classList.add("cls-free-granted");

        var isBanned = clsMiraneMode && clsMiraneBanList.includes(cls.classId);
        if (isBanned) card.classList.add("mirane-banned");

        // Requirement check
        var reqCheck = checkClassRequirement(cls);
        if (!reqCheck.met && !clsOverrideMode) card.classList.add("req-unmet");

        // Difficulty dots
        var diffDots = Array.from({ length: 5 }, function (_, i) {
          return i < cls.difficulty ? "●" : "○";
        }).join("");

        // Level badge
        var levelBadge = "";
        if (sel) {
          levelBadge = sel.levels >= 8
            ? '<span class="cls-mastered-badge">★ MASTERED</span>'
            : '<span class="cls-level-badge">Lv. ' + sel.levels + '</span>';
        }

        card.innerHTML =
          '<div class="cls-card-img-wrap">' +
            '<img class="cls-card-img" src="' + cls.imageSmUrl + '" alt="' + cls.name + '" loading="lazy">' +
            levelBadge +
            (isFreeClass ? '<span class="cls-free-badge">FREE</span>' : '') +
          '</div>' +
          '<div class="cls-card-body">' +
            '<div class="cls-card-header">' +
              '<span class="cls-card-name">' + cls.name + '</span>' +
              '<span class="cls-tier-badge tier-' + cls.tier + '">T' + cls.tier + '</span>' +
            '</div>' +
            '<div class="cls-card-meta">' +
              '<span class="cls-diff-badge">' + diffDots + '</span>' +
              '<span class="cls-role-tag role-' + cls.role1.toLowerCase() + '">' + cls.role1 + '</span>' +
              (cls.role2 ? '<span class="cls-role-tag role-' + cls.role2.toLowerCase() + '">' + cls.role2 + '</span>' : '') +
            '</div>' +
            (cls.requirements && cls.requirements !== "None" && cls.requirements !== "None."
              ? '<div class="cls-card-req">' + cls.requirements + '</div>' : '') +
            '<div class="cls-card-desc">' + cfg.stripHtml(cls.description) + '</div>' +
          '</div>';

        card.addEventListener("click", function (e) {
          e.stopPropagation();
          if (isBanned) {
            say(cls.name + " is banned under Mirane Expedition rules.  Turn off the Mirane filter to select it.", "4");
            return;
          }
          openClsDetail(cls);
        });

        grid.appendChild(card);
      });
    }

    /* ─── Budget & IP ──────────────────────────────────────────────── */
    function updateClsBudget() {
      if (!cfg.showBudget) return;

      var spent     = getClsSpentExp();
      var remaining = getClsBudget() - spent;
      var pct       = Math.max(0, Math.min(100, (remaining / getClsBudget()) * 100));
      var ip        = getClsUsedIP();

      var fillEl = $("cls-budget-fill");
      var valEl  = $("cls-budget-value");
      var ipEl   = $("cls-ip-value");
      if (!fillEl || !valEl) return;

      fillEl.style.width = clsOverrideMode ? "100%" : pct + "%";
      valEl.textContent  = clsOverrideMode ? "∞" : remaining + " / " + getClsBudget();
      valEl.classList.toggle("over-budget", !clsOverrideMode && remaining < 0);
      if (ipEl) ipEl.textContent = ip + " / " + cfg.ipMax;

      // Also update cart IP
      var cartIpEl = $("cls-cart-ip-used");
      if (cartIpEl) cartIpEl.textContent = ip + " / " + cfg.ipMax;

      // Show/hide interlude actions section
      if (cfg.showInterlude) renderInterludeActions();
    }

    /* ─── Interlude Actions UI ─────────────────────────────────────── */
    function renderInterludeActions() {
      var cart = $("cls-cart");
      if (!cart) return;

      // Remove any existing interlude section
      var existing = cart.querySelector(".cls-interlude-section");
      if (existing) existing.remove();

      var ip       = getClsUsedIP();
      var unusedIP = cfg.ipMax - ip;

      // Only show when not in override mode and there's spare IP
      if (clsOverrideMode || unusedIP <= 0) return;

      var section = document.createElement("div");
      section.className = "cls-interlude-section";
      section.innerHTML =
        '<div class="cls-interlude-header">' +
          '<span>Interlude Actions</span>' +
          '<small>' + unusedIP + ' IP remaining</small>' +
        '</div>';

      var btnRow = document.createElement("div");
      btnRow.className = "cls-interlude-btns";

      INTERLUDE_ACTIONS.forEach(function (action) {
        var btn = document.createElement("button");
        btn.className = "cls-interlude-btn";
        btn.innerHTML = '<strong>' + action.label + '</strong><br><small>' + action.desc + '</small>';
        btn.addEventListener("click", function () {
          if (getClsUsedIP() >= cfg.ipMax) return;
          clsInterludeActions.push(action.id);
          // Apply CLIM/EXP to character
          if (action.clim) {
            character.clim = (character.clim || 0) + action.clim;
          }
          if (action.exp) {
            character.totalExp = (character.totalExp || 0) + action.exp;
          }
          updateClsBudget();
          updateClsCart();
          cfg.onSave();
        });
        btnRow.appendChild(btn);
      });

      section.appendChild(btnRow);
      cart.appendChild(section);
    }

    /* ─── Cart ─────────────────────────────────────────────────────── */
    function updateClsCart() {
      var itemsEl = $("cls-cart-items");
      var countEl = $("cls-cart-count");
      var totalEl = $("cls-cart-total-cost");
      if (!itemsEl) return;

      // Only count and show NEW changes (not baseline classes)
      var newCount = 0;
      var entries  = [];
      clsSelected.forEach(function (entry, classId) {
        var baseLevel = clsBaselineClasses.get(classId) || 0;
        if (entry.levels !== baseLevel) {
          newCount++;
          entries.push({ classId: classId, entry: entry, baseLevel: baseLevel });
        }
      });

      var totalChanges = newCount + clsRemovedBaseline.size;
      countEl.textContent = totalChanges;
      totalEl.textContent = getClsSpentExp() + " EXP";

      if (totalChanges === 0 && clsInterludeActions.length === 0) {
        itemsEl.innerHTML = '<div class="bt-cart-empty">No new changes</div>';
        // Update confirm button state
        var confirmBtn = $("cls-confirm-btn");
        if (confirmBtn) confirmBtn.disabled = true;
        return;
      }

      // Enable confirm button
      var confirmBtn = $("cls-confirm-btn");
      if (confirmBtn) confirmBtn.disabled = false;

      itemsEl.innerHTML = "";
      entries.forEach(function (e) {
        var classId   = e.classId;
        var entry     = e.entry;
        var baseLevel = e.baseLevel;
        var levels = entry.levels;
        var data   = entry.data;
        var isFree = clsFreeClasses.has(classId);
        var cost;
        if (baseLevel === 0) {
          cost = isFree ? 0 : data.tier * 100 + (levels - 1) * 100;
        } else {
          cost = isFree ? 0 : Math.max(0, levels - baseLevel) * 100;
        }
        var isMastered = levels >= 8;
        var freeGrant  = FREE_CLASS_GRANTS.find(function (g) { return g.classId === classId; });
        var freeLabel  = isFree && freeGrant
          ? '<small class="cls-cart-free-badge">FREE (' + freeGrant.source + ')</small>' : '';
        var freeMinLevel = isFree && freeGrant ? freeGrant.level : 0;
        var canLevelDown = baseLevel === 0 ? (!isFree || levels > freeMinLevel) : (levels > baseLevel);

        var levelLabel = baseLevel === 0
          ? (isMastered ? "★ Mastered" : "Lv. " + levels)
          : "Lv. " + baseLevel + " → " + levels;

        var item = document.createElement("div");
        item.className = "bt-cart-item cls-cart-item" + (isFree ? " cls-cart-free" : "") + (baseLevel > 0 ? " cls-cart-upgrade" : "");
        item.innerHTML =
          '<span class="bt-cart-item-name" title="' + data.name + '">' +
            (baseLevel === 0 ? '<small class="cls-cart-new-badge">NEW</small> ' : '') +
            data.name +
            '<small class="cls-cart-level">' + levelLabel + '</small>' +
            freeLabel +
          '</span>' +
          '<span class="bt-cart-item-cost">' + (isFree ? 'FREE' : cost + ' EXP') + '</span>' +
          (canLevelDown ? '<button class="bt-cart-item-remove" title="Remove Level">−</button>' : '');

        if (canLevelDown) {
          item.querySelector(".bt-cart-item-remove").addEventListener("click", function (ev) {
            ev.stopPropagation();
            levelDownClass(data);
          });
        }
        item.querySelector(".bt-cart-item-name").addEventListener("click", function (ev) {
          ev.stopPropagation();
          openClsDetail(data);
        });
        itemsEl.appendChild(item);
      });

      // Show refund entries for removed/reduced baseline classes
      if (clsRemovedBaseline.size > 0) {
        clsRemovedBaseline.forEach(function (removal, classId) {
          var refundCost = removal.data.tier * 100 + (removal.originalLevel - 1) * 100;
          var refundItem = document.createElement("div");
          refundItem.className = "bt-cart-item cls-cart-item cls-cart-refund";
          refundItem.innerHTML =
            '<span class="bt-cart-item-name" title="' + removal.data.name + '">' +
              '<small class="cls-cart-refund-badge">REMOVE</small> ' +
              removal.data.name +
              '<small class="cls-cart-level">Lv. ' + removal.originalLevel + ' \u2192 0</small>' +
            '</span>' +
            '<span class="bt-cart-item-cost refund">+' + refundCost + ' EXP</span>' +
            '<button class="bt-cart-item-remove" title="Undo removal">\u21A9</button>';
          refundItem.querySelector(".bt-cart-item-remove").addEventListener("click", function (ev) {
            ev.stopPropagation();
            // Restore the class at its original baseline level
            clsSelected.set(classId, { levels: removal.originalLevel, data: removal.data });
            clsRemovedBaseline.delete(classId);
            updateClsBudget();
            updateClsCart();
            renderClassCards(getFilteredClasses());
          });
          itemsEl.appendChild(refundItem);
        });
      }

      // Also show level reductions below baseline (classes still in clsSelected but reduced)
      entries.forEach(function (e) {
        if (e.baseLevel > 0 && e.entry.levels < e.baseLevel) {
          // Already shown as an upgrade/change item above, but mark the refund portion
          // The cost display already shows the negative amount via getClsSpentExp
        }
      });
      // Show interlude actions in cart
      if (clsInterludeActions.length > 0) {
        var ilHeader = document.createElement("div");
        ilHeader.className = "bt-cart-item cls-cart-il-header";
        ilHeader.innerHTML = '<span class="bt-cart-item-name" style="font-style:italic;">Interlude Actions</span>';
        itemsEl.appendChild(ilHeader);

        clsInterludeActions.forEach(function (actionId, idx) {
          var def = INTERLUDE_ACTIONS.find(function (a) { return a.id === actionId; });
          if (!def) return;
          var ilItem = document.createElement("div");
          ilItem.className = "bt-cart-item cls-cart-item";
          ilItem.innerHTML =
            '<span class="bt-cart-item-name">' +
              def.label +
              '<small class="cls-cart-level">' + def.desc + '</small>' +
            '</span>' +
            '<span class="bt-cart-item-cost">1 IP</span>' +
            '<button class="bt-cart-item-remove" title="Remove">✕</button>';
          ilItem.querySelector(".bt-cart-item-remove").addEventListener("click", function (ev) {
            ev.stopPropagation();
            clsInterludeActions.splice(idx, 1);
            updateClsBudget();
            updateClsCart();
          });
          itemsEl.appendChild(ilItem);
        });
      }
    }

    /* ─── Sync to character ────────────────────────────────────────── */
    function syncClassesToCharacter() {
      character.classes = [];
      clsSelected.forEach(function (entry, classId) {
        character.classes.push({
          classId: entry.data.classId,
          name:    entry.data.name,
          tier:    entry.data.tier,
          levels:  entry.levels,
          mastered: entry.levels >= 8,
        });
      });
      // Persist interlude actions
      character.interludeActions = clsInterludeActions.slice();
      cfg.onSave();
      cfg.onClassesChanged();
    }

    /* ─── Free Class Grants ────────────────────────────────────────── */
    function applyFreeClassGrants() {
      var race      = (character.race?.primaryRaceName || "").toLowerCase();
      var houseId   = (character.race?.demonHouseId || "").toLowerCase();
      var ancestryId = (character.race?.ancestryId || "").toLowerCase();

      for (var i = 0; i < FREE_CLASS_GRANTS.length; i++) {
        var grant = FREE_CLASS_GRANTS[i];
        var m = grant.match;
        if (m.race && m.race !== race) continue;
        if (m.demonHouseId && m.demonHouseId !== houseId) continue;
        if (m.ancestryId && m.ancestryId !== ancestryId) continue;

        // This grant applies
        var clsData = allClassesData.find(function (c) { return c.classId === grant.classId; });
        if (!clsData) {
          console.warn("[freeClass] grant for " + grant.classId + " (" + grant.source + "): class not found in data");
          continue;
        }
        clsFreeClasses.add(grant.classId);
        if (!clsSelected.has(grant.classId)) {
          clsSelected.set(grant.classId, { levels: grant.level, data: clsData });
          console.log("[freeClass] auto-granted " + clsData.name + " Lv." + grant.level + " from " + grant.source);
        }
      }
    }

    /* ─── Selection Logic ──────────────────────────────────────────── */
    /** Close the detail modal and fire a message to draw attention */
    function dismissAndFlash() {
      closeClsDetail();
      say("", ""); // triggers the callback so host can flash its own dialogue box
    }

    function unlockClass(cls) {
      if (clsSelected.has(cls.classId)) return;

      // If re-adding a previously removed baseline class, restore it
      if (clsRemovedBaseline.has(cls.classId)) {
        var removal = clsRemovedBaseline.get(cls.classId);
        clsSelected.set(cls.classId, { levels: removal.originalLevel, data: cls });
        clsRemovedBaseline.delete(cls.classId);
        updateClsBudget();
        updateClsCart();
        renderClassCards(getFilteredClasses());
        updateClsDetailBtns();
        say(cls.name + " restored to Lv. " + removal.originalLevel + ".", "3");
        return;
      }

      var unlockCost = cls.tier * 100;
      var spent      = getClsSpentExp();
      var ip         = getClsUsedIP();

      if (!clsOverrideMode) {
        if (ip >= cfg.ipMax) {
          say("You've used all " + cfg.ipMax + " Interlude Points!  Remove an interlude action or enable Override to unlock more classes.", "4");
          dismissAndFlash();
          return;
        }
        if (spent + unlockCost > getClsBudget()) {
          say("Not enough EXP!  You need " + unlockCost + " but only have " + (getClsBudget() - spent) + " remaining.", "4");
          dismissAndFlash();
          return;
        }
      }

      // Requirement warning (soft)
      var reqCheck = checkClassRequirement(cls);
      if (!reqCheck.met && !clsOverrideMode) {
        say("Warning — " + cls.name + " requires: " + cls.requirements + ".  " + reqCheck.reason + "  Enable Override to bypass.", "4");
        dismissAndFlash();
        return;
      }

      clsSelected.set(cls.classId, { levels: 1, data: cls });
      updateClsBudget();
      updateClsCart();
      if (!cfg.deferSync) syncClassesToCharacter();
      renderClassCards(getFilteredClasses());
      updateClsDetailBtns();
      updateClsProgression();

      say(cls.name + " unlocked!  You gain the key ability: " + (cls.keyAbilityName || "—") + ".", "3");
    }

    function levelUpClass(cls) {
      var sel = clsSelected.get(cls.classId);
      if (!sel || sel.levels >= 8) return;

      var spent = getClsSpentExp();
      if (!clsOverrideMode && spent + 100 > getClsBudget()) {
        say("Not enough EXP for the next level!  You need 100 but only have " + (getClsBudget() - spent) + " remaining.", "4");
        return;
      }

      var reqCheck = checkClassRequirement(cls);
      if (!reqCheck.met && !clsOverrideMode) {
        say("You do not meet the requirements for this class.", "4");
        return;
      }

      var newLevel = sel.levels + 1;

      // Level 5 = Heart (sub stat), Level 7 = Soul (main stat)
      if (newLevel === 5 || newLevel === 7) {
        var isHeart    = newLevel === 5;
        var text       = isHeart ? cls.heart : cls.soul;
        var statType   = isHeart ? "sub" : "main";
        var statChoices = parseStatChoices(text, statType);

        if (statChoices.length > 0) {
          showStatPickModal(cls, sel, newLevel, isHeart, statChoices, text);
          return; // Don't level up yet — wait for pick
        }
      }

      // Level 1 = Key Ability — check for skill grants in benefits
      if (newLevel === 1 && cls.keyAbilityId) {
        var checkKeyAbilitySkills = async function() {
          try {
            if (!_keyAbilities) {
              _keyAbilities = await cfg.apiClient.getKeyAbilities();
              if (!Array.isArray(_keyAbilities)) _keyAbilities = Object.values(_keyAbilities).flat();
            }
            var ka = _keyAbilities.find(function(a) { return a.indexId === cls.keyAbilityId; });
            if (ka) {
              var allBenefits = [ka.benefit1, ka.benefit2, ka.benefit3, ka.benefit4].filter(function(b) { return b && b.trim(); }).join(" ");
              // Check if any benefit mentions skill points
              if (/\+?\d+\s+(?:skill\s+point|point)/i.test(allBenefits) && /(?:spend\s+(?:in|on)|points\s+(?:in|on))/i.test(allBenefits)) {
                showSkillsModal(cls, sel, allBenefits);
                return;
              }
            }
          } catch(err) {
            console.warn("[handleLevelUp] Could not check key ability skills:", err);
          }
          // No skill grants found, proceed normally
          applyLevelUp(cls, sel);
        };
        checkKeyAbilitySkills();
        return; // async — will call applyLevelUp when done
      }

      // Level 3 = Skills — show skills detail modal
      if (newLevel === 3 && cls.skills) {
        showSkillsModal(cls, sel);
        return; // Don't level up yet — wait for Continue click
      }

      // Normal level up (no stat pick needed)
      applyLevelUp(cls, sel);
    }

    /* ─── Parse stat choices from heart/soul text ──────────────────── */
    function parseStatChoices(text, statType) {
      if (!text) return [];
      var CharMod  = cfg.characterModule;
      var allNames = statType === "main"
        ? Object.values(CharMod.MAIN_STAT_NAMES)
        : Object.values(CharMod.SUB_STAT_NAMES);
      var allKeys = statType === "main"
        ? CharMod.MAIN_STAT_KEYS
        : CharMod.SUB_STAT_KEYS;
      var nameToKey = {};
      allKeys.forEach(function (k, i) { nameToKey[allNames[i].toLowerCase()] = k; });

      var found = [];
      for (var ni = 0; ni < allNames.length; ni++) {
        var name = allNames[ni];
        if (text.toLowerCase().includes(name.toLowerCase())) {
          found.push({ key: nameToKey[name.toLowerCase()], name: name });
        }
      }
      return found;
    }

    /* ─── Show the stat pick modal ─────────────────────────────────── */
    function showStatPickModal(cls, sel, newLevel, isHeart, choices, rawText) {
      var titleEl   = $("stat-pick-title");
      var descEl    = $("stat-pick-desc");
      var optionsEl = $("stat-pick-options");

      // Temporarily hide the class detail overlay so the stat pick isn't trapped behind it
      if (detailOverlay) detailOverlay.style.display = "none";

      var label = isHeart ? "Heart" : "Soul";
      titleEl.textContent  = cls.name + " — " + label + " (Level " + newLevel + ")";
      descEl.textContent   = rawText;
      optionsEl.innerHTML  = "";

      choices.forEach(function (choice) {
        var btn = document.createElement("button");
        btn.className = "stat-pick-btn";
        btn.textContent = "+1 " + choice.name;
        btn.addEventListener("click", function () {
          // Apply stat increase (use effectiveStats if available, e.g. on sheet characters)
          if (isHeart) {
            var subTarget = character.effectiveSubStats || character.subStats;
            if (!subTarget) { character.subStats = {}; subTarget = character.subStats; }
            subTarget[choice.key] = (subTarget[choice.key] || 0) + 1;
            // Also update base subStats if effectiveSubStats is separate
            if (character.effectiveSubStats && character.subStats) {
              character.subStats[choice.key] = (character.subStats[choice.key] || 0) + 1;
            }
          } else {
            var mainTarget = character.effectiveMainStats || character.mainStats;
            if (!mainTarget) { character.mainStats = {}; mainTarget = character.mainStats; }
            mainTarget[choice.key] = (mainTarget[choice.key] || 0) + 1;
            // Also update base mainStats if effectiveMainStats is separate
            if (character.effectiveMainStats && character.mainStats) {
              character.mainStats[choice.key] = (character.mainStats[choice.key] || 0) + 1;
            }
          }

          // Track source
          if (!character.statSources) character.statSources = {};
          if (!character.statSources[choice.key]) character.statSources[choice.key] = [];
          character.statSources[choice.key].push({
            source: isHeart ? "Heart" : "Soul",
            label:  cls.name,
            amount: 1,
          });

          // Close stat pick and restore class detail
          statPickOverlay.style.display = "none";
          statPickOverlay.classList.remove("open");
          if (detailOverlay) detailOverlay.style.removeProperty("display");

          applyLevelUp(cls, sel);
          cfg.onSave();
        });
        optionsEl.appendChild(btn);
      });

      statPickOverlay.style.display = "flex";
      statPickOverlay.classList.add("open");
    }

    /* ─── Show skills allocation modal for Level 3 / Key Ability ── */
    function showSkillsModal(cls, sel, skillsText) {
      var text = skillsText || cls.skills || "";
      var className = cls.name || "Class";

      // Temporarily hide class detail overlay
      if (detailOverlay) detailOverlay.style.display = "none";

      SkillPickerModal.open({
        title: className + " — Skill Points",
        skillsText: text,
        className: className,
        character: character,
        onConfirm: function (result) {
          // Merge allocations into character.skills
          if (!character.skills) character.skills = {};
          for (var sn in result) {
            var r = result[sn];
            if (!character.skills[sn]) {
              character.skills[sn] = { points: 0, expertise: [] };
            }
            character.skills[sn].points += r.points;
            for (var ei = 0; ei < r.expertise.length; ei++) {
              character.skills[sn].expertise.push(r.expertise[ei]);
            }
          }

          // Record the grant for undo on class removal
          if (!character.skillGrants) character.skillGrants = [];
          var newLevel = sel ? sel.levels + 1 : 1;
          character.skillGrants.push({
            classId: cls.classId,
            level: newLevel,
            allocations: JSON.parse(JSON.stringify(result)),
          });

          cfg.onSave();
          if (detailOverlay) detailOverlay.style.removeProperty("display");
          applyLevelUp(cls, sel);
        },
        onCancel: function () {
          if (detailOverlay) detailOverlay.style.removeProperty("display");
        },
      });
    }

        function applyLevelUp(cls, sel) {
      sel.levels++;

      updateClsBudget();
      updateClsCart();
      if (!cfg.deferSync) syncClassesToCharacter();
      renderClassCards(getFilteredClasses());
      updateClsDetailBtns();
      updateClsProgression();

      if (sel.levels >= 8) {
        say(cls.name + " MASTERED!  " + (cls.ultimateAbilityName ? "You learn the ultimate ability: " + cls.ultimateAbilityName + "!" : "Incredible!"), "3");
      } else {
        var levelDef = CLS_LEVELS[sel.levels - 1];
        var gained   = cls[levelDef.key] || "—";
        say("Level " + sel.levels + "!  " + levelDef.label + ": " + (typeof gained === "string" && gained.length > 60 ? gained.substring(0, 57) + "..." : gained), "1");
      }
    }

    function levelDownClass(cls) {
      var sel = clsSelected.get(cls.classId);
      if (!sel) return;

      // Prevent removal of free-granted classes below their grant level
      if (clsFreeClasses.has(cls.classId)) {
        var grant    = FREE_CLASS_GRANTS.find(function (g) { return g.classId === cls.classId; });
        var minLevel = grant?.level || 1;
        if (sel.levels <= minLevel) {
          say(cls.name + " was granted free from " + (grant?.source || "your race") + ". It cannot be removed below Lv. " + minLevel + ".", "4");
          return;
        }
      }

      var removingLevel = sel.levels;

      // Undo stat boost if removing Heart (L5) or Soul (L7)
      if ((removingLevel === 5 || removingLevel === 7) && character.statSources) {
        var sourceLabel = cls.name;
        var sourceType  = removingLevel === 5 ? "Heart" : "Soul";
        var statKeys    = Object.keys(character.statSources);
        for (var ki = 0; ki < statKeys.length; ki++) {
          var key = statKeys[ki];
          var idx = character.statSources[key].findIndex(function (s) {
            return s.label === sourceLabel && s.source === sourceType;
          });
          if (idx !== -1) {
            var r = character.statSources[key][idx];
            if (r.source === "Heart") {
              var subT = character.effectiveSubStats || character.subStats;
              if (subT) subT[key] = Math.max(0, (subT[key] || 0) - r.amount);
              if (character.effectiveSubStats && character.subStats) {
                character.subStats[key] = Math.max(0, (character.subStats[key] || 0) - r.amount);
              }
            } else if (r.source === "Soul") {
              var mainT = character.effectiveMainStats || character.mainStats;
              if (mainT) mainT[key] = Math.max(0, (mainT[key] || 0) - r.amount);
              if (character.effectiveMainStats && character.mainStats) {
                character.mainStats[key] = Math.max(0, (character.mainStats[key] || 0) - r.amount);
              }
            }
            character.statSources[key].splice(idx, 1);
            if (character.statSources[key].length === 0) {
              delete character.statSources[key];
            }
            break; // Only remove one stat source per level-down
          }
        }
        cfg.onSave();
      }

      // Undo skill grants if removing a level that had skill allocation
      if (character.skillGrants && character.skills) {
        var grantIdx = -1;
        for (var gsi = character.skillGrants.length - 1; gsi >= 0; gsi--) {
          if (character.skillGrants[gsi].classId === cls.classId && character.skillGrants[gsi].level === removingLevel) {
            grantIdx = gsi;
            break;
          }
        }
        if (grantIdx !== -1) {
          var grant = character.skillGrants[grantIdx];
          for (var gsn in grant.allocations) {
            var ga = grant.allocations[gsn];
            if (character.skills[gsn]) {
              // Subtract skill points
              character.skills[gsn].points = Math.max(0, character.skills[gsn].points - (ga.points || 0));
              // Remove matching expertise entries
              if (ga.expertise && ga.expertise.length > 0 && character.skills[gsn].expertise) {
                for (var gei = 0; gei < ga.expertise.length; gei++) {
                  var gExp = ga.expertise[gei];
                  var matchIdx = -1;
                  for (var cei = character.skills[gsn].expertise.length - 1; cei >= 0; cei--) {
                    if (character.skills[gsn].expertise[cei].name === gExp.name && character.skills[gsn].expertise[cei].points === gExp.points) {
                      matchIdx = cei;
                      break;
                    }
                  }
                  if (matchIdx !== -1) {
                    character.skills[gsn].expertise.splice(matchIdx, 1);
                  }
                }
              }
              // Clean up empty skill entries
              if (character.skills[gsn].points <= 0 && (!character.skills[gsn].expertise || character.skills[gsn].expertise.length === 0)) {
                delete character.skills[gsn];
              }
            }
          }
          character.skillGrants.splice(grantIdx, 1);
          cfg.onSave();
        }
      }

      var baseLevel = clsBaselineClasses.get(cls.classId) || 0;

      if (sel.levels <= 1) {
        // At level 1 → remove the class entirely
        clsSelected.delete(cls.classId);
        // If this was a baseline class, track it as removed for refund
        if (baseLevel > 0) {
          clsRemovedBaseline.set(cls.classId, {
            data: cls,
            originalLevel: baseLevel,
          });
          say(cls.name + " marked for removal. +" + (cls.tier * 100 + (baseLevel - 1) * 100) + " EXP refund.", "2");
        } else {
          say(cls.name + " removed.", "2");
        }
      } else {
        sel.levels--;
        if (sel.levels < baseLevel) {
          say(cls.name + " reduced to Lv. " + sel.levels + ". +" + 100 + " EXP refund.", "2");
        } else {
          say(cls.name + " reduced to Lv. " + sel.levels + ".", "2");
        }
      }

      updateClsBudget();
      updateClsCart();
      if (!cfg.deferSync) syncClassesToCharacter();
      renderClassCards(getFilteredClasses());
      if (clsDetailCls && clsDetailCls.classId === cls.classId) {
        updateClsDetailBtns();
        updateClsProgression();
      }
    }

    /* ─── Requirement Checking ─────────────────────────────────────── */
    function checkClassRequirement(cls) {
      var req = (cls.requirements || "").trim();
      if (!req || req === "None" || req === "None.") return { met: true, reason: "" };

      var reqLower = req.toLowerCase();
      var results  = []; // collect all sub-checks; ALL must pass

      // ─── Race gate ─────────────────────────────────────────────────
      var raceChecks = [
        { pattern: /\bhuman\b/i,      raceId: "human" },
        { pattern: /\bfae\b/i,        raceId: "fae" },
        { pattern: /\bdemon\b/i,      raceId: "demon" },
        { pattern: /\bchimera\b/i,    raceId: "chimera" },
        { pattern: /\byoukai\b/i,     raceId: "youkai" },
        { pattern: /\brabbitfolk\b/i,  raceId: "rabbitfolk" },
        { pattern: /\boni\b/i,        raceId: "oni" },
        { pattern: /\bjiangshi\b/i,   raceId: "jiangshi" },
      ];
      for (var ri = 0; ri < raceChecks.length; ri++) {
        var rc = raceChecks[ri];
        if (rc.pattern.test(req)) {
          var playerRace     = (character.race?.primaryRaceId || "").toLowerCase();
          var playerAncestry = (character.race?.ancestryId || "").toLowerCase();
          var hybridPool     = (character.race?.hybridSubracePool || "").toLowerCase();
          var isRace         = playerRace === rc.raceId || playerAncestry === rc.raceId || hybridPool === rc.raceId;

          // Check if the race word is directly part of an "or" alternative
          var raceMatch = rc.pattern.exec(reqLower);
          var racePos   = raceMatch ? raceMatch.index : -1;
          var orPositions = [];
          var orRegex     = /\bor\b/gi;
          var orMatch;
          while ((orMatch = orRegex.exec(reqLower)) !== null) orPositions.push(orMatch.index);
          var raceHasOr = orPositions.some(function (pos) { return Math.abs(racePos - pos) < 30; });

          if (raceHasOr && reqLower.includes("mastered")) {
            if (isRace) return { met: true, reason: "" };
            // Don't fail — fall through to mastered check
          } else if (raceHasOr && !reqLower.includes("mastered")) {
            if (isRace) return { met: true, reason: "" };
          } else {
            // Hard race gate
            if (!isRace) {
              return { met: false, reason: "Requires " + rc.raceId.charAt(0).toUpperCase() + rc.raceId.slice(1) + " race." };
            }
          }
          break;
        }
      }

      // ─── Breakthrough gate ─────────────────────────────────────────
      var breakthroughPatterns = [
        { regex: /must have the (.+?) breakthrough/i },
        { regex: /have the (.+?) breakthrough/i },
      ];
      for (var bi = 0; bi < breakthroughPatterns.length; bi++) {
        var bpMatch = req.match(breakthroughPatterns[bi].regex);
        if (bpMatch) {
          var needed = bpMatch[1].toLowerCase().trim();
          var has = character.breakthroughs?.some(function (b) {
            var bName = (b.name || "").toLowerCase();
            var bId   = (b.breakthroughId || "").toLowerCase();
            return bName.includes(needed) || bId.includes(needed.replace(/\s+/g, "-"));
          });
          if (!has) {
            return { met: false, reason: 'Requires the "' + bpMatch[1] + '" breakthrough.' };
          }
        }
      }

      // ─── "Touched by Death" special ────────────────────────────────
      if (reqLower.includes("touched by death")) {
        var hasTBD = character.breakthroughs?.some(function (b) {
          return (b.name || "").toLowerCase().includes("touched by death") ||
                 (b.breakthroughId || "") === "touched-by-death";
        });
        if (!hasTBD) {
          return { met: false, reason: 'Requires the "Touched by Death" breakthrough.' };
        }
      }

      // ─── Spell gate ────────────────────────────────────────────────
      if (reqLower.includes("at least 1 spell") || reqLower.includes("at least one spell") || reqLower.includes("possess at least 1 spell")) {
        var hasSpellClass = Array.from(clsSelected.keys()).some(function (id) { return SPELL_GRANTING_CLASSES.has(id); });
        if (!hasSpellClass) {
          results.push({ met: false, reason: "Requires at least 1 spell (unlock a caster class like Mage, Sorcerer, or Acolyte)." });
        }
      }

      // ─── Elemental mastery check ───────────────────────────────────
      var ELEMENT_NAMES    = ["fire", "water", "wind", "earth", "lightning", "ice", "frost", "dark", "holy"];
      var normalizeElement = function (s) { return s.replace("frost", "ice"); };
      var elementRegex     = /(?:^|or\s+)(?:have\s+)?(\w+)(?:\s+element)?\s+(?:mastery|mastered)/gi;
      var elementMatch;
      var hasElementalReq    = false;
      var elementalSatisfied = false;

      while ((elementMatch = elementRegex.exec(reqLower)) !== null) {
        var rawElement = elementMatch[1].trim();
        if (!ELEMENT_NAMES.includes(rawElement)) continue;
        hasElementalReq = true;

        var normalizedEl = normalizeElement(rawElement);
        var raceElement  = (character.race?.elementalMastery || "").toLowerCase();
        if (raceElement && raceElement === normalizedEl) {
          elementalSatisfied = true;
          break;
        }
        var hasBT = character.breakthroughs?.some(function (b) {
          var bName = (b.name || "").toLowerCase();
          return bName.includes(normalizedEl) || bName.includes(rawElement);
        });
        if (hasBT) {
          elementalSatisfied = true;
          break;
        }
      }

      // "Have one element mastered" (any element, from race/BT)
      if (reqLower.includes("one element mastered") || (reqLower.includes("element mastered") && !hasElementalReq)) {
        hasElementalReq = true;
        var raceEl     = character.race?.elementalMastery || "";
        var hasElBT    = character.breakthroughs?.some(function (b) {
          var bName = (b.name || "").toLowerCase();
          return ELEMENT_NAMES.some(function (el) { return bName.includes(el); });
        });
        if (raceEl || hasElBT) {
          elementalSatisfied = true;
        }
      }

      // If elemental OR path is NOT satisfied, run class-mastered checks
      if (!(hasElementalReq && elementalSatisfied)) {

        // ─── "Two classes mastered" ──────────────────────────────────
        if (reqLower.includes("two classes mastered")) {
          var masteredCount = Array.from(clsSelected.values()).filter(function (s) { return s.levels >= 8; }).length;
          if (masteredCount < 2) {
            results.push({ met: false, reason: "Requires two classes mastered." });
          }
        }

        // ─── "{ClassName} mastered" or "{ClassA} or {ClassB} mastered" ─
        var masteredMatch  = reqLower.match(/(.+)\s+mastered/);
        var hasAnyClassReq = reqLower.includes("any class mastered") || reqLower.includes("at least 1 class mastered") || reqLower.includes("any mastered class");

        var specificClassMet = false;
        if (masteredMatch && !reqLower.includes("two classes mastered")) {
          var classNames = masteredMatch[1]
            .split(/[,.]\s*|\s+or\s+/i)
            .map(function (n) {
              return n.trim()
                .replace(/\s*mastered\s*/g, "")
                .replace(/^(?:be\s+a\s+|have\s+|be\s+|a\s+)/i, "")
                .trim().toLowerCase();
            })
            .filter(function (n) {
              if (!n) return false;
              var skip = ["any class", "any tier 2 class", "any", "two classes",
                "human", "fae", "demon", "chimera", "youkai", "oni", "rabbitfolk", "jiangshi"];
              return !skip.includes(n);
            });

          specificClassMet = classNames.some(function (cn) {
            return Array.from(clsSelected.values()).some(function (s) {
              return s.data.name.toLowerCase() === cn && s.levels >= 8;
            });
          });
        }

        // Check "any class mastered"
        var anyClassMet = false;
        if (hasAnyClassReq) {
          anyClassMet = Array.from(clsSelected.values()).some(function (s) { return s.levels >= 8; });
          var hasEarlyAscension = character.breakthroughs?.some(function (b) {
            return b.breakthroughId === "early-ascension" || b.name?.toLowerCase() === "early ascension";
          });
          if (hasEarlyAscension) anyClassMet = true;
        }

        // Evaluate
        var hasMasteredGate = (masteredMatch && !reqLower.includes("two classes mastered")) || hasAnyClassReq;
        if (hasMasteredGate) {
          var masteredGatePassed = specificClassMet || (hasAnyClassReq && anyClassMet);

          if (hasElementalReq) {
            if (!masteredGatePassed && !elementalSatisfied) {
              results.push({ met: false, reason: "Requires: " + req });
            }
          } else {
            if (!masteredGatePassed) {
              results.push({ met: false, reason: "Requires: " + req });
            }
          }
        }

        // If requirement ONLY has elemental mastery (no class mastered part)
        if (hasElementalReq && !reqLower.includes("mastered")) {
          if (!elementalSatisfied) {
            results.push({ met: false, reason: "Requires: " + req });
          }
        }
      } // end elemental-not-satisfied block

      // ─── "learned" requirements (soft pass — can't fully validate) ─
      // e.g. "Arcane Barrier learned"

      // ─── Return combined result ────────────────────────────────────
      var failed = results.filter(function (r) { return !r.met; });
      if (failed.length > 0) {
        return { met: false, reason: failed.map(function (f) { return f.reason; }).join(" ") };
      }
      return { met: true, reason: "" };
    }

    /* ─── Detail Modal ─────────────────────────────────────────────── */
    function bindClsDetailModal() {
      detailOverlay.addEventListener("click", function (e) {
        if (e.target === detailOverlay) closeClsDetail();
      });

      $("cls-detail-close").addEventListener("click", function (e) {
        e.stopPropagation();
        closeClsDetail();
      });

      escHandler = function (e) {
        if (e.key === "Escape") closeClsDetail();
      };
      document.addEventListener("keydown", escHandler);
    }

    function openClsDetail(cls) {
      clsDetailCls = cls;

      // Image
      var imgEl = $("cls-detail-img");
      imgEl.src = cls.imageSmUrl || "";
      imgEl.alt = cls.name;

      // Header info
      $("cls-detail-name").textContent = cls.name;

      var tierEl     = $("cls-detail-tier");
      tierEl.textContent = "Tier " + cls.tier;
      tierEl.className   = "cls-tier-badge tier-" + cls.tier;

      var diffDots = Array.from({ length: 5 }, function (_, i) { return i < cls.difficulty ? "●" : "○"; }).join("");
      $("cls-detail-diff").textContent = diffDots;

      var role1El = $("cls-detail-role1");
      role1El.textContent = cls.role1;
      role1El.className   = "cls-role-tag role-" + cls.role1.toLowerCase();

      var role2El = $("cls-detail-role2");
      if (cls.role2) {
        role2El.textContent   = cls.role2;
        role2El.className     = "cls-role-tag role-" + cls.role2.toLowerCase();
        role2El.style.display = "";
      } else {
        role2El.style.display = "none";
      }

      // Requirements
      var reqEl   = $("cls-detail-req");
      var reqText = cls.requirements && cls.requirements !== "None" && cls.requirements !== "None." ? cls.requirements : "";
      reqEl.textContent  = reqText ? "⚠ " + reqText : "";
      reqEl.style.display = reqText ? "block" : "none";

      // Description
      $("cls-detail-desc").innerHTML = cls.description || "";

      // Progression
      updateClsProgression();

      // Guide
      var guideEl = $("cls-detail-guide");
      guideEl.innerHTML    = cls.guide || "";
      guideEl.style.display = cls.guide ? "block" : "none";

      // Action buttons
      updateClsDetailBtns();

      detailOverlay.classList.add("open");
    }

    function updateClsProgression() {
      if (!clsDetailCls) return;
      var cls          = clsDetailCls;
      var table        = $("cls-progression-table");
      var sel          = clsSelected.get(cls.classId);
      var currentLevel = sel ? sel.levels : 0;

      // Map of ability ID keys for each level
      var abilityIdKeys = {
        1: "keyAbilityId",
        2: "ability1Id",
        4: "ability2Id",
        6: "ability3Id",
        8: "ultimateAbilityId",
      };

      table.innerHTML = "";
      CLS_LEVELS.forEach(function (def, i) {
        var lvl   = i + 1;
        var value = cls[def.key] || "—";
        var row   = document.createElement("div");
        row.className = "cls-prog-row";
        if (lvl <= currentLevel) row.classList.add("unlocked");
        if (lvl === currentLevel + 1) row.classList.add("current");
        if (lvl > currentLevel + 1) row.classList.add("locked");

        // Check if this level has an associated ability
        var abilityIdKey = abilityIdKeys[lvl];
        var abilityId    = abilityIdKey ? cls[abilityIdKey] : null;
        var hasAbility   = !!abilityId;

        row.innerHTML =
          '<div class="cls-prog-label">' +
            '<span class="cls-prog-level">Lv. ' + lvl + '</span> <span class="cls-prog-type">' + def.label + '</span>' +
          '</div>' +
          '<div class="cls-prog-content' + (hasAbility ? ' cls-prog-ability-link' : '') + '">' + value +
            (hasAbility ? ' <span class="cls-prog-expand-icon">▸</span>' : '') +
          '</div>';

        // Make ability rows clickable to show full ability details
        if (hasAbility) {
          row.style.cursor = "pointer";
          row.dataset.abilityId = abilityId;
          row.dataset.abilityLvl = lvl;
          row.addEventListener("click", function () {
            showAbilityDetail(cls, lvl, abilityId, value);
          });
        }

        table.appendChild(row);
      });

      // ── Table-level hover delegation for ability tooltips ──
      if (!table._hoverBound) {
      table._hoverBound = true;
      var tipLoaded = false;
      var lastMouse = { x: 0, y: 0 };
      var activeRow = null;

      table.addEventListener("mouseover", function (e) {
        var row = e.target.closest(".cls-prog-row[data-ability-id]");
        if (!row || row === activeRow) return;
        // Entering a new ability row
        activeRow = row;
        tipLoaded = false;
        lastMouse.x = e.clientX;
        lastMouse.y = e.clientY;
        if (hoverTipTimer) clearTimeout(hoverTipTimer);
        hoverTipTimer = setTimeout(function () {
          var aid = row.dataset.abilityId;
          var alvl = parseInt(row.dataset.abilityLvl);
          buildAbilityHtml(alvl, aid).then(function (html) {
            if (activeRow === row) {
              tipLoaded = true;
              showHoverTip({ clientX: lastMouse.x, clientY: lastMouse.y }, html);
            }
          });
        }, 250);
      });

      table.addEventListener("mousemove", function (e) {
        lastMouse.x = e.clientX;
        lastMouse.y = e.clientY;
        if (tipLoaded) positionHoverTip(e);
      });

      table.addEventListener("mouseout", function (e) {
        var row = e.target.closest(".cls-prog-row[data-ability-id]");
        var related = e.relatedTarget ? e.relatedTarget.closest(".cls-prog-row[data-ability-id]") : null;
        if (row && row !== related) {
          if (row === activeRow) {
            activeRow = null;
            tipLoaded = false;
            hideHoverTip();
          }
        }
      });

      table.addEventListener("mouseleave", function () {
        activeRow = null;
        tipLoaded = false;
        hideHoverTip();
      });
      } // end if (!table._hoverBound)
    }

    /* ─── Show ability detail from progression ─────────────────────── */
    function showAbilityDetail(cls, lvl, abilityId, abilityName) {
      // For level 1 (key ability), look up in key abilities
      // For levels 2,4,6,8, look up in true abilities
      var isKeyAbility = (lvl === 1);

      var loadAndShow = async function () {
        try {
          var content = "";
          if (isKeyAbility) {
            if (!_keyAbilities) {
              _keyAbilities = await cfg.apiClient.getKeyAbilities();
              if (!Array.isArray(_keyAbilities)) _keyAbilities = Object.values(_keyAbilities).flat();
            }
            var ka = _keyAbilities.find(function (a) { return a.indexId === abilityId; });
            if (ka) {
              var benefits = [ka.benefit1, ka.benefit2, ka.benefit3, ka.benefit4].filter(function (b) { return b && b.trim(); });
              content = benefits.map(function (b) { return '<div class="cls-ability-benefit">' + b + '</div>'; }).join("");
              // If there's an associated true ability, fetch it too
              if (ka.associatedAbility) {
                if (!_trueAbilities) {
                  _trueAbilities = await cfg.apiClient.getTrueAbilities();
                  if (!Array.isArray(_trueAbilities)) _trueAbilities = Object.values(_trueAbilities).flat();
                }
                var assocAbility = _trueAbilities.find(function (a) { return a.indexId === ka.associatedAbility; });
                if (assocAbility) {
                  content += '<div class="cls-ability-assoc">' +
                    '<div class="cls-ability-assoc-name">' + assocAbility.name + '</div>' +
                    (assocAbility.apCost ? '<span class="cls-ability-tag">AP: ' + assocAbility.apCost + '</span>' : '') +
                    (assocAbility.manaCost ? '<span class="cls-ability-tag">Mana: ' + assocAbility.manaCost + '</span>' : '') +
                    (assocAbility.range ? '<span class="cls-ability-tag">Range: ' + assocAbility.range + '</span>' : '') +
                    '<div class="cls-ability-desc">' + (assocAbility.description || "") + '</div>' +
                  '</div>';
                }
              }
            } else {
              content = '<div class="cls-ability-desc">Ability details not found.</div>';
            }
          } else {
            // True ability lookup
            if (!_trueAbilities) {
              _trueAbilities = await cfg.apiClient.getTrueAbilities();
              if (!Array.isArray(_trueAbilities)) _trueAbilities = Object.values(_trueAbilities).flat();
            }
            var ta = _trueAbilities.find(function (a) { return a.indexId === abilityId; });
            if (ta) {
              content =
                '<div class="cls-ability-assoc">' +
                  (ta.apCost ? '<span class="cls-ability-tag">AP: ' + ta.apCost + '</span>' : '') +
                  (ta.manaCost ? '<span class="cls-ability-tag">Mana: ' + ta.manaCost + '</span>' : '') +
                  (ta.rpCost ? '<span class="cls-ability-tag">RP: ' + ta.rpCost + '</span>' : '') +
                  (ta.range ? '<span class="cls-ability-tag">Range: ' + ta.range + '</span>' : '') +
                  (ta.keywords ? '<span class="cls-ability-tag">' + ta.keywords + '</span>' : '') +
                  (ta.requirement && ta.requirement !== "-" ? '<div class="cls-ability-req">Requires: ' + ta.requirement + '</div>' : '') +
                  '<div class="cls-ability-desc">' + (ta.description || "No description.") + '</div>' +
                '</div>';
            } else {
              content = '<div class="cls-ability-desc">Ability details not found.</div>';
            }
          }

          // Show in a tooltip overlay
          var overlay = document.getElementById("cs-tooltip-overlay");
          var titleEl = document.getElementById("cs-tooltip-title");
          var bodyEl  = document.getElementById("cs-tooltip-body");
          if (overlay && titleEl && bodyEl) {
            titleEl.textContent = abilityName;
            bodyEl.innerHTML = content;
            overlay.classList.add("open");
          }
        } catch (err) {
          console.error("[showAbilityDetail] Error:", err);
          say("Could not load ability details.", "4");
        }
      };

      loadAndShow();
    }

    function closeClsDetail() {
      clsDetailCls = null;
      detailOverlay.classList.remove("open");
      hideHoverTip();
    }

    function updateClsDetailBtns() {
      if (!clsDetailCls) return;
      var cls       = clsDetailCls;
      var unlockBtn = $("cls-detail-unlock-btn");
      var levelBtn  = $("cls-detail-level-btn");
      var sel       = clsSelected.get(cls.classId);

      // Reset all handlers to prevent stale state
      unlockBtn.onclick = null;
      levelBtn.onclick  = null;

      if (!sel) {
        // Not unlocked yet
        unlockBtn.style.display = "inline-flex";
        unlockBtn.textContent   = "Unlock (T" + cls.tier + " = " + (cls.tier * 100) + " EXP + 1 IP)";
        unlockBtn.disabled      = false;
        unlockBtn.className     = "cls-detail-unlock-btn";
        unlockBtn.onclick       = function (e) { e.stopPropagation(); unlockClass(cls); };
        levelBtn.style.display  = "none";
        levelBtn.disabled       = true;
      } else if (sel.levels < 8) {
        // Unlocked, can level up
        var isFreeAtMin = clsFreeClasses.has(cls.classId) &&
          sel.levels <= (FREE_CLASS_GRANTS.find(function (g) { return g.classId === cls.classId; })?.level || 1);
        unlockBtn.style.display = "inline-flex";
        unlockBtn.textContent   = sel.levels <= 1 ? "Remove Class" : "Remove Level (Lv. " + sel.levels + " → " + (sel.levels - 1) + ")";
        unlockBtn.className     = "cls-detail-unlock-btn is-remove";
        unlockBtn.disabled      = isFreeAtMin;
        unlockBtn.onclick       = isFreeAtMin ? null : function (e) { e.stopPropagation(); levelDownClass(cls); };
        levelBtn.style.display  = "inline-flex";
        levelBtn.textContent    = "Level Up → Lv. " + (sel.levels + 1) + " (100 EXP)";
        levelBtn.disabled       = false;
        levelBtn.className      = "cls-detail-level-btn";
        levelBtn.onclick        = function (e) { e.stopPropagation(); levelUpClass(cls); };
      } else {
        // Mastered!
        unlockBtn.style.display = "inline-flex";
        unlockBtn.textContent   = "Remove Level (Lv. 8 → 7)";
        unlockBtn.className     = "cls-detail-unlock-btn is-remove";
        unlockBtn.disabled      = false;
        unlockBtn.onclick       = function (e) { e.stopPropagation(); levelDownClass(cls); };
        levelBtn.style.display  = "inline-flex";
        levelBtn.textContent    = "★ MASTERED ★";
        levelBtn.disabled       = true;
        levelBtn.className      = "cls-detail-level-btn mastered";
      }
    }

    /* ═══════════════════════════════════════════════════════════════════
       Controller object
       ═══════════════════════════════════════════════════════════════════ */
    return {
      /**
       * Load class data from the API and render the browser.
       * Call once after creating the instance.
       */
      init: async function () {
        buildDOM();

        var grid = $("cls-grid");

        if (allClassesData.length === 0) {
          grid.innerHTML = '<div class="bt-empty-state">Loading classes...</div>';
          try {
            var rawData = await cfg.apiClient.getClassesFull();
            console.log("[ClassBrowser.init] raw data type:", typeof rawData, "isArray:", Array.isArray(rawData), "length:", rawData?.length);
            if (Array.isArray(rawData)) {
              allClassesData = rawData;
            } else if (rawData && typeof rawData === "object") {
              allClassesData = Object.values(rawData).flat().filter(function (c) { return c && c.classId; });
              console.log("[ClassBrowser.init] extracted from object, count:", allClassesData.length);
            } else {
              throw new Error("Unexpected data format: " + typeof rawData);
            }
            allClassesData.sort(function (a, b) {
              return (a.tier || 0) - (b.tier || 0) || (a.name || "").localeCompare(b.name || "");
            });
            console.log("[ClassBrowser.init] loaded", allClassesData.length, "classes");
          } catch (err) {
            grid.innerHTML = '<div class="bt-empty-state">Failed to load classes: ' + err.message + '</div>';
            console.error("Class load error:", err);
            return;
          }
        }

        // Restore previous selections
        if (character.classes && character.classes.length && clsSelected.size === 0) {
          character.classes.forEach(function (c) {
            var data = allClassesData.find(function (d) { return d.classId === c.classId; });
            if (data) clsSelected.set(c.classId, { levels: c.levels, data: data });
          });
        }

        // Record baseline levels (snapshot of what existed before this session)
        if (clsBaselineClasses.size === 0) {
          clsSelected.forEach(function (entry, classId) {
            clsBaselineClasses.set(classId, entry.levels);
          });
        }

        // Apply free class grants from race/house/ancestry
        applyFreeClassGrants();

        // Restore previous interlude actions
        if (character.interludeActions && character.interludeActions.length && clsInterludeActions.length === 0) {
          clsInterludeActions.push.apply(clsInterludeActions, character.interludeActions);
        }

        // Sort: owned/purchased classes first, then by tier, then alphabetically
        allClassesData.sort(function (a, b) {
          var aOwned = clsSelected.has(a.classId) ? 1 : 0;
          var bOwned = clsSelected.has(b.classId) ? 1 : 0;
          if (aOwned !== bOwned) return bOwned - aOwned;
          return (a.tier || 0) - (b.tier || 0) || (a.name || "").localeCompare(b.name || "");
        });

        renderClassCards(allClassesData);
        updateClsBudget();
        updateClsCart();
      },

      /**
       * Return current selections as a Map of classId → { levels, data }.
       */
      getSelected: function () {
        return new Map(clsSelected);
      },

      /**
       * Replace selections with the given Map.
       * @param {Map} map — classId → { levels, data }
       */
      setSelected: function (map) {
        clsSelected = new Map(map);
        // Rebuild free set
        clsFreeClasses.clear();
        applyFreeClassGrants();
        renderClassCards(getFilteredClasses());
        updateClsBudget();
        updateClsCart();
        syncClassesToCharacter();
      },

      /**
       * Re-render cards with current filter state.
       */
      refresh: function () {
        applyClsFilters();
        updateClsBudget();
        updateClsCart();
      },

      /**
       * Remove all generated DOM and cleanup event listeners.
       */
      destroy: function () {
        if (escHandler) {
          document.removeEventListener("keydown", escHandler);
          escHandler = null;
        }
        if (detailOverlay && detailOverlay.parentNode) {
          detailOverlay.parentNode.removeChild(detailOverlay);
          detailOverlay = null;
        }
        if (statPickOverlay && statPickOverlay.parentNode) {
          statPickOverlay.parentNode.removeChild(statPickOverlay);
          statPickOverlay = null;
        }
        cfg.containerEl.innerHTML = "";
        clsSelected.clear();
        clsFreeClasses.clear();
        clsBaselineClasses.clear();
        clsRemovedBaseline.clear();
        clsInterludeActions.length = 0;
        allClassesData = [];
        clsDetailCls   = null;
      },
    };
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Public API
     ═══════════════════════════════════════════════════════════════════════ */
  return {
    create: create,
    // Expose constants for external use if needed
    CLS_LEVELS:          CLS_LEVELS,
    FREE_CLASS_GRANTS:   FREE_CLASS_GRANTS,
    INTERLUDE_ACTIONS:   INTERLUDE_ACTIONS,
    clsMiraneBanList:    clsMiraneBanList,
  };

})();
