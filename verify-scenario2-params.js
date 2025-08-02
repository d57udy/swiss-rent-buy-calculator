/**
 * Verify Scenario 2 Parameters - Test exact parameters from debug output
 */

const SwissRentBuyCalculator = require('./calculator.js');

// Exact parameters from debug output
const debugParams = {
    purchasePrice: 2500000,
    downPayment: 500000,
    mortgageRate: 0.021,
    monthlyRent: 6800,
    propertyAppreciationRate: 0.015,
    investmentYieldRate: 0.04,
    marginalTaxRate: 0.32,
    termYears: 20,
    annualMaintenanceCosts: 31250,
    amortizationYears: 18,
    annualAmortization: 111111,
    totalRenovations: 0,
    additionalPurchaseCosts: 0,
    imputedRentalValue: 53040,
    propertyTaxDeductions: 13000,
    annualRentalCosts: 20000
};

console.log('🔍 VERIFYING SCENARIO 2 PARAMETERS');
console.log('='.repeat(50));
console.log('Testing exact parameters from debug output...');
console.log('');

console.log('📊 PARAMETERS:');
Object.entries(debugParams).forEach(([key, value]) => {
    if (typeof value === 'number') {
        if (key.includes('Rate') && value < 1) {
            console.log(`  ${key.padEnd(25)}: ${(value * 100).toFixed(2)}%`);
        } else if (key.includes('Price') || key.includes('Cost') || key.includes('Payment') || key.includes('Rent') || key.includes('Value') || key.includes('Amortization') || key.includes('Renovations')) {
            console.log(`  ${key.padEnd(25)}: CHF ${value.toLocaleString()}`);
        } else {
            console.log(`  ${key.padEnd(25)}: ${value}`);
        }
    }
});
console.log('');

const result = SwissRentBuyCalculator.calculate(debugParams);

console.log('💻 CALCULATION RESULT:');
console.log('─'.repeat(30));
console.log(`Decision:           ${result.Decision}`);
console.log(`Result Value:       CHF ${Math.abs(result.ResultValue).toLocaleString()}`);
console.log(`Buy Total Cost:     CHF ${result.TotalPurchaseCost.toLocaleString()}`);
console.log(`Rent Total Cost:    CHF ${result.TotalRentalCost.toLocaleString()}`);
console.log('');

console.log('🎯 COMPARISON:');
console.log('─'.repeat(30));
console.log(`Expected (from test): CHF 1,119,359.376`);
console.log(`Actual (calculated):  CHF ${Math.abs(result.ResultValue).toLocaleString()}`);
console.log(`Frontend UI shows:    CHF 1,341,579`);
console.log('');

const testExpected = 1119359.376;
const actualCalculated = Math.abs(result.ResultValue);
const frontendShown = 1341579;

console.log('📊 ANALYSIS:');
console.log('─'.repeat(30));
console.log(`Test vs Actual:       CHF ${Math.abs(testExpected - actualCalculated).toLocaleString()}`);
console.log(`Frontend vs Actual:   CHF ${Math.abs(frontendShown - actualCalculated).toLocaleString()}`);
console.log(`Test vs Frontend:     CHF ${Math.abs(testExpected - frontendShown).toLocaleString()}`);
console.log('');

if (Math.abs(frontendShown - actualCalculated) < 1) {
    console.log('✅ FRONTEND AND BACKEND ARE ALIGNED!');
    console.log('❌ The test is using wrong expected value or wrong backend calculation');
} else if (Math.abs(testExpected - actualCalculated) < 1) {
    console.log('✅ TEST BACKEND IS CORRECT!');
    console.log('❌ Frontend is showing wrong value');
} else {
    console.log('❌ SOMETHING IS WRONG - neither frontend nor test backend match our calculation');
}