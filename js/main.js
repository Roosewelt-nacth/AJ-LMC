/* ═══════════════════════════════════════════════
   main.js — App entry point, boots all modules
   ═══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Boot sequence ──
  Hero.init();           // particles + parallax  (hero.js)
  ScrollReveal.init();   // reveal + timeline     (scroll.js)
  Countdown.init();      // live countdown        (countdown.js)
  RSVP.init();           // RSVP interactions     (rsvp.js)

  // ── Inject flip animation style for countdown ──
  const style = document.createElement('style');
  style.textContent = `
    @keyframes flipDown {
      0%   { transform: rotateX(0deg);    opacity: 1; }
      50%  { transform: rotateX(-90deg);  opacity: 0; }
      51%  { transform: rotateX(90deg);   opacity: 0; }
      100% { transform: rotateX(0deg);    opacity: 1; }
    }
    .countdown-unit__number.flip {
      animation: flipDown 0.42s ease both;
    }
    .countdown__over {
      font-family: var(--font-display);
      font-style: italic;
      font-size: 22px;
      color: var(--gold);
      margin-top: 24px;
      text-align: center;
      width: 100%;
    }
  `;
  document.head.appendChild(style);

  // ── Console love note ──
  console.log(
    '%c♡ Allwyn & Leena — 13 June 2025 ♡',
    'font-family:Georgia,serif; font-size:18px; color:#b8966e; padding:8px;'
  );
});
