/**
 * Test realistic Swiss real estate scenarios using UI auto-calculated maintenance
 * Compares UI calculations with backend using the same auto-calculated values
 */

const { chromium } = require('playwright');
const { SwissParameterGenerator } = require('./random-parameter-test.js');
const { SwissRentBuyCalculatorNode } = require('./backend-validation-test.js');
const path = require('path');

class RealisticScenarioTester {
    constructor() {
        this.generator = new SwissParameterGenerator();
    }

    /**
     * Test a single scenario with UI auto-calculations
     */
    async testScenario(page, params) {
        try {
            // Navigate to calculator and set up
            await page.click('button:has-text("Single Calculation")');
            await page.check('#manualDownPayment');
            
            // Fill parameters - let UI auto-calculate maintenance
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
            
            // Wait for auto-calculations to complete
            await page.waitForTimeout(1000);
            
            // Get the auto-calculated values from UI
            const uiValues = {};
            const fieldIds = [
                'purchasePrice', 'downPayment', 'mortgageRate', 'monthlyRent',
                'propertyAppreciation', 'investmentYield', 'marginalTaxRate', 'termYears',
                'amortizationYears', 'annualMaintenanceCosts', 'imputedRentalValue',
                'propertyTaxDeductions', 'annualRentalCosts', 'annualAmortization'
            ];
            
            for (const fieldId of fieldIds) {
                try {
                    uiValues[fieldId] = await page.inputValue(`#${fieldId}`);
                } catch (e) {
                    uiValues[fieldId] = '0';
                }
            }
            
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
            
            // Calculate backend result using the same UI values
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
            
            // Calculate maintenance rate
            const maintenanceRate = parseFloat(uiValues.annualMaintenanceCosts) / parseFloat(uiValues.purchasePrice) * 100;
            
            return {
                scenario: params,
                uiValues,
                uiResult: {
                    decision: uiDecision,
                    resultValue: uiResultValue
                },
                backendResult: {
                    decision: backendResult.Decision,
                    resultValue: backendResult.ResultValue
                },
                maintenanceRate,
                actualMaintenance: parseFloat(uiValues.annualMaintenanceCosts)
            };
            
        } catch (error) {
            console.error('Error testing scenario:', error.message);
            return null;
        }
    }

