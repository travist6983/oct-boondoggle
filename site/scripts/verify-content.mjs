// Verify every link target, phone, email, CTA label and heading from content.json is on the page.
// usage: node scripts/verify-content.mjs <url> <content.json>
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';

const [, , url = 'http://localhost:4173/', contentPath = '../content.json'] = process.argv;
const content = JSON.parse(readFileSync(contentPath, 'utf8'));

// Collect every {label, href} and heading string from content.json
const links = [];
const texts = [];
(function walk(node, path) {
  if (Array.isArray(node)) return node.forEach((n, i) => walk(n, `${path}[${i}]`));
  if (node && typeof node === 'object') {
    if (node.omitted) return; // left out per client decision
    if (path.startsWith('$.popupUnreachable') || path.startsWith('$.$meta') || path.startsWith('$.thirdParty')) return;
    const href = node.href ?? node.suggestedHref;
    if (node.label && 'href' in node) links.push({ path, label: node.label, href: node.href });
    if (node.link?.href) links.push({ path: `${path}.link`, label: node.link.label, href: node.link.href });
    for (const [k, v] of Object.entries(node)) {
      if (['heading', 'subheading', 'body', 'text', 'textAfter', 'formNote', 'copyright', 'value', 'full', 'title'].includes(k) && typeof v === 'string') texts.push({ path: `${path}.${k}`, text: v });
      walk(v, `${path}.${k}`);
    }
  }
})(content, '$');

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
await page.goto(url, { waitUntil: 'networkidle' });
const dom = await page.evaluate(() => ({
  anchors: [...document.querySelectorAll('a')].map((a) => ({ href: a.getAttribute('href'), text: (a.textContent + ' ' + (a.getAttribute('aria-label') || '') + ' ' + (a.closest('li')?.textContent || '')).replace(/\s+/g, ' ').trim() })),
  text: document.body.textContent.replace(/\s+/g, ' '),
}));
await browser.close();

const norm = (s) => s.replace(/\s+/g, ' ').replace(/[’]/g, "'").trim().toLowerCase();
// Pages built in this prototype are linked locally: https://renkim.com/services/ ≡ /services/ (and the home page ≡ /).
// (Portal pages and anything not built stay on renkim.com and must match exactly.)
// Industry links may gain a section anchor (#automotive …) on the local Industries page.
const LOCAL = /^https:\/\/renkim\.com(\/(?:services|about-us|industries-served|print-mail|digital-services|ancillary-services|compliance|on-the-road|in-the-community|careers)\/[^?]*|\/)$/;
const localHref = (h) => (h && LOCAL.test(h) ? h.replace('https://renkim.com', '') : h);
const sameHref = (domHref, want) => {
  const w = localHref(want);
  if (domHref === w || domHref === want) return true;
  return w === '/industries-served/' && /^\/industries-served\/#[\w-]+$/.test(domHref || '');
};
const bodyText = norm(dom.text);
const results = { links: { ok: 0, missing: [] }, plain: { ok: 0, missing: [] }, texts: { ok: 0, missing: [] } };

for (const l of links) {
  if (!l.href) {
    // intentionally plain text (fax, address): must still appear as text
    if (bodyText.includes(norm(l.label))) results.plain.ok++;
    else results.plain.missing.push(l);
    continue;
  }
  const squash = (x) => norm(x).replace(/\s/g, '');
  const hit = dom.anchors.find((a) => sameHref(a.href, l.href) && squash(a.text).includes(squash(l.label)));
  if (hit) results.links.ok++;
  else results.links.missing.push(l);
}
for (const t of texts) {
  if (bodyText.includes(norm(t.text))) results.texts.ok++;
  else results.texts.missing.push(t);
}
// distinct hrefs
const wanted = [...new Set(links.filter((l) => l.href).map((l) => l.href))];
const present = new Set(dom.anchors.map((a) => a.href));
const missingHrefs = wanted.filter((h) => ![...present].some((d) => sameHref(d, h)));
console.log(JSON.stringify({ linksChecked: links.length, distinctHrefs: wanted.length, missingHrefs, ...results }, null, 2));
