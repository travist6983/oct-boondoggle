import { defineConfig } from 'vite';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const here = import.meta.dirname;

// Deploying under a sub-path (GitHub Pages project site: BASE_PATH=/oct-boondoggle/). Locally '/'.
const BASE = (process.env.BASE_PATH || '/').replace(/\/?$/, '/');
// DEMO=1 marks a public preview: a slim "concept redesign" ribbon and noindex, so it is never
// mistaken for (or indexed as) the official renkim.com.
const DEMO = process.env.DEMO === '1';

// Shared page chrome (<!--@partial name-->) and generated illustrations (<!--@svg name-->) are
// inlined into every page's HTML, so they render without JS and under reduced motion.
function inlineHtml() {
  return {
    name: 'inline-html',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        let out = html
          .replace(/<!--@partial ([\w-]+)-->/g, (_, name) => readFileSync(resolve(here, 'src/partials', `${name}.html`), 'utf8').trim())
          .replace(/<!--@svg ([\w-]+)-->/g, (_, name) => readFileSync(resolve(here, 'src/svg', `${name}.svg`), 'utf8').trim());
        if (DEMO) {
          out = out
            .replace('</title>', '</title>\n  <meta name="robots" content="noindex, nofollow" />')
            .replace(/(<body[^>]*>)/, `$1\n  <div class="demo-ribbon" role="note">Concept redesign prototype. This is not the official Renkim website: visit <a href="https://renkim.com/">renkim.com</a>.</div>`);
        }
        return out;
      },
    },
  };
}

// Root-relative URLs in the HTML (links between pages, images, srcset, fonts, icons) get the
// deploy base. Vite already rewrites the module scripts and stylesheets it bundles.
function basePaths() {
  const fix = (url) => (url.startsWith('/') && !url.startsWith('//') && !url.startsWith(BASE) ? BASE + url.slice(1) : url);
  return {
    name: 'base-paths',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        if (BASE === '/') return html;
        return html
          .replace(/(\s(?:href|src|poster)=")(\/[^"]*)"/g, (_, a, url) => `${a}${fix(url)}"`)
          .replace(/(\ssrcset=")([^"]*)"/g, (_, a, set) => `${a}${set.split(',').map((c) => c.trim().replace(/^(\S+)/, (u) => fix(u))).join(', ')}"`);
      },
    },
  };
}

// Page folders (relative paths, '' = home), skipping tooling and build folders.
function pages(dir = '') {
  const skip = new Set(['node_modules', 'dist', 'public', 'src', 'scripts']);
  const found = existsSync(resolve(here, dir, 'index.html')) ? [dir] : [];
  for (const e of readdirSync(resolve(here, dir), { withFileTypes: true })) {
    if (e.isDirectory() && !skip.has(e.name) && !e.name.startsWith('.')) found.push(...pages(dir ? `${dir}/${e.name}` : e.name));
  }
  return found;
}

export default defineConfig({
  base: BASE,
  plugins: [inlineHtml(), basePaths()],
  build: {
    target: 'es2020',
    cssCodeSplit: true, // each page ships only its own CSS (render-blocking budget)
    modulePreload: { polyfill: false },
    rollupOptions: {
      // Every page is a folder with an index.html (/, /services/, /print-mail/certified-mail/, …).
      input: Object.fromEntries(pages().map((rel) => [rel ? rel.replace(/\//g, '__') : 'home', resolve(here, rel, 'index.html')])),
    },
  },
});
