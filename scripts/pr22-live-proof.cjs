const { chromium, expect } = require('@playwright/test'),
  fs = require('fs');
const extension=process.env.DREAM_ADVENTURE_PROOF==='1'?require('./adventure-next-step-smoke.cjs'):null;
const polish=process.env.DREAM_PRIORITY36_PROOF==='1'?require('./priority36-proof.cjs'):null;
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
      if(polish)await polish.setup(page);
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
      const categories=page.locator('.window-page-tabs button');
      await expect(categories).toHaveCount(3);
      await categories.nth(1).click();await expect(page.locator('#save-now')).toBeVisible();
      await page.locator('#panel details:visible summary').click();
      const pages=page.locator('.game-pages[data-page-for=panel]');
      if(await pages.isVisible()){
        const forward=pages.locator('button').nth(1),back=pages.locator('button').nth(0);
        await forward.click();expect(await page.locator('#panel').evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
        await back.click();expect(await page.locator('#panel').evaluate(el=>el.scrollTop)).toBe(0);
        await forward.focus();await page.keyboard.press('PageDown');expect(await page.locator('#panel').evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
        for(let turns=0;turns<50&&!await forward.isDisabled();turns++)await forward.click();
        expect(await page.locator('#panel').evaluate(el=>el.scrollTop+el.clientHeight>=el.scrollHeight-1)).toBe(true);
        await expect(page.locator('#panel-close')).toBeInViewport();
        row.scroll={mode:'pages',label:await pages.textContent(),buttonPaint:await forward.evaluate(el=>getComputedStyle(el).backgroundImage)};
        expect(row.scroll.buttonPaint).toContain('linear-gradient');
      }
      await categories.nth(2).click();await expect(page.locator('#login')).toBeVisible();
      expect(await page.locator('[role=scrollbar]').count()).toBe(0);
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
        if(polish)await polish.travel(page,row,stage);
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
        if(extension)await extension.claim(page);
        else await page.locator('#quest-claim').click();
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
      if(extension)await extension.afterQuestLine(page,row,width,out);
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
