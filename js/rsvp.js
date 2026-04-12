/* ════════════════════════════════════════
   rsvp.js — RSVP interaction & animation
   ════════════════════════════════════════ */

const RSVP = (() => {

  /* ── Ripple effect on button click ── */
  function addRipple(btn) {
    btn.addEventListener('click', function(e) {
      const existing = this.querySelector('.ripple');
      if (existing) existing.remove();

      const circle = document.createElement('span');
      const rect   = this.getBoundingClientRect();
      const size   = Math.max(rect.width, rect.height);
      const x      = e.clientX - rect.left  - size / 2;
      const y      = e.clientY - rect.top   - size / 2;

      Object.assign(circle.style, {
        width:    `${size}px`,
        height:   `${size}px`,
        left:     `${x}px`,
        top:      `${y}px`,
        position: 'absolute',
        borderRadius: '50%',
        background: 'rgba(184,150,110,0.25)',
        transform: 'scale(0)',
        animation: 'rippleAnim 0.55s ease-out forwards',
        pointerEvents: 'none',
      });
      circle.classList.add('ripple');
      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(circle);
    });
  }

  /* ── Inject ripple keyframes once ── */
  function injectRippleStyle() {
    if (document.getElementById('rsvp-ripple-style')) return;
    const style = document.createElement('style');
    style.id = 'rsvp-ripple-style';
    style.textContent = `
      @keyframes rippleAnim {
        to { transform: scale(2.5); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  /* ── Confirmation toast ── */
  function showToast(message) {
    const toast = document.createElement('div');
    Object.assign(toast.style, {
      position:   'fixed',
      bottom:     '40px',
      left:       '50%',
      transform:  'translateX(-50%) translateY(20px)',
      background: 'var(--charcoal)',
      color:      'var(--cream)',
      fontFamily: 'var(--font-caps)',
      fontSize:   '10px',
      letterSpacing: '4px',
      textTransform: 'uppercase',
      padding:    '16px 32px',
      border:     '1px solid rgba(184,150,110,0.4)',
      zIndex:     '9999',
      opacity:    '0',
      transition: 'opacity 0.4s ease, transform 0.4s ease',
      whiteSpace: 'nowrap',
    });
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity   = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(() => {
      toast.style.opacity   = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(() => toast.remove(), 400);
    }, 3200);
  }

  /* ── Handle CTA button ── */
  function bindCTA() {
    const btn = document.querySelector('.rsvp__btn');
    if (!btn) return;

    addRipple(btn);

    btn.addEventListener('click', () => {
      showToast('Thank you — see you on the 13th! 🥂');
    });
  }

  /* ── Magnetic hover on RSVP box ── */
  function initMagnetic() {
    const box = document.querySelector('.rsvp__box');
    if (!box) return;

    box.addEventListener('mousemove', e => {
      const rect = box.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      const dx   = (e.clientX - cx) / rect.width  * 6;
      const dy   = (e.clientY - cy) / rect.height * 4;
      box.style.transform = `perspective(800px) rotateY(${dx}deg) rotateX(${-dy}deg)`;
    });

    box.addEventListener('mouseleave', () => {
      box.style.transform = '';
      box.style.transition = 'transform 0.6s var(--ease-elegant)';
      setTimeout(() => { box.style.transition = ''; }, 600);
    });
  }

  /* ── Init ── */
  function init() {
    injectRippleStyle();
    bindCTA();
    initMagnetic();
  }

  return { init };
})();
