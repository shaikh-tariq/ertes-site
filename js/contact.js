/* ERTES — Contact page behaviour (no dependencies). */
(function () {
  'use strict';

  /* ----- settings you can change ----- */
  var FORM_ENDPOINT = '';   // e.g. a Formspree / Netlify Forms / your API URL. Empty = form validates but sends nothing.
  var BOOKING_URL   = '';   // e.g. your Calendly / Cal.com link. Empty = opens an email to hello@ertes.com instead.
  var EMAIL_TO      = 'hello@ertes.com';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ----- split text into letters ----- */
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

  /* ----- reveal on scroll ----- */
  var started = false;
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting && started) { e.target.classList.add('on'); io.unobserve(e.target); } });
  }, { threshold: .25 }) : null;
  var watched = $$('.rv,.fade');
  function watch() {
    watched.forEach(function (el) {
      if (!io) { el.classList.add('on'); return; }
      io.observe(el);
    });
  }

  /* ----- preloader ----- */
  var pre = $('#pre'), ct = $('#pre .ct');
  function finish() {
    if (started) return;
    started = true;
    pre.classList.add('done');
    document.body.classList.remove('lock');
    setTimeout(function () { pre.parentNode && pre.parentNode.removeChild(pre); }, 900);
    setTimeout(function () { watch(); cookieInit(); }, 250);
  }
  if (reduce) { ct.textContent = '100'; finish(); }
  else {
    document.body.classList.add('lock');
    var t0 = performance.now(), D = 2200;
    (function tick(t) {
      var k = Math.min(1, (t - t0) / D);
      ct.textContent = String(Math.round(k * 100)).padStart(3, '0');
      if (k < 1) requestAnimationFrame(tick); else setTimeout(finish, 250);
    })(t0);
    setTimeout(finish, 6000); // safety net
  }

  /* ----- nav colour follows the section under it ----- */
  var top = $('#top'), ck = $('#ck');
  var secs = $$('[data-theme]');
  function theme() {
    var y = 40, th = 'dark';
    secs.forEach(function (s) { var r = s.getBoundingClientRect(); if (r.top <= y && r.bottom > y) th = s.getAttribute('data-theme'); });
    if (top) top.classList.toggle('light', th === 'light');
    if (ck) ck.classList.toggle('dark', th === 'dark');
  }

  /* ----- shutter (bars wipe in while scrolling from hero to form) ----- */
  var shutter = $('#shutter'), bars = $$('b', shutter);
  function shut() {
    var r = shutter.getBoundingClientRect(), vh = window.innerHeight;
    var p = Math.min(1, Math.max(0, (vh - r.top) / (vh * .95)));
    bars.forEach(function (b, i) {
      var k = Math.min(1, Math.max(0, p * 1.9 - i * .18));
      b.style.transform = 'scaleX(' + k + ')';
    });
  }

  /* ----- hero parallax on pointer ----- */
  var rig = $('#hero .rig');
  window.addEventListener('pointermove', function (e) {
    if (reduce || !rig) return;
    var x = (e.clientX / window.innerWidth - .5) * 14, y = (e.clientY / window.innerHeight - .5) * 6;
    rig.style.transform = 'translate(' + x + 'px,' + y + 'px)';
  }, { passive: true });

  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { theme(); shut(); ticking = false; });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ----- menu ----- */
  var menu = $('#menu'), mb = $('#menuBtn'), mx = $('#menuClose');
  function setMenu(open) {
    if (!menu || !mb || !mx) return;
    menu.classList.toggle('open', open);
    mb.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) { menu.removeAttribute('inert'); document.body.classList.add('lock'); mx.focus(); }
    else { menu.setAttribute('inert', ''); if (started) document.body.classList.remove('lock'); }
  }
  setMenu(false);
  if (menu && mb && mx) {
    mb.addEventListener('click', function () { setMenu(true); });
    mx.addEventListener('click', function () { setMenu(false); mb.focus(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); mb.focus(); } });
    $$('a[href^="#"]', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  }

  /* ----- smooth anchors (works inside an iframe too) ----- */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href').slice(1), t = id && document.getElementById(id);
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  });

  /* ----- custom selects ----- */
  function makeSelect(root, onChange) {
    var btn = $('button', root), list = $('ul', root), label = $('span', btn), input = $('input[type=hidden]', root);
    var opts = $$('li', list), placeholder = label.textContent, idx = -1;
    function open(o) {
      root.classList.toggle('open', o); btn.setAttribute('aria-expanded', o ? 'true' : 'false');
      if (o) {
        var r = root.getBoundingClientRect();
        root.classList.toggle('up', window.innerHeight - r.bottom < 280 && r.top > 280);
        idx = Math.max(0, opts.findIndex(function (x) { return x.getAttribute('aria-selected') === 'true'; }));
        mark();
      }
    }
    function mark() { opts.forEach(function (x, i) { x.classList.toggle('act', i === idx); }); if (opts[idx]) opts[idx].scrollIntoView({ block: 'nearest' }); }
    function pick(i) {
      opts.forEach(function (x, k) { x.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
      label.textContent = opts[i].textContent; btn.classList.add('has'); input.value = opts[i].textContent;
      open(false); btn.focus(); if (onChange) onChange(input.value);
    }
    root.setValue = function (v) { var i = opts.findIndex(function (x) { return x.textContent === v; }); if (i > -1) { pick(i); btn.blur(); } };
    root.reset = function () { opts.forEach(function (x) { x.setAttribute('aria-selected', 'false'); }); label.textContent = placeholder; btn.classList.remove('has'); input.value = ''; };
    btn.addEventListener('click', function () { open(!root.classList.contains('open')); });
    opts.forEach(function (x, i) { x.addEventListener('click', function () { pick(i); }); });
    btn.addEventListener('keydown', function (e) {
      var isOpen = root.classList.contains('open');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); if (!isOpen) { open(true); return; }
        idx = (idx + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length; mark();
      } else if ((e.key === 'Enter' || e.key === ' ') && isOpen) { e.preventDefault(); pick(idx); }
      else if (e.key === 'Escape' && isOpen) { e.stopPropagation(); open(false); }
      else if (e.key === 'Tab') open(false);
    });
    document.addEventListener('click', function (e) { if (!root.contains(e.target)) open(false); });
  }
  var selService = $('#selService'), selBudget = $('#selBudget');
  makeSelect(selService); makeSelect(selBudget);

  /* preselect from ?topic= (links from Services / Solutions / Platform / Work cards) */
  (function () {
    var q = new URLSearchParams(window.ERTES_QUERY || location.search).get('topic');
    var map = { Services: 'Technology consulting', Solutions: 'Industry solutions', Platform: 'Platform engineering', Work: 'Something like your past work', Careers: 'Careers' };
    if (q && map[q]) selService.setValue(map[q]);
  })();

  /* ----- form ----- */
  var form = $('#cform'), fs = $('#fs'), send = $('#send');
  function submit(e) {
    e.preventDefault();
    var d = { type: 'contact' };
    ['name', 'email', 'company', 'service', 'message', 'budget'].forEach(function (k) { d[k] = (form.elements[k].value || '').trim(); });
    var bad = [];
    ['name', 'email', 'message'].forEach(function (k) {
      var el = form.elements[k], no = !d[k] || (k === 'email' && !EMAIL.test(d[k]));
      el.setAttribute('aria-invalid', no ? 'true' : 'false'); if (no) bad.push(k);
    });
    if (bad.length) {
      fs.className = 'err';
      fs.textContent = (bad.indexOf('email') > -1 && d.email) ? 'Please enter a valid email address.' : 'Please add your name, email and a short message.';
      form.elements[bad[0]].focus(); return;
    }
    send.disabled = true; fs.className = ''; fs.textContent = 'Sending…';
    var p = FORM_ENDPOINT
      ? fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(d) }).then(function (r) { if (!r.ok) throw 0; })
      : new Promise(function (r) { setTimeout(r, 600); });
    p.then(function () {
      form.reset(); selService.reset(); selBudget.reset();
      fs.className = 'ok'; fs.textContent = 'Thank you, ' + d.name.split(' ')[0] + '. Your inquiry is in and we will reply within one business day.';
    }).catch(function () {
      fs.className = 'err'; fs.textContent = 'We could not send that. Please email ' + EMAIL_TO + ' instead.';
    }).then(function () { send.disabled = false; });
  }
  form.addEventListener('submit', submit);
  $$('input,textarea', form).forEach(function (el) { el.addEventListener('input', function () { el.setAttribute('aria-invalid', 'false'); }); });

  /* ----- book a call ----- */
  $$('.bookcall').forEach(function (a) {
    a.setAttribute('href', BOOKING_URL || ('mailto:' + EMAIL_TO + '?subject=' + encodeURIComponent('30-minute call')));
    if (BOOKING_URL) { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener'); }
  });

  /* ----- FAQ accordion ----- */
  $$('.it').forEach(function (it, n) {
    var b = $('button', it), p = $('.pn', it);
    var id = 'faq' + n; b.setAttribute('aria-controls', id); p.id = id;
    b.addEventListener('click', function () {
      var open = !it.classList.contains('open');
      $$('.it.open').forEach(function (o) { if (o !== it) { o.classList.remove('open'); $('button', o).setAttribute('aria-expanded', 'false'); } });
      it.classList.toggle('open', open); b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
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
  function cookieInit() {
    if (store.get('ertes-cookies')) return;
    setTimeout(function () { ck.classList.add('show'); }, 600);
  }
  $$('#ck button').forEach(function (b) {
    b.addEventListener('click', function () { store.set('ertes-cookies', b.getAttribute('data-v')); ck.classList.remove('show'); });
  });

  /* ----- sound + reactive lines ----- */
  var soundBtn = $('#sound'), soundHint = $('#soundHint'), on = false, ac = null;
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
  function setSound(v) {
    on = v; if (soundBtn) soundBtn.setAttribute('aria-pressed', v ? 'true' : 'false');
    soundHint.textContent = v ? 'Sound on' : 'Sound off';
    if (v) beep(3);
  }
  if (soundBtn) soundBtn.addEventListener('click', function () { setSound(!on); });
  $('#soundLink').addEventListener('click', function () { setSound(!on); });
  setSound(false);

  var wrap = $('#lines'), cv = $('canvas', wrap), cx = cv.getContext('2d');
  var W = 0, H = 0, dpr = 1, mask = null, mx0 = -999, my0 = -999, vis = false, raf = 0, lastRow = -1, lastBeep = 0;
  var GAP = 7;
  function build() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = wrap.clientWidth; H = wrap.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    var m = document.createElement('canvas'); m.width = W; m.height = H;
    var c = m.getContext('2d');
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    var fs2 = Math.min(H * 1.25, W / 3.1);
    c.font = '700 ' + fs2 + 'px "Inter Tight",Inter,Arial,sans-serif';
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
        var dxm = Math.abs(x - mx0), near = Math.max(0, 1 - Math.hypot(dxm, dy) / 130);
        var len = a ? 7 : 3 + ((x * 7 + r * 13) % 4);
        var al = a ? .78 : .13;
        al = Math.min(1, al + near * .5);
        cx.fillStyle = 'rgba(143,220,255,' + al.toFixed(3) + ')';
        cx.fillRect(x + shift, y, len, 1);
      }
    }
    if (vis) raf = requestAnimationFrame(draw);
  }
  function pointer(e) {
    var r = wrap.getBoundingClientRect();
    mx0 = e.clientX - r.left; my0 = e.clientY - r.top;
    var row = Math.floor(my0 / GAP), now = performance.now();
    if (row !== lastRow && now - lastBeep > 70) { lastRow = row; lastBeep = now; beep(row); }
  }
  wrap.addEventListener('pointermove', pointer);
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
