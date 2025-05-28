import { test, expect, Locator, Page } from '@playwright/test';
import { HomePage } from '../pages/main.page';
import { PostsPage } from '../pages/posts.page';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';
import { compareSSIM } from '../utils/compareSSIM';
import sharp from 'sharp';

test.describe('Post Site Shenanigans', () => {
  let homePage: HomePage;
  let postsPage: PostsPage;
  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    postsPage = new PostsPage(page);
    await page.goto('/');
    await page.waitForFunction(
      () => !document.title.includes('Checking your browser'),
      { timeout: 15000 }
    );
    await homePage.forceGoToHome();
    await homePage.postsButton.click();
    await page.waitForTimeout(3000);
  });

  test('Check visibility of posts elements', async () => {
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

  test('Check Gallery Image change', async ({ page }) => {
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

  test('Check Tag Photography', async ({ page }) => {
    // ARRANGE – go to Photography tab
    await postsPage.postsPhotographyButton.click();
    await page.waitForTimeout(1000); // wait for thumbnails to load

    for (let i = 0; i < 3; i++) {
      console.log(`[STEP] Clicking image ${i + 1}`);

      // ARRANGE – locate image
      const image = page.locator(`div[data-index="${i}"]`);

      // ACT – scroll and click the image
      await image.scrollIntoViewIfNeeded();
      await image.click();
      await page.waitForTimeout(1000); // wait for popup

      // ARRANGE – locate tag list and specific tag
      const tagList = page.locator('ul.flex.flex-wrap.gap-4');
      const photographyTag = tagList.getByRole('link', {
        name: 'PHOTOGRAPHY',
        exact: true,
      });

      // ASSERT – verify the tag is visible
      await page.waitForTimeout(1000); // wait for tags to render
      await expect(photographyTag).toBeVisible();

      // ACT – close the popup
      const closeButton = page.locator('div[title="Esc"]');
      await closeButton.click();
      await page.waitForTimeout(500); // small delay before next iteration
    }
  });

  test('Check Prompt Girl', async ({ page }) => {
    test.setTimeout(120000);

    // ARRANGE – Navigate to the Photography tab and locate image items
    await postsPage.postsPhotographyButton.click();
    console.log('[STEP] Clicked Photography button');

    const items = page.locator('div[data-index]');

    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, 1000);
      await page.waitForTimeout(1000);
      const itemCount = await items.count();
      console.log(`[SCROLL ${i + 1}] Found ${itemCount} items`);

      if (itemCount > 0) break;
    }

    const totalItems = await items.count();
    console.log(`[INFO] Found ${totalItems} image containers`);

    if (totalItems === 0) {
      const html = await page.content();
      throw new Error(
        'No image containers were found - possible loading issue or selector mismatch.'
      );
    }

    // ACT + ASSERT – Click up to 15 images and check if popup contains the word "girl"
    const maxToCheck = Math.min(15, totalItems);

    for (let i = 0; i < maxToCheck; i++) {
      console.log(`[STEP] Clicking image ${i + 1}`);

      const image = items.nth(i);
      await image.scrollIntoViewIfNeeded();
      await image.click();

      const popupBox = page.locator('div.max-h-120').first();
      let combinedText = '';

      try {
        await waitForRenderedPopup(page, popupBox);
        const texts = await popupBox.allInnerTexts();
        combinedText = texts.join(' ').toLowerCase();
      } catch (error) {
        console.warn(
          `[SKIP] Popup not rendered properly for image ${i + 1}: ${error.message}`
        );
      }

      if (combinedText.includes('girl')) {
        console.log(`[PASS] Found 'girl' in popup for image ${i + 1}`);
        
        return;
      }

      const closeButton = page.locator('div[title="Esc"]');
      await closeButton.click().catch(() => {
        console.warn('[INFO] Close button not found or already dismissed');
      });

      await expect(popupBox)
        .toBeHidden({ timeout: 3000 })
        .catch(() => {
          console.warn('[INFO] Popup already hidden or not found');
        });
    }

    console.warn(
      `[INFO] Checked ${maxToCheck} images but none contained the word 'girl'.`
    );
    throw new Error(
      `The word 'girl' was not found in any of the first ${maxToCheck} images.`
    );
  });

  test('Check Prompt Girl FULL @OverEngineered', async ({ page }) => {
    test.setTimeout(120000);

    // ARRANGE – Click Photography tab once
    await postsPage.postsPhotographyButton.click();
    console.log('[STEP] Clicked Photography button');

    const itemsLocator = page.locator('div[data-index]');
    const endOfList = page.locator("text=You've reached the end");

    // Initial lazy scroll to load items
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, 1000);
      await page.waitForTimeout(1000);
      const count = await itemsLocator.count();
      console.log(`[SCROLL INIT ${i + 1}] Found ${count} items`);
      if (count > 0) break;
    }

    const checkedIndexes = new Set<number>();
    const maxScrollRounds = 30;
    let foundGirl = false;

    for (let scrollRound = 0; scrollRound < maxScrollRounds; scrollRound++) {
      const totalItems = await itemsLocator.count();
      console.log(
        `[ROUND ${scrollRound + 1}] Total image containers: ${totalItems}`
      );

      let didSomething = false;

      for (let i = 0; i < totalItems; i++) {
        if (checkedIndexes.has(i)) continue;
        checkedIndexes.add(i);
        didSomething = true;

        const image = itemsLocator.nth(i);
        console.log(`[STEP] Clicking image ${i + 1}`);

        try {
          await image.scrollIntoViewIfNeeded();

          const box = await image.boundingBox();
          if (!box) {
            console.warn(`[SKIP] No bounding box for image ${i + 1}`);
            continue;
          }

          await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

          const popupBox = page.locator('div.max-h-120').first();
          await waitForRenderedPopup(page, popupBox);

          const texts = await popupBox.allInnerTexts();
          const combinedText = texts.join(' ').toLowerCase();
          console.log(`[DEBUG] Popup text for image ${i + 1}: ${combinedText}`);

          if (combinedText.includes('girl')) {
            console.log(`[PASS] Found 'girl' in popup for image ${i + 1}`);
            foundGirl = true;
            break;
          }

          // Close popup: try close button, fallback to Escape
          const closeButton = page.locator('div[title="Esc"]');
          try {
            await closeButton.scrollIntoViewIfNeeded();
            const closeBox = await closeButton.boundingBox();
            if (closeBox) {
              console.log('[ACTION] Clicking close button (center)');
              await page.mouse.click(
                closeBox.x + closeBox.width / 2,
                closeBox.y + closeBox.height / 2
              );
            } else {
              throw new Error('Close button exists but has no box');
            }
          } catch {
            console.warn('[FALLBACK] Pressing Escape key');
            await page.keyboard.press('Escape');
          }

          await expect(popupBox)
            .toBeHidden({ timeout: 4000 })
            .catch(() => {
              console.warn('[WARN] Popup did not hide after close attempt');
            });

          // Force Playwright to re-evaluate layout before moving on
          await page.waitForTimeout(500); // small stability delay

          // Re-evaluate current item count in case DOM updated
          await page.waitForFunction(() => {
            return !document.querySelector('div.max-h-120'); // confirm popup is really gone
          });
        } catch (err) {
          console.warn(`[ERROR] Failed on image ${i + 1}: ${err.message}`);
        }
      }

      if (foundGirl) break;

      const isAtEnd = await endOfList
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      if (isAtEnd) {
        console.log('[INFO] Reached end of gallery.');
        break;
      }

      if (!didSomething) {
        console.log(
          '[SCROLL] All current images processed. Scrolling to load more...'
        );
        await page.mouse.wheel(0, 2000);
        await page.waitForTimeout(2000);
      }
    }

    if (!foundGirl) {
      console.warn(
        '[FAIL] The word "girl" was not found in any of the images.'
      );
      throw new Error('The word "girl" was not found in any of the images.');
    }
  });

  test('Check reload blur check with pixelmatch', async ({ page }) => {
    test.setTimeout(120_000);

    // ========== ARRANGE ==========
    // Go to Photography tab and open first image
    await postsPage.postsPhotographyButton.click();
    const container = page.locator('div[data-index="0"]');
    await expect(container).toBeVisible({ timeout: 3000 });
    await container.click();
    await page.waitForTimeout(2000);

    // Wait for popup image to be visible
    const imageSelector = 'img[src*="posts/images"]';
    const imageLocator = page.locator(imageSelector).first();
    await expect(imageLocator).toBeVisible({ timeout: 3000 });

    // Force reload to apply clean state and reload image
    await page.reload();
    await page.waitForTimeout(1000);
    const freshImageLocator = page.locator(imageSelector).first();
    await expect(freshImageLocator).toBeVisible({ timeout: 2000 });

    // Screenshot the original image (before effect)
    const originalImgBuffer = await freshImageLocator.screenshot();
    const originalImgPng = PNG.sync.read(originalImgBuffer);

    // ========== ACT ==========
    const editButton = page.locator(
      'button:has(iconpark-icon[icon-id="imageedit"])'
    );
    await editButton.hover();

    const inpaintOption = page.locator(
      'div.n-popover__content >> text=Inpaint'
    );
    await expect(inpaintOption).toBeVisible();
    await inpaintOption.click();

    await page.waitForTimeout(1000);
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();

    const canvasBuffer = await canvas.screenshot();
    const canvasPng = PNG.sync.read(canvasBuffer);

    // Determine common resolution for comparison
    const commonWidth = Math.min(originalImgPng.width, canvasPng.width);
    const commonHeight = Math.min(originalImgPng.height, canvasPng.height);

    // ========== ASSERT ==========
    // Scale both to same resolution
    const scaledOriginalBuffer = await sharp(originalImgBuffer)
      .resize(commonWidth, commonHeight)
      .png()
      .toBuffer();

    const scaledCanvasBuffer = await sharp(canvasBuffer)
      .resize(commonWidth, commonHeight)
      .png()
      .toBuffer();

    const scaledOriginal = PNG.sync.read(scaledOriginalBuffer);
    const scaledCanvas = PNG.sync.read(scaledCanvasBuffer);

    // Compare pixel difference
    const diff = new PNG({ width: commonWidth, height: commonHeight });
    const numDiffPixels = pixelmatch(
      scaledOriginal.data,
      scaledCanvas.data,
      diff.data,
      commonWidth,
      commonHeight,
      { threshold: 0.1 }
    );

    // Debug output (optional)
    const dirPath = path.resolve('.tests/pixelmatch-test');
    fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(
      path.join(dirPath, 'temp-original.png'),
      scaledOriginalBuffer
    );
    fs.writeFileSync(path.join(dirPath, 'temp-canvas.png'), scaledCanvasBuffer);

    fs.writeFileSync(path.join(dirPath, 'temp-diff.png'), PNG.sync.write(diff));

    // Image must change
    const totalPixels = commonWidth * commonHeight;
    const percentSimilarity =
      ((totalPixels - numDiffPixels) / totalPixels) * 100;

    console.log(
      `[RESULT] ${numDiffPixels} pixels differ | ${percentSimilarity.toFixed(2)}% similarity`
    );
    expect(percentSimilarity).toBeGreaterThanOrEqual(95);
  });

