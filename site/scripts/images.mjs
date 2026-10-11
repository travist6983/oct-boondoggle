// Build responsive AVIF/WebP/JPEG derivatives for the inner pages from the originals in /assets/pages.
// Skips outputs that already exist. usage: node scripts/images.mjs [--force]
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = resolve(import.meta.dirname, '../../assets/pages');
const OUT = resolve(import.meta.dirname, '../public/img/pages');
const force = process.argv.includes('--force');
mkdirSync(OUT, { recursive: true });

// name → [source file, widths]
export const IMAGES = {
  'svc-print': ['pexels-liza-summer-6348101.jpg', [560, 1120]],
  'svc-digital': ['pexels-serpstat-177219-572056-1.jpg', [640, 1280]],
  'svc-ancillary': ['ancillary-services.png', [560, 1120]],
  'band-services': ['pexels-tiger-lily-4484151.jpg', [800, 1400]],
  'band-about': ['pexels-tima-miroshnichenko-6169046-1.jpg', [800, 1400]],
  'band-industries': ['pexels-cottonbro-7019313_flipped.png', [800, 1400]],
  'ind-automotive': ['happy-woman-car-dealership-1.jpg', [720, 1440]],
  'ind-class-action': ['pexels-pixabay-265087-1-1.jpg', [720, 1440]],
  'ind-financial': ['pexels-anna-nekrashevich-6801874.jpg', [720, 1440]],
  'ind-gov': ['pexels-priya-karkare-1998390-3643592.jpg', [720, 1440]],
  'ind-healthcare': ['pexels-cedric-fauntleroy-4266936.jpg', [720, 1440]],
  'ind-mortgage': ['pexels-karolina-grabowska-4491459-1.jpg', [720, 1440]],
  'ind-receivables': ['pexels-pavel-danilyuk-8111853-1.jpg', [720, 1440]],
  'ind-telecom': ['pexels-olly-3760263-1.jpg', [720, 1440]],
  'ind-utility': ['pexels-thecoachspace-2977565.jpg', [720, 1440]],
  'band-data': ['pexels-cottonbro-7018682.jpg', [800, 1400]],
  'band-compliance': ['pexels-hoang-nc-483165236-16057288.jpg', [800, 1400]],
  'pm-print': ['2149713677.jpg', [560, 1000]],
  'pm-certified': ['1097.jpg', [560, 1000]],
  'dg-email-1': ['renkim_email1.png', [480, 960]],
  'dg-email-2': ['renkim_email2.png', [480, 960]],
  'dg-email-3': ['renkim_email3.png', [480, 960]],
  'dg-text-1': ['Renkim_text-message1.png', [480, 947]],
  'dg-text-2': ['Renkim_text-message2.png', [480, 960]],
  'gal-01': ['IMG_4546-1.jpg', [480, 960]],
  'gal-02': ['sign-1.jpg', [480, 640]],
  'gal-03': ['Renkim-at-the-Booth-ACA-National-21-Vegas.jpg', [480, 960]],
  'gal-04': ['gleaners.jpg', [480, 640]],
  'gal-05': ['IMG_6220-1.jpg', [480, 960]],
  'gal-06': ['Green1.jpg', [480, 640]],
  'gal-07': ['volunteer-day-10.30.24.jpg', [480, 640]],
  'gal-08': ['Resized_Resized_20230521_092134.jpg', [480, 960]],
  'gal-09': ['esop-lunch-7.jpg', [480, 640]],
  'gal-10': ['chili-pic-3.jpg', [480, 640]],
};

const ff = (args) => execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args]);
const dims = {};
for (const [name, [file, widths]] of Object.entries(IMAGES)) {
  const src = resolve(SRC, file);
  for (const w of widths) {
    const base = resolve(OUT, `${name}-${w}`);
    const scale = `scale=${w}:-2:flags=lanczos`;
    if (force || !existsSync(`${base}.jpg`)) ff(['-i', src, '-vf', `${scale},format=yuvj420p`, '-q:v', '4', `${base}.jpg`]);
    if (force || !existsSync(`${base}.webp`)) ff(['-i', src, '-vf', scale, '-c:v', 'libwebp', '-quality', '78', `${base}.webp`]);
    if (force || !existsSync(`${base}.avif`)) ff(['-i', src, '-vf', `${scale},format=yuv420p`, '-c:v', 'libaom-av1', '-still-picture', '1', '-crf', '30', '-cpu-used', '6', `${base}.avif`]);
  }
  const probe = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', `${resolve(OUT, `${name}-${widths.at(-1)}`)}.jpg`]).toString().trim();
  dims[name] = probe;
  console.log(name, probe);
}
