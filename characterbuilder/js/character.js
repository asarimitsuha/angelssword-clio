/* ══════════════════════════════════════════════════════════════════════
   Character Model — Data structure and derived stat calculations
   ══════════════════════════════════════════════════════════════════════ */

const Character = (() => {
  "use strict";

  /* ─── Default state ───────────────────────────────────────────────── */
  function createDefault() {
    return {
      name: "",

      /* Wizard progress — lets us resume if they close the page */
      completedStep: 0, // 0=nothing, 1=race, 2=subrace/bonus, 3=mainStats, 4=subStats, 5=confirmed

      /* Step 1: Race & Ancestry */
      race: {
        primaryRaceId: null,
        primaryRaceName: null,
        attributes: null,       // e.g. "You gain +1 in Power and +1 in Reason."
        proficiencies: null,    // e.g. "You can speak, read, write Common and Sorthen."
        imageUrl: null,
        ancestryId: null,
        ancestryName: null,
        ancestryDescription: null,
        ancestryTrait: null,    // trait1 UUID for future lookup
        ancestryImageUrl: null,
        elementalMastery: null,     // e.g. "fire", "water", "wind", etc.
        demonHouseId: null,         // e.g. "wi"
        demonHouseName: null,       // e.g. "Wi"
        demonHouseAbilityId: null,  // e.g. "presence-concealment"
        demonHouseAbilityName: null, // e.g. "Presence Concealment"
      },

      /* Race bonuses (+1/+1 from race selection) */
      raceBonuses: {
        mainStat: null,
        subStat: null,
        mainVal: 0,
        subVal: 0,
      },

      /* Step 2: Stats */
      mainStats: { power: 0, focus: 0, agility: 0, toughness: 0 },
      subStats: { fitness: 0, cunning: 0, reason: 0, awareness: 0, presence: 0 },

      /* Effective stats (base + race bonus, snapshotted on confirm) */
      effectiveMainStats: null,
      effectiveSubStats: null,

      /* Derived stats (snapshotted on confirm) */
      derivedStats: null,

      /* Step 3 */
      breakthroughs: [],

      /* Step 4 */
      classes: [],

      /* Step 5 */
      skills: {},

      /* Step 6 */
      equipment: [],

      /* Budgets */
      resources: {
        breakthroughExp: 300,
        classExp: 1000,
        interludePoints: 3,
        skillPoints: 10,
        clim: 3000,
      },
    };
  }

  /* ─── Race bonus lookup (fixed for all except Human) ──────────────── */
  const RACE_BONUSES = {
    chimera: { mainStat: "toughness", mainVal: 1, subStat: "awareness", subVal: 1 },
    demon:   { mainStat: "power",     mainVal: 1, subStat: "reason",    subVal: 1 },
    fae:     { mainStat: "agility",   mainVal: 1, subStat: "cunning",   subVal: 1 },
    youkai:  { mainStat: "focus",     mainVal: 1, subStat: "presence",  subVal: 1 },
    human:   null, // Chosen by the player
  };

  /* ─── Get effective stat (base + race bonus) ──────────────────────── */
  function getEffectiveMainStat(char, key) {
    const base = char.mainStats[key] || 0;
    const bonus = (char.raceBonuses.mainStat === key) ? char.raceBonuses.mainVal : 0;
    return base + bonus;
  }

  function getEffectiveSubStat(char, key) {
    const base = char.subStats[key] || 0;
    const bonus = (char.raceBonuses.subStat === key) ? char.raceBonuses.subVal : 0;
    return base + bonus;
  }

  /* ─── Derived stat formulas (using effective stats) ───────────────── */
  function getDerived(char) {
    const power     = getEffectiveMainStat(char, "power");
    const focus     = getEffectiveMainStat(char, "focus");
    const agility   = getEffectiveMainStat(char, "agility");
    const toughness = getEffectiveMainStat(char, "toughness");

    return {
      hp: 20 + toughness * 10,
      mana: 6 + power,
      rp: 2 + agility,
      evasion: 7 + agility,
      potency: 11 + focus,
      guard: toughness, // + equipment later
      initiative: agility,
      savebonus: toughness,
      ap: 4,
      speed: 20,
    };
  }

  /* ─── Apply race bonuses from lookup ──────────────────────────────── */
  function applyRaceBonuses(char, raceId) {
    const bonus = RACE_BONUSES[raceId];
    if (bonus) {
      char.raceBonuses = { ...bonus };
    }
    // Human: leave raceBonuses as-is (set manually by player)
  }

  /** Snapshot effective + derived stats into the character for the final sheet */
  function snapshotStats(char) {
    char.effectiveMainStats = {};
    MAIN_STAT_KEYS.forEach((k) => {
      char.effectiveMainStats[k] = getEffectiveMainStat(char, k);
    });

    char.effectiveSubStats = {};
    SUB_STAT_KEYS.forEach((k) => {
      char.effectiveSubStats[k] = getEffectiveSubStat(char, k);
    });

    char.derivedStats = getDerived(char);
  }

  /* ─── Soul Core (SC) — Total spent EXP ───────────────────────────── */
  /**
   * SC = sum of all EXP spent on classes + non-free breakthroughs.
   * Class cost: tier * 100 (unlock) + (levels - 1) * 100 (subsequent).
   * Character-creation breakthroughs (fromCreation: true) are FREE and don't count.
   * Future breakthroughs purchased with real EXP DO count.
   */
  function calculateSC(char) {
    let sc = 0;
    // Class EXP
    if (char.classes) {
      for (const cls of char.classes) {
        sc += (cls.tier || 1) * 100;          // unlock cost
        sc += ((cls.levels || 1) - 1) * 100;  // subsequent levels
      }
    }
    // Only non-creation breakthroughs count toward SC
    if (char.breakthroughs) {
      for (const bt of char.breakthroughs) {
        if (!bt.fromCreation) {
          sc += parseInt(bt.cost) || 0;
        }
      }
    }
    return sc;
  }

  /**
   * Total starting EXP = class budget only.
   * The 300 breakthrough budget is a freebie and doesn't count.
   * Humans get +100 EXP bonus.
   * Can grow over time as the player earns more EXP.
   */
  function calculateStartingExp(char) {
    const res = char.resources || {};
    const base = res.classExp || 1000;
    const isHuman = char.race?.primaryRaceId === "human" ||
                    char.race?.primaryRaceName?.toLowerCase() === "human";
    return base + (isHuman ? 100 : 0);
  }

  /* ─── Main Stat arrays ────────────────────────────────────────────── */
  const MAIN_STAT_ARRAY = [5, 4, 4, 3];
  const SUB_STAT_ARRAY  = [5, 4, 3, 2, 1];

  const MAIN_STAT_KEYS = ["power", "focus", "agility", "toughness"];
  const SUB_STAT_KEYS  = ["fitness", "cunning", "reason", "awareness", "presence"];

  const MAIN_STAT_NAMES = { power: "Power", focus: "Focus", agility: "Agility", toughness: "Toughness" };
  const SUB_STAT_NAMES  = { fitness: "Fitness", cunning: "Cunning", reason: "Reason", awareness: "Awareness", presence: "Presence" };

  /* ─── Persistence ─────────────────────────────────────────────────── */
  const STORAGE_KEY = "angelssword_character";

  function save(char) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(char)); }
    catch (e) { console.warn("Could not save character:", e); }
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { console.warn("Could not load character:", e); }
    return null;
  }

  function clear() { localStorage.removeItem(STORAGE_KEY); }

  /* ─── Public API ──────────────────────────────────────────────────── */
  return {
    createDefault,
    getDerived,
    getEffectiveMainStat,
    getEffectiveSubStat,
    applyRaceBonuses,
    snapshotStats,
    calculateSC,
    calculateStartingExp,
    save, load, clear,
    RACE_BONUSES,
    MAIN_STAT_ARRAY, SUB_STAT_ARRAY,
    MAIN_STAT_KEYS, SUB_STAT_KEYS,
    MAIN_STAT_NAMES, SUB_STAT_NAMES,
  };
})();
