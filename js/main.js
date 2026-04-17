document.addEventListener('DOMContentLoaded', () => {
  injectGlobalRuntimeStyles();
  hydratePhotoSurfaces();
  bootModules();
  initIntroGate();
  setCurrentYearMeta();
  logSignature();
});

function initIntroGate() {
  const introGate = document.getElementById('introGate');
  const pageShell = document.getElementById('pageShell');
  const body = document.body;

  if (!pageShell) {
    body.classList.remove('is-locked');
    return;
  }

  if (!introGate) {
    pageShell.classList.remove('is-waiting');
    pageShell.classList.add('is-live');
    body.classList.remove('is-locked');
    return;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasSeenIntro = false; //sessionStorage.getItem('al_intro_seen') === '1';

  createIntroPetals(introGate);
  createIntroSparkles(introGate);

  requestAnimationFrame(() => {
    introGate.classList.add('is-ready');
  });

  const revealImmediately = () => {
    pageShell.classList.remove('is-waiting');
    pageShell.classList.add('is-live');
    introGate.classList.add('is-hidden');
    body.classList.remove('is-locked');
  };

  if (prefersReducedMotion || hasSeenIntro) {
    revealImmediately();
    return;
  }

  let started = false;

  const beginIntro = () => {
    if (started) return;
    started = true;

    sessionStorage.setItem('al_intro_seen', '1');

    if (window.gsap) {
      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        onStart: () => {
          pageShell.classList.remove('is-waiting');
          pageShell.classList.add('is-live');
        },
        onComplete: () => {
          introGate.classList.add('is-hidden');
          body.classList.remove('is-locked');
        }
      });

      tl.to('.intro-gate__text', {
        opacity: 0,
        y: -10,
        duration: 0.28
      })
        .to('.intro-gate__title', {
          opacity: 0,
          y: -14,
          duration: 0.35
        }, 0.03)
        .to('.intro-gate__divider', {
          opacity: 0,
          scaleX: 0.86,
          duration: 0.34
        }, 0.06)
        .to('.intro-gate__monogram', {
          opacity: 0,
          y: -18,
          scale: 1.03,
          duration: 0.42,
          ease: 'power3.inOut'
        }, 0.08)
        .to('.intro-gate__petal, .intro-gate__sparkle', {
          opacity: 0,
          duration: 0.3,
          stagger: 0.005
        }, 0.1)
        .fromTo(pageShell, {
          opacity: 0,
          scale: 1.02,
          filter: 'blur(8px)'
        }, {
          opacity: 1,
          scale: 1,
          filter: 'blur(0px)',
          duration: 0.8,
          ease: 'power2.out'
        }, 0.14)
        .to('.intro-gate__bg', {
          scale: 1.08,
          opacity: 0,
          duration: 0.9,
          ease: 'power2.inOut'
        }, 0.18)
        .to('#introGate', {
          opacity: 0,
          duration: 0.82,
          ease: 'power2.inOut'
        }, 0.2);
    } else {
      revealImmediately();
    }

    detach();
  };

  const onFirstAction = () => beginIntro();

  function detach() {
    window.removeEventListener('click', onFirstAction);
    window.removeEventListener('touchstart', onFirstAction);
    window.removeEventListener('keydown', onFirstAction);
    window.removeEventListener('wheel', onFirstAction);
  }

  window.addEventListener('click', onFirstAction, { passive: true, once: true });
  window.addEventListener('touchstart', onFirstAction, { passive: true, once: true });
  window.addEventListener('keydown', onFirstAction, { passive: true, once: true });
  window.addEventListener('wheel', onFirstAction, { passive: true, once: true });
}

function hydratePhotoSurfaces() {
  const introGate = document.getElementById('introGate');
  const introBg = document.querySelector('.intro-gate__bg');

  if (introGate && introGate.dataset.photo && introBg) {
    introBg.style.backgroundImage = `
      linear-gradient(180deg, rgba(30, 23, 20, 0.18) 0%, rgba(30, 23, 20, 0.38) 100%),
      url("${introGate.dataset.photo}")
    `;
    introBg.style.backgroundSize = 'cover';
    introBg.style.backgroundPosition = 'center';
    introBg.style.backgroundRepeat = 'no-repeat';
  }

  document.querySelectorAll('.couple-story__image[data-photo]').forEach(el => {
    const photo = el.dataset.photo;
    if (!photo) return;

    el.style.backgroundImage = `
      linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02)),
      url("${photo}")
    `;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
    el.style.backgroundRepeat = 'no-repeat';
  });
}

