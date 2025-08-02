/**
 * Debug Remaining Issue with Scenario 2
 * Investigation of why scenario 2 still has a large difference after the fix
 */

const SwissRentBuyCalculator = require('./calculator.js');

class Scenario2Debugger {
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
            amortizationYears: 18,
            totalRenovations: 0,
            additionalPurchaseCosts: 0,
            propertyTaxDeductions: 13000,
            annualRentalCosts: 20000
        };
    }

    calculateAutoValues(params) {
        return {
            downPayment: Math.round(params.purchasePrice * 0.2),
            annualMaintenanceCosts: Math.round(params.purchasePrice * 0.0125),
            annualAmortization: Math.round((params.purchasePrice * 0.8) / params.amortizationYears),
            imputedRentalValue: Math.round(params.monthlyRent * 12 * 0.65)
        };
    }

    debugRemainingIssue() {
        console.log('🔍 DEBUGGING SCENARIO 2 REMAINING ISSUE');
        console.log('='.repeat(60));
        
        const autoCalcs = this.calculateAutoValues(this.scenario);
        
        console.log('📊 SCENARIO 2 PARAMETERS:');
        console.log('─'.repeat(40));
        Object.entries(this.scenario).forEach(([key, value]) => {
            if (typeof value === 'number') {
                if (key.includes('Rate') && key !== 'marginalTaxRate') {
                    console.log(`${key.padEnd(25)}: ${value}%`);
                } else if (key.includes('Price') || key.includes('Cost') || key.includes('Payment') || key.includes('Rent') || key.includes('Renovations') || key.includes('Deductions')) {
                    console.log(`${key.padEnd(25)}: CHF ${value.toLocaleString()}`);
                } else {
                    console.log(`${key.padEnd(25)}: ${value}`);
                }
            } else {
                console.log(`${key.padEnd(25)}: ${value}`);
            }
        });
        console.log('');

        console.log('🔧 AUTO-CALCULATED VALUES:');
        console.log('─'.repeat(40));
        Object.entries(autoCalcs).forEach(([key, value]) => {
            console.log(`${key.padEnd(25)}: CHF ${value.toLocaleString()}`);
        });
        console.log('');

        // Test the exact scenario with our current understanding
        const backendParams = {
            purchasePrice: this.scenario.purchasePrice,
            downPayment: autoCalcs.downPayment,
            mortgageRate: this.scenario.mortgageRate / 100,
            monthlyRent: this.scenario.monthlyRent,
            propertyAppreciationRate: this.scenario.propertyAppreciationRate / 100,
            investmentYieldRate: this.scenario.investmentYieldRate / 100,
            marginalTaxRate: this.scenario.marginalTaxRate / 100,
            termYears: this.scenario.termYears,
            annualMaintenanceCosts: autoCalcs.annualMaintenanceCosts,
            amortizationYears: this.scenario.amortizationYears,
            annualAmortization: autoCalcs.annualAmortization,
            totalRenovations: this.scenario.totalRenovations,
            additionalPurchaseCosts: this.scenario.additionalPurchaseCosts,
            imputedRentalValue: autoCalcs.imputedRentalValue,
            propertyTaxDeductions: this.scenario.propertyTaxDeductions,
            annualRentalCosts: this.scenario.annualRentalCosts
        };

        console.log('💻 BACKEND CALCULATION PARAMETERS:');
        console.log('─'.repeat(40));
        Object.entries(backendParams).forEach(([key, value]) => {
            if (typeof value === 'number') {
                if (key.includes('Rate') && value < 1) {
                    console.log(`${key.padEnd(25)}: ${(value * 100).toFixed(2)}%`);
                } else if (key.includes('Price') || key.includes('Cost') || key.includes('Payment') || key.includes('Rent') || key.includes('Value') || key.includes('Renovations') || key.includes('Amortization')) {
                    console.log(`${key.padEnd(25)}: CHF ${value.toLocaleString()}`);
                } else {
                    console.log(`${key.padEnd(25)}: ${value}`);
                }
            }
        });
        console.log('');

        const backendResult = SwissRentBuyCalculator.calculate(backendParams);
        const reportedFrontendValue = 1341579;
        const backendValue = Math.abs(backendResult.ResultValue);
        const difference = Math.abs(reportedFrontendValue - backendValue);

        console.log('⚖️  COMPARISON:');
        console.log('─'.repeat(40));
        console.log(`Frontend (reported):    CHF ${reportedFrontendValue.toLocaleString()}`);
        console.log(`Backend (calculated):   CHF ${backendValue.toLocaleString()}`);
        console.log(`Difference:             CHF ${difference.toLocaleString()}`);
        console.log(`Percentage:             ${((difference / backendValue) * 100).toFixed(2)}%`);
        console.log('');

        // Check if there are any fields the UI might be reading differently
        console.log('🔍 POTENTIAL UI FIELD MISMATCHES:');
        console.log('─'.repeat(40));
        
        // Check different scenarios for the fields that might be causing issues
        const testVariations = [
            {
                name: 'UI might use marginalTaxRate as decimal',
                params: { ...backendParams, marginalTaxRate: this.scenario.marginalTaxRate }
            },
            {
                name: 'UI might use different mortgage rate handling',
                params: { ...backendParams, mortgageRate: this.scenario.mortgageRate }
            },
            {
                name: 'UI might use different property appreciation handling',
                params: { ...backendParams, propertyAppreciationRate: this.scenario.propertyAppreciationRate }
            },
            {
                name: 'UI might use different investment yield handling',
                params: { ...backendParams, investmentYieldRate: this.scenario.investmentYieldRate }
            }
        ];

        testVariations.forEach(variation => {
            try {
                const testResult = SwissRentBuyCalculator.calculate(variation.params);
                const testValue = Math.abs(testResult.ResultValue);
                const testDiff = Math.abs(reportedFrontendValue - testValue);
                
                console.log(`${variation.name.padEnd(50)} → CHF ${testValue.toLocaleString().padEnd(12)} → Diff: CHF ${testDiff.toLocaleString().padEnd(8)} ${testDiff < 1000 ? '✅' : '❌'}`);
            } catch (error) {
                console.log(`${variation.name.padEnd(50)} → ERROR: ${error.message}`);
            }
        });

        console.log('');
        console.log('🎯 NEXT INVESTIGATION STEPS:');
        console.log('─'.repeat(40));
        console.log('1. Check if UI is using percentage values instead of decimals');
        console.log('2. Verify all form fields are actually being filled by the test');
        console.log('3. Check for JavaScript calculation differences in the frontend');
        console.log('4. Examine if there are hidden fields or default values being used');
        console.log('5. Compare the actual calculation breakdown from UI vs backend');

        return {
            scenario: this.scenario,
            autoCalcs,
            backendParams,
            backendResult,
            reportedFrontendValue,
            difference
        };
    }
}

if (require.main === module) {
    const analyzer = new Scenario2Debugger();
    analyzer.debugRemainingIssue();
}

module.exports = { Scenario2Debugger };