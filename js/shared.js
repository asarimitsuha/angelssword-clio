/* ══════════════════════════════════════════════════════════════════════
   Shared JS Utilities — Used across landing, lore, and mirane pages
   ══════════════════════════════════════════════════════════════════════ */

/* ─── Particle System (Fireflies & Magic Dust) ───────────────────────
   Configurable particle canvas with color themes per page.
   @param {Object} [opts] - Configuration overrides
   @param {number} [opts.count=60]       - Number of particles
   @param {Array}  [opts.colors]         - Array of {r,g,b} color objects
   @param {number} [opts.sizeMin=1]      - Min particle radius
   @param {number} [opts.sizeMax=3]      - Max additional particle radius
   @param {number} [opts.glowMultiplier=6] - Glow radius = size * this
   @param {number} [opts.speedX=0.4]     - Max horizontal speed
   @param {number} [opts.speedY=0.3]     - Max vertical speed
   ─────────────────────────────────────────────────────────────────── */
function initParticles(opts = {}) {
  const canvas = document.getElementById("particle-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let width, height;
  let particles = [];

  const COUNT = opts.count || 60;
  const SIZE_MIN = opts.sizeMin ?? 1;
  const SIZE_MAX = opts.sizeMax ?? 3;
  const GLOW_MULT = opts.glowMultiplier ?? 6;
  const SPEED_X = opts.speedX ?? 0.4;
  const SPEED_Y = opts.speedY ?? 0.3;

  const COLORS = opts.colors || [
    { r: 223, g: 184, b: 88 },   // Gold
    { r: 255, g: 220, b: 140 },  // Light gold
    { r: 91, g: 181, b: 166 },   // Teal
    { r: 200, g: 230, b: 210 },  // Soft mint
    { r: 255, g: 248, b: 238 },  // Warm white
  ];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  class Particle {
    constructor() { this.reset(); }

    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.size = Math.random() * SIZE_MAX + SIZE_MIN;
      this.speedX = (Math.random() - 0.5) * SPEED_X;
      this.speedY = (Math.random() - 0.5) * SPEED_Y - 0.1;
      this.opacity = 0;
      this.targetOpacity = Math.random() * 0.6 + 0.2;
      this.fadeSpeed = Math.random() * 0.008 + 0.003;
      this.fadeDirection = 1;
      this.life = 0;
      this.maxLife = Math.random() * 600 + 200;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.life++;

      // Gentle floating oscillation
      this.x += Math.sin(this.life * 0.02) * 0.2;

      // Fade in/out cycle
      if (this.fadeDirection === 1) {
        this.opacity += this.fadeSpeed;
        if (this.opacity >= this.targetOpacity) {
          this.fadeDirection = -1;
        }
      } else {
        this.opacity -= this.fadeSpeed;
        if (this.opacity <= 0) {
          this.reset();
        }
      }

      // Reset if off screen or life expired
      if (this.life > this.maxLife || this.x < -20 || this.x > width + 20 || this.y < -20 || this.y > height + 20) {
        this.reset();
      }
    }

    draw() {
      const { r, g, b } = this.color;
      const alpha = Math.max(0, this.opacity);

      // Core dot
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.fill();

      // Soft glow
      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * GLOW_MULT);
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 0.3})`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * GLOW_MULT, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  }

  // Initialize particles with staggered start
  for (let i = 0; i < COUNT; i++) {
    const p = new Particle();
    p.life = Math.random() * 200;
    particles.push(p);
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animate);
  }
  animate();
}

/* ─── Navbar Scroll Effect ─────────────────────────────────────────── 
   Adds/removes .scrolled class on the navbar based on scroll position.
   @param {number} [threshold=80] - Scroll pixels before triggering
   ─────────────────────────────────────────────────────────────────── */
function initNavbar(threshold = 80) {
  const navbar = document.getElementById("navbar");
  if (!navbar) return;

  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (window.scrollY > threshold) {
          navbar.classList.add("scrolled");
        } else {
          navbar.classList.remove("scrolled");
        }
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll(); // Initial check
}

/* ─── Mobile Navigation Toggle ─────────────────────────────────────── */
function initMobileNav() {
  const toggle = document.getElementById("mobile-toggle");
  const navLinks = document.getElementById("nav-links");

  if (!toggle || !navLinks) return;

  toggle.addEventListener("click", () => {
    toggle.classList.toggle("active");
    navLinks.classList.toggle("open");
    document.body.style.overflow = navLinks.classList.contains("open") ? "hidden" : "";
  });

  // Close menu on link click
  navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      toggle.classList.remove("active");
      navLinks.classList.remove("open");
      document.body.style.overflow = "";
    });
  });
}

/* ─── Scroll Reveal (Intersection Observer) ────────────────────────── 
   Reveals elements with .scroll-reveal class as they enter viewport.
   Supports data-delay attribute for staggered animations.
   @param {Object} [opts] - IntersectionObserver options
   @param {number} [opts.threshold=0.15]
   @param {string} [opts.rootMargin='0px 0px -60px 0px']
   ─────────────────────────────────────────────────────────────────── */
function initScrollReveal(opts = {}) {
  const revealElements = document.querySelectorAll(".scroll-reveal");
  if (!revealElements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => {
          entry.target.classList.add("revealed");
        }, parseInt(delay));
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: opts.threshold ?? 0.15,
    rootMargin: opts.rootMargin || "0px 0px -60px 0px"
  });

  revealElements.forEach(el => observer.observe(el));
}

/* ─── Hero Parallax ────────────────────────────────────────────────── 
   Applies parallax scrolling effect to the hero background image.
   @param {number} [speed=0.35] - Parallax speed multiplier
   ─────────────────────────────────────────────────────────────────── */
function initParallax(speed = 0.35) {
  const heroBg = document.getElementById("hero-bg");
  if (!heroBg) return;

  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const heroHeight = window.innerHeight;

        // Only apply parallax while hero is in view
        if (scrollY < heroHeight * 1.5) {
          const parallaxOffset = scrollY * speed;
          heroBg.style.transform = `translateY(${parallaxOffset}px) scale(1.05)`;
        }
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
}
