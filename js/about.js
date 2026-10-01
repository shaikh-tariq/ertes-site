const VIDEOS = [
  "assets/video/bg-video-1.mp4",
  "assets/video/bg-video-2.mp4",
  "assets/video/bg-video-3.mp4",
];
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)],
  cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const M = [
  ["Sarah Kim", "UI/UX Designer", "assets/img/team-sarah.jpg"],
  ["David Chen", "Web Developer", "assets/img/team-david.jpg"],
  ["Maya Patel", "SEO Marketing", "assets/img/team-maya.jpg"],
  ["Alex Rivera", "Brand Strategy", "assets/img/team-alex.jpg"],
];
const SC = [],
  split = (e) =>
    (e.innerHTML = e.textContent
      .trim()
      .split(" ")
      .map((w, i) => `<span class="w" style="--i:${i}">${w}</span>`)
      .join(" "));
function scrub(e, by) {
  const t = e.textContent.trim();
  e.innerHTML =
    by == "c"
      ? e.innerHTML.replace(
          />([^<]+)</g,
          (m, s) =>
            ">" +
            [...s]
              .map(
                (c) =>
                  `<b class="k" style="font-weight:inherit">${c == " " ? "&nbsp;" : c}</b>`,
              )
              .join("") +
            "<",
        )
      : t
          .split(" ")
          .map((w) => `<span class="k">${w}</span>`)
          .join(" ");
  SC.push([e, $$("#" + e.id + " .k")]);
}
scrub($("#s1"));
const ceoQt = $("#ceoQt");
ceoQt.innerHTML = ceoQt.textContent
  .trim()
  .split(" ")
  .map((w) => `<span class="qw">${w}</span>`)
  .join(" ");
scrub($("#sk"), "c");
const io = new IntersectionObserver(
  (e) =>
    e.forEach((x) => {
      if (!x.isIntersecting) return;
      const o = x.target;
      o.classList.add("on");
      const v = o.querySelector && o.querySelector("video");
      if (v && !v.src) {
        v.src = VIDEOS[+v.dataset.k];
        v.play().catch(() => {});
      }
    }),
  { threshold: 0.3 },
);
$$(".rv").forEach((e) => io.observe(e));

// team: pick a card, it flies to the centre, gets analysed, then is revealed
const T = $("#tc"),
  tv = $("#tview"),
  ctr = $("#ctr"),
  ci = $("#ci"),
  ci2 = $("#ci2"),
  tsn = $("#tsn"),
  tlab = $("#lab"),
  tpct = $("#pct"),
  tnm = $("#nm2"),
  tl = $("#tlines");
// [left %, top %, width in vw, rotation]
const pos = [
  [2, 15, 8.4, -5],
  [11, 8, 7.4, 4],
  [4, 40, 7.2, 3],
  [14, 34, 8.6, -4],
  [3, 62, 7.6, 5],
  [15, 58, 8.2, -3],
  [9, 76, 7, 4],
  [70, 12, 7.4, 4],
  [80, 7, 8.4, -4],
  [90, 15, 7.8, 3],
  [72, 36, 7.6, -3],
  [84, 34, 8.6, 5],
  [76, 62, 8, -5],
  [88, 60, 7.4, 4],
];
const cd = $("#cards"),
  cards = [],
  lines = [];
pos.forEach((p, i) => {
  const m = M[i % 4],
    d = document.createElement("div");
  d.className = "cd";
  d.style.cssText = `left:${p[0]}%;top:${p[1]}%;width:clamp(72px,${p[2]}vw,170px);--r:${p[3]}deg;--i:${i};--d:${((i % 5) + 1) * 4}`;
  d.innerHTML = `<img src="${m[2]}" alt="${m[0]}">`;
  d.onclick = () => pick(i);
  cd.appendChild(d);
  cards.push(d);
  const ln = document.createElementNS("http://www.w3.org/2000/svg", "line");
  tl.appendChild(ln);
  lines.push(ln);
});
let run = 0,
  curCard = -1;
