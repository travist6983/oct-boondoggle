// Motion runtime shared by every page: Lenis smooth scroll (fine pointers only), the fixed envelope
// layer, the route-progress bar, and geometry rebuilds on resize / font load.
//
// A page passes `buildJourney(ctx, helpers)`, which returns:
//   { tick(scrollY) -> { pose, s } | null, endY, destroy() }
// `pose` places the envelope (null hides it), `s` is the envelope state (see envelope.js).
// Every visual state must be a pure function of scrollY, so scrolling back replays in reverse.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import Lenis from 'lenis';
import { Envelope } from './envelope.js';
import { clamp } from './geom.js';

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

export const FOCUS = 0.5; // the envelope is "held" at this fraction of the viewport height

// Layout context shared by all stages (matches the CSS breakpoints and container).
export function layoutContext() {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const mobile = vw < 768;
  const gutter = vw >= 768 ? 32 : 16;
  const container = Math.min(vw - gutter * 2, 1140);
  return {
    mobile, vw, vh, F: vh * FOCUS, gutter, container: 1140,
    containerLeft: (vw - container) / 2,
    containerRight: (vw + container) / 2,
    scale: mobile ? 0.44 : vw < 1200 ? 0.85 : 1,
    lift: mobile ? 18 : 36,
    rail: 24, // mobile route rail x (keeps the envelope fully on screen)
  };
}

export function startMotion(buildJourney) {
  const root = document.documentElement;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  let lenis = null;
  if (!coarse) {
    lenis = new Lenis({ autoRaf: false, lerp: 0.1, anchors: { offset: -96 } });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  ScrollTrigger.config({ ignoreMobileResize: true });

  root.classList.add('is-live');
  const envNode = document.getElementById('envelope');
  const env = envNode ? new Envelope(envNode) : null;
  const bar = document.querySelector('.progress__bar');
  const scrollToY = (y) => (lenis ? lenis.scrollTo(y, { duration: 1.2 }) : window.scrollTo({ top: y, behavior: 'smooth' }));

  let journey = null;
  const build = () => {
    journey?.destroy?.();
    journey = buildJourney(layoutContext(), { scrollToY, lenis });
    ScrollTrigger.refresh();
  };
  build();

  gsap.ticker.add(() => {
    const sy = window.scrollY;
    const out = journey.tick(sy);
    env?.render(out?.pose ?? null, out?.s);
    if (bar) bar.style.transform = `scaleX(${clamp(sy / Math.max(1, journey.endY)).toFixed(4)})`;
  });

  // Rebuild geometry when layout changes (ignore mobile toolbar height jitter).
  let w = window.innerWidth, h = window.innerHeight, timer;
  window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const dw = Math.abs(window.innerWidth - w), dh = Math.abs(window.innerHeight - h);
      if (dw > 0 || (!coarse && dh > 0) || dh > 160) {
        w = window.innerWidth;
        h = window.innerHeight;
        build();
      }
    }, 180);
  });
  document.fonts?.ready.then(() => build());
  window.__renkimMotion = { rebuild: build, lenis };
  return { rebuild: build, lenis, scrollToY };
}

// Combine stages: the first stage that returns a pose owns the envelope this frame.
export function journeyOf(stages, endY) {
  return {
    endY,
    tick(sy) {
      let out = null;
      for (const st of stages) {
        const r = st.update(sy);
        if (r && !out) out = r;
      }
      return out;
    },
    destroy() {
      stages.forEach((s) => s.destroy?.());
    },
  };
}
