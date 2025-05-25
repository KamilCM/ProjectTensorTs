import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/main.page';
import { PostsPage } from '../pages/posts.page';

test.describe('Post Site Shenanigans', () => {
  let homePage: HomePage;
  let postsPage: PostsPage;
  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    postsPage = new PostsPage(page);
    await page.goto('/');
    await homePage.forceGoToHome();
    await homePage.postsButton.click();
    await page.waitForTimeout(3000);
  });

  test('Check visibility of posts page elements', async () => {
    // ARRANGE
    // (Page and postsPage are set up in beforeEach)

    // ACT
    // (No user action needed – already on posts page)

    // ASSERT
    await expect(postsPage.postsHeading).toBeVisible();
    await expect(postsPage.postsHeading).toHaveText('Posts');
    console.log('[FOUND] I See posts heading and it have correct name.');

    await expect(postsPage.postsPhotographyButton).toBeVisible();
    await expect(postsPage.postsPhotographyButton).toHaveAttribute(
      'aria-current',
      'page'
    );
    console.log('[FOUND] I see photography button and it is clickable.');
  });

  test('Gallery images change on Tag Click', async ({ page }) => {
    // ARRANGE – page and postsPage are initialized in beforeEach

    const galleryImages = page.locator('div.content-visibility-auto img[src]');
    await galleryImages.first().scrollIntoViewIfNeeded(); // ensure first image is in viewport
    await page.waitForTimeout(1000); // allow lazy loading

    const initialSrcs = await galleryImages.evaluateAll((imgs) =>
      imgs.map((img) => (img as HTMLImageElement).src)
    );

    // ACT – click the "PHOTOGRAPHY" tag using Page Object
    await postsPage.postsPhotographyButton.click();

    // Wait for content to reload and new images to render
    await page.waitForLoadState('networkidle');
    await page.mouse.wheel(0, 1000); // force scroll to trigger lazy load
    await page.waitForTimeout(1000);

    const afterSrcs = await galleryImages.evaluateAll((imgs) =>
      imgs.map((img) => (img as HTMLImageElement).src)
    );
    //console.log('Updated image sources:', afterSrcs.slice(0, 5));

    // ASSERT – image sources must be different after clicking the tag
    expect(afterSrcs).not.toEqual(initialSrcs);
    console.log('[CHECKED] I see different images on Photography.');
  });

  test('First 3 images in Photography tab open popup with PHOTOGRAPHY tag', async ({
    page,
  }) => {
    // ARRANGE
    await postsPage.postsPhotographyButton.click();
    await page.waitForTimeout(1000); // czekamy na załadowanie miniaturek

    for (let i = 0; i < 3; i++) {
      console.log(`[STEP] Clicking image ${i + 1}`);

      const image = page.locator(`div[data-index="${i}"]`);
      await image.scrollIntoViewIfNeeded();
      await image.click();
      await page.waitForTimeout(1000); // czekamy na otwarcie popupu

      // SZUKAJ TAGÓW W POPUPIE
      const tagList = page.locator('ul.flex.flex-wrap.gap-4');
      const photographyTag = tagList.getByRole('link', {
        name: 'PHOTOGRAPHY',
        exact: true,
      });

      await page.waitForTimeout(1000); // ⏱️ Czekamy na tagi
      await expect(photographyTag).toBeVisible();

      // ZAMKNIJ POPUP
      const closeButton = page.locator('div[title="Esc"]');
      await closeButton.click();
      await page.waitForTimeout(500); // odetchnij zanim klikniesz kolejny
    }
  });

  

});
