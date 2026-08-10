const ScrollReveal = (() => {
  const reducedMotionQuery = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  );

  // Click scroll lock state to prevent wrong active highlights during smooth scrolling
  let isClickScrolling = false;
  let clickScrollTimer = null;

  function prefersReducedMotion() {
    return reducedMotionQuery.matches;
  }

  function qs(selector, scope = document) {
    return scope.querySelector(selector);
  }

  function qsa(selector, scope = document) {
    return Array.from(scope.querySelectorAll(selector));
  }

  function initReveal() {
    const targets = qsa('.reveal, .reveal-stagger');
    if (!targets.length) return;

    if (prefersReducedMotion()) {
      targets.forEach(el => el.classList.add('visible'));
      return;
    }

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -60px 0px'
      }
    );

    targets.forEach(el => io.observe(el));
  }

  function getEventDate() {
    const detailsSection = qs('.details[data-event-date]');
    const rawDate = detailsSection?.dataset.eventDate;

    if (!rawDate) return null;

    const eventDate = new Date(rawDate);
    return Number.isNaN(eventDate.getTime()) ? null : eventDate;
  }

  function parseProgrammeTime(rawTime, eventDate) {
    if (!rawTime || !eventDate) return null;

    const match = rawTime
      .trim()
      .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

    if (!match) return null;

    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const period = match[3].toUpperCase();

    if (hours === 12) hours = 0;
    if (period === 'PM') hours += 12;

    const programmeDate = new Date(eventDate);
    programmeDate.setHours(hours, minutes, 0, 0);

    return programmeDate;
  }

  function initTimelineHighlight() {
    const items = qsa('.timeline__item');
    if (!items.length) return;

    const eventDate = getEventDate();
    if (!eventDate) return;

    const now = new Date();

    const eventDayStart = new Date(eventDate);
    eventDayStart.setHours(0, 0, 0, 0);

    const eventDayEnd = new Date(eventDate);
    eventDayEnd.setHours(23, 59, 59, 999);

    /*
     * Timeline highlighting is shown only on the event date.
     */
    if (
      now.getTime() < eventDayStart.getTime() ||
      now.getTime() > eventDayEnd.getTime()
    ) {
      return;
    }

    let activeAssigned = false;

    items.forEach(item => {
      const timeElement = qs('.timeline__time', item);
      if (!timeElement) return;

      const programmeDate = parseProgrammeTime(
        timeElement.textContent,
        eventDate
      );
      if (!programmeDate) return;

      item.classList.remove('is-past', 'is-active');

      if (programmeDate.getTime() <= now.getTime()) {
        item.classList.add('is-past');
        return;
      }

      if (!activeAssigned) {
        item.classList.add('is-active');
        activeAssigned = true;
      }
    });
  }

  function getOffset() {
    // Navigation is fixed at the bottom on all devices,
    // so only a small top offset is needed for smooth scroll.
    return 24;
  }

  function setActiveNavLink(activeId) {
    const links = qsa('.topnav__links a');
    links.forEach(link => {
      const href = link.getAttribute('href') || '';
      const id = href.startsWith('#') ? href.slice(1) : '';
      if (id === activeId) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function scrollToTarget(element, targetId) {
    const top =
      element.getBoundingClientRect().top +
      window.pageYOffset -
      getOffset();

    // Lock scroll spy during smooth scroll transition
    isClickScrolling = true;
    clearTimeout(clickScrollTimer);

    if (targetId) {
      setActiveNavLink(targetId);
    }

    window.scrollTo({
      top,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth'
    });

    // Re-enable scroll spy after smooth scroll animation completes
    clickScrollTimer = setTimeout(() => {
      isClickScrolling = false;
    }, 800);
  }

  function initSmoothScroll() {
    qsa('a[href^="#"]').forEach(link => {
      link.addEventListener('click', e => {
        const href = link.getAttribute('href');
        if (!href || href === '#') return;

        const id = href.slice(1);
        const target = document.getElementById(id);
        if (!target) return;

        e.preventDefault();
        scrollToTarget(target, id);

        history.replaceState(null, '', `#${id}`);
      });
    });
  }

  function initNavFade() {
    const nav = qs('.topnav');
    if (!nav) return;

    const update = () => {
      if (window.scrollY > 24) {
        nav.classList.add('is-scrolled');
      } else {
        nav.classList.remove('is-scrolled');
      }
    };

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  function clearActiveNavLinks() {
    qsa('.topnav__links a').forEach(link => {
      link.removeAttribute('aria-current');
    });
  }

  function initActiveNavLink() {
    const links = qsa('.topnav__links a');
    if (!links.length) return;

    // Start with no highlight (hero is not a nav item)
    clearActiveNavLinks();

    const map = links
      .map(link => {
        const href = link.getAttribute('href') || '';
        const id = href.startsWith('#') ? href.slice(1) : '';
        const section = id ? document.getElementById(id) : null;
        return section ? { link, section } : null;
      })
      .filter(Boolean);

    if (!map.length) return;

    // Track which observed sections are currently intersecting
    const visibleIds = new Set();

    const io = new IntersectionObserver(
      entries => {
        if (isClickScrolling) return;

        entries.forEach(entry => {
          if (entry.isIntersecting) {
            visibleIds.add(entry.target.id);
          } else {
            visibleIds.delete(entry.target.id);
          }
        });

        // Near the top / hero — clear all highlights
        if (window.scrollY < 80) {
          clearActiveNavLinks();
          return;
        }

        if (!visibleIds.size) {
          clearActiveNavLinks();
          return;
        }

        // Prefer the section closest to the upper third of the viewport
        let bestId = null;
        let bestDistance = Infinity;

        visibleIds.forEach(id => {
          const el = document.getElementById(id);
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const distance = Math.abs(rect.top - window.innerHeight * 0.25);
          if (distance < bestDistance) {
            bestDistance = distance;
            bestId = id;
          }
        });

        if (bestId) {
          setActiveNavLink(bestId);
        }
      },
      {
        // Narrow band through the upper-middle of the viewport
        threshold: [0, 0.15, 0.35, 0.55, 0.75],
        rootMargin: '-15% 0px -50% 0px'
      }
    );

    map.forEach(({ section }) => io.observe(section));

    // Also clear when user scrolls back to the very top
    window.addEventListener(
      'scroll',
      () => {
        if (isClickScrolling) return;
        if (window.scrollY < 80) {
          clearActiveNavLinks();
        }
      },
      { passive: true }
    );
  }

  function initSmartNav() {
    const nav = qs('.topnav');
    if (!nav) return;

    let lastScrollY = window.scrollY;
    const scrollThreshold = 12;

    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;

      // Always show when near the top of the page
      if (currentScrollY <= 60) {
        nav.classList.remove('is-hidden');
      } else if (currentScrollY > lastScrollY + scrollThreshold) {
        // Scrolling down → hide
        nav.classList.add('is-hidden');
      } else if (currentScrollY < lastScrollY - scrollThreshold) {
        // Scrolling up → show
        nav.classList.remove('is-hidden');
      }

      lastScrollY = currentScrollY;
    }, { passive: true });
  }

  function init() {
    initReveal();
    initTimelineHighlight();
    initSmoothScroll();
    initNavFade();
    initActiveNavLink();
    initSmartNav();
  }

  return { init };
})();
