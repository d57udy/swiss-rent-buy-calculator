/**
 * Test single scenario against moneyland.ch
 */

const { chromium } = require('playwright');

async function testMoneylandSingle() {
    console.log('🌐 TESTING MONEYLAND.CH CALCULATOR...');
    console.log('─'.repeat(50));
    
    // Test parameters
    const params = {
        purchasePrice: 1618098,
        downPayment: 635552,
        mortgageRate: 1.65,
        monthlyRent: 663,
        annualMaintenanceCosts: 20630,
        termYears: 13
    };
    
    console.log('Using parameters:');
    console.log(`Purchase Price: CHF ${params.purchasePrice.toLocaleString()}`);
    console.log(`Down Payment: CHF ${params.downPayment.toLocaleString()}`);
    console.log(`Mortgage Rate: ${params.mortgageRate}%`);
    console.log(`Monthly Rent: CHF ${params.monthlyRent.toLocaleString()}`);
    console.log(`Annual Maintenance: CHF ${params.annualMaintenanceCosts.toLocaleString()}`);
    console.log(`Term: ${params.termYears} years`);
    console.log('');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        // Navigate to moneyland.ch
        console.log('📡 Navigating to moneyland.ch...');
        await page.goto('https://www.moneyland.ch/en/rent-or-buy-calculator');
        await page.waitForLoadState('networkidle');
        
        // Accept cookies if present
        try {
            await page.click('button:has-text("I Accept")', { timeout: 5000 });
            await page.waitForTimeout(1000);
        } catch (e) {
            console.log('No cookie banner found');
        }
        
        console.log('🔍 Analyzing page structure...');
        
        // Take initial screenshot
        await page.screenshot({ path: 'moneyland-initial.png', fullPage: true });
        console.log('Initial screenshot: moneyland-initial.png');
        
        // Try to find input fields
        const inputs = await page.$$('input');
        console.log(`Found ${inputs.length} input fields`);
        
        // Get the page content to understand structure
        const pageText = await page.textContent('body');
        const hasCalculator = pageText.includes('Purchase price') || pageText.includes('Down-payment');
        console.log(`Calculator form detected: ${hasCalculator}`);
        
        if (hasCalculator) {
            console.log('🖊️ Attempting to fill form...');
            
            // Try different approaches to fill the form
            const selectors = [
                // Various possible selectors for the fields
                { field: 'purchase', selectors: ['input[data-testid*="purchase"]', 'input[id*="purchase"]', 'input[name*="purchase"]'] },
                { field: 'down', selectors: ['input[data-testid*="down"]', 'input[id*="down"]', 'input[name*="down"]'] },
                { field: 'rate', selectors: ['input[data-testid*="rate"]', 'input[id*="rate"]', 'input[name*="rate"]'] },
                { field: 'maintenance', selectors: ['input[data-testid*="maintenance"]', 'input[id*="maintenance"]', 'input[name*="maintenance"]'] },
                { field: 'rent', selectors: ['input[data-testid*="rent"]', 'input[id*="rent"]', 'input[name*="rent"]'] }
            ];
            
            const values = [
                params.purchasePrice.toString(),
                params.downPayment.toString(),
                params.mortgageRate.toString(),
                params.annualMaintenanceCosts.toString(),
                params.monthlyRent.toString()
            ];
            
            // Try to fill inputs by order if specific selectors don't work
            const allInputs = await page.$$('input[type="text"], input[type="number"], input:not([type])');
            console.log(`Found ${allInputs.length} text/number inputs`);
            
            if (allInputs.length >= 5) {
                for (let i = 0; i < Math.min(5, allInputs.length); i++) {
                    try {
                        await allInputs[i].fill(values[i]);
                        console.log(`Filled input ${i + 1} with ${values[i]}`);
                    } catch (e) {
                        console.log(`Could not fill input ${i + 1}: ${e.message}`);
                    }
                }
            }
            
            // Try to set term
            try {
                const termSelect = await page.$('select');
                if (termSelect) {
                    await termSelect.selectOption(`${params.termYears} years`);
                    console.log(`Set term to ${params.termYears} years`);
                }
            } catch (e) {
                console.log('Could not set term');
            }
            
            // Wait for calculations
            await page.waitForTimeout(3000);
            
            // Take screenshot after filling
            await page.screenshot({ path: 'moneyland-filled.png', fullPage: true });
            console.log('Filled screenshot: moneyland-filled.png');
            
            // Try to extract results
            console.log('🔍 Looking for results...');
            const resultText = await page.textContent('body');
            
            // Look for total costs in the page
            const purchaseCostMatch = resultText.match(/Total purchase cost[:\s]*CHF\s*([\d,]+)/i);
            const rentalCostMatch = resultText.match(/Total rental cost[:\s]*CHF\s*([\d,]+)/i);
            
            if (purchaseCostMatch && rentalCostMatch) {
                const purchaseCost = parseFloat(purchaseCostMatch[1].replace(/,/g, ''));
                const rentalCost = parseFloat(rentalCostMatch[1].replace(/,/g, ''));
                const difference = rentalCost - purchaseCost;
                const decision = difference > 0 ? 'BUY' : 'RENT';
                
                console.log('📊 MONEYLAND.CH RESULTS:');
                console.log(`Total Purchase Cost: CHF ${purchaseCost.toLocaleString()}`);
                console.log(`Total Rental Cost: CHF ${rentalCost.toLocaleString()}`);
                console.log(`Result: ${decision} saves CHF ${Math.abs(difference).toLocaleString()}`);
                
                // Compare with local result
                console.log('');
                console.log('📈 COMPARISON:');
                console.log('Local Result:     BUY CHF 149,060');
                console.log(`Moneyland Result: ${decision} CHF ${Math.abs(difference).toLocaleString()}`);
                
                const decisionMatch = decision === 'BUY';
                const valueClose = Math.abs(149060 - Math.abs(difference)) < 100000;
                console.log(`Decision Match: ${decisionMatch ? '✅' : '❌'}`);
                console.log(`Value Close: ${valueClose ? '✅' : '❌'} (within CHF 100,000)`);
                
            } else {
                console.log('❌ Could not extract results from moneyland.ch');
                console.log('Result text preview:', resultText.substring(0, 500));
            }
        }
        
        // Keep browser open for inspection
        console.log('\\n🔍 Browser staying open for 30 seconds for manual inspection...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        
    } catch (error) {
        console.error('Error testing moneyland.ch:', error.message);
        await page.screenshot({ path: 'moneyland-error.png', fullPage: true });
        console.log('Error screenshot: moneyland-error.png');
    } finally {
        await browser.close();
    }
}

if (require.main === module) {
    testMoneylandSingle().catch(console.error);
}

module.exports = { testMoneylandSingle };