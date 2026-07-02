/* ═══════════════════════════════════════════════════════════════════════════
   RequirementChecker  —  shared requirement-checking logic
   ═══════════════════════════════════════════════════════════════════════════
   Consolidates:
     • checkClassRequirement()   from class-browser.js
     • checkBtRequirement()      from sheet.js
   into a single, stateless module.  Every function receives the data it
   needs via explicit parameters — no module-internal mutable state.

   Usage:
     var result = RequirementChecker.checkClass(cls, character, selectedClasses);
     var result = RequirementChecker.checkBreakthrough(bt, character);
   ═══════════════════════════════════════════════════════════════════════════ */
window.RequirementChecker = (function () {
  "use strict";

  /* ─── Constants ────────────────────────────────────────────────────────── */

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

  /** Classes banned under Mirane Expedition rules */
  var MIRANE_BAN_LIST = [
    "angelblooded", "shinigami-eyes", "vampire", "vampire-lord", "true-shinigami-eyes",
  ];

  /** Element identifiers recognised by the mastery check */
  var ELEMENT_NAMES = [
    "fire", "water", "wind", "earth", "lightning", "ice", "frost", "dark", "holy",
  ];

  /* ─── Helpers ──────────────────────────────────────────────────────────── */

  /** Normalise "frost" → "ice" */
  var normalizeElement = function (s) {
    return s.replace("frost", "ice");
  };

  /* ─── Class Requirement Checker ────────────────────────────────────────
     Ported from class-browser.js  checkClassRequirement()
     ────────────────────────────────────────────────────────────────────── */

  /**
   * Evaluate whether a character satisfies a class's requirement string.
   *
   * @param {Object} cls             — class data object (must have .requirements)
   * @param {Object} character       — character state (race, breakthroughs, …)
   * @param {Map}    selectedClasses — Map  classId → { data, levels }
   * @returns {{ met: boolean, reason: string }}
   */
  function checkClass(cls, character, selectedClasses) {
    var req = (cls.requirements || "").trim();
    if (!req || req === "None" || req === "None.") return { met: true, reason: "" };

    var reqLower = req.toLowerCase();
    var results  = []; // collect all sub-checks; ALL must pass

    // ─── Race gate ──────────────────────────────────────────────────────
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

    // ─── Breakthrough gate ──────────────────────────────────────────────
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

    // ─── "Touched by Death" special ─────────────────────────────────────
    if (reqLower.includes("touched by death")) {
      var hasTBD = character.breakthroughs?.some(function (b) {
        return (b.name || "").toLowerCase().includes("touched by death") ||
               (b.breakthroughId || "") === "touched-by-death";
      });
      if (!hasTBD) {
        return { met: false, reason: 'Requires the "Touched by Death" breakthrough.' };
      }
    }

    // ─── Spell gate ─────────────────────────────────────────────────────
    if (reqLower.includes("at least 1 spell") || reqLower.includes("at least one spell") || reqLower.includes("possess at least 1 spell")) {
      var hasSpellClass = Array.from(selectedClasses.keys()).some(function (id) { return SPELL_GRANTING_CLASSES.has(id); });
      if (!hasSpellClass) {
        results.push({ met: false, reason: "Requires at least 1 spell (unlock a caster class like Mage, Sorcerer, or Acolyte)." });
      }
    }

    // ─── Elemental mastery check ────────────────────────────────────────
    var elementRegex     = /(?:^|or\s+)(?:have\s+)?(\w+)(?:\s+element)?\s+(?:mastery|mastered)/gi;
    var elementMatch;
    var hasElementalReq    = false;
    var elementalSatisfied = false;

    while ((elementMatch = elementRegex.exec(reqLower)) !== null) {
      var rawElement = elementMatch[1].trim();
      if (ELEMENT_NAMES.indexOf(rawElement) === -1) continue;
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

      // ─── "Two classes mastered" ─────────────────────────────────────
      if (reqLower.includes("two classes mastered")) {
        var masteredCount = Array.from(selectedClasses.values()).filter(function (s) { return s.levels >= 8; }).length;
        if (masteredCount < 2) {
          results.push({ met: false, reason: "Requires two classes mastered." });
        }
      }

      // ─── "{ClassName} mastered" or "{ClassA} or {ClassB} mastered" ──
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
            return skip.indexOf(n) === -1;
          });

        specificClassMet = classNames.some(function (cn) {
          return Array.from(selectedClasses.values()).some(function (s) {
            return s.data.name.toLowerCase() === cn && s.levels >= 8;
          });
        });
      }

      // Check "any class mastered"
      var anyClassMet = false;
      if (hasAnyClassReq) {
        anyClassMet = Array.from(selectedClasses.values()).some(function (s) { return s.levels >= 8; });
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

    // ─── "learned" requirements (soft pass — can't fully validate) ─────
    // e.g. "Arcane Barrier learned"

    // ─── Return combined result ─────────────────────────────────────────
    var failed = results.filter(function (r) { return !r.met; });
    if (failed.length > 0) {
      return { met: false, reason: failed.map(function (f) { return f.reason; }).join(" ") };
    }
    return { met: true, reason: "" };
  }

  /* ─── Breakthrough Requirement Checker ─────────────────────────────────
     Ported from sheet.js  checkBtRequirement()
     ────────────────────────────────────────────────────────────────────── */

  /**
   * Evaluate whether a character satisfies a breakthrough's requirement string.
   *
   * @param {Object} bt        — breakthrough data object (must have .requirements)
   * @param {Object} character — character state (race, breakthroughs, classes, …)
   * @returns {{ met: boolean, reason: string }}
   */
  function checkBreakthrough(bt, character) {
    var req = (bt.requirements || "").replace(/<[^>]+>/g, "").trim();
    if (!req || req === "-" || req.toLowerCase() === "none") return { met: true, reason: "" };

    var lower = req.toLowerCase();
    var reasons = [];

    // "character creation" check — always fails on the sheet (post-creation)
    if (lower.includes("character creation") || lower.includes("taken at character creation")) {
      var alreadyOwned = character.breakthroughs?.some(function (b) {
        return b.breakthroughId === bt.breakthroughId;
      });
      if (!alreadyOwned) {
        reasons.push("Can only be taken at character creation");
      }
    }

    // Race checks: "Must be a [race]"
    var raceMatch = lower.match(/must be (?:a |an )?(\w[\w\s'-]*?)(?:\.|,| and | or |$)/i);
    if (raceMatch) {
      var reqRace = raceMatch[1].trim();
      var charRaces = [
        character.race?.primaryRaceName,
        character.race?.ancestryName,
        character.race?.demonHouseName,
      ].filter(Boolean).map(function (r) { return r.toLowerCase(); });

      // Multi-race check: "Must be a Nio, Bullfolk or Bearfolk"
      var raceOptions = reqRace.split(/,\s*|\s+or\s+/i).map(function (r) { return r.trim().toLowerCase(); });
      var PRIMARY_RACES = ["human", "fae", "demon", "chimera", "youkai"];
      var raceMatched = raceOptions.some(function (opt) {
        var words = opt.split(/\s+/).filter(function (w) { return w.length > 0; });
        if (words.length > 1) {
          // Compound match: "sylph fae" → strip primary race name, check only the subrace part
          var subraceWords = words.filter(function (w) {
            return PRIMARY_RACES.indexOf(w) === -1;
          });
          if (subraceWords.length > 0) {
            return subraceWords.every(function (word) {
              return charRaces.some(function (cr) { return cr.indexOf(word) !== -1; });
            });
          }
          return false;
        }
        // Single-word: simple match
        return charRaces.some(function (cr) {
          return cr.indexOf(opt) !== -1 || opt.indexOf(cr) !== -1;
        });
      });
      if (!raceMatched && lower.indexOf("gm approval") === -1) {
        reasons.push("Requires race: " + reqRace);
      }
    }

    // Breakthrough prereq: "Must have [breakthrough name]" or "Must have the [name] breakthrough"
    var btPrereqPatterns = [
      /must have (?:the )?["']?([^"'.]+?)["']?\s*(?:breakthrough|$)/gi,
      /must have (?:purchased |the )?([^.]+?)(?:\.|$)/gi,
    ];
    for (var pi = 0; pi < btPrereqPatterns.length; pi++) {
      var pattern = btPrereqPatterns[pi];
      var m;
      while ((m = pattern.exec(lower)) !== null) {
        var prereqName = m[1].trim();
        // Skip non-breakthrough prereqs
        if (prereqName.indexOf("proficien") !== -1 ||
            prereqName.indexOf("armor") !== -1 ||
            prereqName.indexOf("skill") !== -1 ||
            prereqName.indexOf("flight") !== -1 ||
            prereqName.indexOf("used") !== -1 ||
            prereqName.indexOf("visited") !== -1 ||
            prereqName.indexOf("believer") !== -1) continue;
        var hasIt = character.breakthroughs?.some(function (b) {
          return (b.name || "").toLowerCase().indexOf(prereqName) !== -1;
        });
        if (!hasIt) {
          reasons.push("Requires: " + prereqName);
        }
      }
    }

    // Class mastery: "[class] mastered"
    var classMatch = lower.match(/(\w[\w\s'-]*?)\s+mastered/i);
    if (classMatch) {
      var reqClass = classMatch[1].trim();
      var hasMastered = character.classes?.some(function (c) {
        return (c.name || "").toLowerCase().indexOf(reqClass) !== -1 && c.mastered;
      });
      if (!hasMastered) {
        reasons.push("Requires " + reqClass + " mastered");
      }
    }

    // GM Approval
    if (lower.indexOf("gm approval") !== -1 || lower.indexOf("requires gm") !== -1) {
      reasons.push("Requires GM Approval");
    }

    // Proficiency checks — can't reliably check; allow with warning

    if (reasons.length === 0) return { met: true, reason: "" };
    // Deduplicate
    var seen = {};
    var unique = [];
    for (var i = 0; i < reasons.length; i++) {
      if (!seen[reasons[i]]) {
        seen[reasons[i]] = true;
        unique.push(reasons[i]);
      }
    }
    return { met: false, reason: unique.join("; ") };
  }

  /* ─── Public API ───────────────────────────────────────────────────────── */

  return {
    checkClass:             checkClass,
    checkBreakthrough:      checkBreakthrough,
    SPELL_GRANTING_CLASSES: SPELL_GRANTING_CLASSES,
    MIRANE_BAN_LIST:        MIRANE_BAN_LIST,
  };
})();
