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
/** Real game rails remain visible on mobile browsers that hide native bars. */
export function createGameScrollbars(root: HTMLElement) {
  const entries = new Map<
    HTMLElement,
    { rail: HTMLDivElement; thumb: HTMLDivElement }
  >();
  let sequence = 0;
  const selectors =
    '.panel,.quest.hunt-settings-open,.log-lines,.bag-grid,.item-detail';
  function add(host: HTMLElement) {
    const rail = document.createElement('div'),
      thumb = document.createElement('div');
    rail.className = 'game-scrollbar';
    thumb.className = 'game-scrollbar-thumb';
    rail.append(thumb);
    rail.hidden = true;
    if (!host.id) host.id = 'game-scroll-host-' + ++sequence;
    rail.dataset['scrollFor'] = host.id;
    rail.tabIndex = 0;
    rail.setAttribute('role', 'scrollbar');
    rail.setAttribute(
      'aria-label',
      (host.getAttribute('aria-label') ?? '게임 창') + ' 스크롤',
    );
    rail.setAttribute('aria-controls', host.id);
    rail.setAttribute('aria-orientation', 'vertical');
    rail.setAttribute('aria-valuemin', '0');
    rail.setAttribute('aria-valuemax', '100');
    let drag: { id: number; grab: number } | null = null;
    const move = (y: number, grab: number) => {
      const r = rail.getBoundingClientRect(),
        m = scrollbarMetrics(
          host.clientHeight,
          host.scrollHeight,
          r.height,
          host.scrollTop,
        );
      host.scrollTop = m.travel
        ? (Math.max(0, Math.min(m.travel, y - r.top - grab)) / m.travel) * m.max
        : 0;
      update();
    };
    rail.onpointerdown = (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      const r = thumb.getBoundingClientRect();
      drag = {
        id: e.pointerId,
        grab: e.target === thumb ? e.clientY - r.top : r.height / 2,
      };
      rail.setPointerCapture(e.pointerId);
      rail.classList.add('dragging');
      move(e.clientY, drag.grab);
    };
    rail.onpointermove = (e) => {
      if (drag?.id === e.pointerId) {
        e.preventDefault();
        e.stopPropagation();
        move(e.clientY, drag.grab);
      }
    };
    const release = (e: PointerEvent) => {
      if (drag?.id !== e.pointerId) return;
      drag = null;
      rail.classList.remove('dragging');
      if (rail.hasPointerCapture(e.pointerId))
        rail.releasePointerCapture(e.pointerId);
      e.stopPropagation();
    };
    rail.onpointerup = release;
    rail.onpointercancel = release;
    rail.onlostpointercapture = () => {
      drag = null;
      rail.classList.remove('dragging');
    };
    rail.onclick = (e) => e.stopPropagation();
    rail.oncontextmenu = (e) => e.preventDefault();
    rail.onkeydown = (e) => {
      const max = Math.max(0, host.scrollHeight - host.clientHeight),
        steps: Record<string, number> = {
          ArrowDown: 36,
          ArrowUp: -36,
          PageDown: host.clientHeight * 0.8,
          PageUp: -host.clientHeight * 0.8,
        };
      if (e.key === 'Home') host.scrollTop = 0;
      else if (e.key === 'End') host.scrollTop = max;
      else if (e.key in steps) host.scrollTop += steps[e.key];
      else return;
      e.preventDefault();
      e.stopPropagation();
      update();
    };
    rail.addEventListener(
      'wheel',
      (e) => {
        host.scrollTop += e.deltaY;
        e.preventDefault();
        e.stopPropagation();
        update();
      },
      { passive: false },
    );
    host.classList.add('game-scroll-host');
    root.append(rail);
    entries.set(host, { rail, thumb });
  }
  function update() {
    for (const [host, { rail }] of entries)
      if (!host.isConnected) {
        rail.remove();
        entries.delete(host);
      }
    root.querySelectorAll<HTMLElement>(selectors).forEach((host) => {
      if (!entries.has(host)) add(host);
    });
    const base = root.getBoundingClientRect();
    for (const [host, { rail, thumb }] of entries) {
      const rect = host.getBoundingClientRect(),
        style = getComputedStyle(host),
        overflow = /auto|scroll/.test(style.overflowY),
        visible =
          !host.closest('[hidden]') &&
          rect.width > 0 &&
          rect.height > 65 &&
          overflow &&
          host.scrollHeight > host.clientHeight + 1;
      rail.hidden = !visible;
      if (!visible) continue;
      const inset = host.matches('.panel,.quest') ? 52 : 3,
        height = Math.max(20, rect.height - inset - 6),
        m = scrollbarMetrics(
          host.clientHeight,
          host.scrollHeight,
          height,
          host.scrollTop,
        );
      // Rails live at the UI root, so reproduce clipping by scrolling ancestors.
      const clip={left:Math.max(0,base.left),top:Math.max(0,base.top),right:Math.min(innerWidth,base.right),bottom:Math.min(innerHeight,base.bottom)};
      for(let parent=host.parentElement;parent&&parent!==root;parent=parent.parentElement){
        const parentStyle=getComputedStyle(parent),bounds=parent.getBoundingClientRect();
        if(/auto|scroll|hidden|clip/.test(parentStyle.overflowX)){clip.left=Math.max(clip.left,bounds.left+parent.clientLeft);clip.right=Math.min(clip.right,bounds.left+parent.clientLeft+parent.clientWidth);}
        if(/auto|scroll|hidden|clip/.test(parentStyle.overflowY)){clip.top=Math.max(clip.top,bounds.top+parent.clientTop);clip.bottom=Math.min(clip.bottom,bounds.top+parent.clientTop+parent.clientHeight);}
        if(parent.matches('.panel')){
          const heading=parent.querySelector<HTMLElement>('.inventory-heading');
          if(heading&&getComputedStyle(heading).position==='sticky')clip.top=Math.max(clip.top,heading.getBoundingClientRect().bottom);
        }
      }
      const left=rect.right-12,top=rect.top+inset,right=left+8,bottom=top+height;
      if(Math.min(right,clip.right)<=Math.max(left,clip.left)||Math.min(bottom,clip.bottom)<=Math.max(top,clip.top)){rail.hidden=true;continue;}
      rail.style.clipPath='inset('+Math.max(0,clip.top-top)+'px '+Math.max(0,right-clip.right)+'px '+Math.max(0,bottom-clip.bottom)+'px '+Math.max(0,clip.left-left)+'px)';
      rail.style.left = rect.right - base.left - 12 + 'px';
      rail.style.top = rect.top - base.top + inset + 'px';
      rail.style.height = height + 'px';
      thumb.style.height = m.size + 'px';
      thumb.style.transform = 'translateY(' + m.offset + 'px)';
      rail.setAttribute(
        'aria-valuenow',
        String(Math.round(m.max ? (host.scrollTop / m.max) * 100 : 0)),
      );
    }
  }
  const onScroll = () => update();
  root.addEventListener('scroll', onScroll, true);
  window.addEventListener('resize', update);
  return {
    update,
    dispose() {
      root.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', update);
      for (const [host, { rail }] of entries) {
        host.classList.remove('game-scroll-host');
        rail.remove();
      }
      entries.clear();
    },
  };
}
