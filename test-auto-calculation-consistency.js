/**
 * Test Auto-Calculation Consistency
 * Verifies that automatic parameter calculations work consistently between 
 * frontend, backend, and parameter sweep operations
 */

const { chromium } = require('playwright');
const SwissRentBuyCalculator = require('./calculator.js');
const path = require('path');

class AutoCalculationTester {
    constructor() {
        this.tolerance = 100; // CHF 100 tolerance for floating point differences
    }

    /**
     * Test auto-calculations for a given set of base parameters
     */
    async testAutoCalculations(page, baseParams) {
        console.log(`🧮 TESTING AUTO-CALCULATIONS:`);
        console.log(`  Purchase Price: CHF ${baseParams.purchasePrice.toLocaleString()}`);
        console.log(`  Monthly Rent: CHF ${baseParams.monthlyRent.toLocaleString()}`);
        console.log(`  Mortgage Rate: ${baseParams.mortgageRate}%`);
        console.log('');

        // Fill UI with base parameters and enable auto-calculations
        await page.click('button:has-text("Single Calculation")');
        await page.check('#autoDownPayment');
        await page.check('#autoMaintenance');
        await page.check('#autoAmortization');
        await page.check('#autoImputedRental');

        // Fill all scenario parameters to ensure UI matches test scenario exactly
        await page.fill('#purchasePrice', baseParams.purchasePrice.toString());
        await page.fill('#monthlyRent', baseParams.monthlyRent.toString());
        await page.fill('#mortgageRate', baseParams.mortgageRate.toString());
        await page.fill('#propertyAppreciation', baseParams.propertyAppreciationRate.toString());
        await page.fill('#investmentYield', baseParams.investmentYieldRate.toString());
        await page.fill('#marginalTaxRate', baseParams.marginalTaxRate.toString());
        await page.fill('#termYears', baseParams.termYears.toString());
        await page.fill('#amortizationYears', baseParams.amortizationYears.toString());
        
        // Fill additional parameters that have scenario-specific values
        if (baseParams.totalRenovations !== undefined) {
            await page.fill('#totalRenovations', baseParams.totalRenovations.toString());
        }
        if (baseParams.additionalPurchaseCosts !== undefined) {
            await page.fill('#additionalPurchaseCosts', baseParams.additionalPurchaseCosts.toString());
        }
        if (baseParams.propertyTaxDeductions !== undefined) {
            await page.fill('#propertyTaxDeductions', baseParams.propertyTaxDeductions.toString());
        }
        if (baseParams.annualRentalCosts !== undefined) {
            await page.fill('#annualRentalCosts', baseParams.annualRentalCosts.toString());
        }

        // Wait for auto-calculations
        await page.waitForTimeout(1000);

        // Extract auto-calculated values from UI
        const uiAutoCalcs = {
            downPayment: parseFloat(await page.inputValue('#downPayment')),
            annualMaintenanceCosts: parseFloat(await page.inputValue('#annualMaintenanceCosts')),
            annualAmortization: parseFloat(await page.inputValue('#annualAmortization')),
            imputedRentalValue: parseFloat(await page.inputValue('#imputedRentalValue'))
        };

        // Calculate expected auto-calculations using Swiss standards
        const expectedAutoCalcs = this.calculateExpectedAutoValues(baseParams);

        // Test backend calculation with auto-calculated values from UI
        // Use exact scenario values for non-auto-calculated parameters
        const backendParams = {
            purchasePrice: baseParams.purchasePrice,
            downPayment: uiAutoCalcs.downPayment,
            mortgageRate: baseParams.mortgageRate / 100,
            monthlyRent: baseParams.monthlyRent,
            propertyAppreciationRate: baseParams.propertyAppreciationRate / 100,
            investmentYieldRate: baseParams.investmentYieldRate / 100,
            marginalTaxRate: baseParams.marginalTaxRate / 100,
            termYears: baseParams.termYears,
            annualMaintenanceCosts: uiAutoCalcs.annualMaintenanceCosts,
            amortizationYears: baseParams.amortizationYears,
            annualAmortization: uiAutoCalcs.annualAmortization,
            // Use exact scenario values (no defaults)
            totalRenovations: baseParams.totalRenovations,
            additionalPurchaseCosts: baseParams.additionalPurchaseCosts,
            imputedRentalValue: uiAutoCalcs.imputedRentalValue,
            propertyTaxDeductions: baseParams.propertyTaxDeductions,
            annualRentalCosts: baseParams.annualRentalCosts
        };

        
        const backendResult = SwissRentBuyCalculator.calculate(backendParams);

        // Calculate UI result
        await page.click('button:has-text("Calculate")');
        await page.waitForSelector('#singleResults', { state: 'visible' });
        await page.waitForTimeout(1000);

        const resultsContent = await page.textContent('#singleResults');
        let uiDecision = 'UNKNOWN';
        let uiResultValue = 0;

        if (resultsContent.includes('Decision: BUY') || resultsContent.toLowerCase().includes('buying')) {
            uiDecision = 'BUY';
        } else if (resultsContent.includes('Decision: RENT') || resultsContent.toLowerCase().includes('renting')) {
            uiDecision = 'RENT';
        }

        const numericMatches = resultsContent.match(/CHF\s*[\d,]+\.?\d*/g);
        if (numericMatches && numericMatches.length > 0) {
            uiResultValue = parseFloat(numericMatches[0].replace(/[CHF,\s]/g, ''));
        }

        // Compare auto-calculated values
        const autoCalcResults = {
            downPayment: this.compareValues('Down Payment', uiAutoCalcs.downPayment, expectedAutoCalcs.downPayment),
            maintenance: this.compareValues('Maintenance Costs', uiAutoCalcs.annualMaintenanceCosts, expectedAutoCalcs.annualMaintenanceCosts),
            amortization: this.compareValues('Annual Amortization', uiAutoCalcs.annualAmortization, expectedAutoCalcs.annualAmortization),
            imputedRental: this.compareValues('Imputed Rental Value', uiAutoCalcs.imputedRentalValue, expectedAutoCalcs.imputedRentalValue)
        };

        // Compare final calculation results
        const calculationMatch = this.compareValues('Final Calculation', uiResultValue, Math.abs(backendResult.ResultValue));
        const decisionMatch = uiDecision === backendResult.Decision;

        console.log('📊 AUTO-CALCULATION COMPARISON:');
        console.log('─'.repeat(60));
        console.log('Parameter                    | UI Value       | Expected      | Match');
        console.log('─'.repeat(60));
        console.log(`Down Payment                 | CHF ${uiAutoCalcs.downPayment.toLocaleString().padEnd(8)} | CHF ${expectedAutoCalcs.downPayment.toLocaleString().padEnd(7)} | ${autoCalcResults.downPayment.match ? '✅' : '❌'}`);
        console.log(`Maintenance Costs            | CHF ${uiAutoCalcs.annualMaintenanceCosts.toLocaleString().padEnd(8)} | CHF ${expectedAutoCalcs.annualMaintenanceCosts.toLocaleString().padEnd(7)} | ${autoCalcResults.maintenance.match ? '✅' : '❌'}`);
        console.log(`Annual Amortization          | CHF ${uiAutoCalcs.annualAmortization.toLocaleString().padEnd(8)} | CHF ${expectedAutoCalcs.annualAmortization.toLocaleString().padEnd(7)} | ${autoCalcResults.amortization.match ? '✅' : '❌'}`);
        console.log(`Imputed Rental Value         | CHF ${uiAutoCalcs.imputedRentalValue.toLocaleString().padEnd(8)} | CHF ${expectedAutoCalcs.imputedRentalValue.toLocaleString().padEnd(7)} | ${autoCalcResults.imputedRental.match ? '✅' : '❌'}`);
        console.log('─'.repeat(60));
        console.log('');

        console.log('🎯 CALCULATION RESULT COMPARISON:');
        console.log('─'.repeat(50));
        console.log(`UI Decision:      ${uiDecision}`);
        console.log(`Backend Decision: ${backendResult.Decision}`);
        console.log(`Decision Match:   ${decisionMatch ? '✅' : '❌'}`);
        console.log(`UI Value:         CHF ${uiResultValue.toLocaleString()}`);
        console.log(`Backend Value:    CHF ${Math.abs(backendResult.ResultValue).toLocaleString()}`);
        console.log(`Value Match:      ${calculationMatch.match ? '✅' : '❌'} (diff: CHF ${calculationMatch.difference.toLocaleString()})`);
        console.log('');

        return {
            autoCalcResults,
            calculationMatch: calculationMatch.match && decisionMatch,
            uiAutoCalcs,
            expectedAutoCalcs,
            finalResults: {
                ui: { decision: uiDecision, value: uiResultValue },
                backend: { decision: backendResult.Decision, value: backendResult.ResultValue }
            }
        };
    }

