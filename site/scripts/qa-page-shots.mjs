// QA for any page: capture the checkpoints the page declares in its markup.
//   data-qa="name"                     → shot with the element's top at 15% of the viewport
//   data-qa="name" data-qa-focus="0.6" → shot with the focus line (50% vh) at 60% of the element's height
//   data-qa="name" data-qa-steps="0.1,0.5,0.9" → on a tall sticky stage, shot at each pinned progress
//   value; on a shorter element, with the focus line at that fraction of its height
// Always adds 00-top (load) and zz-footer.
// usage: node scripts/qa-page-shots.mjs <url> <outDir> <width> <height> [reduce]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const [, , url = 'http://localhost:4173/services/', out = 'qa', W = '1440', H = '900', mode = ''] = process.argv;
const width = Number(W), height = Number(H);
const reduce = mode === 'reduce';
const mobile = width < 768;
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: mobile ? 2 : 1,
  isMobile: mobile,
  hasTouch: mobile,
  reducedMotion: reduce ? 'reduce' : 'no-preference',
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(url, { waitUntil: 'networkidle' });
if (!reduce) await page.waitForFunction(() => document.documentElement.classList.contains('is-live'), null, { timeout: 15000 });
await page.waitForTimeout(1200);

const shots = await page.evaluate(() => {
  const vh = innerHeight, F = vh / 2;
  const top = (el) => el.getBoundingClientRect().top + scrollY;
  const list = [['00-top', 0]];
  let n = 1;
  document.querySelectorAll('[data-qa]').forEach((el) => {
    const name = el.dataset.qa;
    const visible = el.offsetParent !== null || getComputedStyle(el).position === 'fixed';
    if (!visible) return;
    const t = top(el), h = el.offsetHeight;
    const pad = String(n++).padStart(2, '0');
    if (el.dataset.qaSteps) {
      // tall (pinned) stages: progress through the pin; shorter elements: the focus line across them
      const at = h > vh * 1.2 ? (p) => t + p * (h - vh) : (p) => t + p * h - F;
      el.dataset.qaSteps.split(',').map(Number).forEach((p, i) => list.push([`${pad}${String.fromCharCode(97 + i)}-${name}`, at(p)]));
    } else if (el.dataset.qaFocus) {
      list.push([`${pad}-${name}`, t + h * Number(el.dataset.qaFocus) - F]);
    } else {
      list.push([`${pad}-${name}`, t - vh * 0.15]);
    }
  });
  list.push(['zz-footer', document.documentElement.scrollHeight]);
  return list;
});

for (const [name, y] of shots) {
  await page.evaluate((target) => {
    const l = window.__renkimMotion?.lenis;
    if (l) l.scrollTo(target, { immediate: true, force: true });
    else window.scrollTo(0, target);
  }, Math.max(0, Math.round(y)));
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/${name}.jpg`, type: 'jpeg', quality: 72 });
}
const doc = await page.evaluate(() => document.documentElement.scrollHeight);
console.log(JSON.stringify({ shots: shots.length, errors, doc }));
await browser.close();
