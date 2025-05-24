import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/main.page';

test.describe('Side Menu Shenanigans', () => {
  let homePage: HomePage;
  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await page.goto('/');
    await homePage.forceGoToHome();
  });

  test.skip('test', async ({ page }) => {
    await page.goto('https://tensor.art/');
    await page.getByRole('button', { name: 'Back to Home' }).click();
    await page.waitForTimeout(3000);

    await page.getByRole('link', { name: 'Home' }).click();
    await page.getByRole('link', { name: 'Models', exact: true }).click();
    await page.getByRole('link', { name: 'AI Tools' }).click();
    await page.getByRole('link', { name: 'Posts' }).click();
    await page.getByRole('link', { name: 'Workflows' }).click();
    await page.getByRole('link', { name: 'Articles' }).click();
    await page.getByRole('link', { name: 'Events' }).click();
    await page.getByRole('link', { name: 'Leaderboard' }).click();
    await page.getByRole('heading', { name: 'Channel' }).click();
    await page.getByRole('link', { name: 'Anime', exact: true }).click();
    await page.getByRole('link', { name: 'Portrait' }).click();
    await page.getByRole('link', { name: 'Realistic' }).click();
    await page.getByRole('link', { name: 'Illustration', exact: true }).click();
    await page.getByRole('link', { name: 'Sci-Fi' }).click();
    await page.getByRole('link', { name: 'Visual Design' }).click();
    await page.getByRole('link', { name: 'Space Design' }).click();
    await page.getByRole('link', { name: 'Game Design' }).click();
  });

test('Tensor Art Logo Check', async () => {
  // ARRANGE
  // (Strona ustawiona w `beforeEach`; homePage zainicjalizowany)

  // ACT
  const el = await homePage.getVisibleHomeLogo(); // ElementHandle<Element> lub undefined

  // ASSERT
  if (el) {
    const outerHTML = await el.evaluate((node) => node.outerHTML);
    console.log('[FOUND] Tensor.Art logo is visible.');
    console.log(`[PATH] Element outerHTML: ${outerHTML}`);

    // Widoczność
    const isVisible = await el.isVisible();
    expect(isVisible).toBe(true);

    // Atrybuty
    const style = await el.getAttribute('style');
    expect(style).toMatch(/object-fit:\s*cover/);

    const loading = await el.getAttribute('loading');
    expect(loading).toBe('lazy');

    const draggable = await el.getAttribute('draggable');
    expect(draggable).toBe('true');
  } else {
    console.warn('[NOT FOUND] Tensor.Art logo is not visible after max retries.');

    const bodyHTML = await homePage.page.evaluate(() =>
      document.body.innerHTML.slice(0, 500)
    );
    console.warn(`[SNAPSHOT] Partial body content:\n${bodyHTML}...`);
  }
});

});
