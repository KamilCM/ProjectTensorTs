import { Page, Locator, expect, ElementHandle } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly backToHomeButton: Locator;
  readonly homePageButton: Locator;
  readonly homeLogo: Locator;
  readonly postsButton: Locator;
  maxRetries = 10;

  constructor(page: Page) {
    this.page = page;
    this.backToHomeButton = page.locator(
      'button.vi-button--type-secondary:has(div.vi-button__wrap)'
    );
    this.homePageButton = page.locator('img[alt="Tensor.Art"]').first();
    this.postsButton = page.locator('a[href="/posts"]');
  }

  async clickBackToHome() {
    await this.backToHomeButton.click();
  }

  async getVisibleHomeLogo(): Promise<ElementHandle<Element> | undefined> {
    for (let i = 0; i < this.maxRetries; i++) {
      console.log(`[Try ${i + 1}] Force rendering image and layout...`);
      console.log('[DEBUG] Current page URL:', await this.page.url());

      const logos = this.page.locator('img[alt="Tensor.Art"]');
      const count = await logos.count();

      const validCandidates: ElementHandle<Element>[] = [];

      for (let j = 0; j < count; j++) {
        const candidate = logos.nth(j);

        const isValid = await candidate
          .evaluate((el) => {
            if (!(el instanceof HTMLImageElement)) return false;
            const rect = el.getBoundingClientRect();
            return el.complete && el.offsetParent !== null && rect.width > 0;
          })
          .catch(() => false);

        if (isValid) {
          const elHandle = await candidate.elementHandle();
          if (elHandle) {
            validCandidates.push(elHandle);
          }
        }
      }

      if (validCandidates.length > 0) {
        const randomIndex = Math.floor(Math.random() * validCandidates.length);
        const chosen = validCandidates[randomIndex];
        console.log(
          `[Try ${i + 1}] Randomly selected visible logo at index ${randomIndex}`
        );

        const debugInfo = await this.page.evaluate((el) => {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return {
            style: {
              display: style.display,
              visibility: style.visibility,
              opacity: style.opacity,
            },
            rect: {
              width: rect.width,
              height: rect.height,
            },
            outerHTML: el.outerHTML,
          };
        }, chosen);

        // console.log(`[Try ${i + 1}] [DEBUG] Selected Element Info:`, debugInfo);

        return chosen;
      }

      console.log(
        `[Try ${i + 1}] No matching logos found. Waiting and retrying...`
      );
      await this.page.waitForTimeout(300);
    }

    console.warn(
      `[FAILED] Tensor.Art logo was not visible after ${this.maxRetries} attempts.`
    );
    return undefined;
  }

  async forceGoToHome(maxRetries = 10): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      const isActuallyVisible = await this.page.evaluate(() => {
        const el = document.querySelector('img[alt="Tensor.Art"]');
        if (!el) return false;
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          +style.opacity !== 0 &&
          rect.width > 0 &&
          rect.height > 0
        );
      });

      if (isActuallyVisible) {
        console.log(`Tensor.Art logo is visible (attempt ${i + 1})`);
        expect(true).toBe(true);
        return;
      }

      const backExists = await this.backToHomeButton
        .isVisible()
        .catch(() => false);
      if (!backExists) {
        console.log(`Back to Home disappeared - assuming homepage is loaded.`);
        expect(true).toBe(true);
        return;
      }

      console.log(`[Try ${i + 1}] Clicking 'Back to Home'...`);
      try {
        await this.backToHomeButton.click();
      } catch (e) {
        console.warn(`[Try ${i + 1}] Cannot click: ${e.message}`);
      }

      await this.page.waitForTimeout(3000);
    }

    console.error('Max retries reached. Still no homepage.');
    expect(false).toBe(true);
  }
}
