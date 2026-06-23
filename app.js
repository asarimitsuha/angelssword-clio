// Core Game Engine for Angel's Sword RPG: Combat School (PC-98 Edition)

let currentSlideIndex = 0;
let isTyping = false;
let typewriterTimer = null;
let soundEnabled = true;
let crtFilterEnabled = true;
let bgmEnabled = true;
let bgmAudio = null;
let audioCtx = null;
let voiceAudio = null; // Voiceover audio player

// Initialize when DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  initTOC();
  initControls();
  
  // Set initial game startup state
  document.body.classList.add("game-not-started");
  
  const startScreen = document.getElementById("start-screen");
  const startGame = () => {
    if (document.body.classList.contains("game-not-started")) {
      playGameStartSound();
      initBGM(); // Start background music
      document.body.classList.remove("game-not-started");
      startScreen.style.display = "none";
      renderSlide(0); // Immediately plays the first cutscene video!
    }
  };

  startScreen.addEventListener("click", startGame);
  document.addEventListener("keydown", (e) => {
    // Pressing any key on the start screen starts the game
    if (document.body.classList.contains("game-not-started")) {
      startGame();
    }
  });
});

// 1. Generate the Table of Contents dynamically with Subtabs
function initTOC() {
  const tocList = document.getElementById("toc-list");
  tocList.innerHTML = "";

  // Group slides by section and compile subtabs
  const sections = [];
  window.SLIDES.forEach((slide, index) => {
    const existingSection = sections.find(s => s.name === slide.section);
    if (!existingSection) {
      sections.push({
        name: slide.section,
        firstIndex: index,
        subtabs: []
      });
    }
    
    // Add subtabs under the current active section
    if (slide.subtab) {
      const currentSection = sections[sections.length - 1];
      currentSection.subtabs.push({
        name: slide.subtab,
        index: index
      });
    }
  });

  // Render parent items and nested subtabs
  sections.forEach((sec, idx) => {
    const li = document.createElement("li");
    li.className = "toc-item";
    li.dataset.index = sec.firstIndex;
    li.dataset.sectionName = sec.name;
    li.textContent = `${(idx + 1).toString().padStart(2, '0')}. ${sec.name}`;
    
    // Jump to the section on click
    li.addEventListener("click", () => {
      jumpToSlide(sec.firstIndex);
    });
    tocList.appendChild(li);

    // If section has subtabs, create a nested sublist
    if (sec.subtabs.length > 0) {
      const subUl = document.createElement("ul");
      subUl.className = "toc-sublist";
      
      sec.subtabs.forEach(sub => {
        const subLi = document.createElement("li");
        subLi.className = "toc-subitem";
        subLi.dataset.index = sub.index;
        subLi.dataset.subName = sub.name;
        subLi.textContent = `└ ${sub.name}`;
        
        subLi.addEventListener("click", (e) => {
          e.stopPropagation(); // Stop parent click event
          jumpToSlide(sub.index);
        });
        subUl.appendChild(subLi);
      });
      
      tocList.appendChild(subUl);
    }
  });
}

