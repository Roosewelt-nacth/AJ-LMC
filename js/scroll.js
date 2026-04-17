const ScrollReveal = (() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function qs(selector, scope = document) {
    return scope.querySelector(selector);
  }

  function qsa(selector, scope = document) {
    return Array.from(scope.querySelectorAll(selector));
  }

  function initReveal() {
    const targets = qsa('.reveal, .reveal-stagger');
    if (!targets.length) return;

    if (prefersReducedMotion) {
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

  function parseEventDate(rawTime) {
    const date = new Date(`June 13, 2025 ${rawTime}`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function initTimelineHighlight() {
    const items = qsa('.timeline__item');
    if (!items.length) return;

    const now = new Date();
    const eventDayStart = new Date('2025-06-13T00:00:00');
    const eventDayEnd = new Date('2025-06-13T23:59:59');

    if (now < eventDayStart || now > eventDayEnd) return;

    let activeAssigned = false;

    items.forEach(item => {
      const timeEl = qs('.timeline__time', item);
      if (!timeEl) return;

      const date = parseEventDate(timeEl.textContent.trim());
      if (!date) return;

      if (date.getTime() <= now.getTime()) {
        item.classList.add('is-past');
      } else if (!activeAssigned) {
        item.classList.add('is-active');
        activeAssigned = true;
      }
    });

    if (!activeAssigned) {
      const lastItem = items[items.length - 1];
      if (lastItem) lastItem.classList.add('is-active');
    }
  }

  function getOffset() {
    const nav = qs('.topnav');
    if (!nav) return 24;
    return nav.offsetHeight + 22;
  }

  function scrollToTarget(el) {
    const top = el.getBoundingClientRect().top + window.pageYOffset - getOffset();
    window.scrollTo({
      top,
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
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
        scrollToTarget(target);

        history.replaceState(null, '', `#${id}`);
      });
    });
  }

  function initNavFade() {
    const nav = qs('.topnav');
    const navInner = qs('.topnav__inner');
    if (!nav || !navInner) return;

    const update = () => {
      const scrolled = window.scrollY > 24;
      navInner.style.background = scrolled
        ? 'rgba(255, 255, 255, 0.72)'
        : 'rgba(255, 255, 255, 0.5)';
      navInner.style.boxShadow = scrolled
        ? '0 16px 40px rgba(30, 23, 20, 0.12)'
        : '0 12px 30px rgba(30, 23, 20, 0.08)';
      navInner.style.borderColor = scrolled
        ? 'rgba(198, 165, 107, 0.2)'
        : 'rgba(255, 255, 255, 0.42)';
      navInner.style.transform = scrolled ? 'translateY(0)' : 'translateY(0)';
    };

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  function initActiveNavLink() {
    const links = qsa('.topnav__links a');
    if (!links.length) return;

    const map = links
      .map(link => {
        const href = link.getAttribute('href') || '';
        const id = href.startsWith('#') ? href.slice(1) : '';
        const section = id ? document.getElementById(id) : null;
        return section ? { link, section } : null;
      })
      .filter(Boolean);

    if (!map.length) return;

    const setActive = activeId => {
      map.forEach(({ link, section }) => {
        const active = section.id === activeId;
        link.style.color = active ? 'var(--gold-dark)' : '';
        link.style.opacity = active ? '1' : '';
      });
    };

    const io = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length) {
          setActive(visible[0].target.id);
        }
      },
      {
        threshold: [0.2, 0.4, 0.6],
        rootMargin: '-20% 0px -55% 0px'
      }
    );

    map.forEach(({ section }) => io.observe(section));
  }

  function init() {
    initReveal();
    initTimelineHighlight();
    initSmoothScroll();
    initNavFade();
    initActiveNavLink();
  }

  return { init };
})();