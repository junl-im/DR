const { chromium, expect } = require('@playwright/test'),
  fs = require('fs');
const out = 'artifacts/pr22-polish-proof';
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.DREAM_CHROMIUM || undefined,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const report = [];
  try {
    for (const width of [1440, 390]) {
      const context = await browser.newContext({
          viewport: { width, height: width === 390 ? 844 : 900 },
          isMobile: width === 390,
          hasTouch: width === 390,
        }),
        page = await context.newPage(),
        errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      await page.goto(process.env.PR22_BASE_URL || 'http://127.0.0.1:4300/');
      await page.locator('#start').click();
      await page.waitForFunction(() => window.__DREAM_SESSION__, null, {
        timeout: 90000,
      });
      const row = { width, errors, quests: [] };
      report.push(row);
      for (const id of ['#inventory', '#estate', '#menu', '#quest-mini']) {
        await page.locator(id).click();
        await expect(page.locator('#panel')).toBeVisible();
        await page.locator(id).click();
        await expect(page.locator('#panel')).toBeHidden();
      }
      await page.locator('#sign-shop').click();
      await expect(page.locator('#buy-one')).toBeVisible();
      if (width === 1440) await page.locator('#sign-shop').click();
      else await page.locator('#panel-close').click();
      await expect(page.locator('#panel')).toBeHidden();
      // A real click, sampled synchronously after the UI handler, checks painted layers.
      await page.locator('[data-intent=potion]').click();
      // Capture after the bubbling feedback handler, on the following actual frame.
      row.slot = await page.locator('[data-intent=potion]').evaluate(
        (el) =>
          new Promise((resolve) =>
            requestAnimationFrame(() => {
              const a = getComputedStyle(el, '::before'),
                b = getComputedStyle(el, '::after');
              resolve({
                position: getComputedStyle(el).position,
                animation: a.animationName,
                duration: a.animationDuration,
                ring: b.borderTopWidth,
                active: el.classList.contains('slot-activated'),
              });
            }),
          ),
      );
      expect(row.slot.position).toBe('relative');
      expect(row.slot.animation).toBe('dz-slot-flash');
      expect(row.slot.duration).toBe('0.62s');
      expect(row.slot.ring).toBe('1px');
      expect(row.slot.active).toBe(true);
      await page.locator('#menu').click();
      row.scroll = await page
        .locator('#panel')
        .evaluate((el) => ({
          height: el.clientHeight,
          scrollHeight: el.scrollHeight,
          thumb: getComputedStyle(el, '::-webkit-scrollbar-thumb')
            .backgroundImage,
          track: getComputedStyle(el, '::-webkit-scrollbar-track').boxShadow,
          color: getComputedStyle(el).scrollbarColor,
        }));
      expect(row.scroll.thumb).toContain('linear-gradient');
      expect(row.scroll.color).toBe('auto');
      await page
        .locator('#panel')
        .evaluate((el) => (el.scrollTop = el.scrollHeight));
      await expect(page.locator('#panel-close')).toBeInViewport();
      await page.screenshot({ path: out + '/' + width + '-scrollbar.png' });
      await page.locator('#panel-close').click();
      await page.locator('#menu').click();
      expect(await page.locator('#panel').evaluate((el) => el.scrollTop)).toBe(
        0,
      );
      await page.locator('#panel-close').click();
      await page.locator('#hunt-config-toggle').click();
      await page.locator('#auto-radius').selectOption('12');
      await page.locator('#hunt-close').click();
      for (let stage = 0; stage < 3; stage++) {
        await page.locator('#quest-mini').click();
        await expect(page.locator('#quest-claim')).toBeDisabled();
        await page.locator('#help-quest-target').click();
        const required = [3, 4, 1][stage];
        await page.waitForFunction(
          ({ stage, required }) => {
            const q = window.__DREAM_SESSION__.state.player.quest;
            return q.stage === stage && q.progress === required;
          },
          { stage, required },
          { timeout: 150000 },
        );
        await expect(page.locator('#auto-hunt')).toHaveAttribute(
          'aria-pressed',
          'false',
        );
        const before = await page.evaluate(() =>
          structuredClone(window.__DREAM_SESSION__.state.player),
        );
        await page.locator('#quest-mini').click();
        await expect(page.locator('#quest-claim')).toBeEnabled();
        await page.locator('#quest-claim').click();
        const after = await page.evaluate(() =>
          structuredClone(window.__DREAM_SESSION__.state.player),
        );
        expect(after.quest).toEqual({ stage: stage + 1, progress: 0 });
        expect(after.gold).toBe(before.gold + [28, 55, 100][stage]);
        row.quests.push({
          stage,
          required,
          kills: before.kills,
          beforeGold: before.gold,
          afterGold: after.gold,
        });
        await page.locator('#panel-close').click();
      }
      await page.evaluate(() => window.__DREAM_SAVE__());
      await page.reload();
      await page.locator('#continue').click();
      await page.waitForFunction(() => window.__DREAM_SESSION__);
      expect(
        await page.evaluate(() => window.__DREAM_SESSION__.state.player.quest),
      ).toEqual({ stage: 3, progress: 0 });
      await page.screenshot({ path: out + '/' + width + '-all-quests.png' });
      expect(errors).toEqual([]);
      await context.close();
    }
  } finally {
    fs.writeFileSync(out + '/report.json', JSON.stringify(report, null, 2));
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
