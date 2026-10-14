import { it, expect } from 'vitest';
import {
  createGameScrollbars,
  scrollbarMetrics,
  pageTravel,
} from './game-scrollbars';
it('clamps legacy geometry safely', () => {
  expect(scrollbarMetrics(100, 50, 80, 100).max).toBe(0);
  expect(scrollbarMetrics(100, 1000, 80, -20).offset).toBe(0);
});
it('turns complete viewport pages, reaches the final action and returns without a scrollbar', () => {
  const root = document.createElement('div'),
    panel = document.createElement('section');
  panel.className = 'panel';
  root.append(panel);
  document.body.append(root);
  root.getBoundingClientRect = () => new DOMRect(0, 0, 500, 500);
  panel.getBoundingClientRect = () => new DOMRect(0, 50, 300, 200);
  Object.defineProperties(panel, {
    clientHeight: { value: 200 },
    scrollHeight: { value: 600 },
  });
  const pager = createGameScrollbars(root);
  pager.update();
  const nav = root.querySelector<HTMLElement>('.game-pages')!,
    buttons = nav.querySelectorAll('button');
  expect(nav.hidden).toBe(false);
  expect(buttons[0].disabled).toBe(true);
  expect(root.querySelector('[role=scrollbar]')).toBeNull();
  buttons[1].click();
  expect(panel.scrollTop).toBe(104);
  buttons[1].click();
  buttons[1].click();
  buttons[1].click();
  expect(panel.scrollTop).toBe(400);
  expect(buttons[1].disabled).toBe(true);
  expect(nav.textContent).toContain('5 / 5');
  buttons[0].click();
  expect(panel.scrollTop).toBe(296);
  panel.hidden = true;
  pager.update();
  expect(nav.hidden).toBe(true);
  pager.dispose();
  expect(root.querySelector('.game-pages')).toBeNull();
  root.remove();
});

it('removes hunt page controls when settings become the compact quest HUD', () => {
  const root = document.createElement('div'),
    host = document.createElement('section');
  host.className = 'quest hunt-settings-open';
  root.append(host);
  document.body.append(root);
  root.getBoundingClientRect = () => new DOMRect(0, 0, 500, 500);
  host.getBoundingClientRect = () => new DOMRect(0, 0, 200, 200);
  Object.defineProperties(host, {
    clientHeight: { value: 200 },
    scrollHeight: { value: 500 },
  });
  const pager = createGameScrollbars(root);
  pager.update();
  expect(root.querySelector<HTMLElement>('.game-pages')!.hidden).toBe(false);
  host.classList.remove('hunt-settings-open');
  pager.update();
  expect(root.querySelector<HTMLElement>('.game-pages')!.hidden).toBe(true);
  pager.dispose();
  root.remove();
});

it('keeps nested bag paging above the parent window paging row', () => {
  const root = document.createElement('div'),
    panel = document.createElement('section'),
    bag = document.createElement('div');
  panel.className = 'panel';
  panel.style.overflowY = 'auto';
  bag.className = 'bag-grid';
  panel.append(bag);
  root.append(panel);
  document.body.append(root);
  root.getBoundingClientRect = () => new DOMRect(0, 0, 500, 500);
  panel.getBoundingClientRect = () => new DOMRect(0, 0, 300, 300);
  bag.getBoundingClientRect = () => new DOMRect(0, 80, 300, 300);
  for (const host of [panel, bag])
    Object.defineProperties(host, {
      clientHeight: { value: 300 },
      scrollHeight: { value: 900 },
    });
  const pages = createGameScrollbars(root);
  pages.update();
  const navs = root.querySelectorAll<HTMLElement>('.game-pages');
  expect(Number.parseFloat(navs[1].style.top) + 32).toBeLessThan(
    Number.parseFloat(navs[0].style.top),
  );
  pages.dispose();
  root.remove();
});

it('reserves the sticky title, navigation and a complete touch action between pages', () => {
  expect(pageTravel(388, 70)).toBe(222);
  expect(388 - pageTravel(388, 70)).toBeGreaterThanOrEqual(70 + 36 + 44);
  expect(pageTravel(100, 70)).toBe(1);
});