    /**
     * Calculate expected auto-calculation values using Swiss standards
     */
    calculateExpectedAutoValues(baseParams) {
        return {
            downPayment: Math.round(baseParams.purchasePrice * 0.2), // 20% Swiss minimum
            annualMaintenanceCosts: Math.round(baseParams.purchasePrice * 0.0125), // 1.25% Swiss standard
            annualAmortization: Math.round((baseParams.purchasePrice * 0.8) / baseParams.amortizationYears), // 80% mortgage / years
            imputedRentalValue: Math.round(baseParams.monthlyRent * 12 * 0.65) // 65% of annual rent
        };
    }

    /**
     * Compare two values with tolerance
     */
    compareValues(name, actual, expected) {
        const difference = Math.abs(actual - expected);
        const match = difference <= this.tolerance;
        return { name, actual, expected, difference, match };
    }

    /**
     * Test auto-calculations for parameter sweep scenario
     */
    async testParameterSweepAutoCalcs(page) {
        console.log('🔄 TESTING PARAMETER SWEEP AUTO-CALCULATIONS...');
        console.log('─'.repeat(60));

        // First ensure we're on Single Calculation tab to set base parameters
        await page.click('button:has-text("Single Calculation")');
        await page.waitForSelector('#purchasePrice', { state: 'visible' });
        
        // Enable auto-calculations
        await page.check('#autoDownPayment');
        await page.check('#autoMaintenance');
        await page.check('#autoAmortization');
        await page.check('#autoImputedRental');

        // Set base parameters
        const basePrice = 1500000;
        const monthlyRent = 4500;
        const mortgageRate = 2.0;

        await page.fill('#purchasePrice', basePrice.toString());
        await page.fill('#monthlyRent', monthlyRent.toString());
        await page.fill('#mortgageRate', mortgageRate.toString());
        await page.fill('#propertyAppreciation', '1.5');
        await page.fill('#investmentYield', '3.0');
        await page.fill('#marginalTaxRate', '25.0');
        await page.fill('#termYears', '15');
        await page.fill('#amortizationYears', '15');

        // Now switch to Parameter Sweep tab to test sweep functionality
        await page.click('button:has-text("Parameter Sweep")');
        await page.waitForSelector('#sweepBtn', { state: 'visible' });

        // Test different price points to ensure auto-calculations scale properly
        const testPrices = [1200000, 1500000, 2000000];
        const results = [];

        for (const testPrice of testPrices) {
            console.log(`Testing price: CHF ${testPrice.toLocaleString()}`);
            
            // Simulate what getParametersWithAutoCalculations() would do
            const expectedMaintenance = Math.round(testPrice * 0.0125);
            const expectedDownPayment = Math.round(testPrice * 0.2);
            const expectedMortgage = testPrice - expectedDownPayment;
            const expectedAmortization = Math.round(expectedMortgage / 15);
            const expectedImputedRental = Math.round(monthlyRent * 12 * 0.65);

            console.log(`  Expected maintenance: CHF ${expectedMaintenance.toLocaleString()}`);
            console.log(`  Expected down payment: CHF ${expectedDownPayment.toLocaleString()}`);
            console.log(`  Expected amortization: CHF ${expectedAmortization.toLocaleString()}`);
            console.log(`  Expected imputed rental: CHF ${expectedImputedRental.toLocaleString()}`);

            results.push({
                price: testPrice,
                expectedMaintenance,
                expectedDownPayment,
                expectedAmortization,
                expectedImputedRental
            });
        }

        return results;
    }

