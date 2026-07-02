/**
 * SkillPickerModal — A reusable skill-point allocation modal
 * that mirrors the character builder's skill system exactly.
 *
 * Uses SkillParser for parsing, reuses the same CSS classes as the builder.
 */
window.SkillPickerModal = (function () {
  "use strict";

  var SP = window.SkillParser;
  var SKILL_CAP     = SP.SKILL_CAP;
  var EXPERTISE_CAP = SP.EXPERTISE_CAP;
  var CATEGORIES    = SP.SKILL_CATEGORIES;
  var ALL_SKILLS    = SP.ALL_SKILL_NAMES;
  var ARTISAN_SKILLS = SP.ARTISAN_SKILLS;

  /**
   * Opens the skill allocation modal.
   *
   * @param {Object} opts
   * @param {string}   opts.title       - Modal title (e.g. "Ranger — Skills")
   * @param {string}   opts.skillsText  - Raw text describing skill grants
   * @param {string}   opts.className   - Class name for parsing
   * @param {Object}   opts.character   - Character object (reads skills from it)
   * @param {Function} opts.onConfirm   - Called with the allocations map when confirmed
   * @param {Function} opts.onCancel    - Called when cancelled (optional)
   */
  function open(opts) {
    var title      = opts.title || "Skill Points";
    var skillsText = opts.skillsText || "";
    var className  = opts.className || "Class";
    var character  = opts.character;
    var onConfirm  = opts.onConfirm;
    var onCancel   = opts.onCancel;

    // Parse grants
    var grants = SP.parseClassSkillGrant(skillsText, className);
    if (!grants || grants.length === 0) {
      // Nothing parseable — just confirm immediately
      if (onConfirm) onConfirm({});
      return;
    }

    // Build source from grants
    var source = {
      name: className + " Skills",
      points: 0,
      remaining: 0,
      allowedSkills: [],
      isArtisan: false,
    };
    for (var gi = 0; gi < grants.length; gi++) {
      source.points += grants[gi].points;
      source.remaining += grants[gi].points;
      source.isArtisan = source.isArtisan || grants[gi].isArtisan;
      for (var ai = 0; ai < grants[gi].allowedSkills.length; ai++) {
        if (source.allowedSkills.indexOf(grants[gi].allowedSkills[ai]) === -1) {
          source.allowedSkills.push(grants[gi].allowedSkills[ai]);
        }
      }
    }

    // Build allocations
    var allSkills = ALL_SKILLS.concat(ARTISAN_SKILLS);
    var allocations = {};
    for (var si = 0; si < allSkills.length; si++) {
      allocations[allSkills[si]] = { total: 0, expertise: [] };
    }

    // Existing character skills (for display only)
    var existingSkills = (character && character.skills) ? character.skills : {};

    // Create overlay
    var overlay = document.createElement("div");
    overlay.className = "skill-picker-modal-overlay";
    overlay.id = "skill-picker-modal-overlay";

    var modal = document.createElement("div");
    modal.className = "skill-picker-modal";

    // Header
    var header = document.createElement("div");
    header.className = "skill-picker-modal-header";
    header.innerHTML =
      '<h3 class="skill-picker-modal-title">' + title + '</h3>' +
      '<button class="skill-picker-modal-close">✕</button>';
    modal.appendChild(header);

    // Description
    var desc = document.createElement("div");
    desc.className = "skill-picker-modal-desc";
    desc.innerHTML = skillsText;
    modal.appendChild(desc);

    // Source info
    var sourceBox = document.createElement("div");
    sourceBox.className = "skill-source-box";
    sourceBox.id = "spm-source-box";
    sourceBox.innerHTML =
      '<div class="skill-source-title" id="spm-source-name">' + source.name + '</div>' +
      '<div class="skill-source-subtitle">Remaining: <span class="skill-points-remaining" id="spm-points-remaining">' + source.remaining + '</span></div>';
    modal.appendChild(sourceBox);

    // Skill grid
    var gridWrap = document.createElement("div");
    gridWrap.className = "skill-layout";
    var grid = document.createElement("div");
    grid.className = "skill-grid";
    grid.id = "spm-skill-grid";
    gridWrap.appendChild(grid);
    modal.appendChild(gridWrap);

    // Confirm button
    var confirmWrap = document.createElement("div");
    confirmWrap.style.cssText = "text-align:center;margin-top:14px;";
    var confirmBtn = document.createElement("button");
    confirmBtn.className = "stat-pick-btn skill-pick-confirm";
    confirmBtn.id = "spm-confirm-btn";
    confirmBtn.textContent = "Confirm & Level Up";
    confirmWrap.appendChild(confirmBtn);
    modal.appendChild(confirmWrap);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    requestAnimationFrame(function () { overlay.classList.add("open"); });

    // ── Close handler ──
    function closeModal() {
      overlay.classList.remove("open");
      setTimeout(function () { overlay.remove(); }, 200);
    }

    header.querySelector(".skill-picker-modal-close").addEventListener("click", function () {
      closeModal();
      if (onCancel) onCancel();
    });
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) {
        closeModal();
        if (onCancel) onCancel();
      }
    });

    // ── Render the grid ──
    function renderGrid() {
      grid.innerHTML = "";

      // Render categories
      for (var ci = 0; ci < CATEGORIES.length; ci++) {
        var cat = CATEGORIES[ci];
        var catEl = document.createElement("div");
        catEl.className = "skill-category";

        var catHeader = document.createElement("div");
        catHeader.className = "skill-category-header";
        catHeader.textContent = cat.stat;
        catEl.appendChild(catHeader);

        var row = document.createElement("div");
        row.className = "skill-category-items";
        for (var ski2 = 0; ski2 < cat.skills.length; ski2++) {
          row.appendChild(createSkillButton(cat.skills[ski2], false));
        }
        catEl.appendChild(row);
        grid.appendChild(catEl);
      }

      // Artisan category if needed
      if (source.isArtisan) {
        var artCat = document.createElement("div");
        artCat.className = "skill-category";
        var artHeader2 = document.createElement("div");
        artHeader2.className = "skill-category-header";
        artHeader2.textContent = "Artisan";
        artCat.appendChild(artHeader2);

        var artRow = document.createElement("div");
        artRow.className = "skill-category-items";
        for (var ari = 0; ari < ARTISAN_SKILLS.length; ari++) {
          if (source.allowedSkills.indexOf(ARTISAN_SKILLS[ari]) !== -1) {
            artRow.appendChild(createSkillButton(ARTISAN_SKILLS[ari], true));
          }
        }
        artCat.appendChild(artRow);
        grid.appendChild(artCat);
      }

      updateSourceDisplay();
    }

    function createSkillButton(skillName, isArtisan) {
      var isAllowed = source.allowedSkills.map(function (s) { return s.toLowerCase(); }).indexOf(skillName.toLowerCase()) !== -1;
      var alloc = allocations[skillName] || { total: 0, expertise: [] };
      var existing = existingSkills[skillName] ? (existingSkills[skillName].points || 0) : 0;
      var cap = isArtisan ? SP.ARTISAN_SKILL_CAP : SKILL_CAP;

      var btn = document.createElement("div");
      btn.className = "skill-btn";
      if (!isAllowed) btn.classList.add("disabled");
      if (alloc.total > 0) btn.classList.add("has-points");
      btn.dataset.skill = skillName;

      var displayValue = alloc.total + (existing > 0 ? " (" + (existing + alloc.total) + ")" : "");

      btn.innerHTML =
        '<div class="skill-expertise-arrow" title="Add Expertise">▲</div>' +
        '<button class="skill-minus" ' + (alloc.total === 0 ? "disabled" : "") + '>−</button>' +
        '<div class="skill-center">' +
          '<span class="skill-name">' + skillName + '</span>' +
          '<span class="skill-value">' + alloc.total + '</span>' +
        '</div>' +
        '<button class="skill-plus" ' + (!isAllowed || (existing + alloc.total) >= cap || source.remaining <= 0 ? "disabled" : "") + '>+</button>';

      // Click to expand
      btn.addEventListener("click", function (e) {
        if (e.target.closest(".skill-minus, .skill-plus, .skill-expertise-arrow")) return;
        if (btn.classList.contains("disabled")) return;
        var wasExpanded = btn.classList.contains("expanded");
        overlay.querySelectorAll(".skill-btn.expanded").forEach(function (el) { el.classList.remove("expanded"); });
        if (!wasExpanded) btn.classList.add("expanded");
      });

      // Expertise arrow
      btn.querySelector(".skill-expertise-arrow").addEventListener("click", function (e) {
        e.stopPropagation();
        openExpertisePopup(skillName, isArtisan);
      });

      // Minus
      btn.querySelector(".skill-minus").addEventListener("click", function (e) {
        e.stopPropagation();
        if (alloc.total > 0) {
          alloc.total--;
          source.remaining++;
          refreshButton(skillName);
          updateSourceDisplay();
        }
      });

      // Plus
      btn.querySelector(".skill-plus").addEventListener("click", function (e) {
        e.stopPropagation();
        var existing2 = existingSkills[skillName] ? (existingSkills[skillName].points || 0) : 0;
        if (isAllowed && source.remaining > 0 && (existing2 + alloc.total) < cap) {
          alloc.total++;
          source.remaining--;
          refreshButton(skillName);
          updateSourceDisplay();
        }
      });

      return btn;
    }

    function refreshButton(skillName) {
      var btn = grid.querySelector('.skill-btn[data-skill="' + skillName + '"]');
      if (!btn) return;
      var alloc = allocations[skillName] || { total: 0 };
      var existing = existingSkills[skillName] ? (existingSkills[skillName].points || 0) : 0;
      var isArtisan2 = ARTISAN_SKILLS.indexOf(skillName) !== -1;
      var cap = isArtisan2 ? SP.ARTISAN_SKILL_CAP : SKILL_CAP;
      var isAllowed = source.allowedSkills.map(function (s) { return s.toLowerCase(); }).indexOf(skillName.toLowerCase()) !== -1;

      btn.classList.toggle("has-points", alloc.total > 0);
      btn.querySelector(".skill-value").textContent = alloc.total;
      btn.querySelector(".skill-minus").disabled = alloc.total <= 0;
      btn.querySelector(".skill-plus").disabled = !isAllowed || (existing + alloc.total) >= cap || source.remaining <= 0;
    }

    function updateSourceDisplay() {
      var ptsEl = document.getElementById("spm-points-remaining");
      if (ptsEl) {
        ptsEl.textContent = source.remaining;
        ptsEl.classList.toggle("empty", source.remaining <= 0);
      }
      // Update confirm button — enabled when no points remaining
      confirmBtn.disabled = source.remaining > 0;

      // Also update all + buttons to reflect remaining
      grid.querySelectorAll(".skill-btn").forEach(function (btn) {
        var sn = btn.dataset.skill;
        var alloc = allocations[sn] || { total: 0 };
        var existing = existingSkills[sn] ? (existingSkills[sn].points || 0) : 0;
        var isArt = ARTISAN_SKILLS.indexOf(sn) !== -1;
        var cap = isArt ? SP.ARTISAN_SKILL_CAP : SKILL_CAP;
        var isAllowed = source.allowedSkills.map(function (s) { return s.toLowerCase(); }).indexOf(sn.toLowerCase()) !== -1;
        btn.querySelector(".skill-plus").disabled = !isAllowed || (existing + alloc.total) >= cap || source.remaining <= 0;
      });
    }

    // ── Expertise popup (mirrors builder's exactly) ──
    function openExpertisePopup(skillName, isArtisan) {
      var existingPopup = document.getElementById("spm-expertise-popup-overlay");
      if (existingPopup) existingPopup.remove();

      var alloc = allocations[skillName];
      var expCap = isArtisan ? SP.ARTISAN_EXPERTISE_CAP : EXPERTISE_CAP;
      var isAllowed = source.allowedSkills.map(function (s) { return s.toLowerCase(); }).indexOf(skillName.toLowerCase()) !== -1;

      var expOverlay = document.createElement("div");
      expOverlay.id = "spm-expertise-popup-overlay";
      expOverlay.className = "expertise-popup-overlay";
      expOverlay.style.zIndex = "10001";

      var popup = document.createElement("div");
      popup.className = "expertise-popup";

      function renderPopupContent() {
        popup.innerHTML =
          '<div class="expertise-popup-header">' +
            '<h3 class="expertise-popup-title">Expertise: ' + skillName + '</h3>' +
            '<button class="expertise-popup-close">✕</button>' +
          '</div>' +
          '<p class="expertise-popup-desc">Each skill point spent on expertise grants <strong>2 expertise points</strong>.</p>' +
          '<div class="expertise-entries" id="spm-expertise-entries">' +
            (alloc.expertise.length === 0 ? '<div class="expertise-empty">No expertise added yet.</div>' : '') +
            alloc.expertise.map(function (exp, i) {
              return '<div class="expertise-entry" data-idx="' + i + '">' +
                '<span class="expertise-entry-name">' + exp.name + '</span>' +
                '<span class="expertise-entry-pts">' + exp.points + ' pts</span>' +
                '<button class="expertise-minus" data-idx="' + i + '">−</button>' +
                '<button class="expertise-plus" data-idx="' + i + '" ' + (exp.points >= expCap ? 'disabled' : '') + '>+</button>' +
                '<button class="expertise-entry-remove" data-idx="' + i + '" title="Remove">✕</button>' +
              '</div>';
            }).join('') +
          '</div>' +
          '<div class="expertise-add-row">' +
            '<input type="text" class="expertise-name-input" placeholder="New expertise name..." maxlength="60">' +
            '<button class="expertise-add-btn" ' + (!isAllowed || source.remaining <= 0 ? 'disabled' : '') + '>Add (+2 pts)</button>' +
          '</div>' +
          '<div class="expertise-source-info">' +
            'Source: ' + source.name + ' | Remaining: ' + source.remaining + ' pts' +
          '</div>';

        // Close
        popup.querySelector(".expertise-popup-close").addEventListener("click", closePopup);

        // Add
        var addBtn = popup.querySelector(".expertise-add-btn");
        var addInput = popup.querySelector(".expertise-name-input");
        addBtn.addEventListener("click", function () {
          var name = addInput.value.trim();
          if (!name || source.remaining <= 0) return;
          alloc.expertise.push({ name: name, points: 2 });
          source.remaining--;
          renderPopupContent();
          refreshButton(skillName);
          updateSourceDisplay();
        });
        addInput.addEventListener("keydown", function (e) {
          if (e.key === "Enter") addBtn.click();
        });

        // Existing expertise +/-/remove
        popup.querySelectorAll(".expertise-plus").forEach(function (btn) {
          btn.addEventListener("click", function () {
            var idx = parseInt(btn.dataset.idx);
            var exp = alloc.expertise[idx];
            if (!exp || source.remaining <= 0 || exp.points >= expCap) return;
            exp.points += 2;
            source.remaining--;
            renderPopupContent();
            refreshButton(skillName);
            updateSourceDisplay();
          });
        });

        popup.querySelectorAll(".expertise-minus").forEach(function (btn) {
          btn.addEventListener("click", function () {
            var idx = parseInt(btn.dataset.idx);
            var exp = alloc.expertise[idx];
            if (!exp || exp.points <= 0) return;
            exp.points -= 2;
            source.remaining++;
            if (exp.points <= 0) alloc.expertise.splice(idx, 1);
            renderPopupContent();
            refreshButton(skillName);
            updateSourceDisplay();
          });
        });

        popup.querySelectorAll(".expertise-entry-remove").forEach(function (btn) {
          btn.addEventListener("click", function () {
            var idx = parseInt(btn.dataset.idx);
            var exp = alloc.expertise[idx];
            if (!exp) return;
            var refundPoints = exp.points / 2;
            source.remaining += refundPoints;
            alloc.expertise.splice(idx, 1);
            renderPopupContent();
            refreshButton(skillName);
            updateSourceDisplay();
          });
        });
      }

      expOverlay.appendChild(popup);
      document.body.appendChild(expOverlay);
      requestAnimationFrame(function () { expOverlay.classList.add("open"); });

      function closePopup() {
        expOverlay.classList.remove("open");
        setTimeout(function () { expOverlay.remove(); }, 200);
      }
      expOverlay.addEventListener("click", function (e) {
        if (e.target === expOverlay) closePopup();
      });

      renderPopupContent();
    }

    // ── Confirm ──
    confirmBtn.addEventListener("click", function () {
      // Build the result map: only skills/expertise with allocations
      var result = {};
      for (var sn in allocations) {
        var a = allocations[sn];
        if (a.total > 0 || a.expertise.length > 0) {
          result[sn] = {
            points: a.total,
            expertise: a.expertise.map(function (e) { return { name: e.name, points: e.points }; }),
          };
        }
      }
      closeModal();
      if (onConfirm) onConfirm(result);
    });

    // Collapse expanded skills on click outside
    document.addEventListener("click", function collapseHandler(e) {
      if (!overlay.parentNode) {
        document.removeEventListener("click", collapseHandler);
        return;
      }
      if (!e.target.closest(".skill-btn")) {
        overlay.querySelectorAll(".skill-btn.expanded").forEach(function (el) { el.classList.remove("expanded"); });
      }
    });

    renderGrid();
  }

  return { open: open };
})();
