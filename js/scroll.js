/* ═══════════════════════════════════════════════════════
   scroll.js — IntersectionObserver reveal + timeline
   ═══════════════════════════════════════════════════════ */

const ScrollReveal = (() => {

  /* ── Generic reveal observer ── */
  function initReveal() {
    const targets = document.querySelectorAll('.reveal, .reveal-stagger');

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    });

    targets.forEach(el => io.observe(el));
  }

  /* ── Timeline active-state based on event time ── */
  function initTimelineHighlight() {
    const items = document.querySelectorAll('.timeline__item');
    if (!items.length) return;

    // Parse times from data attributes
    const now    = new Date();
    const today  = now.toDateString();
    const target = new Date('2025-06-13').toDateString();

    if (today !== target) return; // only highlight on the day

    items.forEach(item => {
      const timeEl = item.querySelector('.timeline__time');
      if (!timeEl) return;

      const raw  = timeEl.textContent.trim();   // e.g. "6:30 PM"
      const date = new Date(`Jun 13 2025 ${raw} IST`);

      if (date < now) {
        item.classList.add('is-past');
      } else if (!document.querySelector('.timeline__item.is-active')) {
        item.classList.add('is-active');        // first upcoming
      }
    });
  }

  /* ── Smooth scroll for in-page links ── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', e => {
        const id = link.getAttribute('href').slice(1);
        const el = document.getElementById(id);
        if (!el) return;
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* ── Sticky nav opacity on scroll ── */
  function initNavFade() {
    const nav = document.querySelector('.nav');
    if (!nav) return;

    window.addEventListener('scroll', () => {
      nav.style.background = window.scrollY > 60
        ? 'rgba(18,14,8,0.9)'
        : 'transparent';
    }, { passive: true });
  }

  /* ── Init all ── */
  function init() {
    initReveal();
    initTimelineHighlight();
    initSmoothScroll();
    initNavFade();
  }

  return { init };
})();