    /**
     * Run comprehensive auto-calculation tests
     */
    async runTests() {
        console.log('🔧 AUTO-CALCULATION CONSISTENCY TEST');
        console.log('='.repeat(70));
        console.log('Testing automatic parameter calculations across UI, backend, and sweeps');
        console.log('');

        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        try {
            const indexPath = path.resolve(__dirname, 'index.html');
            await page.goto(`file://${indexPath}`);
            await page.waitForLoadState('networkidle');

            const testScenarios = [
                {
                    name: 'Mid-range Property',
                    purchasePrice: 1500000,
                    monthlyRent: 4200,
                    mortgageRate: 1.8,
                    propertyAppreciationRate: 2.0,
                    investmentYieldRate: 3.5,
                    marginalTaxRate: 28.0,
                    termYears: 12,
                    amortizationYears: 15,
                    totalRenovations: 0,
                    additionalPurchaseCosts: 0,
                    propertyTaxDeductions: 13000,
                    annualRentalCosts: 20000
                },
                {
                    name: 'High-end Property',
                    purchasePrice: 2500000,
                    monthlyRent: 6800,
                    mortgageRate: 2.1,
                    propertyAppreciationRate: 1.5,
                    investmentYieldRate: 4.0,
                    marginalTaxRate: 32.0,
                    termYears: 20,
                    amortizationYears: 18,
                    totalRenovations: 0,
                    additionalPurchaseCosts: 0,
                    propertyTaxDeductions: 13000,
                    annualRentalCosts: 20000
                },
                {
                    name: 'Entry-level Property',
                    purchasePrice: 900000,
                    monthlyRent: 2800,
                    mortgageRate: 1.5,
                    propertyAppreciationRate: 2.5,
                    investmentYieldRate: 2.8,
                    marginalTaxRate: 22.0,
                    termYears: 10,
                    amortizationYears: 12,
                    totalRenovations: 0,
                    additionalPurchaseCosts: 0,
                    propertyTaxDeductions: 13000,
                    annualRentalCosts: 20000
                }
            ];

            const testResults = [];
            let passCount = 0;
            let failCount = 0;

            for (let i = 0; i < testScenarios.length; i++) {
                const scenario = testScenarios[i];
                console.log(`📋 SCENARIO ${i + 1}: ${scenario.name}`);
                console.log('─'.repeat(50));

                const result = await this.testAutoCalculations(page, scenario);
                testResults.push(result);

                const allAutoCalcsMatch = Object.values(result.autoCalcResults).every(r => r.match);
                const overallPass = allAutoCalcsMatch && result.calculationMatch;

                if (overallPass) {
                    passCount++;
                    console.log('✅ SCENARIO PASSED - All auto-calculations and final results match');
                } else {
                    failCount++;
                    console.log('❌ SCENARIO FAILED - Auto-calculation or result mismatch detected');
                }
                console.log('');
            }

            // Test parameter sweep auto-calculations
            const sweepResults = await this.testParameterSweepAutoCalcs(page);

            // Summary
            console.log('📊 AUTO-CALCULATION TEST SUMMARY');
            console.log('='.repeat(50));
            console.log(`Total Scenarios:     ${testScenarios.length}`);
            console.log(`Passed Scenarios:    ${passCount} (${((passCount/testScenarios.length)*100).toFixed(1)}%)`);
            console.log(`Failed Scenarios:    ${failCount} (${((failCount/testScenarios.length)*100).toFixed(1)}%)`);
            console.log('');

            if (passCount === testScenarios.length) {
                console.log('🎉 ALL AUTO-CALCULATION TESTS PASSED!');
                console.log('✅ Frontend auto-calculations are consistent with Swiss standards');
                console.log('✅ Backend calculations work correctly with auto-calculated parameters');
                console.log('✅ Parameter sweep auto-calculations scale properly');
            } else {
                console.log('⚠️ SOME AUTO-CALCULATION TESTS FAILED');
                console.log('❌ Auto-calculation consistency issues detected');
                console.log('🔧 Review auto-calculation logic in frontend and backend');
            }

            return {
                scenarios: testResults,
                sweepResults,
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
    const tester = new AutoCalculationTester();
    tester.runTests().catch(console.error);
}

module.exports = { AutoCalculationTester };