function createIntroPetals(introGate) {
  if (!introGate || introGate.querySelector('.intro-gate__petal')) return;

  const petalCount = 18;
  const colors = [
    'rgba(243, 217, 220, 0.85)',
    'rgba(239, 211, 216, 0.82)',
    'rgba(255, 245, 247, 0.9)',
    'rgba(226, 199, 157, 0.5)'
  ];

  for (let i = 0; i < petalCount; i++) {
    const petal = document.createElement('span');
    petal.className = 'intro-gate__petal';

    const size = random(10, 22);
    const left = random(0, 100);
    const delay = random(0, 8);
    const duration = random(8, 16);
    const rotate = random(-40, 40);
    const drift = random(-80, 80);
    const color = colors[Math.floor(Math.random() * colors.length)];

    Object.assign(petal.style, {
      width: `${size}px`,
      height: `${size * 0.72}px`,
      left: `${left}%`,
      top: `${random(-20, 20)}%`,
      opacity: `${random(0.3, 0.75)}`,
      background: color,
      '--intro-delay': `${delay}s`,
      '--intro-duration': `${duration}s`,
      '--intro-rotate': `${rotate}deg`,
      '--intro-drift': `${drift}px`
    });

    introGate.appendChild(petal);
  }
}

function createIntroSparkles(introGate) {
  if (!introGate || introGate.querySelector('.intro-gate__sparkle')) return;

  const sparkleCount = 26;

  for (let i = 0; i < sparkleCount; i++) {
    const sparkle = document.createElement('span');
    sparkle.className = 'intro-gate__sparkle';

    const size = random(2, 5);
    const left = random(4, 96);
    const top = random(10, 92);
    const delay = random(0, 6);
    const duration = random(2.8, 5.5);

    Object.assign(sparkle.style, {
      width: `${size}px`,
      height: `${size}px`,
      left: `${left}%`,
      top: `${top}%`,
      opacity: `${random(0.18, 0.55)}`,
      '--sparkle-delay': `${delay}s`,
      '--sparkle-duration': `${duration}s`
    });

    introGate.appendChild(sparkle);
  }
}

function bootModules() {
  if (typeof Hero !== 'undefined' && Hero && typeof Hero.init === 'function') Hero.init();
  if (typeof ScrollReveal !== 'undefined' && ScrollReveal && typeof ScrollReveal.init === 'function') ScrollReveal.init();
  if (typeof Countdown !== 'undefined' && Countdown && typeof Countdown.init === 'function') Countdown.init();
  if (typeof RSVP !== 'undefined' && RSVP && typeof RSVP.init === 'function') RSVP.init();

  enhanceNavAccessibility();
  enhanceExternalLinks();
}

