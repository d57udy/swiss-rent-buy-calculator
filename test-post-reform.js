/**
 * Test Post-Reform Eigenmietwert Calculation
 * 
 * Tests that the post-reform tax system correctly:
 * 1. Disables imputed rental value taxation
 * 2. Disables mortgage interest deductions  
 * 3. Disables maintenance/property expense deductions
 * 4. Works across all comparison modes (equal consumption, cash-flow parity, equal savings)
 */

// Use the new calculator (same as UI) to ensure consistency
const { calculateNew } = require('./new-calculator-prototype.js');
const SwissRentBuyCalculator = { calculate: calculateNew };

function runPostReformTests() {
    console.log('=== Post-Reform Eigenmietwert Tests ===\n');
    
    // Base parameters for testing
    const baseParams = {
        purchasePrice: 1000000,
        downPayment: 200000,
        mortgageRate: 0.015,  // 1.5%
        annualMaintenanceCosts: 10000,
        amortizationYears: 10,
        annualAmortization: 16000,
        totalRenovations: 0,
        additionalPurchaseCosts: 20000,
        imputedRentalValue: 21000,  // 65% of 32K annual rent
        propertyTaxDeductions: 10000,
        marginalTaxRate: 0.25,  // 25%
        propertyAppreciationRate: 0.02,
        monthlyRent: 2700,
        annualRentalCosts: 5000,
        investmentYieldRate: 0.03,
        termYears: 10
    };
    
    let testsPassed = 0;
    let totalTests = 0;
    
    // Test 1: Current vs Post-Reform - Equal Consumption Mode
    totalTests++;
    console.log('Test 1: Current vs Post-Reform - Equal Consumption Mode');
    
    const currentSystem = SwissRentBuyCalculator.calculate({
        ...baseParams,
        scenarioMode: 'equalConsumption',
        postReform: false
    });
    
    const postReformSystem = SwissRentBuyCalculator.calculate({
        ...baseParams,
        scenarioMode: 'equalConsumption', 
        postReform: true
    });
    
    console.log(`  Current System - Decision: ${currentSystem.Decision}, Result: CHF ${Math.round(currentSystem.ResultValue).toLocaleString()}`);
    console.log(`  Post-Reform    - Decision: ${postReformSystem.Decision}, Result: CHF ${Math.round(postReformSystem.ResultValue).toLocaleString()}`);
    
    // Post-reform should be more favorable to buying (less negative or more positive result value)
    if (postReformSystem.ResultValue > currentSystem.ResultValue) {
        console.log('  ✅ PASS: Post-reform is more favorable to buying');
        testsPassed++;
    } else {
        console.log('  ❌ FAIL: Post-reform should be more favorable to buying');
    }
    
    // Test 2: Tax calculations verification
    totalTests++;
    console.log('\nTest 2: Tax Calculation Components');
    
    const currentYearlyData = currentSystem.YearlyBreakdown[0];
    const postReformYearlyData = postReformSystem.YearlyBreakdown[0];
    
    console.log(`  Current System - Tax Components:`);
    console.log(`    Imputed Rent Tax: CHF ${Math.round(currentYearlyData.taxImputedRent).toLocaleString()}`);
    console.log(`    Interest Savings: CHF ${Math.round(currentYearlyData.taxSavingsInterest).toLocaleString()}`);
    console.log(`    Property Savings: CHF ${Math.round(currentYearlyData.taxSavingsPropertyExpenses).toLocaleString()}`);
    
    console.log(`  Post-Reform System - Tax Components:`);
    console.log(`    Imputed Rent Tax: CHF ${Math.round(postReformYearlyData.taxImputedRent).toLocaleString()}`);
    console.log(`    Interest Savings: CHF ${Math.round(postReformYearlyData.taxSavingsInterest).toLocaleString()}`);
    console.log(`    Property Savings: CHF ${Math.round(postReformYearlyData.taxSavingsPropertyExpenses).toLocaleString()}`);
    
    if (postReformYearlyData.taxImputedRent === 0 && 
        postReformYearlyData.taxSavingsInterest === 0 &&
        postReformYearlyData.taxSavingsPropertyExpenses === 0) {
        console.log('  ✅ PASS: Post-reform correctly zeros all tax components');
        testsPassed++;
    } else {
        console.log('  ❌ FAIL: Post-reform should zero all tax components');
    }
    
    // Test 3: Cash-Flow Parity Mode
    totalTests++;
    console.log('\nTest 3: Post-Reform with Cash-Flow Parity Mode');
    
    const cashflowCurrent = SwissRentBuyCalculator.calculate({
        ...baseParams,
        scenarioMode: 'cashflowParity',
        postReform: false
    });
    
    const cashflowPostReform = SwissRentBuyCalculator.calculate({
        ...baseParams,
        scenarioMode: 'cashflowParity',
        postReform: true
    });
    
    console.log(`  Current System - Result: CHF ${Math.round(cashflowCurrent.ResultValue).toLocaleString()}`);
    console.log(`  Post-Reform    - Result: CHF ${Math.round(cashflowPostReform.ResultValue).toLocaleString()}`);
    
    if (cashflowPostReform.ResultValue > cashflowCurrent.ResultValue) {
        console.log('  ✅ PASS: Post-reform is more favorable in cash-flow parity mode');
        testsPassed++;
    } else {
        console.log('  ❌ FAIL: Post-reform should be more favorable in cash-flow parity mode');
    }
    
    // Test 4: Equal Savings Mode
    totalTests++;
    console.log('\nTest 4: Post-Reform with Equal Savings Mode');
    
    const equalSavingsCurrent = SwissRentBuyCalculator.calculate({
        ...baseParams,
        scenarioMode: 'equalSavings',
        postReform: false
    });
    
    const equalSavingsPostReform = SwissRentBuyCalculator.calculate({
        ...baseParams,
        scenarioMode: 'equalSavings',
        postReform: true
    });
    
    console.log(`  Current System - Result: CHF ${Math.round(equalSavingsCurrent.ResultValue).toLocaleString()}`);
    console.log(`  Post-Reform    - Result: CHF ${Math.round(equalSavingsPostReform.ResultValue).toLocaleString()}`);
    
    if (equalSavingsPostReform.ResultValue > equalSavingsCurrent.ResultValue) {
        console.log('  ✅ PASS: Post-reform is more favorable in equal savings mode');
        testsPassed++;
    } else {
        console.log('  ❌ FAIL: Post-reform should be more favorable in equal savings mode');
    }
    
    // Test 5: Verify PostReform flag is correctly set
    totalTests++;
    console.log('\nTest 5: PostReform Flag Verification');
    
    if (currentSystem.PostReform === false && postReformSystem.PostReform === true) {
        console.log('  ✅ PASS: PostReform flag correctly set in return values');
        testsPassed++;
    } else {
        console.log('  ❌ FAIL: PostReform flag not correctly set');
        console.log(`    Current system PostReform: ${currentSystem.PostReform}`);
        console.log(`    Post-reform system PostReform: ${postReformSystem.PostReform}`);
    }
    
    // Summary
    console.log(`\n=== Test Results ===`);
    console.log(`${testsPassed}/${totalTests} tests passed`);
    
    if (testsPassed === totalTests) {
        console.log('🎉 All post-reform tests passed!');
        return true;
    } else {
        console.log('⚠️  Some post-reform tests failed.');
        return false;
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    runPostReformTests();
}

module.exports = { runPostReformTests };