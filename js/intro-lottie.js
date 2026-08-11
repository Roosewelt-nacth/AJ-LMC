/**
 * Intro Lottie + SVG envelope controller
 *
 * Priority:
 *  1. lottie/invitation.json  (drop your LottieFiles download here)
 *  2. Built-in brand SVG envelope (always available)
 */
window.IntroLottie = (function () {
  let anim = null;
  let mode = 'svg'; // 'lottie' | 'svg'
  let opening = false;

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  async function tryLoadLottie() {
    const stage = document.getElementById('lottieStage');
    const envelope = document.getElementById('introEnvelope');
    if (!stage || typeof lottie === 'undefined') return false;

    try {
      const res = await fetch('lottie/invitation.json', { cache: 'force-cache' });
      if (!res.ok) return false;
      const data = await res.json();

      stage.hidden = false;
      stage.style.display = 'block';
      if (envelope) envelope.hidden = true;

      anim = lottie.loadAnimation({
        container: stage,
        renderer: 'svg',
        loop: true,
        autoplay: !prefersReducedMotion(),
        animationData: data
      });

      mode = 'lottie';
      return true;
    } catch (err) {
      return false;
    }
  }

  function setupSvgEnvelope() {
    const stage = document.getElementById('lottieStage');
    const envelope = document.getElementById('introEnvelope');
    if (stage) {
      stage.hidden = true;
      stage.style.display = 'none';
    }
    if (envelope) {
      envelope.hidden = false;
      envelope.classList.add('is-ready');
    }
    mode = 'svg';
  }

  /** Called by main.js before revealing the page */
  function playOpen() {
    if (opening) return Promise.resolve();
    opening = true;

    const btn = document.getElementById('introEnter');
    const envelope = document.getElementById('introEnvelope');
    const hint = document.getElementById('introHint');

    if (btn) btn.classList.add('is-opening');
    if (hint) hint.style.opacity = '0';

    if (mode === 'lottie' && anim) {
      try {
        anim.loop = false;
        anim.stop();
        anim.goToAndPlay(0, true);
      } catch (e) { /* ignore */ }
      return new Promise(resolve => {
        window.setTimeout(resolve, prefersReducedMotion() ? 80 : 900);
      });
    }

    // SVG envelope flap open
    if (envelope) envelope.classList.add('is-opening');
    return new Promise(resolve => {
      window.setTimeout(resolve, prefersReducedMotion() ? 80 : 1100);
    });
  }

  async function init() {
    const loaded = await tryLoadLottie();
    if (!loaded) setupSvgEnvelope();
  }

  return { init, playOpen, getMode: () => mode };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (window.IntroLottie) window.IntroLottie.init();
});
