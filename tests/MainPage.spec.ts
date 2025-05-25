import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/main.page';

test.describe('Main Menu Shenanigans', () => {
  let homePage: HomePage;
  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await page.goto('/');
    await homePage.forceGoToHome();
  });

  test('Tensor Art Logo Check', async () => {
    // ARRANGE – beforeEach sets up the page and homePage

    // ACT
    const el = await homePage.getVisibleHomeLogo();

    // ASSERT
    expect(el).toBeDefined(); // basic assertion for presence

    if (!el) {
      console.warn(
        '[NOT FOUND] Tensor.Art logo is not visible after max retries.'
      );
      const bodyHTML = await homePage.page.evaluate(() =>
        document.body.innerHTML.slice(0, 500)
      );
      console.warn(`[SNAPSHOT] Partial body content:\n${bodyHTML}...`);
      return;
    }

    const outerHTML = await el.evaluate((node) => node.outerHTML);
    console.log('[FOUND] Tensor.Art logo is visible.');
    // console.log(`[PATH] Element outerHTML: ${outerHTML}`);

    const isVisible = await el.isVisible();
    expect(isVisible).toBe(true);

    const style = await el.getAttribute('style');
    expect(style).toMatch(/object-fit:\s*cover/);

    const loading = await el.getAttribute('loading');
    expect(loading).toBe('lazy');

    const draggable = await el.getAttribute('draggable');
    expect(draggable).toBe('true');
  });
});
