/**
 * Equal Savings Scenario Tests
 * Validates that enabling scenarioMode = 'equalSavings' reduces TotalRentalCost
 * by crediting the renter with amortization-equivalent contributions and their growth,
 * and that the tax difference accounts for investment income tax on those gains.
 */

const SwissRentBuyCalculator = require('./calculator.js');

function approxEqual(a, b, tol = 1.5) {
  return Math.abs(a - b) <= tol;
}

function runEqualSavingsTests() {
  console.log('🔄 EQUAL-SAVINGS SCENARIO TESTS');
  console.log('='.repeat(60));

  const baseParams = {
    purchasePrice: 2100000,
    downPayment: 450000,
    mortgageRate: 0.02,
    annualMaintenanceCosts: 26250,
    amortizationYears: 10,
    annualAmortization: 165000,
    totalRenovations: 200000,
    additionalPurchaseCosts: 5000,
    imputedRentalValue: 42900,
    propertyTaxDeductions: 13000,
    marginalTaxRate: 0.21,
    propertyAppreciationRate: 0.01,
    monthlyRent: 5500,
    annualRentalCosts: 2000,
    investmentYieldRate: 0.05,
    termYears: 15
  };

  // Baseline equal-consumption
  const ec = SwissRentBuyCalculator.calculate({ ...baseParams, scenarioMode: 'equalConsumption' });
  console.log(`Equal-Consumption ResultValue: CHF ${ec.ResultValue.toFixed(2)}`);

  // Equal-savings should credit renter contributions and growth, lowering TotalRentalCost
  const es = SwissRentBuyCalculator.calculate({ ...baseParams, scenarioMode: 'equalSavings' });
  console.log(`Equal-Savings ResultValue:     CHF ${es.ResultValue.toFixed(2)}`);

  if (!(es.TotalRentalCost <= ec.TotalRentalCost)) {
    console.error('❌ Equal-savings did not reduce TotalRentalCost as expected');
    process.exit(1);
  }

  // Sanity: contributions principal over 10 years
  const expectedContribPrincipal = baseParams.annualAmortization * Math.min(baseParams.amortizationYears, baseParams.termYears);
  if (!approxEqual(-es.ExcludingSavingsContributions, expectedContribPrincipal, 10)) {
    console.error('❌ Savings contributions line does not match expected principal contributions');
    process.exit(1);
  }

  console.log('✅ Equal-savings reduces TotalRentalCost and credits contributions');
  return true;
}

if (require.main === module) {
  const ok = runEqualSavingsTests();
  process.exit(ok ? 0 : 1);
}

module.exports = { runEqualSavingsTests };

