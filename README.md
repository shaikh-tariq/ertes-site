# ERTES website (merged)

## Shared header and footer (one source of truth)

Every page uses the **same** header (`nav#nav`) and **same** footer (`footer.site-footer`).

- Markup: `partials/header.html` and `partials/footer.html`
- Styles: `css/layout.css` (linked last on every page)
- Edit a partial, then run `npm run sync` to stamp it into all `.html` files (`npm run build` does this automatically). The current page's nav link is highlighted automatically.
- Work and Contact no longer have their own header/menu/footer; they use the shared ones plus `js/site.js` (mobile menu, newsletter).

## Run locally

```bash
npm install     # first time only
npm run dev     # opens http://localhost:5173
npm run build   # copies the site into ./dist for upload to any static host
npm run preview # serves ./dist locally
```
(You can still open `index.html` directly or use VS Code Live Server; the npm scripts are just a convenience.)

## Project structure

```
ertes-site/
├── index.html, about.html, services.html, ...   one HTML file per page
├── css/
│   ├── about.css          About page (all sections: hero, values, how we work, CEO, team, awards, culture)
│   ├── about-bg.css       About page: Homepage dark theme + living background layers (loads after about.css)
│   ├── site.css           bits shared by every page (mobile menu, footer links)
│   ├── pages.css          placeholder pages
│   ├── services.css       services page
│   ├── editorial.css      shared header / full-screen menu / footer / cookie bar (Work page)
│   ├── work.css           Work page
│   ├── contact.css        Contact page
│   ├── contact-bg.css     Contact page: Homepage dark theme + living background layers (loads after contact.css)
│   ├── platform-bg.css    Platform page: Homepage living background layers (loads after pages.css / site.css)
│   ├── solutions-bg.css   Solutions page: Homepage living background layers (loads after pages.css / site.css)
│   └── services-bg.css    Services page: Homepage dark theme + living background layers (loads after the inline styles)
├── js/
│   ├── about.js           About page (scroll effects, CEO, team picker, awards, brands)
│   ├── about-bg.js        About page: Homepage particle network, cursor, HUD, tilt, scramble text
│   ├── site.js            nav, forms, mobile menu (every page)
│   ├── services.js        services page
│   ├── editorial.js       Work page: menu, cookie bar, sound toggle, footer lines, clock
│   ├── work.js            Work page: scroll animation, wires, spark
│   ├── contact.js         Contact page
│   ├── contact-bg.js      Contact page: Homepage particle network, cursor, HUD, scramble text
│   ├── platform-bg.js     Platform page: Homepage particle network, cursor, HUD, scramble text
│   ├── solutions-bg.js    Solutions page: Homepage particle network, cursor, HUD, scramble text
│   └── services-bg.js     Services page: Homepage particle network, cursor, HUD, scramble text
└── assets/                img/, video/ and work/ (project artwork)
```

Script order on `about.html`: `about.js` -> `site.js` -> `about-bg.js`.

**About background (same as Homepage)**: `css/about-bg.css` + `js/about-bg.js`. They add the fixed glow/grid/grain (`#fx`, `#gr`), the interactive particle network (`#gn` — dots flee the pointer and connect to it), the custom cursor and HUD. All About sections are transparent so the background shows through; the network hides itself over the CEO photo, awards photo, team portraits and culture photos (zone list `ZONE_SEL` in `about-bg.js`). Colours are the Homepage tokens at the top of `about-bg.css`.

**Intro (first 3 sections)** = `#hs` in `about.html`, `.hv-*` rules in `css/about.css`, and the "intro" block inside `tick()` in `js/about.js`. Three full-screen looping videos (`assets/video/bg-video-1..3.mp4`) are pinned while you scroll; each statement rises in from dim, holds, lifts away and darkens into the next clip, and the last clip dissolves into the navy "THIS IS WHERE ERTES COMES IN" section. Edit the wording in `about.html`; scroll length is the `height` of `.hv` (480vh). Timing values are in the intro block of `tick()`.

**Awards -> Brands transition**: the awards photo no longer cuts hard to the next section. When the awards scene finishes, the photo wipes away in horizontal blinds (`--bl` on `.ovl`, driven in `tick()`) straight into the white "Brands we've partnered with" section (`#br`).

**Brands section** (`#br`): the big brand names, their card colours and the four small columns are the `BR` and `COLS` arrays at the bottom of `js/about.js` (currently placeholder names, replace with real ERTES clients). Hover or keyboard-focus a name and the others fade while a tilted card floats above it; touch devices cycle through the names automatically. Styles are the `.br-*` rules at the end of `css/about.css`.

**Soft section edges**: `about.js` adds `.ed` fade strips where two light (or two dark) sections meet, so the glow/grid never shows a hard line.

## About page (updated)

`about.html` + `css/about.css` + `js/about.js` replace the previous About page. Team members and photos are in the `M` array at the top of `about.js` (photos in `assets/img/team-*.jpg`); the video backgrounds are `assets/video/bg-video-*.mp4`; the CEO photo is `assets/img/ceo.jpg`. Awards and client stories are the `AW` and `ST` arrays further down in `about.js`.

Pages: index (home) · about · services · solutions · platform · work · contact · careers · terms · privacy · 404
Home, About, **Services**, **Work** and **Contact** are the real designs. The rest are placeholder pages in the same dark theme.

