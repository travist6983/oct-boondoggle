// Record the scroll journey as an MP4 via CDP screencast frames (smooth, scripted pacing).
// usage: node scripts/record.mjs <url> <out.mp4> [width] [height]
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';

const [, , url = 'http://localhost:4173/', out = '../qa/recording/renkim-journey-1440.mp4', W = '1440', H = '900'] = process.argv;
const width = +W, height = +H, mobile = width < 768;
const tmp = join(dirname(out), `.frames-${width}`);
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.documentElement.classList.contains('is-live'));

// Pacing: seconds per chapter, slower through the pinned stages.
const plan = await page.evaluate((isMobile) => {
  const top = (s) => document.querySelector(s).getBoundingClientRect().top + scrollY;
  const end = (s) => { const e = document.querySelector(s); return top(s) + e.offsetHeight - innerHeight; };
  const F = innerHeight / 2;
  const s = isMobile ? 0.62 : 1;
  return [
    [top('.industries') - F + 40, 4.5 * s],
    [top('.production') - 10, 4.5 * s],
    [end('.production') + innerHeight * 0.5, 17 * s],
    [top('.employee') - F + 10, 7 * s],
    [top('.data') - 10, 4.5 * s],
    [end('.data'), 12 * s],
    [document.documentElement.scrollHeight - innerHeight, 5 * s],
  ];
}, mobile);

const cdp = await ctx.newCDPSession(page);
const frames = [];
cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
  const file = join(tmp, `${String(frames.length).padStart(5, '0')}.jpg`);
  writeFileSync(file, Buffer.from(data, 'base64'));
  frames.push({ file, t: metadata.timestamp });
  await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});
await page.evaluate(() => window.scrollTo(0, 0));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForFunction(() => document.documentElement.classList.contains('is-live'));
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: width * (mobile ? 2 : 1), maxHeight: height * (mobile ? 2 : 1), everyNthFrame: 1 });
await page.waitForTimeout(2200); // let the hero record materialize

for (const [y, secs] of plan) {
  await page.evaluate(
    ([target, dur]) => new Promise((resolve) => {
      const l = window.__renkimMotion?.lenis;
      if (l) { l.scrollTo(target, { duration: dur, easing: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2) * 0.15 + t * 0.85, onComplete: resolve, force: true }); return; }
      const from = window.scrollY, t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / (dur * 1000));
        window.scrollTo(0, from + (target - from) * p);
        if (p < 1) requestAnimationFrame(step); else resolve();
      };
      requestAnimationFrame(step);
    }),
    [Math.round(y), secs],
  );
  await page.waitForTimeout(250);
}
await page.waitForTimeout(1200);
await cdp.send('Page.stopScreencast');
await browser.close();

// Variable-frame-rate frames → constant 30fps H.264
let list = 'ffconcat version 1.0\n';
for (let i = 0; i < frames.length; i++) {
  const dur = i < frames.length - 1 ? Math.max(0.001, frames[i + 1].t - frames[i].t) : 0.5;
  list += `file '${frames[i].file.split('/').pop()}'\nduration ${dur.toFixed(4)}\n`;
}
list += `file '${frames[frames.length - 1].file.split('/').pop()}'\n`;
writeFileSync(join(tmp, 'list.txt'), list);
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', join(tmp, 'list.txt'),
  '-vf', `fps=30,scale=${width}:-2:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-movflags', '+faststart', out]);
rmSync(tmp, { recursive: true, force: true });
console.log(JSON.stringify({ out, frames: frames.length, seconds: +(frames.at(-1).t - frames[0].t).toFixed(1) }));
