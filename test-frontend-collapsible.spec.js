// Playwright tests: collapsible sections and stale warning
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('file://' + require('path').resolve(__dirname, 'index.html'));
});

test('Collapsible: Year-by-Year toggles full section', async ({ page }) => {
  await page.getByRole('button', { name: 'Calculate' }).click();
  const header = page.locator('.collapsible-header', { hasText: 'Year-by-Year Analysis' });
  const body = page.locator('#section-yyy');
  const table = page.locator('#section-yyy table');
  const buttons = page.locator('#jumpBreakEvenBtn, #downloadYearlyCsvBtn');
  await expect(body).toBeVisible();
  await expect(table).toBeVisible();
  await header.click();
  await expect(body).not.toBeVisible();
  await expect(table).toBeHidden();
  await expect(buttons).toHaveCount(0);
  await header.click();
  await expect(body).toBeVisible();
  await expect(table).toBeVisible();
});

test('Collapsible: Monthly, Purchase, Rent toggle bodies', async ({ page }) => {
  await page.getByRole('button', { name: 'Calculate' }).click();
  const monthHeader = page.locator('.collapsible-header', { hasText: 'Monthly Cash Flow' });
  const monthBody = page.locator('#section-monthly');
  await expect(monthBody).toBeVisible();
  await monthHeader.click();
  await expect(monthBody).not.toBeVisible();
  await monthHeader.click();
  await expect(monthBody).toBeVisible();

  const purchaseHeader = page.locator('.collapsible-header', { hasText: 'Breakdown of purchase costs' });
  const purchaseBody = page.locator('#section-purchase');
  await purchaseHeader.click();
  await expect(purchaseBody).not.toBeVisible();
  await purchaseHeader.click();
  await expect(purchaseBody).toBeVisible();

  const rentHeader = page.locator('.collapsible-header', { hasText: 'Rent' });
  const rentBody = page.locator('#section-rent');
  await rentHeader.click();
  await expect(rentBody).not.toBeVisible();
  await rentHeader.click();
  await expect(rentBody).toBeVisible();
});

test('Stale warning: appears on input change and clears on calculate', async ({ page }) => {
  const stale = page.locator('#staleNotice');
  await expect(stale).toBeHidden();
  await page.fill('#monthlyRent', '5200');
  await expect(stale).toBeVisible();
  await page.getByRole('button', { name: 'Calculate' }).click();
  await expect(stale).toBeHidden();
});