function injectGlobalRuntimeStyles() {
  if (document.getElementById('app-runtime-style')) return;

  const style = document.createElement('style');
  style.id = 'app-runtime-style';
  style.textContent = `
    @keyframes flipDown {
      0% { transform: rotateX(0deg); opacity: 1; }
      50% { transform: rotateX(-90deg); opacity: 0; }
      51% { transform: rotateX(90deg); opacity: 0; }
      100% { transform: rotateX(0deg); opacity: 1; }
    }

    @keyframes introPetalFloat {
      0% {
        transform: translate3d(0, -12vh, 0) rotate(var(--intro-rotate)) scale(0.96);
        opacity: 0;
      }
      12% {
        opacity: 1;
      }
      50% {
        transform: translate3d(calc(var(--intro-drift) * 0.45), 42vh, 0) rotate(calc(var(--intro-rotate) + 80deg)) scale(1);
      }
      100% {
        transform: translate3d(var(--intro-drift), 110vh, 0) rotate(calc(var(--intro-rotate) + 180deg)) scale(0.92);
        opacity: 0;
      }
    }

    @keyframes introSparklePulse {
      0%, 100% {
        opacity: 0.08;
        transform: scale(0.7);
      }
      50% {
        opacity: 0.9;
        transform: scale(1.2);
      }
    }

    .intro-gate__petal {
      position: absolute;
      z-index: 1;
      border-radius: 60% 40% 60% 40%;
      filter: blur(0.2px);
      pointer-events: none;
      animation: introPetalFloat var(--intro-duration, 12s) linear var(--intro-delay, 0s) infinite;
      transform-origin: center center;
      box-shadow: 0 8px 22px rgba(216, 167, 175, 0.16);
    }

    .intro-gate__sparkle {
      position: absolute;
      z-index: 1;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(226,199,157,0.75) 45%, rgba(226,199,157,0) 72%);
      animation: introSparklePulse var(--sparkle-duration, 4s) ease-in-out var(--sparkle-delay, 0s) infinite;
      box-shadow: 0 0 16px rgba(255,255,255,0.22);
    }

    .countdown-unit__number {
      transform-origin: center center;
      transform-style: preserve-3d;
      will-change: transform, opacity;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 88px;
      min-height: 88px;
      padding: 8px 12px;
      border-radius: 24px;
      background: linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(253,246,238,0.84) 100%);
      border: 1px solid rgba(198,165,107,0.18);
      box-shadow: 0 14px 36px rgba(30, 23, 20, 0.07);
    }

    .countdown-unit__number.flip {
      animation: flipDown 0.42s ease both;
    }

    .details__countdown {
      align-items: center !important;
      gap: 16px !important;
      padding: 28px 20px !important;
      background: linear-gradient(180deg, rgba(255,255,255,0.74) 0%, rgba(253,246,238,0.9) 100%) !important;
      border: 1px solid rgba(198,165,107,0.24) !important;
      box-shadow: 0 18px 48px rgba(30, 23, 20, 0.08) !important;
    }

    .countdown-unit__label {
      display: block;
      margin-top: 10px;
      font-size: 10px !important;
      letter-spacing: 4px !important;
      color: var(--gold-dark) !important;
    }

    .countdown-sep {
      font-size: 30px !important;
      opacity: 0.44 !important;
      padding-top: 0 !important;
    }

    .countdown-complete {
      width: 100%;
      text-align: center;
      padding-top: 12px;
    }

    .countdown-complete__label {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-caps);
      font-size: 10px;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: var(--gold-dark);
      padding: 14px 22px;
      border-radius: 999px;
      border: 1px solid rgba(198, 165, 107, 0.24);
      background: rgba(255, 255, 255, 0.72);
      box-shadow: 0 10px 24px rgba(30, 23, 20, 0.06);
    }

    .rsvp__actions {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 16px !important;
      flex-wrap: wrap !important;
      margin-top: 18px !important;
    }

    .rsvp__action {
      position: relative;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      min-width: 228px !important;
      min-height: 54px !important;
      padding: 16px 28px !important;
      border-radius: 999px !important;
      font-family: var(--font-caps) !important;
      font-size: 10px !important;
      letter-spacing: 4px !important;
      text-transform: uppercase !important;
      text-align: center !important;
      line-height: 1.4 !important;
      opacity: 1 !important;
      visibility: visible !important;
      box-shadow: 0 14px 34px rgba(30, 23, 20, 0.1) !important;
      transition: transform 0.3s var(--ease-elegant), box-shadow 0.3s var(--ease-elegant), background 0.3s var(--ease-elegant), color 0.3s var(--ease-elegant), border-color 0.3s var(--ease-elegant) !important;
    }

    .rsvp__action:hover {
      transform: translateY(-2px) !important;
    }

    .rsvp__action--primary {
      background: linear-gradient(180deg, #2d241f 0%, #1e1714 100%) !important;
      color: #fffaf5 !important;
      border: 1px solid rgba(30, 23, 20, 0.95) !important;
      box-shadow: 0 16px 40px rgba(30, 23, 20, 0.22) !important;
    }

    .rsvp__action--primary:hover {
      background: linear-gradient(180deg, #b48a53 0%, #9b7b4f 100%) !important;
      color: #fffdf9 !important;
      border-color: #9b7b4f !important;
    }

    .rsvp__action--secondary {
      background: linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(253,246,238,0.94) 100%) !important;
      color: var(--charcoal) !important;
      border: 1px solid rgba(198,165,107,0.34) !important;
    }

    .rsvp__action--secondary:hover {
      background: linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(250,235,237,0.88) 100%) !important;
      color: var(--gold-dark) !important;
      border-color: rgba(198,165,107,0.56) !important;
      box-shadow: 0 16px 40px rgba(198,165,107,0.14) !important;
    }

    .topnav__links a[aria-current="page"] {
      color: var(--gold-dark);
      opacity: 1;
    }

    @media (max-width: 640px) {
      .countdown-unit__number {
        min-width: 64px;
        min-height: 64px;
        border-radius: 18px;
        padding: 6px 8px;
      }

      .details__countdown {
        gap: 8px !important;
        padding: 18px 10px !important;
      }

      .countdown-sep {
        font-size: 20px !important;
      }

      .rsvp__action {
        width: 100% !important;
        min-width: 0 !important;
        min-height: 52px !important;
        padding: 15px 18px !important;
        letter-spacing: 3px !important;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  `;

  document.head.appendChild(style);
}

function enhanceNavAccessibility() {
  const links = Array.from(document.querySelectorAll('.topnav__links a[href^="#"]'));
  if (!links.length) return;

  const sections = links
    .map(link => {
      const id = link.getAttribute('href').slice(1);
      const section = document.getElementById(id);
      return section ? { link, section } : null;
    })
    .filter(Boolean);

  if (!sections.length) return;

  const setActive = id => {
    sections.forEach(({ link, section }) => {
      if (section.id === id) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  const observer = new IntersectionObserver(
    entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visible.length) {
        setActive(visible[0].target.id);
      }
    },
    {
      threshold: [0.2, 0.45, 0.7],
      rootMargin: '-18% 0px -52% 0px'
    }
  );

  sections.forEach(({ section }) => observer.observe(section));
}

function enhanceExternalLinks() {
  const links = Array.from(document.querySelectorAll('a[href]'));
  links.forEach(link => {
    const href = link.getAttribute('href') || '';
    const isExternal =
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('https://wa.me');

    if (!isExternal) return;

    if (href.startsWith('http')) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

function setCurrentYearMeta() {
  document.documentElement.style.setProperty('--app-ready', '1');
}

function logSignature() {
  console.log(
    '%c♡ Allwyn & Leena — Engagement Ceremony ♡',
    'font-family: Georgia, serif; font-size: 16px; color: #c6a56b; padding: 8px;'
  );
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}