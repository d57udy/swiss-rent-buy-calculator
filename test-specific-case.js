/**
 * Test specific user case to debug why post-reform isn't showing differences
 */

// Use the unified calculator for consistency
const SwissRentBuyCalculator = require('./calculator.js');

// Test with typical Swiss property parameters
const testParams = {
    purchasePrice: 1500000,        // CHF 1.5M
    downPayment: 300000,          // 20% down payment  
    mortgageRate: 0.015,          // 1.5% current rate
    annualMaintenanceCosts: 18750, // 1.25% of property value
    amortizationYears: 15,        // 15 year amortization
    annualAmortization: 20000,    // Calculated amortization
    totalRenovations: 0,
    additionalPurchaseCosts: 30000, // 2% transaction costs
    imputedRentalValue: 39000,    // 65% of annual rent (60k annual)
    propertyTaxDeductions: 15000, // Standard deductions
    marginalTaxRate: 0.28,        // 28% marginal rate (typical in Swiss cantons)
    propertyAppreciationRate: 0.015, // 1.5% appreciation
    monthlyRent: 5000,            // CHF 5K comparable rent
    annualRentalCosts: 12000,     // CHF 1K/month supplemental
    investmentYieldRate: 0.025,   // 2.5% investment yield
    termYears: 15,
    scenarioMode: 'equalConsumption'
};

console.log('=== SPECIFIC CASE DEBUG ===');
console.log('Testing with typical Swiss property parameters...\n');

// Current system
const currentSystem = SwissRentBuyCalculator.calculate({ ...testParams, postReform: false });
console.log('CURRENT SYSTEM (2025-2027):');
console.log('  Decision:', currentSystem.Decision);
console.log('  Result Value: CHF', Math.round(currentSystem.ResultValue).toLocaleString());
console.log('  PostReform flag:', currentSystem.PostReform);

// Post-reform system  
const postReformSystem = SwissRentBuyCalculator.calculate({ ...testParams, postReform: true });
console.log('\nPOST-REFORM SYSTEM (2027+):');
console.log('  Decision:', postReformSystem.Decision);
console.log('  Result Value: CHF', Math.round(postReformSystem.ResultValue).toLocaleString());
console.log('  PostReform flag:', postReformSystem.PostReform);

// Difference
const difference = postReformSystem.ResultValue - currentSystem.ResultValue;
console.log('\nDIFFERENCE:');
console.log('  Post-Reform - Current: CHF', Math.round(difference).toLocaleString());
console.log('  Percentage change:', ((difference / Math.abs(currentSystem.ResultValue)) * 100).toFixed(2), '%');

// Year 1 detailed breakdown
console.log('\nYEAR 1 TAX COMPONENTS:');
const currentYear1 = currentSystem.YearlyBreakdown[0];
const postReformYear1 = postReformSystem.YearlyBreakdown[0];

console.log('  Current System:');
console.log('    Imputed Rental Tax:    CHF', Math.round(currentYear1.taxImputedRent).toLocaleString());
console.log('    Interest Tax Savings:  CHF', Math.round(currentYear1.taxSavingsInterest).toLocaleString());
console.log('    Property Tax Savings:  CHF', Math.round(currentYear1.taxSavingsPropertyExpenses).toLocaleString());
console.log('    Net Tax Difference:    CHF', Math.round(currentYear1.annualTaxDifference).toLocaleString());

console.log('  Post-Reform System:');
console.log('    Imputed Rental Tax:    CHF', Math.round(postReformYear1.taxImputedRent).toLocaleString());
console.log('    Interest Tax Savings:  CHF', Math.round(postReformYear1.taxSavingsInterest).toLocaleString());
console.log('    Property Tax Savings:  CHF', Math.round(postReformYear1.taxSavingsPropertyExpenses).toLocaleString());
console.log('    Net Tax Difference:    CHF', Math.round(postReformYear1.annualTaxDifference).toLocaleString());

// Total tax difference over term
console.log('\nTOTAL TAX IMPACT:');
console.log('  Current system tax difference: CHF', Math.round(currentSystem.TaxDifferenceToRental).toLocaleString());
console.log('  Post-reform tax difference:    CHF', Math.round(postReformSystem.TaxDifferenceToRental).toLocaleString());

// Break-even analysis
console.log('\nBREAK-EVEN ANALYSIS:');
console.log('  If no difference is showing in UI, possible causes:');
console.log('  1. UI not properly reading taxSystem radio button');
console.log('  2. Calculation caching issue');
console.log('  3. Parameters with zero tax impact (e.g., zero tax rate)');
console.log('  4. Display rounding hiding small differences');

// Test with zero marginal tax rate (edge case)
console.log('\nEDGE CASE - ZERO TAX RATE:');
const zeroTaxCurrent = SwissRentBuyCalculator.calculate({ ...testParams, marginalTaxRate: 0, postReform: false });
const zeroTaxPostReform = SwissRentBuyCalculator.calculate({ ...testParams, marginalTaxRate: 0, postReform: true });
console.log('  Zero tax - Current:    CHF', Math.round(zeroTaxCurrent.ResultValue).toLocaleString());
console.log('  Zero tax - Post-Reform: CHF', Math.round(zeroTaxPostReform.ResultValue).toLocaleString());
console.log('  Difference with zero tax:', Math.round(zeroTaxPostReform.ResultValue - zeroTaxCurrent.ResultValue).toLocaleString());
console.log('  (Should be 0 - no tax means no difference)');

console.log('\n=== END DEBUG ===');