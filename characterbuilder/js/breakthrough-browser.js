/* ═══════════════════════════════════════════════════════════════════════════
   BreakthroughBrowser — shared, self-contained breakthrough-browsing module.
   Attach via window.BreakthroughBrowser  (IIFE, no imports).

   Two modes:
     • "creation" — toggle-select from a grid with fixed budget + cart sidebar
                     Budget/search → cfg.headerExtrasEl, cards → cfg.containerEl
                     Cart uses existing DOM (bt-cart-items, etc.)
     • "sheet"    — purchase/unlearn breakthroughs from a Spend EXP modal
                     All HTML created inside cfg.containerEl
   ═══════════════════════════════════════════════════════════════════════════ */
window.BreakthroughBrowser = (function () {
  "use strict";

  /* ─── Constants ──────────────────────────────────────────────────────── */

  var BT_MIRANE_BAN_LIST = [
    "Angelblooded (Human) (Restricted)",
    "Curse of Vampirism",
  ];

  var ELEMENTAL_AFFINITY_ID = "elemental-affinity";
  var ELEMENTAL_CHOICES = ["Fire", "Water", "Wind", "Earth", "Lightning", "Ice", "Dark", "Holy"];

  /** Multi-take BT configuration */
  var MULTI_TAKE_CHOICES = {
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

  /** Map element names to emoji icons */
  function getElementIcon(element) {
    var icons = {
      fire: "🔥", water: "💧", wind: "🌪️", earth: "🪨",
      lightning: "⚡", ice: "❄️", dark: "🌑", holy: "✨",
    };
    return icons[element] || "🔮";
  }

  /** Detect whether a BT is multi-take from its description/name */
  function isMultiTakeBt(bt) {
    var text = ((bt.description || "") + " " + (bt.name || "")).toLowerCase();
    return text.indexOf("multiple times") !== -1 ||
           text.indexOf("taken multiple") !== -1 ||
           (text.indexOf("can be taken") !== -1 && text.indexOf("times") !== -1);
  }


  /* ═══════════════════════════════════════════════════════════════════════
     Factory: create(config) → controller
     ═══════════════════════════════════════════════════════════════════════ */

  /**
   * @param {Object} config
   * @param {HTMLElement}  config.containerEl       — where to render cards (creation: bt-grid, sheet: modal body)
   * @param {Object}       config.character         — character state object
   * @param {string}       config.mode              — "creation" | "sheet"
   * @param {number}       [config.budget=300]      — fixed EXP budget (creation mode)
   * @param {Function}     [config.getUnspentExp]   — function returning unspent EXP (sheet mode)
   * @param {Function}     [config.onSync]          — called after selection changes: (selectedBts) => void
   * @param {Function}     [config.onMessage]       — called to show messages: (text) => void
   * @param {Function}     [config.onPurchase]      — sheet: confirm purchase: (bt, cost, callback) => void
   * @param {Function}     [config.onRemove]        — sheet: confirm removal: (bt, cost, callback) => void
   * @param {Function}     [config.afterPurchase]   — sheet: called after purchase completes
   * @param {Object}       config.apiClient         — ApiClient reference
   * @param {Function}     config.stripHtml         — function to strip HTML tags
   * @param {Object}       config.characterModule   — Character module reference (for save)
   * @param {string}       [config.idPrefix='bt']   — DOM ID prefix
   * @param {boolean}      [config.showCart]        — show cart sidebar (default: true for creation)
   * @param {string}       [config.hybridBreakthroughId] — auto-grant locked BT for hybrid races
   * @param {Set}          [config.initialSelected] — Set of initially selected BT IDs
   * @param {HTMLElement}  [config.headerExtrasEl]  — creation mode: element for budget/search (e.g. phase-header-extras)
   */
  function create(config) {
    /* ─── Config defaults ──────────────────────────────────────────── */
    var isCreation = config.mode === "creation";
    var cfg = {
      containerEl:          config.containerEl,
      character:            config.character,
      mode:                 config.mode || "creation",
      budget:               config.budget != null ? config.budget : 300,
      getUnspentExp:        config.getUnspentExp || function () { return 0; },
      onSync:               config.onSync       || function () {},
      onMessage:            config.onMessage     || function () {},
      onPurchase:           config.onPurchase    || function () {},
      onRemove:             config.onRemove      || function () {},
      afterPurchase:        config.afterPurchase || function () {},
      apiClient:            config.apiClient,
      stripHtml:            config.stripHtml || function (s) { return s; },
      characterModule:      config.characterModule,
      idPrefix:             config.idPrefix || "bt",
      showCart:             config.showCart != null ? config.showCart : isCreation,
      hybridBreakthroughId: config.hybridBreakthroughId || null,
      initialSelected:      config.initialSelected || null,
      headerExtrasEl:       config.headerExtrasEl || null,
    };

    /* ─── Internal state ───────────────────────────────────────────── */
    var character       = cfg.character;
    var allBreakthroughs = [];
    var btSelected      = new Set();   // set of breakthroughIds (suffixed for elemental: "elemental-affinity::fire")
    var btLockedIds     = new Set();   // breakthrough IDs locked from race (hybrid) — cannot be removed
    var btDetailBt      = null;        // currently viewed breakthrough in detail modal
    var btOverrideMode  = false;
    var btMiraneMode    = true;
    var btAvailableOnly = false;

    // DOM elements
    var detailOverlay   = null;        // created by buildDOM or found in existing HTML
    var gridEl          = null;        // the card grid element
    var escHandler      = null;        // keydown handler reference for cleanup
    var createdBodyEls  = [];          // elements appended to document.body (for cleanup)

    /* ─── Helpers ──────────────────────────────────────────────────── */
    /** Prefixed getElementById */
    function $(id) { return document.getElementById(cfg.idPrefix + "-" + id); }

    function say(text) { cfg.onMessage(text); }

    /* ─── Budget helpers ───────────────────────────────────────────── */
    function getBudget() {
      if (isCreation) {
        return cfg.budget;
      }
      return cfg.getUnspentExp();
    }

    /** Resolve suffixed IDs (e.g. "elemental-affinity::fire" → base BT object) */
    function resolveBtBase(id) {
      var baseId = id.indexOf("::") !== -1 ? id.split("::")[0] : id;
      for (var i = 0; i < allBreakthroughs.length; i++) {
        if (allBreakthroughs[i].breakthroughId === baseId) return allBreakthroughs[i];
      }
      return null;
    }

    /** Count how many times a BT is owned by the character */
    function getOwnedCount(btId) {
      var count = 0;
      var bts = character.breakthroughs || [];
      for (var i = 0; i < bts.length; i++) {
        if (bts[i].breakthroughId === btId) count++;
      }
      return count;
    }

    /** Get total EXP spent on selected breakthroughs (creation mode) */
    function getSpentExp() {
      var total = 0;
      btSelected.forEach(function (id) {
        var bt = resolveBtBase(id);
        if (bt) total += parseInt(bt.cost) || 0;
      });
      return total;
    }

    /** Check if a btSelected set entry matches a given base btId */
    function isIdSelected(btId) {
      if (btSelected.has(btId)) return true;
      var found = false;
      btSelected.forEach(function (id) {
        if (id.indexOf(btId + "::") === 0) found = true;
      });
      return found;
    }

    /* ─── Requirement checking ─────────────────────────────────────── */
    function checkRequirement(bt) {
      return RequirementChecker.checkBreakthrough(bt, character, isCreation);
    }

    /* ─── DOM Generation ───────────────────────────────────────────── */
    function buildDOM() {
      var p = cfg.idPrefix;

      if (isCreation) {
        buildCreationDOM(p);
      } else {
        buildSheetDOM(p);
      }
    }

    /** Creation mode: all HTML created inside containerEl, fully self-contained */
    function buildCreationDOM(p) {
      var container = cfg.containerEl;
      container.innerHTML = "";

      // Budget bar + search + filter toggles
      var headerHTML =
        '<div class="bt-budget-bar">' +
          '<span class="bt-budget-label">EXP Budget</span>' +
          '<div class="bt-budget-meter"><div class="bt-budget-fill" id="' + p + '-budget-fill"></div></div>' +
          '<span class="bt-budget-value" id="' + p + '-budget-value">' + cfg.budget + ' / ' + cfg.budget + '</span>' +
          '<button class="bt-override-btn" id="' + p + '-override-btn">' +
            '<span class="bt-override-indicator"></span>' +
            '<span class="bt-override-label">Override</span>' +
          '</button>' +
        '</div>' +
        '<div class="bt-search-wrap">' +
          '<span class="bt-search-icon">\uD83D\uDD0D</span>' +
          '<input type="text" id="' + p + '-search" class="bt-search-input" placeholder="Search breakthroughs by name, description, or requirement..." autocomplete="off">' +
        '</div>' +
        '<div class="cls-filter-bar" style="display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap;">' +
          '<button class="cls-mirane-btn" id="' + p + '-mirane-btn" title="Mirane: filter out banned breakthroughs">' +
            '<span class="cls-mirane-indicator"></span>' +
            '<span class="cls-mirane-label">Mirane</span>' +
          '</button>' +
          '<button class="cls-mirane-btn" id="' + p + '-available-btn" title="Show only available breakthroughs">' +
            '<span class="cls-mirane-indicator"></span>' +
            '<span>Available Only</span>' +
          '</button>' +
        '</div>';

      // Layout: grid + cart sidebar
      var layoutHTML = '<div class="bt-layout">';
      layoutHTML += '<div class="bt-grid" id="' + p + '-grid"></div>';

      if (cfg.showCart) {
        layoutHTML +=
          '<div class="bt-cart" id="' + p + '-cart">' +
            '<div class="bt-cart-header">' +
              '<span class="bt-cart-title">Selected</span>' +
              '<span class="bt-cart-count" id="' + p + '-cart-count">0</span>' +
            '</div>' +
            '<div class="bt-cart-items" id="' + p + '-cart-items">' +
              '<div class="bt-cart-empty">No breakthroughs selected</div>' +
            '</div>' +
            '<div class="bt-cart-total">' +
              '<span>Total Cost</span>' +
              '<span id="' + p + '-cart-total-cost">0 EXP</span>' +
            '</div>' +
          '</div>';
      }

      layoutHTML += '</div>';
      container.innerHTML = headerHTML + layoutHTML;

      // Grid element reference for rendering cards
      gridEl = document.getElementById(p + "-grid");

      // Detail modal overlay — appended to document.body (self-contained)
      detailOverlay = document.createElement("div");
      detailOverlay.className = "bt-detail-overlay";
      detailOverlay.id = p + "-detail-overlay";
      detailOverlay.style.display = "none";
      detailOverlay.innerHTML =
        '<div class="bt-detail-modal" id="' + p + '-detail-box">' +
          '<button class="bt-detail-close" id="' + p + '-detail-close">\u2715</button>' +
          '<h2 class="bt-detail-title" id="' + p + '-detail-name"></h2>' +
          '<div class="bt-detail-meta">' +
            '<span class="bt-detail-cost" id="' + p + '-detail-cost"></span>' +
          '</div>' +
          '<div class="bt-detail-req" id="' + p + '-detail-req"></div>' +
          '<div class="bt-detail-lock-reason" id="' + p + '-detail-lock-reason" style="display:none;"></div>' +
          '<div class="bt-detail-desc" id="' + p + '-detail-desc"></div>' +
          '<div class="bt-detail-footer">' +
            '<button class="bt-detail-toggle-btn" id="' + p + '-detail-toggle-btn">Select</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(detailOverlay);
      createdBodyEls.push(detailOverlay);

      /* ── Wire up header controls ──────────────────────────────────── */
      wireHeaderControls(p);

      /* ── Bind detail modal events ─────────────────────────────────── */
      bindCreationDetailModal(p);
    }

    /** Sheet mode: all HTML created inside containerEl */
    function buildSheetDOM(p) {
      var container = cfg.containerEl;
      container.innerHTML = "";

      // Budget + search + filter toggles
      var headerHTML =
        '<div class="bt-budget-bar">' +
          '<span class="bt-budget-label">Unspent EXP</span>' +
          '<span class="bt-budget-value" id="' + p + '-budget-value">' + getBudget() + '</span>' +
          '<button class="bt-override-btn" id="' + p + '-override-btn">' +
            '<span class="bt-override-indicator"></span>' +
            '<span class="bt-override-label">Override</span>' +
          '</button>' +
        '</div>' +
        '<div class="bt-search-wrap">' +
          '<span class="bt-search-icon">🔍</span>' +
          '<input type="text" id="' + p + '-search" class="bt-search-input" placeholder="Search breakthroughs by name, description, or requirement..." autocomplete="off">' +
        '</div>' +
        '<div class="cls-filter-bar" style="display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap;">' +
          '<button class="cls-mirane-btn" id="' + p + '-mirane-btn" title="Mirane: filter out banned breakthroughs">' +
            '<span class="cls-mirane-indicator"></span>' +
            '<span class="cls-mirane-label">Mirane</span>' +
          '</button>' +
          '<button class="cls-mirane-btn" id="' + p + '-available-btn" title="Show only available breakthroughs">' +
            '<span class="cls-mirane-indicator"></span>' +
            '<span>Available Only</span>' +
          '</button>' +
        '</div>';

      // Grid for cards
      var gridHTML = '<div class="bt-grid" id="' + p + '-grid"></div>';

      container.innerHTML = headerHTML + gridHTML;
      gridEl = $(  "grid");

      // Detail overlay — appended to document.body (sheet mode creates its own)
      detailOverlay = document.createElement("div");
      detailOverlay.className = "bt-detail-overlay";
      detailOverlay.id = p + "-detail-overlay";
      detailOverlay.style.display = "none";
      detailOverlay.innerHTML =
        '<div class="bt-detail-modal" id="' + p + '-detail-box">' +
          '<button class="bt-detail-close" id="' + p + '-detail-close">✕</button>' +
          '<h2 class="bt-detail-title" id="' + p + '-detail-name"></h2>' +
          '<div class="bt-detail-req">' +
            '<span class="bt-detail-req-label">Requirements:</span>' +
            '<span class="bt-detail-req-text" id="' + p + '-detail-req"></span>' +
          '</div>' +
          '<div class="bt-detail-lock-reason" id="' + p + '-detail-lock-reason" style="display:none;"></div>' +
          '<div class="bt-detail-desc" id="' + p + '-detail-desc"></div>' +
          '<div class="bt-detail-multi-info" id="' + p + '-detail-multi-info" style="display:none;">' +
            '<div class="bt-detail-own-count" id="' + p + '-detail-own-count"></div>' +
            '<div class="bt-detail-choice-area" id="' + p + '-detail-choice-area"></div>' +
          '</div>' +
          '<div class="bt-detail-footer" id="' + p + '-detail-footer"></div>' +
        '</div>';
      document.body.appendChild(detailOverlay);
      createdBodyEls.push(detailOverlay);

      /* ── Wire up controls ──────────────────────────────────────────── */
      wireHeaderControls(p);
      bindSheetDetailModal(p);
    }

    /** Wire up override, mirane, available, search controls */
    function wireHeaderControls(p) {
      // Override toggle
      var overrideBtn = $("override-btn");
      if (overrideBtn) {
        if (btOverrideMode) overrideBtn.classList.add("active");
        overrideBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          btOverrideMode = !btOverrideMode;
          overrideBtn.classList.toggle("active", btOverrideMode);
          updateBudget();
          applyFilters();
        });
      }

      // Mirane toggle (may or may not exist in creation mode header)
      var miraneBtn = $("mirane-btn");
      if (miraneBtn) {
        if (btMiraneMode) miraneBtn.classList.add("active");
        miraneBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          btMiraneMode = !btMiraneMode;
          miraneBtn.classList.toggle("active", btMiraneMode);
          applyFilters();
        });
      }

      // Available Only toggle (may or may not exist in creation mode header)
      var availBtn = $("available-btn");
      if (availBtn) {
        if (btAvailableOnly) availBtn.classList.add("active");
        availBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          btAvailableOnly = !btAvailableOnly;
          availBtn.classList.toggle("active", btAvailableOnly);
          applyFilters();
        });
      }

      // Search
      var searchInput = $("search");
      if (searchInput) {
        searchInput.oninput = function () { applyFilters(); };
      }
    }

    /* ─── Filter logic ─────────────────────────────────────────────── */
    function getFilteredList() {
      var searchEl = $("search");
      var q = (searchEl ? searchEl.value : "").toLowerCase().trim();
      var stripHtml = cfg.stripHtml;

      var filtered = allBreakthroughs;

      // Mirane filter
      if (btMiraneMode) {
        filtered = filtered.filter(function (bt) {
          return BT_MIRANE_BAN_LIST.indexOf(bt.name) === -1;
        });
      }

      // Search
      if (q) {
        filtered = filtered.filter(function (bt) {
          return bt.name.toLowerCase().indexOf(q) !== -1 ||
            stripHtml(bt.description || "").toLowerCase().indexOf(q) !== -1 ||
            (bt.requirements && bt.requirements.toLowerCase().indexOf(q) !== -1);
        });
      }

      // Available Only: hide BTs with unmet requirements
      if (btAvailableOnly && !btOverrideMode) {
        filtered = filtered.filter(function (bt) {
          return checkRequirement(bt).met;
        });
      }

      return filtered;
    }

    function applyFilters() {
      renderCards(getFilteredList());
    }

    /* ─── Card Rendering ───────────────────────────────────────────── */
    function renderCards(list) {
      if (!gridEl) return;
      gridEl.innerHTML = "";

      if (list.length === 0) {
        gridEl.innerHTML = '<div class="bt-empty-state">No breakthroughs match your search.</div>';
        return;
      }

      if (isCreation) {
        renderCreationCards(gridEl, list);
      } else {
        renderSheetCards(gridEl, list);
      }
    }

    /* ── Creation mode cards ─────────────────────────────────────────── */
    function renderCreationCards(grid, list) {
      list.forEach(function (bt) {
        var card = document.createElement("div");
        card.className = "bt-card";
        card.dataset.btId = bt.breakthroughId;

        // Check if selected (including suffixed elemental IDs)
        var selected = isIdSelected(bt.breakthroughId);
        if (selected) card.classList.add("selected");

        var isLocked = btLockedIds.has(bt.breakthroughId);
        if (isLocked) card.classList.add("bt-locked-race");

        // Requirement check
        var reqCheck = checkRequirement(bt);
        if (!reqCheck.met && !btOverrideMode) {
          card.classList.add("bt-locked");
        }

        var cost = parseInt(bt.cost) || 0;
        var costClass = cost === 0 ? "bt-card-cost free" : "bt-card-cost";
        var costLabel = isLocked ? "🔒 RACE" : (cost === 0 ? "FREE" : cost + " EXP");
        var desc = cfg.stripHtml(bt.description || "");
        var req = bt.requirements && bt.requirements !== "-" ? bt.requirements : "";

        card.innerHTML =
          '<div class="bt-card-header">' +
            '<span class="bt-card-name">' + bt.name + '</span>' +
            '<span class="' + costClass + '">' + costLabel + '</span>' +
          '</div>' +
          (req ? '<div class="bt-card-req">⚠ ' + req + '</div>' : '') +
          (!reqCheck.met && !btOverrideMode && !isLocked ? '<div class="bt-card-lock-reason">⚠ ' + reqCheck.reason + '</div>' : '') +
          '<div class="bt-card-desc">' + desc + '</div>' +
          '<button class="bt-card-expand" data-bt-id="' + bt.breakthroughId + '">View Details</button>';

        // Click card body → toggle selection
        card.addEventListener("click", function (e) {
          if (e.target.closest(".bt-card-expand")) return;
          e.stopPropagation();
          toggleBreakthrough(bt);
        });

        // Expand button → open detail modal
        card.querySelector(".bt-card-expand").addEventListener("click", function (e) {
          e.stopPropagation();
          openDetail(bt);
        });

        grid.appendChild(card);
      });
    }

    /* ── Sheet mode cards ────────────────────────────────────────────── */
    function renderSheetCards(grid, list) {
      // Count how many times each BT is owned
      var ownedCounts = new Map();
      (character.breakthroughs || []).forEach(function (b) {
        ownedCounts.set(b.breakthroughId, (ownedCounts.get(b.breakthroughId) || 0) + 1);
      });

      list.forEach(function (bt) {
        var cost = parseInt(bt.cost) || 0;
        var ownCount = ownedCounts.get(bt.breakthroughId) || 0;
        var isOwned = ownCount > 0;
        var multiTake = isMultiTakeBt(bt);
        var choiceCfg = MULTI_TAKE_CHOICES[bt.name] || null;
        var maxCount = choiceCfg && choiceCfg.maxCount ? choiceCfg.maxCount : Infinity;
        var canBuyMore = multiTake && ownCount < maxCount;
        var reqCheck = checkRequirement(bt);
        var isLocked = !reqCheck.met && !btOverrideMode && !isOwned;
        var desc = cfg.stripHtml(bt.description || "");
        var truncDesc = desc.length > 120 ? desc.substring(0, 117) + "..." : desc;

        // Escalating cost
        if (choiceCfg && choiceCfg.escalatingCost && ownCount > 0) {
          cost = Math.min(
            choiceCfg.escalatingCost.base + (ownCount * choiceCfg.escalatingCost.increment),
            choiceCfg.escalatingCost.max
          );
        }

        var card = document.createElement("div");
        card.className = "bt-card";
        if (isOwned) card.classList.add("selected");
        if (isLocked) card.classList.add("bt-locked");
        if (multiTake && isOwned) card.classList.add("bt-multi-owned");
        card.dataset.btId = bt.breakthroughId;
        card.dataset.name = (bt.name || "").toLowerCase();

        var actionsHTML = "";
        if ((!isOwned && !isLocked) || (canBuyMore && !isLocked)) {
          actionsHTML = '<div class="bt-card-actions"><button class="bt-card-purchase-btn" data-bt-id="' + bt.breakthroughId + '">Purchase</button></div>';
        }

        var ownedBadge = "";
        if (isOwned) {
          ownedBadge = '<div class="bt-card-owned-badge">✔ Owned' + (multiTake ? ' ×' + ownCount : '') + '</div>';
        }

        card.innerHTML =
          '<div class="bt-card-header">' +
            '<span class="bt-card-name">' + bt.name + '</span>' +
            '<span class="bt-card-cost">' + cost + ' EXP' + (multiTake ? ' <small style="opacity:0.6">(repeatable)</small>' : '') + '</span>' +
          '</div>' +
          '<div class="bt-card-req">' + (bt.requirements || "No requirements") + '</div>' +
          (isLocked ? '<div class="bt-card-lock-reason">⚠ ' + reqCheck.reason + '</div>' : '') +
          '<div class="bt-card-desc">' + truncDesc + '</div>' +
          actionsHTML +
          ownedBadge;

        // Purchase button click
        var purchaseBtn = card.querySelector(".bt-card-purchase-btn");
        if (purchaseBtn) {
          purchaseBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            handleSheetPurchase(bt, ownCount);
          });
        }

        // Card click → open detail
        card.addEventListener("click", function (e) {
          if (e.target.closest(".bt-card-purchase-btn")) return;
          e.stopPropagation();
          openDetail(bt);
        });

        grid.appendChild(card);
      });
    }

    /* ─── Sheet mode: handle purchase ──────────────────────────────── */
    function handleSheetPurchase(bt, ownCount) {
      var multiTake = isMultiTakeBt(bt);
      var choiceCfg = MULTI_TAKE_CHOICES[bt.name] || null;
      var cost = parseInt(bt.cost) || 0;

      if (typeof ownCount === "undefined") {
        ownCount = getOwnedCount(bt.breakthroughId);
      }

      // Escalating cost
      if (choiceCfg && choiceCfg.escalatingCost) {
        cost = Math.min(
          choiceCfg.escalatingCost.base + (ownCount * choiceCfg.escalatingCost.increment),
          choiceCfg.escalatingCost.max
        );
      }

      // Multi-take BTs with choices → open detail modal for choice picking
      if (multiTake && choiceCfg && choiceCfg.type !== "none") {
        openDetail(bt);
        return;
      }

      // Budget check
      if (!btOverrideMode && cost > getBudget()) {
        say("Not enough EXP! You need " + cost + " EXP but only have " + getBudget() + " unspent.");
        return;
      }

      cfg.onPurchase(bt, cost, function () {
        doPurchase(bt, cost, null);
      });
    }

    /** Actually apply the purchase to character state */
    function doPurchase(bt, cost, choiceVal) {
      character.breakthroughs = character.breakthroughs || [];
      var displayName = bt.name + (choiceVal ? ": " + choiceVal : "");
      character.breakthroughs.push({
        breakthroughId: bt.breakthroughId,
        name: displayName,
        cost: cost,
        requirements: bt.requirements || "",
        description: cfg.stripHtml(bt.description || ""),
        abilityId: bt.ability || null,
        fromCreation: false,
        choice: choiceVal || null,
      });
      cfg.characterModule.save(character);
      cfg.afterPurchase();
      updateBudget();
      applyFilters();
    }

    /** Remove/unlearn a BT from the character (sheet mode) */
    function doRemove(bt) {
      var cost = parseInt(bt.cost) || 0;
      var multiTake = isMultiTakeBt(bt);

      cfg.onRemove(bt, cost, function () {
        if (multiTake) {
          // Remove only ONE instance
          var bts = character.breakthroughs || [];
          for (var i = 0; i < bts.length; i++) {
            if (bts[i].breakthroughId === bt.breakthroughId) {
              bts.splice(i, 1);
              break;
            }
          }
        } else {
          character.breakthroughs = (character.breakthroughs || []).filter(function (b) {
            return b.breakthroughId !== bt.breakthroughId;
          });
        }
        cfg.characterModule.save(character);
        cfg.afterPurchase();
        closeDetail();
        updateBudget();
        applyFilters();
      });
    }

    /* ─── Creation mode: toggle selection ──────────────────────────── */
    function toggleBreakthrough(bt) {
      var btId = bt.breakthroughId;
      var cost = parseInt(bt.cost) || 0;

      // Prevent toggling locked (hybrid race) breakthroughs
      if (btLockedIds.has(btId)) {
        say("This breakthrough is locked — it comes from your hybrid race choice. To change it, go back and pick a different race.");
        return;
      }

      // Requirement check
      var reqCheck = checkRequirement(bt);
      if (!reqCheck.met && !btOverrideMode) {
        say("Requirement not met: " + reqCheck.reason);
        return;
      }

      // Elemental Affinity: special handling
      if (btId === ELEMENTAL_AFFINITY_ID) {
        openElementalAffinityPicker(bt);
        return;
      }

      if (btSelected.has(btId)) {
        btSelected.delete(btId);
      } else {
        var currentSpent = getSpentExp();
        if (!btOverrideMode && currentSpent + cost > cfg.budget) {
          var budgetVal = $("budget-value");
          if (budgetVal) {
            budgetVal.classList.add("over-budget");
            setTimeout(function () { budgetVal.classList.remove("over-budget"); }, 800);
          }
          say("That would put you over budget! You only have " + (cfg.budget - currentSpent) + " EXP left.");
          return;
        }
        btSelected.add(btId);
      }

      // Update card visual
      updateCardSelectedState(btId);

      updateBudget();
      updateCart();
      syncToCharacter();
    }

    /** Update a card's .selected class based on btSelected state */
    function updateCardSelectedState(btId) {
      if (!gridEl) return;
      var card = gridEl.querySelector('.bt-card[data-bt-id="' + btId + '"]');
      if (card) {
        card.classList.toggle("selected", isIdSelected(btId));
      }
    }

    /* ─── Elemental Affinity Picker ───────────────────────────────── */
    function openElementalAffinityPicker(bt) {
      // Remove any existing picker
      var existingPicker = document.getElementById(cfg.idPrefix + "-elemental-picker-overlay");
      if (existingPicker) existingPicker.remove();

      // Find which elements are already chosen
      var chosenElements = [];
      btSelected.forEach(function (id) {
        if (id.indexOf(ELEMENTAL_AFFINITY_ID + "::") === 0) {
          chosenElements.push(id.split("::")[1]);
        }
      });

      var overlay = document.createElement("div");
      overlay.id = cfg.idPrefix + "-elemental-picker-overlay";
      overlay.className = "elemental-picker-overlay";

      var modal = document.createElement("div");
      modal.className = "elemental-picker-modal";

      var gridHTML = "";
      for (var ei = 0; ei < ELEMENTAL_CHOICES.length; ei++) {
        var el = ELEMENTAL_CHOICES[ei];
        var elLower = el.toLowerCase();
        var alreadyPicked = chosenElements.indexOf(elLower) !== -1;
        gridHTML +=
          '<button class="elemental-picker-btn ' + (alreadyPicked ? "picked" : "") + '" data-element="' + elLower + '">' +
            '<span class="elemental-picker-icon">' + getElementIcon(elLower) + '</span>' +
            '<span class="elemental-picker-label">' + el + '</span>' +
            (alreadyPicked ? '<span class="elemental-picker-check">✓</span>' : '') +
          '</button>';
      }

      var currentText = "";
      if (chosenElements.length > 0) {
        var labels = chosenElements.map(function (e) { return e.charAt(0).toUpperCase() + e.slice(1); });
        currentText = '<div class="elemental-picker-current">Currently mastered: ' + labels.join(", ") + '</div>';
      }

      modal.innerHTML =
        '<div class="elemental-picker-header">' +
          '<h3>Choose an Element</h3>' +
          '<button class="elemental-picker-close">✕</button>' +
        '</div>' +
        '<p class="elemental-picker-desc">Select an element to gain Elemental Mastery in.</p>' +
        '<div class="elemental-picker-grid">' + gridHTML + '</div>' +
        currentText;

      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      createdBodyEls.push(overlay);

      // Animate in
      requestAnimationFrame(function () { overlay.classList.add("open"); });

      // Close handlers
      var closePicker = function () {
        overlay.classList.remove("open");
        setTimeout(function () {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          var idx = createdBodyEls.indexOf(overlay);
          if (idx !== -1) createdBodyEls.splice(idx, 1);
        }, 200);
      };

      overlay.addEventListener("click", function (e) { if (e.target === overlay) closePicker(); });
      modal.querySelector(".elemental-picker-close").addEventListener("click", closePicker);

      // Element button handlers
      var btns = modal.querySelectorAll(".elemental-picker-btn");
      for (var bi = 0; bi < btns.length; bi++) {
        (function (btn) {
          btn.addEventListener("click", function () {
            var element = btn.dataset.element;
            var suffixedId = ELEMENTAL_AFFINITY_ID + "::" + element;

            if (btSelected.has(suffixedId)) {
              // Remove this element
              btSelected.delete(suffixedId);
              var hasAny = false;
              btSelected.forEach(function (sid) {
                if (sid.indexOf(ELEMENTAL_AFFINITY_ID + "::") === 0) hasAny = true;
              });
              if (gridEl) {
                var elCard = gridEl.querySelector('.bt-card[data-bt-id="' + ELEMENTAL_AFFINITY_ID + '"]');
                if (elCard && !hasAny) elCard.classList.remove("selected");
              }
              updateBudget();
              updateCart();
              syncToCharacter();
            } else {
              addElementalAffinity(bt, element);
            }
            closePicker();
          });
        })(btns[bi]);
      }
    }

    function addElementalAffinity(bt, element) {
      var cost = parseInt(bt.cost) || 0;
      var suffixedId = ELEMENTAL_AFFINITY_ID + "::" + element;

      // Budget check
      var currentSpent = getSpentExp();
      if (!btOverrideMode && currentSpent + cost > cfg.budget) {
        var budgetVal = $("budget-value");
        if (budgetVal) {
          budgetVal.classList.add("over-budget");
          setTimeout(function () { budgetVal.classList.remove("over-budget"); }, 800);
        }
        say("That would put you over budget! You only have " + (cfg.budget - currentSpent) + " EXP left.");
        return;
      }

      btSelected.add(suffixedId);

      // Mark the card as selected
      if (gridEl) {
        var card = gridEl.querySelector('.bt-card[data-bt-id="' + ELEMENTAL_AFFINITY_ID + '"]');
        if (card) card.classList.add("selected");
      }

      updateBudget();
      updateCart();
      syncToCharacter();
    }

    /* ─── Budget & Cart Updates ────────────────────────────────────── */
    function updateBudget() {
      var valEl = $("budget-value");
      if (!valEl) return;

      if (isCreation) {
        var spent = getSpentExp();
        var remaining = cfg.budget - spent;
        var pct = Math.max(0, Math.min(100, (remaining / cfg.budget) * 100));
        var fillEl = $("budget-fill");

        if (fillEl) {
          fillEl.style.width = btOverrideMode ? "100%" : pct + "%";
        }
        valEl.textContent = btOverrideMode ? "∞" : remaining + " / " + cfg.budget;
        valEl.classList.toggle("over-budget", !btOverrideMode && remaining < 0);
      } else {
        var unspent = getBudget();
        valEl.textContent = btOverrideMode ? "∞" : unspent;
        valEl.classList.toggle("over-budget", !btOverrideMode && unspent < 0);
      }
    }

    function updateCart() {
      if (!cfg.showCart) return;

      // In creation mode, use existing DOM elements by prefix ID
      var itemsEl = document.getElementById(cfg.idPrefix + "-cart-items");
      var countEl = document.getElementById(cfg.idPrefix + "-cart-count");
      var totalEl = document.getElementById(cfg.idPrefix + "-cart-total-cost");
      if (!itemsEl) return;

      var count = btSelected.size;
      countEl.textContent = count;
      totalEl.textContent = getSpentExp() + " EXP";

      if (count === 0) {
        itemsEl.innerHTML = '<div class="bt-cart-empty">No breakthroughs selected</div>';
        return;
      }

      itemsEl.innerHTML = "";
      btSelected.forEach(function (id) {
        var bt = resolveBtBase(id);
        if (!bt) return;
        var cost = parseInt(bt.cost) || 0;

        // Display name: "Elemental Affinity: Fire" for suffixed IDs
        var displayName = bt.name;
        if (id.indexOf("::") !== -1) {
          var element = id.split("::")[1];
          displayName = bt.name + ": " + element.charAt(0).toUpperCase() + element.slice(1);
        }

        var isLockedItem = btLockedIds.has(id);
        var item = document.createElement("div");
        item.className = "bt-cart-item";
        item.innerHTML =
          '<span class="bt-cart-item-name" title="' + displayName + '">' + displayName + '</span>' +
          '<span class="bt-cart-item-cost">' + (isLockedItem ? '🔒 RACE' : (cost === 0 ? "FREE" : cost)) + '</span>' +
          (!isLockedItem
            ? '<button class="bt-cart-item-remove" title="Remove">✕</button>'
            : '<span class="bt-cart-locked-badge">Locked</span>');

        if (!isLockedItem) {
          var removeBtn = item.querySelector(".bt-cart-item-remove");
          if (removeBtn) {
            (function (capturedId) {
              removeBtn.addEventListener("click", function (e) {
                e.stopPropagation();
                btSelected.delete(capturedId);
                // If elemental, check if any remain
                if (capturedId.indexOf(ELEMENTAL_AFFINITY_ID + "::") === 0) {
                  var hasAny = false;
                  btSelected.forEach(function (sid) {
                    if (sid.indexOf(ELEMENTAL_AFFINITY_ID + "::") === 0) hasAny = true;
                  });
                  if (gridEl) {
                    var elCard = gridEl.querySelector('.bt-card[data-bt-id="' + ELEMENTAL_AFFINITY_ID + '"]');
                    if (elCard && !hasAny) elCard.classList.remove("selected");
                  }
                } else {
                  if (gridEl) {
                    var card = gridEl.querySelector('.bt-card[data-bt-id="' + capturedId + '"]');
                    if (card) card.classList.remove("selected");
                  }
                }
                updateBudget();
                updateCart();
                syncToCharacter();
              });
            })(id);
          }
        }
        itemsEl.appendChild(item);
      });
    }

    /* ─── Sync to character ────────────────────────────────────────── */
    function syncToCharacter() {
      if (!isCreation) return; // sheet mode handles sync via onPurchase/onRemove

      character.breakthroughs = [];
      btSelected.forEach(function (id) {
        var bt = resolveBtBase(id);
        if (bt) {
          var name = bt.name;
          if (id.indexOf("::") !== -1) {
            var element = id.split("::")[1];
            name = bt.name + ": " + element.charAt(0).toUpperCase() + element.slice(1);
          }
          character.breakthroughs.push({
            breakthroughId: id, // keep suffixed ID for uniqueness
            name: name,
            cost: parseInt(bt.cost) || 0,
            requirements: bt.requirements || "",
            description: cfg.stripHtml(bt.description || ""),
            abilityId: bt.ability || null,
            fromCreation: true,
          });
        }
      });
      cfg.characterModule.save(character);
      cfg.onSync(btSelected);
    }

    /* ─── Detail Modal — Creation Mode ─────────────────────────────── */
    function bindCreationDetailModal(p) {
      if (!detailOverlay) return;

      detailOverlay.addEventListener("click", function (e) {
        if (e.target === detailOverlay) closeDetail();
      });

      var closeBtn = document.getElementById(p + "-detail-close");
      if (closeBtn) {
        closeBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          closeDetail();
        });
      }

      var toggleBtn = document.getElementById(p + "-detail-toggle-btn");
      if (toggleBtn) {
        toggleBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          if (btDetailBt) {
            toggleBreakthrough(btDetailBt);
            updateCreationDetailBtn();
          }
        });
      }

      escHandler = function (e) {
        if (e.key === "Escape") closeDetail();
      };
      document.addEventListener("keydown", escHandler);
    }

    function openCreationDetail(bt) {
      var p = cfg.idPrefix;
      var cost = parseInt(bt.cost) || 0;
      var req = bt.requirements && bt.requirements !== "-" ? bt.requirements : "";

      var nameEl = document.getElementById(p + "-detail-name");
      if (nameEl) nameEl.textContent = bt.name;

      var costEl = document.getElementById(p + "-detail-cost");
      if (costEl) {
        costEl.textContent = cost === 0 ? "FREE" : cost + " EXP";
        costEl.className = cost === 0 ? "bt-detail-cost free" : "bt-detail-cost";
      }

      var reqEl = document.getElementById(p + "-detail-req");
      if (reqEl) reqEl.textContent = req ? "⚠ " + req : "";

      var descEl = document.getElementById(p + "-detail-desc");
      if (descEl) descEl.innerHTML = bt.description || "";

      updateCreationDetailBtn();
      detailOverlay.classList.add("open");
    }

    function updateCreationDetailBtn() {
      if (!btDetailBt) return;
      var p = cfg.idPrefix;
      var btn = document.getElementById(p + "-detail-toggle-btn");
      if (!btn) return;
      var selected = isIdSelected(btDetailBt.breakthroughId);
      btn.textContent = selected ? "Remove" : "Select";
      btn.classList.toggle("is-selected", selected);
    }

    /* ─── Detail Modal — Sheet Mode ────────────────────────────────── */
    function bindSheetDetailModal(p) {
      if (!detailOverlay) return;

      detailOverlay.addEventListener("click", function (e) {
        if (e.target === detailOverlay) closeDetail();
      });

      $("detail-close").addEventListener("click", function (e) {
        e.stopPropagation();
        closeDetail();
      });

      escHandler = function (e) {
        if (e.key === "Escape") closeDetail();
      };
      document.addEventListener("keydown", escHandler);
    }

    function openSheetDetail(bt) {
      var p = cfg.idPrefix;
      var ownCount = getOwnedCount(bt.breakthroughId);
      var cost = parseInt(bt.cost) || 0;
      var multiTake = isMultiTakeBt(bt);
      var choiceCfg = MULTI_TAKE_CHOICES[bt.name] || null;
      var reqCheck = checkRequirement(bt);
      var isOwned = ownCount > 0;
      var isLocked = !reqCheck.met && !btOverrideMode && !isOwned;
      var fullDesc = bt.description || "No description.";
      var reqText = bt.requirements ? cfg.stripHtml(bt.requirements) : "None";

      // Escalating cost
      if (choiceCfg && choiceCfg.escalatingCost && ownCount > 0) {
        cost = Math.min(
          choiceCfg.escalatingCost.base + (ownCount * choiceCfg.escalatingCost.increment),
          choiceCfg.escalatingCost.max
        );
      }

      $("detail-name").textContent = bt.name;
      $("detail-req").textContent = reqText;

      var lockReasonEl = $("detail-lock-reason");
      if (isLocked) {
        lockReasonEl.textContent = "⚠ " + reqCheck.reason;
        lockReasonEl.style.display = "block";
      } else {
        lockReasonEl.style.display = "none";
      }

      $("detail-desc").innerHTML = fullDesc;

      // Multi-take info
      var multiInfoEl = $("detail-multi-info");
      if (multiTake) {
        multiInfoEl.style.display = "block";
        $("detail-own-count").textContent = isOwned ? "Owned ×" + ownCount : "";

        // Choice picker
        var choiceArea = $("detail-choice-area");
        choiceArea.innerHTML = "";

        if (choiceCfg) {
          if (choiceCfg.type === "buttons") {
            var choiceBtnsHTML = '<div class="bt-choice-label">' + choiceCfg.label + '</div><div class="bt-choice-btns">';
            for (var oi = 0; oi < choiceCfg.options.length; oi++) {
              choiceBtnsHTML += '<button class="bt-choice-btn" data-choice="' + choiceCfg.options[oi] + '">' + choiceCfg.options[oi] + '</button>';
            }
            choiceBtnsHTML += '</div>';
            choiceArea.innerHTML = choiceBtnsHTML;

            var choiceBtns = choiceArea.querySelectorAll(".bt-choice-btn");
            for (var ci = 0; ci < choiceBtns.length; ci++) {
              (function (btn) {
                btn.addEventListener("click", function () {
                  var allBtns = choiceArea.querySelectorAll(".bt-choice-btn");
                  for (var j = 0; j < allBtns.length; j++) {
                    allBtns[j].classList.remove("selected");
                  }
                  btn.classList.add("selected");
                });
              })(choiceBtns[ci]);
            }
          } else if (choiceCfg.type === "text") {
            choiceArea.innerHTML =
              '<div class="bt-choice-label">' + choiceCfg.label + '</div>' +
              '<input type="text" class="bt-choice-input" id="' + p + '-detail-choice-input" placeholder="' + (choiceCfg.placeholder || '') + '">';
          } else {
            choiceArea.innerHTML = '<div class="bt-choice-label" style="opacity:0.6;font-style:italic">' + choiceCfg.label + '</div>';
          }
        }
      } else {
        multiInfoEl.style.display = "none";
      }

      // Footer buttons
      var footerEl = $("detail-footer");
      footerEl.innerHTML = '<span class="bt-detail-cost">' + cost + ' EXP</span>';

      if (isOwned && !multiTake) {
        footerEl.innerHTML +=
          '<span class="bt-detail-owned">✔ Owned</span>' +
          '<button class="bt-detail-remove-btn" id="' + p + '-detail-remove">− Unlearn</button>';
      } else if (isOwned && multiTake) {
        footerEl.innerHTML +=
          '<span class="bt-detail-owned">✔ Owned ×' + ownCount + '</span>' +
          '<button class="bt-detail-remove-btn" id="' + p + '-detail-remove">− Unlearn</button>' +
          '<button class="bt-detail-purchase-btn" id="' + p + '-detail-purchase">✦ Purchase Again</button>';
      } else if (!isLocked) {
        footerEl.innerHTML += '<button class="bt-detail-purchase-btn" id="' + p + '-detail-purchase">✦ Purchase</button>';
      } else {
        footerEl.innerHTML += '<span class="bt-detail-locked">🔒 Locked</span>';
      }

      // Wire up purchase button
      var purchaseBtn = document.getElementById(p + "-detail-purchase");
      if (purchaseBtn) {
        purchaseBtn.addEventListener("click", function () {
          var currentBudget = getBudget();
          if (!btOverrideMode && cost > currentBudget) {
            say("Not enough EXP! You need " + cost + " EXP but only have " + currentBudget + " unspent.");
            return;
          }

          // Gather choice value
          var choiceInput = document.getElementById(p + "-detail-choice-input");
          var selectedChoiceBtn = $("detail-choice-area") ? $("detail-choice-area").querySelector(".bt-choice-btn.selected") : null;
          var choiceVal = "";
          if (choiceInput) {
            choiceVal = choiceInput.value.trim();
          } else if (selectedChoiceBtn) {
            choiceVal = selectedChoiceBtn.dataset.choice || "";
          }

          cfg.onPurchase(bt, cost, function () {
            doPurchase(bt, cost, choiceVal || null);
            closeDetail();
          });
        });
      }

      // Wire up remove button
      var removeBtn = document.getElementById(p + "-detail-remove");
      if (removeBtn) {
        removeBtn.addEventListener("click", function () {
          doRemove(bt);
        });
      }

      // Show overlay
      detailOverlay.style.display = "";
      void detailOverlay.offsetWidth; // force reflow
      detailOverlay.classList.add("open");
      detailOverlay.classList.add("active");
    }

    /* ── Shared detail helpers ───────────────────────────────────────── */
    function openDetail(bt) {
      btDetailBt = bt;
      if (isCreation) {
        openCreationDetail(bt);
      } else {
        openSheetDetail(bt);
      }
    }

    function closeDetail() {
      btDetailBt = null;
      if (detailOverlay) {
        detailOverlay.classList.remove("open");
        detailOverlay.classList.remove("active");
        detailOverlay.style.display = "none";
      }
    }


    /* ═══════════════════════════════════════════════════════════════════
       Controller object — returned by create()
       ═══════════════════════════════════════════════════════════════════ */
    return {
      /**
       * Load breakthrough data from the API and render the browser.
       * Call once after creating the instance.
       */
      init: async function () {
        console.log("[BtBrowser] init started, mode:", cfg.mode);
        try {
          buildDOM();
        } catch (domErr) {
          console.error("[BtBrowser] buildDOM FAILED:", domErr);
          if (cfg.containerEl) cfg.containerEl.innerHTML = '<div style="color:red;padding:20px;">BT Browser error: ' + domErr.message + '</div>';
          return;
        }
        console.log("[BtBrowser] buildDOM complete, gridEl:", !!gridEl);

        if (allBreakthroughs.length === 0) {
          if (gridEl) gridEl.innerHTML = '<div class="bt-empty-state">Loading breakthroughs...</div>';
          try {
            console.log("[BtBrowser] fetching breakthroughs...");
            allBreakthroughs = await cfg.apiClient.getBreakthroughs();
            console.log("[BtBrowser] fetched", allBreakthroughs.length, "breakthroughs");
            allBreakthroughs.sort(function (a, b) {
              return (parseInt(a.cost) || 0) - (parseInt(b.cost) || 0) || (a.name || "").localeCompare(b.name || "");
            });
          } catch (err) {
            if (gridEl) gridEl.innerHTML = '<div class="bt-empty-state">Failed to load breakthroughs.</div>';
            console.error("BT load error:", err);
            return;
          }
        } else {
          console.log("[BtBrowser] already have", allBreakthroughs.length, "breakthroughs (cached)");
        }

        // Restore previous selections (creation mode)
        if (isCreation) {
          if (cfg.initialSelected) {
            btSelected = new Set(cfg.initialSelected);
          } else if (character.breakthroughs && character.breakthroughs.length) {
            btSelected = new Set(character.breakthroughs.map(function (b) { return b.breakthroughId; }));
          }

          // Auto-grant hybrid race breakthrough (locked)
          var hybridId = cfg.hybridBreakthroughId;
          if (!hybridId && character.race && character.race.isHybrid && character.race.hybridBreakthroughId) {
            hybridId = character.race.hybridBreakthroughId;
          }
          if (hybridId) {
            btLockedIds.add(hybridId);
            if (!btSelected.has(hybridId)) {
              btSelected.add(hybridId);
              syncToCharacter();
            }
          }
        }

        // Sort: in sheet mode, owned BTs first
        if (!isCreation) {
          var ownedIds = new Set();
          (character.breakthroughs || []).forEach(function (b) {
            ownedIds.add(b.breakthroughId);
          });
          allBreakthroughs.sort(function (a, b) {
            var aOwned = ownedIds.has(a.breakthroughId) ? 1 : 0;
            var bOwned = ownedIds.has(b.breakthroughId) ? 1 : 0;
            if (aOwned !== bOwned) return bOwned - aOwned;
            return (parseInt(a.cost) || 0) - (parseInt(b.cost) || 0) || (a.name || "").localeCompare(b.name || "");
          });
        }

        console.log("[BtBrowser] rendering cards...");
        renderCards(getFilteredList());
        updateBudget();
        if (cfg.showCart) updateCart();
        console.log("[BtBrowser] init complete");
      },

      /**
       * Remove all generated DOM and cleanup event listeners.
       */
      destroy: function () {
        if (escHandler) {
          document.removeEventListener("keydown", escHandler);
          escHandler = null;
        }
        // Clean up body-appended elements (sheet mode detail overlay, elemental pickers)
        for (var i = 0; i < createdBodyEls.length; i++) {
          if (createdBodyEls[i] && createdBodyEls[i].parentNode) {
            createdBodyEls[i].parentNode.removeChild(createdBodyEls[i]);
          }
        }
        createdBodyEls = [];
        // For creation mode, clear the header extras
        if (cfg.headerExtrasEl) {
          cfg.headerExtrasEl.innerHTML = "";
        }
        // Clear the container
        if (cfg.containerEl) cfg.containerEl.innerHTML = "";
        // Reset state
        btSelected.clear();
        btLockedIds.clear();
        allBreakthroughs = [];
        btDetailBt = null;
        detailOverlay = null;
        gridEl = null;
      },

      /**
       * Re-render with current state.
       */
      refresh: function () {
        applyFilters();
        updateBudget();
        if (cfg.showCart) updateCart();
      },

      /**
       * Return Set of selected BT IDs (creation mode).
       */
      getSelected: function () {
        return new Set(btSelected);
      },

      /**
       * Return total EXP spent (creation mode).
       */
      getSpentExp: function () {
        return getSpentExp();
      },
    };
  }


  /* ═══════════════════════════════════════════════════════════════════════
     Public API
     ═══════════════════════════════════════════════════════════════════════ */
  return {
    create:               create,
    // Expose constants for external use if needed
    BT_MIRANE_BAN_LIST:   BT_MIRANE_BAN_LIST,
    ELEMENTAL_AFFINITY_ID: ELEMENTAL_AFFINITY_ID,
    ELEMENTAL_CHOICES:    ELEMENTAL_CHOICES,
    MULTI_TAKE_CHOICES:   MULTI_TAKE_CHOICES,
  };

})();
