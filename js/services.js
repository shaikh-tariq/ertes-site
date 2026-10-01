/* ERTES — Services page behaviour: loader, hero text + 3D orbit, scroll phases,
   nav colour switching, reveals, clock. Needs Three.js (loaded before this file). */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var smooth = function (a, b, v) { v = clamp((v - a) / (b - a), 0, 1); return v * v * (3 - 2 * v); };

  /* ---------- loader (first visit per session) ---------- */
  var ld = $('#ld'), seen = false;
  try { seen = sessionStorage.getItem('ertes-sv') === '1'; sessionStorage.setItem('ertes-sv', '1'); } catch (e) {}
  var heroIn = function () { var h = $('#hh'); if (h) h.classList.add('in'); };
  if (ld) {
    if (seen || reduce) { ld.remove(); heroIn(); }
    else setTimeout(function () { ld.classList.add('gone'); setTimeout(heroIn, 350); setTimeout(function () { ld.remove(); }, 1000); }, 1300);
  } else heroIn();

  /* ---------- hero headline: letter-by-letter blur-in ---------- */
  var hh = $('#hh');
  if (hh) {
    var txt = hh.textContent; hh.setAttribute('aria-label', txt); hh.textContent = '';
    txt.split(' ').forEach(function (word, wi, arr) {
      var w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
      word.split('').forEach(function (ch) {
        var s = document.createElement('span'); s.textContent = ch; s.style.transitionDelay = (Math.random() * 500) + 'ms'; w.appendChild(s);
      });
      hh.appendChild(w); if (wi < arr.length - 1) hh.appendChild(document.createTextNode(' '));
    });
    if (!ld || !document.body.contains(ld)) heroIn();
  }

  /* ---------- hero scroll phases (read raw, apply smoothed) ---------- */
  var hero = $('.hero'), h1w = $('.h1w'), stm = $('.stm'), prog = 0, rawProg = 0;
  function heroApply() {
    if (!hero) return;
    prog += (rawProg - prog) * (reduce ? 1 : .12); if (Math.abs(rawProg - prog) < .0004) prog = rawProg;
    if (prog === heroApply.last) return; heroApply.last = prog;
    var a = 1 - smooth(.12, .4, prog), b = smooth(.5, .75, prog);
    h1w.style.opacity = a; h1w.style.transform = 'translateY(calc(-50% - ' + (1 - a) * 40 + 'px)) scale(' + (1 - (1 - a) * .06) + ')';
    stm.style.opacity = b; stm.style.transform = 'translateY(calc(-50% + ' + (1 - b) * 40 + 'px))';
    stm.style.visibility = b < .02 ? 'hidden' : 'visible';
  }

  /* ---------- 3D orbit (Three.js) ---------- */
  var cv = $('#cv'), visible = true, raf = 0;
  function initScene() {
    if (!cv || !window.THREE) return;
    var T = THREE, ren;
    try { ren = new T.WebGLRenderer({ canvas: cv, alpha: true, antialias: true }); } catch (e) { return; }
    var scene = new T.Scene(), cam = new T.PerspectiveCamera(40, 1, .1, 60);
    cam.position.set(0, 2.4, 12); cam.lookAt(0, 0, 0);
    scene.add(new T.HemisphereLight(0xa9c8dc, 0x0b2a3d, .55));
    var dl = new T.DirectionalLight(0xffffff, .85); dl.position.set(3, 6, 5); scene.add(dl);
    var pl = new T.PointLight(0x2CC4F5, 1.1, 30); pl.position.set(-5, 1, 4); scene.add(pl);
    var M = function (o) { return new T.MeshStandardMaterial(Object.assign({ color: 0x6d8497, metalness: .45, roughness: .5 }, o || {})); };
    var accent = M({ color: 0x2CC4F5, emissive: 0x06465f, emissiveIntensity: .45 }), i;
    var makers = [
      function () { var g = new T.Group(); for (i = 0; i < 9; i++) { var m = new T.Mesh(new T.BoxGeometry(1.7, .07, .9), i === 6 ? accent : M()); m.position.y = (i - 4) * .15; m.rotation.y = i * .07; g.add(m); } return g; },
      function () { var g = new T.Group(); for (i = 0; i < 9; i++) { var m = new T.Mesh(new T.TorusGeometry(.3 + i * .1, .014, 8, 64), M()); m.rotation.x = Math.PI / 2; m.position.y = (i - 4) * .06; g.add(m); } return g; },
      function () { var g = new T.Group(); for (i = 0; i < 7; i++) { var m = new T.Mesh(new T.RingGeometry(.25 + i * .13, .3 + i * .13, 4, 1, Math.PI / 4), new T.MeshStandardMaterial({ color: i === 5 ? 0x2CC4F5 : 0x6d8497, metalness: .45, roughness: .5, side: T.DoubleSide })); m.position.z = i * .07; g.add(m); } return g; },
      function () { var g = new T.Group(); for (i = 0; i < 8; i++) { var m = new T.Mesh(new T.CylinderGeometry(.85, .85, .045, 48), i === 2 ? accent : M()); m.position.y = (i - 3.5) * .13; g.add(m); } return g; },
      function () { var g = new T.Group(); for (i = 0; i < 6; i++) { var m = new T.Mesh(new T.BoxGeometry(.06, 1.5, 1.1 - i * .12), M()); m.position.x = (i - 2.5) * .17; g.add(m); } return g; }
    ];
    var small = window.innerWidth < 700, N = small ? 3 : 5, objs = [];
    for (var q = 0; q < N; q++) { var o = makers[q](); o.userData = { a: q / N * Math.PI * 2, sx: .3 + Math.random() * .4, sy: .2 + Math.random() * .4 }; scene.add(o); objs.push(o); }
    var pts = [], k; for (k = 0; k <= 128; k++) pts.push(new T.Vector3(Math.cos(k / 128 * 6.2832), 0, Math.sin(k / 128 * 6.2832)));
    var orbit = new T.LineLoop(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0x9CCDE8, transparent: true, opacity: .16 }));
    scene.add(orbit);
    var A = 7, B = 3.6, mx = 0, my = 0, t0 = performance.now();
    function size() {
      var w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
      ren.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); ren.setSize(w, h, false);
      cam.aspect = w / h; cam.updateProjectionMatrix();
      A = clamp(w / h * 3.9, 3.4, 7.4); B = small ? 3 : 3.6; orbit.scale.set(A, 1, B); orbit.position.y = -.4;
    }
    function frame(now) {
      raf = 0; if (!visible || document.hidden) return;
      var t = (now - t0) / 1000, sp = reduce ? 0 : .11 + prog * .25;
      objs.forEach(function (o, n) {
        var u = o.userData; u.a += sp * .016;
        o.position.set(Math.cos(u.a) * A, Math.sin(u.a * 2 + n) * .35 - .4, Math.sin(u.a) * B);
        var s = small ? .65 : .85; o.scale.setScalar(s);
        o.rotation.x += reduce ? 0 : .004 * u.sx * 4; o.rotation.y += reduce ? 0 : .006 * u.sy * 3;
      });
      cam.position.x += (mx * 1.2 - cam.position.x) * .04; cam.position.y += (2.4 - my * .8 - cam.position.y) * .04; cam.lookAt(0, 0, 0);
      ren.render(scene, cam);
      if (!reduce) raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(frame); }
    size(); window.addEventListener('resize', function () { size(); kick(); });
    window.addEventListener('mousemove', function (e) { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) kick(); }).observe(cv);
    kick();
  }
  initScene();

  /* =====================================================================
     ENGINE — one requestAnimationFrame loop. Geometry is measured once (and on
     resize) and everything per-frame is arithmetic + direct transform/opacity
     writes, so there are no layout reads and no style-variable invalidations.
     ===================================================================== */
  var mqSticky = window.matchMedia('(min-width:901px) and (min-height:640px)');
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var STRIDE = 1.25;                       /* one card = 100vh + 25vh hold (matches css margin-bottom on .svc) */
  var dpr = window.devicePixelRatio || 1;
  var G = { sticky: false, vh: window.innerHeight, vw: window.innerWidth, stackTop: 0, techTop: 0, procTop: 0, procH: 0, ctaTop: 0, n: 0, bands: [], ctlX: [], sceneTop: [], stTop: [], pgTop: 0, pgH: 1, heroTop: 0, heroH: 0 };
  var heroEl = $('.hero'), stackEl = $('.stack'), proc = $('.proc'), pg = $('.pg'), pf = $('.pf'), steps = $$('.ps');
  var navEl = $('nav#nav'), navCtl = navEl ? $$('a, button', navEl) : [];
  var stepPl = steps.map(function (el) { return $('.pl', el); });
  var qs = function (v) { return Math.round(v * dpr) / dpr; };     /* device-pixel-exact scroll positions */

  var panels = $$('.svc').map(function (svc) {
    var o = { svc: svc, vis: $('.vis', svc), scene: $('.scene', svc), c3: $('.c3', svc), card: $('.card', svc), gl: $('.gl u', svc),
      px: 0, py: 0, rx: 0, ry: 0, lift: 0, hover: false, ph: Math.random() * 6, key: null, active: false, cw: 440 };
    o.dim = document.createElement('i'); o.dim.className = 'dim'; svc.appendChild(o.dim);
    if (fine && !reduce) {
      o.vis.addEventListener('pointermove', function (e) {
        var r = o.vis.getBoundingClientRect();
        o.px = clamp((e.clientX - r.left) / r.width * 2 - 1, -1, 1); o.py = clamp((e.clientY - r.top) / r.height * 2 - 1, -1, 1); o.hover = true;
      }, { passive: true });
      o.vis.addEventListener('pointerleave', function () { o.hover = false; o.px = 0; o.py = 0; });
    }
    return o;
  });

  function measure() {
    var sy = window.scrollY, top = function (el) { return el ? el.getBoundingClientRect().top + sy : 0; };
    G.vh = window.innerHeight; G.vw = window.innerWidth; G.sticky = mqSticky.matches; dpr = window.devicePixelRatio || 1; G.n = panels.length;
    G.heroTop = top(heroEl); G.heroH = heroEl ? heroEl.offsetHeight : 0;
    G.stackTop = top(stackEl); G.techTop = top(proc); G.procTop = top(proc); G.procH = proc ? proc.offsetHeight : 0; G.ctaTop = top($('.cta'));
    G.pgTop = top(pg); G.pgH = pg ? Math.max(1, pg.offsetHeight) : 1;
    G.sceneTop = []; G.stTop = []; G.bands = [];
    if (!G.sticky) {
      G.sceneTop = panels.map(function (o) { return top(o.scene); });
      G.stTop = steps.map(function (el) { return G.pgTop + el.offsetTop; });
      panels.forEach(function (o) {
        var v = o.vis.getBoundingClientRect(), t = $('.txt', o.svc).getBoundingClientRect();
        G.bands.push([v.top + sy, v.bottom + sy, 'dark'], [t.top + sy, t.bottom + sy, 'light']);
      });
    }
    G.ctlX = navCtl.map(function (el) { var r = el.getBoundingClientRect(); return r.left + r.width / 2; });
    panels.forEach(function (o) { o.key = null; o.cw = o.scene.offsetWidth || 440; });
    lastSy = -1; procKey = ''; navKey = '';
  }
  var lastSy = -1, procKey = '', navKey = '', navCache = [];

  /* --- which colour is under the nav bar at document y, horizontal x (no DOM reads) --- */
  function bgAt(y, x) {
    if (y < G.stackTop) return 'dark';
    if (y >= G.ctaTop) return 'dark';
    if (y >= G.techTop) return 'light';
    if (G.sticky) return x < G.vw / 2 ? 'dark' : 'light';
    for (var i = 0; i < G.bands.length; i++) if (y >= G.bands[i][0] && y < G.bands[i][1]) return G.bands[i][2];
    return 'light';
  }

  /* ---------- scroll engine: inertia + one-scroll-per-card snapping ---------- */
  var cur = window.scrollY, tgt = cur, mode = 0 /* 0 idle, 1 inertia, 2 snap */, lockUntil = 0, prevWheel = 0;
  var snapFrom = 0, snapT0 = -1, snapDur = 900, lastT = 0;
  var maxScroll = function () { return Math.max(0, document.documentElement.scrollHeight - window.innerHeight); };
  var menuOpen = function () { return document.documentElement.style.overflow === 'hidden'; };
  var ease = function (k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };

  function scrollStep(now) {
    if (mode === 0) return false;
    if (mode === 1) {
      /* someone else moved the page (find-in-page, scrollbar drag, scrollTo): yield */
      if (Math.abs(window.scrollY - cur) > 3) { cur = tgt = window.scrollY; mode = 0; return false; }
      var dt = Math.min(now - lastT, 50), d = tgt - cur;
      if (Math.abs(d) < .25) { cur = tgt; mode = 0; } else cur += d * (1 - Math.exp(-dt / 105));
    } else {
      if (snapT0 < 0) snapT0 = now;
      var k = clamp((now - snapT0) / snapDur, 0, 1); cur = snapFrom + (tgt - snapFrom) * ease(k);
      if (k >= 1) { cur = tgt; mode = 0; }
    }
    window.scrollTo(0, qs(cur)); return true;
  }
  function goTo(y) { if (mode === 0) cur = window.scrollY; tgt = clamp(y, 0, maxScroll()); mode = 1; }
  function snapTo(y) {
    y = clamp(y, 0, maxScroll()); snapFrom = mode ? cur : window.scrollY; tgt = y; cur = snapFrom; snapT0 = -1; mode = 2;
    snapDur = clamp(Math.abs(y - snapFrom) / G.vh * 720 + 420, 760, 1200); lockUntil = performance.now() + snapDur + 160;
  }
  function snapPts() {
    var a = [], i, st = G.vh * STRIDE; for (i = 0; i < G.n; i++) a.push(Math.round(G.stackTop + i * st)); return a;
  }
  /* null when outside the card zone, else {t: next snap position or null} */
  function zone(dir) {
    if (!G.sticky || !G.n) return null;
    var p = snapPts(), vh = G.vh, y = mode === 2 ? tgt : window.scrollY, last = p[p.length - 1], i, t = null;
    if (y < p[0] - vh * .6 || y > last + vh * .5) return null;
    if (dir > 0) { for (i = 0; i < p.length; i++) if (p[i] > y + 8) { t = p[i]; break; } }
    else { for (i = p.length - 1; i >= 0; i--) if (p[i] < y - 8) { t = p[i]; break; } }
    return { t: t };
  }
  var idleT = 0;
  function settle() {
    if (mode || !G.sticky || !G.n || menuOpen()) return;
    var p = snapPts(), y = window.scrollY, sd = G.vh * STRIDE;
    if (y <= p[0] || y >= p[p.length - 1]) return;
    var k = Math.floor((y - p[0]) / sd), f = (y - p[0]) / sd - k;
    if (f <= .2 || Math.abs(y - p[k]) < 3) return;
    snapTo(f > .6 ? p[k + 1] : p[k]);
  }

  if (!reduce) {
    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey || e.defaultPrevented || menuOpen()) return;
      e.preventDefault();
      var now = performance.now(), gap = now - prevWheel; prevWheel = now;
      var dy = e.deltaMode === 1 ? e.deltaY * 34 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
      if (!dy) return;
      var z = zone(dy > 0 ? 1 : -1);
      if (z) {
        if (mode === 2 || now < lockUntil) return;               /* swallow while a card moves / inertia tail */
        if (z.t !== null) { if (gap > 70 && Math.abs(dy) >= 2) snapTo(z.t); return; }
      }
      if (mode === 2) return;
      if (mode === 0) { cur = window.scrollY; tgt = cur; }
      tgt = clamp(tgt + dy, 0, maxScroll()); mode = 1;
    }, { passive: false });

    window.addEventListener('scroll', function () {
      if (!mode) cur = tgt = window.scrollY;
      clearTimeout(idleT); idleT = setTimeout(settle, 170);
    }, { passive: true });

    window.addEventListener('keydown', function (e) {
      var t = document.activeElement, tag = t && t.tagName;
      if (e.altKey || e.ctrlKey || e.metaKey || menuOpen() || /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(tag || '')) return;
      var y = mode ? tgt : window.scrollY, vh = window.innerHeight, k = e.key, dir = 0, n = null;
      if (k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) dir = 1;
      else if (k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey)) dir = -1;
      else if (k === 'Home') n = 0; else if (k === 'End') n = maxScroll(); else return;
      e.preventDefault();
      if (dir) {
        var z = zone(dir);
        if (z && (mode === 2 || performance.now() < lockUntil)) return;
        if (z && z.t !== null) { snapTo(z.t); return; }
        n = y + dir * (k === 'ArrowDown' || k === 'ArrowUp' ? 90 : vh * .88);
      }
      goTo(n);
    });

    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return;
      var el = document.getElementById(a.getAttribute('href').slice(1)); if (!el) return;
      e.preventDefault();
      var pi = el.classList.contains('svc') ? $$('.svc').indexOf(el) : -1;
      if (pi > -1 && G.sticky) snapTo(snapPts()[pi]);
      else goTo(el.getBoundingClientRect().top + window.scrollY);
    });
  }

  /* ---------- per-frame visuals ---------- */
  function render(sy, now) {
    var vh = G.vh, sticky = G.sticky, n = G.n, stride = vh * STRIDE, k, o;
    var scrolled = sy !== lastSy; lastSy = sy;
    var t = (now - (render.t0 || (render.t0 = now))) / 1000;

    if (heroEl) rawProg = clamp((sy - G.heroTop) / Math.max(1, G.heroH - vh), 0, 1);
    heroApply();

    for (k = 0; k < n; k++) {
      o = panels[k]; var top, nextTop, eIn, tt, vis, active;
      if (sticky) {
        top = G.stackTop + k * stride - sy; nextTop = k < n - 1 ? top + stride : Infinity;
        eIn = reduce ? 1 : 1 - clamp(top / vh, 0, 1);
        tt = (reduce || k >= n - 1) ? 0 : 1 - clamp(nextTop / vh, 0, 1);
        vis = top < vh && nextTop > 0;
        active = top < vh * 1.08 && nextTop > -vh * .3;
        if (active !== o.active) { o.active = active; o.svc.style.willChange = active ? 'transform' : ''; }
        var key = ((eIn * 400) | 0) + ':' + ((tt * 400) | 0);
        if (key !== o.key) {
          o.key = key; var tf = '', rd = false;
          if (eIn < 1) { var q = 1 - smooth(0, 1, eIn); tf = 'perspective(1700px) rotateX(' + (-q * 9).toFixed(2) + 'deg) scale(' + (1 - q * .05).toFixed(4) + ')'; o.svc.style.transformOrigin = '50% 0'; rd = true; }
          else if (tt > 0) { var q2 = smooth(0, 1, tt); tf = 'perspective(1700px) rotateX(' + (q2 * 5).toFixed(2) + 'deg) scale(' + (1 - q2 * .09).toFixed(4) + ') translateY(' + (-q2 * 2.5).toFixed(2) + 'vh)'; o.svc.style.transformOrigin = '50% 100%'; rd = true; }
          o.svc.style.transform = tf; o.dim.style.opacity = (tt * .65).toFixed(3);
          if (rd !== o.rd) { o.rd = rd; o.svc.classList.toggle('rd', rd); }
        }
      } else {
        top = G.sceneTop[k] - sy; eIn = reduce ? 1 : smooth(0, 1, clamp((vh * .95 - top) / (vh * .55), 0, 1)); vis = top < vh && top > -420;
        if (o.key !== 'm') { o.key = 'm'; o.svc.style.transform = ''; o.svc.style.willChange = ''; o.dim.style.opacity = 0; o.svc.classList.remove('rd'); o.rd = false; }
      }
      if (!vis) continue;

      /* 3D card: tilt toward pointer (or idle sway), lift, glare */
      var e = sticky && !reduce ? smooth(0, 1, eIn) : eIn, tx, ty;
      if (o.hover) { tx = -o.py * 13; ty = o.px * 17; o.lift += (34 - o.lift) * .09; }
      else if (reduce) { tx = ty = 0; o.lift += (0 - o.lift) * .09; }
      else { tx = Math.cos(t * .55 + o.ph) * (fine ? 2.2 : 4); ty = Math.sin(t * .7 + o.ph) * (fine ? 3 : 7); o.lift += (0 - o.lift) * .09; }
      o.rx += (tx - o.rx) * .1; o.ry += (ty - o.ry) * .1;
      var inv = 1 - e;
      o.c3.style.transform = 'translate3d(0,' + (inv * 60).toFixed(1) + 'px,' + (o.lift - inv * 140).toFixed(1) + 'px) rotateX(' + (inv * 26 + o.rx).toFixed(2) + 'deg) rotateY(' + (-inv * 14 + o.ry).toFixed(2) + 'deg)';
      o.c3.style.opacity = clamp(e * 2, 0, 1).toFixed(2);
      var gx = (o.hover ? o.px : Math.sin(t * .7 + o.ph)) * o.cw * .34, gy = (o.hover ? o.py : Math.cos(t * .55 + o.ph)) * o.cw * .22;
      o.gl.style.transform = 'translate3d(' + gx.toFixed(1) + 'px,' + gy.toFixed(1) + 'px,0)';
    }

    /* nav colours follow the section beneath each control */
    if (scrolled && navCtl.length) {
      var y = sy + 34;
      for (k = 0; k < navCtl.length; k++) {
        var on = bgAt(y, G.ctlX[k]);
        if (navCache[k] !== on) { navCache[k] = on; navCtl[k].setAttribute('data-on', on); }
      }
    }

    /* "How we work": steps appear one by one while the section is pinned */
    if (proc) {
      var fill, ps, p;
      if (sticky) {
        p = clamp((sy - G.procTop) / Math.max(1, G.procH - vh), 0, 1);
        fill = clamp((p - .06) / .88, 0, 1);
        ps = steps.map(function (_, i) { return smooth(.06 + i * .22, .06 + i * .22 + .16, p); });
      } else {
        fill = clamp((vh * .75 - (G.pgTop - sy)) / G.pgH, 0, 1);
        ps = steps.map(function (_, i) { return smooth(0, 1, (vh * .92 - (G.stTop[i] - sy)) / (vh * .3)); });
      }
      if (reduce) { fill = 1; ps = ps.map(function () { return 1; }); }
      var pk = ((fill * 500) | 0) + ps.map(function (v) { return (v * 250) | 0; }).join(',') + sticky;
      if (pk !== procKey) {
        procKey = pk;
        pf.style.transform = sticky ? 'scaleX(' + fill.toFixed(4) + ')' : 'scaleY(' + fill.toFixed(4) + ')';
        steps.forEach(function (el, i) {
          var v = ps[i]; el.style.opacity = v.toFixed(3); el.style.transform = 'translate3d(0,' + ((1 - v) * 46).toFixed(1) + 'px,0)';
          stepPl[i].style.transform = 'scale(' + (.5 + v * .5).toFixed(3) + ')'; stepPl[i].classList.toggle('on', v > .6);
        });
      }
    }
  }

  var resizeT = 0;
  measure();
  window.addEventListener('resize', function () { clearTimeout(resizeT); resizeT = setTimeout(function () { measure(); if (mode === 0) { cur = tgt = window.scrollY; } }, 120); });
  window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  if (window.ResizeObserver) { var ro = new ResizeObserver(function () { clearTimeout(resizeT); resizeT = setTimeout(measure, 80); }); ro.observe(document.body); }
  if (mqSticky.addEventListener) mqSticky.addEventListener('change', measure);

  (function loop(now) {
    requestAnimationFrame(loop);
    if (document.hidden) { lastT = now; return; }
    var moved = scrollStep(now); lastT = now;
    render(moved || mode ? qs(cur) : window.scrollY, now);
  })(performance.now());

  /* ---------- reveal on scroll ---------- */
  var rv = $$('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .18 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });

  /* ---------- local clock ---------- */
  var clk = $('#clk');
  if (clk) { var tk = function () { var d = new Date(); clk.textContent = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }; tk(); setInterval(tk, 20000); }

})();
