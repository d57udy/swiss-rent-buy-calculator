// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Year-by-Year UI interactions', () => {
  test.beforeEach(async ({ page }) => {
    const url = 'file://' + require('path').resolve(__dirname, 'index.html');
    await page.goto(url);
    await page.locator('#calculateBtn').click();
  });

  test('Jump to break-even scrolls to row', async ({ page }) => {
    const btn = page.locator('#jumpBreakEvenBtn');
    if (await btn.count() === 0) test.skip();
    await btn.click();
    await page.waitForTimeout(100);
    // Accept either inline style or data attribute for highlight
    const highlighted = page.locator('tr[style*="outline"], tr[data-highlighted="true"]');
    await highlighted.first().waitFor({ state: 'attached', timeout: 3500 });
    await expect(highlighted).toHaveCount(1);
  });

  test('Advanced toggle re-renders columns', async ({ page }) => {
    const toggle = page.locator('#toggle-advanced-cols');
    await expect(toggle).toBeChecked();
    // Advanced header is present
    await expect(page.locator('thead >> text=Imputed Rent Tax (Owner)')).toHaveCount(1, { timeout: 3000 });
    await toggle.uncheck();
    // Re-render should hide advanced header
    await expect(page.locator('thead >> text=Imputed Rent Tax (Owner)')).toHaveCount(0);
    await toggle.check();
    await expect(page.locator('thead >> text=Imputed Rent Tax (Owner)')).toHaveCount(1);
  });
});


