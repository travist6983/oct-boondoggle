// Generic page accessibility pass: full keyboard tab walk (visible focus ring, focused element on
// screen and not hidden under the sticky header), heading outline, image alts, in-page anchor
// targets, duplicate ids, and accessible names for links and buttons.
// usage: node scripts/a11y-page.mjs <url> [width] [height]
import { chromium } from 'playwright-core';

const [, , url = 'http://localhost:4173/', W = '1440', H = '900'] = process.argv;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: +W, height: +H } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

const stops = [];
for (let i = 0; i < 260; i++) {
  await page.keyboard.press('Tab');
  await page.waitForTimeout(i < 40 ? 60 : 25);
  const s = await page.evaluate(() => {
    const a = document.activeElement;
    if (!a || a === document.body) return null;
    const cs = getComputedStyle(a);
    const r = a.getBoundingClientRect();
    const header = document.getElementById('site-header');
    const hb = header ? header.getBoundingClientRect().bottom : 0;
    const inHeader = header?.contains(a);
    return {
      tag: a.tagName, id: a.id || undefined,
      text: (a.getAttribute('aria-label') || a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 48),
      ring: cs.boxShadow !== 'none' || (cs.outlineStyle !== 'none' && cs.outlineWidth !== '0px'),
      onScreen: r.bottom > 0 && r.top < innerHeight && r.width > 0 && r.height > 0,
      underHeader: !inHeader && !a.classList.contains('skip-link') && r.bottom <= hb + 2,
      visible: cs.visibility !== 'hidden' && +cs.opacity > 0.05,
    };
  });
  if (!s) break;
  const last = stops.at(-1);
  if (last && last.tag === s.tag && last.text === s.text && last.id === s.id && i > 5 && stops.filter((x) => x.text === s.text).length > 3) break;
  stops.push(s);
}

const checks = await page.evaluate(() => {
  const hs = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].filter((h) => !h.closest('[hidden]'));
  const outline = hs.map((h) => ({ level: +h.tagName[1], text: h.textContent.replace(/\s+/g, ' ').trim().slice(0, 70) }));
  const skips = [];
  for (let i = 1; i < outline.length; i++) if (outline[i].level > outline[i - 1].level + 1) skips.push(`${outline[i - 1].text} → ${outline[i].text}`);
  const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
  const dupIds = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  const anchors = [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href')).filter((h) => h.length > 1);
  const brokenAnchors = [...new Set(anchors.filter((h) => !document.getElementById(h.slice(1))))];
  const imgsNoAlt = [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).map((i) => i.src);
  const name = (e) => (e.getAttribute('aria-label') || e.textContent || e.querySelector('img')?.alt || '').trim();
  const unnamed = [...document.querySelectorAll('a[href], button')].filter((e) => !name(e) && !e.closest('[aria-hidden="true"]')).map((e) => e.outerHTML.slice(0, 80));
  return {
    h1Count: outline.filter((h) => h.level === 1).length, outline, skips, dupIds, brokenAnchors, imgsNoAlt, unnamed,
    landmarks: ['header', 'nav', 'main', 'footer'].filter((t) => document.querySelector(t)),
  };
});

const summary = {
  url,
  tabStops: stops.length,
  noRing: stops.filter((s) => !s.ring).map((s) => s.text || s.tag),
  offScreen: stops.filter((s) => !s.onScreen).map((s) => s.text || s.tag),
  underHeader: stops.filter((s) => s.underHeader).map((s) => s.text || s.tag),
  invisible: stops.filter((s) => !s.visible).map((s) => s.text || s.tag),
  ...checks,
};
console.log(JSON.stringify(summary, null, 1));
await browser.close();
