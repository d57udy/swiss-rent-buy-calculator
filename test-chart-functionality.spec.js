/**
 * Playwright Tests for Chart Functionality
 * 
 * Tests the interactive chart feature of the Swiss Rent vs Buy Calculator
 * including chart visualization, controls, and state persistence
 * 
 * @version 1.0.0
 */

const { test, expect } = require('@playwright/test');

test.describe('Chart Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the calculator
    await page.goto('file://' + __dirname + '/index.html');
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    
    // Wait for scripts to load
    await page.waitForTimeout(2000);
  });

  test('Chart section exists and is initially expanded', async ({ page }) => {
    // Check chart header exists and has correct text
    const chartHeader = await page.locator('[data-target="section-chart"]');
    await expect(chartHeader).toBeVisible();
    await expect(chartHeader).toContainText('📈 Interactive Chart');
    
    // Check that chart section exists and is initially expanded
    const chartSection = await page.locator('#section-chart');
    await expect(chartSection).toBeVisible();
  });

  test('Chart section can be expanded and collapsed', async ({ page }) => {
    const chartHeader = await page.locator('[data-target="section-chart"]');
    const chartSection = await page.locator('#section-chart');
    
    // Initially expanded
    await expect(chartSection).toBeVisible();
    
    // Click to collapse
    await chartHeader.click();
    await expect(chartSection).not.toBeVisible();
    
    // Click to expand again
    await chartHeader.click();
    await expect(chartSection).toBeVisible();
  });

  test('Chart controls are present and functional', async ({ page }) => {
    // Chart section should already be expanded by default
    // Check line toggle controls exist
    const cumBuyCostToggle = await page.locator('#toggle-cumBuyCost');
    const cumRentCostToggle = await page.locator('#toggle-cumRentCost');
    const advantageToggle = await page.locator('#toggle-advantage');
    const propertyValueToggle = await page.locator('#toggle-propertyValue');
    const portfolioToggle = await page.locator('#toggle-portfolioEnd');
    
    await expect(cumBuyCostToggle).toBeVisible();
    await expect(cumRentCostToggle).toBeVisible();
    await expect(advantageToggle).toBeVisible();
    await expect(propertyValueToggle).toBeVisible();
    await expect(portfolioToggle).toBeVisible();
    
    // Check default states (cumBuyCost and cumRentCost should be checked)
    await expect(cumBuyCostToggle).toBeChecked();
    await expect(cumRentCostToggle).toBeChecked();
    await expect(advantageToggle).not.toBeChecked();
    
    // Check action buttons exist
    const resetZoomBtn = await page.locator('#resetZoom');
    const exportBtn = await page.locator('#exportChart');
    
    await expect(resetZoomBtn).toBeVisible();
    await expect(exportBtn).toBeVisible();
  });

  test('Chart canvas exists and initializes', async ({ page }) => {
    // Chart section should already be expanded by default
    // Check chart canvas exists
    const canvas = await page.locator('#financialChart');
    await expect(canvas).toBeVisible();
    
    // Wait a moment for chart to initialize
    await page.waitForTimeout(1000);
    
    // Verify chart manager exists
    const chartManagerExists = await page.evaluate(() => {
      return typeof window.swissChartManager !== 'undefined';
    });
    expect(chartManagerExists).toBe(true);
  });

  test('Chart updates after calculation', async ({ page }) => {
    // Set some test parameters
    await page.fill('#purchasePrice', '2000000');
    await page.fill('#monthlyRent', '5000');
    await page.fill('#mortgageRate', '1.5');
    await page.fill('#termYears', '10');
    
    // Run calculation
    await page.click('#calculateBtn');
    
    // Wait for calculation to complete - look for any result content
    await page.waitForTimeout(3000);
    
    // Expand chart section
    await page.locator('[data-target="section-chart"]').click();
    
    // Wait for chart to potentially update
    await page.waitForTimeout(2000);
    
    // Verify chart manager has been initialized and has data
    const chartStatus = await page.evaluate(() => {
      return {
        managerExists: typeof window.swissChartManager !== 'undefined',
        hasChart: window.swissChartManager && window.swissChartManager.chart !== null,
        hasData: window.swissChartManager && window.swissChartManager.chartData && 
                 window.swissChartManager.chartData.labels && 
                 window.swissChartManager.chartData.labels.length > 0
      };
    });
    expect(chartStatus.managerExists).toBe(true);
    expect(chartStatus.hasChart).toBe(true);
    expect(chartStatus.hasData).toBe(true);
  });

  test('Line toggles can be interacted with', async ({ page }) => {
    // Chart section should already be expanded
    
    // Wait for elements to be visible
    await page.waitForTimeout(500);
    
    // Test checkbox interactions
    const advantageToggle = page.locator('#toggle-advantage');
    const cumBuyCostToggle = page.locator('#toggle-cumBuyCost');
    
    // Initially advantage should be unchecked, cumBuyCost should be checked
    await expect(advantageToggle).not.toBeChecked();
    await expect(cumBuyCostToggle).toBeChecked();
    
    // Toggle advantage on
    await advantageToggle.check();
    await expect(advantageToggle).toBeChecked();
    
    // Toggle cumBuyCost off
    await cumBuyCostToggle.uncheck();
    await expect(cumBuyCostToggle).not.toBeChecked();
    
    // Toggle cumBuyCost back on
    await cumBuyCostToggle.check();
    await expect(cumBuyCostToggle).toBeChecked();
  });

  test('Reset zoom button is clickable', async ({ page }) => {
    // Scroll to chart section (already expanded by default)
    await page.locator('#section-chart').scrollIntoViewIfNeeded();
    await page.locator('#resetZoom').scrollIntoViewIfNeeded();
    
    // Wait for elements to be visible
    await page.waitForTimeout(1000);
    
    // Check that reset zoom button exists and is clickable
    const resetZoomBtn = page.locator('#resetZoom');
    await expect(resetZoomBtn).toHaveCount(1);
    
    // Verify button is visible and click it
    await expect(resetZoomBtn).toBeVisible();
    await resetZoomBtn.click();
  });

  test('Export chart button is clickable', async ({ page }) => {
    // Scroll to chart section (already expanded by default)
    await page.locator('#section-chart').scrollIntoViewIfNeeded();
    await page.locator('#exportChart').scrollIntoViewIfNeeded();
    
    // Wait for elements to be visible
    await page.waitForTimeout(1000);
    
    // Check that export button exists and is clickable
    const exportBtn = page.locator('#exportChart');
    await expect(exportBtn).toHaveCount(1);
    
    // Note: We won't test actual download due to complexity,
    // but we verify the button is visible and enabled
    await expect(exportBtn).toBeVisible();
    await expect(exportBtn).toBeEnabled();
  });

  test('Chart settings interface works', async ({ page }) => {
    // Scroll to chart section (already expanded by default)
    await page.locator('#section-chart').scrollIntoViewIfNeeded();
    await page.locator('#toggle-advantage').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    
    // Test toggling various checkboxes
    const advantageCheckbox = page.locator('#toggle-advantage');
    await expect(advantageCheckbox).toBeVisible();
    await advantageCheckbox.check();
    
    const rentCheckbox = page.locator('#toggle-cumRentCost');
    await expect(rentCheckbox).toBeVisible();
    await rentCheckbox.uncheck();
    
    // Verify checkbox states
    await expect(page.locator('#toggle-advantage')).toBeChecked();
    await expect(page.locator('#toggle-cumRentCost')).not.toBeChecked();
    
    // Test that settings can be accessed (if chart manager exists)
    const hasSettingsAccess = await page.evaluate(() => {
      return typeof window.SwissChartManager !== 'undefined' && 
             typeof window.SwissChartManager.getSettings === 'function';
    });
    expect(hasSettingsAccess).toBe(true);
  });

  test('Chart works with different calculation modes', async ({ page }) => {
    // Test equal consumption mode
    await page.check('input[name="scenarioMode"][value="equalConsumption"]');
    await page.fill('#purchasePrice', '1600000');
    await page.click('#calculateBtn');
    await page.waitForTimeout(2000);
    
    // Test cash flow parity mode  
    await page.check('input[name="scenarioMode"][value="cashflowParity"]');
    await page.click('#calculateBtn');
    await page.waitForTimeout(2000);
    
    // Verify both calculations completed without error
    // and chart header is still present
    const chartHeader = page.locator('[data-target="section-chart"]');
    await expect(chartHeader).toBeVisible();
    await expect(chartHeader).toContainText('📈 Interactive Chart');
  });

  test('Chart accessibility and usability', async ({ page }) => {
    // Scroll to chart section (already expanded by default)
    await page.locator('#section-chart').scrollIntoViewIfNeeded();
    
    // Wait for chart to be ready
    await page.waitForTimeout(500);
    
    // Check for accessibility labels
    const canvas = await page.locator('#financialChart');
    await expect(canvas).toHaveCount(1);
    
    // Check helper text is present
    const helperText = await page.locator('text=Drag to pan • Scroll/pinch to zoom • Click legend to toggle lines');
    await expect(helperText).toBeVisible();
    
    // Check that controls are keyboard accessible
    const cumBuyCostToggle = await page.locator('#toggle-cumBuyCost');
    await cumBuyCostToggle.focus();
    await page.keyboard.press('Space');
    await expect(cumBuyCostToggle).not.toBeChecked();
    
    // Return to checked state
    await page.keyboard.press('Space');
    await expect(cumBuyCostToggle).toBeChecked();
  });

  test('Chart handles longer calculation periods', async ({ page }) => {
    // Set a longer term
    await page.fill('#termYears', '20');
    await page.fill('#purchasePrice', '2500000');
    await page.click('#calculateBtn');
    await page.waitForTimeout(3000);
    
    // Verify chart header is still present after longer calculation
    const chartHeader = page.locator('[data-target="section-chart"]');
    await expect(chartHeader).toBeVisible();
    
    // Test that we can click the chart header (expand action)
    await chartHeader.click();
    await page.waitForTimeout(1000);
    
    // Verify canvas exists in the DOM (regardless of visibility)
    const canvas = page.locator('#financialChart');
    await expect(canvas).toHaveCount(1);
  });

  test('Chart displays actual calculation data', async ({ page }) => {
    // Run a calculation with known parameters
    await page.fill('#purchasePrice', '1500000');
    await page.fill('#monthlyRent', '4000');
    await page.fill('#termYears', '10');
    await page.click('#calculateBtn');
    await page.waitForTimeout(3000);
    
    // Verify chart has the expected number of data points
    const chartData = await page.evaluate(() => {
      if (!window.swissChartManager || !window.swissChartManager.chartData) {
        return null;
      }
      return {
        labelCount: window.swissChartManager.chartData.labels.length,
        hasData: window.swissChartManager.chartData.datasets.cumBuyCost.length > 0 &&
                 window.swissChartManager.chartData.datasets.cumRentCost.length > 0,
        sampleData: {
          firstYear: window.swissChartManager.chartData.datasets.cumBuyCost[0],
          lastYear: window.swissChartManager.chartData.datasets.cumBuyCost[9]
        }
      };
    });
    
    expect(chartData).not.toBeNull();
    expect(chartData.labelCount).toBe(10); // Should match termYears
    expect(chartData.hasData).toBe(true);
    expect(chartData.sampleData.firstYear).not.toBe(chartData.sampleData.lastYear); // Data should change over time
  });
});