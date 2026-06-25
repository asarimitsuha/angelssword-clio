/* ══════════════════════════════════════════════════════════════════════
   DialogueEngine — Unified typewriter/dialogue system for all NPCs
   Replaces 6 copy-pasted dialogue systems with one reusable class.
   ══════════════════════════════════════════════════════════════════════ */

/**
 * A reusable dialogue engine that handles typewriter text, voice playback,
 * sprite updates, intro sequences, and talk cycling for any NPC.
 *
 * @param {Object} config
 * @param {string} config.id - Unique NPC identifier (for logging)
 * @param {HTMLElement} config.textEl - DOM element for dialogue text
 * @param {HTMLElement} config.indicatorEl - "▼" next-line indicator
 * @param {HTMLElement} [config.spriteEl] - Sprite image element
 * @param {HTMLElement} [config.speakerNameEl] - Speaker name label
 * @param {HTMLElement} [config.dialogueBox] - Dialogue box container
 * @param {HTMLElement} [config.talkBtn] - Talk/Continue button
 * @param {HTMLElement} [config.actionsEl] - Actions container (shown after intro)
 * @param {Array} [config.introLines] - Intro dialogue array (played once)
 * @param {Array} config.talkLines - Random/cycling talk dialogue array
 * @param {Function} config.voiceSrcFn - (type, index) => voice file path
 * @param {Function} [config.spriteSrcFn] - (line) => sprite image path
 * @param {number} [config.voiceVolume=0.8] - Voice playback volume
 * @param {number} [config.typeSpeed=25] - Milliseconds per character
 * @param {string} [config.btnIconClass='scene-btn-icon'] - CSS class for button icon
 * @param {Function} [config.onIntroComplete] - Callback when intro finishes
 * @param {Audio} config.voiceAudio - Shared voice Audio instance
 */
class DialogueEngine {
  constructor(config) {
    // DOM elements
    this.id = config.id;
    this.textEl = config.textEl;
    this.indicatorEl = config.indicatorEl;
    this.spriteEl = config.spriteEl || null;
    this.speakerNameEl = config.speakerNameEl || null;
    this.dialogueBox = config.dialogueBox || null;
    this.talkBtn = config.talkBtn || null;
    this.actionsEl = config.actionsEl || null;

    // Dialogue data
    this.introLines = config.introLines || null;
    this.talkLines = config.talkLines;

    // Callbacks
    this.voiceSrcFn = config.voiceSrcFn;
    this.spriteSrcFn = config.spriteSrcFn || null;
    this.onIntroComplete = config.onIntroComplete || null;

    // Config
    this.voiceVolume = config.voiceVolume ?? 0.8;
    this.typeSpeed = config.typeSpeed ?? 25;
    this.btnIconClass = config.btnIconClass || 'scene-btn-icon';
    this.voiceAudio = config.voiceAudio;

    // Internal state
    this._isTyping = false;
    this._typeTimer = null;
    this._fullText = '';
    this._introIndex = 0;
    this._talkIndex = 0;
    this._introComplete = !this.introLines; // true if no intro
    this._talkActive = false;
  }

  /* ─── Public API ──────────────────────────────────────────────── */

  /** @returns {boolean} Whether the typewriter is currently animating */
  get isTyping() {
    return this._isTyping;
  }

  /** @returns {boolean} Whether the intro sequence has finished */
  get introComplete() {
    return this._introComplete;
  }

  /** @returns {boolean} Whether talk mode is active */
  get talkActive() {
    return this._talkActive;
  }

  /**
   * Start the intro sequence from the beginning.
   */
  startIntro() {
    if (!this.introLines) return;
    this._introIndex = 0;
    this._introComplete = false;
    this.showLine(this.introLines[0], 'intro', 0);
  }

  /**
   * Advance the intro by one line (or complete typing if mid-type).
   * Call this from click handlers during the intro phase.
   */
  advanceIntro() {
    if (!this.introLines) return;

    if (this._isTyping) {
      this.completeTyping();
      return;
    }

    this._introIndex++;
    if (this._introIndex < this.introLines.length) {
      this.showLine(this.introLines[this._introIndex], 'intro', this._introIndex);
    } else {
      // Intro finished
      this._introComplete = true;
      if (this.actionsEl) {
        this.actionsEl.style.display = 'flex';
      }
      if (this.onIntroComplete) {
        this.onIntroComplete();
      }
    }
  }

  /**
   * Handle a "Talk to" button click. On first call, activates talk mode.
   * On subsequent calls, advances to the next talk line (or completes typing).
   */
  talk() {
    if (!this._talkActive) {
      this._talkActive = true;
      if (this.dialogueBox) {
        this.dialogueBox.style.display = 'block';
        this.dialogueBox.classList.add('visible');
      }
      if (this.talkBtn) {
        this.talkBtn.innerHTML = `<span class="${this.btnIconClass}">💬</span> Continue...`;
      }
      this.showLine(this.talkLines[this._talkIndex], 'talk', this._talkIndex);
      return;
    }

    if (this._isTyping) {
      this.completeTyping();
      return;
    }

    this._talkIndex = (this._talkIndex + 1) % this.talkLines.length;
    this.showLine(this.talkLines[this._talkIndex], 'talk', this._talkIndex);
  }

  /**
   * Display a single dialogue line with typewriter effect, voice, and sprite.
   * @param {Object} line - Dialogue line object
   * @param {string} type - 'intro' or 'talk'
   * @param {number} index - Index in the dialogue array
   */
  showLine(line, type, index) {
    // Update speaker name if applicable
    if (this.speakerNameEl && line.speaker) {
      this.speakerNameEl.textContent = line.speaker;
    }

    // Hide indicator
    this.indicatorEl.classList.remove('visible');

    // Store full text
    this._fullText = line.text;

    // Update sprite
    if (this.spriteEl && this.spriteSrcFn) {
      const src = this.spriteSrcFn(line);
      if (src) this.spriteEl.src = src;
    }

    // Play voiceover
    this.voiceAudio.pause();
    this.voiceAudio.src = this.voiceSrcFn(type, index);
    this.voiceAudio.volume = this.voiceVolume;
    this.voiceAudio.play().catch(err =>
      console.log(`${this.id} voiceover blocked or missing:`, err)
    );

    // Typewriter effect
    this._isTyping = true;
    this.textEl.textContent = '';
    let charIndex = 0;

    clearInterval(this._typeTimer);
    this._typeTimer = setInterval(() => {
      if (charIndex < this._fullText.length) {
        this.textEl.textContent += this._fullText[charIndex];
        charIndex++;
      } else {
        clearInterval(this._typeTimer);
        this._isTyping = false;
        this.indicatorEl.classList.add('visible');
      }
    }, this.typeSpeed);
  }

  /**
   * Instantly complete the current typewriter animation.
   */
  completeTyping() {
    clearInterval(this._typeTimer);
    this.textEl.textContent = this._fullText;
    this._isTyping = false;
    this.indicatorEl.classList.add('visible');
  }

  /**
   * Reset the engine state (useful when re-entering a scene).
   */
  reset() {
    clearInterval(this._typeTimer);
    this._isTyping = false;
    this._fullText = '';
    this._introIndex = 0;
    this._talkIndex = 0;
    this._introComplete = !this.introLines;
    this._talkActive = false;
  }
}
