/* ERTES — smooth scrolling + nav that adapts to white sections.
   - Lenis gives inertia scrolling (wheel / trackpad). Touch keeps native scrolling.
   - On pages with GSAP ScrollTrigger (careers.html) it is wired into GSAP's ticker so pinned
     and scrubbed animations stay perfectly in sync.
   - In-page links (#roles ...) and "Back to top" glide instead of jumping.
   - Dark nav text while a white ".lt" section is behind the nav.
   - Respects prefers-reduced-motion (no smooth scroll, nav colour still adapts).
   Load order: site.js, (gsap, ScrollTrigger), vendor/lenis.min.js, smooth.js, page script. */
(function () {
  'use strict';
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nav = document.querySelector('nav#nav');
  var lights = $$('.lt');
  var lenis = null;

  /* ---------- nav + cursor colour follow what is behind them ---------- */
  var menu = function () { var m = document.getElementById('mnav'); return !!(m && m.classList.contains('open')); };
  var fade = 110;
  function readFade() { fade = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--fade')) || 110; }
  readFade();
  function tint() {
    if (!lights.length) return;
    var y = 34, on = false, i, r, pad;
    for (i = 0; i < lights.length; i++) {
      r = lights[i].getBoundingClientRect();
      if (r.height <= 0) continue;
      /* "soft" sections dissolve into dark at their edges: only count the solid part. */
      pad = lights[i].classList.contains('soft') ? fade * 0.55 : 0;
      if (r.top + pad <= y && r.bottom - pad >= y) { on = true; break; }
    }
    if (nav) nav.classList.toggle('on-lt', on && !menu());
    document.body.classList.toggle('on-lt-cur', on);
  }
  window.addEventListener('scroll', tint, { passive: true });
  window.addEventListener('resize', function () { readFade(); tint(); });
  window.addEventListener('load', tint);
  tint();

  /* ---------- Lenis ---------- */
  if (!reduce && typeof window.Lenis === 'function') {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true });
    window.__ertesLenis = lenis;

    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function loop(t) { lenis.raf(t); requestAnimationFrame(loop); })(performance.now());
    }

    /* mobile menu: freeze page scroll while it is open */
    var mm = document.getElementById('mnav');
    if (mm) {
      mm.setAttribute('data-lenis-prevent', '');
      new MutationObserver(function () {
        if (mm.classList.contains('open')) lenis.stop(); else lenis.start();
        tint();
      }).observe(mm, { attributes: true, attributeFilter: ['class'] });
    }

    /* glide to in-page anchors */
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var el = document.querySelector(id);
      if (!el && a.classList.contains('ft-top')) { e.preventDefault(); e.stopImmediatePropagation(); lenis.scrollTo(0, { duration: 1.4 }); return; }
      if (!el) return;
      e.preventDefault();
      if (a.classList.contains('ft-top')) e.stopImmediatePropagation();
      lenis.scrollTo(id === '#top-of-page' ? 0 : el, { duration: 1.4, offset: 0 });
      try { history.pushState(null, '', id); } catch (err) {}
    }, true);
  }
})();
