// Scroll the whole journey with real wheel input and measure frame pacing + long tasks.
// Saves a DevTools-loadable trace (open in Chrome DevTools > Performance > Load profile).
// usage: node scripts/perf-scroll.mjs <url> <traceOut> [width] [height] [cpuThrottle]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const [, , url = 'http://localhost:4173/', traceOut = '../qa/perf/scroll-trace.json', W = '1440', H = '900', CPU = '1'] = process.argv;
mkdirSync(dirname(traceOut), { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-gpu-rasterization', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: +W, height: +H } });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
if (+CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: +CPU });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.documentElement.classList.contains('is-live'));
await page.waitForTimeout(1000);

await page.evaluate(() => {
  window.__frames = [];
  window.__long = [];
  new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push(e.duration))).observe({ type: 'longtask', buffered: false });
  const loop = (t) => { window.__frames.push(t); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
});

await browser.startTracing(page, { path: traceOut, screenshots: false });
const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
await page.mouse.move(W / 2, H / 2);
let y = 0;
while (y < total) {
  await page.mouse.wheel(0, 60);
  await page.waitForTimeout(16);
  y = await page.evaluate(() => scrollY);
  if (y >= total - 2) break;
}
await page.waitForTimeout(1200);
await browser.stopTracing();

const stats = await page.evaluate(() => {
  const f = window.__frames;
  const d = [];
  for (let i = 1; i < f.length; i++) d.push(f[i] - f[i - 1]);
  d.sort((a, b) => a - b);
  const pct = (p) => d[Math.min(d.length - 1, Math.floor(d.length * p))];
  const avg = d.reduce((a, b) => a + b, 0) / d.length;
  return {
    frames: d.length,
    avgFps: +(1000 / avg).toFixed(1),
    p50ms: +pct(0.5).toFixed(2),
    p95ms: +pct(0.95).toFixed(2),
    p99ms: +pct(0.99).toFixed(2),
    over20ms: d.filter((x) => x > 20).length,
    over33ms: d.filter((x) => x > 33.4).length,
    longTasks: window.__long.length,
    longestTaskMs: window.__long.length ? Math.round(Math.max(...window.__long)) : 0,
  };
});
console.log(JSON.stringify({ viewport: `${W}x${H}`, cpuThrottle: +CPU, ...stats }));
await browser.close();