    /**
     * Run realistic scenario tests
     */
    async runRealisticTests(numTests = 10) {
        console.log('🏠 REALISTIC SWISS SCENARIOS TEST');
        console.log('=' .repeat(90));
        
        // Initialize browser
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        
        try {
            const indexPath = path.join(__dirname, 'index.html');
            await page.goto(`file://${indexPath}`);
            await page.waitForLoadState('networkidle');
            
            console.log(`🧮 TESTING ${numTests} REALISTIC SCENARIOS:`);
            console.log('─'.repeat(90));
            console.log('Scenario | Price (M) | Maint % | UI Decision | UI Value      | Backend Decision | Backend Value | Match');
            console.log('─'.repeat(90));
            
            const results = [];
            let exactMatches = 0;
            let decisionMatches = 0;
            let totalScenarios = 0;
            
            for (let i = 1; i <= numTests; i++) {
                // Generate realistic parameters
                const params = this.generator.generateParameters();
                params.testId = `realistic-${i}`;
                
                const result = await this.testScenario(page, params);
                
                if (result) {
                    totalScenarios++;
                    
                    const decisionMatch = result.uiResult.decision === result.backendResult.decision;
                    const valueDiff = Math.abs(result.uiResult.resultValue - Math.abs(result.backendResult.resultValue));
                    const exactMatch = decisionMatch && valueDiff < 1000; // Allow CHF 1000 tolerance
                    
                    if (exactMatch) exactMatches++;
                    if (decisionMatch) decisionMatches++;
                    
                    const matchSymbol = exactMatch ? '✅' : decisionMatch ? '⚠️' : '❌';
                    const priceM = (result.scenario.purchasePrice / 1000000).toFixed(1);
                    
                    console.log(
                        `${i.toString().padStart(8)} | ` +
                        `${priceM.padStart(9)} | ` +
                        `${result.maintenanceRate.toFixed(2)}% | ` +
                        `${result.uiResult.decision.padEnd(11)} | ` +
                        `CHF ${Math.abs(result.uiResult.resultValue).toLocaleString().padEnd(9)} | ` +
                        `${result.backendResult.decision.padEnd(16)} | ` +
                        `CHF ${Math.abs(result.backendResult.resultValue).toLocaleString().padEnd(9)} | ` +
                        `${matchSymbol}`
                    );
                    
                    results.push(result);
                } else {
                    console.log(`${i.toString().padStart(8)} | ERROR - could not process scenario`);
                }
            }
            
            console.log('─'.repeat(90));
            console.log('');
            
            // Comprehensive analysis
            console.log('📊 COMPREHENSIVE ANALYSIS:');
            console.log('─'.repeat(50));
            console.log(`Total Scenarios:      ${totalScenarios}`);
            console.log(`Exact Matches:        ${exactMatches} (${((exactMatches/totalScenarios)*100).toFixed(1)}%)`);
            console.log(`Decision Matches:     ${decisionMatches} (${((decisionMatches/totalScenarios)*100).toFixed(1)}%)`);
            console.log(`Failed Tests:         ${numTests - totalScenarios}`);
            console.log('');
            
            if (results.length > 0) {
                // Maintenance rate analysis
                const maintenanceRates = results.map(r => r.maintenanceRate);
                const avgMaintenanceRate = maintenanceRates.reduce((sum, rate) => sum + rate, 0) / maintenanceRates.length;
                const minMaintenanceRate = Math.min(...maintenanceRates);
                const maxMaintenanceRate = Math.max(...maintenanceRates);
                
                console.log('🔧 MAINTENANCE RATE ANALYSIS:');
                console.log('─'.repeat(50));
                console.log(`Average Rate:         ${avgMaintenanceRate.toFixed(3)}%`);
                console.log(`Rate Range:           ${minMaintenanceRate.toFixed(3)}% - ${maxMaintenanceRate.toFixed(3)}%`);
                console.log(`UI Standard Rate:     1.250% (Swiss standard)`);
                console.log('');
                
                // Decision analysis
                const buyDecisions = results.filter(r => r.uiResult.decision === 'BUY');
                const rentDecisions = results.filter(r => r.uiResult.decision === 'RENT');
                
                console.log('📈 DECISION ANALYSIS:');
                console.log('─'.repeat(50));
                console.log(`BUY Decisions:        ${buyDecisions.length} (${((buyDecisions.length/results.length)*100).toFixed(1)}%)`);
                console.log(`RENT Decisions:       ${rentDecisions.length} (${((rentDecisions.length/results.length)*100).toFixed(1)}%)`);
                
                if (buyDecisions.length > 0) {
                    const avgBuyPrice = buyDecisions.reduce((sum, r) => sum + r.scenario.purchasePrice, 0) / buyDecisions.length;
                    console.log(`Avg BUY Price:        CHF ${avgBuyPrice.toLocaleString()}`);
                }
                
                if (rentDecisions.length > 0) {
                    const avgRentPrice = rentDecisions.reduce((sum, r) => sum + r.scenario.purchasePrice, 0) / rentDecisions.length;
                    console.log(`Avg RENT Price:       CHF ${avgRentPrice.toLocaleString()}`);
                }
                
                // Accuracy analysis for matched decisions
                if (decisionMatches > 0) {
                    const matchedResults = results.filter(r => r.uiResult.decision === r.backendResult.decision);
                    const valueDifferences = matchedResults.map(r => 
                        Math.abs(r.uiResult.resultValue - Math.abs(r.backendResult.resultValue))
                    );
                    
                    const avgValueDiff = valueDifferences.reduce((sum, diff) => sum + diff, 0) / valueDifferences.length;
                    const maxValueDiff = Math.max(...valueDifferences);
                    
                    console.log('');
                    console.log('🎯 ACCURACY ANALYSIS (Decision Matches):');
                    console.log('─'.repeat(50));
                    console.log(`Average Value Diff:   CHF ${avgValueDiff.toLocaleString()}`);
                    console.log(`Maximum Value Diff:   CHF ${maxValueDiff.toLocaleString()}`);
                    console.log(`Precision:            ${avgValueDiff < 1000 ? 'High' : avgValueDiff < 5000 ? 'Good' : 'Fair'}`);
                }
            }
            
            console.log('');
            const overallSuccess = decisionMatches === totalScenarios;
            console.log(overallSuccess ? '🎉 ALL DECISION TESTS PASSED!' : 
                       exactMatches > totalScenarios * 0.8 ? '✅ MOSTLY SUCCESSFUL!' :
                       '⚠️ NEEDS INVESTIGATION');
            
            return results;
            
        } finally {
            await browser.close();
        }
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        RealisticScenarioTester
    };
}

// Run if called directly
if (require.main === module) {
    const tester = new RealisticScenarioTester();
    tester.runRealisticTests(10).catch(console.error);
}