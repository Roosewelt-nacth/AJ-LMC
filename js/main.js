document.addEventListener('DOMContentLoaded', () => {
  hydratePhotoSurfaces();
  softLoadImages();
  initPersonalGreeting();
  initCalendarLink();
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

/**
 * Personal deep links: ?name=Priya or ?to=Priya
 * Shows “Dear Priya,” above the welcome heading.
 */
function initPersonalGreeting() {
  const el = document.getElementById('personalGreeting');
  if (!el) return;

  const params = new URLSearchParams(window.location.search);
  const raw = params.get('name') || params.get('to') || params.get('guest') || '';
  const cleaned = raw.trim().replace(/[<>\"']/g, '').slice(0, 48);

  if (!cleaned) {
    el.hidden = true;
    return;
  }

  // Title-case lightly without forcing ALL CAPS names
  const display = cleaned
    .split(/\s+/)
    .map(part => (part ? part.charAt(0).toUpperCase() + part.slice(1) : ''))
    .join(' ');

  el.textContent = `Dear ${display},`;
  el.hidden = false;
}

/** Build a downloadable .ics for the engagement ceremony */
function initCalendarLink() {
  const link = document.getElementById('addToCalendar');
  const details = document.getElementById('details');
  if (!link || !details) return;

  const iso = details.getAttribute('data-event-date') || '2026-09-13T18:00:00+05:30';
  const start = new Date(iso);
  if (Number.isNaN(start.getTime())) return;

  // 3-hour celebration window
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);

  const stamp = date => {
    // UTC form YYYYMMDDTHHMMSSZ
    return date
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}Z$/, 'Z');
  };

  const venueName =
    document.querySelector('.location__venue-name')?.textContent?.trim() ||
    'Engagement Ceremony — Chennai';

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Allwyn & Leena//Engagement//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `DTSTAMP:${stamp(new Date())}`,
    'UID:allwyn-leena-engagement-2026-09-13@invitation',
    'SUMMARY:Allwyn & Leena — Engagement Ceremony',
    `DESCRIPTION:Engagement celebration of Allwyn Jerold & Leena Maria Celestina.\\nJoin us for an evening of love and blessings.`,
    `LOCATION:${venueName.replace(/\n/g, ' ')}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.setAttribute('download', 'Allwyn-Leena-Engagement.ics');
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

  /** Envelope opens, then fades into the invitation */
  const revealSmoothly = () => {
    if (enterBtn) enterBtn.classList.add('is-opening');

    const envelope = document.getElementById('introEnvelope');
    const hint = document.getElementById('introHint');
    if (envelope) envelope.classList.add('is-opening');
    if (hint) hint.style.opacity = '0';

    const openMs = prefersReducedMotion ? 80 : 1050;

    window.setTimeout(() => {
      introGate.classList.add('is-exiting');

      requestAnimationFrame(() => {
        pageShell.classList.remove('is-waiting');
        pageShell.classList.add('is-live');
      });

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
      window.setTimeout(finish, prefersReducedMotion ? 80 : 850);
    }, openMs);
  };

  if (prefersReducedMotion || hasSeenIntro) {
    revealImmediately();
    return;
  }

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

  const onFirstAction = event => {
    // Only open when interacting with the envelope (or its children)
    if (enterBtn && (event.target === enterBtn || enterBtn.contains(event.target))) {
      beginIntro();
    }
  };

  function detach() {
    if (enterBtn) {
      enterBtn.removeEventListener('click', beginIntro);
      enterBtn.removeEventListener('keydown', onKey);
    }
  }

  function onKey(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      beginIntro();
    }
  }

  if (enterBtn) {
    enterBtn.addEventListener('click', beginIntro);
    enterBtn.addEventListener('keydown', onKey);
  }
}

function hydratePhotoSurfaces() {
  // Reserved for optional photo surfaces — no-op when absent
  const introGate = document.getElementById('introGate');
  const introBg = document.querySelector('.intro-gate__wash');

  if (introGate && introGate.dataset.photo && introBg) {
    introBg.style.backgroundImage = `
      linear-gradient(180deg, rgba(30, 23, 20, 0.18) 0%, rgba(30, 23, 20, 0.38) 100%),
      url("${introGate.dataset.photo}")
    `;
    introBg.style.backgroundSize = 'cover';
    introBg.style.backgroundPosition = 'center';
    introBg.style.backgroundRepeat = 'no-repeat';
  }

  document.querySelectorAll('[data-photo]').forEach(el => {
    if (el.id === 'introGate') return;
    const photo = el.getAttribute('data-photo');
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
      href.startsWith('tel:');

    if (!isExternal) return;
    if (link.hostname && link.hostname === window.location.hostname) return;

    link.setAttribute('rel', 'noopener noreferrer');
    if (!link.getAttribute('target')) {
      link.setAttribute('target', '_blank');
    }
  });
}

function setCurrentYearMeta() {
  const yearEls = document.querySelectorAll('[data-year]');
  const year = String(new Date().getFullYear());
  yearEls.forEach(el => {
    el.textContent = year;
  });
}

function logSignature() {
  if (typeof console !== 'undefined' && console.log) {
    console.log('%cAllwyn & Leena · Engagement 2026', 'color:#7b2636;font-family:serif;font-size:12px;');
  }
}
