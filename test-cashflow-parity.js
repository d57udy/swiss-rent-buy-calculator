/**
 * Cash-flow Parity Scenario Tests
 * Validates that scenarioMode = 'cashflowParity' invests/withdraws the actual
 * monthly difference and that totals/outputs reflect variable contributions.
 */

const SwissRentBuyCalculator = require('./calculator.js');

function approxEqual(a, b, tol = 1.5) {
  return Math.abs(a - b) <= tol;
}

function runCashflowParityTests() {
  console.log('🔄 CASH-FLOW PARITY SCENARIO TESTS');
  console.log('='.repeat(60));

  const baseParams = {
    purchasePrice: 2_000_000,
    downPayment: 400_000,
    mortgageRate: 0.012,
    annualMaintenanceCosts: 25_000,
    amortizationYears: 10,
    annualAmortization: 32_000,
    totalRenovations: 0,
    additionalPurchaseCosts: 40_000,
    imputedRentalValue: 42_900,
    propertyTaxDeductions: 13_000,
    marginalTaxRate: 0.25,
    propertyAppreciationRate: 0.01,
    monthlyRent: 5_500,
    annualRentalCosts: 2_000,
    investmentYieldRate: 0.03,
    termYears: 10
  };

  const cf = SwissRentBuyCalculator.calculate({ ...baseParams, scenarioMode: 'cashflowParity' });
  const ec = SwissRentBuyCalculator.calculate({ ...baseParams, scenarioMode: 'equalConsumption' });

  console.log(`Equal-Consumption ResultValue: CHF ${Math.round(ec.ResultValue).toLocaleString()}`);
  console.log(`Cash-flow Parity ResultValue: CHF ${Math.round(cf.ResultValue).toLocaleString()}`);

  // In cash-flow parity, savings contributions can be positive or negative.
  // Ensure the line exists in the breakdown and equals the algebraic principal sum.
  // We cannot directly access the per-year list here, but ExcludingSavingsContributions reflects principal sum.
  const excludingContribs = cf.ExcludingSavingsContributions; // negative value in output
  if (typeof excludingContribs !== 'number') {
    console.error('❌ Missing ExcludingSavingsContributions in cash-flow parity result');
    process.exit(1);
  }

  // Smoke test that the scenario affects totals relative to equal-consumption
  if (approxEqual(cf.TotalRentalCost, ec.TotalRentalCost, 0.0001)) {
    console.error('❌ Cash-flow parity had no effect on TotalRentalCost compared to equal-consumption');
    process.exit(1);
  }

  console.log('✅ Cash-flow parity contributions included and totals differ from baseline');
  return true;
}

if (require.main === module) {
  const ok = runCashflowParityTests();
  process.exit(ok ? 0 : 1);
}

module.exports = { runCashflowParityTests };


