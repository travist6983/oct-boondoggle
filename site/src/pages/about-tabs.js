// About Us · Leadership: real ARIA tabs (automatic activation, roving tabindex, arrows/Home/End).
// Without JS every bio is listed. With motion, the current letter slides down into the Renkim
// envelope and the next one slides out of it; with reduced motion the swap is instant.
const root = document.documentElement;

function initLeadership() {
  const section = document.querySelector('.lead');
  const list = section?.querySelector('.lead__tabs');
  if (!list) return;
  const tabs = [...list.querySelectorAll('.lead__tab')];
  const panels = tabs.map((t) => document.getElementById(t.dataset.panel));
  const letters = section.querySelector('.lead__letters');
  const vertical = window.matchMedia('(min-width: 768px)');
  const reduce = () => root.classList.contains('motion-reduce') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  list.setAttribute('role', 'tablist');
  const orient = () => list.setAttribute('aria-orientation', vertical.matches ? 'vertical' : 'horizontal');
  orient();
  vertical.addEventListener?.('change', orient);
  tabs.forEach((tab, i) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panels[i].id);
    panels[i].setAttribute('role', 'tabpanel');
    panels[i].setAttribute('aria-labelledby', tab.id);
    panels[i].setAttribute('tabindex', '0');
  });

  let current = 0;
  let token = 0;
  const select = (i, { focus = false, animate = true } = {}) => {
    tabs.forEach((t, k) => {
      t.setAttribute('aria-selected', String(k === i));
      t.tabIndex = k === i ? 0 : -1;
    });
    if (focus) tabs[i].focus({ preventScroll: true });
    // Keep the selected name in view inside the horizontal strip (mobile) without moving the page.
    if (list.scrollWidth > list.clientWidth + 1) {
      const tr = tabs[i].getBoundingClientRect(), lr = list.getBoundingClientRect();
      const left = list.scrollLeft + (tr.left - lr.left) - (list.clientWidth - tr.width) / 2;
      list.scrollTo({ left, behavior: reduce() ? 'auto' : 'smooth' });
    }
    if (i === current && animate) return;
    const from = panels[current], to = panels[i];
    current = i;
    const my = ++token;
    if (!animate || reduce() || !from || from === to || !to.animate) {
      panels.forEach((p) => (p.hidden = p !== to));
      if (animate) relayout();
      return;
    }
    // Letter goes into the envelope, the next one comes out. Long bios travel a fixed
    // distance and fade, so the move reads the same at any letter height.
    letters.getAnimations({ subtree: true }).forEach((a) => a.cancel());
    const h0 = letters.offsetHeight;
    const d0 = Math.min(h0 + 8, 320);
    const out = from.hidden ? null : from.animate(
      [{ transform: 'translateY(0)', opacity: 1 }, { transform: `translateY(${d0}px)`, opacity: h0 + 8 > d0 ? 0 : 1 }],
      { duration: 260, easing: 'cubic-bezier(0.55, 0, 0.8, 0.2)', fill: 'forwards' },
    );
    const swap = () => {
      if (my !== token) return;
      out?.cancel();
      panels.forEach((p) => (p.hidden = p !== to));
      const h1 = letters.offsetHeight;
      const d1 = Math.min(h1 + 8, 320);
      const grow = letters.animate([{ height: `${h0}px` }, { height: `${h1}px` }], { duration: 320, easing: 'cubic-bezier(0.3, 0.7, 0.2, 1)' });
      to.animate(
        [{ transform: `translateY(${d1}px)`, opacity: h1 + 8 > d1 ? 0 : 1 }, { transform: 'translateY(0)', opacity: 1 }],
        { duration: 560, easing: 'cubic-bezier(0.2, 0.85, 0.25, 1)' },
      );
      // the section height changed: re-measure the route
      grow.finished.then(relayout, () => {});
    };
    if (out) out.finished.then(swap, swap);
    else swap();
  };
  const relayout = () => requestAnimationFrame(() => window.__renkimMotion?.rebuild?.());

  tabs.forEach((tab, i) => tab.addEventListener('click', () => select(i)));
  list.addEventListener('keydown', (e) => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    const n = tabs.length;
    let next = null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (i + 1) % n;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (i - 1 + n) % n;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    if (next === null) return;
    e.preventDefault();
    select(next, { focus: true });
  });

  list.hidden = false;
  section.classList.add('is-tabbed');
  select(0, { animate: false });
}

initLeadership();