function pick(i) {
  if (i === curCard) return;
  const id = ++run,
    el = cards[i],
    m = M[i % 4];
  if (curCard >= 0) {
    cards[curCard].classList.remove("gone");
    lines[curCard].classList.remove("hot");
  }
  $$(".fly").forEach((f) => f.remove());
  curCard = i;
  lines[i].classList.add("hot");
  ctr.classList.remove("sc", "ok");
  tnm.style.opacity = 0;
  ci.style.opacity = 0;
  ci2.style.opacity = 0;
  tsn.style.top = "0";
  tlab.textContent = "LOCKING ON…";
  tpct.textContent = "";
  const tr = T.getBoundingClientRect(),
    er = el.getBoundingClientRect(),
    vr = tv.getBoundingClientRect(),
    sw = el.offsetWidth,
    sh = el.offsetHeight,
    sx = er.left + er.width / 2 - tr.left - sw / 2,
    sy = er.top + er.height / 2 - tr.top - sh / 2,
    rot = el.style.getPropertyValue("--r") || "0deg",
    f = document.createElement("div");
  f.className = "fly";
  f.innerHTML = `<img src="${m[2]}" alt="">`;
  Object.assign(f.style, { left: sx + "px", top: sy + "px", width: sw + "px", height: sh + "px" });
  T.appendChild(f);
  el.classList.add("gone");
  const st = { left: sx + "px", top: sy + "px", width: sw + "px", height: sh + "px" },
    an = f.animate(
      [
        { ...st, transform: `rotate(${rot}) scale(1)` },
        { ...st, transform: `rotate(${rot}) scale(1.16) translateY(-14px)`, offset: 0.2 },
        {
          left: vr.left - tr.left + "px",
          top: vr.top - tr.top + "px",
          width: vr.width + "px",
          height: vr.height + "px",
          transform: "rotate(0deg) scale(1)",
        },
      ],
      { duration: 950, easing: "cubic-bezier(.6,0,.2,1)", fill: "forwards" },
    );
  an.onfinish = () => {
    if (id !== run) return;
    ci.src = ci2.src = m[2];
    ci.style.opacity = ci2.style.opacity = 1;
    f.remove();
    analyse(id, m);
  };
}
function analyse(id, m) {
  ctr.classList.add("sc");
  const t0 = performance.now(),
    D = 2000;
  (function step(now) {
    if (id !== run) return;
    const t = cl((now - t0) / D),
      e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    tsn.style.top = `calc(${e * 100}% - 2px)`;
    ci2.style.clipPath = `inset(0 0 ${100 - e * 100}% 0)`;
    tpct.textContent = Math.round(e * 100) + "%";
    tlab.textContent = t < 0.4 ? "SCANNING…" : t < 0.8 ? "ANALYSING…" : "MATCHING…";
    if (t < 1) return requestAnimationFrame(step);
    ctr.classList.remove("sc");
    ctr.classList.add("ok");
    tlab.textContent = "IDENTIFIED";
    tpct.textContent = "";
    tnm.innerHTML = `${m[0].toUpperCase()}<small>${m[1].toUpperCase()}</small>`;
    tnm.style.opacity = 1;
  })(t0);
}
// lines from every card to the centre frame
function drawLines() {
  const tr = T.getBoundingClientRect();
  if (tr.bottom < 0 || tr.top > innerHeight) return;
  const vr = tv.getBoundingClientRect(),
    cx = vr.left + vr.width / 2 - tr.left,
    cy = vr.top + vr.height / 2 - tr.top;
  cards.forEach((c, i) => {
    const r = c.getBoundingClientRect(),
      l = lines[i];
    l.setAttribute("x1", r.left + r.width / 2 - tr.left);
    l.setAttribute("y1", r.top + r.height / 2 - tr.top);
    l.setAttribute("x2", cx);
    l.setAttribute("y2", cy);
  });
}
(function ln() {
  drawLines();
  requestAnimationFrame(ln);
})();
// first visit only: when the section first scrolls into view, run the demo pick once.
// After that, a card only swaps in when the user clicks it.
new IntersectionObserver(
  (entries, obs) => {
    if (!entries[0].isIntersecting) return;
    obs.disconnect();
    if (curCard < 0) pick(2);
  },
  { threshold: 0.45 },
).observe(T);
T.onpointermove = (e) => {
  const r = T.getBoundingClientRect();
  T.style.setProperty("--mx", (e.clientX - r.left) / r.width - 0.5);
  T.style.setProperty("--my", (e.clientY - r.top) / r.height - 0.5);
};
// awards, stories, culture
const AW = [
  ["The FWA", "Site of the day", "2026"],
  ["Awwwards", "Honorable mention", "2026"],
  ["CSS Design Awards", "Website of the day", "2025"],
  ["AWS Partner Network", "Advanced tier", "2025"],
  ["Fintech Awards", "Shortlist", "2025"],
];
$("#ac").innerHTML = AW.map(
  (a) => `<div><b>${a[0]}</b>${a[1]}<span>${a[2]}</span></div>`,
).join("");
const PH = [
  [6, 10, 20, 15, -6, 0],
  [70, 8, 22, 17, 5, 50],
  [12, 52, 22, 17, 4, 0],
  [72, 52, 20, 26, -5, 100],
  [38, 64, 18, 16, -3, 50],
  [28, 6, 16, 14, 6, 100],
  [54, 68, 17, 15, 5, 0],
  [84, 30, 15, 14, -4, 50],
];
const IM = [
    "assets/img/culture.jpg",
    "assets/img/hero-fallback.jpg",
    "assets/img/team-maya.jpg",
    "assets/img/culture.jpg",
  ],
  ph = PH.map((p, i) => {
    const d = document.createElement("div");
    d.className = "ph";
    d.style.cssText = `left:${p[0]}%;top:${p[1]}%;width:${p[2]}vw;height:${p[3]}vw;--r:${p[4]}deg`;
    d.innerHTML = `<img src="${IM[i % 4]}" style="object-position:${p[5]}% ${p[5]}%" alt="">`;
    $("#cl .stk").appendChild(d);
    return d;
  });
