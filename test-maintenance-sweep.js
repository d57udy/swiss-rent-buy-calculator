/**
 * Test maintenance cost sweep between 1% and 2% of purchase price
 * Validates that UI and backend calculations align with realistic Swiss maintenance rates
 */

const { chromium } = require('playwright');
const { SwissParameterGenerator } = require('./random-parameter-test.js');
const { SwissRentBuyCalculatorNode } = require('./backend-validation-test.js');
const path = require('path');

class MaintenanceSweepTester {
    constructor() {
        this.generator = new SwissParameterGenerator();
    }

    /**
     * Generate test scenarios with varying maintenance rates
     */
    generateMaintenanceScenarios(baseParams, maintenanceRates) {
        const scenarios = [];
        
        maintenanceRates.forEach((rate, index) => {
            const scenario = { ...baseParams };
            scenario.testId = `maintenance-${rate}pct`;
            scenario.maintenanceRate = rate;
            scenario.annualMaintenanceCosts = Math.round(baseParams.purchasePrice * rate / 100);
            scenario.maintenancePercent = rate;
            scenarios.push(scenario);
        });
        
        return scenarios;
    }

    /**
     * Test UI with maintenance override
     */
    async testUIWithMaintenance(page, params) {
        try {
            // Navigate to calculator and set up
            await page.click('button:has-text("Single Calculation")');
            await page.check('#manualDownPayment');
            
            // Fill core parameters
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
            await page.waitForTimeout(500);
            
            // Override maintenance cost if it's editable
            try {
                // Check if maintenance field is editable
                const isDisabled = await page.getAttribute('#annualMaintenanceCosts', 'disabled');
                if (!isDisabled) {
                    await page.fill('#annualMaintenanceCosts', params.annualMaintenanceCosts.toString());
                }
            } catch (e) {
                // Field might not be editable - that's okay
                console.log(`   Note: Could not override maintenance cost for ${params.maintenanceRate}%`);
            }
            
            // Calculate
            await page.click('button:has-text("Calculate")');
            await page.waitForSelector('#singleResults', { state: 'visible' });
            await page.waitForTimeout(1000);
            
            // Extract results
            const resultsContent = await page.textContent('#singleResults');
            
            // Get actual maintenance value used
            const actualMaintenance = await page.inputValue('#annualMaintenanceCosts');
            
            // Parse results
            let decision = 'UNKNOWN';
            let resultValue = 0;
            
            if (resultsContent.includes('BUY') || resultsContent.toLowerCase().includes('buying')) {
                decision = 'BUY';
            } else if (resultsContent.includes('RENT') || resultsContent.toLowerCase().includes('renting')) {
                decision = 'RENT';
            }
            
            const numericMatches = resultsContent.match(/CHF\s*[\d,]+\.?\d*/g);
            if (numericMatches && numericMatches.length > 0) {
                resultValue = parseFloat(numericMatches[0].replace(/[CHF,\s]/g, ''));
            }
            
            return {
                decision,
                resultValue,
                actualMaintenanceUsed: parseFloat(actualMaintenance),
                actualMaintenanceRate: parseFloat(actualMaintenance) / params.purchasePrice * 100,
                rawContent: resultsContent
            };
            
        } catch (error) {
            console.error('Error in UI test:', error.message);
            return null;
        }
    }

    /**
     * Test backend calculation
     */
    testBackendWithMaintenance(params) {
        const backendParams = {
            purchasePrice: params.purchasePrice,
            downPayment: params.downPayment,
            mortgageRate: params.mortgageRate / 100,
            monthlyRent: params.monthlyRent,
            propertyAppreciationRate: params.propertyAppreciationRate / 100,
            investmentYieldRate: params.investmentYieldRate / 100,
            marginalTaxRate: params.marginalTaxRate / 100,
            termYears: params.termYears,
            annualMaintenanceCosts: params.annualMaintenanceCosts,
            amortizationYears: params.amortizationYears,
            annualAmortization: params.annualAmortization,
            totalRenovations: params.totalRenovations,
            additionalPurchaseCosts: params.additionalPurchaseCosts,
            imputedRentalValue: params.imputedRentalValue,
            propertyTaxDeductions: params.propertyTaxDeductions,
            annualRentalCosts: params.annualRentalCosts
        };

        const result = SwissRentBuyCalculatorNode.calculate(backendParams);
        
        return {
            decision: result.Decision,
            resultValue: result.ResultValue,
            maintenanceUsed: params.annualMaintenanceCosts
        };
    }

