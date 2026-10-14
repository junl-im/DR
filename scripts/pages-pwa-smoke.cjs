const fs = require('fs'),
  { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.DREAM_CHROMIUM || undefined,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const reports = [];
  const out = process.env.PAGES_OUT || 'artifacts/pages-pwa-proof';
  fs.mkdirSync(out, { recursive: true });
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [360, 640],
    [320, 568],
    [844, 390],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      isMobile: width < 500,
      hasTouch: width < 500,
    });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(process.env.PAGES_BASE_URL || 'http://127.0.0.1:4300/');
    await page.locator('#start').waitFor();
    const manifestURL = await page
      .locator('link[rel=manifest]')
      .getAttribute('href');
    const response = await page.request.get(
      new URL(manifestURL, page.url()).href,
    );
    const manifest = await response.json();
    if (manifest.display !== 'standalone' || manifest.id !== './')
      throw Error('Manifest scope');
    for (const icon of manifest.icons) {
      const response = await page.request.get(
        new URL(icon.src, new URL(manifestURL, page.url())).href,
      );
      if (
        response.status() !== 200 ||
        !response.headers()['content-type'].includes('image/png')
      )
        throw Error('Missing icon');
    }
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt', { cancelable: true });
      event.prompt = async () => {
        window.__INSTALL_PROMPT_CALLED__ = true;
      };
      event.userChoice = Promise.resolve({ outcome: 'dismissed' });
      window.dispatchEvent(event);
    });
    await page.locator('#install-game').click();
    if (!(await page.evaluate(() => window.__INSTALL_PROMPT_CALLED__)))
      throw Error('Install event not consumed');
    await page.locator('#install-game').click();
    await page.locator('#install-guide button').click();
    await page.locator('#start').click();
    await page.locator('#menu').waitFor({ timeout: 60000 });
    await page.locator('#menu').click();
    await page.waitForTimeout(400);
    const tabs = page.locator('.window-page-tabs button');
    await tabs.nth(1).click();
    if (!(await page.locator('#save-now').isVisible()))
      throw Error('save tab unreachable');
    await tabs.nth(2).click();
    if (!(await page.locator('#login').isVisible()))
      throw Error('account tab unreachable');
    await tabs.nth(0).click();
    await page.locator('#install-game-option').click();
    await page.locator('#install-guide button').click();
    const nav = page.locator('.game-pages[data-page-for=panel]');
    let turns = 0;
    while (
      (await nav.isVisible()) &&
      !(await nav.locator('button').nth(1).isDisabled()) &&
      turns < 30
    ) {
      await nav.locator('button').nth(1).click();
      turns++;
    }
    await page.locator('#panel-close').click();
    await page.locator('#inventory').click();
    await page.waitForFunction(() => {
      const panel = document.querySelector('#panel'),
        nav = document.querySelector('.game-pages[data-page-for=panel]');
      return (
        panel &&
        nav &&
        (panel.scrollHeight <= panel.clientHeight + 1 || !nav.hidden)
      );
    });
    const inventoryPages = page.locator('.game-pages[data-page-for=panel]');
    let inventoryTurns = 0;
    const visited = new Set();
    const capture = async () => {
      const ids = await page.evaluate(() => {
        const panel = document.querySelector('#panel'),
          p = panel.getBoundingClientRect(),
          heading = panel
            .querySelector('.inventory-heading')
            .getBoundingClientRect();
        return [
          ...panel.querySelectorAll(
            '#open-shop,#toggle-equipment,#upgrade,[data-craft-armor]',
          ),
        ]
          .filter((b) => {
            const r = b.getBoundingClientRect(),
              hit = document.elementFromPoint(
                r.x + r.width / 2,
                r.y + r.height / 2,
              );
            return (
              r.top >= Math.max(p.top, heading.bottom) &&
              r.bottom <= p.bottom - 36 &&
              (hit === b || b.contains(hit))
            );
          })
          .map((b) => b.id || b.dataset.craftArmor);
      });
      ids.forEach((id) => visited.add(id));
    };
    await capture();
    while (
      (await inventoryPages.isVisible()) &&
      !(await inventoryPages.locator('button').nth(1).isDisabled()) &&
      inventoryTurns < 40
    ) {
      await inventoryPages.locator('button').nth(1).click();
      inventoryTurns++;
      await capture();
    }
    await capture();
    const expected = await page
      .locator('#panel')
      .evaluate((panel) =>
        [
          ...panel.querySelectorAll(
            '#open-shop,#toggle-equipment,#upgrade,[data-craft-armor]',
          ),
        ].map((b) => b.id || b.dataset.craftArmor),
      );
    const missing = expected.filter((id) => !visited.has(id));
    if (missing.length) {
      await page.screenshot({
        path: out + '/actions-missing-' + width + '.png',
      });
      throw Error(JSON.stringify({ width, missing, visited: [...visited] }));
    }
    for (let back = 0; back < 50; back++) {
      const box = await page.locator('#open-shop').boundingBox(),
        p = await page.locator('#panel').boundingBox();
      if (box && box.y >= p.y + 80 && box.y + box.height <= p.y + p.height - 36)
        break;
      const previous = inventoryPages.locator('button').first();
      if (await previous.isDisabled())
        throw Error('Shop page cannot be reached');
      await previous.click();
    }
    await page.locator('#open-shop').click();
    if (!(await page.locator('#buy-one').isVisible()))
      throw Error('Inventory last action inaccessible');
    const result = await page.evaluate(() => ({
      scrollbars: document.querySelectorAll('[role=scrollbar]').length,
      page: document.querySelector('.game-pages[data-page-for=panel]')
        ?.textContent,
      documentOverflow: document.documentElement.scrollWidth > innerWidth,
    }));
    await page.screenshot({ path: out + '/' + width + '.png' });
    if (errors.length || result.scrollbars || result.documentOverflow)
      throw Error(JSON.stringify({ errors, result }));
    reports.push({
      width,
      height,
      turns,
      inventoryTurns,
      visitedActions:[...visited],
      expectedActions:expected,
      manifestIcons: manifest.icons.length,
      installPromptFixture: true,
      optionCategories: 3,
      lastInventoryAction: true,
      ...result,
      errors,
    });
    await page.close();
  }
  fs.writeFileSync(out + '/report.json', JSON.stringify(reports, null, 2));
  console.log(JSON.stringify(reports));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