const hv = $("#hs"),
  hvV = $$("#hs .hv-v"),
  hvT = $$("#hs .hv-t"),
  hvSub = $("#hs .hv-sub"),
  hvTint = $("#hs .hv-tint"),
  hvDark = $("#hs .hv-dark"),
  hvEnd = $("#hs .hv-end"),
  hvVids = $("#hs .hv-vids"),
  inn = $("#in"),
  bg = $("#bg"),
  o1 = $("#o1"),
  tt = $$("#in .t"),
  pg = $("#pg"),
  cu = $("#cu2"),
  m1 = $("#m1"),
  aw = $("#aw"),
  ovl = $("#ovl"),
  mt = $("#mt"),
  ac = $("#ac"),
  cle = $("#cl");
if (matchMedia("(pointer:fine)").matches) {
  addEventListener("pointermove", (e) => {
    cu.style.opacity = 1;
    cu.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
  });
  document.addEventListener("pointerover", (e) =>
    cu.classList.toggle("g", !!e.target.closest("a,button,.vr,.cd,.tb,.gw")),
  );
}
$$("body > .lt, body > .dk").forEach((s) => {
  const dk = s.classList.contains("dk"),
    same = (n) => n && n.classList && n.classList.contains(dk ? "dk" : "lt"),
    pv = s.previousElementSibling,
    nx = s.nextElementSibling;
  if (same(pv) || (!dk && pv && pv.id == "in"))
    s.insertAdjacentHTML("afterbegin", '<i class="ed t"></i>');
  if (same(nx)) s.insertAdjacentHTML("afterbegin", '<i class="ed b"></i>');
});
const LD = $$(".lt,.dk"),
  VR = $$(".vr");
addEventListener("pointermove", (e) =>
  LD.forEach((s) => {
    const r = s.getBoundingClientRect();
    if (e.clientY > r.top && e.clientY < r.bottom) {
      s.style.setProperty("--mx", e.clientX - r.left + "px");
      s.style.setProperty("--my", e.clientY - r.top + "px");
    }
  }),
);
const ovS = $("#ov"),
  ovR = $$("#ov .ov-r"),
  ovCard = $("#ovcard"),
  ovCol = $("#ovc"),
  ovSlab = $("#ovslab"),
  ovTag = $("#ovtag"),
  ovIntro = $("#ov .ov-intro"),
  ease = (t) => 1 - Math.pow(1 - t, 3);
const OV_A = 74,
  OV_D = 1100,
  ovW2 = ovR.map((r) => {
    const w = document.createElement("div");
    w.className = "ov-w";
    r.parentNode.insertBefore(w, r);
    w.appendChild(r);
    return w;
  });
let ovH = [],
  ovBase = 0,
  ovW = 0;
