import { test, expect } from '@playwright/test';

for (const width of [320, 390, 820]) {
  test(`lesson controls remain visible and usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/lesson/the-broken-window');
    const save = page.getByRole('button', { name: 'Save The broken window', exact: true });
    await expect(save).toBeVisible();
    await save.scrollIntoViewIfNeeded();
    const panel = await page.locator('.player-panel').boundingBox();
    const buttons = await page.locator('.player-controls button').all();
    expect(buttons).toHaveLength(5);
    let previousRight = 0;
    for (const button of buttons) {
      const box = await button.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(panel!.x);
      expect(box!.x).toBeGreaterThanOrEqual(previousRight);
      expect(box!.x + box!.width).toBeLessThanOrEqual(panel!.x + panel!.width);
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
      previousRight = box!.x + box!.width;
    }
    await save.click();
    await expect(page.getByRole('button', { name: 'Unsave The broken window' })).toBeVisible();
    await page
      .getByRole('navigation', { name: width <= 760 ? 'Mobile navigation' : 'Main navigation' })
      .getByRole('link', { name: 'My Library' })
      .click();
    await page.getByRole('button', { name: 'Saved for later' }).click();
    await expect(page.getByRole('heading', { name: 'The broken window' })).toBeVisible();
  });
}
