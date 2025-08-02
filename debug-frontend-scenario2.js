/**
 * Debug Frontend Scenario 2 Issue
 * Focused investigation of the specific frontend test failure
 */

const SwissRentBuyCalculator = require('./calculator.js');

class FrontendScenario2Debugger {
    constructor() {
        this.scenario = {
            name: 'High-end Property',
            purchasePrice: 2500000,
            monthlyRent: 6800,
            mortgageRate: 2.1,
            propertyAppreciationRate: 1.5,
            investmentYieldRate: 4.0,
            marginalTaxRate: 32.0,
            termYears: 20,
            amortizationYears: 18
        };
    }

    /**
     * Calculate expected auto-calculation values using Swiss standards
     */
    calculateExpectedAutoValues(params) {
        return {
            downPayment: Math.round(params.purchasePrice * 0.2), // 20% Swiss minimum
            annualMaintenanceCosts: Math.round(params.purchasePrice * 0.0125), // 1.25% Swiss standard
            annualAmortization: Math.round((params.purchasePrice * 0.8) / params.amortizationYears), // 80% mortgage / years
            imputedRentalValue: Math.round(params.monthlyRent * 12 * 0.65) // 65% of annual rent
        };
    }

    /**
     * Convert percentage parameters to decimal for calculator
     */
    convertParamsForCalculator(params) {
        return {
            ...params,
            mortgageRate: params.mortgageRate / 100,
            propertyAppreciationRate: params.propertyAppreciationRate / 100,
            investmentYieldRate: params.investmentYieldRate / 100,
            marginalTaxRate: params.marginalTaxRate / 100
        };
    }

