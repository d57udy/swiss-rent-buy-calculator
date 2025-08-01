/**
 * Realistic Parameter Validation Test
 * Tests randomly generated realistic Swiss parameters against our calculator
 * and validates frontend vs backend consistency
 */

const { chromium } = require('playwright');
const { SwissParameterGenerator } = require('./random-parameter-test.js');
const { SwissRentBuyCalculatorNode } = require('./backend-validation-test.js');
const path = require('path');

class RealisticParameterValidator {
    constructor() {
        this.generator = new SwissParameterGenerator();
    }

    /**
     * Test a single scenario with realistic parameters
     */
    async testRealisticScenario(page, scenarioNum) {
        console.log(`🧮 SCENARIO ${scenarioNum}:`);
        console.log('─'.repeat(50));
        
        // Generate realistic parameters
        const params = this.generator.generateParameters();
        params.testId = `realistic-${scenarioNum}`;
        
        console.log('Generated Parameters:');
        console.log(`  Purchase Price: CHF ${params.purchasePrice.toLocaleString()}`);
        console.log(`  Down Payment: CHF ${params.downPayment.toLocaleString()} (${params.downPaymentPercent}%)`);
        console.log(`  Mortgage Rate: ${params.mortgageRate.toFixed(2)}%`);
        console.log(`  Monthly Rent: CHF ${params.monthlyRent.toLocaleString()}`);
        console.log(`  Property Appreciation: ${params.propertyAppreciationRate.toFixed(2)}%`);
        console.log(`  Investment Yield: ${params.investmentYieldRate.toFixed(2)}%`);
        console.log(`  Marginal Tax Rate: ${params.marginalTaxRate.toFixed(2)}%`);
        console.log(`  Term: ${params.termYears} years`);
        console.log(`  Maintenance Rate: ${params.maintenancePercent}%`);
        console.log('');

        try {
            // Fill the UI form
            await page.click('button:has-text("Single Calculation")');
            await page.check('#manualDownPayment');
            
            await page.fill('#purchasePrice', params.purchasePrice.toString());
            await page.fill('#downPayment', params.downPayment.toString());
            await page.fill('#mortgageRate', params.mortgageRate.toString());
            await page.fill('#monthlyRent', params.monthlyRent.toString());
            await page.fill('#propertyAppreciation', params.propertyAppreciationRate.toString());
            await page.fill('#investmentYield', params.investmentYieldRate.toString());
            await page.fill('#marginalTaxRate', params.marginalTaxRate.toString());
            await page.fill('#termYears', params.termYears.toString());
            await page.fill('#amortizationYears', params.amortizationYears.toString());
            await page.fill('#propertyTaxDeductions', params.propertyTaxDeductions.toString());
            await page.fill('#annualRentalCosts', params.annualRentalCosts.toString());
            
            // Wait for auto-calculations
            await page.waitForTimeout(1000);
            
            // Extract the UI values after auto-calculation
            const uiValues = {
                purchasePrice: await page.inputValue('#purchasePrice'),
                downPayment: await page.inputValue('#downPayment'),
                mortgageRate: await page.inputValue('#mortgageRate'),
                monthlyRent: await page.inputValue('#monthlyRent'),
                propertyAppreciation: await page.inputValue('#propertyAppreciation'),
                investmentYield: await page.inputValue('#investmentYield'),
                marginalTaxRate: await page.inputValue('#marginalTaxRate'),
                termYears: await page.inputValue('#termYears'),
                amortizationYears: await page.inputValue('#amortizationYears'),
                annualMaintenanceCosts: await page.inputValue('#annualMaintenanceCosts'),
                imputedRentalValue: await page.inputValue('#imputedRentalValue'),
                propertyTaxDeductions: await page.inputValue('#propertyTaxDeductions'),
                annualRentalCosts: await page.inputValue('#annualRentalCosts'),
                annualAmortization: await page.inputValue('#annualAmortization')
            };
            
            // Calculate
            await page.click('button:has-text("Calculate")');
            await page.waitForSelector('#singleResults', { state: 'visible' });
            await page.waitForTimeout(1000);
            
            // Extract UI results
            const resultsContent = await page.textContent('#singleResults');
            
            let uiDecision = 'UNKNOWN';
            let uiResultValue = 0;
            
            if (resultsContent.includes('BUY') || resultsContent.toLowerCase().includes('buying')) {
                uiDecision = 'BUY';
            } else if (resultsContent.includes('RENT') || resultsContent.toLowerCase().includes('renting')) {
                uiDecision = 'RENT';
            }
            
            const numericMatches = resultsContent.match(/CHF\s*[\d,]+\.?\d*/g);
            if (numericMatches && numericMatches.length > 0) {
                uiResultValue = parseFloat(numericMatches[0].replace(/[CHF,\s]/g, ''));
            }
            
            // Run backend calculation with same parameters
            const backendParams = {
                purchasePrice: parseFloat(uiValues.purchasePrice),
                downPayment: parseFloat(uiValues.downPayment),
                mortgageRate: parseFloat(uiValues.mortgageRate) / 100,
                monthlyRent: parseFloat(uiValues.monthlyRent),
                propertyAppreciationRate: parseFloat(uiValues.propertyAppreciation) / 100,
                investmentYieldRate: parseFloat(uiValues.investmentYield) / 100,
                marginalTaxRate: parseFloat(uiValues.marginalTaxRate) / 100,
                termYears: parseInt(uiValues.termYears),
                annualMaintenanceCosts: parseFloat(uiValues.annualMaintenanceCosts),
                amortizationYears: parseInt(uiValues.amortizationYears),
                annualAmortization: parseFloat(uiValues.annualAmortization),
                totalRenovations: 0,
                additionalPurchaseCosts: 5000, // Fixed CHF 5,000 default
                imputedRentalValue: parseFloat(uiValues.imputedRentalValue),
                propertyTaxDeductions: parseFloat(uiValues.propertyTaxDeductions),
                annualRentalCosts: parseFloat(uiValues.annualRentalCosts)
            };
            
            const backendResult = SwissRentBuyCalculatorNode.calculate(backendParams);
            
            // Compare results
            const decisionMatch = uiDecision === backendResult.Decision;
            const valueDiff = Math.abs(uiResultValue - Math.abs(backendResult.ResultValue));
            const valueMatch = valueDiff < 1000; // CHF 1000 tolerance
            const overallMatch = decisionMatch && valueMatch;
            
            console.log('Results Comparison:');
            console.log(`  UI Result:      ${uiDecision} CHF ${uiResultValue.toLocaleString()}`);
            console.log(`  Backend Result: ${backendResult.Decision} CHF ${Math.abs(backendResult.ResultValue).toLocaleString()}`);
            console.log(`  Decision Match: ${decisionMatch ? '✅' : '❌'}`);
            console.log(`  Value Diff:     CHF ${valueDiff.toLocaleString()}`);
            console.log(`  Overall Match:  ${overallMatch ? '✅ PASS' : '❌ FAIL'}`);
            
            // Calculate maintenance rate from UI
            const actualMaintenanceRate = parseFloat(uiValues.annualMaintenanceCosts) / parseFloat(uiValues.purchasePrice) * 100;
            console.log(`  UI Maintenance Rate: ${actualMaintenanceRate.toFixed(3)}%`);
            
            console.log('');
            
            return {
                scenario: scenarioNum,
                params,
                uiResult: { decision: uiDecision, value: uiResultValue },
                backendResult: { decision: backendResult.Decision, value: backendResult.ResultValue },
                comparison: { decisionMatch, valueDiff, valueMatch, overallMatch },
                maintenanceRate: actualMaintenanceRate
            };

        } catch (error) {
            console.error(`Error in scenario ${scenarioNum}:`, error.message);
            return null;
        }
    }

