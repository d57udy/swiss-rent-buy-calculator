/**
 * Test a provided Moneyland.ch case against our equal-consumption model
 */

const SwissRentBuyCalculator = require('./calculator.js');

function round2(n) { return Math.round(n * 100) / 100; }

function runProvidedMoneylandCase() {
  const cases = [
    {
      name: 'Case A: 1.5% rate, 200k reno, 5% yield',
      params: {
        purchasePrice: 2100000,
        downPayment: 777000,
        mortgageRate: 0.015,
        annualMaintenanceCosts: 21000,
        amortizationYears: 15,
        annualAmortization: 0,
        totalRenovations: 200000,
        additionalPurchaseCosts: 5000,
        imputedRentalValue: 68250,
        propertyTaxDeductions: 13650,
        marginalTaxRate: 0.21,
        propertyAppreciationRate: 0.015,
        monthlyRent: 5000,
        annualRentalCosts: 6000,
        investmentYieldRate: 0.05,
        termYears: 15,
        scenarioMode: 'equalConsumption'
      },
      expectedML: {
        Decision: 'RENT',
        ResultValue: -78206.15,
        Purchase: {
          InterestCosts: 297675.00,
          SupplementalMaintenanceCosts: 315000.00,
          AmortizationCosts: 0.00,
          RenovationExpenses: 200000.00,
          AdditionalPurchaseExpensesOutput: 5000.00,
          GeneralCostOfPurchase: 817675.00,
          TaxDifferenceToRental: -67703.35,
          MinusPropertyValue: -2625487.35,
          MortgageAtEndOfRelevantTimePeriod: 1323000.00,
          TotalPurchaseCost: -552515.70
        },
        Rent: {
          GeneralCostOfRental: 990000.00,
          ExcludingYieldsOnAssets: -843721.85,
          ExcludingDownPayment: -777000.00,
          TotalRentalCost: -630721.85
        }
      }
    },
    {
      name: 'Case B: 2.0% rate, 300k reno, 3.5% yield',
      params: {
        purchasePrice: 2100000,
        downPayment: 777000,
        mortgageRate: 0.02,
        annualMaintenanceCosts: 21000,
        amortizationYears: 15,
        annualAmortization: 0,
        totalRenovations: 300000,
        additionalPurchaseCosts: 5000,
        imputedRentalValue: 68250,
        propertyTaxDeductions: 13650,
        marginalTaxRate: 0.21,
        propertyAppreciationRate: 0.015,
        monthlyRent: 5000,
        annualRentalCosts: 6000,
        investmentYieldRate: 0.035,
        termYears: 15,
        scenarioMode: 'equalConsumption'
      },
      expectedML: {
        Decision: 'RENT',
        ResultValue: -7270.70,
        Purchase: {
          InterestCosts: 396900.00,
          SupplementalMaintenanceCosts: 315000.00,
          AmortizationCosts: 0.00,
          RenovationExpenses: 300000.00,
          AdditionalPurchaseExpensesOutput: 5000.00,
          GeneralCostOfPurchase: 1016900.00,
          TaxDifferenceToRental: -22264.80,
          MinusPropertyValue: -2625487.35,
          MortgageAtEndOfRelevantTimePeriod: 1323000.00,
          TotalPurchaseCost: -307852.10
        },
        Rent: {
          GeneralCostOfRental: 990000.00,
          ExcludingYieldsOnAssets: -528122.80,
          ExcludingDownPayment: -777000.00,
          TotalRentalCost: -315122.80
        }
      }
    }
  ];

  const outputs = [];
  for (const c of cases) {
    const ours = SwissRentBuyCalculator.calculate(c.params);
    const expectedML = c.expectedML;
    const out = {
      name: c.name,
      ours: {
        Decision: ours.Decision,
        ResultValue: round2(ours.ResultValue),
        TotalPurchaseCost: round2(ours.TotalPurchaseCost),
        TotalRentalCost: round2(ours.TotalRentalCost)
      },
      moneyland: {
        Decision: expectedML.Decision,
        ResultValue: expectedML.ResultValue,
        TotalPurchaseCost: expectedML.Purchase.TotalPurchaseCost,
        TotalRentalCost: expectedML.Rent.TotalRentalCost
      },
      deltas: {
        ResultValue: round2(ours.ResultValue - expectedML.ResultValue),
        TotalPurchaseCost: round2(ours.TotalPurchaseCost - expectedML.Purchase.TotalPurchaseCost),
        TotalRentalCost: round2(ours.TotalRentalCost - expectedML.Rent.TotalRentalCost)
      }
    };
    outputs.push(out);
  }

  console.log('🏷️ Provided Moneyland cases vs Our EC model');
  console.log(JSON.stringify(outputs, null, 2));
  return { outputs, passed: true };
}

if (require.main === module) {
  runProvidedMoneylandCase();
}

module.exports = { runProvidedMoneylandCase };