function ovMeasure() {
  ovW = innerWidth;
  ovH = ovR.map((r) => r.offsetHeight);
  ovBase = ovIntro.offsetHeight + parseFloat(getComputedStyle(ovIntro).marginBottom);
}
addEventListener("resize", () => (ovH = []));
document.fonts && document.fonts.ready.then(() => (ovH = []));
const hw2 = $("#hw2"),
  hw2s = $("#hw2s"),
  hwS = $$("#hw2 .hw2-s"),
  hwF = $("#hw2f"),
  hwN = $$("#hw2 .hw2-n"),
  ceoS = $("#ceo"),
  ceoImg = $("#ceoImg"),
  ceoShade = $("#ceoShade"),
  ceoInfo = $("#ceoInfo"),
  ceoQw = $$("#ceoQt .qw"),
  ceoQm = $("#ceoQm"),
  ceoCL = $("#ceoCapL"),
  ceoCR = $("#ceoCapR");
const awTg = $("#aw .tg");
const HV = { tint: 0.9, intro: 0 };
hvV.forEach((v, i) => {
  v.src = VIDEOS[i];
  v.addEventListener("playing", () => v.classList.add("ok"));
  v.play().catch(() => {});
});
// load-in: the first statement rises out of the blue tint by itself
(function () {
  const t0 = performance.now();
  (function s(n) {
    const t = cl((n - t0 - 250) / 1500);
    HV.intro = ease(t);
    HV.tint = 0.9 * (1 - HV.intro);
    tick();
    if (t < 1) requestAnimationFrame(s);
  })(t0);
})();
function tick() {
  const H = innerHeight,
    W = innerWidth;
  LD.forEach((s) => {
    const r = s.getBoundingClientRect();
    if (r.bottom < 0 || r.top > H) return;
    s.style.setProperty(
      "--py",
      cl((H - r.top) / (H + r.height)) * 30 - 15 + "%",
    );
  });
  {
    const r = ovS.getBoundingClientRect(),
      p = cl(-r.top / (r.height - H)),
      N = ovR.length,
      f = cl((p - 0.06) / 0.8) * N;
    if (!ovH.length || ovW != W) ovMeasure();
    let h = 0;
    ovR.forEach((row, i) => {
      const t = f - i;
      let th, op;
      if (t <= -1) (th = 90), (op = 0);
      else if (t < 0) (th = 90 - (90 - OV_A) * ease(t + 1)), (op = cl(t + 1.15));
      else (th = OV_A * (1 - ease(cl(t)))), (op = 1);
      const a = (th * Math.PI) / 180,
        ph = (ovH[i] * Math.cos(a) * OV_D) / (OV_D + ovH[i] * Math.sin(a));
      h += ph;
      ovW2[i].style.height = ph + "px";
      row.style.transform = `perspective(${OV_D}px) rotateX(${-th}deg)`;
      row.style.opacity = op;
      row.style.setProperty("--rp", (t < 0 ? 0 : ease(cl(t))).toFixed(3));
    });
    ovCard.style.height = h + "px";
    const done = cl((f - (N - 0.35)) / 0.35);
    ovSlab.style.opacity = cl(p / 0.05) * (1 - done);
    ovTag.style.opacity = done;
    const bottom = ovCol.offsetTop + ovBase + h + 40,
      s = Math.max(0, bottom - H * 0.66) + done * H * 0.12;
    ovCol.style.transform = `translateY(${-s}px)`;
  }
  {
    const r = hw2.getBoundingClientRect(),
      p = cl(-r.top / (r.height - H));
    hwS.forEach((s, i) => {
      const a = 0.03 + i * 0.15;
      s.style.setProperty("--sp", ease(cl((p - a) / 0.1)).toFixed(3));
      s.style.setProperty("--sp2", ease(cl((p - a - 0.05) / 0.1)).toFixed(3));
    });
    const fill = cl((p - 0.03) / 0.6);
    hwF.style.transform = `scaleX(${fill})`;
    hwN.forEach((n, i) => n.classList.toggle("on", p > 0.02 && fill >= i / 4));
    const k = cl((p - 0.74) / 0.26);
    hw2s.style.opacity = 1 - k * 0.6;
    hw2s.style.transform = `scale(${1 - k * 0.05})`;
  }
  {
    const r = ceoS.getBoundingClientRect(),
      p = cl(-r.top / (r.height - H)),
      pan = cl((p - 0.04) / 0.5),
      io = cl((p - 0.1) / 0.2),
      n = Math.round(cl((p - 0.36) / 0.4) * ceoQw.length);
    ceoImg.style.transform = `translateY(${-pan * 0.5 * H}px) scale(${1.06 - 0.06 * cl(p / 0.3)})`;
    ceoShade.style.opacity = cl((p - 0.08) / 0.3);
    ceoInfo.style.opacity = 1 - io;
    ceoInfo.style.transform = `translateY(${-io * 50}px)`;
    ceoQw.forEach((w, i) => w.classList.toggle("f", i < n));
    ceoQt.parentNode.style.opacity = cl((p - 0.3) / 0.08);
    ceoQm.style.opacity = cl((p - 0.76) / 0.08);
    ceoCL.style.opacity = ceoCR.style.opacity = cl((p - 0.5) / 0.1);
  }
  {
    // intro: 3 pinned video statements. Text rises in from dim, holds, then
    // lifts away while the picture darkens into the next clip. The last clip
    // dissolves into the flat navy of the next section (no hard edge).
    const r = hv.getBoundingClientRect();
    if (r.bottom > -50 && r.top < H) {
      const p = cl(-r.top / (r.height - H)),
        u = p * 3,
        bump = (c, w) => Math.max(0, 1 - Math.abs(u - c) / w);
      hvV.forEach((v, i) => {
        if (i) v.style.opacity = ease(cl((u - (i - 0.16)) / 0.32));
        v.style.transform = `scale(${1.08 - p * 0.05}) translateY(${-p * 2}%)`;
        if (v.paused && v.src) v.play().catch(() => {});
      });
      const he = ease(cl((u - 2.72) / 0.28));
      hvDark.style.opacity = (0.42 + 0.5 * Math.max(bump(1, 0.24), bump(2, 0.24))) * (1 - he);
      hvVids.style.opacity = 1 - he;
      hvTint.style.opacity = HV.tint * (1 - ease(cl(p / 0.05)));
      hvT.forEach((t, i) => {
        const l = u - i,
          en = i ? ease(cl((l - 0.1) / 0.24)) : HV.intro,
          ex = ease(cl((l - (i == 2 ? 0.72 : 0.7)) / 0.24));
        t.style.opacity = (0.16 * ease(cl((l - 0.02) / 0.08)) + 0.84 * en) * (1 - ex);
        t.style.transform = `translateY(${(1 - en) * 9 - ex * 9}vh)`;
      });
      const l1 = u - 1;
      hvSub.style.opacity = 0.92 * ease(cl((l1 - 0.3) / 0.2));
      hvEnd.style.opacity = he;
    } else {
      hvV.forEach((v) => v.pause());
    }
  }
  let r = inn.getBoundingClientRect(),
    p = cl(-r.top / (r.height - H));
  bg.style.transform = `scale(${Math.exp(cl(p / 0.8) * Math.log(70))})`;
  tt.forEach((e, i) => {
    e.style.opacity = 1 - cl(p * 5);
    e.style.transform = `translateY(${(i ? 1 : -1) * p * 160}px)`;
  });
  o1.style.opacity = cl((p - 0.5) / 0.3);
  bg.style.opacity = 1 - cl((p - 0.5) / 0.3);
  SC.forEach(([e, it]) => {
    const r = e.getBoundingClientRect(),
      n = Math.round(cl((H * 0.85 - r.top) / (r.height + H * 0.3)) * it.length);
    it.forEach((w, i) => w.classList.toggle("f", i < n));
  });
  r = m1.parentNode.getBoundingClientRect();
  m1.style.transform = `translateX(${-(scrollY * 0.5) % (m1.scrollWidth / 3)}px)`;
  r = aw.getBoundingClientRect();
  // photo expands over the first 2 screens; the last 0.75 screen wipes it away in blinds
  p = cl(-r.top / (2 * H));
  const bq = ease(cl((-r.top - 2 * H) / (0.75 * H)));
  const g = cl((p - 0.1) / 0.45);
  ovl.style.width = 230 + (W - 230) * g + "px";
  ovl.style.height = 330 + (H - 330) * g + "px";
  ovl.style.borderRadius = 50 * (1 - g) + "%";
  ovl.style.setProperty("--o", g);
  mt.style.transform = `translateX(${-p * W * 1.4}px)`;
  mt.style.color = g > 0.7 ? "#F4F7F9" : "";
  mt.style.opacity = 1 - cl((p - 0.55) / 0.2);
  ac.style.transform = `translateY(${(1 - cl((p - 0.5) / 0.3)) * 130 + bq * 40}%)`;
  ac.style.opacity = 1 - cl(bq / 0.55);
  awTg.style.opacity = 1 - cl(bq / 0.4);
  ovl.style.setProperty("--bl", bq);
  r = cle.getBoundingClientRect();
  p = cl(-r.top / (r.height - H));
  ph.forEach((d, i) =>
    d.classList.toggle("in", p > (i + 0.5) / (ph.length + 1)),
  );
  if (pg) pg.style.width = (scrollY / (document.body.scrollHeight - H)) * 100 + "%";
}
addEventListener("scroll", () => requestAnimationFrame(tick), {
  passive: true,
});
tick();

