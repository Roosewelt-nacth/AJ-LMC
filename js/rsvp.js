const RSVP = (() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function qs(selector, scope = document) {
    return scope.querySelector(selector);
  }

  function qsa(selector, scope = document) {
    return Array.from(scope.querySelectorAll(selector));
  }

  function injectStyles() {
    if (document.getElementById('rsvp-interaction-style')) return;

    const style = document.createElement('style');
    style.id = 'rsvp-interaction-style';
    style.textContent = `
      @keyframes rsvpRipple {
        to {
          transform: scale(2.8);
          opacity: 0;
        }
      }

      @keyframes rsvpToastIn {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(16px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }

      @keyframes rsvpToastOut {
        from {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        to {
          opacity: 0;
          transform: translateX(-50%) translateY(16px);
        }
      }

      .rsvp-ripple {
        position: absolute;
        border-radius: 50%;
        transform: scale(0);
        pointer-events: none;
        animation: rsvpRipple 0.65s ease-out forwards;
        background: radial-gradient(circle, rgba(255,255,255,0.42) 0%, rgba(198,165,107,0.24) 55%, rgba(198,165,107,0) 72%);
      }

      .rsvp-toast {
        position: fixed;
        left: 50%;
        bottom: 28px;
        transform: translateX(-50%);
        background: rgba(30, 23, 20, 0.94);
        color: var(--pearl);
        border: 1px solid rgba(198, 165, 107, 0.34);
        box-shadow: 0 16px 40px rgba(30, 23, 20, 0.22);
        border-radius: 999px;
        padding: 14px 22px;
        z-index: 9999;
        white-space: nowrap;
        font-family: var(--font-caps);
        font-size: 10px;
        letter-spacing: 3px;
        text-transform: uppercase;
        animation: rsvpToastIn 0.35s ease forwards;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }

      .rsvp-toast.is-hiding {
        animation: rsvpToastOut 0.35s ease forwards;
      }

      @media (max-width: 640px) {
        .rsvp-toast {
          width: calc(100% - 24px);
          text-align: center;
          white-space: normal;
          line-height: 1.7;
          border-radius: 22px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function createRipple(el, event) {
    if (prefersReducedMotion) return;

    const existing = el.querySelector('.rsvp-ripple');
    if (existing) existing.remove();

    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.15;
    const ripple = document.createElement('span');
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.className = 'rsvp-ripple';
    Object.assign(ripple.style, {
      width: `${size}px`,
      height: `${size}px`,
      left: `${x}px`,
      top: `${y}px`
    });

    el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.appendChild(ripple);

    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  }

  function removeExistingToast() {
    qsa('.rsvp-toast').forEach(toast => toast.remove());
  }

  function showToast(message) {
    removeExistingToast();

    const toast = document.createElement('div');
    toast.className = 'rsvp-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = message;

    document.body.appendChild(toast);

    window.setTimeout(() => {
      toast.classList.add('is-hiding');
      window.setTimeout(() => toast.remove(), 350);
    }, 2400);
  }

  function bindActions() {
    const actions = qsa('.rsvp__action');
    if (!actions.length) return;

    actions.forEach(action => {
      action.addEventListener('click', event => {
        createRipple(action, event);

        if (action.classList.contains('rsvp__action--primary')) {
          showToast('Opening RSVP Form');
        } else {
          showToast('Opening WhatsApp');
        }
      });
    });
  }

  function initMagnetic() {
    const box = qs('.rsvp__box');
    if (!box || prefersReducedMotion || window.innerWidth < 900) return;

    let rafId = null;
    let rotateX = 0;
    let rotateY = 0;

    const render = () => {
      box.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
      rafId = null;
    };

    box.addEventListener('mousemove', event => {
      const rect = box.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;

      rotateY = (px - 0.5) * 5.5;
      rotateX = (0.5 - py) * 4.5;

      if (!rafId) rafId = requestAnimationFrame(render);
    });

    box.addEventListener('mouseleave', () => {
      rotateX = 0;
      rotateY = 0;
      box.style.transition = 'transform 0.55s var(--ease-elegant)';
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          box.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
          window.setTimeout(() => {
            box.style.transition = '';
          }, 550);
        });
      }
    });
  }

  function initHoverGlow() {
    const box = qs('.rsvp__box');
    if (!box) return;

    box.addEventListener('mousemove', event => {
      const rect = box.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;

      box.style.background = `
        radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.78) 18%, rgba(253,246,238,0.92) 42%, rgba(253,246,238,0.94) 100%)
      `;
    });

    box.addEventListener('mouseleave', () => {
      box.style.background = 'linear-gradient(180deg, rgba(255, 255, 255, 0.82) 0%, rgba(253, 246, 238, 0.92) 100%)';
    });
  }

  function init() {
    injectStyles();
    bindActions();
    initMagnetic();
    initHoverGlow();
  }

  return { init };
})();