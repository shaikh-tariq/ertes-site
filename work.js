/* ERTES — Work page: thumbnails pulled into the logo on scroll, glitching logo,
   wires that draw in between cards, and a spark that follows the cursor. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var LOGO = window.ERTES_LOGO_SVG;

  var pin = $('#wpin'), hero = $('#whero'), ths = $$('.th', hero), cv = $('#glogo'), cx = cv.getContext('2d');
  var stack = $('.stack', hero), dot = $('.dot', hero);

  /* ---------- logo canvas (glitch) ---------- */
  var img = new Image(), ready = false, gW = 0, gH = 0, dpr = 1, inten = 0, px = -999, py = -999, gVis = false, gRaf = 0, seed = 0, STRIPS = 26;
  function sizeLogo() { dpr = Math.min(2, window.devicePixelRatio || 1); gW = cv.clientWidth; gH = cv.clientHeight; cv.width = gW * dpr; cv.height = gH * dpr; }
  function drawLogo(t) {
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, gW, gH);
    if (!ready) return;
    var sh = gH / STRIPS, ih = img.naturalHeight / STRIPS;
    for (var i = 0; i < STRIPS; i++) {
      var yy = i * sh, near = px > -900 ? Math.max(0, 1 - Math.abs(py - (yy + sh / 2)) / (gH * .7)) : 0;
      var k = inten * near, off = 0, a = 1;
      if (k > .02) {
        var n = Math.sin(t / 55 + i * 12.9898 + seed) * 43758.5453; n -= Math.floor(n);
        off = (n - .5) * gW * .5 * k; if (n > .78 && k > .25) a = .25;
      }
      cx.globalAlpha = a; cx.drawImage(img, 0, i * ih, img.naturalWidth, ih + .5, off, yy, gW, sh + .6);
    }
    cx.globalAlpha = 1; inten *= .93; if (inten < .01) inten = 0;
  }
  function loop(t) { drawLogo(t); gRaf = (gVis && inten > 0) ? requestAnimationFrame(loop) : 0; }
  function kick() { if (!gRaf && gVis) gRaf = requestAnimationFrame(loop); }
  img.onload = function () { ready = true; sizeLogo(); drawLogo(0); };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(LOGO);
  sizeLogo();

  /* ---------- thumbnails: pointer parallax + scroll-driven pull into the logo ---------- */
  var hx = 0, hy = 0, prog = 0, base = [], lc = { x: 0, y: 0 }, tRaf = 0;
  function measure() {
    var hr = hero.getBoundingClientRect(), cr = cv.getBoundingClientRect();
    // logo centre relative to hero, ignoring the scale we apply while scrolling
    lc.x = cr.left - hr.left + cr.width / 2; lc.y = cr.top - hr.top + cr.height / 2;
    base = ths.map(function (t) { return { x: t.offsetLeft + t.offsetWidth / 2, y: t.offsetTop + t.offsetHeight / 2 }; });
  }
  function ease(v) { return v * v * (3 - 2 * v); }
  function paint() {
    tRaf = 0;
    var n = ths.length;
    ths.forEach(function (t, i) {
      var d = (i % 4 + 1) * 5, stag = (i / n) * .32;
      var e = ease(clamp((prog - stag) / .62, 0, 1));
      var b = base[i] || { x: 0, y: 0 };
      var tx = (lc.x - b.x) * e + (-hx * d) * (1 - e), ty = (lc.y - b.y) * e + (-hy * d) * (1 - e);
      t.style.transform = 'translate3d(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px,0) scale(' + (1 - .93 * e).toFixed(3) + ') rotate(' + (e * (i % 2 ? 120 : -120)).toFixed(1) + 'deg)';
      t.style.opacity = (1 - clamp((e - .5) / .5, 0, 1)).toFixed(3);
    });
    // logo swells, brightens and flickers as it swallows the work
    var pulse = Math.sin(clamp(prog, 0, 1) * Math.PI);
    cv.style.transform = 'scale(' + (1 + .12 * pulse + .04 * clamp(prog, 0, 1)).toFixed(3) + ')';
    cv.style.filter = 'drop-shadow(0 0 ' + (24 * pulse).toFixed(1) + 'px rgba(255,255,255,' + (.55 * pulse).toFixed(2) + '))';
    if (dot) dot.style.opacity = (1 - clamp(prog * 3, 0, 1)).toFixed(2);
    if (prog > .12 && prog < .96 && !reduce) { px = gW / 2; py = gH / 2; inten = Math.max(inten, .5 * pulse); seed = prog * 90; kick(); }
  }
  function schedule() { if (!tRaf) tRaf = requestAnimationFrame(paint); }
  function onScroll() {
    var range = Math.max(1, pin.offsetHeight - hero.offsetHeight);
    var sc = clamp(-pin.getBoundingClientRect().top, 0, range);
    prog = reduce ? 0 : clamp(sc / (range * .9), 0, 1);
    schedule();
  }
  hero.addEventListener('pointermove', function (e) {
    if (reduce) return;
    var r = hero.getBoundingClientRect();
    hx = (e.clientX - r.left) / r.width - .5; hy = (e.clientY - r.top) / r.height - .5;
    // glitch the logo when the pointer is near it
    var lr = cv.getBoundingClientRect(); px = e.clientX - lr.left; py = e.clientY - lr.top;
    if (Math.hypot(px - gW / 2, py - gH / 2) < Math.max(gW, gH) * 1.1) { inten = Math.min(1, inten + .35); seed = Math.random() * 100; kick(); }
    schedule();
  }, { passive: true });
  hero.addEventListener('pointerleave', function () { px = py = -999; });
  window.addEventListener('scroll', onScroll, { passive: true });
  function relayout() { sizeLogo(); drawLogo(0); var keep = prog; measure(); onScroll(); }
  window.addEventListener('resize', relayout);
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { gVis = es[0].isIntersecting; if (gVis) kick(); }, { threshold: 0 }).observe(hero); else gVis = true;
  measure(); onScroll();
  setTimeout(function () { measure(); onScroll(); }, 400);
  // a little life on load
  setTimeout(function () { if (prog === 0) { inten = .8; px = gW / 2; py = gH / 2; seed = 3; kick(); setTimeout(function () { px = py = -999; }, 700); } }, 900);

  /* ---------- image parallax inside cards ---------- */
  var figs = $$('.pj .fig'), ptick = false;
  function par() {
    ptick = false; var vh = window.innerHeight;
    figs.forEach(function (f) {
      var r = f.getBoundingClientRect(); if (r.bottom < -50 || r.top > vh + 50) return;
      f.firstElementChild.style.setProperty('--py', (((r.top + r.height / 2 - vh / 2) / vh) * -26).toFixed(1) + 'px');
    });
  }
  if (!reduce) window.addEventListener('scroll', function () { if (!ptick) { ptick = true; requestAnimationFrame(par); } }, { passive: true });
  par();

  /* ---------- wires: hero -> card 1 -> card 2 -> ... drawn in as you scroll ---------- */
  var list = $('#list'), svg = $('#wires'), NS = 'http://www.w3.org/2000/svg';
  var groups = [], paths = [], spark = document.createElementNS(NS, 'path'), glow = document.createElementNS(NS, 'path'), sparkT = 0, sparkFade = 0;
  [glow, spark].forEach(function (p, i) {
    p.setAttribute('fill', 'none'); p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('stroke', i ? '#bfe6ff' : '#2b8dff'); p.setAttribute('stroke-width', i ? 1.6 : 5);
    p.style.opacity = 0; if (!i) p.style.filter = 'blur(3px)';
  });
  function rel(el) { var a = el.getBoundingClientRect(), b = list.getBoundingClientRect(); return { l: a.left - b.left, t: a.top - b.top, r: a.right - b.left, b: a.bottom - b.top, w: a.width, h: a.height }; }
  function mk(tag, attrs) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); svg.appendChild(e); return e; }
  function buildWires() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    groups = []; paths = [];
    var lb = list.getBoundingClientRect(), cards = $$('.pj', list);
    svg.setAttribute('viewBox', '0 0 ' + lb.width + ' ' + lb.height);
    var N = 5;
    for (var i = 0; i <= cards.length - 1; i++) {
      var fig = rel($('.fig', cards[i])), src;
      if (i === 0) src = { x0: lb.width * .47, x1: lb.width * .53, y: -2, cx: lb.width / 2 };
      else {
        var m = rel($('.meta', cards[i - 1])), c = cards[i - 1].classList;
        var a = c.contains('l') ? .5 : c.contains('r') ? .05 : .28, z = c.contains('l') ? .95 : c.contains('r') ? .5 : .72;
        src = { x0: m.l + m.w * a, x1: m.l + m.w * z, y: m.b + 8, cx: m.l + m.w * (a + z) / 2 };
      }
      var tcx = fig.l + fig.w / 2, dir = tcx >= src.cx ? 1 : -1, grp = { els: [], dots: [], paths: [] };
      for (var k = 0; k < N; k++) {
        var f = k / (N - 1);
        var x1 = src.x0 + (src.x1 - src.x0) * f, y1 = src.y;
        var x2 = fig.l + fig.w * (.16 + f * .68), y2 = fig.t - 6, dy = y2 - y1;
        var sway = dir * (50 + k * 40) * (i === 0 ? .8 : 1);
        var d = 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' C' + (x1 + sway).toFixed(1) + ' ' + (y1 + dy * .5).toFixed(1) + ' ' + (x2 - sway * .55).toFixed(1) + ' ' + (y2 - dy * .32).toFixed(1) + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1);
        var p = mk('path', { d: d, fill: 'none', stroke: 'rgba(255,255,255,' + (.2 - k * .022).toFixed(3) + ')', 'stroke-width': 1, 'stroke-linecap': 'round' });
        var len = p.getTotalLength(), pts = [];
        for (var s = 0; s <= len; s += 14) { var q = p.getPointAtLength(s); pts.push([q.x, q.y, s]); }
        p.style.strokeDasharray = len; p.style.strokeDashoffset = reduce ? 0 : len;
        var e = p.getPointAtLength(len), dt = mk('circle', { cx: e.x, cy: e.y, r: 1.8, fill: 'rgba(255,255,255,.6)' });
        dt.style.opacity = reduce ? 1 : 0; dt.style.transition = 'opacity .4s';
        var rec = { el: p, d: d, len: len, pts: pts }; paths.push(rec); grp.paths.push(rec); grp.els.push(p); grp.dots.push(dt);
      }
      grp.top = src.y; grp.bottom = fig.t; grp.card = cards[i];
      groups.push(grp);
    }
    svg.appendChild(glow); svg.appendChild(spark);
    drawWires();
  }
  // each bundle grows from its source card to the next as you scroll toward it
  var wtick = false;
  function drawWires() {
    wtick = false;
    if (reduce) return;
    var lt = list.getBoundingClientRect().top, vh = window.innerHeight;
    groups.forEach(function (g) {
      var yTop = lt + g.top, yBot = lt + g.bottom, span = Math.max(1, yBot - yTop);
      var t = clamp((vh * .82 - yTop) / (span * .82), 0, 1); t = 1 - Math.pow(1 - t, 2.2);
      g.paths.forEach(function (r, k) {
        var tk = clamp((t - k * .06) / (1 - k * .06 * 1), 0, 1);
        r.el.style.strokeDashoffset = (r.len * (1 - tk)).toFixed(1);
      });
      g.dots.forEach(function (d) { d.style.opacity = t > .985 ? 1 : 0; });
    });
  }
  window.addEventListener('scroll', function () { if (!wtick) { wtick = true; requestAnimationFrame(drawWires); } }, { passive: true });

  function nearest(x, y) {
    var best = null, bd = 1e9;
    paths.forEach(function (p) {
      if (parseFloat(p.el.style.strokeDashoffset) > p.len * .25) return; // only lit wires react
      p.pts.forEach(function (q) { var d = (q[0] - x) * (q[0] - x) + (q[1] - y) * (q[1] - y); if (d < bd) { bd = d; best = { p: p, s: q[2] }; } });
    });
    return bd < 90 * 90 ? best : null;
  }
  list.addEventListener('pointermove', function (e) {
    if (reduce || !paths.length) return;
    var b = list.getBoundingClientRect(), hit = nearest(e.clientX - b.left, e.clientY - b.top);
    if (!hit) return;
    [glow, spark].forEach(function (p) {
      p.setAttribute('d', hit.p.d); p.style.strokeDasharray = '46 ' + (hit.p.len + 60); p.style.strokeDashoffset = -(hit.s - 23); p.style.opacity = 1;
    });
    sparkFade = performance.now() + 380;
    if (window.ertesSound && window.ertesSound()) window.ertesBeep(Math.floor(hit.s / 30));
    if (!sparkT) sparkT = requestAnimationFrame(fadeSpark);
  }, { passive: true });
  function fadeSpark(t) {
    var left = sparkFade - t;
    if (left <= 0) { glow.style.opacity = 0; spark.style.opacity = 0; sparkT = 0; return; }
    var o = Math.min(1, left / 260); glow.style.opacity = o; spark.style.opacity = o; sparkT = requestAnimationFrame(fadeSpark);
  }
  var rb; function rebuild() { clearTimeout(rb); rb = setTimeout(function () { buildWires(); measure(); onScroll(); }, 120); }
  window.addEventListener('resize', rebuild);
  window.addEventListener('load', function () { buildWires(); measure(); onScroll(); });
  Array.prototype.forEach.call(document.images, function (im) { if (!im.complete) im.addEventListener('load', rebuild); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { buildWires(); measure(); onScroll(); });
  buildWires();
})();
