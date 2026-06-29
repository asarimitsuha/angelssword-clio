/* ══════════════════════════════════════════════════════════════════════
   Aniela Dialogue — VN-style typewriter for the character builder.
   Text-only for now; structured so voice files can be added later.
   ══════════════════════════════════════════════════════════════════════ */

const Aniela = (() => {
  "use strict";

  /* ─── DOM refs ────────────────────────────────────────────────────── */
  let textEl = null;
  let spriteEl = null;
  let indicatorEl = null;

  /* ─── Typewriter state ────────────────────────────────────────────── */
  let _typeTimer = null;
  let _isTyping = false;
  let _fullText = "";
  const TYPE_SPEED = 22; // ms per character

  /* ─── Queued line callback ────────────────────────────────────────── */
  let _onLineComplete = null;

  /* ─── Init ────────────────────────────────────────────────────────── */
  function init() {
    textEl = document.getElementById("aniela-text");
    spriteEl = document.getElementById("aniela-sprite");
    indicatorEl = document.getElementById("aniela-next-indicator");
  }

  /* ─── Say a single line (typewriter + sprite) ─────────────────────── */
  let _dismissListener = null;

  function say(line, onComplete) {
    if (!textEl) return;

    // Clean up any previous dismiss listener
    if (_dismissListener) {
      document.removeEventListener("click", _dismissListener);
      _dismissListener = null;
    }

    // Update sprite
    if (spriteEl && line.sprite) {
      spriteEl.src = `../img/chara/aniela/aniela${line.sprite}.png`;
    }

    // Hide indicator
    if (indicatorEl) indicatorEl.classList.remove("visible");

    // Clear previous
    clearInterval(_typeTimer);
    _isTyping = true;
    _fullText = line.text;
    _onLineComplete = onComplete || null;
    textEl.textContent = "";

    let i = 0;
    _typeTimer = setInterval(() => {
      if (i < _fullText.length) {
        textEl.textContent += _fullText[i];
        i++;
      } else {
        _finishTyping();
      }
    }, TYPE_SPEED);

    // If dismissable, set up a click listener on the dialogue box
    if (line.dismissable) {
      const handler = (e) => {
        if (_isTyping) {
          completeTyping();
        } else {
          document.removeEventListener("click", handler);
          _dismissListener = null;
          // Reset to idle text
          textEl.textContent = "";
          if (indicatorEl) indicatorEl.classList.remove("visible");
        }
      };
      _dismissListener = handler;
      document.addEventListener("click", handler);
    }
  }

  /* ─── Complete current line instantly ──────────────────────────────── */
  function completeTyping() {
    if (!_isTyping) return;
    clearInterval(_typeTimer);
    textEl.textContent = _fullText;
    _finishTyping();
  }

  function _finishTyping() {
    clearInterval(_typeTimer);
    _isTyping = false;
    if (indicatorEl) indicatorEl.classList.add("visible");
    if (_onLineComplete) {
      const cb = _onLineComplete;
      _onLineComplete = null;
      cb();
    }
  }

  /* ─── Play a sequence of lines, then callback ─────────────────────── */
  let _currentAdvanceListener = null;

  function _cancelSequence() {
    if (_currentAdvanceListener) {
      document.removeEventListener("click", _currentAdvanceListener);
      _currentAdvanceListener = null;
    }
    clearInterval(_typeTimer);
    _isTyping = false;
    _onLineComplete = null;
  }

  function playSequence(lines, onAllComplete) {
    // Cancel any in-progress sequence first
    _cancelSequence();

    if (!lines || !lines.length) {
      if (onAllComplete) onAllComplete();
      return;
    }

    let index = 0;

    function showNext() {
      say(lines[index], null);
    }

    function advance() {
      if (_isTyping) {
        completeTyping();
        return;
      }
      index++;
      if (index < lines.length) {
        showNext();
      } else {
        // Sequence done — remove click listener
        document.removeEventListener("click", onAdvanceClick);
        _currentAdvanceListener = null;
        if (onAllComplete) onAllComplete();
      }
    }

    function onAdvanceClick(e) {
      // Don't advance if clicking on interactive UI elements
      if (
        e.target.closest(".stat-token") ||
        e.target.closest(".stat-slot") ||
        e.target.closest(".builder-btn") ||
        e.target.closest(".builder-actions") ||
        e.target.closest(".race-card") ||
        e.target.closest(".subrace-card") ||
        e.target.closest(".house-card") ||
        e.target.closest(".bonus-pick") ||
        e.target.closest(".bt-card") ||
        e.target.closest(".bt-search-wrap") ||
        e.target.closest(".bt-budget-bar") ||
        e.target.closest(".bt-detail-overlay") ||
        e.target.closest(".bt-cart") ||
        e.target.closest(".cls-card") ||
        e.target.closest(".cls-grid") ||
        e.target.closest(".cls-filter-bar") ||
        e.target.closest(".cls-detail-overlay") ||
        e.target.closest(".cls-cart") ||
        e.target.closest(".cls-mirane-btn") ||
        e.target.closest(".phase-header-extras")
      ) {
        return;
      }
      advance();
    }

    _currentAdvanceListener = onAdvanceClick;
    document.addEventListener("click", onAdvanceClick);
    showNext();
  }

  /* ─── Getters ─────────────────────────────────────────────────────── */
  function isTyping() {
    return _isTyping;
  }

  /* ─── Public API ──────────────────────────────────────────────────── */
  return { init, say, completeTyping, playSequence, isTyping };
})();
