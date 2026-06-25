/* ══════════════════════════════════════════════════════════════════════
   Angel's Sword RPG: The Lyrian Chronicles — Landing Page Engine
   Particle system, parallax, scroll reveals, and interactive effects
   ══════════════════════════════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {
  initParticles();
  initNavbar();
  initParallax();
  initScrollReveal();
  initMobileNav();
  initSpriteInteraction();
});

/* ─── Particle System (Fireflies & Magic Dust) ───────────────────── */
function initParticles() {
  const canvas = document.getElementById("particle-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let width, height;
  let particles = [];
  const PARTICLE_COUNT = 60;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.size = Math.random() * 3 + 1;
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.speedY = (Math.random() - 0.5) * 0.3 - 0.1;
      this.opacity = 0;
      this.targetOpacity = Math.random() * 0.6 + 0.2;
      this.fadeSpeed = Math.random() * 0.008 + 0.003;
      this.fadeDirection = 1;
      this.life = 0;
      this.maxLife = Math.random() * 600 + 200;

      // Color variety: warm gold, soft teal, white
      const colors = [
        { r: 223, g: 184, b: 88 },   // Gold
        { r: 255, g: 220, b: 140 },   // Light gold
        { r: 91, g: 181, b: 166 },    // Teal
        { r: 200, g: 230, b: 210 },   // Soft mint
        { r: 255, g: 248, b: 238 },   // Warm white
      ];
      this.color = colors[Math.floor(Math.random() * colors.length)];
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
      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 6);
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 0.3})`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 6, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  }

  // Initialize particles
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = new Particle();
    p.life = Math.random() * 200; // Stagger start
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

/* ─── Navbar Scroll Effect ────────────────────────────────────────── */
function initNavbar() {
  const navbar = document.getElementById("navbar");
  if (!navbar) return;

  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (window.scrollY > 80) {
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

/* ─── Hero Parallax ───────────────────────────────────────────────── */
function initParallax() {
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
          const parallaxOffset = scrollY * 0.35;
          heroBg.style.transform = `translateY(${parallaxOffset}px) scale(1.05)`;
        }
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ─── Scroll Reveal (Intersection Observer) ───────────────────────── */
function initScrollReveal() {
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
    threshold: 0.15,
    rootMargin: "0px 0px -60px 0px"
  });

  revealElements.forEach(el => observer.observe(el));
}

/* ─── Mobile Navigation Toggle ────────────────────────────────────── */
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
