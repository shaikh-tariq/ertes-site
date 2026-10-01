/* Homepage section transitions (see css/transitions.css).
   - Pinned stages (.stick) get a soft top/bottom edge only while they are
     entering or leaving the screen, so nothing is ever faded while pinned.
   - The hero crossfades while the first panel rises over the globe. */
(function () {
  if (!document.getElementById('s2')) return;
  var $ = function (s) { return document.querySelector(s); };
  var cl = function (v) { return Math.min(1, Math.max(0, v)); };
  var ease = function (t) { return t * t * (3 - 2 * t); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // top: feather the stage's top edge on entry, bot: feather its bottom edge on exit
  // L: fade length as a fraction of the viewport height
  var stages = [
    { el: $('#s2 .stick'), top: false, bot: true, L: 0.34 },
    { el: $('#pr .stick'), top: true, bot: true, L: 0.36 },
    { el: $('#st .stick'), top: true, bot: true, L: 0.36 }
  ].filter(function (s) { return s.el; });

  var hero = $('#hero'), s2 = $('#s2');

  function mask(el, t, b) {
    var k = Math.round(t) + '|' + Math.round(b);
    if (el._tk === k) return;
    el._tk = k;
    if (t < 1 && b < 1) { el.style.webkitMaskImage = el.style.maskImage = ''; return; }
    var g = 'linear-gradient(to bottom,transparent 0,#000 ' + t.toFixed(1) + 'px,#000 calc(100% - ' + b.toFixed(1) + 'px),transparent 100%)';
    el.style.webkitMaskImage = el.style.maskImage = g;
  }

  function update() {
    var vh = innerHeight;
    stages.forEach(function (s) {
      var L = s.L * vh, r = s.el.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) { mask(s.el, 0, 0); return; }
      var t = s.top ? L * ease(cl(r.top / L)) : 0;
      var b = s.bot ? L * ease(cl((vh - r.bottom) / L)) : 0;
      mask(s.el, reduce ? 0 : t, reduce ? 0 : b);
    });
    if (hero && !reduce) {
      var r2 = s2.getBoundingClientRect();
      var e = ease(cl((vh - r2.top) / (vh * 0.8)));
      hero.style.opacity = (1 - 0.92 * e).toFixed(3);
    }
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; update(); });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();
})();