// 2. Setup control bindings (Keyboard, Toggles, Overlays)
function initControls() {
  // Navigation Overlays
  document.getElementById("zone-left").addEventListener("click", (e) => {
    e.stopPropagation();
    prevSlide();
  });
  document.getElementById("zone-right").addEventListener("click", (e) => {
    e.stopPropagation();
    nextSlide();
  });

  // Dialogue Box Click (handles skip typing or next slide, closes popup if open)
  document.getElementById("dialogue-box").addEventListener("click", (e) => {
    const popup = document.getElementById("retro-popup");
    if (popup.style.display === "block") {
      hidePopup();
      e.stopPropagation();
      return;
    }
    if (isTyping) {
      completeTypewriter();
    } else {
      nextSlide();
    }
  });

  // CRT Toggle Switch
  const crtToggle = document.getElementById("crt-toggle");
  crtToggle.addEventListener("change", (e) => {
    crtFilterEnabled = e.target.checked;
    const crtScreen = document.getElementById("crt-screen");
    if (crtFilterEnabled) {
      crtScreen.classList.add("crt-effects");
      document.body.classList.remove("no-crt");
    } else {
      crtScreen.classList.remove("crt-effects");
      document.body.classList.add("no-crt");
    }
    playMenuClickSound();
  });

  // BGM Toggle Switch
  const bgmToggle = document.getElementById("bgm-toggle");
  bgmToggle.addEventListener("change", (e) => {
    bgmEnabled = e.target.checked;
    if (bgmAudio) {
      if (bgmEnabled) {
        bgmAudio.play().catch(() => {});
      }
      updateBGMVolume();
    }
    playMenuClickSound();
  });

  // Sound Toggle Switch
  const soundToggle = document.getElementById("sound-toggle");
  soundToggle.addEventListener("change", (e) => {
    soundEnabled = e.target.checked;
    if (soundEnabled) {
      // Resume audio context if suspended
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    } else {
      // Stop active voiceover immediately if sound is turned off
      if (voiceAudio) {
        voiceAudio.pause();
        voiceAudio = null;
      }
    }
    playMenuClickSound();
  });

  // Popup Window Click-to-Close (click anywhere inside the popup box or anywhere on the stage to remove it)
  document.getElementById("vn-stage").addEventListener("click", () => {
    const popup = document.getElementById("retro-popup");
    if (popup.style.display === "block") {
      hidePopup();
    }
  });

  // Keyboard Shortcuts
  document.addEventListener("keydown", (e) => {
    const popup = document.getElementById("retro-popup");
    if (popup.style.display === "block") {
      if (e.code === "Space" || e.code === "ArrowRight" || e.code === "ArrowLeft" || e.code === "Escape") {
        e.preventDefault();
        hidePopup();
        return;
      }
    }
    if (e.code === "Space" || e.code === "ArrowRight") {
      e.preventDefault();
      if (isTyping) {
        completeTypewriter();
      } else {
        nextSlide();
      }
    } else if (e.code === "ArrowLeft") {
      e.preventDefault();
      prevSlide();
    }
  });

  // Video Controls
  const video = document.getElementById("demo-video");
  const playBtn = document.getElementById("video-play-btn");
  const stopBtn = document.getElementById("video-stop-btn");
  const timeDisplay = document.getElementById("video-time");

  playBtn.addEventListener("click", () => {
    if (video.paused) {
      video.play().catch(e => {
        // If placeholder triggers error, just simulate time progress
        console.warn("Video failed to play, it is a placeholder:", e);
      });
      playBtn.textContent = "PAUSE";
    } else {
      video.pause();
      playBtn.textContent = "PLAY";
    }
    playMenuClickSound();
  });

  stopBtn.addEventListener("click", () => {
    video.pause();
    video.currentTime = 0;
    playBtn.textContent = "PLAY";
    document.getElementById("video-error-message").style.display = "flex";
    playMenuClickSound();
  });

  video.addEventListener("timeupdate", () => {
    const curMin = Math.floor(video.currentTime / 60).toString().padStart(2, '0');
    const curSec = Math.floor(video.currentTime % 60).toString().padStart(2, '0');
    const durMin = Math.floor(video.duration ? video.duration / 60 : 0).toString().padStart(2, '0');
    const durSec = Math.floor(video.duration ? video.duration % 60 : 0).toString().padStart(2, '0');
    timeDisplay.textContent = `${curMin}:${curSec} / ${durMin}:${durSec}`;
  });

  // Hide placeholder when video actually plays successfully
  video.addEventListener("playing", () => {
    document.getElementById("video-error-message").style.display = "none";
    updateBGMVolume();
  });

  video.addEventListener("pause", () => {
    updateBGMVolume();
  });

  // Automatically advance to the next slide when the cutscene ends
  video.addEventListener("ended", () => {
    nextSlide();
  });

  // Click on the full-screen video layer to skip the cutscene
  document.getElementById("video-layer").addEventListener("click", () => {
    video.pause();
    nextSlide();
  });
}

