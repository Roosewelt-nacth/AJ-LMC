const Countdown = (() => {
  const els = {
    days: null,
    hours: null,
    minutes: null,
    seconds: null
  };

  let interval = null;
  let targetDate = null;

  function getTargetDate() {
    const detailsSection = document.querySelector('.details');
    const raw = detailsSection?.dataset?.eventDate;

    if (!raw) return null;

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return null;

    return parsed;
  }

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function getRemaining() {
    if (!targetDate) return null;

    const now = new Date();
    const delta = targetDate.getTime() - now.getTime();

    if (delta <= 0) return null;

    const totalSeconds = Math.floor(delta / 1000);

    return {
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60
    };
  }

  function animateValue(el, value) {
    if (!el) return;

    const next = pad(value);
    if (el.textContent === next) return;

    el.classList.remove('flip');
    void el.offsetWidth;
    el.classList.add('flip');
    el.textContent = next;
  }

  function setCompletedState(strip) {
    Object.values(els).forEach(el => {
      if (!el) return;
      el.textContent = '00';
      el.classList.add('flip');
    });

    if (!strip) return;

    const existing = strip.querySelector('.countdown-complete');
    if (existing) return;

    strip.insertAdjacentHTML(
      'beforeend',
      `
        <div class="countdown-complete" aria-live="polite">
          <span class="countdown-complete__label">The Celebration Has Begun</span>
        </div>
      `
    );
  }

  function removeCompletedState(strip) {
    if (!strip) return;
    const existing = strip.querySelector('.countdown-complete');
    if (existing) existing.remove();
  }

  function tick() {
    const strip = document.querySelector('.details__countdown');
    const remaining = getRemaining();

    if (!remaining) {
      clearInterval(interval);
      setCompletedState(strip);
      return;
    }

    removeCompletedState(strip);

    animateValue(els.days, remaining.days);
    animateValue(els.hours, remaining.hours);
    animateValue(els.minutes, remaining.minutes);
    animateValue(els.seconds, remaining.seconds);
  }

  function buildHTML() {
    return `
      <div class="details__countdown reveal" aria-label="Countdown to the engagement ceremony">
        <div class="countdown-unit">
          <span class="countdown-unit__number" id="cd-days">00</span>
          <span class="countdown-unit__label">Days</span>
        </div>
        <div class="countdown-sep" aria-hidden="true">:</div>
        <div class="countdown-unit">
          <span class="countdown-unit__number" id="cd-hours">00</span>
          <span class="countdown-unit__label">Hours</span>
        </div>
        <div class="countdown-sep" aria-hidden="true">:</div>
        <div class="countdown-unit">
          <span class="countdown-unit__number" id="cd-mins">00</span>
          <span class="countdown-unit__label">Minutes</span>
        </div>
        <div class="countdown-sep" aria-hidden="true">:</div>
        <div class="countdown-unit">
          <span class="countdown-unit__number" id="cd-secs">00</span>
          <span class="countdown-unit__label">Seconds</span>
        </div>
      </div>
    `;
  }

  function init() {
    const grid = document.querySelector('.details__grid');
    if (!grid) return;

    targetDate = getTargetDate();

    const existing = document.querySelector('.details__countdown');
    if (existing) existing.remove();

    grid.insertAdjacentHTML('afterend', buildHTML());

    els.days = document.getElementById('cd-days');
    els.hours = document.getElementById('cd-hours');
    els.minutes = document.getElementById('cd-mins');
    els.seconds = document.getElementById('cd-secs');

    if (!targetDate) {
      const strip = document.querySelector('.details__countdown');
      if (strip) {
        strip.insertAdjacentHTML(
          'beforeend',
          `
            <div class="countdown-complete" aria-live="polite">
              <span class="countdown-complete__label">Set data-event-date in .details</span>
            </div>
          `
        );
      }
      return;
    }

    tick();
    interval = setInterval(tick, 1000);
  }

  return { init };
})();