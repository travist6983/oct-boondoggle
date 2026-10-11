// Record any page's scroll journey as an MP4 (CDP screencast → constant 30 fps H.264).
// Pacing: steady through normal sections, slower through pinned (sticky) stages and anything
// marked data-qa-steps. usage: node scripts/record-page.mjs <url> <out.mp4> [width] [height] [secondsBudget]
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';

const [, , url, out, W = '1440', H = '900', BUDGET = '45'] = process.argv;
const width = +W, height = +H, mobile = width < 768;
const tmp = join(dirname(out), `.frames-${width}-${Date.now()}`);
mkdirSync(tmp, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.documentElement.classList.contains('is-live'));

// Build segments: [startY, endY, weight]; pinned stages weigh 2.6× per px.
const segs = await page.evaluate(() => {
  const max = document.documentElement.scrollHeight - innerHeight;
  const pins = [...document.querySelectorAll('[data-qa-steps], .stage')]
    .filter((s) => s.offsetHeight > innerHeight * 1.6)
    .map((s) => [s.getBoundingClientRect().top + scrollY, s.getBoundingClientRect().top + scrollY + s.offsetHeight - innerHeight])
    .sort((a, b) => a[0] - b[0]);
  const out = [];
  let y = 0;
  for (const [a, b] of pins) {
    if (a > y) out.push([y, a, 1]);
    out.push([Math.max(a, y), b, 2.6]);
    y = Math.max(y, b);
  }
  if (y < max) out.push([y, max, 1]);
  return out.filter(([a, b]) => b - a > 4);
});
const totalW = segs.reduce((s, [a, b, w]) => s + (b - a) * w, 0);
const plan = segs.map(([a, b, w]) => [b, ((b - a) * w / totalW) * (+BUDGET)]);

const cdp = await ctx.newCDPSession(page);
const frames = [];
cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
  const file = join(tmp, `${String(frames.length).padStart(5, '0')}.jpg`);
  writeFileSync(file, Buffer.from(data, 'base64'));
  frames.push({ file, t: metadata.timestamp });
  await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForFunction(() => document.documentElement.classList.contains('is-live'));
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: width * (mobile ? 2 : 1), maxHeight: height * (mobile ? 2 : 1), everyNthFrame: 1 });
await page.waitForTimeout(2000);
for (const [y, secs] of plan) {
  await page.evaluate(([target, dur]) => new Promise((resolve) => {
    const l = window.__renkimMotion?.lenis;
    if (l) { l.scrollTo(target, { duration: dur, easing: (t) => t, onComplete: resolve, force: true }); return; }
    const from = scrollY, t0 = performance.now();
    const step = (now) => { const p = Math.min(1, (now - t0) / (dur * 1000)); scrollTo(0, from + (target - from) * p); p < 1 ? requestAnimationFrame(step) : resolve(); };
    requestAnimationFrame(step);
  }), [Math.round(y), Math.max(0.4, secs)]);
}
await page.waitForTimeout(1200);
await cdp.send('Page.stopScreencast');
await browser.close();

let list = 'ffconcat version 1.0\n';
for (let i = 0; i < frames.length; i++) {
  const dur = i < frames.length - 1 ? Math.max(0.001, frames[i + 1].t - frames[i].t) : 0.5;
  list += `file '${frames[i].file.split('/').pop()}'\nduration ${dur.toFixed(4)}\n`;
}
list += `file '${frames.at(-1).file.split('/').pop()}'\n`;
writeFileSync(join(tmp, 'list.txt'), list);
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', join(tmp, 'list.txt'),
  '-vf', `fps=30,scale=${width}:-2:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-movflags', '+faststart', out]);
rmSync(tmp, { recursive: true, force: true });
console.log(JSON.stringify({ out, frames: frames.length, seconds: +(frames.at(-1).t - frames[0].t).toFixed(1) }));
