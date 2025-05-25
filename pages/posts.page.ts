import { Page, Locator, expect } from '@playwright/test';

export class PostsPage {
  readonly page: Page;
  readonly postsHeading: Locator;
  readonly postsPhotographyButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.postsHeading = this.page.locator('h1', { hasText: 'Posts' });
    this.postsPhotographyButton = this.page.locator(
      'a[href^="/posts?tag=photography"]',
      { hasText: 'PHOTOGRAPHY' }
    );
  }
}
