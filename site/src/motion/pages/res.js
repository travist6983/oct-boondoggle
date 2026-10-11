// Resources pages (Compliance, On the Road, In the Community, Careers): a slim journey. The
// envelope rests under the hero chips and, as you scroll, glides along one leg into the page's
// first card ([data-dock]: the LinkedIn card, the application form, the certifications), arriving
// as that card reaches the focus line; the card then takes a green check. Pure function of scrollY.
import { startMotion, journeyOf } from '../runtime.js';
import { Leg, prepRouteSvg, routePair, verticalPath, clamp, range, smooth } from '../geom.js';
import { docTop, tiltFrom, SEALED, writer } from '../kit.js';

const STATE = { ...SEALED, stamp: 1, num: '' };

export function init() {
  startMotion((ctx) => {
    const hero = document.querySelector('.res-hero');
    const dock = document.querySelector('[data-dock]');
    if (!hero || !dock) return journeyOf([], 1);
    return journeyOf([dockStage(ctx, hero, dock)], Math.max(1, docTop(dock) + dock.offsetHeight / 2 - ctx.F));
  });
}

function dockStage(ctx, hero, dock) {
  const w = writer();
  const svg = hero.querySelector('.route');
  const W = hero.offsetWidth, H = hero.offsetHeight;
  prepRouteSvg(svg, W, H);
  const top = docTop(hero);
  const restY = H - (ctx.mobile ? 18 : 26);
  const dr = dock.getBoundingClientRect();
  const dockX = dr.left + dr.width / 2, dockY = docTop(dock) + Math.min(dr.height / 2, 120) - top; // hero-local
  // The leg overflows the hero (the hero paints above the next section) and ends in the dock.
  const { plan, ink } = routePair(svg, verticalPath([[W / 2, restY], [dockX, dockY]]));
  const leg = new Leg(plan, hero, { ink }).buildYTable();
  const endSy = Math.max(ctx.vh * 0.3, top + dockY - ctx.F); // the dock reaches the focus line
  const s0 = ctx.mobile ? 0.5 : 0.7;
  return {
    name: 'res-dock',
    update(sy) {
      const u = clamp(sy / endSy);
      w(dock, 'class', `is-docked|${u >= 1 ? 1 : 0}`);
      // the envelope moves from its rest point onto the focus line while the leg runs out
      const y = restY + u * (dockY - restY);
      const t = leg.tAtY(y);
      leg.draw(t);
      if (u >= 1) return null;
      const p = leg.at(t);
      const shrink = smooth(range(u, 0.8, 1));
      return { pose: { x: p.x, y: top - sy + p.y, scale: s0 * (1 - 0.15 * u), tilt: u > 0 ? tiltFrom(p.angle) * 0.5 : 0 }, s: { ...STATE, shrink } };
    },
  };
}
