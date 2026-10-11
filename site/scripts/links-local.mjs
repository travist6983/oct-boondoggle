// Cross-page link check for the local prototype: every root-relative link on every page must
// resolve to a built page, and every #fragment must exist on that page.
// usage: node scripts/links-local.mjs [baseUrl]
import { chromium } from 'playwright-core';
import { readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const [, , base = 'http://localhost:4173'] = process.argv;
// Every page folder in the site (same walk as vite.config.js).
const here = resolve(import.meta.dirname, '..');
const walk = (dir = '') => {
  const skip = new Set(['node_modules', 'dist', 'public', 'src', 'scripts']);
  const found = existsSync(resolve(here, dir, 'index.html')) ? [`/${dir ? dir + '/' : ''}`] : [];
  for (const e of readdirSync(resolve(here, dir), { withFileTypes: true })) if (e.isDirectory() && !skip.has(e.name) && !e.name.startsWith('.')) found.push(...walk(dir ? `${dir}/${e.name}` : e.name));
  return found;
};
const PAGES = walk();
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();

const ids = {};
const links = [];
for (const p of PAGES) {
  const res = await page.goto(base + p, { waitUntil: 'domcontentloaded' });
  const data = await page.evaluate(() => ({
    ids: [...document.querySelectorAll('[id]')].map((e) => e.id),
    links: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => h.startsWith('/') || h.startsWith('#')),
  }));
  ids[p] = { status: res.status(), ids: new Set(data.ids) };
  data.links.forEach((h) => links.push({ from: p, href: h }));
}
await browser.close();

const problems = [];
for (const { from, href } of links) {
  const [path, frag] = href.startsWith('#') ? [from, href.slice(1)] : href.split('#');
  const target = ids[path];
  if (!target) problems.push({ from, href, problem: 'no such local page' });
  else if (target.status !== 200) problems.push({ from, href, problem: `HTTP ${target.status}` });
  else if (frag && !target.ids.has(frag)) problems.push({ from, href, problem: `missing #${frag}` });
}
console.log(JSON.stringify({ pages: Object.fromEntries(Object.entries(ids).map(([k, v]) => [k, v.status])), localLinks: links.length, distinct: new Set(links.map((l) => l.href)).size, problems }, null, 1));
