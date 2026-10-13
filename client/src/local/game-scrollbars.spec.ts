import { it, expect } from 'vitest';
import { scrollbarMetrics } from './game-scrollbars';
it('keeps short content and oversized scroll input inside the game rail', () => {
  expect(scrollbarMetrics(100, 50, 80, 100)).toEqual({
    max: 0,
    size: 80,
    travel: 0,
    offset: 0,
  });
  const bottom = scrollbarMetrics(100, 1000, 80, 5000);
  expect(bottom.size).toBe(28);
  expect(bottom.offset).toBe(bottom.travel);
  expect(scrollbarMetrics(100, 1000, 80, -20).offset).toBe(0);
});
