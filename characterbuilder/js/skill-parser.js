/**
 * SkillParser - Shared skill constants and parsing utilities for the character builder.
 * @module SkillParser
 */
window.SkillParser = (function() {
  'use strict';

  /* ─── Skill Cap Constants ──────────────────────────────────────────── */

  /** @type {number} Maximum points in a standard skill */
  var SKILL_CAP = 15;

  /** @type {number} Maximum expertise points in a standard skill */
  var EXPERTISE_CAP = 15;

  /** @type {number} Maximum points in an artisan skill */
  var ARTISAN_SKILL_CAP = 10;

  /** @type {number} Maximum expertise points in an artisan skill */
  var ARTISAN_EXPERTISE_CAP = 10;

  /* ─── Skill Category Definitions ───────────────────────────────────── */

  /**
   * Mapping of governing stat to the skills in that category.
   * @type {Array<{stat: string, skills: string[]}>}
   */
  var SKILL_CATEGORIES = [
    { stat: "Fitness",   skills: ["Athletics", "Riding"] },
    { stat: "Cunning",   skills: ["Deception", "Roguecraft", "Stealth"] },
    { stat: "Reason",    skills: ["Artifice", "Appraise", "Common Knowledge", "Flight", "History", "Linguistics", "Magic", "Medicine", "Religion"] },
    { stat: "Awareness", skills: ["Animal Husbandry", "Insight", "Perception", "Survival"] },
    { stat: "Presence",  skills: ["Art", "Intimidation", "Negotiation"] },
  ];

  /** @type {string[]} Flat list of all standard skill names */
  var ALL_SKILL_NAMES = [];
  for (var ci = 0; ci < SKILL_CATEGORIES.length; ci++) {
    var catSkills = SKILL_CATEGORIES[ci].skills;
    for (var si = 0; si < catSkills.length; si++) {
      ALL_SKILL_NAMES.push(catSkills[si]);
    }
  }

  /** @type {string[]} List of artisan skill names */
  var ARTISAN_SKILLS = ["Alchemy", "Blacksmith", "Farming", "Carpentry", "Armorsmithing", "Artificer"];

  /** @type {string[]} List of gathering skill names */
  var GATHERING_SKILLS = ["Mining", "Herbalism", "Foraging", "Fishing", "Hunting", "Logging"];

  /* ─── Internal Helpers ─────────────────────────────────────────────── */

  /**
   * Strip HTML tags from a string (local copy to avoid dependency).
   * @private
   */
  function stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  }

  /* ─── parseClassSkillGrant ─────────────────────────────────────────── */

  /**
   * Parse a class skill-grant text block into structured source objects.
   *
   * @param {string} skillsText - The raw HTML/text describing skill grants (e.g. from a class definition).
   * @param {string} className  - The name of the class granting these skills.
   * @returns {Array<{name: string, points: number, remaining: number, allowedSkills: string[], isArtisan: boolean}>}
   */
  function parseClassSkillGrant(skillsText, className) {
    if (!skillsText) return [];
    var clean = stripHtml(skillsText).trim();
    var grants = [];

    // Split on sentences that start new grants: "You also gain" or "You gain"
    var parts = clean.split(/(?=You also gain|You gain)/i).filter(function(s) { return s.trim(); });

    for (var pi = 0; pi < parts.length; pi++) {
      var part = parts[pi];

      // Try to extract point count: "+5 skill points" or "5 skill points" or "+5 skill"
      var pointMatch = part.match(/\+?(\d+)\s+(?:skill\s+point|skill\b|Transmuter\s+point)/i);
      if (!pointMatch) continue;
      var points = parseInt(pointMatch[1]);

      // Determine allowed skills
      var allowedSkills = [];
      var isArtisan = false;

      // Check for artisan/crafting specific grants
      var artisanMatch = part.match(/(?:in|on)\s+(Alchemy|Blacksmith(?:ing)?|Farming|Carpentry|Armorsmithing|Artificer)/i);
      if (artisanMatch) {
        var artName = artisanMatch[1].replace(/ing$/i, "");
        // Normalize
        var normalized = null;
        for (var ai = 0; ai < ARTISAN_SKILLS.length; ai++) {
          if (ARTISAN_SKILLS[ai].toLowerCase().indexOf(artName.toLowerCase()) === 0) {
            normalized = ARTISAN_SKILLS[ai];
            break;
          }
        }
        if (!normalized) normalized = artisanMatch[1];
        allowedSkills = [normalized];
        isArtisan = true;
      }
      // "any non crafting skill" or "any non-crafting and non-gathering skill" or "any normal skill"
      else if (/any\s+(?:non[- ]?craft|normal\s+skill|non[- ]?gathering)/i.test(part) || /any\s+(?:non[- ]?crafting\s+(?:and\s+non[- ]?gathering\s+)?skill)/i.test(part)) {
        allowedSkills = ALL_SKILL_NAMES.slice();
      }
      // Specific skill list
      else {
        // Extract skill list after "spend in/on" or "points in/on"
        var listMatch = part.match(/(?:spend\s+(?:in|on)|points\s+(?:in|on))\s+(.+?)(?:\.\s*You\s+can|\.$|$)/i);
        if (listMatch) {
          var rawList = listMatch[1];
          // Split by comma, "or", "and"
          var names = rawList
            .split(/,\s*|\s+or\s+|\s+and\s+/i)
            .map(function(n) { return n.trim().replace(/\.$/, ""); })
            .filter(function(n) { return n.length > 0; });

          // Match each to known skills
          for (var ni = 0; ni < names.length; ni++) {
            var name = names[ni];
            var matched = null;
            // Check standard skills
            for (var ski = 0; ski < ALL_SKILL_NAMES.length; ski++) {
              if (ALL_SKILL_NAMES[ski].toLowerCase() === name.toLowerCase()) {
                matched = ALL_SKILL_NAMES[ski];
                break;
              }
            }
            if (matched) {
              allowedSkills.push(matched);
            } else {
              // Check artisan skills
              for (var ari = 0; ari < ARTISAN_SKILLS.length; ari++) {
                if (ARTISAN_SKILLS[ari].toLowerCase() === name.toLowerCase()) {
                  allowedSkills.push(ARTISAN_SKILLS[ari]);
                  isArtisan = true;
                  break;
                }
              }
            }
          }
        }

        // If we couldn't parse any skills, default to all
        if (allowedSkills.length === 0) {
          allowedSkills = ALL_SKILL_NAMES.slice();
        }
      }

      grants.push({
        name: className,
        points: points,
        remaining: points,
        allowedSkills: allowedSkills,
        isArtisan: isArtisan,
      });
    }

    return grants;
  }

  /* ─── parseStatChoices ─────────────────────────────────────────────── */

  /**
   * Parse stat choice names from a heart/soul level-up text.
   *
   * @param {string} text           - The raw text describing available stat choices.
   * @param {string} statType       - Either "main" or "sub".
   * @param {Object} CharacterModule - The Character module exposing MAIN_STAT_NAMES, SUB_STAT_NAMES, MAIN_STAT_KEYS, SUB_STAT_KEYS.
   * @returns {Array<{key: string, name: string}>} Array of matching stat choices.
   */
  function parseStatChoices(text, statType, CharacterModule) {
    if (!text) return [];
    var allNames = statType === "main"
      ? Object.values(CharacterModule.MAIN_STAT_NAMES)
      : Object.values(CharacterModule.SUB_STAT_NAMES);
    var allKeys = statType === "main"
      ? CharacterModule.MAIN_STAT_KEYS
      : CharacterModule.SUB_STAT_KEYS;
    var nameToKey = {};
    allKeys.forEach(function(k, i) { nameToKey[allNames[i].toLowerCase()] = k; });

    var found = [];
    for (var ni = 0; ni < allNames.length; ni++) {
      var name = allNames[ni];
      if (text.toLowerCase().indexOf(name.toLowerCase()) !== -1) {
        found.push({ key: nameToKey[name.toLowerCase()], name: name });
      }
    }
    return found;
  }

  /* ─── Public API ───────────────────────────────────────────────────── */

  return {
    SKILL_CAP: SKILL_CAP,
    EXPERTISE_CAP: EXPERTISE_CAP,
    ARTISAN_SKILL_CAP: ARTISAN_SKILL_CAP,
    ARTISAN_EXPERTISE_CAP: ARTISAN_EXPERTISE_CAP,
    SKILL_CATEGORIES: SKILL_CATEGORIES,
    ALL_SKILL_NAMES: ALL_SKILL_NAMES,
    ARTISAN_SKILLS: ARTISAN_SKILLS,
    GATHERING_SKILLS: GATHERING_SKILLS,
    parseClassSkillGrant: parseClassSkillGrant,
    parseStatChoices: parseStatChoices,
  };
})();
