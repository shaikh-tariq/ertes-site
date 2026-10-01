/* ERTES — Solutions page: Homepage background + pointer interaction, ported to solutions.html.
   Same layers and behaviour as the Homepage ("futuristic extras" + global network):
   - #fx / #gr   ambient glow blobs, grid and film grain
   - #gn         fixed particle network: dots drift, get pushed away by the pointer and
                 connect to it with lines; a soft glow follows the cursor
   - #cur/#cdot  custom cursor (ring grows over links, buttons, cards, form fields)
   - #hud        live X / Y / scroll read-out (bottom-right)
   - scramble    small mono labels decode when they scroll into view
   Add selectors to ZONE_SEL to keep the network out of any artwork (e.g. a hero image). */
(function () {
  'use strict';
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var B = document.body,
    coarse = matchMedia('(pointer:coarse)').matches,
    reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var mk = function (t, id, h) { var e = document.createElement(t); e.id = id; e.innerHTML = h || ''; B.appendChild(e); return e; };

  /* ambient layers (same as Homepage) */
  mk('div', 'fx', '<i></i><i></i><i></i>');
  mk('div', 'gr');

  /* ---------- global interactive network (same engine as Homepage) ---------- */
  (function () {
    var c = document.createElement('canvas');
    c.id = 'gn'; c.setAttribute('aria-hidden', 'true'); B.appendChild(c);
    var x = c.getContext('2d'), m = { x: -999, y: -999 }, W, H, P = [];
    function rs() {
      var d = Math.min(2, window.devicePixelRatio || 1);
      W = innerWidth; H = innerHeight;
      c.width = W * d; c.height = H * d; x.setTransform(d, 0, 0, d, 0, 0);
      var n = Math.min(110, (W * H / 13000) | 0), sp = reduce ? 0 : .4;
      P = [];
      for (var i = 0; i < n; i++) P.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * sp, vy: (Math.random() - .5) * sp });
    }
    rs(); addEventListener('resize', rs);
    addEventListener('pointermove', function (e) { m.x = e.clientX; m.y = e.clientY; }, { passive: true });
    document.addEventListener('pointerleave', function () { m.x = m.y = -999; });

    /* artwork the network should stay out of (white .lt sections) */
    var ZONE_SEL = '.lt';
    function zones() {
      var z = [], els = ZONE_SEL ? $$(ZONE_SEL) : [], i, r;
      for (i = 0; i < els.length; i++) {
        r = els[i].getBoundingClientRect();
        if (r.width > 0 && r.bottom > 0 && r.top < H) z.push(r);
      }
      return z;
    }
    function inZ(z, px, py) {
      for (var i = 0; i < z.length; i++) { var r = z[i]; if (px > r.left && px < r.right && py > r.top && py < r.bottom) return true; }
      return false;
    }
    function ln(a, b, al) {
      x.strokeStyle = 'rgba(44,196,245,' + al + ')';
      x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke();
    }
    var vis = true;
    document.addEventListener('visibilitychange', function () { vis = !document.hidden; });
    (function f() {
      requestAnimationFrame(f); if (!vis) return;
      x.clearRect(0, 0, W, H);
      var z = zones(), i, j, p, a, b, d, dx, dy, hid = [];
      /* soft glow that follows the pointer */
      if (m.x > 0 && !inZ(z, m.x, m.y)) {
        var q = x.createRadialGradient(m.x, m.y, 0, m.x, m.y, 220);
        q.addColorStop(0, 'rgba(44,196,245,.2)'); q.addColorStop(1, 'rgba(44,196,245,0)');
        x.fillStyle = q; x.fillRect(m.x - 220, m.y - 220, 440, 440);
      }
      for (i = 0; i < P.length; i++) {
        p = P[i]; dx = p.x - m.x; dy = p.y - m.y; d = Math.hypot(dx, dy) || 1;
        if (d < 150) { p.x += dx / d * (150 - d) * .02; p.y += dy / d * (150 - d) * .02; }   /* pointer pushes dots away */
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0; if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        hid[i] = inZ(z, p.x, p.y);
      }
      x.lineWidth = 1;
      for (i = 0; i < P.length; i++) {
        if (hid[i]) continue; a = P[i];
        x.fillStyle = 'rgba(44,196,245,.75)'; x.beginPath(); x.arc(a.x, a.y, 2, 0, 7); x.fill();
        for (j = i + 1; j < P.length; j++) {
          if (hid[j]) continue; b = P[j]; d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 120) ln(a, b, .3 * (1 - d / 120));
        }
        d = Math.hypot(a.x - m.x, a.y - m.y);
        if (d < 180) ln(a, m, .7 * (1 - d / 180));   /* dots connect to the pointer */
      }
    })();
  })();

  /* ---------- custom cursor + HUD (same as Homepage) ---------- */
  if (!coarse) {
    var cr = mk('div', 'cur'), cd = mk('div', 'cdot'), hd = mk('div', 'hud');
    var X = innerWidth / 2, Y = innerHeight / 2, rx = X, ry = Y;
    addEventListener('pointermove', function (e) {
      X = e.clientX; Y = e.clientY; cd.style.transform = 'translate(' + X + 'px,' + Y + 'px)';
      cr.classList.toggle('h', !!(e.target.closest && e.target.closest('a,button,.bt,.card,input,textarea,select')));
    }, { passive: true });
    (function f() {
      rx += (X - rx) * .16; ry += (Y - ry) * .16; cr.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      var sc = Math.round(scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight) * 100);
      hd.innerHTML = 'SYS.ONLINE <b>●</b> &nbsp;X ' + String(X | 0).padStart(4, '0') + ' Y ' + String(Y | 0).padStart(4, '0') + ' &nbsp;SCROLL ' + String(sc).padStart(2, '0') + '%';
      requestAnimationFrame(f);
    })();
  }

  /* ---------- scramble-decode small labels on reveal (same as Homepage) ---------- */
  if (!reduce && 'IntersectionObserver' in window) {
    var GL = '01ABCDEF<>/_#$%';
    var scr = function (e) {
      var t = e.dataset.t, f = 0, it = setInterval(function () {
        e.textContent = t.split('').map(function (ch, i) { return ch === ' ' || i < f / 2 ? ch : GL[Math.random() * GL.length | 0]; }).join('');
        if (++f > t.length * 2) { e.textContent = t; clearInterval(it); }
      }, 30);
    };
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { so.unobserve(e.target); scr(e.target); } });
    }, { threshold: .6 });
    $$('.tag, .card small, .badge').forEach(function (e) {
      if (!e.children.length && e.textContent.trim()) { e.dataset.t = e.textContent; so.observe(e); }
    });
  }
})();
