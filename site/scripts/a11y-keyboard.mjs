// Keyboard + focus QA: tab order, visible focus ring, mega menu, form errors, heading outline.
// usage: node scripts/a11y-keyboard.mjs <url> [width]
import { chromium } from 'playwright-core';

const [, , url = 'http://localhost:4173/', W = '1440'] = process.argv;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: +W, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

const focusInfo = () => page.evaluate(() => {
  const a = document.activeElement;
  const cs = getComputedStyle(a);
  return { tag: a.tagName, text: (a.textContent || a.getAttribute('aria-label') || '').trim().slice(0, 40), ring: cs.boxShadow !== 'none' || cs.outlineStyle !== 'none' };
});

const order = [];
for (let i = 0; i < 16; i++) {
  await page.keyboard.press('Tab');
  order.push(await focusInfo());
}

// Mega menu: focus the "What We Do" submenu toggle, open with Enter, first link reachable, Escape closes + restores focus
await page.focus('.nav__item--mega .nav__sub');
await page.keyboard.press('Enter');
const opened = await page.evaluate(() => document.querySelector('.nav__item--mega .nav__sub').getAttribute('aria-expanded'));
const megaVisible = await page.isVisible('#mm-what a');
await page.keyboard.press('Tab');
const intoMenu = await focusInfo();
await page.keyboard.press('Escape');
const closed = await page.evaluate(() => ({ expanded: document.querySelector('.nav__item--mega .nav__sub').getAttribute('aria-expanded'), focus: document.activeElement.className }));

// Form: submit empty → errors + focus first invalid
await page.evaluate(() => document.getElementById('demo').scrollIntoView());
await page.click('#demo-form button[type=submit]');
const form = await page.evaluate(() => ({
  focus: document.activeElement.id,
  invalid: [...document.querySelectorAll('#demo-form [aria-invalid=true]')].map((e) => e.id),
  visibleErrors: [...document.querySelectorAll('.field__error')].filter((e) => !e.hidden).length,
  status: document.querySelector('.form-status').textContent,
  labels: [...document.querySelectorAll('#demo-form input, #demo-form textarea')].every((i) => document.querySelector(`label[for="${i.id}"]`)),
}));

const outline = await page.evaluate(() => [...document.querySelectorAll('main h1, main h2, main h3')].map((h) => `${h.tagName} ${h.textContent.replace(/\s+/g, ' ').trim().slice(0, 60)}`));
console.log(JSON.stringify({ tabOrder: order, megaMenu: { opened, megaVisible, intoMenu, closed }, form, outline }, null, 1));
await browser.close();