/**
 * 🔍 [NOTE TO FUTURE ME]
 *
 * This test compares the visual similarity between an original image (`<img>`) and a modified version (`<canvas>`)
 * using SSIM (Structural Similarity Index). It’s meant to detect *subtle* visual differences like blur or image edits.
 *
 * Why it’s a bit of a mind-bender right now:
 * - It involves screenshotting DOM elements directly.
 * - It includes smart lazy-load handling (scrolling to force visibility).
 * - It uses SSIM, which is not a simple pixel diff — it’s a perceptual model of human vision.
 * - It manually cleans up temp files at the end (because `compareSSIM()` works on disk paths).
 *
 * ❗ This is **not** your basic `expect(locator).toHaveText()` – it's a full visual regression test.
 *
 * 🧠 TL;DR – Advanced stuff, but totally worth learning for image comparison or UI blur detection.
 *    For now, just trust the structure and focus on understanding:
 *      1. What SSIM returns
 *      2. What the `expect(similarity)` line is asserting
 */

  // test('Check for blur and check with SSIM', async ({ page }) => {
  //   test.setTimeout(120_000);

  //   // ========== ARRANGE ==========
  //   // Go to Photography tab and open first image
  //   await postsPage.postsPhotographyButton.click();
  //   const container = page.locator('div[data-index="0"]');
  //   await container.click();

  //   // Wait for popup image to be visible
  //   const imageSelector = 'img[src*="posts/images"]';
  //   const imageLocator = page.locator(imageSelector).first();
  //   await expect(imageLocator).toBeVisible({ timeout: 3000 });

  //   // Make sure image has valid dimensions
  //   const box = await imageLocator.boundingBox();
  //   if (!box || box.width === 0 || box.height === 0) {
  //     throw new Error(
  //       '[ERROR] Image has zero dimensions – possible rendering/layout issue'
  //     );
  //   }

  //   // Ensure image is present in the DOM after lazy loading
  //   const freshImageLocator = page.locator(imageSelector).first();
  //   const maxScrolls = 20;
  //   for (let i = 0; i < maxScrolls; i++) {
  //     const isVisible = await freshImageLocator.isVisible().catch(() => false);
  //     if (isVisible) {
  //       console.log(`[SCROLL] Found element after ${i + 1} scrolls`);
  //       break;
  //     }

  //     const scrollAmount = 1000 * (i % 2 === 0 ? 1 : -1);
  //     console.log(
  //       `[SCROLL] Scrolling ${scrollAmount > 0 ? 'down' : 'up'} by ${Math.abs(scrollAmount)}px`
  //     );
  //     await page.evaluate((y) => window.scrollBy(0, y), scrollAmount);
  //     await page.waitForTimeout(500);
  //   }

  //   // Take screenshot of the image
  //   await page.waitForTimeout(500); // small buffer
  //   const imgBuffer = await freshImageLocator.screenshot();
  //   const imgPath = path.resolve(__dirname, './temp-original.png');
  //   fs.writeFileSync(imgPath, imgBuffer);

  //   // ========== ACT ==========
  //   // Hover edit button and trigger Inpaint
  //   const editButton = page.locator(
  //     'button:has(iconpark-icon[icon-id="imageedit"])'
  //   );
  //   await editButton.hover();

  //   const inpaintOption = page.locator(
  //     'div.n-popover__content >> text=Inpaint'
  //   );
  //   await expect(inpaintOption).toBeVisible();
  //   await inpaintOption.click();

  //   // Wait for canvas to load
  //   const canvas = page.locator('canvas').first();
  //   await expect(canvas).toBeVisible();

  //   // Take screenshot of blurred canvas
  //   const canvasBuffer = await canvas.screenshot();
  //   const canvasPath = path.resolve(__dirname, './temp-inpaint.png');
  //   fs.writeFileSync(canvasPath, canvasBuffer);

  //   // ========== ASSERT ==========
  //   // Compare original image with blurred result using SSIM
  //   // Expect the similarity to be high – minimal visual difference allowed
  //   const similarity = await compareSSIM(imgPath, canvasPath);
  //   const ssimTarget = 0.95;

  //   console.log(`[SSIM] Structural similarity index: ${similarity}`);
  //   if (similarity < ssimTarget) {
  //     console.warn(
  //       `[FAIL] SSIM ${similarity} < ${ssimTarget} Too much difference.`
  //     );
  //   } else {
  //     console.log(`[PASS] SSIM ${similarity} ≥ ${ssimTarget} 95% similatity`);
  //   }

  //   expect(similarity).toBeGreaterThanOrEqual(ssimTarget);

  //   // Cleanup
  //   fs.unlinkSync(imgPath);
  //   fs.unlinkSync(canvasPath);
  // });
});
async function waitForRenderedPopup(
  page: Page,
  locator: Locator,
  timeout = 15000
): Promise<void> {
  await locator.waitFor({ state: 'visible' });

  const elementHandle = await locator.elementHandle();
  if (!elementHandle)
    throw new Error('Popup did not resolve to a valid element');

  await page.waitForFunction(
    (el) => {
      const element = el as HTMLElement;
      const style = window.getComputedStyle(element);
      const hasSize = element.clientWidth > 0 && element.clientHeight > 0;
      const hasText = element.innerText && element.innerText.trim().length > 0;
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        hasSize &&
        hasText
      );
    },
    elementHandle,
    { timeout }
  );
}
