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
      // The projected world sign can legitimately fall outside the camera view.
      // Exercise the same real shop UI via the visible inventory button in that case.
      const shopSign = page.locator('#sign-shop');
      const signRect = await shopSign.boundingBox();
      const signActionable = await shopSign
        .click({ trial: true, timeout: 1500 })
        .then(() => true, () => false);
      row.shopSign = { rect: signRect, actionable: signActionable };
      if (signActionable) await shopSign.click();
      else {
        await page.locator('#inventory').click();
        await page.locator('#open-shop').click();
      }
      await expect(page.locator('#buy-one')).toBeVisible();
      if (width === 1440 && signActionable) await shopSign.click();
      else await page.locator('#panel-close').click();
      await expect(page.locator('#panel')).toBeHidden();
      // Sample after the real bubbling feedback handler, inside the actual event.
      await page.evaluate(() =>
        document.querySelector('#dream-ui').addEventListener(
          'click',
          (event) => {
            const el = event.target.closest('[data-intent=potion]');
            if (!el) return;
            const a = getComputedStyle(el, '::before'),
              b = getComputedStyle(el, '::after');
            window.__SLOT_PAINT__ = {
              position: getComputedStyle(el).position,
              animation: a.animationName,
              duration: a.animationDuration,
              ring: b.borderTopWidth,
              active: el.classList.contains('slot-activated'),
            };
          },
          { once: true },
        ),
      );
      await page.locator('[data-intent=potion]').click();
      row.slot = await page.evaluate(() => window.__SLOT_PAINT__);
      expect(row.slot.position).toBe('relative');
      expect(row.slot.animation).toBe('dz-slot-flash');
      expect(row.slot.duration).toBe('0.62s');
      expect(row.slot.ring).toBe('1px');
      expect(row.slot.active).toBe(true);
      await page.locator('#menu').click();
      // Compact options fit on desktop; expanded real sections must still scroll.
      for(const summary of await page.locator('#panel details summary').all())await summary.click();
      await page.locator('#panel').evaluate(el=>el.scrollTop=0);
      await expect(
        page.locator('.game-scrollbar[data-scroll-for=panel]'),
      ).toBeVisible();
      row.scroll = await page.locator('#panel').evaluate((el) => ({
        height: el.clientHeight,
        scrollHeight: el.scrollHeight,
        thumb: getComputedStyle(
          document.querySelector(
            '.game-scrollbar[data-scroll-for=panel] .game-scrollbar-thumb',
          ),
        ).backgroundImage,
        track: getComputedStyle(
          document.querySelector('.game-scrollbar[data-scroll-for=panel]'),
        ).boxShadow,
        color: getComputedStyle(el).scrollbarColor,
      }));
      expect(row.scroll.thumb).toContain('linear-gradient');
      expect(row.scroll.color).toBe('auto');
      const rail = page.locator('.game-scrollbar[data-scroll-for=panel]');
      await expect(rail).toBeVisible();
      await rail.focus();
      await page.keyboard.press('End');
      expect(
        await page.locator('#panel').evaluate((el) => el.scrollTop),
      ).toBeGreaterThan(0);
      await page.keyboard.press('Home');
      expect(await page.locator('#panel').evaluate((el) => el.scrollTop)).toBe(
        0,
      );
      const rb = await rail.boundingBox();
      await page.mouse.click(rb.x + rb.width / 2, rb.y + rb.height - 3);
      expect(
        await page.locator('#panel').evaluate((el) => el.scrollTop),
      ).toBeGreaterThan(0);
      const thumb = page.locator(
          '.game-scrollbar[data-scroll-for=panel] .game-scrollbar-thumb',
        ),
        tb = await thumb.boundingBox();
      await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2);
      await page.mouse.down();
      await page.mouse.move(rb.x + rb.width / 2, rb.y + 2, { steps: 5 });
      await page.mouse.up();
      expect(
        await page.locator('#panel').evaluate((el) => el.scrollTop),
      ).toBeLessThan(3);
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
      if (process.env.PR22_UI_ONLY === '1') {
        expect(errors).toEqual([]);
        await context.close();
        continue;
      }
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
      if (width === 390) {
        // DOM PointerEvents exercise the actual renderer zoom integration,
        // without claiming physical multitouch-device certification.
        const canvas = page.locator('#game');
        const beforePinch = await page.evaluate(() => ({
          zoom: window.__DREAM_CAMERA_ZOOM__(),
          x: window.__DREAM_SESSION__.state.player.x,
          z: window.__DREAM_SESSION__.state.player.z,
        }));
        await canvas.dispatchEvent('pointerdown', {
          pointerId: 201, pointerType: 'touch', isPrimary: true,
          button: 0, clientX: 100, clientY: 300,
        });
        await canvas.dispatchEvent('pointerdown', {
          pointerId: 202, pointerType: 'touch', isPrimary: false,
          button: 0, clientX: 220, clientY: 300,
        });
        await canvas.dispatchEvent('pointermove', {
          pointerId: 202, pointerType: 'touch', isPrimary: false,
          button: 0, clientX: 260, clientY: 300,
        });
        await canvas.dispatchEvent('pointerup', {
          pointerId: 201, pointerType: 'touch', isPrimary: true,
          button: 0, clientX: 100, clientY: 300,
        });
        await canvas.dispatchEvent('pointerup', {
          pointerId: 202, pointerType: 'touch', isPrimary: false,
          button: 0, clientX: 260, clientY: 300,
        });
        const afterPinch = await page.evaluate(() => ({
          zoom: window.__DREAM_CAMERA_ZOOM__(),
          x: window.__DREAM_SESSION__.state.player.x,
          z: window.__DREAM_SESSION__.state.player.z,
        }));
        expect(afterPinch.zoom).toBeLessThan(beforePinch.zoom);
        expect(afterPinch.x).toBe(beforePinch.x);
        expect(afterPinch.z).toBe(beforePinch.z);
        row.pinch = { before: beforePinch, after: afterPinch, simulated: true };
      }
      expect(errors).toEqual([]);
      await context.close();
    }
  } finally {
    fs.writeFileSync(
      out +
        (process.env.PR22_UI_ONLY === '1'
          ? '/report-ui-only.json'
          : '/report.json'),
      JSON.stringify(report, null, 2),
    );
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
