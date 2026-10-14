export function scrollbarMetrics(
  view: number,
  content: number,
  rail: number,
  scroll: number,
) {
  const max = Math.max(0, content - view),
    size = Math.min(rail, Math.max(28, (rail * view) / Math.max(1, content))),
    travel = Math.max(0, rail - size);
  return {
    max,
    size,
    travel,
    offset: max ? (Math.max(0, Math.min(max, scroll)) / max) * travel : 0,
  };
}

export function pageTravel(view: number, stickyHeading = 0) {
  return Math.max(1, view - 96 - Math.max(0, stickyHeading));
}
function hostPageTravel(host: HTMLElement) {
  const heading = host.querySelector<HTMLElement>('.inventory-heading');
  return pageTravel(
    host.clientHeight,
    heading && getComputedStyle(heading).position === 'sticky'
      ? heading.getBoundingClientRect().height
      : 0,
  );
}
/** Discrete, overlapping viewport pages keep tall rows and actions reachable. */
export function createGameScrollbars(root: HTMLElement) {
  const entries = new Map<
    HTMLElement,
    {
      nav: HTMLElement;
      previous: HTMLButtonElement;
      next: HTMLButtonElement;
      label: HTMLElement;
    }
  >();
  let sequence = 0;
  function update() {
    for (const [host, e] of entries)
      if (!host.isConnected) {
        e.nav.remove();
        entries.delete(host);
      }
    root
      .querySelectorAll<HTMLElement>(
        '.panel,.quest.hunt-settings-open,.log-lines,.bag-grid,.item-detail',
      )
      .forEach((host) => {
        if (entries.has(host)) return;
        if (!host.id) host.id = 'game-page-host-' + ++sequence;
        const nav = document.createElement('nav');
        nav.className = 'game-pages';
        nav.dataset['pageFor'] = host.id;
        nav.setAttribute(
          'aria-label',
          (host.getAttribute('aria-label') || '게임 창') + ' 페이지',
        );
        const previous = document.createElement('button'),
          next = document.createElement('button'),
          label = document.createElement('span');
        previous.type = next.type = 'button';
        previous.textContent = '◀';
        next.textContent = '▶';
        previous.setAttribute('aria-label', '이전 페이지');
        next.setAttribute('aria-label', '다음 페이지');
        previous.setAttribute('aria-controls', host.id);
        next.setAttribute('aria-controls', host.id);
        label.setAttribute('aria-live', 'polite');
        const turn = (direction: number) => {
          host.scrollTop = Math.max(
            0,
            Math.min(
              host.scrollHeight - host.clientHeight,
              host.scrollTop + direction * hostPageTravel(host),
            ),
          );
          update();
        };
        previous.onclick = (e) => {
          e.stopPropagation();
          turn(-1);
        };
        next.onclick = (e) => {
          e.stopPropagation();
          turn(1);
        };
        nav.onkeydown = (e) => {
          if (e.key === 'ArrowRight' || e.key === 'PageDown') {
            e.preventDefault();
            e.stopPropagation();
            turn(1);
          } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
            e.preventDefault();
            e.stopPropagation();
            turn(-1);
          }
        };
        nav.append(previous, label, next);
        root.append(nav);
        host.classList.add('game-page-host');
        entries.set(host, { nav, previous, next, label });
      });
    const base = root.getBoundingClientRect();
    for (const [host, e] of entries) {
      const r = host.getBoundingClientRect(),
        max = Math.max(0, host.scrollHeight - host.clientHeight),
        step = hostPageTravel(host);
      let top = Math.max(0, r.top),
        bottom = Math.min(innerHeight, r.bottom),
        left = r.left,
        right = r.right;
      for (
        let parent = host.parentElement;
        parent && parent !== root;
        parent = parent.parentElement
      ) {
        if (
          /auto|scroll|hidden|clip/.test(getComputedStyle(parent).overflowY)
        ) {
          const b = parent.getBoundingClientRect();
          top = Math.max(top, b.top);
          bottom = Math.min(bottom, b.bottom);
          if (parent.matches('.panel')) {
            bottom = Math.min(bottom, b.bottom - 44);
            const heading =
              parent.querySelector<HTMLElement>('.inventory-heading');
            if (heading && getComputedStyle(heading).position === 'sticky')
              top = Math.max(top, heading.getBoundingClientRect().bottom);
          }
        }
      }
      e.nav.hidden =
        (host.matches('.quest') &&
          !host.classList.contains('hunt-settings-open')) ||
        !!host.closest('[hidden]') ||
        max < 2 ||
        r.width < 1 ||
        bottom - top < 70;
      if (e.nav.hidden) continue;
      e.nav.style.clipPath = 'inset(0px 0px 0px 0px)';
      e.nav.style.left = Math.max(0, left - base.left + 8) + 'px';
      e.nav.style.top = bottom - base.top - 36 + 'px';
      e.nav.style.width = Math.max(100, right - left - 16) + 'px';
      e.previous.disabled = host.scrollTop <= 1;
      e.next.disabled = host.scrollTop >= max - 1;
      const pages = Math.ceil(max / step) + 1,
        page =
          host.scrollTop >= max - 1
            ? pages
            : Math.floor(host.scrollTop / step) + 1;
      const text = page + ' / ' + pages;
      if (e.label.textContent !== text) e.label.textContent = text;
    }
  }
  root.addEventListener('scroll', update, true);
  window.addEventListener('resize', update);
  return {
    update,
    dispose() {
      root.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
      for (const [host, e] of entries) {
        host.classList.remove('game-page-host');
        e.nav.remove();
      }
      entries.clear();
    },
  };
}