// (the old per-section dot field was replaced by the Homepage particle network: js/about-bg.js)

// brands we've partnered with: hover a name -> the rest fade, a tilted card floats above it
(() => {
  const BR = [
    ["Luxury Presence", "#1b1b1d", "#f4f4f4"],
    ["Credible", "#d6ecf3", "#2a5da8"],
    ["Yellowtail", "#efe9df", "#1b1b1d"],
    ["My Worker", "#ebe7dc", "#1b1b1d"],
    ["CrissCross", "#1b1b1d", "#f4f4f4"],
    ["Ockto", "#d9f0ee", "#1f8f8a"],
    ["Technish", "#c8ee4a", "#1b1b1d"],
    ["Ubiqu", "#5b83c9", "#f4f4f4"],
  ];
  const COLS = [
    ["Fiare Oy", "Nettiauto", "Budo Law", "DAC Recruiting", "Globalstar Interactive"],
    ["RevNet", "ROI High", "Flow Row", "Vendep Oy", "Billionaire Suit"],
    ["Berkley", "Re.Events", "Cirgo Bike", "Julia Daviy", "FieldBridge LLC"],
    ["Lumen Health", "SoundBoard AI", "Mizuno CGI", "Joonko", "Many more..."],
  ];
  const h = $("#brh"), card = $("#brc"), stage = $("#brs");
  if (!h) return;
  h.innerHTML = BR.map(
    (b, i) =>
      `<span class="br-w" data-i="${i}" tabindex="0">${b[0]}</span>${i < BR.length - 1 ? ", " : ""}`,
  ).join("");
  $("#brl").innerHTML = COLS.map(
    (c) => `<ul>${c.map((n) => `<li${n.startsWith("Many") ? ' class="m"' : ""}>${n}</li>`).join("")}</ul>`,
  ).join("");
  const words = [...h.querySelectorAll(".br-w")];
  let cur = -1, auto = null, hovering = false;
  const rots = [-5, 4, -3, 6, -6, 3, -4, 5];
  const show = (i) => {
    if (i === cur) return;
    cur = i;
    words.forEach((w, k) => w.classList.toggle("on", k === i));
    h.classList.add("act");
    const w = words[i], sr = stage.getBoundingClientRect(), wr = w.getBoundingClientRect();
    const b = BR[i], cw = card.offsetWidth || 160;
    card.textContent = b[0].toLowerCase() === "ubiqu" ? "ubiqu" : b[0];
    card.style.background = b[1];
    card.style.color = b[2];
    let x = wr.left - sr.left + wr.width / 2;
    x = Math.max(cw / 2, Math.min(sr.width - cw / 2, x));
    card.style.left = x + "px";
    card.style.top = wr.top - sr.top - 6 + "px";
    card.style.setProperty("--rot", rots[i] + "deg");
    card.classList.add("show");
  };
  const clear = () => {
    cur = -1;
    words.forEach((w) => w.classList.remove("on"));
    h.classList.remove("act");
    card.classList.remove("show");
  };
  words.forEach((w, i) => {
    w.addEventListener("pointerenter", () => { hovering = true; show(i); });
    w.addEventListener("pointerleave", () => { hovering = false; clear(); });
    w.addEventListener("focus", () => show(i));
    w.addEventListener("blur", clear);
    w.addEventListener("click", () => show(i));
  });
  // touch / no-hover devices: gently cycle through the names while the section is on screen
  if (matchMedia("(hover: none)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let n = 0;
    new IntersectionObserver((e) => {
      clearInterval(auto);
      if (e[0].isIntersecting)
        auto = setInterval(() => { if (!hovering) { cur = -1; show(n++ % BR.length); } }, 1700);
      else clear();
    }, { threshold: 0.5 }).observe(stage);
  }
  addEventListener("resize", () => { const i = cur; cur = -1; if (i > -1) show(i); });
})();