    /**
     * Run comprehensive maintenance sweep test
     */
    async runMaintenanceSweep() {
        console.log('🏠 MAINTENANCE COST SWEEP TEST');
        console.log('=' .repeat(80));
        
        // Generate base parameters
        const baseParams = this.generator.generateParameters();
        baseParams.testId = 'maintenance-sweep-base';
        
        console.log('🎯 BASE SCENARIO:');
        console.log(`   Purchase Price: CHF ${baseParams.purchasePrice.toLocaleString()}`);
        console.log(`   Down Payment: CHF ${baseParams.downPayment.toLocaleString()}`);
        console.log(`   Mortgage Rate: ${baseParams.mortgageRate.toFixed(2)}%`);
        console.log(`   Monthly Rent: CHF ${baseParams.monthlyRent.toLocaleString()}`);
        console.log(`   Term: ${baseParams.termYears} years`);
        console.log('');
        
        // Define maintenance rates to test (1% to 2% in 0.1% increments)
        const maintenanceRates = [];
        for (let rate = 1.0; rate <= 2.0; rate += 0.1) {
            maintenanceRates.push(Math.round(rate * 10) / 10);
        }
        
        console.log('📊 MAINTENANCE RATES TO TEST:');
        console.log(`   ${maintenanceRates.map(r => r.toFixed(1) + '%').join(', ')}`);
        console.log('');
        
        // Generate scenarios
        const scenarios = this.generateMaintenanceScenarios(baseParams, maintenanceRates);
        
        // Initialize browser
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        
        try {
            const indexPath = path.join(__dirname, 'index.html');
            await page.goto(`file://${indexPath}`);
            await page.waitForLoadState('networkidle');
            
            console.log('🧮 RUNNING MAINTENANCE SWEEP TESTS:');
            console.log('─'.repeat(80));
            console.log('Rate  | UI Decision | UI Value      | Backend Decision | Backend Value | Match | Maint Used');
            console.log('─'.repeat(80));
            
            const results = [];
            let exactMatches = 0;
            let decisionMatches = 0;
            
            for (const scenario of scenarios) {
                // Test UI
                const uiResult = await this.testUIWithMaintenance(page, scenario);
                
                // Test Backend
                const backendResult = this.testBackendWithMaintenance(scenario);
                
                if (uiResult && backendResult) {
                    const decisionMatch = uiResult.decision === backendResult.decision;
                    const valueDiff = Math.abs(uiResult.resultValue - Math.abs(backendResult.resultValue));
                    const exactMatch = decisionMatch && valueDiff < 100;
                    
                    if (exactMatch) exactMatches++;
                    if (decisionMatch) decisionMatches++;
                    
                    const matchSymbol = exactMatch ? '✅' : decisionMatch ? '⚠️' : '❌';
                    
                    console.log(
                        `${scenario.maintenanceRate.toFixed(1)}% | ` +
                        `${uiResult.decision.padEnd(11)} | ` +
                        `CHF ${Math.abs(uiResult.resultValue).toLocaleString().padEnd(9)} | ` +
                        `${backendResult.decision.padEnd(16)} | ` +
                        `CHF ${Math.abs(backendResult.resultValue).toLocaleString().padEnd(9)} | ` +
                        `${matchSymbol}   | ` +
                        `CHF ${uiResult.actualMaintenanceUsed.toLocaleString()}`
                    );
                    
                    results.push({
                        maintenanceRate: scenario.maintenanceRate,
                        scenario,
                        uiResult,
                        backendResult,
                        decisionMatch,
                        exactMatch,
                        valueDiff
                    });
                } else {
                    console.log(`${scenario.maintenanceRate.toFixed(1)}% | ERROR - could not get results`);
                }
            }
            
            console.log('─'.repeat(80));
            console.log('');
            
            // Summary
            console.log('📊 MAINTENANCE SWEEP SUMMARY:');
            console.log('─'.repeat(50));
            console.log(`Total Tests:          ${scenarios.length}`);
            console.log(`Exact Matches:        ${exactMatches} (${((exactMatches/scenarios.length)*100).toFixed(1)}%)`);
            console.log(`Decision Matches:     ${decisionMatches} (${((decisionMatches/scenarios.length)*100).toFixed(1)}%)`);
            console.log(`Failed Tests:         ${scenarios.length - results.length}`);
            console.log('');
            
            // Analyze patterns
            if (results.length > 0) {
                console.log('📈 ANALYSIS:');
                console.log('─'.repeat(50));
                
                const buyDecisions = results.filter(r => r.uiResult.decision === 'BUY');
                const rentDecisions = results.filter(r => r.uiResult.decision === 'RENT');
                
                console.log(`BUY decisions:        ${buyDecisions.length} (${((buyDecisions.length/results.length)*100).toFixed(1)}%)`);
                console.log(`RENT decisions:       ${rentDecisions.length} (${((rentDecisions.length/results.length)*100).toFixed(1)}%)`);
                
                if (buyDecisions.length > 0) {
                    const buyRates = buyDecisions.map(r => r.maintenanceRate);
                    console.log(`BUY at rates:         ${buyRates.map(r => r.toFixed(1) + '%').join(', ')}`);
                }
                
                if (rentDecisions.length > 0) {
                    const rentRates = rentDecisions.map(r => r.maintenanceRate);
                    console.log(`RENT at rates:        ${rentRates.map(r => r.toFixed(1) + '%').join(', ')}`);
                }
                
                // Find transition point
                const sortedResults = results.sort((a, b) => a.maintenanceRate - b.maintenanceRate);
                let transitionPoint = null;
                
                for (let i = 0; i < sortedResults.length - 1; i++) {
                    if (sortedResults[i].uiResult.decision !== sortedResults[i + 1].uiResult.decision) {
                        transitionPoint = (sortedResults[i].maintenanceRate + sortedResults[i + 1].maintenanceRate) / 2;
                        break;
                    }
                }
                
                if (transitionPoint) {
                    console.log(`Decision transition:  ~${transitionPoint.toFixed(1)}% maintenance rate`);
                }
                
                // Average maintenance rates actually used by UI
                const avgUIRate = results.reduce((sum, r) => sum + r.uiResult.actualMaintenanceRate, 0) / results.length;
                console.log(`Avg UI maintenance:   ${avgUIRate.toFixed(2)}% of purchase price`);
            }
            
            console.log('');
            console.log(exactMatches === scenarios.length ? '🎉 ALL TESTS PASSED!' : 
                       decisionMatches === scenarios.length ? '⚠️ ALL DECISIONS MATCH (minor value differences)' :
                       '❌ SOME TESTS FAILED');
            
            return results;
            
        } finally {
            await browser.close();
        }
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MaintenanceSweepTester
    };
}

// Run if called directly
if (require.main === module) {
    const tester = new MaintenanceSweepTester();
    tester.runMaintenanceSweep().catch(console.error);
}