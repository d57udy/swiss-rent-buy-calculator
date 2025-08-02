/**
 * Test Max-Bid Auto-Calculations
 * Verifies that max-bid calculations properly handle automatic parameter adjustments
 * when purchase price changes (maintenance costs, down payment, amortization should scale)
 */

const { chromium } = require('playwright');
const path = require('path');

class MaxBidAutoCalcTester {
    constructor() {
        this.tolerance = 1000; // CHF 1000 tolerance
    }

    /**
     * Test max-bid calculation with auto-parameter scaling
     */
    async testMaxBidAutoCalculations(page, baseParams) {
        console.log('🎯 TESTING MAX-BID AUTO-CALCULATIONS');
        console.log('─'.repeat(60));
        console.log(`Base Purchase Price: CHF ${baseParams.purchasePrice.toLocaleString()}`);
        console.log(`Monthly Rent: CHF ${baseParams.monthlyRent.toLocaleString()}`);
        console.log(`Mortgage Rate: ${baseParams.mortgageRate}%`);
        console.log('');

        // Set up single calculation with auto-calculations enabled
        await page.click('button:has-text("Single Calculation")');
        await page.check('#autoDownPayment');
        await page.check('#autoMaintenance');
        await page.check('#autoAmortization');
        await page.check('#autoImputedRental');

        // Fill base parameters
        await page.fill('#purchasePrice', baseParams.purchasePrice.toString());
        await page.fill('#monthlyRent', baseParams.monthlyRent.toString());
        await page.fill('#mortgageRate', baseParams.mortgageRate.toString());
        await page.fill('#propertyAppreciation', baseParams.propertyAppreciationRate.toString());
        await page.fill('#investmentYield', baseParams.investmentYieldRate.toString());
        await page.fill('#marginalTaxRate', baseParams.marginalTaxRate.toString());
        await page.fill('#termYears', baseParams.termYears.toString());
        await page.fill('#amortizationYears', baseParams.amortizationYears.toString());
        await page.fill('#propertyTaxDeductions', baseParams.propertyTaxDeductions.toString());
        await page.fill('#annualRentalCosts', baseParams.annualRentalCosts.toString());

        // Wait for auto-calculations
        await page.waitForTimeout(1000);

        // Get baseline auto-calculated values
        const baselineAutoCalcs = {
            downPayment: parseFloat(await page.inputValue('#downPayment')),
            maintenance: parseFloat(await page.inputValue('#annualMaintenanceCosts')),
            amortization: parseFloat(await page.inputValue('#annualAmortization')),
            imputedRental: parseFloat(await page.inputValue('#imputedRentalValue'))
        };

        console.log('📊 BASELINE AUTO-CALCULATIONS:');
        console.log(`  Down Payment: CHF ${baselineAutoCalcs.downPayment.toLocaleString()}`);
        console.log(`  Maintenance: CHF ${baselineAutoCalcs.maintenance.toLocaleString()}`);
        console.log(`  Amortization: CHF ${baselineAutoCalcs.amortization.toLocaleString()}`);
        console.log(`  Imputed Rental: CHF ${baselineAutoCalcs.imputedRental.toLocaleString()}`);
        console.log('');

        // Calculate baseline result
        await page.click('button:has-text("Calculate")');
        await page.waitForSelector('#singleResults', { state: 'visible' });
        await page.waitForTimeout(1000);

        const baselineResultContent = await page.textContent('#singleResults');
        let baselineDecision = 'UNKNOWN';
        if (baselineResultContent.includes('Decision: BUY')) {
            baselineDecision = 'BUY';
        } else if (baselineResultContent.includes('Decision: RENT')) {
            baselineDecision = 'RENT';
        }

        console.log(`📈 BASELINE RESULT: ${baselineDecision}`);
        console.log('');

        // Now test max-bid calculation
        console.log('🎯 RUNNING MAX-BID CALCULATION...');
        await page.click('button:has-text("Find Max Bid Price")');
        await page.waitForTimeout(3000); // Allow time for calculation

        // Check for results
        const breakevenContent = await page.textContent('#breakevenResults');
        
        // Extract breakeven price from results
        const priceMatch = breakevenContent.match(/CHF\s*([\d,]+)/);
        const breakevenPrice = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : null;

        if (breakevenPrice) {
            console.log(`💰 BREAKEVEN PRICE FOUND: CHF ${breakevenPrice.toLocaleString()}`);
            console.log('');

            // Calculate expected auto-calculations for breakeven price
            const expectedAutoCalcsAtBreakeven = {
                downPayment: Math.round(breakevenPrice * 0.2),
                maintenance: Math.round(breakevenPrice * 0.0125),
                amortization: Math.round((breakevenPrice * 0.8) / baseParams.amortizationYears),
                imputedRental: Math.round(baseParams.monthlyRent * 12 * 0.65)
            };

            // Test by manually setting the breakeven price and checking auto-calculations
            await page.click('button:has-text("Single Calculation")');
            await page.fill('#purchasePrice', breakevenPrice.toString());
            await page.waitForTimeout(1000);

            const actualAutoCalcsAtBreakeven = {
                downPayment: parseFloat(await page.inputValue('#downPayment')),
                maintenance: parseFloat(await page.inputValue('#annualMaintenanceCosts')),
                amortization: parseFloat(await page.inputValue('#annualAmortization')),
                imputedRental: parseFloat(await page.inputValue('#imputedRentalValue'))
            };

            console.log('🔄 AUTO-CALCULATION SCALING TEST:');
            console.log('─'.repeat(60));
            console.log('Parameter              | Expected       | Actual         | Match');
            console.log('─'.repeat(60));

            const scalingResults = {
                downPayment: this.compareValues(expectedAutoCalcsAtBreakeven.downPayment, actualAutoCalcsAtBreakeven.downPayment),
                maintenance: this.compareValues(expectedAutoCalcsAtBreakeven.maintenance, actualAutoCalcsAtBreakeven.maintenance),
                amortization: this.compareValues(expectedAutoCalcsAtBreakeven.amortization, actualAutoCalcsAtBreakeven.amortization),
                imputedRental: this.compareValues(expectedAutoCalcsAtBreakeven.imputedRental, actualAutoCalcsAtBreakeven.imputedRental)
            };

            console.log(`Down Payment           | CHF ${expectedAutoCalcsAtBreakeven.downPayment.toLocaleString().padEnd(10)} | CHF ${actualAutoCalcsAtBreakeven.downPayment.toLocaleString().padEnd(10)} | ${scalingResults.downPayment.match ? '✅' : '❌'}`);
            console.log(`Maintenance            | CHF ${expectedAutoCalcsAtBreakeven.maintenance.toLocaleString().padEnd(10)} | CHF ${actualAutoCalcsAtBreakeven.maintenance.toLocaleString().padEnd(10)} | ${scalingResults.maintenance.match ? '✅' : '❌'}`);
            console.log(`Amortization           | CHF ${expectedAutoCalcsAtBreakeven.amortization.toLocaleString().padEnd(10)} | CHF ${actualAutoCalcsAtBreakeven.amortization.toLocaleString().padEnd(10)} | ${scalingResults.amortization.match ? '✅' : '❌'}`);
            console.log(`Imputed Rental         | CHF ${expectedAutoCalcsAtBreakeven.imputedRental.toLocaleString().padEnd(10)} | CHF ${actualAutoCalcsAtBreakeven.imputedRental.toLocaleString().padEnd(10)} | ${scalingResults.imputedRental.match ? '✅' : '❌'}`);
            console.log('─'.repeat(60));
            console.log('');

            // Verify that the scaled calculation gives near-zero result
            await page.click('button:has-text("Calculate")');
            await page.waitForSelector('#singleResults', { state: 'visible' });
            await page.waitForTimeout(1000);

            const breakevenResultContent = await page.textContent('#singleResults');
            const breakevenNumericMatches = breakevenResultContent.match(/CHF\s*[\d,]+\.?\d*/g);
            const breakevenResultValue = breakevenNumericMatches ? 
                parseFloat(breakevenNumericMatches[0].replace(/[CHF,\s]/g, '')) : 0;

            console.log('🎯 BREAKEVEN VERIFICATION:');
            console.log(`  Result at breakeven price: CHF ${breakevenResultValue.toLocaleString()}`);
            console.log(`  Close to zero: ${breakevenResultValue < 10000 ? '✅' : '❌'} (within CHF 10,000)`);
            console.log('');

            const allScalingMatch = Object.values(scalingResults).every(r => r.match);
            const breakevenAccurate = breakevenResultValue < 10000;

            return {
                breakevenPrice,
                baselineAutoCalcs,
                expectedAutoCalcsAtBreakeven,
                actualAutoCalcsAtBreakeven,
                scalingResults,
                allScalingMatch,
                breakevenResultValue,
                breakevenAccurate,
                overallSuccess: allScalingMatch && breakevenAccurate
            };

        } else {
            console.log('❌ BREAKEVEN PRICE NOT FOUND');
            return { overallSuccess: false, error: 'Breakeven calculation failed' };
        }
    }

