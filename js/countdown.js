/* ════════════════════════════════════════════════════
   countdown.js — Live countdown to the wedding date
   ════════════════════════════════════════════════════ */

const Countdown = (() => {
  // ── Target date: 13 June 2025, 18:00 IST (UTC+5:30) ──
  const TARGET = new Date('2025-06-13T18:00:00+05:30');

  const els = {
    days:    null,
    hours:   null,
    minutes: null,
    seconds: null,
  };

  let interval = null;

  /* ── Compute remaining time ── */
  function getRemaining() {
    const now   = new Date();
    const delta = TARGET - now;

    if (delta <= 0) return null; // event passed

    const totalSecs = Math.floor(delta / 1000);
    return {
      days:    Math.floor(totalSecs / 86400),
      hours:   Math.floor((totalSecs % 86400) / 3600),
      minutes: Math.floor((totalSecs % 3600) / 60),
      seconds: totalSecs % 60,
    };
  }

  /* ── Pad to 2 digits ── */
  const pad = n => String(n).padStart(2, '0');

  /* ── Flip animation helper ── */
  function flip(el, value) {
    if (!el) return;
    const next = pad(value);
    if (el.textContent === next) return;        // no change, skip

    el.classList.remove('flip');
    void el.offsetWidth;                         // force reflow
    el.classList.add('flip');
    el.textContent = next;
  }

  /* ── Update DOM ── */
  function tick() {
    const t = getRemaining();
    if (!t) {
      clearInterval(interval);
      // Show "Today!" state
      Object.values(els).forEach(el => {
        if (el) { el.textContent = '00'; el.classList.add('flip'); }
      });
      const strip = document.querySelector('.details__countdown');
      if (strip) {
        strip.insertAdjacentHTML(
          'beforeend',
          `<p class="countdown__over">Today is the day! 🎉</p>`
        );
      }
      return;
    }

    flip(els.days,    t.days);
    flip(els.hours,   t.hours);
    flip(els.minutes, t.minutes);
    flip(els.seconds, t.seconds);
  }

  /* ── Build countdown HTML ── */
  function buildHTML() {
    return `
      <div class="details__countdown reveal">
        <div class="countdown-unit">
          <span class="countdown-unit__number" id="cd-days">--</span>
          <span class="countdown-unit__label">Days</span>
        </div>
        <span class="countdown-sep" aria-hidden="true">:</span>
        <div class="countdown-unit">
          <span class="countdown-unit__number" id="cd-hours">--</span>
          <span class="countdown-unit__label">Hours</span>
        </div>
        <span class="countdown-sep" aria-hidden="true">:</span>
        <div class="countdown-unit">
          <span class="countdown-unit__number" id="cd-mins">--</span>
          <span class="countdown-unit__label">Minutes</span>
        </div>
        <span class="countdown-sep" aria-hidden="true">:</span>
        <div class="countdown-unit">
          <span class="countdown-unit__number" id="cd-secs">--</span>
          <span class="countdown-unit__label">Seconds</span>
        </div>
      </div>`;
  }

  /* ── Init ── */
  function init() {
    const grid = document.querySelector('.details__grid');
    if (!grid) return;

    grid.insertAdjacentHTML('afterend', buildHTML());

    els.days    = document.getElementById('cd-days');
    els.hours   = document.getElementById('cd-hours');
    els.minutes = document.getElementById('cd-mins');
    els.seconds = document.getElementById('cd-secs');

    tick();                          // immediate first render
    interval = setInterval(tick, 1000);
  }

  return { init };
})();
