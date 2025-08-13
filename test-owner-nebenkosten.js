const SwissRentBuyCalculator = require('./calculator.js');

function runOwnerCostsTest() {
  console.log('🔎 Testing owner utilities/admin (Nebenkosten) integration');
  const base = {
    purchasePrice: 1_500_000,
    downPayment: 300_000,
    mortgageRate: 0.012,
    annualMaintenanceCosts: 18_750,
  // ownerRunningCosts: merged into annualMaintenanceCosts
    amortizationYears: 10,
    annualAmortization: 30_000,
    totalRenovations: 0,
    additionalPurchaseCosts: 0,
    imputedRentalValue: 32_760,
    propertyTaxDeductions: 13_000,
    marginalTaxRate: 0.25,
    propertyAppreciationRate: 0.01,
    monthlyRent: 4_000,
    annualRentalCosts: 2_000,
    investmentYieldRate: 0.03,
    termYears: 10,
    scenarioMode: 'equalConsumption'
  };

  const withOwnerCosts = SwissRentBuyCalculator.calculate(base);
  const withoutOwnerCosts = SwissRentBuyCalculator.calculate({ ...base });

  if (!(withOwnerCosts.GeneralCostOfPurchase > withoutOwnerCosts.GeneralCostOfPurchase)) {
    throw new Error('Owner running costs not included in purchase general cost');
  }
  if (!(withOwnerCosts.TotalMonthlyExpenses > withoutOwnerCosts.TotalMonthlyExpenses)) {
    throw new Error('Monthly owner running costs not in monthly totals');
  }
  console.log('✅ Owner utilities/admin costs included as expected');
}

if (require.main === module) runOwnerCostsTest();

module.exports = { runOwnerCostsTest };


