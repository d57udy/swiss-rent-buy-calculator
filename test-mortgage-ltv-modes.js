const SwissRentBuyCalculator = require('./calculator.js');

function runTests() {
  console.log('🔎 Testing mortgage LTV modes (frontend-calculated params simulated)');

  const purchasePrice = 2_000_000;
  const base = {
    purchasePrice,
    downPayment: 0,
    mortgageRate: 0.01,
    annualMaintenanceCosts: 25000,
    amortizationYears: 10,
    annualAmortization: 32000,
    totalRenovations: 0,
    additionalPurchaseCosts: 0,
    imputedRentalValue: 42900,
    propertyTaxDeductions: 13000,
    marginalTaxRate: 0.25,
    propertyAppreciationRate: 0.01,
    monthlyRent: 5500,
    annualRentalCosts: 2000,
    investmentYieldRate: 0.03,
    termYears: 10,
    scenarioMode: 'equalConsumption'
  };

  // AUTO: 80% mortgage, 20% down payment
  const autoDownPayment = Math.round(purchasePrice * 0.2);
  const autoParams = { ...base, downPayment: autoDownPayment };
  const autoRes = SwissRentBuyCalculator.calculate(autoParams);
  if (Math.round(autoRes.MortgageAmount) !== Math.round(purchasePrice - autoDownPayment)) {
    throw new Error('AUTO LTV mode mismatch');
  }

  // MORTGAGE 80%: cap at 80% or specified limit
  const limit80 = 1_300_000; // below 80% cap (which is 1.6M)
  const mort80Down = purchasePrice - limit80; // expect this when frontend chooses mode
  const mort80Params = { ...base, downPayment: mort80Down };
  const mort80Res = SwissRentBuyCalculator.calculate(mort80Params);
  if (Math.round(mort80Res.MortgageAmount) !== limit80) {
    throw new Error('80% capped mortgage mode mismatch');
  }

  // MORTGAGE 66.6%: cap at 2/3 or specified limit
  const ltv66Cap = Math.round(purchasePrice * (2/3));
  const limit66 = ltv66Cap - 50_000; // below cap
  const mort66Down = purchasePrice - limit66;
  const mort66Params = { ...base, downPayment: mort66Down };
  const mort66Res = SwissRentBuyCalculator.calculate(mort66Params);
  if (Math.round(mort66Res.MortgageAmount) !== limit66) {
    throw new Error('66.6% capped mortgage mode mismatch');
  }

  console.log('✅ Mortgage LTV modes tests passed');
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };


