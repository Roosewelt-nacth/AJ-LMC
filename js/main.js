document.addEventListener('DOMContentLoaded', () => {
  hydratePhotoSurfaces();
  softLoadImages();
  bootModules();
  initIntroGate();
  setCurrentYearMeta();
  logSignature();
});

/** Fade story images in once decoded — avoids abrupt pops */
function softLoadImages() {
  document.querySelectorAll('img.couple-story__image').forEach(img => {
    const mark = () => img.classList.add('is-loaded');

    if (img.complete && img.naturalWidth > 0) {
      mark();
      return;
    }

    img.addEventListener('load', mark, { once: true });
    img.addEventListener('error', mark, { once: true });
  });
}

function initIntroGate() {
  const introGate = document.getElementById('introGate');
  const pageShell = document.getElementById('pageShell');
  const body = document.body;
  const enterBtn = document.getElementById('introEnter');

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
  const hasSeenIntro = sessionStorage.getItem('al_intro_seen') === '1';

  const revealImmediately = () => {
    pageShell.classList.remove('is-waiting');
    pageShell.classList.add('is-live');
    introGate.classList.add('is-hidden');
    body.classList.remove('is-locked');
  };

  /** Calm, sequenced handoff from intro → invitation */
  const revealSmoothly = () => {
    // 1) Soften intro content first
    introGate.classList.add('is-exiting');

    // 2) Bring the page in underneath
    requestAnimationFrame(() => {
      pageShell.classList.remove('is-waiting');
      pageShell.classList.add('is-live');
    });

    // 3) After the fade completes, unlock scroll and hide intro fully
    const finish = () => {
      introGate.classList.add('is-hidden');
      body.classList.remove('is-locked');
      introGate.removeEventListener('transitionend', onEnd);
    };

    const onEnd = event => {
      if (event.target === introGate && event.propertyName === 'opacity') {
        finish();
      }
    };

    introGate.addEventListener('transitionend', onEnd);
    // Safety fallback if transitionend doesn't fire
    window.setTimeout(finish, 1200);
  };

  if (prefersReducedMotion || hasSeenIntro) {
    revealImmediately();
    return;
  }

  // Hold the page behind the intro until the guest enters
  body.classList.add('is-locked');
  pageShell.classList.add('is-waiting');
  pageShell.classList.remove('is-live');

  requestAnimationFrame(() => {
    introGate.classList.add('is-ready');
  });

  let started = false;

  const beginIntro = () => {
    if (started) return;
    started = true;

    sessionStorage.setItem('al_intro_seen', '1');
    revealSmoothly();
    detach();
  };

  const onFirstAction = () => beginIntro();

  function detach() {
    window.removeEventListener('click', onFirstAction);
    window.removeEventListener('touchstart', onFirstAction);
    window.removeEventListener('keydown', onFirstAction);
    window.removeEventListener('wheel', onFirstAction);
    if (enterBtn) enterBtn.removeEventListener('click', onFirstAction);
  }

  window.addEventListener('click', onFirstAction, { passive: true, once: true });
  window.addEventListener('touchstart', onFirstAction, { passive: true, once: true });
  window.addEventListener('keydown', onFirstAction, { passive: true, once: true });
  window.addEventListener('wheel', onFirstAction, { passive: true, once: true });

  if (enterBtn) {
    enterBtn.addEventListener('click', onFirstAction);
  }
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

function bootModules() {
  if (typeof Hero !== 'undefined' && Hero && typeof Hero.init === 'function') {
    Hero.init();
  }

  if (typeof Countdown !== 'undefined' && Countdown && typeof Countdown.init === 'function') {
    Countdown.init();
  }

  if (typeof StoryCarousel !== 'undefined' && StoryCarousel && typeof StoryCarousel.init === 'function') {
    StoryCarousel.init();
  }

  if (typeof ScrollReveal !== 'undefined' && ScrollReveal && typeof ScrollReveal.init === 'function') {
    ScrollReveal.init();
  }

  if (typeof RSVP !== 'undefined' && RSVP && typeof RSVP.init === 'function') {
    RSVP.init();
  }

  // Active nav highlighting is owned solely by scroll.js
  enhanceExternalLinks();
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
