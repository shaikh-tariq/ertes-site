// Copies the static site into ./dist so it can be uploaded to any host
// (Netlify, Vercel, Cloudflare Pages, S3, cPanel, ...).
import { cpSync, rmSync, mkdirSync, readdirSync } from 'node:fs';

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
for (const f of readdirSync('.').filter((n) => n.endsWith('.html'))) cpSync(f, `dist/${f}`);
for (const d of ['css', 'js', 'assets']) cpSync(d, `dist/${d}`, { recursive: true });
console.log('Built static site into ./dist');
