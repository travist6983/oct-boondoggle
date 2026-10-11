import { clamp, lerp } from './geom.js';

// The one hero object. Every visual state is a pure function of the params passed to
// render(), so scrolling backwards replays the journey exactly in reverse.
const A = -13.33; // fold line, top third
const B = 13.33; // fold line, bottom third

export class Envelope {
  constructor(node) {
    this.node = node;
    const q = (s) => node.querySelector(s);
    const qa = (s) => [...node.querySelectorAll(s)];
    this.p = {
      addrRough: qa('.env-addr-rough'),
      addrClean: qa('.env-addr-clean'),
      guides: qa('.env-guides'),
      printMasks: qa('.env-print-mask'),
      scan: q('.env-scan'),
      scanGlow: q('.env-scan-glow'),
      letter: q('.env-letter'),
      top: q('.env-panel--t'),
      bot: q('.env-panel--b'),
      topFace: q('.env-panel--t .env-face'),
      topBack: q('.env-panel--t .env-back'),
      botFace: q('.env-panel--b .env-face'),
      botBack: q('.env-panel--b .env-back'),
      shell: q('.env-shell'),
      flapBack: q('.env-flap-back'),
      flapFront: q('.env-flap-front'),
      stamp: q('.env-stamp'),
      cancel: q('.env-cancel'),
      badge: q('.env-badge'),
      phone: q('.env-phone'),
      num: q('.env-num'),
      windowRect: q('.env-window'),
      shadow: q('.env-shadow'),
      tag: q('.env-tag'),
      tagNum: q('.env-tag-num'),
      tagBg: q('.env-tag-bg'),
      tagStrike: q('.env-tag-strike'),
    };
    this.cache = new Map();
    this.rot = 0;
    this.visible = false;
  }

  // Write an attribute/style only when it changes.
  set(node, key, value) {
    if (!node) return;
    let m = this.cache.get(node);
    if (!m) this.cache.set(node, (m = {}));
    if (m[key] === value) return;
    m[key] = value;
    if (key === 'textContent') node.textContent = value;
    else if (key.startsWith('style:')) node.style[key.slice(6)] = value;
    else node.setAttribute(key, value);
  }
  op(nodes, v) {
    const val = String(Math.round(clamp(v) * 1000) / 1000);
    (Array.isArray(nodes) ? nodes : [nodes]).forEach((n) => this.set(n, 'style:opacity', val));
  }

  hide() {
    if (!this.visible) return;
    this.visible = false;
    this.node.style.opacity = '0';
  }

  /**
   * pose: { x, y, scale, tilt }
   * s: { clean, scan, print, fold, insert, seal, stamp, num, aec, badge, phone, shrink }
   */
  render(pose, s = {}) {
    if (!pose) return this.hide();
    const scale = pose.scale ?? 1;
    this.rot = lerp(this.rot, clamp(pose.tilt ?? 0, -9, 9), 0.18);
    const shrink = s.shrink ?? 0;
    const k = scale * (1 - 0.82 * shrink);
    this.node.style.transform = `translate3d(${pose.x.toFixed(1)}px, ${pose.y.toFixed(1)}px, 0) rotate(${this.rot.toFixed(2)}deg) scale(${k.toFixed(3)})`;
    const alpha = shrink > 0.8 ? 1 - (shrink - 0.8) / 0.2 : 1;
    this.node.style.opacity = String(alpha);
    this.visible = true;

    const p = this.p;
    // address block: rough → cleaned (CASS / DPV / NCOA)
    const clean = s.clean ?? 0;
    this.op(p.addrRough, 1 - clean);
    this.op(p.addrClean, clean);

    // scan beam sweeps the sheet
    const scan = s.scan ?? 0;
    const scanning = scan > 0 && scan < 1;
    this.set(p.scan, 'y', (-41 + 82 * scan).toFixed(1));
    this.set(p.scanGlow, 'y', (-49 + 82 * scan).toFixed(1));
    this.op([p.scan], scanning ? 1 : 0);
    this.op([p.scanGlow], scanning ? 0.2 : 0);

    // inkjet print, revealed top → bottom
    const print = s.print ?? 0;
    p.printMasks.forEach((m) => this.set(m, 'height', (84 * print).toFixed(1)));
    this.op(p.guides, 1 - print);

    // tri-fold: top and bottom thirds flip over the middle
    const fold = s.fold ?? 0;
    const st = 1 - 2 * clamp(fold * 1.15);
    const sb = 1 - 2 * clamp(fold * 1.15 - 0.15);
    this.set(p.top, 'transform', `translate(0 ${A}) scale(1 ${st.toFixed(3)}) translate(0 ${-A})`);
    this.set(p.bot, 'transform', `translate(0 ${B}) scale(1 ${sb.toFixed(3)}) translate(0 ${-B})`);
    this.op(p.topFace, st >= 0 ? 1 : 0);
    this.op(p.topBack, st < 0 ? 1 : 0);
    this.op(p.botFace, sb >= 0 ? 1 : 0);
    this.op(p.botBack, sb < 0 ? 1 : 0);

    // insert: the envelope rises over the folded letter; then the flap seals
    const ins = s.insert ?? 0;
    const dy = (1 - ins) * 52;
    const shellOn = ins > 0 ? Math.min(1, ins * 5) : 0;
    this.set(p.shell, 'transform', `translate(0 ${dy.toFixed(1)})`);
    this.op(p.shell, shellOn);
    this.op(p.letter, ins >= 1 && (s.seal ?? 0) > 0.05 ? 0 : 1);
    const seal = s.seal ?? 0;
    const fs = -1 + 2 * seal;
    const flapT = `translate(0 ${(-29 + dy).toFixed(1)}) scale(1 ${fs.toFixed(3)})`;
    this.set(p.flapBack, 'transform', flapT);
    this.set(p.flapFront, 'transform', flapT);
    this.op(p.flapBack, shellOn && fs < 0 ? shellOn : 0);
    this.op(p.flapFront, shellOn && fs >= 0 ? 1 : 0);
    this.set(p.shadow, 'cy', ins > 0.5 ? '36' : '48');

    // postage
    const stamp = s.stamp ?? 0;
    const pop = stamp <= 0 ? 0 : stamp < 0.6 ? lerp(1.6, 0.92, stamp / 0.6) : lerp(0.92, 1, (stamp - 0.6) / 0.4);
    this.set(p.stamp, 'transform', `translate(30 -17) scale(${pop.toFixed(3)})`);
    this.op(p.stamp, stamp > 0 ? 1 : 0);
    this.op(p.cancel, clamp((stamp - 0.5) * 2));

    // data services extras
    this.set(p.num, 'textContent', s.num ?? '12');
    this.set(p.windowRect, 'stroke', s.aec ? '#00FF84' : '#DDDDDD');
    this.set(p.windowRect, 'stroke-width', s.aec ? '1.6' : '1');
    this.op(p.badge, s.badge ?? 0);
    this.op(p.phone, s.phone ?? 0);

    // address tag: the wrong house number, scrambled, then corrected
    this.op(p.tag, s.tag ?? 0);
    this.set(p.tagNum, 'textContent', s.num ?? '12');
    this.op(p.tagStrike, s.strike ?? 0);
    this.set(p.tagBg, 'stroke', s.corrected ? '#00FF84' : '#DDDDDD');
  }
}