**Services page** = `services.html` + `css/services.css` + `js/services.js`. Sections: 3D orbit hero (Three.js), six full-page service cards, pinned scroll-driven "How we work", closing call-to-action. On desktop one wheel notch / arrow key / Space moves exactly one service card; touch/mobile uses normal scrolling. The whole page runs on a single `requestAnimationFrame` loop in `js/services.js` (search for "ENGINE"): geometry is measured once and per-frame work is transform/opacity only, so keep new effects compositor-friendly. Timing knobs: easing speed = the `105` in `scrollStep`, card transition speed = `snapDur` in `snapTo`, hold between cards = `STRIDE` in JS and `margin-bottom:25vh` on `.svc` in CSS (keep the two in sync). Edit the service and step copy directly in `services.html`.

- Nav, footer, logo, buttons and "Learn more" links are wired on every page. The mobile menu is built by `js/site.js`.
- Contact form and newsletter validate and show a success message. To actually receive submissions, set `FORM_ENDPOINT` at the top of `js/site.js`.
- Needs internet for Google Fonts and Three.js (cdnjs).
- Legal pages contain placeholder text only.

**Work page** = `work.html` + `css/editorial.css` + `css/work.css` + `js/editorial.js` + `js/work.js` (+ `assets/work/`). It does not load `site.js`.
- **Background (new):** same living background and pointer interaction as the Homepage, in `css/work-bg.css` + `js/work-bg.js` (loaded last in `work.html`). Ambient glow/grid/grain, a fixed particle network that is pushed away by and connects to the pointer, the custom cursor ring, the X/Y/scroll HUD (bottom right), tilt on project images, and decode-text on small labels. The network is hidden over hero thumbnails, the logo, project images and the footer lines. To remove it, delete the two `work-bg` tags in `work.html`.
- Hero: floating project thumbnails; scrolling pulls them into the logo (pinned hero, `#wpin` is 200vh tall; tune the scroll length there). The logo glitches near the pointer.
- Projects alternate left, right, centre (classes `l`, `r`, `c`). Add or reorder projects in the `.pj` articles in `work.html`; the wires between cards are rebuilt automatically.
- Wires draw in as you scroll and a blue spark follows the cursor along them (`js/work.js`). Sound on/off in the footer plays soft notes on the wires and footer lines.
- Project images are `assets/work/*` (Cameo photo + four illustrations); swap in real screenshots with the same file names, or edit the `src` in `work.html`.
- "Book a 30-minute call" links to `hello@ertes.com` until you set `BOOKING_URL` at the top of `js/editorial.js`.

**Contact page** = `contact.html` + `css/contact.css` + `js/contact.js`. It does not load `site.js`; the form, menu, cookie bar and sound toggle are all in `js/contact.js`.
- Sections: preloader -> "Let's start something." hero (hanging, swaying logo) -> shutter bars -> dark form ("Let's work together") -> Location / Join us -> Questions (FAQ accordion) -> "Ready to build something bold?" footer with the reactive ERTES lines.
- Top of `js/contact.js`: `FORM_ENDPOINT` (set to Formspree / Netlify Forms / your API to receive enquiries; empty = validates and shows the thank-you message only), `BOOKING_URL` (your Calendly / Cal.com link for "Book a 30-minute call"; empty = opens an email), `EMAIL_TO`.
- Links like `contact.html?topic=Services|Solutions|Platform|Work|Careers` preselect the service in the dropdown.
- Placeholders to replace in `contact.html`: `[Your office address]` block and `[+00 000 000 0000]`; social links point to the networks' home pages until you add your accounts.
- Service options, budget ranges and the FAQ copy are plain HTML in `contact.html`.

**Contact background (same as Homepage)**: `css/contact-bg.css` + `js/contact-bg.js`, loaded after `contact.css` / `contact.js`. Same fixed glow/grid/grain, particle network (dots flee the pointer and connect to it), custom cursor and HUD as the Homepage. Every section is transparent so the background shows through; the network hides itself over the hero logo and the footer ERTES lines canvas (`ZONE_SEL` in `contact-bg.js`). Colour tokens are at the top of `contact-bg.css`.

**Platform background (same as Homepage)**: `css/platform-bg.css` + `js/platform-bg.js`, loaded last in `platform.html`. Same fixed glow/grid/grain, particle network (dots flee the pointer and connect to it, soft glow follows the cursor), custom cursor ring, X/Y/scroll HUD and decode-text on small labels. The old static `body:before` glow is switched off; cards and footer are translucent glass so the network shows through. To keep the network out of artwork later, add selectors to `ZONE_SEL` in `platform-bg.js`. To remove it, delete the two `platform-bg` tags in `platform.html`.

**Solutions background (same as Homepage)**: `css/solutions-bg.css` + `js/solutions-bg.js`, loaded last in `solutions.html`. Identical to the Platform page treatment (glow/grid/grain, interactive particle network, custom cursor, HUD, decode-text labels, glass cards and footer). To remove it, delete the two `solutions-bg` tags in `solutions.html`.

**Services background (same as Homepage)**: `css/services-bg.css` + `js/services-bg.js`, linked in `services.html` (CSS at the end of `<head>`, JS as the last script). Same glow/grid/grain, interactive particle network, custom cursor, HUD and decode-text labels. The whole page is now dark: the sticky service panels stay opaque (they stack over each other) and are painted with the same glow + grid, while the hero, process, CTA and footer are transparent so the live background shows. The nav is always light text. The network hides itself over the 3D service cards (`ZONE_SEL` in `services-bg.js`). To remove it, delete the two `services-bg` tags in `services.html`.