// 3. Render the current slide contents
function renderSlide(index) {
  currentSlideIndex = index;
  const slide = window.SLIDES[currentSlideIndex];

  // Stop active voiceover if playing
  if (voiceAudio) {
    voiceAudio.pause();
    voiceAudio = null;
  }

  // Update counters and headers
  document.getElementById("slide-counter").textContent = `${(index + 1).toString().padStart(2, '0')}/${window.SLIDES.length.toString().padStart(2, '0')}`;
  document.getElementById("speaker-name").textContent = slide.speaker || "SYSTEM";

  // Update background image
  const stageBg = document.getElementById("stage-bg");
  if (slide.background) {
    stageBg.style.backgroundImage = `url('assets/${slide.background}')`;
  }

  // Update Queri Sprite Expression
  const sprite = document.getElementById("queri-sprite");
  if (slide.expression) {
    sprite.src = `assets/queri_${slide.expression}.png`;
    sprite.style.display = "block";
  } else {
    sprite.style.display = "none";
  }

  // Handle slide type-specific elements
  const hotspotLayer = document.getElementById("hotspot-layer");
  const videoLayer = document.getElementById("video-layer");
  const video = document.getElementById("demo-video");

  // Reset layers
  hotspotLayer.style.display = "none";
  hotspotLayer.innerHTML = "";
  videoLayer.style.display = "none";
  video.pause();
  hidePopup();

  if (slide.type === "interactive") {
    // Enable and build hotspots
    hotspotLayer.style.display = "block";
    slide.hotspots.forEach(spot => {
      const btn = document.createElement("div");
      btn.className = "hotspot";
      btn.style.left = spot.x;
      btn.style.top = spot.y;
      btn.style.width = spot.width;
      btn.style.height = spot.height;
      
      // Determine a retro card icon based on ID
      let icon = "❓";
      if (spot.id.includes("armor-light")) icon = "🍃";
      else if (spot.id.includes("armor-medium")) icon = "⚖️";
      else if (spot.id.includes("armor-heavy")) icon = "🧱";
      else if (spot.id.includes("reaction-aoo")) icon = "⚔️";
      else if (spot.id.includes("reaction-heavy-aoo")) icon = "🪓";
      else if (spot.id.includes("reaction-disengage")) icon = "🏃";
      else if (spot.id.includes("cover-low")) icon = "🌲";
      else if (spot.id.includes("cover-high")) icon = "🏰";
      else if (spot.id.includes("cover-full")) icon = "🚪";
      else if (spot.id.includes("light")) icon = "⚡";
      else if (spot.id.includes("heavy")) icon = "💥";
      else if (spot.id.includes("precise")) icon = "🎯";
      else if (spot.id.includes("dodge")) icon = "💨";
      else if (spot.id.includes("block")) icon = "🛡️";
      else if (spot.id.includes("save")) icon = "🎲";
      else if (spot.id.includes("takehit")) icon = "❤️";

      btn.innerHTML = `
        <div class="hotspot-icon">${icon}</div>
        <span class="hotspot-label">${spot.label}</span>
      `;
      
      // Click hotspot opens retro popup card
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        showPopup(spot.title, spot.desc);
      });
      
      hotspotLayer.appendChild(btn);
    });
  } else if (slide.type === "video") {
    // Enable video player overlay
    videoLayer.style.display = "block";
    video.src = slide.videoSrc || "";
    video.load(); // Reload video with new source
    
    // Hide static error screen by default, let autoplay try to run
    const errorOverlay = document.getElementById("video-error-message");
    errorOverlay.style.display = "none";

    // Play immediately on slide entry
    video.play().catch(e => {
      console.warn("Autoplay blocked or video missing, showing CRT static:", e);
      errorOverlay.style.display = "flex";
    });
  }

  // Highlight active TOC item and subtab
  updateTOCSelection(slide.section, index);

  // Show/Hide back button based on slide progress
  document.getElementById("zone-left").style.display = index === 0 ? "none" : "flex";

  // Trigger typewriter text entry
  startTypewriter(slide.text);

  // Play voiceover if sound is enabled and it's not a video cutscene
  if (soundEnabled && slide.type !== "video" && slide.text) {
    voiceAudio = new Audio(`assets/voice/slide_${index}.mp3`);
    voiceAudio.volume = 0.8;
    voiceAudio.play().catch(e => {
      // Ignore if voiceover file is missing or blocked by browser policy
      console.warn(`Voiceover not found or blocked for slide ${index}:`, e);
    });
  }
}

// 4. Typewriter Dialogue Renderer
function startTypewriter(text) {
  isTyping = true;
  document.getElementById("next-indicator").style.display = "none";
  const container = document.getElementById("dialogue-text");
  container.innerHTML = "";

  // Parse double asterisks **bold** to <strong> tags for keyword highlight styling
  const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Tokenize characters and HTML tag segments
  const chars = [];
  let i = 0;
  while (i < formattedText.length) {
    if (formattedText[i] === '<') {
      let tag = "";
      while (i < formattedText.length && formattedText[i] !== '>') {
        tag += formattedText[i];
        i++;
      }
      tag += '>';
      i++;
      chars.push({ type: 'tag', value: tag });
    } else {
      chars.push({ type: 'char', value: formattedText[i] });
      i++;
    }
  }

  let charIndex = 0;
  let currentHTML = "";
  clearInterval(typewriterTimer);
  
  typewriterTimer = setInterval(() => {
    if (charIndex >= chars.length) {
      completeTypewriter();
      return;
    }

    const node = chars[charIndex];
    currentHTML += node.value;
    container.innerHTML = currentHTML;

    if (node.type === 'char') {
      playDialogueBeep();
    }
    charIndex++;
  }, 18); // Fast, snappy PC-98 text rendering speed
}

function completeTypewriter() {
  clearInterval(typewriterTimer);
  isTyping = false;
  
  const slide = window.SLIDES[currentSlideIndex];
  const container = document.getElementById("dialogue-text");
  container.innerHTML = slide.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  document.getElementById("next-indicator").style.display = "block";
}

