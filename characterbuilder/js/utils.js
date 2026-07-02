/**
 * Utils - Shared utility functions for the character builder.
 * @module Utils
 */
window.Utils = (function() {
  'use strict';

  /**
   * Strip HTML tags from a string.
   * @param {string} html - The HTML string to strip.
   * @returns {string} The plain text string.
   */
  function stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  }

  /**
   * Check if a character is Human race.
   * @param {Object} character - The character object with race data.
   * @returns {boolean} True if the character's primary race is human.
   */
  function isHuman(character) {
    return character.race?.primaryRaceId === 'human' ||
           character.race?.primaryRaceName?.toLowerCase() === 'human';
  }

  /**
   * Check if a class/breakthrough has meaningful requirements (not "None").
   * @param {Object} item - An item object with a requirements property.
   * @returns {boolean} True if the item has non-trivial requirements.
   */
  function hasRequirements(item) {
    return item.requirements && item.requirements !== 'None' && item.requirements !== 'None.';
  }

  /**
   * Generate a difficulty dots string (e.g. ●●●○○).
   * @param {number} difficulty - Number of filled dots.
   * @param {number} [max=5] - Total number of dots.
   * @returns {string} The dots string.
   */
  function difficultyDots(difficulty, max) {
    if (!max) max = 5;
    return Array.from({ length: max }, function(_, i) {
      return i < difficulty ? '●' : '○';
    }).join('');
  }

  /**
   * Capitalize the first letter of a string.
   * @param {string} str - The input string.
   * @returns {string} The string with its first letter capitalized.
   */
  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  return {
    stripHtml: stripHtml,
    isHuman: isHuman,
    hasRequirements: hasRequirements,
    difficultyDots: difficultyDots,
    capitalize: capitalize,
  };
})();
