
import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://tensor.art/');
  await page.getByRole('button', { name: 'Back to Home' }).click();
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