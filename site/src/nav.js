// Mega menu + dropdowns (desktop) and drawer + accordions (mobile).
// Keyboard: Enter/Space toggles, Escape closes and returns focus, focus leaving a menu closes it.
export function initNav() {
  const nav = document.getElementById('primary-nav');
  const toggle = document.querySelector('.nav-toggle');
  if (!nav || !toggle) return;
  const desktop = window.matchMedia('(min-width: 1024px)');
  const hoverable = window.matchMedia('(hover: hover) and (pointer: fine)');
  const items = [...nav.querySelectorAll('.nav__item')].filter((li) => li.querySelector('.mega, .dropdown'));

  const buttonFor = (li) => li.querySelector('.nav__trigger, .nav__sub');
  const setOpen = (li, open) => {
    li.classList.toggle('is-open', open);
    buttonFor(li).setAttribute('aria-expanded', String(open));
  };
  const closeAll = (except) => items.forEach((li) => li !== except && setOpen(li, false));

  items.forEach((li) => {
    const btn = buttonFor(li);
    btn.addEventListener('click', () => {
      const open = !li.classList.contains('is-open');
      closeAll(li); // one menu (desktop) / one accordion section (drawer) open at a time
      setOpen(li, open);
      if (open && !desktop.matches) li.scrollIntoView({ block: 'nearest' });
    });
    let t;
    li.addEventListener('mouseenter', () => {
      if (!desktop.matches || !hoverable.matches) return;
      clearTimeout(t);
      closeAll(li);
      setOpen(li, true);
    });
    li.addEventListener('mouseleave', () => {
      if (!desktop.matches || !hoverable.matches) return;
      t = setTimeout(() => setOpen(li, false), 160);
    });
    li.addEventListener('focusout', (e) => {
      if (desktop.matches && !li.contains(e.relatedTarget)) setOpen(li, false);
    });
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && li.classList.contains('is-open')) {
        setOpen(li, false);
        btn.focus();
      }
    });
  });

  document.addEventListener('click', (e) => {
    if (desktop.matches && !nav.contains(e.target)) closeAll();
  });

  // Mobile drawer: a modal panel. The page behind it is inert, focus stays inside (toggle + drawer),
  // Escape or the toggle closes it and focus returns to the toggle.
  const behind = [...document.querySelectorAll('main, .site-footer, .schedule-tab, .skip-link')];
  const header = document.getElementById('site-header');
  const placeDrawer = () => nav.style.setProperty('--nav-top', `${Math.round(header.getBoundingClientRect().bottom)}px`);
  window.addEventListener('resize', () => nav.classList.contains('is-open') && placeDrawer());
  const setDrawer = (open) => {
    if (open) placeDrawer();
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.sr-only').textContent = open ? 'Close menu' : 'Menu';
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
    behind.forEach((el) => { el.inert = open; });
    if (!open) closeAll();
  };
  toggle.addEventListener('click', () => setDrawer(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => {
    if (toggle.getAttribute('aria-expanded') !== 'true') return;
    if (e.key === 'Escape') {
      setDrawer(false);
      toggle.focus();
    } else if (e.key === 'Tab') {
      const stops = [toggle, ...nav.querySelectorAll('a[href], button')].filter((el) => el.offsetParent !== null);
      const i = stops.indexOf(document.activeElement);
      const next = e.shiftKey ? (i <= 0 ? stops.length - 1 : i - 1) : (i === stops.length - 1 || i === -1 ? 0 : i + 1);
      e.preventDefault();
      stops[next].focus();
    }
  });
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a') && !desktop.matches) setDrawer(false);
  });
  desktop.addEventListener?.('change', () => {
    setDrawer(false);
    closeAll();
  });
}
