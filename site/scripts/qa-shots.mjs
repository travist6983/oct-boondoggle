// QA: capture every storyboard checkpoint at a given viewport (and optionally reduced motion).
// usage: node scripts/qa-shots.mjs <url> <outDir> <width> <height> [reduce]
// Needs playwright-core and a local Chrome (channel: 'chrome').
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const [, , url = 'http://localhost:4173/', out = 'qa', W = '1440', H = '900', mode = ''] = process.argv;
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
await page.waitForTimeout(800);

const geo = await page.evaluate(() => {
  const q = (s) => document.querySelector(s);
  const top = (el) => el.getBoundingClientRect().top + window.scrollY;
  const pin = (s) => {
    const sec = q(s);
    const fr = sec.querySelector('.stage-frame');
    return { top: top(sec), len: sec.offsetHeight - (fr ? fr.offsetHeight : 0), h: sec.offsetHeight };
  };
  return {
    vh: innerHeight,
    hero: pin('.hero'), industries: pin('.industries'), production: pin('.production'),
    values: pin('.values'), employee: pin('.employee'), data: pin('.data'),
    contact: top(q('.contact')), certs: top(q('.certs')), footer: top(q('.site-footer')),
    doc: document.documentElement.scrollHeight,
  };
});

const F = geo.vh / 2;
const shots = reduce
  ? [
      ['01-hero', 0], ['02-industries', geo.industries.top - 80], ['03-production', geo.production.top - 80],
      ['05-values', geo.values.top - 80], ['05b-values', geo.values.top + geo.vh * 0.8], ['06-employee', geo.employee.top - 80],
      ['07-data', geo.data.top - 80], ['08-contact', geo.contact - 80], ['09-certs', geo.certs - 80], ['10-footer', geo.doc],
    ]
  : [
      ['01a-hero-load', 0],
      ['01b-hero-morph', geo.vh * 0.15],
      ['01c-hero-handoff', geo.vh * 0.36],
      ['02a-industries-enter', geo.industries.top - F + 120],
      ['02b-industries-fan', geo.industries.top - F + geo.industries.h * 0.62],
      ['03a-enter', geo.production.top - F * 0.5],
      ['03b-people', geo.production.top + geo.production.len * 0.12],
      ['03c-processes-scan', geo.production.top + geo.production.len * 0.35],
      ['03d-technology-print', geo.production.top + geo.production.len * 0.57],
      ['03e-fold', geo.production.top + geo.production.len * 0.68],
      ['03f-insert', geo.production.top + geo.production.len * 0.77],
      ['03g-sealed', geo.production.top + geo.production.len * 0.83],
      ['04a-fork', geo.production.top + geo.production.len * 0.88],
      ['04b-fork-landed', geo.production.top + geo.production.len * 0.95],
      ['04c-exit', geo.production.top + geo.production.len + geo.vh * 0.3],
      ['05a-stamp', geo.values.top - F + geo.vh * 0.25],
      ['05b-values', geo.values.top - F + geo.values.h * 0.45],
      ['05c-values-end', geo.values.top - F + geo.values.h * 0.85],
      ['06-employee', geo.employee.top - F + geo.employee.h * 0.55],
      ['07a-data-enter', geo.data.top - F * 0.3],
      ['07b-wrong-route', geo.data.top + geo.data.len * 0.15],
      ['07c-scramble', geo.data.top + geo.data.len * 0.22],
      ['07d-corrected', geo.data.top + geo.data.len * 0.4],
      ['07e-all-checks', geo.data.top + geo.data.len * 0.63],
      ['08a-zoom', geo.data.top + geo.data.len * 0.8],
      ['08b-mailbox', geo.data.top + geo.data.len * 0.9],
      ['08c-delivered', geo.data.top + geo.data.len * 0.99],
      ['09-contact', geo.contact - 60],
      ['10-certs', geo.certs - 60],
      ['11-footer', geo.doc],
    ];

for (const [name, y] of shots) {
  await page.evaluate((top) => {
    const l = window.__renkimMotion?.lenis;
    if (l) l.scrollTo(top, { immediate: true, force: true });
    else window.scrollTo(0, top);
  }, Math.max(0, Math.round(y)));
  await page.waitForTimeout(650);
  await page.screenshot({ path: `${out}/${name}.jpg`, type: 'jpeg', quality: 72 });
}
console.log(JSON.stringify({ shots: shots.length, errors, doc: geo.doc }));
await browser.close();
