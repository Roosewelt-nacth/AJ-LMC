const Hero = (() => {
  const PARTICLE_COUNT = 24;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const state = {
    scrollY: 0,
    mouseX: 0,
    mouseY: 0
  };

  function qs(selector, scope = document) {
    return scope.querySelector(selector);
  }

  function qsa(selector, scope = document) {
    return Array.from(scope.querySelectorAll(selector));
  }

  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  function spawnParticles() {
    const hero = qs('.hero');
    if (!hero || prefersReducedMotion) return;

    qsa('.hero__particle', hero).forEach(el => el.remove());

    const colors = [
      'rgba(198, 165, 107, 0.55)',
      'rgba(226, 199, 157, 0.48)',
      'rgba(216, 167, 175, 0.3)',
      'rgba(255, 255, 255, 0.24)'
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const dot = document.createElement('div');
      const size = random(1.2, 4.8);
      const x = random(2, 98);
      const y = random(4, 40);
      const delay = random(0, 8);
      const duration = random(6, 12);
      const blur = random(0, 1.2);
      const color = colors[Math.floor(Math.random() * colors.length)];

      dot.className = 'hero__particle';

      Object.assign(dot.style, {
        width: `${size}px`,
        height: `${size}px`,
        left: `${x}%`,
        bottom: `${y}%`,
        '--duration': `${duration}s`,
        '--delay': `${delay}s`,
        opacity: `${random(0.12, 0.48)}`,
        filter: `blur(${blur}px)`,
        background: color
      });

      hero.appendChild(dot);
    }
  }

  function applyTransforms() {
    const hero = qs('.hero');
    const content = qs('.hero__content');
    const grain = qs('.hero__grain');
    const glowOne = qs('.hero__glow--one');
    const glowTwo = qs('.hero__glow--two');

    if (!hero || !content) return;

    const y = state.scrollY;
    const mx = state.mouseX;
    const my = state.mouseY;

    content.style.transform = `translate3d(${mx * 10}px, ${y + my * 6}px, 0)`;
    content.style.opacity = `${Math.max(0.72, 1 - state.scrollY / 90)}`;

    if (grain) {
      grain.style.transform = `translate3d(${mx * 2}px, ${y * 0.55}px, 0)`;
    }

    if (glowOne) {
      glowOne.style.transform = `translate3d(${mx * 18 + y * 0.3}px, ${my * 14 - y * 0.25}px, 0) scale(${1 + y / 700})`;
    }

    if (glowTwo) {
      glowTwo.style.transform = `translate3d(${mx * -20 - y * 0.25}px, ${my * -16 + y * 0.3}px, 0) scale(${1 + y / 650})`;
    }
  }

  function initScrollParallax() {
    const hero = qs('.hero');
    if (!hero || prefersReducedMotion) return;

    let ticking = false;

    const update = () => {
      const rect = hero.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const progress = Math.min(Math.max(-rect.top / vh, 0), 1);
      state.scrollY = progress * 28;
      applyTransforms();
      ticking = false;
    };

    window.addEventListener(
      'scroll',
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
      },
      { passive: true }
    );

    update();
  }

  function initMouseParallax() {
    const hero = qs('.hero');
    if (!hero || prefersReducedMotion || window.innerWidth < 900) return;

    let rafId = null;

    const render = () => {
      applyTransforms();
      rafId = null;
    };

    hero.addEventListener('mousemove', e => {
      const rect = hero.getBoundingClientRect();
      state.mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 1.2;
      state.mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 1.2;

      if (!rafId) rafId = requestAnimationFrame(render);
    });

    hero.addEventListener('mouseleave', () => {
      state.mouseX = 0;
      state.mouseY = 0;
      if (!rafId) rafId = requestAnimationFrame(render);
    });
  }

  function animateCorners() {
    const corners = qsa('.hero__corner');
    if (!corners.length) return;

    if (window.gsap && !prefersReducedMotion) {
      gsap.set(corners, { opacity: 0, scale: 0.94 });
      gsap.to(corners, {
        opacity: (_, target) => {
          if (window.innerWidth <= 640) return 0.24;
          if (window.innerWidth <= 900) return 0.28;
          return 0.38;
        },
        scale: 1,
        duration: 1.2,
        ease: 'power3.out',
        stagger: 0.1,
        delay: 0.25
      });
      return;
    }

    corners.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform += ' scale(0.94)';
      el.style.transition = `opacity 1s ease ${0.2 + i * 0.1}s, transform 1s ease ${0.2 + i * 0.1}s`;
      requestAnimationFrame(() => {
        el.style.opacity = window.innerWidth <= 640 ? '0.24' : window.innerWidth <= 900 ? '0.28' : '0.38';
        el.style.transform = el.style.transform.replace(' scale(0.94)', '') + ' scale(1)';
      });
    });
  }

  function animateHeroIntro() {
    const label = qs('.hero__label');
    const names = qs('.hero__names');
    const divider = qs('.hero__divider');
    const eventTag = qs('.hero__event-tag');
    const eventTitle = qs('.hero__event-title');
    const dates = qsa('.hero__date, .hero__date--sub');
    const scroll = qs('.hero__scroll');

    if (window.gsap && !prefersReducedMotion) {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        label,
        { opacity: 0, y: 22 },
        { opacity: 0.92, y: 0, duration: 0.8 },
        0.1
      )
        .fromTo(
          names,
          { opacity: 0, y: 32, scale: 0.985 },
          { opacity: 1, y: 0, scale: 1, duration: 1 },
          0.2
        )
        .fromTo(
          divider,
          { opacity: 0, scaleX: 0.82 },
          { opacity: 1, scaleX: 1, duration: 0.8 },
          0.55
        )
        .fromTo(
          [eventTag, eventTitle, ...dates],
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.8, stagger: 0.08 },
          0.7
        )
        .fromTo(
          scroll,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.7 },
          1.2
        );

      return;
    }

    [label, names, divider, eventTag, eventTitle, ...dates, scroll].forEach((el, i) => {
      if (!el) return;
      el.style.opacity = '0';
      el.style.transform = 'translateY(18px)';
      el.style.transition = `opacity 0.8s ease ${0.12 + i * 0.08}s, transform 0.8s ease ${0.12 + i * 0.08}s`;
      requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
    });
  }

  function init() {
    spawnParticles();
    animateCorners();
    animateHeroIntro();
    initScrollParallax();
    initMouseParallax();
  }

  return { init };
})();