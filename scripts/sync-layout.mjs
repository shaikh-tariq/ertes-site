// Stamps partials/header.html + partials/footer.html into every page so the header and
// footer are identical everywhere. Edit the partials, then run `npm run sync`.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const header = readFileSync('partials/header.html', 'utf8').trim();
const footer = readFileSync('partials/footer.html', 'utf8').trim();
const H = (page) => {
  // mark the current page's link so it is highlighted even before JS runs
  const h = header.replace(new RegExp(`(<li><a href="${page}")>`), '$1 class="cur" aria-current="page">');
  return `<!-- layout:header -->${h}<!-- /layout:header -->`;
};
const F = `<!-- layout:footer -->${footer}<!-- /layout:footer -->`;

for (const f of readdirSync('.').filter((n) => n.endsWith('.html'))) {
  let s = readFileSync(f, 'utf8');
  const before = s;
  const mark = (name) => new RegExp(`<!-- layout:${name} -->[\\s\\S]*?<!-- /layout:${name} -->`);
  const hdr = H(f);
  // header
  if (mark('header').test(s)) s = s.replace(mark('header'), () => hdr);
  else if (/<header id="top">[\s\S]*?<\/header>/.test(s)) {
    s = s.replace(/<header id="top">[\s\S]*?<\/header>/, () => hdr);
    s = s.replace(/<nav id="menu"[\s\S]*?<\/nav>\s*/, '');
  } else s = s.replace(/<nav id="nav">[\s\S]*?<\/nav>/, () => hdr);
  // footer
  if (mark('footer').test(s)) s = s.replace(mark('footer'), () => F);
  else if (/<footer[\s>]/.test(s)) s = s.replace(/<footer[^>]*>[\s\S]*?<\/footer>/, () => F);
  else s = s.replace(/(\s*<div id="ck")/, (m) => `\n${F}${m}`);
  if (s !== before) { writeFileSync(f, s); console.log('synced', f); }
}