    /**
     * Compare two values with tolerance
     */
    compareValues(expected, actual) {
        const difference = Math.abs(expected - actual);
        const match = difference <= this.tolerance;
        return { expected, actual, difference, match };
    }

    /**
     * Run comprehensive max-bid auto-calculation tests
     */
    async runTests() {
        console.log('🎯 MAX-BID AUTO-CALCULATION TEST');
        console.log('='.repeat(70));
        console.log('Testing that max-bid calculations properly scale auto-calculated parameters');
        console.log('');

        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        try {
            const indexPath = path.resolve(__dirname, 'index.html');
            await page.goto(`file://${indexPath}`);
            await page.waitForLoadState('networkidle');

            const testScenarios = [
                {
                    name: 'Scenario 1: Mid-range Property',
                    purchasePrice: 1400000,
                    monthlyRent: 4000,
                    mortgageRate: 2.0,
                    propertyAppreciationRate: 1.8,
                    investmentYieldRate: 3.2,
                    marginalTaxRate: 26.0,
                    termYears: 15,
                    amortizationYears: 15,
                    propertyTaxDeductions: 13000,
                    annualRentalCosts: 20000
                },
                {
                    name: 'Scenario 2: Higher-end Property',
                    purchasePrice: 2200000,
                    monthlyRent: 5800,
                    mortgageRate: 1.9,
                    propertyAppreciationRate: 1.5,
                    investmentYieldRate: 3.8,
                    marginalTaxRate: 30.0,
                    termYears: 18,
                    amortizationYears: 16,
                    propertyTaxDeductions: 13000,
                    annualRentalCosts: 20000
                }
            ];

            const testResults = [];
            let passCount = 0;
            let failCount = 0;

            for (let i = 0; i < testScenarios.length; i++) {
                const scenario = testScenarios[i];
                console.log(`📋 ${scenario.name}`);
                console.log('═'.repeat(50));

                const result = await this.testMaxBidAutoCalculations(page, scenario);
                testResults.push(result);

                if (result.overallSuccess) {
                    passCount++;
                    console.log('✅ SCENARIO PASSED - Auto-calculations scale correctly with max-bid');
                } else {
                    failCount++;
                    console.log('❌ SCENARIO FAILED - Auto-calculation scaling issues detected');
                }
                console.log('');
            }

            // Summary
            console.log('📊 MAX-BID AUTO-CALCULATION TEST SUMMARY');
            console.log('='.repeat(50));
            console.log(`Total Scenarios:     ${testScenarios.length}`);
            console.log(`Passed Scenarios:    ${passCount} (${((passCount/testScenarios.length)*100).toFixed(1)}%)`);
            console.log(`Failed Scenarios:    ${failCount} (${((failCount/testScenarios.length)*100).toFixed(1)}%)`);
            console.log('');

            if (passCount === testScenarios.length) {
                console.log('🎉 ALL MAX-BID AUTO-CALCULATION TESTS PASSED!');
                console.log('✅ Auto-calculated parameters scale correctly with purchase price changes');
                console.log('✅ Max-bid calculations use proper auto-calculated maintenance costs');
                console.log('✅ Break-even prices are accurate with scaled parameters');
            } else {
                console.log('⚠️ SOME MAX-BID AUTO-CALCULATION TESTS FAILED');
                console.log('❌ Auto-calculation scaling issues in max-bid scenarios');
            }

            return {
                scenarios: testResults,
                passCount,
                failCount,
                overallSuccess: passCount === testScenarios.length
            };

        } finally {
            await browser.close();
        }
    }
}

// Run if called directly
if (require.main === module) {
    const tester = new MaxBidAutoCalcTester();
    tester.runTests().catch(console.error);
}

module.exports = { MaxBidAutoCalcTester };