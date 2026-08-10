/**
 * Story photo carousel
 * - Swipe / drag to change slides
 * - Small dots overlaid on the image
 * - Auto-rotates when 2+ slides exist
 * - Pauses on interaction / reduced motion
 */
const StoryCarousel = (() => {
  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function initOne(root) {
    if (!root) return;

    const viewport = root.querySelector('.story-carousel__viewport');
    const track = root.querySelector('.story-carousel__track');
    const slides = Array.from(root.querySelectorAll('.story-carousel__slide'));
    const dotsWrap = root.querySelector('.story-carousel__dots');

    if (!viewport || !track || slides.length === 0) return;

    let index = Math.max(
      0,
      slides.findIndex(slide => slide.classList.contains('is-active'))
    );
    if (index < 0) index = 0;

    const intervalMs = Number(root.dataset.interval) || 5000;
    let timer = null;
    let paused = false;

    // Pointer / swipe state
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let deltaX = 0;
    let isDragging = false;
    let lockAxis = null; // 'x' | 'y'

    function goTo(nextIndex) {
      if (!slides.length) return;

      const total = slides.length;
      index = ((nextIndex % total) + total) % total;

      slides.forEach((slide, i) => {
        const active = i === index;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      });

      if (dotsWrap) {
        Array.from(dotsWrap.children).forEach((dot, i) => {
          const active = i === index;
          dot.classList.toggle('is-active', active);
          dot.setAttribute('aria-selected', active ? 'true' : 'false');
        });
      }
    }

    function next() {
      goTo(index + 1);
    }

    function prev() {
      goTo(index - 1);
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function start() {
      stop();
      if (slides.length < 2 || paused || prefersReducedMotion()) return;
      timer = setInterval(next, intervalMs);
    }

    function pause() {
      paused = true;
      stop();
    }

    function resume() {
      paused = false;
      start();
    }

    // Single slide: hide dots, no swipe needed
    if (slides.length < 2) {
      if (dotsWrap) dotsWrap.hidden = true;
      viewport.style.cursor = 'default';
      goTo(0);
      return;
    }

    if (dotsWrap) {
      dotsWrap.hidden = false;
      dotsWrap.innerHTML = '';

      slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'story-carousel__dot' + (i === index ? ' is-active' : '');
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', `Show photo ${i + 1}`);
        dot.setAttribute('aria-selected', i === index ? 'true' : 'false');
        dot.addEventListener('click', event => {
          event.stopPropagation();
          goTo(i);
          stop();
          start();
        });
        dotsWrap.appendChild(dot);
      });
    }

    function onPointerDown(event) {
      // Ignore secondary buttons / multi-touch
      if (event.button != null && event.button !== 0) return;
      if (pointerId !== null) return;

      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      deltaX = 0;
      isDragging = false;
      lockAxis = null;

      try {
        viewport.setPointerCapture(pointerId);
      } catch (_) {}

      pause();
    }

    function onPointerMove(event) {
      if (pointerId === null || event.pointerId !== pointerId) return;

      const dx = event.clientX - startX;
      const dy = event.clientY - startY;

      if (!lockAxis) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        lockAxis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      }

      // Vertical intent — let the page scroll
      if (lockAxis === 'y') return;

      event.preventDefault();
      deltaX = dx;

      if (!isDragging && Math.abs(deltaX) > 8) {
        isDragging = true;
        viewport.classList.add('is-dragging');
      }
    }

    function onPointerUp(event) {
      if (pointerId === null || event.pointerId !== pointerId) return;

      const threshold = Math.min(72, viewport.clientWidth * 0.18);

      if (isDragging && Math.abs(deltaX) > threshold) {
        if (deltaX < 0) next();
        else prev();
      }

      try {
        viewport.releasePointerCapture(pointerId);
      } catch (_) {}

      pointerId = null;
      deltaX = 0;
      isDragging = false;
      lockAxis = null;
      viewport.classList.remove('is-dragging');

      resume();
    }

    function onPointerCancel(event) {
      if (pointerId === null || event.pointerId !== pointerId) return;
      pointerId = null;
      deltaX = 0;
      isDragging = false;
      lockAxis = null;
      viewport.classList.remove('is-dragging');
      resume();
    }

    viewport.addEventListener('pointerdown', onPointerDown);
    viewport.addEventListener('pointermove', onPointerMove);
    viewport.addEventListener('pointerup', onPointerUp);
    viewport.addEventListener('pointercancel', onPointerCancel);

    // Keyboard: left / right when focused
    viewport.setAttribute('tabindex', '0');
    viewport.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        prev();
        stop();
        start();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        next();
        stop();
        start();
      }
    });

    // Pause when tab is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else if (!paused) start();
    });

    goTo(index);
    start();
  }

  function init() {
    document.querySelectorAll('.story-carousel').forEach(initOne);
  }

  return { init };
})();
