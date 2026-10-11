// What We Do · Ancillary B (Bankruptcy & Deceased, Email Verification, Litigious Scrub, Lockbox,
// Renkim 360). Each page has one lab, pinned (sticky) inside its article while the scene plays:
//   entry  — the envelope leaves the gutter line and flies to the scene's start point;
//   pinned — the scene scrubs from u = 0 → 1 and the envelope performs the service;
//   exit   — the envelope flies back to the gutter line at the focus height.
// Everything is a pure function of scrollY (the lab's on-screen top is computed, not measured).
import { startWwd, gutterScale } from './wwd-common.js';
import { writer } from '../kit.js';
import { clamp, lerp, smooth, range } from '../geom.js';
import { SCENES } from './wwd-anc-b-scenes.js';

const ENV_UNITS = 88; // the envelope is 88 px wide at scale 1 (see src/svg/envelope.svg)

export function init() {
  startWwd(buildLab);
}

function buildLab(ctx, { lab, gx, lead, state, docTop }) {
  const slug = (document.body.dataset.wwd || '').split('/').pop();
  const def = SCENES[slug];
  const pin = lab.closest('.anc-pin');
  const svg = lab.querySelector('svg.anc-art');
  if (!def || !pin || !svg) return null;

  const w = writer();
  const scene = def.make(svg, w);
  const gs = gutterScale(ctx);
  const header = document.getElementById('site-header')?.offsetHeight || 76;

  // Geometry (measured once per build; the runtime rebuilds on resize).
  const labH = lab.offsetHeight, labW = lab.offsetWidth;
  const stickyTop = Math.round(clamp((ctx.vh - labH) / 2 + header / 2, header + 12, Math.max(header + 12, ctx.F - 60)));
  lab.style.top = `${stickyTop}px`;
  const pinTop = docTop(pin), pinH = pin.offsetHeight;
  const labLeft = lab.getBoundingClientRect().left;
  const [, , vbW, vbH] = svg.getAttribute('viewBox').split(/\s+/).map(Number);
  const s = Math.min(labW / vbW, labH / vbH);
  const ox = (labW - vbW * s) / 2, oy = (labH - vbH * s) / 2;

  // The lab's top edge on screen, as a function of scroll (sticky inside .anc-pin).
  const labTopV = (sy) => Math.min(Math.max(pinTop - sy, stickyTop), pinTop + pinH - labH - sy);
  const toV = (sy, x, y) => ({ x: labLeft + ox + x * s, y: labTopV(sy) + oy + y * s });

  // Scroll windows: entry while the lab rises to its sticky spot, the scene while it is pinned,
  // exit while the lead (focus line) runs out the bottom of the pin.
  const syPin0 = pinTop - stickyTop;
  const syPin1 = pinTop + pinH - labH - stickyTop;
  const span = Math.max(1, syPin1 - syPin0);
  const leadOff = (sy) => lead(sy) - sy; // the lead's viewport y (the focus line, once scrolled)

  // QA checkpoints (scripts/qa-page-shots.mjs): park each marker where the focus line sits when the
  // scene reaches its u, so the screenshots land inside the pinned scene.
  pin.querySelectorAll('.anc-qa').forEach((m) => {
    m.style.top = `${Math.round(ctx.F - stickyTop + parseFloat(m.dataset.u) * span)}px`;
  });
  const scaleOf = (ew) => (ew * s) / ENV_UNITS;

  return {
    name: 'wwd-anc-b-lab',
    update(sy) {
      const L = lead(sy);
      const u = clamp((sy - syPin0) / span);
      // Only touch the scene's DOM while the lab is near the screen.
      const near = sy > pinTop - ctx.vh * 1.6 && sy < pinTop + pinH + ctx.vh * 0.6;
      const out = near ? scene.update(u) : null;
      if (L < pinTop || L > pinTop + pinH || !out) return null;

      const gut = { x: gx, y: leadOff(sy) };
      const at = toV(sy, out.x, out.y);
      if (sy < syPin0) {
        // entry: from the gutter line to the scene's start point
        const e0 = pinTop - leadOff(sy);
        const e = smooth(range(sy, e0, syPin0));
        return {
          pose: { x: lerp(gut.x, at.x, e), y: lerp(gut.y, at.y, e), scale: lerp(gs, scaleOf(out.ew), e), tilt: 0 },
          s: { ...state, ...out.s, badge: 0 },
        };
      }
      if (sy > syPin1) {
        // exit: back to the gutter line; any badge the scene earned fades on the way out
        const x1 = pinTop + pinH - leadOff(sy);
        const x = smooth(range(sy, syPin1, x1));
        return {
          pose: { x: lerp(at.x, gut.x, x), y: lerp(at.y, gut.y, x), scale: lerp(scaleOf(out.ew), gs, x), tilt: 0 },
          s: { ...state, ...out.s, seal: 1, badge: (out.s.badge ?? 0) * (1 - x) },
        };
      }
      return { pose: { x: at.x, y: at.y, scale: scaleOf(out.ew), tilt: 0 }, s: { ...state, ...out.s } };
    },
  };
}
