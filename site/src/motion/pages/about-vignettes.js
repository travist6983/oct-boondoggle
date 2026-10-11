// About Us · History vignettes, scrubbed by p ∈ [0, 1] (0 = before the envelope arrives at the
// milestone, 1 = finished). The SVG markup is the finished picture; p only rewinds it.
import { range, smooth } from '../geom.js';

const r = (n, k = 100) => Math.round(n * k) / k;
const baseTranslate = (node) => {
  const m = /translate\(([-\d.]+)[ ,]+([-\d.]+)\)/.exec(node.getAttribute('transform') || '');
  return m ? [Number(m[1]), Number(m[2])] : [0, 0];
};

export function makeVignettes(section, w) {
  const q = (s) => section.querySelector(s);
  const qa = (s) => [...section.querySelectorAll(s)];
  const set = [];

  // 1 · Rena + Kim → RenKim, and the car maker's database link
  {
    const v = q('.vig--started');
    const ren = v.querySelector('.v1-ren'), a = v.querySelector('.v1-a'), kim = v.querySelector('.v1-kim');
    const tl = v.querySelector('.v1-tile-l'), tr = v.querySelector('.v1-tile-r'), tm = v.querySelector('.v1-tile-m');
    const plus = v.querySelector('.v1-plus'), year = v.querySelector('.v1-year');
    const link = v.querySelector('.v1-link'), dots = v.querySelector('.v1-link-dots'), lock = v.querySelector('.v1-lock');
    let rw = 56, aw = 18, kw = 56;
    try {
      rw = ren.getComputedTextLength() || rw;
      aw = a.getComputedTextLength() || aw;
      kw = kim.getComputedTextLength() || kw;
    } catch { /* not rendered yet: keep estimates */ }
    const X = 180;
    tl.firstElementChild.setAttribute('x', r(X - rw - 16));
    tl.firstElementChild.setAttribute('width', r(rw + aw + 32));
    tr.firstElementChild.setAttribute('x', X - 16);
    tr.firstElementChild.setAttribute('width', r(kw + 32));
    tm.setAttribute('x', r(X - rw - 22));
    tm.setAttribute('width', r(rw + kw + 44));
    const lockBase = baseTranslate(lock);
    set.push((p) => {
      const meet = smooth(range(p, 0.18, 0.66));
      const dx = 64 * (1 - meet);
      const drop = range(p, 0.04, 0.3);
      w(ren, 'transform', `translate(${r(-dx)} 0)`);
      w(a, 'transform', `translate(${r(-dx)} ${r(drop * 20)})`);
      w(a, 'opacity', String(r(1 - drop)));
      w(kim, 'transform', `translate(${r(dx)} 0)`);
      const tilesOut = range(p, 0.6, 0.78);
      w(tl, 'transform', `translate(${r(-dx)} 0)`);
      w(tr, 'transform', `translate(${r(dx)} 0)`);
      w(tl, 'opacity', String(r(1 - tilesOut)));
      w(tr, 'opacity', String(r(1 - tilesOut)));
      w(plus, 'opacity', String(r(1 - range(p, 0.22, 0.45))));
      w(tm, 'opacity', String(r(range(p, 0.6, 0.8))));
      const y = range(p, 0.72, 0.92);
      w(year, 'opacity', String(r(y)));
      w(year, 'transform', `translate(0 ${r((1 - y) * 8)})`);
      w(link, 'stroke-dashoffset', String(r(1 - range(p, 0.05, 0.5), 1000)));
      w(dots, 'opacity', String(r(range(p, 0.45, 0.55))));
      const lk = smooth(range(p, 0.45, 0.6));
      w(lock, 'transform', `translate(${lockBase[0]} ${lockBase[1]}) scale(${r(0.001 + lk)})`);
    });
  }

  // 2 · One share splits; every piece is held by a current employee
  {
    const v = q('.vig--esop');
    const wedges = [...v.querySelectorAll('.v2-w')].map((n) => ({ n, dx: Number(n.dataset.dx), dy: Number(n.dataset.dy) }));
    const pct = v.querySelector('.v2-pct');
    const people = [...v.querySelectorAll('.v2-p')].map((n) => ({ n, b: baseTranslate(n) }));
    set.push((p) => {
      const ex = smooth(range(p, 0.36, 0.56)) * 6;
      wedges.forEach(({ n, dx, dy }, i) => {
        w(n, 'opacity', String(r(range(p, i * 0.024, i * 0.024 + 0.05))));
        w(n, 'transform', `translate(${r(dx * ex)} ${r(dy * ex)})`);
      });
      w(pct, 'text', `${Math.round(100 * range(p, 0.02, 0.34))}%`);
      people.forEach(({ n, b }, i) => {
        const k = smooth(range(p, 0.5 + i * 0.03, 0.6 + i * 0.03));
        w(n, 'transform', `translate(${b[0]} ${r(b[1] + (1 - k) * 12)}) scale(${r(0.001 + k)})`);
        w(n, 'opacity', String(r(k)));
      });
    });
  }

  // 3 · The route branches into new industries; compliance shields light up
  {
    const v = q('.vig--industries');
    const trunk = v.querySelector('.v3-trunk');
    const branches = [...v.querySelectorAll('.v3-b')];
    const nodes = [...v.querySelectorAll('.v3-n')].map((n) => ({ n, b: baseTranslate(n) }));
    const on = [...v.querySelectorAll('.v3-s-on')];
    set.push((p) => {
      w(trunk, 'stroke-dashoffset', String(r(1 - range(p, 0, 0.2), 1000)));
      branches.forEach((b, i) => w(b, 'stroke-dashoffset', String(r(1 - range(p, 0.16 + i * 0.05, 0.42 + i * 0.05), 1000))));
      nodes.forEach(({ n, b }, i) => {
        const k = smooth(range(p, 0.38 + i * 0.05, 0.5 + i * 0.05));
        w(n, 'transform', `translate(${b[0]} ${b[1]}) scale(${r(0.001 + k)})`);
      });
      on.forEach((s, i) => w(s, 'opacity', String(r(range(p, 0.6 + i * 0.1, 0.7 + i * 0.1)))));
    });
  }

  // 4 · 40+ years: the count climbs, the mail stacks up, the first client is still served
  {
    const v = q('.vig--forty');
    const num = v.querySelector('.v4-num');
    const envs = [...v.querySelectorAll('.v4-e')];
    const chk = v.querySelector('.v4-check');
    const cb = baseTranslate(chk);
    set.push((p) => {
      const years = Math.round(40 * range(p, 0, 0.6));
      w(num, 'text', `${years}${p >= 0.62 ? '+' : ''}`);
      envs.forEach((e, i) => {
        const k = smooth(range(p, 0.08 + i * 0.065, 0.16 + i * 0.065));
        w(e, 'transform', `translate(0 ${r(-(1 - k) * 18)})`);
        w(e, 'opacity', String(r(k)));
      });
      const c = smooth(range(p, 0.76, 0.92));
      w(chk, 'transform', `translate(${cb[0]} ${cb[1]}) scale(${r(0.001 + c)})`);
    });
  }

  return set;
}

