/* ERTES — Careers page animations (GSAP 3 + ScrollTrigger).
   - Everything is readable without GSAP: animated start states are only applied from here.
   - Roles filter + accordion work with or without GSAP.
   - prefers-reduced-motion: no scroll animation, content is simply shown. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasG = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var animate = hasG && !reduce;
  if (hasG) gsap.registerPlugin(ScrollTrigger);
  var refresh = function () { if (hasG) ScrollTrigger.refresh(); };

  /* ---------- open roles: filter + accordion ---------- */
  var roles = $$('.cr-role'), chips = $$('.cr-chip'), countEl = $('#crCount');

  function setOpen(item, open) {
    var btn = $('.cr-role-h', item), panel = $('.cr-role-p', item);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (!animate) { panel.hidden = !open; panel.style.height = ''; return; }
    gsap.killTweensOf(panel);
    if (open) {
      panel.hidden = false;
      gsap.fromTo(panel, { height: 0 }, { height: 'auto', duration: .5, ease: 'power3.out', onComplete: refresh });
      gsap.fromTo($('.cr-role-in', panel).children, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: .5, stagger: .08, delay: .1, ease: 'power2.out' });
    } else {
      gsap.to(panel, { height: 0, duration: .4, ease: 'power3.inOut', onComplete: function () { panel.hidden = true; refresh(); } });
    }
  }

  roles.forEach(function (item) {
    $('.cr-role-h', item).addEventListener('click', function () {
      var open = this.getAttribute('aria-expanded') !== 'true';
      roles.forEach(function (o) { if (o !== item && $('.cr-role-h', o).getAttribute('aria-expanded') === 'true') setOpen(o, false); });
      setOpen(item, open);
    });
  });

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.getAttribute('data-f'), shown = [];
      chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
      roles.forEach(function (item) {
        var ok = f === 'all' || item.getAttribute('data-team') === f;
        item.hidden = !ok;
        if (ok) shown.push(item); else setOpen(item, false);
      });
      if (countEl) countEl.textContent = 'Showing ' + shown.length + (shown.length === 1 ? ' role' : ' roles');
      if (animate) gsap.fromTo(shown, { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: .5, stagger: .07, ease: 'power3.out', clearProps: 'transform', onComplete: refresh });
      else refresh();
    });
  });

  if (!animate) return; /* no GSAP, or reduced motion: static page, all content visible */

  try {
    ScrollTrigger.config({ ignoreMobileResize: true });

    /* scroll progress bar */
    var bar = document.createElement('div');
    bar.className = 'cr-progress'; bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: document.documentElement, start: 'top top', end: 'bottom bottom', scrub: .3 } });

    /* ---------- hero intro ---------- */
    var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.from('.cr-hero .cr-eyebrow', { y: 18, opacity: 0, duration: .7 })
      .from('.cr-hero .wi', { yPercent: 118, duration: 1.1, stagger: .08 }, '-=.35')
      .from('.cr-hero .lead, .cr-hero .acts', { y: 30, opacity: 0, duration: .9, stagger: .12 }, '-=.7')
      .from('.cr-orb', { scale: .78, opacity: 0, duration: 1.6 }, 0.2)
      .from('.cr-cue', { opacity: 0, duration: .8 }, '-=.6');

    /* hero scroll: orb drifts + rings rotate, copy fades away */
    var heroST = { trigger: '.cr-hero', start: 'top top', end: 'bottom top', scrub: true };
    gsap.to('.cr-orb', { yPercent: -22, ease: 'none', scrollTrigger: heroST });
    gsap.to('.cr-orb .rg', { rotation: 120, svgOrigin: '200 200', ease: 'none', scrollTrigger: heroST });
    gsap.to('.cr-hero .wrap', { y: -70, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.cr-hero', start: '55% top', end: 'bottom top', scrub: true } });

    /* ---------- marquee reacts to scroll speed + direction ---------- */
    var loop = gsap.to('.cr-mq-track', { xPercent: -50, duration: 30, ease: 'none', repeat: -1 });
    ScrollTrigger.create({
      trigger: '.cr-mq', start: 'top bottom', end: 'bottom top',
      onUpdate: function (self) {
        var k = self.direction * (1 + Math.min(Math.abs(self.getVelocity()) / 250, 6));
        gsap.to(loop, { timeScale: k, duration: .25, overwrite: true, onComplete: function () { gsap.to(loop, { timeScale: self.direction, duration: 1 }); } });
      }
    });

    /* ---------- generic reveal ---------- */
    gsap.set('[data-r]', { opacity: 0, y: 44 });
    ScrollTrigger.batch('[data-r]', {
      start: 'top 90%', once: true,
      onEnter: function (els) { gsap.to(els, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', stagger: .1, overwrite: true, clearProps: 'transform' }); }
    });

    /* ---------- count-up numbers ---------- */
    $$('[data-count]').forEach(function (el) {
      var raw = el.getAttribute('data-count'), end = parseFloat(raw), dec = (raw.split('.')[1] || '').length, o = { v: 0 };
      el.textContent = (0).toFixed(dec);
      gsap.to(o, { v: end, duration: 2, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true }, onUpdate: function () { el.textContent = o.v.toFixed(dec); } });
    });

    /* ---------- "how we work": pinned horizontal scroll on desktop ---------- */
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function () {
      var sec = $('.cr-hz'), track = $('.cr-hz-track'), fill = $('.cr-hz-bar i');
      document.documentElement.classList.add('hz-on');
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      var tween = gsap.to(track, {
        x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: {
          trigger: sec, pin: true, start: 'top top', end: function () { return '+=' + dist(); },
          scrub: .8, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: function (self) { gsap.set(fill, { scaleX: self.progress }); }
        }
      });
      $$('.cr-panel', track).forEach(function (p) {
        gsap.from(p, { opacity: .25, scale: .94, ease: 'none', scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left 94%', end: 'left 62%', scrub: true } });
      });
      return function () { document.documentElement.classList.remove('hz-on'); };
    });

    /* ---------- hiring process: line draws, steps light up ---------- */
    gsap.fromTo('.cr-line i', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.cr-steps', start: 'top 65%', end: 'bottom 70%', scrub: true } });
    $$('.cr-step').forEach(function (step) {
      ScrollTrigger.create({ trigger: step, start: 'top 66%', toggleClass: { targets: step, className: 'on' } });
      gsap.from($('.cr-step-b', step), { x: 44, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: step, start: 'top 86%', once: true } });
    });

    window.addEventListener('load', refresh);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  } catch (err) {
    /* never leave content hidden if an animation fails */
    if (window.console) console.warn('Careers animations disabled:', err);
    try { gsap.set('[data-r], .cr-hero .wi, .cr-hero .lead, .cr-hero .acts, .cr-orb', { clearProps: 'all' }); } catch (e) {}
  }
})();
