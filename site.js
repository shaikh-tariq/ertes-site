/* ERTES — shared behaviour for every page: active nav link, mobile menu,
   newsletter box, contact form, clickable work cards. */
(function () {
  'use strict';

  /* Point this at a real form backend (Formspree, Netlify Forms, your API…)
     to receive contact-form and newsletter submissions. While it is empty the
     forms validate and show a success message but send nothing. */
  var FORM_ENDPOINT = '';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  /* ---------- active link ---------- */
  var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  $$('nav ul a').forEach(function (a) {
    var on = (a.getAttribute('href') || '').toLowerCase() === page;
    a.classList.toggle('cur', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });

  /* ---------- sticky-nav background on placeholder pages ---------- */
  var nav = $('nav#nav');
  if (nav && document.body.classList.contains('ph')) {
    var s = function () { nav.classList.toggle('s', window.scrollY > 40); };
    s(); window.addEventListener('scroll', s, { passive: true });
  }

  /* ---------- mobile menu ---------- */
  var inner = nav && $('div', nav);
  if (inner) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mbtn';
    btn.setAttribute('aria-label', 'Open menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'mnav');
    btn.innerHTML = '<span></span><span></span>';
    inner.appendChild(btn);

    var menu = document.createElement('div');
    menu.id = 'mnav';
    menu.setAttribute('aria-hidden', 'true');
    var html = '', i = 0;
    $$('nav ul a').forEach(function (a) {
      html += '<a style="--i:' + (i++) + '" href="' + a.getAttribute('href') + '"' +
        (a.classList.contains('cur') ? ' class="cur"' : '') + '>' + a.textContent + '</a>';
    });
    var cta = $$('a', inner).filter(function (a) { return !a.closest('ul') && !a.classList.contains('lgo'); })[0];
    if (cta) html += '<a class="mcta" style="--i:' + i + '" href="' + cta.getAttribute('href') + '">' + cta.textContent + '</a>';
    menu.innerHTML = html;
    document.body.appendChild(menu);

    var setOpen = function (open) {
      menu.classList.toggle('open', open);
      btn.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.setAttribute('aria-hidden', open ? 'false' : 'true');
      document.documentElement.style.overflow = open ? 'hidden' : '';
    };
    btn.addEventListener('click', function () { setOpen(!menu.classList.contains('open')); });
    menu.addEventListener('click', function (e) {
      if (e.target === menu || e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) { setOpen(false); btn.focus(); }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1000 && menu.classList.contains('open')) setOpen(false);
    });
  }

  /* ---------- footer: back to top ---------- */
  $$('.ft-top').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var r = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: r ? 'auto' : 'smooth' });
    });
  });

  /* ---------- helper: send data if an endpoint is configured ---------- */
  function send(data) {
    if (!FORM_ENDPOINT) return new Promise(function (r) { setTimeout(r, 500); });
    return fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (res) { if (!res.ok) throw new Error('bad status'); });
  }

  /* ---------- newsletter (footer) ---------- */
  $$('footer .bt').forEach(function (b) {
    if (!/subscribe/i.test(b.textContent)) return;
    var box = b.parentElement, input = $('input', box);
    if (!input) return;
    var msg = document.createElement('p');
    msg.className = 'nl-msg';
    msg.setAttribute('role', 'status');
    msg.setAttribute('aria-live', 'polite');
    box.appendChild(msg);
    b.setAttribute('role', 'button');
    b.setAttribute('tabindex', '0');
    var busy = false;
    var submit = function (e) {
      if (e) e.preventDefault();
      if (busy) return;
      var v = input.value.trim();
      if (!EMAIL.test(v)) {
        msg.className = 'nl-msg err';
        msg.textContent = 'Please enter a valid email address.';
        input.focus();
        return;
      }
      busy = true;
      msg.className = 'nl-msg';
      msg.textContent = 'Subscribing…';
      send({ type: 'newsletter', email: v }).then(function () {
        msg.className = 'nl-msg ok';
        msg.textContent = 'Thanks — you are on the list.';
        input.value = '';
      }).catch(function () {
        msg.className = 'nl-msg err';
        msg.textContent = 'Something went wrong. Please try again.';
      }).then(function () { busy = false; });
    };
    b.addEventListener('click', submit);
    b.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') submit(e); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(e); });
  });

  /* ---------- contact form ---------- */
  var form = $('#contact-form');
  if (form) {
    var status = $('#form-status');
    var submitBtn = $('button[type=submit]', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = {};
      new FormData(form).forEach(function (v, k) { d[k] = String(v).trim(); });
      var errs = [];
      ['name', 'email', 'message'].forEach(function (k) {
        var el = form.elements[k];
        var bad = !d[k] || (k === 'email' && !EMAIL.test(d[k]));
        el.setAttribute('aria-invalid', bad ? 'true' : 'false');
        if (bad) errs.push(k);
      });
      if (errs.length) {
        status.className = 'form-status err';
        status.textContent = errs.indexOf('email') > -1 && d.email
          ? 'Please enter a valid email address.'
          : 'Please fill in your name, email and a short message.';
        form.elements[errs[0]].focus();
        return;
      }
      submitBtn.disabled = true;
      status.className = 'form-status';
      status.textContent = 'Sending…';
      send(Object.assign({ type: 'contact' }, d)).then(function () {
        form.reset();
        status.className = 'form-status ok';
        status.textContent = 'Thanks ' + d.name.split(' ')[0] + ' — your message is in. We will reply within one business day.';
      }).catch(function () {
        status.className = 'form-status err';
        status.textContent = 'We could not send that. Please email hello@ertes.com instead.';
      }).then(function () { submitBtn.disabled = false; });
    });
  }

  /* ---------- homepage: work cards open the Work page ---------- */
  $$('.wc').forEach(function (c) {
    c.style.cursor = 'pointer';
    c.setAttribute('role', 'link');
    c.setAttribute('tabindex', '0');
    var go = function () { location.href = 'work.html'; };
    c.addEventListener('click', go);
    c.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
  });
})();
