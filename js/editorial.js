/* ERTES — shared behaviour for the editorial pages (Work): text reveal, menu, cookie bar,
   sound toggle, footer reactive lines, clock, "book a call" links. No dependencies. */
(function () {
  'use strict';
  var BOOKING_URL = '';   // e.g. your Calendly / Cal.com link. Empty = opens an email to hello@ertes.com instead.
  var EMAIL_TO = 'hello@ertes.com';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ----- letter-by-letter reveal ----- */
  $$('[data-split]').forEach(function (el) {
    var text = el.textContent, i = 0, out = '';
    text.split(' ').forEach(function (w, wi) {
      if (wi) out += ' ';
      out += '<span class="wd">';
      w.split('').forEach(function (c) { out += '<span class="ch" style="--i:' + (i++) + '">' + c + '</span>'; });
      out += '</span>';
    });
    el.setAttribute('aria-label', text);
    el.innerHTML = out;
    $$('.ch', el).forEach(function (c) { c.setAttribute('aria-hidden', 'true'); });
    el.classList.add('rv');
  });
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } });
  }, { threshold: .2 }) : null;
  $$('.rv,.fade').forEach(function (el) { if (io) io.observe(el); else el.classList.add('on'); });

  /* ----- menu ----- */
  var menu = $('#menu'), mb = $('#menuBtn'), mx = $('#menuClose');
  function setMenu(open) {
    if (!menu || !mb || !mx) return;
    menu.classList.toggle('open', open);
    mb.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) { menu.removeAttribute('inert'); document.body.classList.add('lock'); mx.focus(); }
    else { menu.setAttribute('inert', ''); document.body.classList.remove('lock'); }
  }
  setMenu(false);
  if (menu && mb && mx) {
    mb.addEventListener('click', function () { setMenu(true); });
    mx.addEventListener('click', function () { setMenu(false); mb.focus(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); mb.focus(); } });
  }

  /* ----- smooth in-page anchors ----- */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href').slice(1), t = id && document.getElementById(id);
      if (!t) return;
      e.preventDefault(); if (menu && menu.classList.contains('open')) setMenu(false);
      t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  });

  /* ----- nav colour follows the section under it ----- */
  var top = $('#top'), ck = $('#ck'), secs = $$('[data-theme]'), tk = false;
  function theme() {
    var th = 'dark';
    secs.forEach(function (s) { var r = s.getBoundingClientRect(); if (r.top <= 40 && r.bottom > 40) th = s.getAttribute('data-theme'); });
    if (top) top.classList.toggle('light', th === 'light'); if (ck) ck.classList.toggle('dark', th === 'dark');
  }
  window.addEventListener('scroll', function () { if (tk) return; tk = true; requestAnimationFrame(function () { theme(); tk = false; }); }, { passive: true });
  theme();

  /* ----- book a call ----- */
  $$('.bookcall').forEach(function (a) {
    a.setAttribute('href', BOOKING_URL || ('mailto:' + EMAIL_TO + '?subject=' + encodeURIComponent('30-minute call')));
    if (BOOKING_URL) { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener'); }
  });

  /* ----- local time ----- */
  var clock = $('#clock');
  function tickClock() {
    var d = new Date(), tz = '';
    try { tz = (new Intl.DateTimeFormat('en', { timeZoneName: 'short' }).formatToParts(d).filter(function (x) { return x.type === 'timeZoneName'; })[0] || {}).value || ''; } catch (e) {}
    clock.textContent = (tz ? tz + ' → ' : '') + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  tickClock(); setInterval(tickClock, 20000);

  /* ----- cookies ----- */
  if (!store.get('ertes-cookies')) setTimeout(function () { ck.classList.add('show'); }, 1200);
  $$('#ck button').forEach(function (b) {
    b.addEventListener('click', function () { store.set('ertes-cookies', b.getAttribute('data-v')); ck.classList.remove('show'); });
  });

  /* ----- sound + reactive footer lines ----- */
  var soundBtn = $('#sound'), soundHint = $('#soundHint'), on = false, ac = null;
  window.ertesSound = function () { return on; };
  function beep(row) {
    if (!on) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      var notes = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33], f = notes[row % notes.length] * (row % 14 > 6 ? 1 : .5);
      var o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, ac.currentTime);
      g.gain.linearRampToValueAtTime(.05, ac.currentTime + .01); g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + .35);
      o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + .4);
    } catch (e) {}
  }
  window.ertesBeep = beep;
  function setSound(v) {
    on = v; if (soundBtn) soundBtn.setAttribute('aria-pressed', v ? 'true' : 'false');
    soundHint.textContent = v ? 'Sound on' : 'Sound off'; if (v) beep(3);
  }
  if (soundBtn) soundBtn.addEventListener('click', function () { setSound(!on); });
  $('#soundLink').addEventListener('click', function () { setSound(!on); });
  setSound(false);

  var wrap = $('#lines'), cv = $('canvas', wrap), cx = cv.getContext('2d');
  var W = 0, H = 0, dpr = 1, mask = null, mx0 = -999, my0 = -999, vis = false, raf = 0, lastRow = -1, lastBeep = 0, GAP = 7;
  function build() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = wrap.clientWidth; H = wrap.clientHeight; cv.width = W * dpr; cv.height = H * dpr;
    var m = document.createElement('canvas'); m.width = W; m.height = H;
    var c = m.getContext('2d'); c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.font = '700 ' + Math.min(H * 1.25, W / 3.1) + 'px "Inter Tight",Inter,Arial,sans-serif';
    c.fillText('ERTES', W / 2, H * 0.98);
    mask = c.getImageData(0, 0, W, H).data;
  }
  function draw(t) {
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
    var rows = Math.floor(H / GAP);
    for (var r = 0; r < rows; r++) {
      var y = r * GAP + GAP / 2, dy = Math.abs(y - my0), inf = Math.max(0, 1 - dy / 70);
      var shift = inf * Math.sin(t / 260 + r) * 26 * (mx0 > -900 ? 1 : 0);
      for (var x = 0; x < W; x += 9) {
        var px = Math.min(W - 1, Math.max(0, Math.round(x))), py = Math.min(H - 1, Math.round(y));
        var a = mask[(py * W + px) * 4 + 3] > 120;
        var near = Math.max(0, 1 - Math.hypot(Math.abs(x - mx0), dy) / 130);
        var len = a ? 7 : 3 + ((x * 7 + r * 13) % 4), al = Math.min(1, (a ? .78 : .13) + near * .5);
        cx.fillStyle = 'rgba(255,255,255,' + al.toFixed(3) + ')'; cx.fillRect(x + shift, y, len, 1);
      }
    }
    if (vis) raf = requestAnimationFrame(draw);
  }
  wrap.addEventListener('pointermove', function (e) {
    var r = wrap.getBoundingClientRect(); mx0 = e.clientX - r.left; my0 = e.clientY - r.top;
    var row = Math.floor(my0 / GAP), now = performance.now();
    if (row !== lastRow && now - lastBeep > 70) { lastRow = row; lastBeep = now; beep(row); }
  });
  wrap.addEventListener('pointerleave', function () { mx0 = my0 = -999; lastRow = -1; });
  build();
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      vis = es[0].isIntersecting;
      if (vis && !raf) raf = requestAnimationFrame(draw); else if (!vis) { cancelAnimationFrame(raf); raf = 0; }
    }, { threshold: 0 }).observe(wrap);
  } else { vis = true; raf = requestAnimationFrame(draw); }
  if (reduce) { vis = false; draw(0); }
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { build(); if (reduce) draw(0); }, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { build(); if (reduce) draw(0); });
})();