// 5. Navigation Control Functions
function nextSlide() {
  if (currentSlideIndex < window.SLIDES.length - 1) {
    renderSlide(currentSlideIndex + 1);
    playSlideSwitchSound();
  }
}

function prevSlide() {
  if (currentSlideIndex > 0) {
    renderSlide(currentSlideIndex - 1);
    playSlideSwitchSound();
  }
}

function jumpToSlide(index) {
  renderSlide(index);
  playSlideSwitchSound();
}

function updateTOCSelection(sectionName, slideIndex) {
  // Highlight parent section
  const items = document.querySelectorAll(".toc-item");
  items.forEach(item => {
    if (item.dataset.sectionName === sectionName) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // Highlight active subtab (Light, Heavy, Precise) dynamically
  const subitems = document.querySelectorAll(".toc-subitem");
  
  let activeSubName = null;
  // Scan backward to find the most recent slide in the same section that defines a subtab
  for (let i = slideIndex; i >= 0; i--) {
    if (window.SLIDES[i].section !== sectionName) break;
    if (window.SLIDES[i].subtab) {
      activeSubName = window.SLIDES[i].subtab;
      break;
    }
  }

  subitems.forEach(sub => {
    if (activeSubName && sub.dataset.subName === activeSubName) {
      sub.classList.add("active");
    } else {
      sub.classList.remove("active");
    }
  });
}

// 6. Retro Popup Modal controls
function showPopup(title, content) {
  const popup = document.getElementById("retro-popup");
  document.getElementById("popup-title").textContent = title;
  document.getElementById("popup-content").textContent = content;
  popup.style.display = "block";
  playPopupSound();
}

function hidePopup() {
  const popup = document.getElementById("retro-popup");
  if (popup.style.display === "block") {
    popup.style.display = "none";
    playMenuClickSound();
  } else {
    popup.style.display = "none";
  }
}


// ==========================================================================
// RETRO 8-BIT AUDIO SYNTHESIS (WEB AUDIO API)
// ==========================================================================

function playDialogueBeep() {
  if (!soundEnabled) return;
  // Skip play beeps on video cutscene slides
  if (window.SLIDES[currentSlideIndex] && window.SLIDES[currentSlideIndex].type === 'video') {
    return;
  }
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle'; // Soft retro chime wave
    
    // Add micro-pitch variation for mechanical keyboard chatter sound
    const pitch = 380 + Math.random() * 40;
    osc.frequency.setValueAtTime(pitch, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(pitch + 100, audioCtx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.04);
  } catch (e) {
    console.error("Audio Context Beep failed:", e);
  }
}

function playSlideSwitchSound() {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(250, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(750, audioCtx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.12);
  } catch (e) {}
}

function playMenuClickSound() {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.setValueAtTime(300, audioCtx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
  } catch (e) {}
}

function playPopupSound() {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(440, audioCtx.currentTime);
    osc1.frequency.setValueAtTime(554.37, audioCtx.currentTime + 0.06);
    osc1.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);

    osc1.connect(gain);
    gain.connect(audioCtx.destination);

    osc1.start();
    osc1.stop(audioCtx.currentTime + 0.2);
  } catch (e) {}
}

function playGameStartSound() {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    
    // Quick square wave retro arpeggio chord (C4, E4, G4, C5)
    const playNote = (freq, start, duration) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(0.06, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start(start);
      osc.stop(start + duration);
    };

    playNote(261.63, now, 0.1);          // C4
    playNote(329.63, now + 0.08, 0.1);     // E4
    playNote(392.00, now + 0.16, 0.1);     // G4
    playNote(523.25, now + 0.24, 0.35);    // C5
  } catch (e) {
    console.error("Game Start sound failed:", e);
  }
}

// BGM Music Controls (BGM ducking and loop play)
function initBGM() {
  if (!bgmAudio) {
    bgmAudio = new Audio("assets/Unmitigated-Tutorial.mp3");
    bgmAudio.loop = true;
  }
  updateBGMVolume();
  bgmAudio.play().catch(e => {
    console.warn("BGM autoplay blocked or failed:", e);
  });
}

function updateBGMVolume() {
  if (!bgmAudio) return;
  if (!bgmEnabled) {
    bgmAudio.volume = 0;
    return;
  }
  
  const video = document.getElementById("demo-video");
  // Duck background music if cutscene video is actively playing
  if (video && !video.paused && !video.ended && video.readyState >= 2) {
    bgmAudio.volume = 0.05;
  } else {
    bgmAudio.volume = 0.25;
  }
}
