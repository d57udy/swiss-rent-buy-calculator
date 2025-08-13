const { test, expect } = require('@playwright/test');

test.describe('Swiss Rent vs Buy Calculator - Parameter Sweep', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the calculator
    await page.goto('file://' + __dirname + '/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('should have correct default parameter sweep values', async ({ page }) => {
    // Switch to Parameter Sweep tab
    await page.click('[data-tab="sweep"]');
    
    // Check default property appreciation values
    await expect(page.locator('#propAppMin')).toHaveValue('-1');
    await expect(page.locator('#propAppMax')).toHaveValue('5');
    await expect(page.locator('#propAppStep')).toHaveValue('1');
    
    // Check default investment yield values
    await expect(page.locator('#invYieldMin')).toHaveValue('-1');
    await expect(page.locator('#invYieldMax')).toHaveValue('8');
    await expect(page.locator('#invYieldStep')).toHaveValue('1');
    
    // Check default mortgage rate values
    await expect(page.locator('#mortRateMin')).toHaveValue('1');
    await expect(page.locator('#mortRateMax')).toHaveValue('5');
    await expect(page.locator('#mortRateStep')).toHaveValue('1');
  });

  test('should run parameter sweep and display maximum bid prices', async ({ page }) => {
    // Switch to Parameter Sweep tab
    await page.click('[data-tab="sweep"]');
    
    // Set smaller ranges for faster testing
    await page.fill('#propAppMin', '0');
    await page.fill('#propAppMax', '2');
    await page.fill('#propAppStep', '1');
    
    await page.fill('#invYieldMin', '2');
    await page.fill('#invYieldMax', '4');
    await page.fill('#invYieldStep', '1');
    
    await page.fill('#mortRateMin', '1');
    await page.fill('#mortRateMax', '3');
    await page.fill('#mortRateStep', '1');
    
    // Run the parameter sweep
    await page.click('#sweepBtn');
    
    // Wait for the calculation to complete (should show results)
    await expect(page.locator('#sweepResults')).toContainText('Maximum Bid Price Analysis', { timeout: 30000 });
    
    // Check that the results contain expected elements
    await expect(page.locator('#sweepResults')).toContainText('Summary Statistics');
    await expect(page.locator('#sweepResults')).toContainText('Average Max Bid');
    await expect(page.locator('#sweepResults')).toContainText('Highest Max Bid');
    await expect(page.locator('#sweepResults')).toContainText('Lowest Max Bid');
    
    // Check that the pivot table is displayed
    await expect(page.locator('#maxBidPivot')).toBeVisible();
    await expect(page.locator('#maxBidPivot table')).toBeVisible();
    
    // Check that the table has the correct structure
    await expect(page.locator('.pivot-table th').first()).toContainText('Mortgage');
    await expect(page.locator('.pivot-table th').nth(2)).toContainText('Property Appreciation');
    
    // Check that bid prices are displayed (should contain 'M' for millions or 'k' for thousands)
    await expect(page.locator('.pivot-table td.bid-price-cell').first()).toContainText(/[Mk]/);
    
    // Check that the download CSV button is visible
    await expect(page.locator('#downloadMaxBidCsvBtn')).toBeVisible();
  });

  test('should handle edge case parameter ranges', async ({ page }) => {
    // Switch to Parameter Sweep tab
    await page.click('[data-tab="sweep"]');
    
    // Set very small range (single values)
    await page.fill('#propAppMin', '1');
    await page.fill('#propAppMax', '1');
    await page.fill('#propAppStep', '1');
    
    await page.fill('#invYieldMin', '3');
    await page.fill('#invYieldMax', '3');
    await page.fill('#invYieldStep', '1');
    
    await page.fill('#mortRateMin', '2');
    await page.fill('#mortRateMax', '2');
    await page.fill('#mortRateStep', '1');
    
    // Run the parameter sweep
    await page.click('#sweepBtn');
    
    // Should complete quickly with just 1 combination
    await expect(page.locator('#sweepResults')).toContainText('1 combination', { timeout: 10000 });
    
    // Should still show valid results
    await expect(page.locator('#maxBidPivot')).toBeVisible();
  });

  test('should show loading state and complete calculation', async ({ page }) => {
    // Switch to Parameter Sweep tab
    await page.click('[data-tab="sweep"]');
    
    // Set moderate ranges
    await page.fill('#propAppMin', '0');
    await page.fill('#propAppMax', '2');
    await page.fill('#propAppStep', '1');
    
    await page.fill('#invYieldMin', '2');
    await page.fill('#invYieldMax', '4');
    await page.fill('#invYieldStep', '1');
    
    await page.fill('#mortRateMin', '1');
    await page.fill('#mortRateMax', '3');
    await page.fill('#mortRateStep', '1');
    
    // Initial state check
    await expect(page.locator('#sweepBtn')).toBeEnabled();
    await expect(page.locator('#sweepBtn')).toContainText('Run Parameter Sweep');
    
    // Run the parameter sweep
    await page.click('#sweepBtn');
    
    // Should show some loading indication (either progress or "Running..." text)
    await expect(page.locator('#sweepResults')).toContainText(/Running parameter sweep|Progress:|Maximum Bid Price Analysis/, { timeout: 5000 });
    
    // Wait for completion
    await expect(page.locator('#sweepResults')).toContainText('Maximum Bid Price Analysis', { timeout: 30000 });
    
    // Button should be re-enabled
    await expect(page.locator('#sweepBtn')).toBeEnabled();
    await expect(page.locator('#sweepBtn')).toContainText('Run Parameter Sweep');
  });

  test('should show color-coded bid price ranges', async ({ page }) => {
    // Switch to Parameter Sweep tab
    await page.click('[data-tab="sweep"]');
    
    // Set small ranges for quick testing
    await page.fill('#propAppMin', '0');
    await page.fill('#propAppMax', '1');
    await page.fill('#propAppStep', '1');
    
    await page.fill('#invYieldMin', '3');
    await page.fill('#invYieldMax', '4');
    await page.fill('#invYieldStep', '1');
    
    await page.fill('#mortRateMin', '2');
    await page.fill('#mortRateMax', '3');
    await page.fill('#mortRateStep', '1');
    
    // Run the parameter sweep
    await page.click('#sweepBtn');
    
    // Wait for results
    await expect(page.locator('#sweepResults')).toContainText('Maximum Bid Price Analysis', { timeout: 30000 });
    
    // Check that color coding explanation is present
    await expect(page.locator('#sweepResults')).toContainText('Color scale');
    await expect(page.locator('#sweepResults')).toContainText('Red');
    await expect(page.locator('#sweepResults')).toContainText('Green');
    
    // Check that table cells have background colors (should have style attributes)
    const cells = page.locator('.pivot-table td[style*="background"]');
    await expect(cells.first()).toBeVisible();
  });

  test('should save and load parameter sweep settings', async ({ page }) => {
    // Switch to Parameter Sweep tab
    await page.click('[data-tab="sweep"]');
    
    // Set custom parameter sweep values
    await page.fill('#propAppMin', '-2');
    await page.fill('#propAppMax', '6');
    await page.fill('#propAppStep', '2');
    
    await page.fill('#invYieldMin', '0');
    await page.fill('#invYieldMax', '10');
    await page.fill('#invYieldStep', '2');
    
    await page.fill('#mortRateMin', '0.5');
    await page.fill('#mortRateMax', '6');
    await page.fill('#mortRateStep', '1.5');
    
    // Save parameters (this will trigger a download, but we'll test the function call)
    await page.click('#saveParametersBtn');
    
    // Check that success message appears
    await expect(page.locator('#saveLoadStatus')).toContainText('Parameters saved successfully!', { timeout: 5000 });
    
    // Reset some values
    await page.fill('#propAppMin', '0');
    await page.fill('#invYieldMin', '1');
    
    // Create a test JSON file content
    const testParameters = {
      version: '2.1.0',
      timestamp: new Date().toISOString(),
      single: {
        purchasePrice: 2000000,
        downPaymentMode: 'auto',
        monthlyRent: 5500
      },
      breakeven: {
        minPrice: 1500000,
        maxPrice: 10000000,
        tolerance: 2500
      },
      sweep: {
        propAppMin: -2,
        propAppMax: 6,
        propAppStep: 2,
        invYieldMin: 0,
        invYieldMax: 10,
        invYieldStep: 2,
        mortRateMin: 0.5,
        mortRateMax: 6,
        mortRateStep: 1.5
      }
    };
    
    // Use JavaScript to call the load function directly
    await page.evaluate((params) => {
      window.loadParameters(params);
    }, testParameters);
    
    // Verify the values were loaded correctly
    await expect(page.locator('#propAppMin')).toHaveValue('-2');
    await expect(page.locator('#propAppMax')).toHaveValue('6');
    await expect(page.locator('#propAppStep')).toHaveValue('2');
    
    await expect(page.locator('#invYieldMin')).toHaveValue('0');
    await expect(page.locator('#invYieldMax')).toHaveValue('10');
    await expect(page.locator('#invYieldStep')).toHaveValue('2');
    
    await expect(page.locator('#mortRateMin')).toHaveValue('0.5');
    await expect(page.locator('#mortRateMax')).toHaveValue('6');
    await expect(page.locator('#mortRateStep')).toHaveValue('1.5');
  });

  test('should export sweep results to CSV', async ({ page }) => {
    // Switch to Parameter Sweep tab
    await page.click('[data-tab="sweep"]');
    
    // Set very small ranges for quick testing
    await page.fill('#propAppMin', '1');
    await page.fill('#propAppMax', '2');
    await page.fill('#propAppStep', '1');
    
    await page.fill('#invYieldMin', '3');
    await page.fill('#invYieldMax', '4');
    await page.fill('#invYieldStep', '1');
    
    await page.fill('#mortRateMin', '2');
    await page.fill('#mortRateMax', '3');
    await page.fill('#mortRateStep', '1');
    
    // Run the parameter sweep
    await page.click('#sweepBtn');
    
    // Wait for completion
    await expect(page.locator('#sweepResults')).toContainText('Maximum Bid Price Analysis', { timeout: 30000 });
    
    // CSV download button should be visible
    await expect(page.locator('#downloadMaxBidCsvBtn')).toBeVisible();
    
    // Setup download listener
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#downloadMaxBidCsvBtn')
    ]);
    
    // Verify the download
    expect(download.suggestedFilename()).toMatch(/max_bid_price_sweep_\d{4}-\d{2}-\d{2}\.csv/);
  });

});