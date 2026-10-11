// Shared helpers for scroll-driven stages on every page.
import { clamp } from './geom.js';

export const docTop = (node) => node.getBoundingClientRect().top + window.scrollY;
export const tiltFrom = (angle) => clamp((90 - angle) * 0.18, -9, 9);
export const SEALED = { clean: 1, print: 1, fold: 1, insert: 1, seal: 1 };

// Small write-cache so per-frame updates only touch the DOM when something changes.
export function writer() {
  const cache = new WeakMap();
  return (node, key, value) => {
    if (!node) return;
    let m = cache.get(node);
    if (!m) cache.set(node, (m = {}));
    if (m[key] === value) return;
    m[key] = value;
    if (key === 'class') {
      const [name, on] = value.split('|');
      node.classList.toggle(name, on === '1');
    } else if (key.startsWith('style:')) node.style[key.slice(6)] = value;
    else if (key === 'text') node.textContent = value;
    else node.setAttribute(key, value);
  };
}

// Sticky-stage phases: enter (frame scrolling in), pinned (frame stuck), exit (frame scrolling out).
export function stickyPhase(secTop, SH, FH, F) {
  const secBot = secTop + SH;
  if (secTop > F) return { phase: 'before', pp: 0 };
  if (secTop > 0) return { phase: 'enter', e: (F - secTop) / F, pp: 0, frameTop: secTop };
  if (secBot >= FH) return { phase: 'pinned', pp: clamp(-secTop / (SH - FH)), frameTop: 0 };
  if (secBot > F) return { phase: 'exit', x: (FH - secBot) / (FH - F), pp: 1, frameTop: secBot - FH };
  return { phase: 'after', pp: 1 };
}
