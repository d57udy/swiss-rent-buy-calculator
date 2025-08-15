/**
 * Debug Post-Reform Issues
 */

const SwissRentBuyCalculator = require('./calculator.js');

// Test parameter sweep
console.log('=== Debug Parameter Sweep ===');

const baseParams = {
    purchasePrice: 1000000,
    downPayment: 200000,
    mortgageRate: 0.015,
    annualMaintenanceCosts: 12500,
    amortizationYears: 10,
    annualAmortization: 16000,
    totalRenovations: 0,
    additionalPurchaseCosts: 20000,
    imputedRentalValue: 21000,
    propertyTaxDeductions: 10000,
    marginalTaxRate: 0.25,
    propertyAppreciationRate: 0.02,
    monthlyRent: 2700,
    annualRentalCosts: 5000,
    investmentYieldRate: 0.03,
    termYears: 10
};

// Test single calculation first
console.log('\nSingle calculation tests:');
const currentResult = SwissRentBuyCalculator.calculate({ ...baseParams, postReform: false });
const postReformResult = SwissRentBuyCalculator.calculate({ ...baseParams, postReform: true });

console.log(`Current: ${currentResult.Decision} CHF ${Math.round(currentResult.ResultValue).toLocaleString()} (PostReform: ${currentResult.PostReform})`);
console.log(`Post-Reform: ${postReformResult.Decision} CHF ${Math.round(postReformResult.ResultValue).toLocaleString()} (PostReform: ${postReformResult.PostReform})`);

// Test parameter sweep with simple range
const sweepRanges = {
    postReform: { min: 0, max: 1, step: 1 }  // Just test postReform parameter
};

console.log('\nParameter sweep test:');
const sweepResults = SwissRentBuyCalculator.parameterSweep(baseParams, sweepRanges);
console.log(`Generated ${sweepResults.length} results`);

sweepResults.forEach((result, index) => {
    console.log(`  Result ${index + 1}: postReform=${result.postReform}, PostReform=${result.PostReform}, Decision=${result.Decision}`);
});

// Test max bid finder with simple parameters
console.log('\nMax bid finder test:');
try {
    const maxBidResult = SwissRentBuyCalculator.findBreakevenPrice(
        { ...baseParams, postReform: true },
        { minPrice: 800000, maxPrice: 1200000, tolerance: 5000 }
    );
    
    console.log('Max bid result:', maxBidResult);
} catch (error) {
    console.log('Max bid error:', error.message);
}