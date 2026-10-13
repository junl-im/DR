// End-to-end quest rewards and combat continuity through actual game controls.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const out = 'artifacts/combat-quest-proof';
fs.mkdirSync(out, { recursive: true });
const base = process.env.COMBAT_BASE_URL || 'http://127.0.0.1:4300/';
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.DREAM_CHROMIUM || undefined,
    args: [
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--disable-dev-shm-usage',
    ],
  });
  const report = { base, results: [] };
  try {
    for (const width of [1440, 390]) {
      const context = await browser.newContext({
        viewport: { width, height: width === 390 ? 844 : 900 },
        isMobile: width === 390,
        hasTouch: width === 390,
      });
      const page = await context.newPage(),
        errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      const row = { width, errors };
      report.results.push(row);
      await page.goto(base, { waitUntil: 'domcontentloaded' });
      await page.locator('#start').click();
      await page.waitForFunction(() => window.__DREAM_SESSION__, null, {
        timeout: 90000,
      });
      await page.locator('.vitals').click();
      await expect(page.locator('#character-stats')).toBeVisible();
      await expect(page.locator('#character-stats')).toContainText('공격력');
      await page.locator(width === 390 ? '#panel-close' : '.vitals').click();
      await expect(page.locator('#panel')).toBeHidden();
      if (width === 1440) {
        await page.locator('.vitals').focus();
        await page.keyboard.press('Enter');
        await expect(page.locator('#character-stats')).toBeVisible();
        await page.keyboard.press('Space');
        await expect(page.locator('#panel')).toBeHidden();
      }
      await page.locator('#quest-mini').click();
      await expect(page.locator('#quest-claim')).toBeDisabled();
      await page.locator('#help-quest-target').click();
      await page.waitForFunction(
        () => window.__DREAM_SESSION__.state.player.quest.progress >= 1,
        null,
        { timeout: 65000 },
      );
      await expect(page.locator('#auto-hunt')).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await page.locator('[data-intent="skill"]').click();
      await expect(page.locator('#auto-hunt')).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await page.locator('[data-intent="potion"]').click();
      await expect(page.locator('#auto-hunt')).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      if (width === 1440) {
        await page.keyboard.press('2');
        await expect(page.locator('#auto-hunt')).toHaveAttribute(
          'aria-pressed',
          'true',
        );
      }
      // Keep the journal open during real kills: its initially-disabled claim must update.
      await page.locator('#quest-mini').click();
      await page.waitForFunction(
        () => window.__DREAM_SESSION__.state.player.quest.progress === 3,
        null,
        { timeout: 150000 },
      );
      await expect(page.locator('#quest-claim')).toBeEnabled();
      await expect(page.locator('#quest-claim')).toHaveText(
        '마을 귀환 후 보상 수령',
      );
      const before = await page.evaluate(() =>
        structuredClone(window.__DREAM_SESSION__.state.player),
      );
      await page.locator('#quest-claim').click();
      await page.waitForFunction(
        () => window.__DREAM_SESSION__.state.player.quest.stage === 1,
      );
      const after = await page.evaluate(() =>
        structuredClone(window.__DREAM_SESSION__.state.player),
      );
      expect(after.gold).toBe(before.gold + 28);
      expect(after.wood).toBe(before.wood + 3);
      expect(after.potions).toBe(before.potions + 1);
      expect(after.armor.fragments).toBe(before.armor.fragments + 1);
      expect(Math.hypot(after.x, after.z)).toBeLessThan(12);
      await expect(page.locator('#quest-claim')).toBeDisabled();
      row.reward = {
        before: {
          gold: before.gold,
          wood: before.wood,
          potions: before.potions,
        },
        after: { gold: after.gold, wood: after.wood, potions: after.potions },
        stage: after.quest.stage,
      };
      await page.evaluate(() => window.__DREAM_SAVE__());
      await page.reload();
      await page.locator('#continue').click();
      await page.waitForFunction(() => window.__DREAM_SESSION__);
      expect(
        await page.evaluate(
          () => window.__DREAM_SESSION__.state.player.quest.stage,
        ),
      ).toBe(1);
      // Exercise normal path movement into a living mob, without forcing HP or emitting hits.
      await page.evaluate(() => {
        const s = window.__DREAM_SESSION__,
          m = s.mobs.find((m) => m.name === '잉크 슬라임');
        s.dispatch({ type: 'move', x: m.x, z: m.z });
      });
      await page.waitForFunction(
        () =>
          document.querySelector('#auto-hunt').getAttribute('aria-pressed') ===
          'true',
        null,
        { timeout: 65000 },
      );
      row.retaliation = await page.evaluate(() => ({
        hp: window.__DREAM_SESSION__.state.player.hp,
        target: window.__DREAM_SESSION__.target,
      }));
      expect(row.retaliation.target).toBeTruthy();
      await page.locator('#auto-hunt').click();
      await expect(page.locator('#auto-hunt')).toHaveAttribute(
        'aria-pressed',
        'false',
      );
      await page.waitForTimeout(3000);
      await expect(page.locator('#auto-hunt')).toHaveAttribute(
        'aria-pressed',
        'false',
      );
      await page.locator('.vitals').click();
      await page.screenshot({ path: out + '/' + width + '-character.png' });
      expect(errors).toEqual([]);
      await context.close();
    }
  } catch (e) {
    report.error = String(e);
    throw e;
  } finally {
    fs.writeFileSync(out + '/report.json', JSON.stringify(report, null, 2));
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
