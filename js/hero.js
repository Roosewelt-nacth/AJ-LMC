/* ═══════════════════════════════════════════════════
   hero.js — Floating particles & subtle parallax
   ═══════════════════════════════════════════════════ */

const Hero = (() => {
  const PARTICLE_COUNT = 18;

  /* ── Spawn floating gold particles ── */
  function spawnParticles() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const dot = document.createElement('div');
      dot.className = 'hero__particle';

      const size    = Math.random() * 3 + 1;        // 1–4px
      const x       = Math.random() * 100;           // % horizontal
      const delay   = Math.random() * 8;             // s
      const duration = Math.random() * 6 + 5;        // 5–11s

      Object.assign(dot.style, {
        width:    `${size}px`,
        height:   `${size}px`,
        left:     `${x}%`,
        bottom:   `${Math.random() * 40}%`,
        '--duration': `${duration}s`,
        '--delay':    `${delay}s`,
        opacity:  String(Math.random() * 0.5 + 0.1),
      });

      hero.appendChild(dot);
    }
  }

  /* ── Subtle parallax on scroll ── */
  function initParallax() {
    const content = document.querySelector('.hero__content');
    const grain   = document.querySelector('.hero__grain');
    if (!content) return;

    let ticking = false;

    window.addEventListener('scroll', () => {
      if (ticking) return;
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const vh      = window.innerHeight;

        if (scrollY < vh) {
          const ratio = scrollY / vh;
          content.style.transform = `translateY(${ratio * 40}px)`;
          content.style.opacity   = String(1 - ratio * 1.4);
          if (grain) grain.style.transform = `translateY(${ratio * 20}px)`;
        }

        ticking = false;
      });
      ticking = true;
    }, { passive: true });
  }

  /* ── Animate corner ornaments on load ── */
  function animateCorners() {
    const corners = document.querySelectorAll('.hero__corner');
    corners.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transition = `opacity 1s ease ${0.4 + i * 0.15}s`;
      requestAnimationFrame(() => {
        el.style.opacity = '0.38';
      });
    });
  }

  /* ── Public init ── */
  function init() {
    spawnParticles();
    initParallax();
    animateCorners();
  }

  return { init };
})();
