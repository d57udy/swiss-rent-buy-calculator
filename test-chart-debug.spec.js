const { test, expect } = require('@playwright/test');

test('Debug Chart.js loading', async ({ page }) => {
  // Listen for console messages and errors
  const logs = [];
  const errors = [];
  page.on('console', msg => logs.push(msg.text()));
  page.on('pageerror', error => errors.push(error.message));
  
  await page.goto('file://' + __dirname + '/index.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  const debug = await page.evaluate(() => {
    return {
      chartJsExists: typeof Chart !== 'undefined',
      chartManagerExists: typeof window.swissChartManager !== 'undefined',
      canvasExists: !!document.getElementById('financialChart'),
      swissChartManagerType: typeof window.SwissChartManager,
      scripts: Array.from(document.scripts).map(s => s.src),
      errors: window.chartInitErrors || []
    };
  });
  
  console.log('Page logs:', logs);
  console.log('Page errors:', errors);
  console.log('Scripts found:', debug.scripts);
  console.log('Debug info:', debug);
  
  expect(debug.chartJsExists).toBe(true);
  expect(debug.chartManagerExists).toBe(true);
  expect(debug.canvasExists).toBe(true);
});