// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Console Error Detection', () => {
  let consoleErrors = [];
  let consoleWarnings = [];

  test.beforeEach(async ({ page }) => {
    // Reset error collections
    consoleErrors = [];
    consoleWarnings = [];

    // Listen for console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push({
          type: 'error',
          text: msg.text(),
          location: msg.location()
        });
      } else if (msg.type() === 'warning') {
        consoleWarnings.push({
          type: 'warning', 
          text: msg.text(),
          location: msg.location()
        });
      }
    });

    // Listen for page errors
    page.on('pageerror', error => {
      consoleErrors.push({
        type: 'pageerror',
        text: error.message,
        stack: error.stack
      });
    });

    // Navigate to the application
    const url = 'file://' + require('path').resolve(__dirname, 'index.html');
    await page.goto(url);
  });

  test('No console errors on initial page load', async ({ page }) => {
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Filter out known acceptable warnings (if any)
    const criticalErrors = consoleErrors.filter(error => {
      // Filter out non-critical errors that might be acceptable
      return !error.text.includes('favicon.ico') && // Favicon missing is not critical
             !error.text.includes('DevTools'); // DevTools warnings are not critical
    });

    if (criticalErrors.length > 0) {
      console.log('Console errors detected:', criticalErrors);
    }

    expect(criticalErrors).toHaveLength(0);
  });

  test('No console errors during basic UI interactions', async ({ page }) => {
    // Perform basic UI interactions that should not generate errors
    
    // 1. Click calculate button
    await page.locator('#calculateBtn').click();
    await page.waitForTimeout(500);
    
    // 2. Change some input values (only if enabled)
    const purchasePriceField = page.locator('#purchasePrice');
    if (await purchasePriceField.isEnabled()) {
      await purchasePriceField.fill('1500000');
    }
    
    const downPaymentField = page.locator('#downPayment');
    if (await downPaymentField.isEnabled()) {
      await downPaymentField.fill('300000');
    }
    
    const monthlyRentField = page.locator('#monthlyRent');
    if (await monthlyRentField.isEnabled()) {
      await monthlyRentField.fill('4000');
    }
    
    // 3. Calculate again
    await page.locator('#calculateBtn').click();
    await page.waitForTimeout(500);
    
    // 4. Try different scenario modes if selector exists
    const scenarioModeSelect = page.locator('#scenarioMode');
    if (await scenarioModeSelect.count() > 0) {
      const scenarioModes = ['equalConsumption', 'cashflowParity', 'equalSavings'];
      for (const mode of scenarioModes) {
        await scenarioModeSelect.selectOption(mode);
        await page.locator('#calculateBtn').click();
        await page.waitForTimeout(300);
      }
    }

    // 5. Toggle advanced columns if available
    const advancedToggle = page.locator('#toggle-advanced-cols');
    if (await advancedToggle.count() > 0) {
      await advancedToggle.click();
      await page.waitForTimeout(200);
      await advancedToggle.click();
      await page.waitForTimeout(200);
    }

    // 6. Try tax system toggle if available
    const currentTaxRadio = page.locator('input[name="taxSystem"][value="current"]');
    const postReformTaxRadio = page.locator('input[name="taxSystem"][value="postReform"]');
    
    if (await currentTaxRadio.count() > 0 && await postReformTaxRadio.count() > 0) {
      await postReformTaxRadio.click();
      await page.locator('#calculateBtn').click();
      await page.waitForTimeout(300);
      
      await currentTaxRadio.click();
      await page.locator('#calculateBtn').click();
      await page.waitForTimeout(300);
    }

    // Filter out non-critical errors
    const criticalErrors = consoleErrors.filter(error => {
      return !error.text.includes('favicon.ico') &&
             !error.text.includes('DevTools') &&
             !error.text.includes('Extension');
    });

    if (criticalErrors.length > 0) {
      console.log('Console errors during UI interactions:', criticalErrors);
    }

    expect(criticalErrors).toHaveLength(0);
  });

  test('No console errors during chart interactions', async ({ page }) => {
    // First calculate to generate data for chart
    await page.locator('#calculateBtn').click();
    await page.waitForTimeout(500);

    // Try to interact with chart if present
    const chartToggle = page.locator('#chartToggle');
    if (await chartToggle.count() > 0) {
      // Expand chart section
      await chartToggle.click();
      await page.waitForTimeout(500);
      
      // Look for chart controls and interact with them
      const chartCanvas = page.locator('#chart');
      if (await chartCanvas.count() > 0) {
        // Wait for chart to render
        await page.waitForTimeout(1000);
        
        // Try chart control interactions
        const resetZoomBtn = page.locator('#resetZoom');
        if (await resetZoomBtn.count() > 0) {
          await resetZoomBtn.click();
          await page.waitForTimeout(200);
        }
        
        const exportBtn = page.locator('#exportChart');
        if (await exportBtn.count() > 0) {
          await exportBtn.click();
          await page.waitForTimeout(200);
        }
      }
    }

    // Filter out non-critical errors
    const criticalErrors = consoleErrors.filter(error => {
      return !error.text.includes('favicon.ico') &&
             !error.text.includes('DevTools') &&
             !error.text.includes('Extension');
    });

    if (criticalErrors.length > 0) {
      console.log('Console errors during chart interactions:', criticalErrors);
    }

    expect(criticalErrors).toHaveLength(0);
  });

  test('Report console warnings (informational)', async ({ page }) => {
    // Perform some interactions to generate potential warnings
    await page.locator('#calculateBtn').click();
    await page.waitForTimeout(500);
    
    // This test doesn't fail on warnings, just reports them
    if (consoleWarnings.length > 0) {
      console.log('Console warnings detected (for information):', consoleWarnings);
    }
    
    // Always pass - this is just for monitoring
    expect(true).toBe(true);
  });
});