    /**
     * Run multiple realistic parameter validation tests
     */
    async runValidationTests(numTests = 5) {
        console.log('🎯 REALISTIC PARAMETER VALIDATION TEST');
        console.log('='.repeat(70));
        console.log(`Testing ${numTests} realistic Swiss real estate scenarios`);
        console.log('Comparing frontend UI calculations with backend validation');
        console.log('');

        // Initialize browser
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        
        try {
            const indexPath = path.resolve(__dirname, 'index.html');
            await page.goto(`file://${indexPath}`);
            await page.waitForLoadState('networkidle');
            
            const results = [];
            let passCount = 0;
            let failCount = 0;
            
            // Run each test scenario
            for (let i = 1; i <= numTests; i++) {
                const result = await this.testRealisticScenario(page, i);
                
                if (result) {
                    results.push(result);
                    if (result.comparison.overallMatch) {
                        passCount++;
                    } else {
                        failCount++;
                    }
                }
            }
            
            // Summary analysis
            console.log('📊 VALIDATION SUMMARY:');
            console.log('='.repeat(50));
            console.log(`Total Tests:        ${results.length}`);
            console.log(`Passed Tests:       ${passCount} (${((passCount/results.length)*100).toFixed(1)}%)`);
            console.log(`Failed Tests:       ${failCount} (${((failCount/results.length)*100).toFixed(1)}%)`);
            console.log('');
            
            if (results.length > 0) {
                // Decision analysis
                const buyDecisions = results.filter(r => r.uiResult.decision === 'BUY');
                const rentDecisions = results.filter(r => r.uiResult.decision === 'RENT');
                
                console.log('📈 DECISION ANALYSIS:');
                console.log('─'.repeat(30));
                console.log(`BUY recommendations:  ${buyDecisions.length} (${((buyDecisions.length/results.length)*100).toFixed(1)}%)`);
                console.log(`RENT recommendations: ${rentDecisions.length} (${((rentDecisions.length/results.length)*100).toFixed(1)}%)`);
                
                // Maintenance rate analysis
                const maintenanceRates = results.map(r => r.maintenanceRate);
                const avgMaintenance = maintenanceRates.reduce((a, b) => a + b, 0) / maintenanceRates.length;
                const minMaintenance = Math.min(...maintenanceRates);
                const maxMaintenance = Math.max(...maintenanceRates);
                
                console.log('');
                console.log('🔧 MAINTENANCE RATE ANALYSIS:');
                console.log('─'.repeat(30));
                console.log(`Average Rate:  ${avgMaintenance.toFixed(3)}%`);
                console.log(`Rate Range:    ${minMaintenance.toFixed(3)}% - ${maxMaintenance.toFixed(3)}%`);
                console.log(`Swiss Standard: 1.250%`);
                
                // Value accuracy analysis
                const valueDifferences = results.map(r => r.comparison.valueDiff);
                const avgValueDiff = valueDifferences.reduce((a, b) => a + b, 0) / valueDifferences.length;
                const maxValueDiff = Math.max(...valueDifferences);
                
                console.log('');
                console.log('🎯 ACCURACY ANALYSIS:');
                console.log('─'.repeat(30));
                console.log(`Avg Value Difference: CHF ${avgValueDiff.toLocaleString()}`);
                console.log(`Max Value Difference: CHF ${maxValueDiff.toLocaleString()}`);
                console.log(`Precision Level: ${avgValueDiff < 100 ? 'Excellent' : avgValueDiff < 1000 ? 'Good' : 'Fair'}`);
            }
            
            console.log('');
            const successRate = passCount / results.length;
            if (successRate === 1.0) {
                console.log('🎉 ALL VALIDATION TESTS PASSED! 🎉');
                console.log('Frontend and backend calculations are perfectly aligned');
            } else if (successRate >= 0.8) {
                console.log('✅ VALIDATION MOSTLY SUCCESSFUL');
                console.log('Frontend and backend show good alignment');
            } else {
                console.log('⚠️ VALIDATION ISSUES DETECTED');
                console.log('Frontend and backend may have calculation differences');
            }
            
            return results;
            
        } finally {
            await browser.close();
        }
    }
}

// Run if called directly
if (require.main === module) {
    const validator = new RealisticParameterValidator();
    validator.runValidationTests(5).catch(console.error);
}

module.exports = { RealisticParameterValidator };