/* ══════════════════════════════════════════════════════════════════════
   Angel's Sword RPG: The Lyrian Chronicles — Landing Page Engine
   Shared utilities loaded from js/shared.js
   ══════════════════════════════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {
  initParticles();
  initNavbar();
  initParallax();
  initScrollReveal();
  initMobileNav();
  initSpriteInteraction();
});

/* ─── Queri Sprite Interaction ────────────────────────────────────── */
function initSpriteInteraction() {
  const sprite = document.getElementById("cta-sprite");
  if (!sprite) return;

  const expressions = [
    "queri_normal.png",
    "queri_cheerful.png",
    "queri_thumbsup.png",
    "queri_surprised.png",
    "queri_smug.png",
  ];
  let currentIdx = 0;

  sprite.addEventListener("click", () => {
    currentIdx = (currentIdx + 1) % expressions.length;
    sprite.style.transform = "scale(1.08)";
    sprite.src = `combattutorial/assets/${expressions[currentIdx]}`;

    setTimeout(() => {
      sprite.style.transform = "";
    }, 300);
  });

  sprite.style.cursor = "pointer";
  sprite.title = "Click me!";
}

/* ─── Smooth Scroll for anchor links ──────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    const targetId = this.getAttribute("href");
    if (targetId === "#") return;

    const targetEl = document.querySelector(targetId);
    if (targetEl) {
      e.preventDefault();
      targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});
