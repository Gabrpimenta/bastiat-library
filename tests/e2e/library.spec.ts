import { test, expect, type Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/profile');
  await page.getByLabel('Email').fill(process.env.SEED_STUDENT_EMAIL ?? 'reader@bastiat.local');
  await page.getByLabel('Password').fill(process.env.SEED_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
}
test('catalog, search, saved reading and responsive navigation', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Look beyond/ })).toBeVisible();
  await page.getByRole('link', { name: 'Explore the course' }).click();
  await expect(
    page.getByRole('heading', { name: 'The Seen and the Unseen', exact: true }),
  ).toBeVisible();
  await page.goto('/explore');
  await page.getByRole('searchbox').fill('cooperation');
  await expect(page.getByRole('heading', { name: 'Trade and cooperation' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The broken window' })).not.toBeVisible();
  await page.getByRole('button', { name: 'Save Trade and cooperation' }).click();
  await page.goto('/library');
  await page.getByRole('button', { name: 'Saved for later' }).click();
  await expect(page.getByRole('heading', { name: 'Trade and cooperation' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect(errors).toEqual([]);
});
test('real audio playback persists and resumes in a second authenticated browser', async ({
  browser,
  page,
}) => {
  await login(page);
  await page.goto('/lesson/the-broken-window');
  await page.getByRole('button', { name: 'Play lesson', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause lesson', exact: true })).toBeVisible();
  const seek = page.getByLabel('Playback position');
  await seek.focus();
  await seek.press('Home');
  for (let i = 0; i < 12; i++) await seek.press('ArrowRight');
  await page.getByRole('button', { name: 'Pause lesson', exact: true }).click();
  const position = Number(await seek.inputValue());
  expect(position).toBeGreaterThan(10);
  await expect
    .poll(async () => {
      const response = await page.request.get('/api/v1/library', {
        headers: { Origin: 'http://localhost:3000' },
      });
      const data = await response.json();
      return data.progress.find(
        (item: { lessonSlug: string }) => item.lessonSlug === 'the-broken-window',
      )?.positionSeconds;
    })
    .toBeCloseTo(position, 0);
  const second = await browser.newContext();
  const next = await second.newPage();
  await login(next);
  await next.goto('/lesson/the-broken-window');
  await expect
    .poll(async () =>
      Math.abs(Number(await next.getByLabel('Playback position').inputValue()) - position),
    )
    .toBeLessThanOrEqual(2);
  await next.goto('/profile');
  await next.getByRole('button', { name: 'Sign out' }).click();
  await expect(next.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  await second.close();
});
test('video renders frames, pauses and can be opened again after navigation', async ({ page }) => {
  await page.goto('/lesson/thinking-in-alternatives');
  await page.getByRole('button', { name: 'Play lesson', exact: true }).click();
  await expect
    .poll(() => page.locator('video').evaluate((video: HTMLVideoElement) => video.videoWidth))
    .toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Pause lesson', exact: true }).click();
  await page.getByRole('link', { name: 'The Seen and the Unseen', exact: true }).click();
  await page.goto('/lesson/thinking-in-alternatives');
  await page.getByRole('button', { name: 'Play lesson', exact: true }).click();
  await expect
    .poll(() => page.locator('video').evaluate((video: HTMLVideoElement) => video.currentTime))
    .toBeGreaterThan(0.2);
});