    /**
     * Debug the specific scenario that's failing
     */
    debugScenario() {
        console.log('🔍 DEBUGGING FRONTEND SCENARIO 2 FAILURE');
        console.log('='.repeat(60));
        console.log(`Scenario: ${this.scenario.name}`);
        console.log('');

        // Calculate expected auto-values
        const expectedAutoCalcs = this.calculateExpectedAutoValues(this.scenario);
        
        console.log('📊 EXPECTED AUTO-CALCULATIONS:');
        console.log('─'.repeat(40));
        console.log(`Down Payment:        CHF ${expectedAutoCalcs.downPayment.toLocaleString()}`);
        console.log(`Maintenance Costs:   CHF ${expectedAutoCalcs.annualMaintenanceCosts.toLocaleString()}`);
        console.log(`Annual Amortization: CHF ${expectedAutoCalcs.annualAmortization.toLocaleString()}`);
        console.log(`Imputed Rental:      CHF ${expectedAutoCalcs.imputedRentalValue.toLocaleString()}`);
        console.log('');

        // Create full parameter set for backend calculation
        // Note: Adding defaults that match the frontend test
        const backendParams = this.convertParamsForCalculator({
            ...this.scenario,
            ...expectedAutoCalcs,
            totalRenovations: 0,
            additionalPurchaseCosts: 5000, // Frontend test hardcodes this
            propertyTaxDeductions: 13000,
            annualRentalCosts: 20000
        });

        console.log('🔧 BACKEND CALCULATION PARAMETERS:');
        console.log('─'.repeat(40));
        Object.entries(backendParams).forEach(([key, value]) => {
            if (typeof value === 'number') {
                if (key.includes('Rate') && value < 1) {
                    console.log(`${key.padEnd(25)}: ${(value * 100).toFixed(2)}%`);
                } else if (key.includes('CHF') || key.includes('Price') || key.includes('Payment') || key.includes('Cost') || key.includes('Value') || key.includes('Amortization')) {
                    console.log(`${key.padEnd(25)}: CHF ${value.toLocaleString()}`);
                } else {
                    console.log(`${key.padEnd(25)}: ${value}`);
                }
            } else {
                console.log(`${key.padEnd(25)}: ${value}`);
            }
        });
        console.log('');

        // Run backend calculation
        const backendResult = SwissRentBuyCalculator.calculate(backendParams);
        
        console.log('💻 BACKEND CALCULATION RESULTS:');
        console.log('─'.repeat(40));
        console.log(`Decision:             ${backendResult.Decision}`);
        console.log(`Result Value:         CHF ${Math.abs(backendResult.ResultValue).toLocaleString()}`);
        console.log(`Buy Total Cost:       CHF ${backendResult.TotalPurchaseCost.toLocaleString()}`);
        console.log(`Rent Total Cost:      CHF ${backendResult.TotalRentalCost.toLocaleString()}`);
        console.log('');

        // The reported UI value that was failing
        const reportedUIValue = 1332530;
        const backendValue = Math.abs(backendResult.ResultValue);
        const difference = Math.abs(reportedUIValue - backendValue);

        console.log('⚠️  REPORTED FRONTEND ISSUE:');
        console.log('─'.repeat(40));
        console.log(`UI Value (reported):  CHF ${reportedUIValue.toLocaleString()}`);
        console.log(`Backend Value:        CHF ${backendValue.toLocaleString()}`);
        console.log(`Difference:           CHF ${difference.toLocaleString()}`);
        console.log(`Percentage Diff:      ${((difference / backendValue) * 100).toFixed(2)}%`);
        console.log('');

        // Analysis
        console.log('🔍 POTENTIAL ISSUE ANALYSIS:');
        console.log('─'.repeat(40));
        
        if (difference > 1000) {
            console.log('❌ SIGNIFICANT DIFFERENCE DETECTED (>CHF 1K)');
            console.log('');
            
            console.log('🔍 POSSIBLE CAUSES:');
            console.log('1. Frontend using different auto-calculation formulas');
            console.log('2. Frontend not applying Swiss standard rates correctly');
            console.log('3. Parameter conversion issues (percentages vs decimals)');
            console.log('4. Frontend using cached or incorrect property tax deductions');
            console.log('5. Rounding differences in intermediate calculations');
            console.log('6. Frontend using different default values for optional parameters');
            console.log('');
            
            console.log('🔧 INVESTIGATION STEPS:');
            console.log('1. Check if frontend uses propertyTaxDeductions = 13000 (default)');
            console.log('2. Verify frontend auto-calculation formulas match backend');
            console.log('3. Check parameter conversion from percentages to decimals');
            console.log('4. Verify all optional parameters have correct defaults');
            console.log('');
            
            // Test with different property tax deductions
            console.log('🧪 TESTING DIFFERENT PROPERTY TAX DEDUCTIONS:');
            console.log('─'.repeat(50));
            
            const testDeductions = [0, 5000, 10000, 13000, 15000, 20000];
            
            testDeductions.forEach(deduction => {
                const testParams = { ...backendParams, propertyTaxDeductions: deduction };
                const testResult = SwissRentBuyCalculator.calculate(testParams);
                const testValue = Math.abs(testResult.ResultValue);
                const testDiff = Math.abs(reportedUIValue - testValue);
                
                console.log(`Deduction: CHF ${deduction.toLocaleString().padEnd(8)} → Result: CHF ${testValue.toLocaleString().padEnd(12)} → Diff: CHF ${testDiff.toLocaleString().padEnd(12)} ${testDiff < 100 ? '✅' : testDiff < 1000 ? '⚠️' : '❌'}`);
            });
            
            console.log('');
            console.log('🔍 TESTING WITH DEFAULT PARAMETERS FROM MANUAL TEST CASES:');
            console.log('─'.repeat(50));
            
            // Test with manual test case defaults
            const manualTestDefaults = {
                ...backendParams,
                propertyTaxDeductions: 13000,
                totalRenovations: 0,
                additionalPurchaseCosts: 0,
                annualRentalCosts: 20000
            };
            
            const manualTestResult = SwissRentBuyCalculator.calculate(manualTestDefaults);
            const manualTestValue = Math.abs(manualTestResult.ResultValue);
            const manualTestDiff = Math.abs(reportedUIValue - manualTestValue);
            
            console.log(`Manual test defaults → Result: CHF ${manualTestValue.toLocaleString()} → Diff: CHF ${manualTestDiff.toLocaleString()} ${manualTestDiff < 100 ? '✅' : manualTestDiff < 1000 ? '⚠️' : '❌'}`);
            
            // Test with potentially missing parameters
            console.log('');
            console.log('🔍 TESTING MISSING PARAMETER SCENARIOS:');
            console.log('─'.repeat(50));
            
            const missingParamTests = [
                { name: 'Missing totalRenovations', params: { ...backendParams, totalRenovations: undefined } },
                { name: 'Missing additionalPurchaseCosts', params: { ...backendParams, additionalPurchaseCosts: undefined } },
                { name: 'Missing annualRentalCosts', params: { ...backendParams, annualRentalCosts: undefined } },
                { name: 'Missing propertyTaxDeductions', params: { ...backendParams, propertyTaxDeductions: undefined } }
            ];
            
            missingParamTests.forEach(test => {
                try {
                    const testResult = SwissRentBuyCalculator.calculate(test.params);
                    const testValue = Math.abs(testResult.ResultValue);
                    const testDiff = Math.abs(reportedUIValue - testValue);
                    
                    console.log(`${test.name.padEnd(30)} → Result: CHF ${testValue.toLocaleString().padEnd(12)} → Diff: CHF ${testDiff.toLocaleString().padEnd(12)} ${testDiff < 100 ? '✅' : testDiff < 1000 ? '⚠️' : '❌'}`);
                } catch (error) {
                    console.log(`${test.name.padEnd(30)} → ERROR: ${error.message}`);
                }
            });
            
        } else {
            console.log('✅ DIFFERENCE IS WITHIN ACCEPTABLE RANGE');
            console.log('This may be a test configuration issue rather than a real problem');
        }

        return {
            scenario: this.scenario,
            expectedAutoCalcs,
            backendResult,
            reportedUIValue,
            difference,
            backendParams
        };
    }
}

// Run the debug analysis
if (require.main === module) {
    const analyzer = new FrontendScenario2Debugger();
    analyzer.debugScenario();
}

module.exports = { FrontendScenario2Debugger };